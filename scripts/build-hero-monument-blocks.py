#!/usr/bin/env python3
"""
build-hero-monument-blocks.py
-----------------------------
Turn the hero-monument massing into a block placement plan.

WHY THIS EXISTS. site/scripts/build-hero-monuments.py already computes the
thing OpenStreetMap cannot express and Arnis therefore cannot generate: 67
stacked parts across Wat Arun's prang group, the Grand Palace's Phra Mondop,
Siratana Chedi and Thepbidorn, and Wat Pho's four great chedis — each with a
footprint, a base and top height in metres, a material tone, and a per-part
provenance grade. Separately, scripts/apply-rattanakosin-to-world.py can write
geojson in block coordinates into .mca region files with amulet-core.

Both halves have been in this repository for weeks and had never been
introduced. This is the introduction: geometry and evidence in, a placement
plan out, in the same block frame the moat and the city gates already use.

    lat/lon polygon + base_height/height  ->  row spans per Y band, per part

WHAT IT DELIBERATELY DOES NOT DO. It does not touch a world. Writing blocks
needs amulet-core and an actual save file, which is an operator's machine, not
a build server. Keeping the arithmetic here — pure, deterministic, no heavy
dependency — means the geometry can be tested in CI and reviewed in a diff,
and the applier stays a thin loop over a plan somebody has already read.

EVIDENCE IS NOT FLATTENED. The atlas grades every one of these parts
(`official-envelope` 7, `interpretive-proportion` 16, `interpretive-envelope`
44) and Evidence mode colours the city by it. A part with no grade is REFUSED
rather than built: a world that shows the Fine Arts Department's published
82 m envelope and a BKKx-curated silhouette as the same kind of fact lies more
confidently than the map does. The grade travels with every part into the
plan, so the applier can act on it too.

Usage:
    python3 scripts/build-hero-monument-blocks.py
    python3 scripts/build-hero-monument-blocks.py --ground-y 64 --summary-only
"""
from __future__ import annotations

import argparse
import colorsys
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HEROES = ROOT / "site/public/data/bkk-hero-monuments.geojson"
REGISTER = ROOT / "site/public/heritage-register.json"
OUT = ROOT / "site/public/data/bkk-hero-monument-blocks.json"

# Which generated world these monuments fall in. All 67 parts are Rattanakosin.
WORLD_ID = "bangkok-historic-core-java"

# Minecraft sea level. apply-rattanakosin-to-world.py puts the moat surface at
# y=63 and gate markers at y=64, so this is the same ground frame those
# features already assume. Overridable, because it is an assumption about a
# world file this script never opens.
DEFAULT_GROUND_Y = 64

# ---------------------------------------------------------------------------
# Palette
#
# The generator emits 32 distinct material tones. Rather than hand-assigning 32
# hexes — which nobody can check — each is classified by hue and lightness into
# one of six families, and the family carries the block. The rule is here, and
# the full resulting colour -> family -> block table is written into the output
# and pinned by scripts/test-build-hero-monument-blocks.py, so every assignment
# is visible in a diff the first time it changes.
#
# The families are the palette of a Rattanakosin monument: gilded surfaces,
# whitewashed masonry, the plain plastered body, glazed roof tile in green and
# in blue, and the terracotta of an unglazed or weathered element.
# ---------------------------------------------------------------------------

FAMILY_BLOCKS: dict[str, tuple[str, str]] = {
    "gilt":       ("minecraft", "gold_block"),
    "whitewash":  ("minecraft", "smooth_quartz"),
    "plaster":    ("minecraft", "smooth_sandstone"),
    "glaze_green": ("minecraft", "green_terracotta"),
    "glaze_blue":  ("minecraft", "blue_terracotta"),
    "terracotta": ("minecraft", "terracotta"),
}

FAMILY_NOTE: dict[str, str] = {
    "gilt": "saturated yellow — gold leaf over lacquer, the gilded chedi and mondop surfaces",
    "whitewash": "very light and barely saturated — whitewashed masonry and lime plaster",
    "plaster": "mid-tone ochre — the plain plastered body of a wall or terrace",
    "glaze_green": "green — glazed roof tile",
    "glaze_blue": "blue — glazed roof tile",
    "terracotta": "red-orange — unglazed or weathered terracotta",
}


def classify(hex_colour: str) -> str:
    """Family for one material tone, by hue and lightness. Explicit bands, no
    nearest-neighbour search: a rule a reader can apply by hand to any hex."""
    h, l, s = colorsys.rgb_to_hls(
        int(hex_colour[1:3], 16) / 255,
        int(hex_colour[3:5], 16) / 255,
        int(hex_colour[5:7], 16) / 255,
    )
    deg = h * 360
    if 90 <= deg <= 180:
        return "glaze_green"
    if 180 < deg <= 260:
        return "glaze_blue"
    if deg < 20 or deg > 330:
        return "terracotta"
    # What is left is the yellow-through-orange band, split by how light and
    # how saturated it is.
    if l >= 0.85 and s < 0.45:
        return "whitewash"
    if s >= 0.5 and l < 0.75:
        return "gilt"
    if l >= 0.78:
        return "whitewash"
    return "plaster"


