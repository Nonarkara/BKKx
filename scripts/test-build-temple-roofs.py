#!/usr/bin/env python3
"""Tests for site/scripts/build-temple-roofs.py.

What would be invisible and wrong: a temple drawn twice (its box, or its
landmark twin, still standing around the new roof); a roof taller or shorter
than the height the detail layer recorded (the form step quietly changing
evidence); a roof on a footprint that is not a hall; a roof on something a
hero model already replaced; and a committed file older than its inputs.

Run:  python3 scripts/test-build-temple-roofs.py
"""
from __future__ import annotations

import importlib.util
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
spec = importlib.util.spec_from_file_location("roofs", SITE / "scripts/build-temple-roofs.py")
R = importlib.util.module_from_spec(spec)
spec.loader.exec_module(R)

FAILED: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"  {'ok  ' if ok else 'FAIL'} {name}{'' if ok else ': ' + detail}")
    if not ok:
        FAILED.append(name)


def load():
    d = json.loads(R.DETAIL.read_text())["features"]
    l = json.loads(R.LANDMARKS.read_text())["features"]
    r = json.loads(R.OUT.read_text())
    return d, l, r


def roofed(p):
    return str(p.get("hidden_by", "")).startswith(R.TAG)


def test_each_building_is_drawn_once() -> None:
    d, l, r = load()
    roofed_ids = {f["properties"]["id"] for f in d if roofed(f["properties"])}
    sources = {f["properties"]["source_id"] for f in r["features"]}
    check("every roofed detail box has roof parts", roofed_ids <= sources, str(sorted(roofed_ids - sources)[:3]))
    check("every roof part belongs to a roofed (hidden) detail box", sources <= roofed_ids,
          str(sorted(sources - roofed_ids)[:3]))
    drawn_twins = [f["properties"]["id"] for f in l
                   if f["properties"]["id"] in roofed_ids and f["properties"].get("hide_3d") is not True]
    check("no roofed building's landmark twin is still drawn", not drawn_twins, str(drawn_twins[:3]))


def test_the_recorded_height_is_still_the_envelope() -> None:
    d, _, r = load()
    by_id = {f["properties"]["id"]: f["properties"] for f in d}
    parts = defaultdict(list)
    for f in r["features"]:
        parts[f["properties"]["source_id"]].append(f["properties"])
    bad_top, bad_src = [], []
    for sid, ps in parts.items():
        p = by_id[sid]
        top = R.H.detail_height(p)
        if abs(max(q["height"] for q in ps) - top) > 0.02:
            bad_top.append((sid, max(q["height"] for q in ps), top))
        if any(q["height_source"] != p.get("height_source") for q in ps):
            bad_src.append(sid)
    check("each roofed building tops out at the height the detail layer recorded", not bad_top, str(bad_top[:3]))
    check("each roof part carries its building's height_source", not bad_src, str(bad_src[:3]))
    stacked = [sid for sid, ps in parts.items()
               if any(b["base_height"] < a["base_height"] for a, b in zip(ps, ps[1:]))]
    check("parts are emitted bottom-up", not stacked, str(stacked[:3]))


def test_only_halls_chedis_and_documented_prangs_are_re_massed() -> None:
    d, _, r = load()
    kinds = {}
    for f in d:
        if roofed(f["properties"]):
            kind, why = R.classify(f)
            kinds[f["properties"]["id"]] = kind
            if kind is None:
                check(f"{f['properties']['id']} still qualifies", False, why)
                return
    check("every roofed footprint still passes its type test", True)
    prangs = {i for i, k in kinds.items() if k == "prang"}
    check("the eight Atthamaha prangs are prangs, and only they are", prangs == R.PRANG_IDS, str(sorted(prangs)))
    forms = {f["properties"]["form_confidence"] for f in r["features"]}
    check("every part is graded typology, never measurement", forms == {"typology"}, str(forms))


def test_hero_models_win() -> None:
    d, _, _ = load()
    hero_hidden_roofed = [f["properties"]["id"] for f in d
                          if f["properties"].get("hide_3d") and not roofed(f["properties"])
                          and f["properties"].get("hidden_by", "").startswith("temple-roof")]
    check("no flag is half-namespaced", not hero_hidden_roofed, str(hero_hidden_roofed[:3]))
    hero = {f["properties"]["id"] for f in d
            if f["properties"].get("hide_3d") and not roofed(f["properties"])
            and not str(f["properties"].get("hidden_by", "")).startswith("row-strip:")}
    _, _, r = load()
    overlap = hero & {f["properties"]["source_id"] for f in r["features"]}
    check("nothing a hero model replaced is also roofed", not overlap, str(sorted(overlap)[:3]))


def test_committed_files_are_current_and_the_tally_agrees() -> None:
    s = R.run(write=False)
    check("a re-run would change nothing", not s["stale"] and s["changed"] == 0, str(s))
    d, l, _ = load()
    tally = json.loads((SITE / "app/data/evidence-tally.json").read_text())
    want = {"detail": sum(1 for f in d if roofed(f["properties"])),
            "landmarkTwins": sum(1 for f in l if roofed(f["properties"]))}
    check("the evidence tally counts the roofed buildings the files hold", tally.get("roofed") == want,
          f"tally={tally.get('roofed')} files={want}")


def main() -> int:
    for fn in (test_each_building_is_drawn_once, test_the_recorded_height_is_still_the_envelope,
               test_only_halls_chedis_and_documented_prangs_are_re_massed, test_hero_models_win,
               test_committed_files_are_current_and_the_tally_agrees):
        print(f"\n{fn.__name__}")
        fn()
    print()
    if FAILED:
        print(f"{len(FAILED)} check(s) failed: {', '.join(FAILED)}")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
