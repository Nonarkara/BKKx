#!/usr/bin/env python3
"""End-to-end tests for the world pipeline: build a world, write into it, read it back.

Every other test in this repository checks the arithmetic that produces a
placement plan. None of them could tell you whether writing that plan puts a
block in a world, because until now no applier had ever been run against one
(AUDIT-2026-09-06.md, disposition). That is a different claim, and it rests on
things arithmetic cannot check: amulet's API, the game-version tuple, the
dimension name, the world's declared height, and whether `save()` reaches disk.

So these build a fixture world (scripts/make-fixture-world.py), run the
appliers into it, close it, REOPEN it, and read the blocks back out. Reading
the level that did the writing proves only that the writes reached memory —
which is exactly how a world can be reported built and be empty.

Needs amulet-core. Without it, this exits 0 and says it was skipped: the
local gates must stay runnable, and CI installs it so this actually runs.

Run:  python3 scripts/test-apply-to-fixture-world.py
"""
from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

HERO = "grand-palace-siratana-chedi"
# One building in a 19x11 footprint — the cheapest cluster that still has a
# body, a party wall and a roof course to disagree about.
CLUSTER = "memorial-bridge-rows"
DIMENSION = "minecraft:overworld"
VERSION = ("java", (1, 21, 4))
SURFACE = -62          # where Arnis puts these worlds
GROUND = SURFACE + 1   # the first air block above it

FAILED: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    if ok:
        print(f"  ok   {name}")
    else:
        FAILED.append(name)
        print(f"  FAIL {name}{': ' + detail if detail else ''}")


def _load(name: str, rel: str):
    spec = importlib.util.spec_from_file_location(name, ROOT / rel)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


fixture = _load("fixture", "scripts/make-fixture-world.py")
G = _load("mc_ground", "scripts/mc_ground.py")
hero_applier = _load("hero_applier", "scripts/apply-hero-monuments-to-world.py")
fabric_applier = _load("fabric_applier", "scripts/apply-shophouse-fabric-to-world.py")


def build_fixture(tmp: Path, name: str, bbox, surface: int = SURFACE):
    return fixture.build(tmp / name, bbox, surface, margin=4, overwrite=True)


def blocks_at(level, x: int, z: int, y_from: int, y_to: int) -> list[str]:
    return [G.block_name(level, x, y, z) or "?" for y in range(y_from, y_to + 1)]


def test_the_fixture_world_is_the_world_it_says() -> None:
    import amulet  # noqa: PLC0415

    with tempfile.TemporaryDirectory() as td:
        r = build_fixture(Path(td), "w", fixture.hero_bbox(HERO))
        check("the fixture declares the 1.18+ overworld height, not the old 0..256",
              "-64" in r["bounds"] and "320" in r["bounds"], r["bounds"])
        check("its surface is stone where asked", r["readBack"] == "minecraft:stone", r["readBack"])
        level = amulet.load_level(r["path"])
        try:
            check("the declared bounds contain the plan's ground plane",
                  G.world_bounds(level)[0] <= GROUND, str(G.world_bounds(level)))
            spans = [s for p in json.loads(hero_applier.PLAN.read_text())["parts"]
                     if p["heroId"] == HERO for s in p["spans"]]
            probe = G.probe_ground(level, G.sample_around(spans))
            check("probing it finds the ground the fixture was built with",
                  probe["groundY"] == GROUND and probe["agreement"] == 1.0, str(probe)[:120])
        finally:
            level.close()