# ---------------------------------------------------------------------------
# Projection — the same linear local projection the register and the
# water-and-walls builder both use. 1 block = 1 metre; Minecraft north is -Z,
# so the world's northern edge is z = 0 and z grows southward.
# ---------------------------------------------------------------------------

def project(lat: float, lon: float, world: dict) -> tuple[float, float]:
    x = (lon - world["bounds"]["minLon"]) / (
        world["bounds"]["maxLon"] - world["bounds"]["minLon"]
    ) * world["blocks"]["maxX"]
    z = (world["bounds"]["maxLat"] - lat) / (
        world["bounds"]["maxLat"] - world["bounds"]["minLat"]
    ) * world["blocks"]["maxZ"]
    return x, z


# ---------------------------------------------------------------------------
# Rasterisation
# ---------------------------------------------------------------------------

def row_spans(ring: list[tuple[float, float]]) -> list[list[int]]:
    """Scanline-fill a polygon ring into [z, x_start, x_end] spans, inclusive.

    Even-odd rule, sampling each row at its centre (z + 0.5) so a block is
    filled when its middle is inside the polygon rather than when its corner
    grazes an edge. Spans rather than points because a prang footprint is a few
    hundred blocks wide and listing every column would make the plan enormous
    for no extra information.
    """
    if len(ring) < 3:
        return []
    zs = [p[1] for p in ring]
    z_lo, z_hi = int(min(zs)), int(max(zs))
    spans: list[list[int]] = []
    for z in range(z_lo, z_hi + 1):
        y = z + 0.5
        xs: list[float] = []
        for i in range(len(ring)):
            x1, z1 = ring[i]
            x2, z2 = ring[(i + 1) % len(ring)]
            if (z1 > y) == (z2 > y):
                continue
            xs.append(x1 + (y - z1) / (z2 - z1) * (x2 - x1))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            # Block column x covers [x, x+1), so its centre is x+0.5. A column
            # is filled when that centre falls between the two crossings —
            # which is ceil(xa - 0.5) .. floor(xb - 0.5), not round(xa) ..
            # round(xb). The naive version is one block too wide on every row
            # and inflates a 10x10 footprint to 10x11.
            a = math.ceil(xs[i] - 0.5)
            b = math.floor(xs[i + 1] - 0.5)
            if b >= a:
                spans.append([z, a, b])
    return spans


def span_volume(spans: list[list[int]], layers: int) -> int:
    return sum((b - a + 1) for _, a, b in spans) * layers


# ---------------------------------------------------------------------------
# Plan
# ---------------------------------------------------------------------------

