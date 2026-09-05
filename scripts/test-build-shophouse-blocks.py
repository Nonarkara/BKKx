#!/usr/bin/env python3
"""Tests for build-shophouse-blocks.py.

The fabric plan is 2,433 buildings and 2.37 million blocks, so nobody is going
to eyeball it. These check the things that would be invisible and wrong: the
join that has no shared key, the heights that come from a statute, the storeys
that are mostly unknown, and whether the committed artifact still matches the
code that claims to have produced it.

Run:  python3 scripts/test-build-shophouse-blocks.py
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def _load(name: str, rel: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / rel)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


sb = _load("shophouse_blocks", "scripts/build-shophouse-blocks.py")
applier = _load("applier", "scripts/apply-hero-monuments-to-world.py")

FAILED: list[str] = []
_PLAN: dict | None = None


def plan() -> dict:
    """Built once — the join reads 5.5 MB of geojson."""
    global _PLAN
    if _PLAN is None:
        _PLAN = sb.build(sb.DEFAULT_GROUND_Y)
    return _PLAN


def check(name: str, ok: bool, detail: str = "") -> None:
    if ok:
        print(f"  ok   {name}")
    else:
        FAILED.append(name)
        print(f"  FAIL {name}{': ' + detail if detail else ''}")


def test_the_keyless_join_loses_nothing() -> None:
    """The spine and the footprints share no id.

    They are matched on the centroid, which works only because the spine's
    lat/lon IS that centroid rounded to six places. If that ever stops being
    true the join degrades silently — some buildings simply stop existing —
    which is exactly how the cluster pages once lost 241 footprints to a
    rounded-centroid join and called it missing coverage.
    """
    joined, unmatched = sb.load_joined()
    spine = json.loads((ROOT / "site/public/data/shophouse-spine.json").read_text())
    check("every spine row finds a footprint", not unmatched,
          f"{len(unmatched)} unmatched, e.g. {unmatched[:3]}")
    check("the join is one-to-one with the spine", len(joined) == len(spine),
          f"joined={len(joined)} spine={len(spine)}")
    ids = {r["id"] for r, _ in joined}
    check("no spine row is joined twice", len(ids) == len(joined))


def test_height_comes_from_the_statute() -> None:
    """ข้อ 22(4): ground >= 3.50 m, every floor above >= 3.00 m."""
    check("a 1-storey building is 3.5 m", sb.storey_height_m(1) == 3.5)
    check("a 2-storey building is 6.5 m", sb.storey_height_m(2) == 6.5)
    check("a 5-storey building is 15.5 m", sb.storey_height_m(5) == 15.5)

    p = plan()
    check("the plan names the clause it used",
          "ข้อ 22(4)" in p["storeyRule"]["clause"], p["storeyRule"]["clause"])

    # Taller buildings must actually be taller — the flat-fabric failure this
    # whole script exists to avoid would show up as one distinct height.
    tops = {b["bands"][-1]["yTo"] for b in p["parts"]}
    check("the fabric has more than one roofline", len(tops) > 3, f"{len(tops)} distinct tops")


def test_assumed_storeys_are_never_disguised() -> None:
    p = plan()
    c = p["counts"]
    check("assumed and recorded sum to every building",
          c["storeysAssumed"] + c["storeysRecorded"] == c["buildings"], str(c))
    check("most storeys are assumed, and the plan says so",
          c["storeysAssumed"] > c["storeysRecorded"], str(c))

    for b in p["parts"]:
        if b["storeysAssumed"]:
            # An assumed height is the weaker grade, always, so the applier's
            # --min-confidence filter can exclude the guessed fabric wholesale.
            if b["heightConfidence"] != "interpretive-envelope":
                check(f"assumed building {b['id']} is graded weakest", False, b["heightConfidence"])
                return
            if "assumed" not in b["heightSource"]:
                check(f"assumed building {b['id']} says so in heightSource", False, b["heightSource"])
                return
    check("every assumed building is graded weakest and says why", True)


def test_every_building_is_three_bands_over_one_footprint() -> None:
    p = plan()
    # Three bands, except for a genuinely single-storey shophouse, which has
    # no upper floors to put a body band on. Five in the set are recorded as
    # one storey; asserting three bands for those would be asserting a floor
    # the survey says is not there.
    wrong = [
        b["id"] for b in p["parts"]
        if len(b["bands"]) != (3 if b["storeys"] > 1 else 2)
    ]
    check("bands match the storey count", not wrong,
          f"{len(wrong)} mismatched, e.g. {wrong[:3]}")
    check("single-storey buildings exist and have two bands",
          any(len(b["bands"]) == 2 and b["storeys"] == 1 for b in p["parts"]))

    b = next(x for x in p["parts"] if len(x["bands"]) == 3)
    labels = [x["partLabel"] for x in b["bands"]]
    check("the bands are in order", labels == ["shopfront", "body", "parapet"], str(labels))

    gaps = [
        x["id"] for x in p["parts"]
        if any(n["yFrom"] != c["yTo"] + 1 for c, n in zip(x["bands"], x["bands"][1:]))
    ]
    check("bands stack without a gap", not gaps, f"{len(gaps)} with gaps, e.g. {gaps[:3]}")

    distinct = {x["block"] for x in b["bands"]}
    check("the three bands are three different blocks", len(distinct) == 3, str(distinct))


def test_the_plan_lands_inside_the_world() -> None:
    p = plan()
    world = json.loads((ROOT / "site/public/heritage-register.json").read_text())["worlds"][sb.WORLD_ID]
    max_x, max_z = world["blocks"]["maxX"], world["blocks"]["maxZ"]
    outside = [
        b["id"] for b in p["parts"]
        for z, a, c in b["spans"]
        if not (0 <= z <= max_z and 0 <= a <= max_x and 0 <= c <= max_x)
    ]
    check("every footprint is inside the world", not outside,
          f"{len(outside)} outside, e.g. {outside[:3]}")
    check("nothing was refused", p["counts"]["refused"] == 0, str(p["refused"][:3]))
    # Every footprint is accounted for: built, outside the world, unmatched or
    # refused. A total that does not reconcile means some are simply gone.
    c = p["counts"]
    accounted = c["buildings"] + c["outsideWorld"] + c["unmatched"] + c["refused"]
    check("every one of the 2,433 footprints is accounted for", accounted == 2433, str(c))
    check("the ones outside this world are counted by district",
          c["outsideWorld"] == sum(p["outsideWorldByDistrict"].values()) and c["outsideWorld"] > 0,
          str(p["outsideWorldByDistrict"]))


def test_the_applier_expands_this_plan() -> None:
    """One applier, two plan shapes.

    The monument plan is per-part; this one is per-building with bands, which
    is what keeps it at 3.8 MB instead of 9.8. The applier normalises, so a
    change to either shape that the other cannot read must fail here rather
    than on somebody's world.
    """
    p = plan()
    flat = applier.normalise(p["parts"])
    check("normalising yields one part per band",
          len(flat) == sum(len(b["bands"]) for b in p["parts"]), str(len(flat)))
    check("no expanded part still carries a bands key",
          all("bands" not in f for f in flat))
    for key in ("heroId", "block", "yFrom", "yTo", "spans", "heightConfidence", "blocks"):
        if any(key not in f for f in flat[:50]):
            check(f"every expanded part carries {key}", False)
            return
    check("every expanded part carries what the applier writes", True)

    # And the monument plan must still pass through untouched.
    heroes = json.loads((ROOT / "site/public/data/bkk-hero-monument-blocks.json").read_text())
    check("the monument plan is unchanged by normalising",
          applier.normalise(heroes["parts"]) == heroes["parts"])


def test_the_committed_plan_is_not_stale() -> None:
    """Same guard as the monuments, for the same reason.

    Every other test here calls build() directly, so all of them would pass
    while the committed file was older than the code. That has already
    happened once in this repository.
    """
    path = ROOT / "site/public/data/bkk-shophouse-blocks.json"
    check("the plan has been generated", path.exists(), str(path))
    if not path.exists():
        return
    committed = json.loads(path.read_text())
    fresh = sb.build(committed.get("groundY", sb.DEFAULT_GROUND_Y))
    check("committed counts match a fresh build",
          committed["counts"] == fresh["counts"],
          f"committed={committed['counts']} fresh={fresh['counts']}")
    check("committed buildings match a fresh build",
          committed["parts"] == fresh["parts"],
          "geometry or banding has drifted — re-run build-shophouse-blocks.py")


def main() -> int:
    for fn in (
        test_the_keyless_join_loses_nothing,
        test_height_comes_from_the_statute,
        test_assumed_storeys_are_never_disguised,
        test_every_building_is_three_bands_over_one_footprint,
        test_the_plan_lands_inside_the_world,
        test_the_applier_expands_this_plan,
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
