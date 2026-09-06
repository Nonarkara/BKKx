#!/usr/bin/env python3
"""
flag-candidates-over-detail.py
------------------------------
Say, per screened shophouse, whether an OSM footprint already stands on it.

The atlas extrudes the 2,433 screened rowhouse candidates at the statutory
storey height — MR55 ข้อ 22(4): 3.5 m ground floor, 3 m per floor above — from
Overture's `num_floors` where it records one and two storeys where it does
not. It also extrudes the 9,275 Old Town OSM footprints. 1,168 candidates lie
inside one of those footprints and the two heights never agree, one being a
tag and the other a formula, so those buildings were drawn twice as two boxes
of different heights (AUDIT-2026-09-06.md §2.2).

This step settles which representation is drawn. For every candidate:

  * `height_basis` — "overture-storeys" when Overture records a floor count,
    "modal-storeys" when the two-storey default is used. Always written, so
    the evidence ladder can grade the two as the different facts they are.
  * `has_detail_box` + `detail_box_id` — set when the candidate's centroid
    lies inside an OSM footprint the atlas draws (not hidden under a hero
    model, taller than zero). The atlas then extrudes the OSM footprint,
    whose height already sits on the evidence ladder, and draws the candidate
    as an outline only. Stale flags are cleared, so the file is a pure
    function of the two layers and running the step twice changes nothing.

The candidates file is generated from Overture by build-rowhouse-footprints.py,
which needs the network; this step post-processes the committed file and
rewrites it in its own serialisation, refusing a file it cannot reproduce
byte for byte first. Runs in `npm run build` as data:candidates, after
data:hide (which decides what the detail layer draws) and before
data:evidence (which counts only what is extruded).

    python3 scripts/flag-candidates-over-detail.py            # rewrite
    python3 scripts/flag-candidates-over-detail.py --check    # exit 1 if it would change
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public/data"
CANDIDATES = DATA / "bangkok-rowhouse-footprint-candidates.geojson"
DETAIL = DATA / "bkk-heritage-detail.geojson"

# The geometry and the ported "what the map draws" rules live in the sibling
# step, so there is one implementation of each.
_spec = importlib.util.spec_from_file_location("hide_under_heroes", ROOT / "scripts/hide-under-heroes.py")
H = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(H)

# Pinned by app/data/evidence-tiers.ts (candidateBases) and by the tally's
# build-time guard: a value not on the ladder fails the build.
OVERTURE = "overture-storeys"
MODAL = "modal-storeys"


def storeys_recorded(p: dict) -> bool:
    try:
        return float(p.get("num_floors") or 0) > 0
    except (TypeError, ValueError):
        return False


def drawn_detail_index(detail: list[dict]) -> tuple[list[dict], dict]:
    """The detail features the map draws, gridded by 1e-3° cell for lookup."""
    drawn = [f for f in detail if f.get("geometry") and H.is_drawn("detail", f.get("properties") or {})]
    grid: dict[tuple[int, int], list[int]] = {}
    for i, f in enumerate(drawn):
        x0, y0, x1, y1 = H.bbox(f["geometry"])
        for gx in range(int(x0 * 1000), int(x1 * 1000) + 1):
            for gy in range(int(y0 * 1000), int(y1 * 1000) + 1):
                grid.setdefault((gx, gy), []).append(i)
    return drawn, grid


def box_under(candidate: dict, drawn: list[dict], grid: dict) -> str | None:
    pt = H.centroid(candidate["geometry"])
    for i in grid.get((int(pt[0] * 1000), int(pt[1] * 1000)), []):
        if H.contains(pt, drawn[i]["geometry"]):
            return drawn[i]["properties"].get("id")
    return None


def decide(candidates: list[dict], detail: list[dict]) -> dict[str, dict]:
    """overture_id -> the properties this step owns."""
    drawn, grid = drawn_detail_index(detail)
    out = {}
    for c in candidates:
        p = c["properties"]
        box = box_under(c, drawn, grid)
        out[p["overture_id"]] = {
            "height_basis": OVERTURE if storeys_recorded(p) else MODAL,
            "has_detail_box": True if box else None,
            "detail_box_id": box,
        }
    return out


def apply(candidates: list[dict], decisions: dict[str, dict]) -> int:
    changed = 0
    for c in candidates:
        p = c["properties"]
        want = decisions[p["overture_id"]]
        for key, value in want.items():
            if value is None:
                if key in p:
                    del p[key]
                    changed += 1
            elif p.get(key) != value:
                p[key] = value
                changed += 1
    return changed


def dumps(obj: dict, trailing_newline: bool) -> bytes:
    return (json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + ("\n" if trailing_newline else "")).encode("utf-8")


def run(write: bool) -> dict:
    raw = CANDIDATES.read_bytes()
    obj = json.loads(raw)
    if dumps(obj, raw.endswith(b"\n")) != raw:
        raise SystemExit(f"{CANDIDATES.name}: cannot reproduce this file byte for byte; not rewriting it.")
    detail = json.loads(DETAIL.read_text(encoding="utf-8"))["features"]
    candidates = obj["features"]
    decisions = decide(candidates, detail)
    changed = apply(candidates, decisions)
    out = dumps(obj, raw.endswith(b"\n"))
    rewritten = out != raw
    if write and rewritten:
        CANDIDATES.write_bytes(out)
    on_box = sum(1 for d in decisions.values() if d["has_detail_box"])
    return {
        "candidates": len(candidates),
        "overtureStoreys": sum(1 for d in decisions.values() if d["height_basis"] == OVERTURE),
        "modalStoreys": sum(1 for d in decisions.values() if d["height_basis"] == MODAL),
        "onDetailBox": on_box,
        "extruded": len(candidates) - on_box,
        "changed": changed,
        "rewritten": rewritten,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="do not write; exit 1 if the file would change")
    args = ap.parse_args()
    s = run(write=not args.check)
    print(f"flag-candidates-over-detail: {s['candidates']} candidates · "
          f"{s['overtureStoreys']} with Overture storeys, {s['modalStoreys']} at the modal default · "
          f"{s['onDetailBox']} stand on a drawn OSM footprint and are outlined only, {s['extruded']} extruded · "
          f"changed {s['changed']} · {'rewritten' if s['rewritten'] else 'unchanged'}")
    if args.check and s["rewritten"]:
        print("committed flags do not match the detail layer — run scripts/flag-candidates-over-detail.py")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
