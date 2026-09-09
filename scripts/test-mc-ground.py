#!/usr/bin/env python3
"""Tests for scripts/mc_ground.py and the appliers' use of it.

What would be invisible and wrong: a probe that reads a tower as the ground,
one that trusts a missing chunk, a re-base that leaves one y field behind,
and an applier that prints a probed ground and then writes at the plan's.

Run:  python3 scripts/test-mc-ground.py
"""
from __future__ import annotations

import importlib.util
import json
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# The appliers import amulet lazily, inside apply(), so that --dry-run and
# these tests need no world editor. apply() itself does need a Block class;
# where amulet is absent (CI, this sandbox) a stub with the one attribute the
# fake level records stands in for it.
try:
    import amulet.api.block  # noqa: F401
except ImportError:
    class _StubBlock:
        def __init__(self, namespace: str, base_name: str):
            self.namespace, self.base_name = namespace, base_name

    _amulet = types.ModuleType("amulet")
    _api = types.ModuleType("amulet.api")
    _block = types.ModuleType("amulet.api.block")
    _block.Block = _StubBlock
    _amulet.api, _api.block = _api, _block
    sys.modules.update({"amulet": _amulet, "amulet.api": _api, "amulet.api.block": _block})


def _load(name: str, rel: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / rel)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


G = _load("mc_ground", "scripts/mc_ground.py")
hero_applier = _load("hero_applier", "scripts/apply-hero-monuments-to-world.py")
fabric_applier = _load("fabric_applier", "scripts/apply-shophouse-fabric-to-world.py")

FAILED: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    if ok:
        print(f"  ok   {name}")
    else:
        FAILED.append(name)
        print(f"  FAIL {name}{': ' + detail if detail else ''}")


class _Block:
    def __init__(self, name: str):
        self.base_name = name


class FakeLevel:
    """A superflat: stone up to `surface`, air above, except `towers` —
    columns with a block on top to `tower_top` — and `missing` chunks."""

    def __init__(self, surface: int, towers: dict | None = None, missing: set | None = None):
        self.surface = surface
        self.towers = towers or {}
        self.missing = missing or set()
        self.writes: list[tuple[int, int, int, str]] = []

    def get_version_block(self, x, y, z, dimension, version):
        if (x, z) in self.missing:
            raise KeyError("chunk not generated")
        top = self.towers.get((x, z), self.surface)
        return (_Block("stone" if y <= top else "air"), None)

    def set_version_block(self, x, y, z, dimension, version, block, entity):
        if (x, z) in self.missing:
            raise KeyError("chunk not generated")
        self.writes.append((x, y, z, getattr(block, "base_name", str(block))))


def test_the_probe_reads_the_street_not_the_tower() -> None:
    cols = G.sample_columns(3383, 3216, per_axis=4)
    check("the sample grid is inset from the world edge", all(0 < x < 3383 and 0 < z < 3216 for x, z in cols))
    level = FakeLevel(surface=-62, towers={cols[0]: 40, cols[1]: 12})
    p = G.probe_ground(level, cols)
    check("an Arnis superflat with a −62 surface gives a ground plane of −61", p["groundY"] == -61, str(p))
    check("two towers in sixteen columns do not move the mode", p["agreement"] == 14 / 16, str(p["agreement"]))
    level = FakeLevel(surface=63)
    check("a vanilla superflat with a 63 surface gives 64", G.probe_ground(level, cols)["groundY"] == 64)


def test_missing_chunks_are_counted_not_trusted() -> None:
    cols = G.sample_columns(3383, 3216, per_axis=4)
    level = FakeLevel(surface=-62, missing=set(cols[:6]))
    p = G.probe_ground(level, cols)
    check("missing chunks are counted and skipped", p["missing"] == 6 and p["groundY"] == -61, str(p))
    level = FakeLevel(surface=-62, missing=set(cols))
    try:
        G.probe_ground(level, cols)
        check("a world with no generated chunk at any sample refuses rather than guesses", False)
    except SystemExit:
        check("a world with no generated chunk at any sample refuses rather than guesses", True)


