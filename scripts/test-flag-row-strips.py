#!/usr/bin/env python3
"""Tests for scripts/flag-row-strips.py.

A sliver is hidden, a thin-but-real row is kept, a hero's box is never
touched, and the committed file is exactly what the step writes.
Run from the repository root: python3 scripts/test-flag-row-strips.py
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "site" / "scripts"))

_spec = importlib.util.spec_from_file_location("flag_row_strips", ROOT / "site/scripts/flag-row-strips.py")
S = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(S)

_spec_h = importlib.util.spec_from_file_location("hide_under_heroes", ROOT / "site/scripts/hide-under-heroes.py")
H = importlib.util.module_from_spec(_spec_h)
_spec_h.loader.exec_module(H)

PASS = 0


def check(name: str, cond: bool) -> None:
    global PASS
    if not cond:
        raise SystemExit(f"FAIL: {name}")
    PASS += 1
    print(f"  ok: {name}")


def feat(fid: str, ring: list[list[float]], **props) -> dict:
    p = {"id": fid}
    p.update(props)
    return {"type": "Feature", "properties": p, "geometry": {"type": "Polygon", "coordinates": [ring]}}


def rect(x0: float, y0: float, x1: float, y1: float) -> list[list[float]]:
    return [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]


def sliver_ring() -> list[list[float]]:
    # A folded ribbon zigzagging across a ~107 x 100 m box: ~950 m² of
    # polygon inside a ~10,700 m² bounding box, like bkk-building-1524815659
    # (737 m² in 11,936 m²). The edges share near-one heading, the way a
    # tracing fragment folds back on itself.
    w, step, legs, ribbon = 0.001, 0.000045, 20, 0.000004
    ring = []
    for i in range(legs + 1):
        ring.append([w if i % 2 else 0.0, i * step])
    for i in range(legs, -1, -1):
        ring.append([w if i % 2 else 0.0, i * step + ribbon])
    ring.append(ring[0])
    return ring


def test_slivers_are_hidden_and_rows_are_kept() -> None:
    sliver = feat("sliver-1", sliver_ring())
    row = feat("row-1", rect(0.0, 0.0, 0.001, 0.0002))  # ~107 x 22 m, fill ~1
    long_row = feat("row-2", rect(0.0, 0.0, 0.003, 0.00015))  # ~320 x 17 m
    decisions, kept = S.decide([sliver, row, long_row])
    check("the sliver is hidden", decisions == {"sliver-1": "row-strip:sliver"})
    check("real rows are kept", kept == [])
    check("sliver geometry trips the rule", S.is_sliver(sliver))
    check("a 320 m row does not", not S.is_sliver(long_row))


def test_apply_only_manages_its_own_namespace() -> None:
    mine = feat("a", rect(0, 0, 0.001, 0.001), hide_3d=True, hidden_by="row-strip:sliver")
    hero = feat("b", rect(0, 0, 0.001, 0.001), hide_3d=True, hidden_by="grand-palace-siratana-chedi")
    hand = feat("c", rect(0, 0, 0.001, 0.001), hide_3d=True)
    feats = [mine, hero, hand]
    # The sliver moved on: its stale flag must clear, nothing else may move.
    changed = S.apply(feats, {})
    check("stale own flag clears", changed == 1 and "hide_3d" not in mine["properties"])
    check("hero flags are left alone", hero["properties"]["hidden_by"] == "grand-palace-siratana-chedi")
    check("hand-set flags are left alone", hand["properties"].get("hide_3d") is True)


def test_hide_under_heroes_preserves_the_row_strip_namespace() -> None:
    foreign = feat("s", rect(0, 0, 0.001, 0.001), hide_3d=True, hidden_by="row-strip:sliver")
    stale_hero = feat("h", rect(0, 0, 0.001, 0.001), hide_3d=True, hidden_by="retired-hero")
    feats = [foreign, stale_hero]
    H.apply(feats, {})
    check("data:hide keeps row-strip flags", foreign["properties"].get("hide_3d") is True)
    check("data:hide still clears its own stale flags", "hide_3d" not in stale_hero["properties"])


def test_the_rewrite_is_byte_stable_and_current() -> None:
    s = S.run(write=False)
    check("no drawn sliver survives", s["survivors"] == [])
    check("exactly the known sliver is hidden", s["hidden"] == 1)
    check("the committed file already carries it", s["rewritten"] is False)


def test_the_real_file_hides_exactly_the_known_sliver() -> None:
    obj = json.loads((ROOT / "site/public/data/bkk-heritage-detail.geojson").read_text(encoding="utf-8"))
    decisions, kept = S.decide(obj["features"])
    check(
        "the whole 9,275-footprint layer hides one sliver",
        decisions == {"bkk-building-1524815659": "row-strip:sliver"},
    )
    check("sixteen thin rows are reported and kept", len(kept) == 16)


def main() -> None:
    for fn in (
        test_slivers_are_hidden_and_rows_are_kept,
        test_apply_only_manages_its_own_namespace,
        test_hide_under_heroes_preserves_the_row_strip_namespace,
        test_the_rewrite_is_byte_stable_and_current,
        test_the_real_file_hides_exactly_the_known_sliver,
    ):
        fn()
    print(f"test-flag-row-strips: {PASS} checks passed")


if __name__ == "__main__":
    main()
