#!/usr/bin/env python3
"""
build-shophouse-fabric.py
-------------------------
Turn the 2,433 screened shophouse footprints into a block placement plan.

WHY THIS EXISTS. The historic-core world currently extrudes OSM footprints as
boxes. A shophouse is not a box: it is a 4 m bay, a party wall, a firewall
every five bays, a row that must break at ten units / 40 m. Those are not
design preferences. They are Ministerial Regulation No. 55 B.E. 2543 ข้อ 2,
ข้อ 4 and ข้อ 17, which is also the rhythm you can read from the pavement.

This script takes the same screened footprints the essay's atlas already
publishes, projects them into the same block frame the moat and the hero
monuments use, and writes a plan the applier can loop over. It does not
touch a world.

WHAT IT IS NOT. The 4 m module and the firewall every five bays are the
legal rhythm applied to screened footprints. They are not a survey of the
actual party walls, which this data does not contain. Storeys come from
Overture where present and default to 2 — the modal known value in this
world — where not, graded so the two are never the same kind of fact.
Over-cap rows are tagged, not broken: the plan shows what stands, including
the illegal length.

Hero monument columns are punched out. The Grand Palace bounding box
contains buildings that are not the Grand Palace; only the columns the
monuments occupy are withheld.

Usage:
    python3 scripts/build-shophouse-fabric.py
    python3 scripts/build-shophouse-fabric.py --summary-only
    python3 scripts/build-shophouse-fabric.py --cluster tanao-road-rows
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from mc_blocks import (  # noqa: E402
    columns_of,
    keep_spans,
    min_oriented_rect,
    outer_ring,
    project,
    punch_spans,
    rect_ring,
    row_spans,
    span_volume,
)

FOOTPRINTS = ROOT / "site/public/data/bangkok-rowhouse-footprint-candidates.geojson"
SPINE = ROOT / "site/public/data/shophouse-spine.json"
REGISTER = ROOT / "site/public/heritage-register.json"
HERO_PLAN = ROOT / "site/public/data/bkk-hero-monument-blocks.json"
OUT = ROOT / "site/public/data/bkk-shophouse-fabric-blocks.json"

WORLD_ID = "bangkok-historic-core-java"
DEFAULT_GROUND_Y = 64

MODULE_M = 4.0
FIREWALL_EVERY_BAYS = 5
ROW_CAP_BAYS = 10
ROW_CAP_M = 40.0
NEIGHBOUR_GAP_M = 1.5
GF_HEIGHT_M = 3.5          # MR55 ข้อ 22
UPPER_HEIGHT_M = 3.0       # MR55 ข้อ 22
DEFAULT_STOREYS = 2        # modal known value in this world; not a survey
WALL_THICKNESS_M = 1.0
FIREWALL_ABOVE_M = 1.0     # law asks ≥ 30 cm; one block is the resolution
MIN_FRONTAGE_M = 2.0

BODY_BLOCK = "minecraft:smooth_sandstone"
PARTY_BLOCK = "minecraft:stone_bricks"
FIRE_BLOCK = "minecraft:bricks"
ROOF_BLOCK = "minecraft:terracotta"

CONFIDENCE_OVERTURE = "overture-storeys"
CONFIDENCE_DEFAULT = "interpretive-storeys"


def bay_count(frontage_m: float, module: float = MODULE_M) -> int:
    """Legal bays that fit. A 7.9 m frontage is one unit, not two illegal ones."""
    if frontage_m < MIN_FRONTAGE_M:
        return 0
    return max(1, int(frontage_m // module))


def storeys_of(num_floors, height_m) -> tuple[int, str]:
    if isinstance(num_floors, (int, float)) and num_floors >= 1:
        return int(num_floors), CONFIDENCE_OVERTURE
    if isinstance(height_m, (int, float)) and height_m >= GF_HEIGHT_M:
        return max(1, int(round((height_m - GF_HEIGHT_M) / UPPER_HEIGHT_M)) + 1), CONFIDENCE_OVERTURE
    return DEFAULT_STOREYS, CONFIDENCE_DEFAULT


def height_m(storeys: int) -> float:
    n = max(1, storeys)
    return GF_HEIGHT_M + UPPER_HEIGHT_M * (n - 1)


def centroid_lonlat(ring: list[list[float]]) -> tuple[float, float]:
    pts = ring[:-1] if ring[0] == ring[-1] else ring
    return (
        sum(p[0] for p in pts) / len(pts),
        sum(p[1] for p in pts) / len(pts),
    )


def hero_columns(path: Path) -> set[tuple[int, int]]:
    if not path.exists():
        return set()
    plan = json.loads(path.read_text())
    cols: set[tuple[int, int]] = set()
    for part in plan.get("parts") or []:
        cols |= columns_of(part.get("spans") or [])
    return cols


def clip_spans(spans: list[list[int]], max_x: int, max_z: int) -> list[list[int]]:
    """A centroid can sit inside the world while the footprint crosses the
    edge. Clip rather than refuse — the building is real, the world is not
    infinite."""
    out: list[list[int]] = []
    for z, a, b in spans:
        if z < 0 or z > max_z:
            continue
        a = max(0, a)
        b = min(max_x, b)
        if b >= a:
            out.append([z, a, b])
    return out


def wall_spans(rect: dict, f0: float, f1: float, body: set[tuple[int, int]]) -> list[list[int]]:
    ring = rect_ring(
        rect["origin"], rect["fu"], rect["fv"], rect["du"], rect["dv"],
        f0, f1, 0.0, rect["depth_m"],
    )
    return keep_spans(row_spans(ring), body)


def _same_row(a: dict, b: dict) -> bool:
    """Two footprints share a run when they sit along the same frontage and
    the gap between them is a party wall, not a street. Across-the-block
    neighbours on a parallel soi must not join — that is how a whole
    cluster became one illegal 300-unit row on the first pass."""
    fx, fy = a["rect"]["fu"], a["rect"]["fv"]
    du = a["rect"].get("du", -fy)
    dv = a["rect"].get("dv", fx)
    dx = b["mx"] - a["mx"]
    dy = b["my"] - a["my"]
    along = abs(dx * fx + dy * fy)
    across = abs(dx * du + dy * dv)
    gap = along - (a["frontageM"] + b["frontageM"]) / 2
    depth = max(a.get("depthM") or 12.0, b.get("depthM") or 12.0)
    return across < depth * 0.6 and gap <= NEIGHBOUR_GAP_M and along < 60


def assign_row_bays(buildings: list[dict]) -> None:
    """Give each building its place in a contiguous street run.

    Firewalls sit on the right edge of every fifth bay along that run.
    Over-cap (10 units / 40 m) is tagged, never inserted as a gap: the
    plan shows the row that stands.
    """
    by_cluster: dict[str, list[dict]] = defaultdict(list)
    for b in buildings:
        by_cluster[b["cluster"]].append(b)

    for grp in by_cluster.values():
        parent = list(range(len(grp)))

        def find(i: int) -> int:
            while parent[i] != i:
                parent[i] = parent[parent[i]]
                i = parent[i]
            return i

        for i, a in enumerate(grp):
            for j in range(i + 1, len(grp)):
                if _same_row(a, grp[j]) or _same_row(grp[j], a):
                    parent[find(j)] = find(i)

        runs: dict[int, list[dict]] = defaultdict(list)
        for i, b in enumerate(grp):
            runs[find(i)].append(b)

        for run in runs.values():
            fu = sum(b["rect"]["fu"] for b in run) / len(run)
            fv = sum(b["rect"]["fv"] for b in run) / len(run)
            length = math.hypot(fu, fv) or 1.0
            fu, fv = fu / length, fv / length
            run.sort(key=lambda b: b["mx"] * fu + b["my"] * fv)
            cursor = 1
            run_frontage = 0.0
            for b in run:
                b["rowBayFrom"] = cursor
                b["rowBayTo"] = cursor + b["nBays"] - 1
                cursor += b["nBays"]
                run_frontage += b["frontageM"]
            n_bays = cursor - 1
            over = n_bays > ROW_CAP_BAYS or run_frontage > ROW_CAP_M
            for b in run:
                b["rowBays"] = n_bays
                b["rowFrontageM"] = round(run_frontage, 1)
                b["overRowCap"] = over


def rasterise(b: dict, blocked: set[tuple[int, int]], max_x: int, max_z: int) -> None:
    rect = b["rect"]
    body = clip_spans(punch_spans(row_spans(b["ring"]), blocked), max_x, max_z)
    if not body:
        b["spans"] = []
        b["partyWalls"] = []
        b["firewalls"] = []
        b["blocks"] = 0
        return

    body_cols = columns_of(body)
    party: list[list[int]] = []
    fires: list[list[int]] = []
    frontage = rect["frontage_m"]
    n = b["nBays"]

    for i in range(1, n):
        centre = (i / n) * frontage
        f0, f1 = centre - WALL_THICKNESS_M / 2, centre + WALL_THICKNESS_M / 2
        spans = wall_spans(rect, f0, f1, body_cols)
        global_bay = b["rowBayFrom"] + i - 1
        if global_bay % FIREWALL_EVERY_BAYS == 0:
            fires.extend(spans)
        else:
            party.extend(spans)

    if b["rowBayTo"] % FIREWALL_EVERY_BAYS == 0:
        fires.extend(wall_spans(rect, frontage - WALL_THICKNESS_M, frontage, body_cols))

    layers = b["yTo"] - b["yFrom"] + 1
    fire_layers = layers + int(FIREWALL_ABOVE_M)
    b["spans"] = body
    b["partyWalls"] = party
    b["firewalls"] = fires
    b["blocks"] = (
        span_volume(body, layers)
        + span_volume(party, layers)
        + span_volume(fires, fire_layers)
    )


def load_spine(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    return {row["id"]: row for row in json.loads(path.read_text())}


def build(ground_y: int, cluster: str | None = None) -> dict:
    footprints = json.loads(FOOTPRINTS.read_text())
    world = json.loads(REGISTER.read_text())["worlds"][WORLD_ID]
    spine = load_spine(SPINE)
    blocked = hero_columns(HERO_PLAN)
    max_x, max_z = world["blocks"]["maxX"], world["blocks"]["maxZ"]

    buildings: list[dict] = []
    refused: list[dict] = []
    out_of_world = 0
    in_world = 0
    punched = 0

    for feature in footprints["features"]:
        props = feature["properties"]
        slug = props.get("cluster_slug") or "unclustered"
        if cluster and slug != cluster:
            continue
        ring_ll = outer_ring(feature["geometry"])
        lon, lat = centroid_lonlat(ring_ll)
        mx, mz = project(lat, lon, world)
        in_bbox = 0 <= mx <= max_x and 0 <= mz <= max_z
        if not in_bbox:
            out_of_world += 1
            continue
        in_world += 1

        ring = [project(lat_i, lon_i, world) for lon_i, lat_i in ring_ll]
        rect = min_oriented_rect(ring)
        if rect is None:
            refused.append({"id": props.get("overture_id"), "why": "degenerate rectangle"})
            continue
        n_bays = bay_count(rect["frontage_m"])
        if n_bays == 0:
            refused.append({"id": props.get("overture_id"), "why": f"frontage {rect['frontage_m']:.1f} m below {MIN_FRONTAGE_M} m"})
            continue

        sid = props.get("overture_id")
        sp = spine.get(sid, {})
        storeys, confidence = storeys_of(props.get("num_floors"), props.get("height_m"))
        top_m = height_m(storeys)
        y_from = ground_y
        y_to = ground_y + int(round(top_m)) - 1

        buildings.append({
            "id": sid,
            "cluster": slug,
            "frontageM": round(rect["frontage_m"], 1),
            "depthM": round(rect["depth_m"], 1),
            "nBays": n_bays,
            "storeys": storeys,
            "heightConfidence": confidence,
            "yFrom": y_from,
            "yTo": y_to,
            "rowUnitsSpine": sp.get("row_units"),
            "mx": mx,
            "my": mz,
            "ring": ring,
            "rect": rect,
        })

    assign_row_bays(buildings)

    planned: list[dict] = []
    for b in buildings:
        rasterise(b, blocked, max_x, max_z)
        if not b["spans"]:
            punched += 1
            refused.append({"id": b["id"], "why": "rasterised to nothing after hero punch"})
            continue
        # Drop working geometry — the plan is for the applier, not a GIS.
        planned.append({
            "id": b["id"],
            "cluster": b["cluster"],
            "block": BODY_BLOCK,
            "partyBlock": PARTY_BLOCK,
            "firewallBlock": FIRE_BLOCK,
            "roofBlock": ROOF_BLOCK,
            "yFrom": b["yFrom"],
            "yTo": b["yTo"],
            "storeys": b["storeys"],
            "heightConfidence": b["heightConfidence"],
            "frontageM": b["frontageM"],
            "depthM": b["depthM"],
            "nBays": b["nBays"],
            "rowBayFrom": b["rowBayFrom"],
            "rowBayTo": b["rowBayTo"],
            "rowBays": b["rowBays"],
            "rowFrontageM": b["rowFrontageM"],
            "overRowCap": b["overRowCap"],
            "spans": b["spans"],
            "partyWalls": b["partyWalls"],
            "firewalls": b["firewalls"],
            "blocks": b["blocks"],
        })

    planned.sort(key=lambda x: (x["cluster"], x["rowBayFrom"], x["id"] or ""))
    by_conf = Counter(b["heightConfidence"] for b in planned)
    by_cluster = Counter(b["cluster"] for b in planned)

    return {
        "generatedFrom": [
            "site/public/data/bangkok-rowhouse-footprint-candidates.geojson",
            "site/public/data/shophouse-spine.json",
            "site/public/heritage-register.json",
            "site/public/data/bkk-hero-monument-blocks.json",
        ],
        "world": WORLD_ID,
        "groundY": ground_y,
        "projection": "linear local, 1 block = 1 m, north = -Z (matches build-heritage-register.py to_block)",
        "module": {
            "bayM": MODULE_M,
            "firewallEveryBays": FIREWALL_EVERY_BAYS,
            "rowCapBays": ROW_CAP_BAYS,
            "rowCapM": ROW_CAP_M,
            "gfHeightM": GF_HEIGHT_M,
            "upperHeightM": UPPER_HEIGHT_M,
            "defaultStoreys": DEFAULT_STOREYS,
            "wallThicknessM": WALL_THICKNESS_M,
            "note": (
                "The 4 m module and the firewall every five bays are the legal "
                "rhythm (MR55 ข้อ 2, ข้อ 4, ข้อ 17) applied to screened footprints. "
                "They are not a survey of the actual party walls. Over-cap rows "
                "are tagged, not broken. Storeys default to 2 where Overture is silent "
                "— the modal known value in this world, graded interpretive-storeys."
            ),
        },
        "palette": {
            "body": BODY_BLOCK,
            "partyWall": PARTY_BLOCK,
            "firewall": FIRE_BLOCK,
            "roof": ROOF_BLOCK,
            "why": (
                "Sandstone body, stone-brick party wall, brick firewall rising "
                "one block above the roof. The roof is terracotta so a long row "
                "reads as a row, not a monument."
            ),
        },
        "counts": {
            "input": len(footprints["features"]) if not cluster else sum(
                1 for f in footprints["features"]
                if (f["properties"].get("cluster_slug") or "unclustered") == cluster
            ),
            "inWorld": in_world,
            "outOfWorld": out_of_world,
            "refused": len(refused),
            "punchedByHero": punched,
            "buildings": len(planned),
            "bays": sum(b["nBays"] for b in planned),
            "firewalls": sum(1 for b in planned if b["firewalls"]),
            "overRowCap": sum(1 for b in planned if b["overRowCap"]),
            "blocks": sum(b["blocks"] for b in planned),
            "heroColumnsReserved": len(blocked),
            "byConfidence": dict(sorted(by_conf.items())),
            "byCluster": dict(sorted(by_cluster.items(), key=lambda kv: -kv[1])),
        },
        "refused": refused[:50],
        "buildings": planned,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ground-y", type=int, default=DEFAULT_GROUND_Y)
    ap.add_argument("--cluster", help="build only this cluster slug")
    ap.add_argument("--summary-only", action="store_true", help="print the summary without writing the plan")
    args = ap.parse_args()

    plan = build(args.ground_y, cluster=args.cluster)
    c = plan["counts"]

    # Written BEFORE the summary is printed. Piping a long summary through
    # `head` SIGPIPEs the process; a generated file nobody compared is how
    # the last stale plan shipped. The side effect that matters should not
    # sit downstream of stdout.
    if not args.summary_only:
        OUT.write_text(json.dumps(plan, separators=(",", ":")) + "\n")

    print(
        f"shophouse fabric: {c['buildings']} buildings, {c['bays']} bays, "
        f"{c['blocks']:,} blocks, ground y={plan['groundY']}"
    )
    print(f"  in-world {c['inWorld']}  out-of-world {c['outOfWorld']}  refused {c['refused']}  punched-by-hero {c['punchedByHero']}")
    print(f"  firewalls on {c['firewalls']} buildings  over-cap {c['overRowCap']}  hero columns reserved {c['heroColumnsReserved']:,}")
    for conf, n in c["byConfidence"].items():
        print(f"  {conf:<24} {n}")
    for slug, n in list(c["byCluster"].items())[:8]:
        print(f"  {slug:<24} {n}")
    if len(c["byCluster"]) > 8:
        print(f"  ... {len(c['byCluster']) - 8} more clusters")

    if args.summary_only:
        return 0
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1_000_000:.1f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
