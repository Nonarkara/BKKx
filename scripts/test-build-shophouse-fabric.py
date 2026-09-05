#!/usr/bin/env python3
"""Tests for build-shophouse-fabric.py.

The arithmetic lives in its own script so it can be tested without amulet
or a world file. What matters: the 4 m module, the firewall every five
bays, nothing ungraded, nothing built on a hero monument, and the
committed plan matching a fresh build.

Run:  python3 scripts/test-build-shophouse-fabric.py
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

spec = importlib.util.spec_from_file_location(
    "fabric", ROOT / "scripts/build-shophouse-fabric.py"
)
fab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fab)

import mc_blocks as mc  # noqa: E402

FAILED: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    if ok:
        print(f"  ok   {name}")
    else:
        FAILED.append(name)
        print(f"  FAIL {name}{': ' + detail if detail else ''}")


def test_module_is_the_legal_floor() -> None:
    check("3.8 m is one bay", fab.bay_count(3.8) == 1, str(fab.bay_count(3.8)))
    check("4.0 m is one bay", fab.bay_count(4.0) == 1)
    check("7.9 m is still one bay — two would be illegal", fab.bay_count(7.9) == 1)
    check("8.0 m is two bays", fab.bay_count(8.0) == 2)
    check("20 m is five bays", fab.bay_count(20.0) == 5)
    check("1.5 m is refused", fab.bay_count(1.5) == 0)


def test_storey_height_is_the_code() -> None:
    check("2 storeys are 6.5 m (3.5 + 3.0)", fab.height_m(2) == 6.5)
    check("3 storeys are 9.5 m", fab.height_m(3) == 9.5)
    n, grade = fab.storeys_of(4, None)
    check("Overture floors are used when present", n == 4 and grade == fab.CONFIDENCE_OVERTURE)
    n, grade = fab.storeys_of(None, None)
    check("unknown storeys default to 2, graded interpretive", n == 2 and grade == fab.CONFIDENCE_DEFAULT)


def test_scanline_still_fills_a_known_square() -> None:
    ring = [(0.0, 0.0), (10.0, 0.0), (10.0, 10.0), (0.0, 10.0)]
    spans = mc.row_spans(ring)
    check("shared scanline fills 10 rows of 10", len({z for z, _, _ in spans}) == 10)


def test_firewall_lands_on_every_fifth_bay() -> None:
    """A 20 m frontage is five 4 m bays; the wall after bay 5 is a firewall."""
    buildings = [{
        "cluster": "test",
        "frontageM": 20.0,
        "nBays": 5,
        "mx": 0.0,
        "my": 0.0,
        "rect": {"fu": 1.0, "fv": 0.0},
    }]
    fab.assign_row_bays(buildings)
    b = buildings[0]
    check("one 5-bay building is bays 1–5", b["rowBayFrom"] == 1 and b["rowBayTo"] == 5)
    check("and that right edge is a firewall slot", b["rowBayTo"] % fab.FIREWALL_EVERY_BAYS == 0)
    check("it is not over the 10-unit cap", b["overRowCap"] is False)


def test_over_cap_is_tagged_not_broken() -> None:
    buildings = []
    for i in range(12):
        buildings.append({
            "cluster": "long-row",
            "frontageM": 4.0,
            "nBays": 1,
            "mx": float(i * 4),
            "my": 0.0,
            "depthM": 12.0,
            "rect": {"fu": 1.0, "fv": 0.0, "du": 0.0, "dv": 1.0},
        })
    fab.assign_row_bays(buildings)
    check("a 12-unit run stays 12 units", buildings[0]["rowBays"] == 12, str(buildings[0]["rowBays"]))
    check("and every unit is tagged over-cap", all(b["overRowCap"] for b in buildings))
    check("the 10th unit is a firewall slot", buildings[9]["rowBayTo"] % 5 == 0)

    parallel = []
    for street in (0.0, 20.0):
        for i in range(4):
            parallel.append({
                "cluster": "block",
                "frontageM": 4.0,
                "nBays": 1,
                "mx": float(i * 4),
                "my": street,
                "depthM": 12.0,
                "rect": {"fu": 1.0, "fv": 0.0, "du": 0.0, "dv": 1.0},
            })
    fab.assign_row_bays(parallel)
    check("parallel streets do not become one row",
          max(b["rowBays"] for b in parallel) == 4,
          str(max(b["rowBays"] for b in parallel)))


def test_plan_is_inside_the_world_and_honest() -> None:
    plan = fab.build(fab.DEFAULT_GROUND_Y)
    world = json.loads((ROOT / "site/public/heritage-register.json").read_text())["worlds"][fab.WORLD_ID]
    max_x, max_z = world["blocks"]["maxX"], world["blocks"]["maxZ"]
    c = plan["counts"]

    check("most of the 2433 footprints fall in this world", c["inWorld"] > 1500, str(c["inWorld"]))
    check("every footprint is accounted for", c["outOfWorld"] + c["inWorld"] == c["input"],
          f"in={c['inWorld']} out={c['outOfWorld']} input={c['input']}")
    check("something was actually planned", c["buildings"] > 1000, str(c["buildings"]))
    check("both evidence grades are carried", set(c["byConfidence"]) <= {fab.CONFIDENCE_OVERTURE, fab.CONFIDENCE_DEFAULT})
    check("interpretive default is present — we did not pretend to know", fab.CONFIDENCE_DEFAULT in c["byConfidence"])

    outside = [
        b["id"] for b in plan["buildings"]
        for z, a, end in b["spans"]
        if not (0 <= z <= max_z and 0 <= a <= max_x and 0 <= end <= max_x)
    ]
    check("every body span is inside the world", not outside, f"{len(outside)} outside")

    ungraded = [b["id"] for b in plan["buildings"] if not b.get("heightConfidence")]
    check("no building is built without a storey grade", not ungraded)

    mismatched = [
        b["id"] for b in plan["buildings"]
        if b["blocks"] != (
            mc.span_volume(b["spans"], b["yTo"] - b["yFrom"] + 1)
            + mc.span_volume(b["partyWalls"], b["yTo"] - b["yFrom"] + 1)
            + mc.span_volume(b["firewalls"], b["yTo"] - b["yFrom"] + 1 + int(fab.FIREWALL_ABOVE_M))
        )
    ]
    check("stated volume matches the spans", not mismatched, str(mismatched[:3]))

    check("over-cap is a minority of the stock, not the whole city",
          c["overRowCap"] < c["buildings"] * 0.5,
          f"{c['overRowCap']}/{c['buildings']}")
    check("default storeys are 2", plan["module"]["defaultStoreys"] == 2)


def test_hero_columns_are_not_occupied() -> None:
    plan = fab.build(fab.DEFAULT_GROUND_Y)
    hero = json.loads((ROOT / "site/public/data/bkk-hero-monument-blocks.json").read_text())
    hero_cols = set()
    for part in hero["parts"]:
        hero_cols |= mc.columns_of(part["spans"])
    overlap = [
        b["id"]
        for b in plan["buildings"]
        if mc.columns_of(b["spans"]) & hero_cols
    ]
    check("no shophouse body sits on a hero-monument column", not overlap, str(overlap[:3]))
    check("the plan records how many hero columns were reserved", plan["counts"]["heroColumnsReserved"] == len(hero_cols))


def test_tanao_has_firewall_rhythm() -> None:
    """Tanao is the long two-storey street. If the firewall never fires there,
    the module is decoration."""
    plan = fab.build(fab.DEFAULT_GROUND_Y, cluster="tanao-road-rows")
    rows = plan["buildings"]
    check("Tanao is planned", len(rows) > 100, str(len(rows)))
    with_fire = sum(1 for b in rows if b["firewalls"])
    check("Tanao has firewalls", with_fire > 10, str(with_fire))
    two_storey = sum(1 for b in rows if b["storeys"] == 2)
    check("Tanao is mostly two storeys", two_storey > len(rows) * 0.4, f"{two_storey}/{len(rows)}")


def test_the_committed_plan_is_not_stale() -> None:
    """The guard the other tests cannot give.

    Everything above can call build() directly, so all of it passes while a
    committed plan on disk is a version older than the code. Same failure
    that shipped 78,399 hero blocks from before the fencepost fix.

    This reads the file and fails when it disagrees with a fresh build.
    """
    path = ROOT / "site/public/data/bkk-shophouse-fabric-blocks.json"
    check("the plan has been generated at all", path.exists(), str(path))
    if not path.exists():
        return
    committed = json.loads(path.read_text())
    fresh = fab.build(committed.get("groundY", fab.DEFAULT_GROUND_Y))
    check(
        "committed counts match a fresh build",
        committed["counts"] == fresh["counts"],
        f"committed={committed['counts']} fresh={fresh['counts']}",
    )
    check(
        "committed module matches a fresh build",
        committed["module"] == fresh["module"],
    )
    check(
        "every committed building matches a fresh build",
        committed["buildings"] == fresh["buildings"],
        "geometry or block choice has drifted — re-run build-shophouse-fabric.py",
    )


def main() -> int:
    for fn in (
        test_module_is_the_legal_floor,
        test_storey_height_is_the_code,
        test_scanline_still_fills_a_known_square,
        test_firewall_lands_on_every_fifth_bay,
        test_over_cap_is_tagged_not_broken,
        test_plan_is_inside_the_world_and_honest,
        test_hero_columns_are_not_occupied,
        test_tanao_has_firewall_rhythm,
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