def test_rebase_moves_every_y_field() -> None:
    items = [{"yFrom": 64, "yTo": 75, "blocks": 1}, {"yFrom": 76, "yTo": 80}]
    n = G.rebase(items, -125)
    check("every item is shifted", n == 2 and items[0]["yFrom"] == -61 and items[1]["yTo"] == -45, str(items))
    check("a zero delta touches nothing", G.rebase(items, 0) == 0)


def test_the_hero_applier_writes_at_the_probed_ground() -> None:
    plan = hero_applier.load_plan(hero_applier.PLAN)
    parts = [p for p in plan["parts"] if p["heroId"] == "grand-palace-siratana-chedi"]
    plan_ground = plan["groundY"]
    # A world whose ground is 72 blocks above what the plan assumed.
    level = FakeLevel(surface=plan_ground + 71)
    ground, how = hero_applier.rebase_plan(plan, parts, level, override=None, probe=True)
    check("the applier re-bases onto the probed ground", ground == plan_ground + 72, how)
    check("the plan's groundY now says what was probed", plan["groundY"] == ground)
    lowest = min(p["yFrom"] for p in parts)
    check("the lowest part now starts on the probed ground plane", lowest == ground, str(lowest))
    hero_applier.apply(level, parts, plan, skirt=0, dry_run=False)
    ys = sorted({y for _, y, _, _ in level.writes if _ != "air"})
    written = [y for x, y, z, name in level.writes if name != "air"]
    check("every block written sits on or above the probed ground", min(written) == ground, str(min(written)))
    check("the clear pass starts at the probed ground too",
          min(y for _, y, _, name in level.writes if name == "air") == ground)


def test_the_fabric_applier_writes_at_the_probed_ground() -> None:
    plan = fabric_applier.load_plan(fabric_applier.PLAN)
    buildings = fabric_applier.select(plan, ["tha-tien"], None)
    plan_ground = plan["groundY"]
    level = FakeLevel(surface=plan_ground + 71)
    ground, how = fabric_applier.rebase_plan(plan, buildings, level, override=None, probe=True)
    check("the fabric applier re-bases onto the probed ground", ground == plan_ground + 72, how)
    fabric_applier.apply(level, buildings, plan, dry_run=False)
    written = [y for _, y, _, name in level.writes if name != "air"]
    check("the lowest fabric block sits on the probed ground plane", min(written) == ground, str(min(written)))


def test_an_override_beats_the_probe_and_no_probe_trusts_the_plan() -> None:
    plan = hero_applier.load_plan(hero_applier.PLAN)
    parts = plan["parts"][:3]
    level = FakeLevel(surface=100)
    ground, how = hero_applier.rebase_plan(plan, parts, level, override=-61, probe=True)
    check("--ground-y wins over the probe", ground == -61 and "given" in how, how)
    plan = hero_applier.load_plan(hero_applier.PLAN)
    ground, how = hero_applier.rebase_plan(plan, plan["parts"][:3], level, override=None, probe=False)
    check("--no-probe builds at the plan's own ground", ground == plan["groundY"] and "not probed" in how, how)


def test_the_plans_default_to_the_generator_ground() -> None:
    for rel in ("site/public/data/bkk-hero-monument-blocks.json", "site/public/data/bkk-shophouse-fabric-blocks.json"):
        plan = json.loads((ROOT / rel).read_text())
        check(f"{Path(rel).name} is committed at Arnis's ground plane, not sea level",
              plan["groundY"] == -61, str(plan["groundY"]))


def main() -> int:
    for fn in (
        test_the_probe_reads_the_street_not_the_tower,
        test_missing_chunks_are_counted_not_trusted,
        test_rebase_moves_every_y_field,
        test_the_hero_applier_writes_at_the_probed_ground,
        test_the_fabric_applier_writes_at_the_probed_ground,
        test_an_override_beats_the_probe_and_no_probe_trusts_the_plan,
        test_the_plans_default_to_the_generator_ground,
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