def test_a_monument_stands_in_the_world_and_tapers() -> None:
    """The one that could not be asserted before: read the chedi back out."""
    import amulet  # noqa: PLC0415

    with tempfile.TemporaryDirectory() as td:
        r = build_fixture(Path(td), "w", fixture.hero_bbox(HERO))
        plan = hero_applier.load_plan(hero_applier.PLAN)
        parts = hero_applier.plan_for(plan, [HERO], None)
        level = amulet.load_level(r["path"])
        try:
            ground, _ = hero_applier.rebase_plan(plan, parts, level, None, probe=True)
            check("the applier re-bases onto the fixture's ground", ground == GROUND, str(ground))
            _, written, failed, writes = hero_applier.apply(level, parts, plan, skirt=1, dry_run=False)
            check("nothing failed to write", failed == 0, str(failed))
            level.save()
        finally:
            level.close()

        level = amulet.load_level(r["path"])
        try:
            v = G.verify_written(level, G.sample_writes(writes))
            check("every sampled block is on disk after a reopen",
                  v["ok"] == v["sampled"] and v["sampled"] >= 200, str(v)[:160])

            ordered = sorted(parts, key=lambda p: p["yFrom"])
            check("the monument's lowest course sits on the ground plane",
                  ordered[0]["yFrom"] == GROUND, str(ordered[0]["yFrom"]))

            # A column through the middle of the plinth: stone, then the
            # monument's own block, with no air gap where it meets the ground.
            z, a, b = ordered[0]["spans"][len(ordered[0]["spans"]) // 2]
            x = (a + b) // 2
            column = blocks_at(level, x, z, GROUND - 1, GROUND + 1)
            check("stone, then monument, with no gap at the ground",
                  column[0] == "stone" and column[1] != "air" and column[1] != "stone", str(column))

            # Each tier no wider than the one below — a chedi, not a crate.
            widths = []
            for part in ordered:
                n = sum(1 for zz, aa, bb in part["spans"] for xx in range(aa, bb + 1)
                        if G.block_name(level, xx, part["yFrom"], zz) not in (None, "air"))
                widths.append(n)
            check("every tier read back is no wider than the one below it",
                  all(x1 <= x0 for x0, x1 in zip(widths, widths[1:])), str(widths))
            check("and it does taper — the finial is far narrower than the plinth",
                  widths[-1] * 8 < widths[0], str(widths))

            top = max(p["yTo"] for p in parts)
            check("the air above the finial is air",
                  G.block_name(level, x, top + 1, z) == "air")
        finally:
            level.close()


def test_the_fabric_lands_and_the_firewall_clears_the_roof() -> None:
    import amulet  # noqa: PLC0415

    with tempfile.TemporaryDirectory() as td:
        r = build_fixture(Path(td), "w", fixture.cluster_bbox(CLUSTER))
        plan = fabric_applier.load_plan(fabric_applier.PLAN)
        buildings = fabric_applier.select(plan, [CLUSTER], None)
        check("the cluster has buildings to write", len(buildings) >= 1, str(len(buildings)))
        level = amulet.load_level(r["path"])
        try:
            ground, _ = fabric_applier.rebase_plan(plan, buildings, level, None, probe=True)
            check("the fabric applier re-bases onto the fixture's ground", ground == GROUND, str(ground))
            _, _, failed, writes = fabric_applier.apply(level, buildings, plan, dry_run=False)
            check("nothing failed to write", failed == 0, str(failed))
            level.save()
        finally:
            level.close()

        level = amulet.load_level(r["path"])
        try:
            v = G.verify_written(level, G.sample_writes(writes))
            check("every sampled fabric block is on disk after a reopen",
                  v["ok"] == v["sampled"], str(v)[:160])

            b = buildings[0]
            z, a, c = b["spans"][0]
            check("the shopfront course sits on the ground plane",
                  G.block_name(level, (a + c) // 2, b["yFrom"], z) not in (None, "air"),
                  str(b["yFrom"]))
            check("the roof course is the roof block",
                  G.block_name(level, (a + c) // 2, b["yTo"], z) ==
                  b["roofBlock"].split(":", 1)[-1],
                  str(G.block_name(level, (a + c) // 2, b["yTo"], z)))
            fw = [x for x in buildings if x["firewalls"]]
            if fw:
                w = fw[0]
                z, a, c = w["firewalls"][0]
                check("a firewall stands one course above its roof",
                      G.block_name(level, a, w["yTo"] + 1, z) == w["firewallBlock"].split(":", 1)[-1],
                      str(G.block_name(level, a, w["yTo"] + 1, z)))
            else:
                check("this cluster has no firewall to check (party walls only)", True)
        finally:
            level.close()


def test_a_world_too_shallow_for_the_plan_is_refused() -> None:
    """The silent failure the guard exists for.

    amulet accepts a write outside the world's declared height and drops the
    sub-chunk on save. Measured here rather than assumed: without the guard
    the applier reports every block written and the world receives none.
    """
    import amulet  # noqa: PLC0415
    from amulet_nbt import load as nbt_load  # noqa: PLC0415

    with tempfile.TemporaryDirectory() as td:
        r = build_fixture(Path(td), "w", fixture.hero_bbox(HERO))
        tag = nbt_load(str(Path(r["path"]) / "level.dat"))
        dims = tag.compound.get_compound("Data").get_compound("WorldGenSettings").get_compound("dimensions")
        for name in list(dims.keys()):
            del dims[name]["type"]
        tag.save_to(str(Path(r["path"]) / "level.dat"))

        level = amulet.load_level(r["path"])
        try:
            bounds = G.world_bounds(level)
            check("a world that does not declare its height reads as the pre-1.18 range",
                  bounds == (0, 256), str(bounds))
            try:
                G.assert_fits(level, GROUND, GROUND + 40)
                check("assert_fits refuses a plan the world cannot hold", False, "it did not refuse")
            except SystemExit as e:
                check("assert_fits refuses a plan the world cannot hold",
                      "dropped by the save" in str(e), str(e)[:80])

            # And the reason it must: the write is accepted and then lost.
            from amulet.api.block import Block  # noqa: PLC0415
            level.set_version_block(r["bbox"][0], GROUND, r["bbox"][1], DIMENSION, VERSION,
                                    Block("minecraft", "gold_block"), None)
            level.save()
        finally:
            level.close()
        level = amulet.load_level(r["path"])
        try:
            got = G.block_name(level, r["bbox"][0], GROUND, r["bbox"][1])
            check("a write below a shallow world's floor is accepted and then silently lost",
                  got != "gold_block", f"got {got}")
        finally:
            level.close()


def test_the_command_line_runs_and_says_what_it_verified() -> None:
    with tempfile.TemporaryDirectory() as td:
        world = Path(td) / "w"
        build = subprocess.run(
            [sys.executable, str(ROOT / "scripts/make-fixture-world.py"),
             "--out", str(world), "--hero", HERO, "--overwrite"],
            capture_output=True, text=True)
        check("make-fixture-world exits 0", build.returncode == 0, build.stderr[-200:])
        run = subprocess.run(
            [sys.executable, str(ROOT / "scripts/apply-hero-monuments-to-world.py"),
             "--world", str(world), "--hero", HERO],
            capture_output=True, text=True)
        check("the applier exits 0", run.returncode == 0, run.stdout[-300:] + run.stderr[-300:])
        check("it reports the ground it probed", "probed: surface y=-62" in run.stdout,
              [l for l in run.stdout.splitlines() if "ground:" in l][:1])
        check("it reports the bounds check", "the plan's y" in run.stdout)
        check("it reports what it read back, not just what it wrote",
              "verified 240/240 sampled blocks on disk" in run.stdout,
              [l for l in run.stdout.splitlines() if "verified" in l][:1])


def main() -> int:
    try:
        import amulet  # noqa: F401, PLC0415
    except ImportError:
        print("skipped: amulet-core is not installed here.")
        print("  These are the only tests that write to a world; the rest of the")
        print("  suite is pure arithmetic and runs without it. CI installs it.")
        print("  pip install amulet-core")
        return 0

    for fn in (
        test_the_fixture_world_is_the_world_it_says,
        test_a_monument_stands_in_the_world_and_tapers,
        test_the_fabric_lands_and_the_firewall_clears_the_roof,
        test_a_world_too_shallow_for_the_plan_is_refused,
        test_the_command_line_runs_and_says_what_it_verified,
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
