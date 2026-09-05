#!/usr/bin/env python3
"""
build-shophouse-blocks.py
-------------------------
Turn the screened shophouse footprints into a block placement plan.

The companion to build-hero-monument-blocks.py, and the answer to the other
half of the Arnis note: Bangkok's ตึกแถว are rarely tagged `building=terrace`
in OpenStreetMap — most are `building=yes` with no `building:levels` — so a
generator falls back to one default and the whole fabric flattens to a single
height. That erases the rhythm the entire shophouse thesis is about.

This repository has better data than OSM for exactly these buildings:
2,433 screened footprints with measured frontage and depth, joined in
shophouse-spine.json to storeys, cluster, district, pressure quadrant and the
Ministerial Regulation clauses each building's own geometry triggers.

HEIGHT COMES FROM THE LAW, NOT FROM A DEFAULT. Ministerial Regulation No. 55
B.E. 2543 ข้อ 22(4) sets the storey minima: ground floor >= 3.50 m, second
floor and above >= 3.00 m. So a building's height is 3.5 + (storeys - 1) x 3.0,
and every metre of it traces to a clause. The Bible's line — "the high
ceilings that make these buildings survivable without air conditioning are
statutory minima, not a design gift" — is the reason the fabric has vertical
texture at all.

THREE BANDS, BECAUSE A SHOPHOUSE IS NOT A BOX. Every building is laid down as
shopfront (the open ground floor), body (the plastered upper floors) and
parapet (the one-block cap above the roofline). That is the anatomy of the
type, and it is what makes 2,433 of them read as shophouses rather than as
2,433 cuboids. No geometry is invented: the bands are horizontal slices of the
same measured footprint.

STOREYS ARE MOSTLY UNKNOWN, AND SAY SO. 769 of 2,433 footprints carry a storey
count; 1,664 do not. Those take the median of the known set (2) and are marked
`storeysAssumed`, so nobody reads an assumed two-storey row as a surveyed one.
The spine names storeys as missing data rather than estimating it, and this
plan does not quietly do the estimating on its behalf.

The output is schema-compatible with bkk-hero-monument-blocks.json, so
apply-hero-monuments-to-world.py writes it unchanged. Each building is its own
group, so the applier clears each footprint's own columns and never a
neighbour's.

Usage:
    python3 scripts/build-shophouse-blocks.py
    python3 scripts/build-shophouse-blocks.py --cluster bamrung-mueang --summary-only
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import statistics
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPINE = ROOT / "site/public/data/shophouse-spine.json"
CANDIDATES = ROOT / "site/public/data/bangkok-rowhouse-footprint-candidates.geojson"
REGISTER = ROOT / "site/public/heritage-register.json"
OUT = ROOT / "site/public/data/bkk-shophouse-blocks.json"

WORLD_ID = "bangkok-historic-core-java"
DEFAULT_GROUND_Y = 64

# Ministerial Regulation No. 55 B.E. 2543, ข้อ 22(4).
GROUND_FLOOR_M = 3.5
UPPER_FLOOR_M = 3.0

# One block of parapet above the top floor. Bangkok shophouses cap the party
# walls and the street elevation above the roof deck; without it every row
# ends in a flat lid and the type disappears.
PARAPET_BLOCKS = 1

# The rasteriser and projection live in the monument builder. Imported rather
# than copied: one scanline implementation, tested once, and a fencepost bug
# fixed in one place fixes both plans.
_spec = importlib.util.spec_from_file_location(
    "hero_blocks", ROOT / "scripts/build-hero-monument-blocks.py"
)
hb = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(hb)

# Three horizontal bands, and the block each is laid in.
BANDS = {
    "shopfront": ("minecraft", "polished_deepslate"),
    "body": ("minecraft", "smooth_sandstone"),
    "parapet": ("minecraft", "cut_sandstone"),
}
BAND_NOTE = {
    "shopfront": "the open ground floor — dark, because a shophouse street elevation is a shop, not a wall",
    "body": "the plastered upper floors, where the household lives above the trade",
    "parapet": "the capped roofline, one block above the top floor",
}


def centroid(geometry: dict) -> tuple[float, float]:
    c = geometry["coordinates"]
    while isinstance(c[0][0], list):
        c = c[0]
    n = len(c)
    return sum(p[0] for p in c) / n, sum(p[1] for p in c) / n


def load_joined() -> tuple[list[tuple[dict, dict]], list[str]]:
    """Join each spine record to its footprint polygon.

    The two files share no id — the spine keys on a UUID and the candidate set
    on its own — but the spine's lat/lon IS the candidate centroid rounded to
    six decimal places, so the centroid is the key. Verified: all 2,433 match
    exactly and no centroid is claimed by two footprints. Anything unmatched is
    reported rather than dropped, because a join that silently loses rows is
    how a plan ends up describing a city that is not there.
    """
    spine = json.loads(SPINE.read_text())
    candidates = json.loads(CANDIDATES.read_text())["features"]

    index: dict[tuple[float, float], list[dict]] = {}
    for feature in candidates:
        lon, lat = centroid(feature["geometry"])
        index.setdefault((round(lon, 6), round(lat, 6)), []).append(feature)

    joined: list[tuple[dict, dict]] = []
    unmatched: list[str] = []
    for record in spine:
        key = (round(record["lon"], 6), round(record["lat"], 6))
        bucket = index.get(key)
        if not bucket or len(bucket) > 1:
            unmatched.append(record["id"])
            continue
        joined.append((record, bucket[0]))
    return joined, unmatched


def storey_height_m(storeys: int) -> float:
    """ข้อ 22(4): ground >= 3.50 m, every floor above >= 3.00 m."""
    return GROUND_FLOOR_M + (storeys - 1) * UPPER_FLOOR_M


def build(ground_y: int, only_cluster: str | None = None) -> dict:
    joined, unmatched = load_joined()
    world = json.loads(REGISTER.read_text())["worlds"][WORLD_ID]

    known = [r["storeys"] for r, _ in joined if r.get("storeys")]
    assumed_storeys = int(statistics.median(known)) if known else 2

    parts: list[dict] = []
    refused: list[dict] = []
    clusters: dict[str, int] = {}
    assumed = 0

    bounds = world["bounds"]
    max_x, max_z = world["blocks"]["maxX"], world["blocks"]["maxZ"]
    outside: dict[str, int] = {}
    clipped = 0

    for record, feature in joined:
        if only_cluster and record.get("cluster") != only_cluster:
            continue

        # The screen covers all of Bangkok; this world covers Rattanakosin.
        # 610 of the 2,433 footprints sit in Bang Rak, Thon Buri, Lat Krabang,
        # Nong Chok, Phasi Charoen or the part of Samphanthawong that spills
        # east past the bbox. Projecting those anyway puts blocks at negative
        # or out-of-range coordinates — a building written into nowhere, or
        # worse, into somewhere it is not. The register's own builder gives a
        # site block coordinates only when it falls inside a world; so does
        # this. They are counted by district, not dropped in silence.
        if not (bounds["minLat"] <= record["lat"] <= bounds["maxLat"]
                and bounds["minLon"] <= record["lon"] <= bounds["maxLon"]):
            district = record.get("district") or "unrecorded"
            outside[district] = outside.get(district, 0) + 1
            continue

        storeys = record.get("storeys")
        is_assumed = not storeys
        if is_assumed:
            storeys = assumed_storeys
            assumed += 1

        ring = [hb.project(lat, lon, world) for lon, lat in feature["geometry"]["coordinates"][0]]
        spans = hb.row_spans(ring)

        # A building whose centroid is inside the world can still have a
        # corner past its edge — four of these sit on the boundary. The world
        # truncates everything at its edge, roads and moat included, so the
        # footprint is clipped to it the same way rather than dropped or
        # written into an ungenerated chunk. Clipped buildings are counted.
        before = len(spans)
        spans = [
            [z, max(0, a), min(max_x, b)]
            for z, a, b in spans
            if 0 <= z <= max_z and b >= 0 and a <= max_x
        ]
        spans = [sp for sp in spans if sp[2] >= sp[1]]
        was_clipped = len(spans) != before
        if was_clipped:
            clipped += 1

        if not spans:
            # A footprint under a block across is a screen artefact here, not a
            # finial: there is nothing to snap it to. Refused and counted.
            refused.append({"id": record["id"], "why": "footprint rasterised to nothing"})
            continue

        top_m = storey_height_m(storeys)
        shopfront_to = ground_y + int(round(GROUND_FLOOR_M)) - 1
        body_to = ground_y + int(round(top_m)) - 1
        parapet_to = body_to + PARAPET_BLOCKS

        bands = [("shopfront", ground_y, shopfront_to)]
        if body_to > shopfront_to:
            bands.append(("body", shopfront_to + 1, body_to))
        bands.append(("parapet", body_to + 1, parapet_to))

        clusters[record.get("cluster") or "uncatalogued"] = (
            clusters.get(record.get("cluster") or "uncatalogued", 0) + 1
        )

        # One entry per BUILDING, with the footprint stored once and the bands
        # as y ranges over it. Writing the same spans three times — once per
        # band — tripled the file to 9.8 MB for no extra information, and the
        # applier expands this back to flat parts in memory anyway.
        parts.append(
            {
                "id": record["id"],
                "heroId": record["id"],
                "name": record.get("cluster_name") or record.get("cluster") or "shophouse",
                # The evidence grade a shophouse actually has. Storeys measured
                # is the strong case; storeys assumed is the weak one, and the
                # plan never lets them look alike.
                "heightConfidence": "interpretive-envelope" if is_assumed else "interpretive-proportion",
                "heightSource": (
                    f"MR55 ข้อ 22(4) storey minima on an assumed {storeys} storeys"
                    if is_assumed
                    else f"MR55 ข้อ 22(4) storey minima on {storeys} recorded storeys"
                ),
                "notMeasuredSurvey": True,
                "storeys": storeys,
                "storeysAssumed": is_assumed,
                "cluster": record.get("cluster"),
                "district": record.get("district"),
                "quadrant": record.get("quadrant"),
                "spans": spans,
                "snappedToOneColumn": False,
                "clippedToWorldEdge": was_clipped,
                "bands": [
                    {
                        "partLabel": band,
                        "block": "{}:{}".format(*BANDS[band]),
                        "yFrom": y_from,
                        "yTo": y_to,
                        "blocks": hb.span_volume(spans, y_to - y_from + 1),
                    }
                    for band, y_from, y_to in bands
                ],
            }
        )

    for part in parts:
        part["blocks"] = sum(b["blocks"] for b in part["bands"])

    by_conf: dict[str, int] = {}
    for part in parts:
        by_conf[part["heightConfidence"]] = by_conf.get(part["heightConfidence"], 0) + 1

    return {
        "generatedFrom": [
            "site/public/data/shophouse-spine.json",
            "site/public/data/bangkok-rowhouse-footprint-candidates.geojson",
            "site/public/heritage-register.json",
        ],
        "world": WORLD_ID,
        "groundY": ground_y,
        "projection": hb.__dict__.get("__doc__") and "shared with build-hero-monument-blocks.py",
        "storeyRule": {
            "clause": "Ministerial Regulation No. 55 B.E. 2543, ข้อ 22(4)",
            "groundFloorM": GROUND_FLOOR_M,
            "upperFloorM": UPPER_FLOOR_M,
            "assumedStoreys": assumed_storeys,
            "assumedFrom": f"median of the {len(known)} footprints that carry a storey count",
        },
        "palette": {
            "rule": "three horizontal bands — the anatomy of the type, not a colour match",
            "families": {k: {"block": f"{v[0]}:{v[1]}", "why": BAND_NOTE[k]} for k, v in BANDS.items()},
            "colors": {},
        },
        "counts": {
            "buildings": len(parts),
            "bands": sum(len(p["bands"]) for p in parts),
            "storeysAssumed": assumed,
            "storeysRecorded": len(parts) - assumed,
            "unmatched": len(unmatched),
            "outsideWorld": sum(outside.values()),
            "clippedToWorldEdge": clipped,
            "refused": len(refused),
            "blocks": sum(p["blocks"] for p in parts),
            "byConfidence": dict(sorted(by_conf.items())),
        },
        "clusters": dict(sorted(clusters.items(), key=lambda kv: -kv[1])),
        "outsideWorldByDistrict": dict(sorted(outside.items(), key=lambda kv: -kv[1])),
        "unmatched": unmatched,
        "refused": refused,
        "parts": parts,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ground-y", type=int, default=DEFAULT_GROUND_Y)
    ap.add_argument("--cluster", help="build only one cluster slug")
    ap.add_argument("--summary-only", action="store_true")
    args = ap.parse_args()

    plan = build(args.ground_y, args.cluster)
    c = plan["counts"]

    # Written before the summary prints: a side effect that matters must not
    # sit downstream of stdout, which `head` can close mid-print.
    if not args.summary_only:
        OUT.write_text(json.dumps(plan, indent=1) + "\n")

    print(f"shophouse blocks: {c['buildings']:,} buildings, {c['bands']:,} bands, {c['blocks']:,} blocks")
    print(f"  storeys recorded {c['storeysRecorded']:,} · assumed {c['storeysAssumed']:,} "
          f"(= {plan['storeyRule']['assumedStoreys']}, {plan['storeyRule']['assumedFrom']})")
    if c["outsideWorld"]:
        print(f"  {c['outsideWorld']:,} footprints lie outside {WORLD_ID} and are not built:")
        for district, n in list(plan["outsideWorldByDistrict"].items())[:6]:
            print(f"      {district:<24} {n:>4}")
    if c["clippedToWorldEdge"]:
        print(f"  {c['clippedToWorldEdge']} footprint(s) straddle the world edge and were clipped to it")
    if c["unmatched"]:
        print(f"  UNMATCHED {c['unmatched']} spine rows had no unique footprint")
    if c["refused"]:
        print(f"  refused {c['refused']} footprints that rasterised to nothing")
    for cluster, n in list(plan["clusters"].items())[:8]:
        print(f"  {cluster:<28} {n:>5}")

    if not args.summary_only:
        print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1_000_000:.1f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
