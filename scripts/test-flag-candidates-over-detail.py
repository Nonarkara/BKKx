#!/usr/bin/env python3
"""Tests for site/scripts/flag-candidates-over-detail.py.

What would be invisible and wrong: a candidate still extruded through an OSM
box (the double roofline the audit rendered), a flag naming a box the map does
not draw, a basis value the evidence ladder does not claim, a rewrite that is
not byte-stable, and a committed file older than the detail layer it was
derived from.

Run:  python3 scripts/test-flag-candidates-over-detail.py
"""
from __future__ import annotations

import copy
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


def _load(name: str, rel: str):
    spec = importlib.util.spec_from_file_location(name, SITE / rel)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


F = _load("flag_candidates", "scripts/flag-candidates-over-detail.py")
H = F.H

FAILED: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    if ok:
        print(f"  ok   {name}")
    else:
        FAILED.append(name)
        print(f"  FAIL {name}{': ' + detail if detail else ''}")


def load_all():
    cands = json.loads(F.CANDIDATES.read_text(encoding="utf-8"))["features"]
    detail = json.loads(F.DETAIL.read_text(encoding="utf-8"))["features"]
    return cands, detail


def test_no_candidate_is_extruded_through_a_drawn_box() -> None:
    cands, detail = load_all()
    drawn, grid = F.drawn_detail_index(detail)
    double = [c["properties"]["overture_id"] for c in cands
              if c["properties"].get("has_detail_box") is not True and F.box_under(c, drawn, grid)]
    check("every candidate standing on a drawn OSM footprint is flagged", not double,
          f"{len(double)} still double, e.g. {double[:3]}")
    flagged = sum(1 for c in cands if c["properties"].get("has_detail_box") is True)
    check("the flagged count is the 1,168 the audit counted, minus any box a hero now hides",
          1100 <= flagged <= 1168, str(flagged))


def test_every_flag_names_a_box_the_map_draws() -> None:
    cands, detail = load_all()
    by_id = {f["properties"]["id"]: f for f in detail}
    bad = []
    for c in cands:
        p = c["properties"]
        if p.get("has_detail_box") is not True:
            if "detail_box_id" in p:
                bad.append(f"{p['overture_id']}: id without flag")
            continue
        box = by_id.get(p.get("detail_box_id"))
        if box is None or not H.is_drawn("detail", box["properties"]) or not H.contains(H.centroid(c["geometry"]), box["geometry"]):
            bad.append(f"{p['overture_id']} -> {p.get('detail_box_id')}")
    check("each flag names an existing, drawn OSM footprint containing the candidate's centroid", not bad, "; ".join(bad[:3]))


def test_height_basis_is_on_the_ladder() -> None:
    cands, _ = load_all()
    tiers = (SITE / "app/data/evidence-tiers.ts").read_text(encoding="utf-8")
    claimed = set(re.findall(r'candidateBases: \[([^\]]*)\]', tiers))
    values = set()
    for group in claimed:
        values |= set(re.findall(r'"([a-z-]+)"', group))
    seen = {c["properties"].get("height_basis") for c in cands}
    check("every candidate carries a height_basis", None not in seen and "" not in seen, str(seen))
    check("every height_basis value is claimed by a tier in evidence-tiers.ts", seen <= values, f"seen={seen} ladder={values}")
    check("the two bases are the two the fabric plan grades", seen == {F.OVERTURE, F.MODAL}, str(seen))
    recorded = sum(1 for c in cands if F.storeys_recorded(c["properties"]))
    overture = sum(1 for c in cands if c["properties"].get("height_basis") == F.OVERTURE)
    check("overture-storeys is exactly the set with a recorded floor count", overture == recorded, f"{overture} vs {recorded}")


def test_flags_are_a_pure_function_and_byte_stable() -> None:
    s = F.run(write=False)
    check("the committed file would not change if the step ran again", not s["rewritten"], str(s))
    check("the step reports zero changes against the committed file", s["changed"] == 0, str(s["changed"]))
    raw = F.CANDIDATES.read_bytes()
    check("the file round-trips through the step's serialiser byte for byte",
          F.dumps(json.loads(raw), raw.endswith(b"\n")) == raw)
    # Hide a box and the candidate on it comes back into the extruded set.
    cands, detail = load_all()
    flagged = next(c for c in cands if c["properties"].get("has_detail_box") is True)
    box_id = flagged["properties"]["detail_box_id"]
    detail2 = copy.deepcopy(detail)
    for f in detail2:
        if f["properties"]["id"] == box_id:
            f["properties"]["hide_3d"] = True
    cands2 = copy.deepcopy(cands)
    F.apply(cands2, F.decide(cands2, detail2))
    p = next(c for c in cands2 if c["properties"]["overture_id"] == flagged["properties"]["overture_id"])["properties"]
    check("a box that stops being drawn releases its candidate to be extruded",
          "has_detail_box" not in p and "detail_box_id" not in p, str({k: p.get(k) for k in ("has_detail_box", "detail_box_id")}))


def test_the_tally_counts_only_extruded_candidates() -> None:
    tally = json.loads((SITE / "app/data/evidence-tally.json").read_text(encoding="utf-8"))
    cands, detail = load_all()
    extruded = [c for c in cands if c["properties"].get("has_detail_box") is not True]
    check("the tally's extruded-candidate count matches the file",
          tally.get("candidates", {}).get("extruded") == len(extruded), str(tally.get("candidates")))
    check("the tally's on-box count matches the file",
          tally.get("candidates", {}).get("onDetailBox") == len(cands) - len(extruded), str(tally.get("candidates")))
    check("candidateBases sums to the extruded count",
          sum(tally.get("candidateBases", {}).values()) == len(extruded), str(tally.get("candidateBases")))
    landmarks = json.loads((SITE / "public/data/bkk-landmarks.geojson").read_text(encoding="utf-8"))["features"]
    heroes = json.loads((SITE / "public/data/bkk-hero-monuments.geojson").read_text(encoding="utf-8"))["features"]
    drawn_detail = sum(1 for f in detail if f["properties"].get("hide_3d") is not True)
    drawn_landmarks = sum(1 for f in landmarks if f["properties"].get("hide_3d") is not True)
    check("the tally's total is every extruded feature across the four layers",
          tally["total"] == drawn_detail + drawn_landmarks + len(heroes) + len(extruded),
          f"total={tally['total']} expected={drawn_detail + drawn_landmarks + len(heroes) + len(extruded)}")


def main() -> int:
    for fn in (
        test_no_candidate_is_extruded_through_a_drawn_box,
        test_every_flag_names_a_box_the_map_draws,
        test_height_basis_is_on_the_ladder,
        test_flags_are_a_pure_function_and_byte_stable,
        test_the_tally_counts_only_extruded_candidates,
    ):
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
