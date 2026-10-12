#!/usr/bin/env python3
"""
cap-default-heights.py
----------------------
Keep a category default from contradicting the footprint it is applied to.

OpenStreetMap gives most Old Town religious buildings no height, so the
detail layer applies a default per type: 14 m for a `chapel`, 16-18 m for a
`temple`, 20 m for a `throne` hall. Applied to a hall that is right. Applied
to the 5 x 5 m pavilions around Wat Phra Kaew's ubosot it makes 14 m pillars
standing taller than the ubosot's own walls — the scale fault a reader sees
first.

THE RULE (typology, not measurement)
  A Thai hall's ridge rises about 1.25x its span (the short side of its
  footprint) above a plinth of about 2 m: Wat Phra Kaew's ubosot, ~16 m
  across, is 22 m to the ridge; a 5 m sala about 8 m. So a DEFAULT height is
  capped at max(4 m, 1.25 x span + 2 m).

WHAT IT TOUCHES
  Only category defaults on Thai religious and ceremonial buildings:
    height_source == "type-default" and building in TYPES, or
    height_source in DEFAULT_SOURCES (the curated per-type throne / viharn /
    ubosot heights, which are also a single number per category).
  Never an OSM-tagged height, an individually researched override, a chedi,
  a prasat or a mondop (their spires are meant to be tall), and never a
  shophouse — a 4 m-wide rowhouse three storeys tall is real.

PROVENANCE
  `height_source` is unchanged. The original default is kept in
  `type_default_height`; `height_cap` names the rule. Re-running recomputes
  from the original, so the file is a pure function of its inputs.

    python3 scripts/cap-default-heights.py           # write
    python3 scripts/cap-default-heights.py --check   # exit 1 if anything would change
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DETAIL = ROOT / "public/data/bkk-heritage-detail.geojson"
LANDMARKS = ROOT / "public/data/bkk-landmarks.geojson"

_spec = importlib.util.spec_from_file_location("temple_roofs", ROOT / "scripts/build-temple-roofs.py")
R = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(R)

TYPES = {"temple", "chapel", "shrine", "monastery", "pavilion", "religious"}
DEFAULT_SOURCES = {"throne", "viharn", "ubosot"}
RIDGE_PER_SPAN = 1.25
PLINTH_M = 2.0
FLOOR_M = 4.0
RULE = "type default capped at max(4 m, 1.25 x span + 2 m): a Thai hall's ridge rises ~1.25x its span"
# The atlas paint reads exactly 9 m as "no height" and substitutes the type
# default again, so a capped value must never land on 9.0.
SENTINEL = 9.0


def eligible(p: dict) -> bool:
    src = p.get("height_source")
    kind = p.get("building") or p.get("building_type")
    return (src == "type-default" and kind in TYPES) or src in DEFAULT_SOURCES


def cap_for(f: dict) -> float | None:
    ring = R.outer_ring(f.get("geometry") or {})
    if not ring or len(ring) < 4:
        return None
    pts, _ = R.frame(ring)
    _a, _cu, _cv, du, dv = R.min_rect(pts)
    span = min(du, dv)
    if span <= 0:
        return None
    return max(FLOOR_M, RIDGE_PER_SPAN * span + PLINTH_M)


def apply(f: dict) -> str:
    """'capped' | 'restored' | 'unchanged'."""
    p = f["properties"]
    if not eligible(p):
        return "unchanged"
    original = p.get("type_default_height")
    if original is None:
        original = R.H.detail_height(p)
    cap = cap_for(f)
    if cap is not None:
        cap = round(cap, 1)
    if cap is None or original <= cap:
        if "type_default_height" in p:
            p["height"] = p["render_height"] = original
            for k in ("type_default_height", "height_cap"):
                p.pop(k, None)
            return "restored"
        return "unchanged"
    h = cap
    if h == SENTINEL:
        h = SENTINEL - 0.1
    if p.get("height") == h and p.get("render_height") == h and p.get("type_default_height") == original:
        return "unchanged"
    p["type_default_height"] = original
    p["height"] = p["render_height"] = h
    p["height_cap"] = RULE
    return "capped"


def run(write: bool) -> dict:
    raw = DETAIL.read_bytes()
    detail = json.loads(raw)
    if R.dumps(detail, raw.endswith(b"\n")) != raw:
        raise SystemExit(f"{DETAIL.name}: cannot reproduce byte for byte; not rewriting it.")
    tally = {"capped": 0, "restored": 0, "unchanged": 0}
    for f in detail["features"]:
        tally[apply(f)] += 1
    capped_total = sum(1 for f in detail["features"] if "height_cap" in f["properties"])
    out = R.dumps(detail, raw.endswith(b"\n"))

    # The curated landmark layer repeats some of these buildings under the
    # same id. Where its height is the same category default the detail
    # record started from, it is the same unmeasured number and takes the
    # same cap; a landmark with its own researched height is left alone.
    capped = {f["properties"]["id"]: f["properties"] for f in detail["features"]
              if "height_cap" in f["properties"]}
    lraw = LANDMARKS.read_bytes()
    lobj = json.loads(lraw)
    if R.dumps(lobj, lraw.endswith(b"\n")) != lraw:
        raise SystemExit(f"{LANDMARKS.name}: cannot reproduce byte for byte; not rewriting it.")
    twins = 0
    for f in lobj["features"]:
        p = f["properties"]
        d = capped.get(p.get("id"))
        original = p.get("type_default_height", p.get("height"))
        if d and original == d["type_default_height"]:
            twins += 1
            if p.get("height") != d["height"] or p.get("height_cap") != RULE:
                p["type_default_height"], p["height"], p["height_cap"] = original, d["height"], RULE
        elif "type_default_height" in p:
            p["height"] = p.pop("type_default_height")
            p.pop("height_cap", None)
    lout = R.dumps(lobj, lraw.endswith(b"\n"))

    stale = out != raw or lout != lraw
    if write and out != raw:
        DETAIL.write_bytes(out)
    if write and lout != lraw:
        LANDMARKS.write_bytes(lout)
    return {"changedNow": tally["capped"] + tally["restored"], "cappedTotal": capped_total,
            "landmarkTwins": twins, "stale": stale}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    r = run(write=not a.check)
    print(f"cap-default-heights: {r['cappedTotal']} category defaults capped to their footprint "
          f"+ {r['landmarkTwins']} landmark twins ({r['changedNow']} detail records changed this run)")
    if a.check and r["stale"]:
        print("detail heights are stale — run scripts/cap-default-heights.py")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