def build(ground_y: int) -> dict:
    heroes = json.loads(HEROES.read_text())
    world = json.loads(REGISTER.read_text())["worlds"][WORLD_ID]

    parts: list[dict] = []
    refused: list[dict] = []
    palette: dict[str, dict] = {}
    hero_bounds: dict[str, list[int]] = {}

    for feature in heroes["features"]:
        p = feature["properties"]

        # The refusal that keeps the world as honest as the map. A part with
        # no grade is massing nobody has taken responsibility for.
        if not p.get("height_confidence"):
            refused.append({"id": p.get("id"), "why": "no height_confidence"})
            continue

        top = p.get("height")
        base = p.get("base_height") or 0
        if not isinstance(top, (int, float)) or top <= base:
            refused.append({"id": p.get("id"), "why": f"height {top!r} not above base {base!r}"})
            continue

        ring = [project(lat, lon, world) for lon, lat in feature["geometry"]["coordinates"][0]]
        spans = row_spans(ring)

        # A finial can genuinely be under a metre across — the Siratana Chedi's
        # is 0.94 m — so at one block per metre its footprint rasterises to
        # nothing. Dropping it would blunt the spire it tips, which is the part
        # of the silhouette this whole exercise exists to keep. So a sub-block
        # part is snapped to a single column at its centroid, and the plan says
        # it was snapped: the block is a placement, not a measurement.
        snapped = False
        if not spans and len(ring) >= 3:
            cx = sum(x for x, _ in ring) / len(ring)
            cz = sum(z for _, z in ring) / len(ring)
            spans = [[int(math.floor(cz)), int(math.floor(cx)), int(math.floor(cx))]]
            snapped = True
        if not spans:
            refused.append({"id": p.get("id"), "why": "footprint rasterised to nothing"})
            continue

        colour = p.get("material_color") or "#d9c69f"
        family = classify(colour)
        block = FAMILY_BLOCKS[family]
        palette.setdefault(
            colour, {"family": family, "block": f"{block[0]}:{block[1]}", "parts": 0}
        )
        palette[colour]["parts"] += 1

        y_from = ground_y + int(round(base))
        y_to = ground_y + int(round(top)) - 1

        # Extent of every part of a hero, so the applier can clear the
        # generated box underneath before it builds — the same thing Arnis's
        # own landmark path does with `suppress_half_x/z`.
        zs = [s[0] for s in spans]
        xs = [v for s in spans for v in (s[1], s[2])]
        bb = hero_bounds.setdefault(
            p.get("hero_id") or p["id"], [min(xs), min(zs), max(xs), max(zs)]
        )
        bb[0], bb[1] = min(bb[0], min(xs)), min(bb[1], min(zs))
        bb[2], bb[3] = max(bb[2], max(xs)), max(bb[3], max(zs))

        parts.append(
            {
                "id": p["id"],
                "heroId": p.get("hero_id"),
                "name": p.get("name_en") or p.get("name"),
                "partLabel": p.get("part_label"),
                "block": f"{block[0]}:{block[1]}",
                "family": family,
                "materialColor": colour,
                "yFrom": y_from,
                "yTo": y_to,
                # Carried, not summarised: the applier and any reviewer can see
                # which parts are a published dimension and which are a
                # silhouette somebody chose.
                "heightConfidence": p["height_confidence"],
                "heightSource": p.get("height_source"),
                "notMeasuredSurvey": bool(p.get("not_measured_survey")),
                "spans": spans,
                "blocks": span_volume(spans, y_to - y_from + 1),
                # True when the footprint was smaller than one block and got a
                # single column instead. Not a measured extent.
                "snappedToOneColumn": snapped,
            }
        )

    parts.sort(key=lambda x: (x["heroId"] or "", x["yFrom"]))
    by_conf: dict[str, int] = {}
    for part in parts:
        by_conf[part["heightConfidence"]] = by_conf.get(part["heightConfidence"], 0) + 1

    return {
        "generatedFrom": [
            "site/public/data/bkk-hero-monuments.geojson",
            "site/public/heritage-register.json",
        ],
        "world": WORLD_ID,
        "groundY": ground_y,
        "projection": "linear local, 1 block = 1 m, north = -Z (matches build-heritage-register.py to_block)",
        "palette": {
            "rule": "hue and lightness bands, see classify() — never a nearest-colour search",
            "families": {k: {"block": f"{v[0]}:{v[1]}", "why": FAMILY_NOTE[k]} for k, v in FAMILY_BLOCKS.items()},
            "colors": dict(sorted(palette.items())),
        },
        "counts": {
            "parts": len(parts),
            "snappedToOneColumn": sum(1 for p in parts if p["snappedToOneColumn"]),
            "refused": len(refused),
            "blocks": sum(p["blocks"] for p in parts),
            "byConfidence": dict(sorted(by_conf.items())),
        },
        "refused": refused,
        "heroBounds": {k: {"minX": v[0], "minZ": v[1], "maxX": v[2], "maxZ": v[3]} for k, v in sorted(hero_bounds.items())},
        "parts": parts,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ground-y", type=int, default=DEFAULT_GROUND_Y,
                    help=f"Y of the monument ground plane (default {DEFAULT_GROUND_Y}, Minecraft sea level)")
    ap.add_argument("--summary-only", action="store_true", help="print the summary without writing the plan")
    args = ap.parse_args()

    plan = build(args.ground_y)
    c = plan["counts"]

    # Written BEFORE the summary is printed. The summary is 40-odd lines, and
    # piping it through `head` closes the pipe mid-print, SIGPIPEs the process
    # and loses the artifact — which is how a stale plan got committed once
    # already. The side effect that matters should not be downstream of
    # anything as fragile as stdout.
    if not args.summary_only:
        OUT.write_text(json.dumps(plan, indent=1) + "\n")

    print(f"hero monument blocks: {c['parts']} parts, {c['blocks']:,} blocks, ground y={plan['groundY']}")
    for conf, n in c["byConfidence"].items():
        print(f"  {conf:<26} {n}")
    for colour, info in plan["palette"]["colors"].items():
        print(f"  {colour}  {info['family']:<12} -> {info['block']:<28} ({info['parts']} part(s))")
    if c["snappedToOneColumn"]:
        print(f"  {c['snappedToOneColumn']} sub-block part(s) snapped to one column (finials under 1 m)")
    for r in plan["refused"]:
        print(f"  REFUSED {r['id']}: {r['why']}")

    if args.summary_only:
        return 0
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1000:.0f} kB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
