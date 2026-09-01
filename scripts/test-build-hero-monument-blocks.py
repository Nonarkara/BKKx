#!/usr/bin/env python3
"""Tests for build-hero-monument-blocks.py.

The arithmetic lives in its own script precisely so it can be tested without
amulet-core or a world file. What matters here is that the plan lands where
the rest of the world already is, that nothing ungraded gets built, and that
the palette assignment is pinned so any change to it shows up in a diff.

Run:  python3 scripts/test-build-hero-monument-blocks.py
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

spec = importlib.util.spec_from_file_location(
    "hero_blocks", ROOT / "scripts/build-hero-monument-blocks.py"
)
hb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(hb)

FAILED: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    if ok:
        print(f"  ok   {name}")
    else:
        FAILED.append(name)
        print(f"  FAIL {name}{': ' + detail if detail else ''}")


def test_projection_agrees_with_the_register() -> None:
    """The decisive one.

    build-heritage-register.py already projected 311 monuments to block
    coordinates and committed the result. If this script's projection is the
    same one, feeding it a register monument's lat/lon must reproduce that
    monument's stored block — against a value computed by different code, on a
    different day, for a different purpose. A monument built 150 blocks off the
    city it stands in would look fine in isolation and be wrong on the ground.
    """
    reg = json.loads((ROOT / "site/public/heritage-register.json").read_text())
    world = reg["worlds"][hb.WORLD_ID]
    checked = 0
    exact = 0
    worst = 0.0
    for site in reg["sites"]:
        if site.get("world") != hb.WORLD_ID or "block" not in site:
            continue
        x, z = hb.project(site["lat"], site["lon"], world)
        dx = abs(round(x) - site["block"]["x"])
        dz = abs(round(z) - site["block"]["z"])
        worst = max(worst, dx, dz)
        exact += dx == 0 and dz == 0
        checked += 1
    # 96 of 105 land exactly; 9 differ by one block in one axis. That is not
    # a different projection — it is the register storing lat/lon rounded to
    # six decimal places (~0.11 m), which occasionally tips a coordinate
    # across a half-block rounding boundary. One block is the floor of what
    # this comparison can resolve, so that is what it asserts.
    check(
        f"projection reproduces {checked} committed register blocks within a block",
        checked > 50 and worst <= 1,
        f"checked={checked} worst drift={worst} blocks",
    )
    check(
        "and the great majority land exactly",
        exact / checked >= 0.9,
        f"{exact}/{checked} exact",
    )


def test_scanline_fills_a_known_square() -> None:
    """A 10x10 square must fill 10 rows of 10, not 11 of 11 nor 9 of 9."""
    ring = [(0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0)]
    spans = hb.row_spans(ring)
    rows = {z for z, _, _ in spans}
    widths = {(b - a + 1) for _, a, b in spans}
    check("a 10x10 ring fills 10 rows", len(rows) == 10, f"rows={sorted(rows)}")
    check("every row is 10 wide", widths == {10}, f"widths={widths}")
    check("volume of 10x10x5 is 500", hb.span_volume(spans, 5) == 500,
          str(hb.span_volume(spans, 5)))


def test_degenerate_geometry_is_refused_not_guessed() -> None:
    check("a two-point ring rasterises to nothing", hb.row_spans([(0.0, 0.0), (1.0, 1.0)]) == [])


def test_palette_assignment_is_pinned() -> None:
    """Every family, and the specific hues that decide the Thai reading.

    Pinned because the classifier is a rule over bands: a tweak to one band
    silently repaints a monument, and a green roof turning gold is the kind of
    thing nobody notices in a diff of hex codes.
    """
    cases = {
        "#4f8a68": "glaze_green",   # Wat Pho chedi roof tile
        "#3f7c62": "glaze_green",
        "#5279a5": "glaze_blue",    # blue glazed tile
        "#a95536": "terracotta",
        "#f4c84d": "gilt",          # gilded prang surface
        "#e4bd47": "gilt",
        "#eee7d5": "whitewash",     # whitewashed masonry
        "#e9ddc1": "whitewash",
        "#c5aa74": "plaster",       # plain plastered body
        "#d9c69f": "plaster",
    }
    for hexc, family in cases.items():
        got = hb.classify(hexc)
        check(f"{hexc} -> {family}", got == family, f"got {got}")
    check("every family has a block", set(hb.FAMILY_BLOCKS) == set(hb.FAMILY_NOTE))


def test_plan_is_whole_and_inside_the_world() -> None:
    plan = hb.build(hb.DEFAULT_GROUND_Y)
    world = json.loads((ROOT / "site/public/heritage-register.json").read_text())["worlds"][hb.WORLD_ID]
    max_x, max_z = world["blocks"]["maxX"], world["blocks"]["maxZ"]

    check("all 67 hero parts are planned", plan["counts"]["parts"] == 67, str(plan["counts"]))
    check("nothing was refused", plan["counts"]["refused"] == 0, str(plan["refused"]))

    outside = [
        p["id"] for p in plan["parts"]
        for z, a, b in p["spans"]
        if not (0 <= z <= max_z and 0 <= a <= max_x and 0 <= b <= max_x)
    ]
    check("every span is inside the world", not outside, f"{len(outside)} outside, e.g. {outside[:3]}")

    bad_y = [p["id"] for p in plan["parts"] if p["yTo"] < p["yFrom"]]
    check("no part has an inverted Y band", not bad_y, str(bad_y[:3]))

    ungraded = [p["id"] for p in plan["parts"] if not p.get("heightConfidence")]
    check("no part is built without a confidence grade", not ungraded, str(ungraded[:3]))

    # Sub-block finials are snapped, and the plan must admit it rather than
    # presenting a one-block column as a measured footprint.
    snapped = [p["id"] for p in plan["parts"] if p["snappedToOneColumn"]]
    check("sub-block finials are snapped, not dropped", len(snapped) == 2, str(snapped))
    check(
        "a snapped part is one column only",
        all(len(p["spans"]) == 1 and p["spans"][0][1] == p["spans"][0][2]
            for p in plan["parts"] if p["snappedToOneColumn"]),
    )

    mismatched = [
        p["id"] for p in plan["parts"]
        if p["blocks"] != hb.span_volume(p["spans"], p["yTo"] - p["yFrom"] + 1)
    ]
    check("stated volume matches the spans", not mismatched, str(mismatched[:3]))

    # The grading the atlas already publishes must survive into the plan.
    check(
        "the three evidence grades are carried, not flattened",
        plan["counts"]["byConfidence"] == {
            "interpretive-envelope": 44,
            "interpretive-proportion": 16,
            "official-envelope": 7,
        },
        str(plan["counts"]["byConfidence"]),
    )


def test_the_palace_actually_stacks() -> None:
    """The point of the exercise: a tiered spire, not a box.

    Phra Mondop is a seven-tier roof over a body. If the plan ever collapses to
    one band, the monument has become the thing this whole note exists to
    avoid.
    """
    plan = hb.build(hb.DEFAULT_GROUND_Y)
    mondop = [p for p in plan["parts"] if p["heroId"] == "grand-palace-phra-mondop"]
    mondop.sort(key=lambda p: p["yFrom"])
    check("Phra Mondop is built from 8 stacked parts", len(mondop) == 8, str(len(mondop)))

    contiguous = all(b["yFrom"] == a["yTo"] + 1 for a, b in zip(mondop, mondop[1:]))
    check("its parts stack without a gap or overlap", contiguous,
          str([(p["yFrom"], p["yTo"]) for p in mondop]))

    tapers = all(b["blocks"] <= a["blocks"] for a, b in zip(mondop, mondop[1:]))
    check("each tier is no wider than the one below", tapers,
          str([p["blocks"] for p in mondop]))

    families = {p["family"] for p in mondop}
    check("the roof reads as glazed tile over gilt, not one material",
          "glaze_green" in families and "gilt" in families, str(families))

    tallest = max(plan["parts"], key=lambda p: p["yTo"])
    check("Wat Arun's finial is the tallest thing in the world",
          tallest["heroId"] == "wat-arun-prang-group" and tallest["yTo"] - hb.DEFAULT_GROUND_Y == 81,
          f"{tallest['id']} top={tallest['yTo'] - hb.DEFAULT_GROUND_Y} m")


def test_the_committed_plan_is_not_stale() -> None:
    """The guard the other tests could not give.

    Everything above calls build() directly, so all of it passed while the
    committed plan on disk was a version older than the code — 78,399 blocks
    from before the scanline fencepost was fixed, with no snapped finials.
    A builder that is correct and an artifact that is stale look identical
    from inside the builder's own tests.

    So this one reads the file, and fails when it disagrees with what the
    current code produces. Same guard as verify-shophouse-pressure.mjs, for
    the same reason: a generated file nobody compares is a claim nobody
    checks.
    """
    path = ROOT / "site/public/data/bkk-hero-monument-blocks.json"
    check("the plan has been generated at all", path.exists(), str(path))
    if not path.exists():
        return

    committed = json.loads(path.read_text())
    fresh = hb.build(committed.get("groundY", hb.DEFAULT_GROUND_Y))

    check(
        "committed counts match a fresh build",
        committed["counts"] == fresh["counts"],
        f"committed={committed['counts']} fresh={fresh['counts']}",
    )
    check(
        "committed palette matches a fresh build",
        committed["palette"] == fresh["palette"],
    )
    check(
        "every committed part matches a fresh build",
        committed["parts"] == fresh["parts"],
        "part geometry or block choice has drifted — re-run build-hero-monument-blocks.py",
    )


def main() -> int:
    for fn in (
        test_projection_agrees_with_the_register,
        test_scanline_fills_a_known_square,
        test_degenerate_geometry_is_refused_not_guessed,
        test_palette_assignment_is_pinned,
        test_plan_is_whole_and_inside_the_world,
        test_the_palace_actually_stacks,
        test_the_committed_plan_is_not_stale,
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
