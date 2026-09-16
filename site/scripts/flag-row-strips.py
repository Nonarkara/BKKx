#!/usr/bin/env python3
"""
flag-row-strips.py
------------------
Hide the footprint the atlas cannot draw honestly: the degenerate sliver.

The atlas extrudes 9,275 Old Town OSM footprints as opaque boxes. Most of
the long diagonal ones are honest — a whole shophouse row traced as one
terrace polygon, following a diagonal street (AUDIT-2026-09-16 found the
same for the candidates). One of them is not a building at all:

  * bkk-building-1524815659 — building=roof, 44 vertices, 737 m² of polygon
    inside an 11,936 m² bounding box. Forty-one of its edges share one
    heading; it is a near-zero-width sawtooth sliver, almost certainly a
    tracing fragment, extruded 9 m as if it were a building. MapLibre fills
    it as a diagonal shard across whatever stands behind it.

This step hides exactly that class: a simple Polygon ring whose polygon
area is under SLIVER_AREA_M2 while its bounding box covers more than
SLIVER_BBOX_M2. Sixteen thin-but-real rows (แถวเต๊งกลาง/ใน, ตึกยาว,
two Sam Phraeng strips, three ministry blocks and others — the full table
is in docs/row-strip-audit.md) are reported and kept: a whole row drawn as
one box is coarse, not false, and hiding one would leave a hole the
screened candidates do not cover.

Flags live under the `row-strip:` namespace so data:hide
(hide-under-heroes.py) knows they are foreign and leaves them alone, and
stale ones are cleared, so the file is a pure function of the detail
layer: running the step twice changes nothing. Runs in `npm run build` as
data:strips, after data:hide and before data:candidates (which only
extrudes what is still drawn) and data:evidence (which counts only that).

    python3 scripts/flag-row-strips.py            # rewrite
    python3 scripts/flag-row-strips.py --check    # exit 1 if it would change
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public/data"
DETAIL = DATA / "bkk-heritage-detail.geojson"

_spec = importlib.util.spec_from_file_location("hide_under_heroes", ROOT / "scripts/hide-under-heroes.py")
H = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(H)

NAMESPACE = "row-strip:"

# A sliver is 737 m² of polygon in an 11,936 m² box (the one found); the
# thinnest kept row is 1,733 m² in 8,927 m². The thresholds sit between
# those two measurements, not at round numbers anyone chose for comfort.
SLIVER_AREA_M2 = 1500.0
SLIVER_BBOX_M2 = 8000.0

# Thin whole-row strips are reported, never hidden. Same bbox floor as the
# sliver rule; the fill ceiling sits below the squarest kept row (0.38) and
# above every ministry block, so the report is stable, not curated.
STRIP_BBOX_M2 = 8000.0
STRIP_FILL = 0.35

LON_M = 107_000.0
LAT_M = 111_000.0


def ring_area_m2(ring: list[list[float]]) -> float:
    us = [p[0] * LON_M for p in ring]
    vs = [p[1] * LAT_M for p in ring]
    # math.fsum, not sum(): the committed files must not depend on which
    # interpreter generated them (AUDIT-2026-09-06.md, W5).
    return abs(math.fsum(us[i] * vs[i + 1] - us[i + 1] * vs[i] for i in range(len(ring) - 1)) / 2)


def bbox_area_m2(ring: list[list[float]]) -> float:
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return (max(xs) - min(xs)) * LON_M * (max(ys) - min(ys)) * LAT_M


def rings(geom: dict) -> list[list[list[float]]]:
    if geom.get("type") == "Polygon":
        return [geom["coordinates"][0]]
    return []


def is_sliver(feature: dict) -> bool:
    geom = feature.get("geometry") or {}
    rs = rings(geom)
    if len(rs) != 1 or len(rs[0]) < 4:
        return False
    ring = rs[0]
    return ring_area_m2(ring) < SLIVER_AREA_M2 and bbox_area_m2(ring) > SLIVER_BBOX_M2


def is_thin_strip(feature: dict) -> bool:
    geom = feature.get("geometry") or {}
    rs = rings(geom)
    if len(rs) != 1 or len(rs[0]) < 4:
        return False
    ring = rs[0]
    box = bbox_area_m2(ring)
    if box <= STRIP_BBOX_M2:
        return False
    fill = ring_area_m2(ring) / box
    return fill < STRIP_FILL


def decide(features: list[dict]) -> tuple[dict[str, str], list[str]]:
    """Returns (features to hide -> reason, thin strips kept and reported)."""
    hide: dict[str, str] = {}
    kept: list[str] = []
    for f in features:
        p = f.get("properties") or {}
        fid = p.get("id")
        if fid is None or not f.get("geometry"):
            continue
        if is_sliver(f):
            hide[fid] = f"{NAMESPACE}sliver"
        elif is_thin_strip(f):
            kept.append(fid)
    return hide, kept


def apply(features: list[dict], decisions: dict[str, str]) -> int:
    """Write this step's flags in; clear only this step's stale ones.

    A feature hidden under a hero model (hidden_by without our prefix) is
    never touched — that decision belongs to data:hide, which runs first
    and preserves this namespace in return.
    """
    changed = 0
    for f in features:
        p = f.setdefault("properties", {})
        want = decisions.get(p.get("id"))
        if want:
            if p.get("hide_3d") is not True or p.get("hidden_by") != want:
                p["hide_3d"] = True
                p["hidden_by"] = want
                changed += 1
        elif isinstance(p.get("hidden_by"), str) and p["hidden_by"].startswith(NAMESPACE):
            p.pop("hidden_by", None)
            p.pop("hide_3d", None)
            changed += 1
    return changed


def run(write: bool) -> dict:
    raw = DETAIL.read_bytes()
    obj = json.loads(raw)
    if H.dumps(obj, raw.endswith(b"\n")) != raw:
        raise SystemExit(f"{DETAIL.name}: cannot reproduce this file byte for byte; not rewriting it.")
    features = obj["features"]
    decisions, kept = decide(features)
    changed = apply(features, decisions)
    out = H.dumps(obj, raw.endswith(b"\n"))
    rewritten = out != raw
    if write and rewritten:
        DETAIL.write_bytes(out)
    # The post-condition, checked on the in-memory result whether or not it
    # was written: no drawn feature may still meet the sliver rule.
    survivors = [
        (f.get("properties") or {}).get("id")
        for f in features
        if is_sliver(f) and H.is_drawn("detail", f.get("properties") or {})
    ]
    return {
        "features": len(features),
        "hidden": sum(1 for f in features if ((f.get("properties") or {}).get("hidden_by") or "").startswith(NAMESPACE)),
        "keptStrips": sorted(kept),
        "changed": changed,
        "rewritten": rewritten,
        "survivors": survivors,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="do not write; exit 1 if the file would change")
    args = ap.parse_args()
    s = run(write=not args.check)
    print(f"flag-row-strips: {s['features']} detail footprints · "
          f"{s['hidden']} hidden as slivers · {len(s['keptStrips'])} thin rows kept and reported · "
          f"changed {s['changed']} · {'rewritten' if s['rewritten'] else 'unchanged'}")
    for fid in s["keptStrips"]:
        print(f"  kept row strip: {fid}")
    if s["survivors"]:
        print(f"surviving slivers still drawn: {' '.join(map(str, s['survivors']))}")
        return 1
    if args.check and s["rewritten"]:
        print("committed flags do not match the detail layer — run scripts/flag-row-strips.py")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
