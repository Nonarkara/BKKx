#!/usr/bin/env python3
"""
apply-hero-monuments-to-world.py
--------------------------------
Write the hero-monument placement plan into a Minecraft world.

The writer half of the pair. scripts/build-hero-monument-blocks.py does all
the arithmetic — projection, rasterisation, palette, evidence grading — and
writes site/public/data/bkk-hero-monument-blocks.json. This script does
nothing but read that plan and set blocks. Every judgement was made, tested
and reviewed before it got here.

It is the same shape as apply-rattanakosin-to-world.py, which put the moat,
the Chao Phraya, nine city gates and two wall forts into the same world, and
it writes into the same block frame.

    --dry-run WORKS WITHOUT AMULET. The import is lazy, so you can read the
    full report of what would be written — per hero, per part, per evidence
    grade — on any machine, and only need amulet-core and a save file when
    you actually want the blocks. The existing applier imports amulet at
    module scope and so cannot be dry-run at all; that seemed worth fixing
    rather than copying.

WHAT IT CLEARS FIRST. A generator that has already run over this bbox — Arnis,
or an earlier BKKx pass — will have left a boxy extrusion standing on the same
footprint. Building the tiered massing on top of it produces a monument inside
a crate. So each hero's own columns are cleared to air first, from the ground
plane up to that hero's tallest part, plus a skirt. Only the columns the
monument actually occupies, never the whole bounding box: the Grand Palace
bbox contains buildings that are not the Grand Palace.

EVIDENCE IS A FILTER, NOT A FOOTNOTE. --min-confidence lets you build only
what a published source supports. The default builds everything, because the
plan already refuses anything ungraded, but a world meant to be cited rather
than played can be built from the seven official-envelope parts alone.

Usage:
    python3 scripts/apply-hero-monuments-to-world.py --dry-run
    python3 scripts/apply-hero-monuments-to-world.py \\
        --world ~/.minecraft/saves/BKKx-Bangkok-Historic-Core --skirt 1
    python3 scripts/apply-hero-monuments-to-world.py --world … \\
        --hero grand-palace-phra-mondop --min-confidence official-envelope
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "site/public/data/bkk-hero-monument-blocks.json"
SHOPHOUSE_PLAN = ROOT / "site/public/data/bkk-shophouse-blocks.json"

# The world version apply-rattanakosin-to-world.py writes with. Kept identical
# so the two scripts cannot disagree about what game they are building for.
GAME_VERSION = ("java", (1, 21, 4))
DIMENSION = "minecraft:overworld"

# Strongest first. --min-confidence keeps this grade and everything above it.
CONFIDENCE_ORDER = ["official-envelope", "interpretive-proportion", "interpretive-envelope"]


def load_plan(path: Path) -> dict:
    plan = json.loads(path.read_text())
    if not plan.get("parts"):
        raise SystemExit(f"{path} contains no parts — run the matching builder first")
    plan["parts"] = normalise(plan["parts"])
    return plan


def normalise(parts: list[dict]) -> list[dict]:
    """Accept both plan shapes.

    The monument plan is one entry per part, each with its own footprint,
    because every tier of a spire has a different one. The shophouse plan is
    one entry per building with the footprint once and `bands` as y ranges
    over it — writing 2,433 footprints three times over tripled that file to
    9.8 MB for no extra information.

    Expanding here rather than on disk keeps one applier and one small file.
    """
    flat: list[dict] = []
    for part in parts:
        if "bands" not in part:
            flat.append(part)
            continue
        for band in part["bands"]:
            flat.append({**{k: v for k, v in part.items() if k != "bands"}, **band})
    return flat


def columns_of(part: dict) -> set[tuple[int, int]]:
    return {(x, z) for z, a, b in part["spans"] for x in range(a, b + 1)}


def dilate(columns: set[tuple[int, int]], skirt: int) -> set[tuple[int, int]]:
    """Square dilation. The generated box under a monument is usually the OSM
    footprint, which can sit a block or two proud of the tiered massing that
    replaces it; the skirt takes that edge with it."""
    if skirt <= 0:
        return columns
    out = set()
    for x, z in columns:
        for dx in range(-skirt, skirt + 1):
            for dz in range(-skirt, skirt + 1):
                out.add((x + dx, z + dz))
    return out


def plan_for(plan: dict, heroes: list[str] | None, min_conf: str | None) -> list[dict]:
    keep = plan["parts"]
    if heroes:
        keep = [p for p in keep if p["heroId"] in heroes]
    if min_conf:
        allowed = set(CONFIDENCE_ORDER[: CONFIDENCE_ORDER.index(min_conf) + 1])
        keep = [p for p in keep if p["heightConfidence"] in allowed]
    return keep


def report(plan: dict, parts: list[dict], skirt: int) -> dict:
    """What the write would do, computed without touching a world."""
    by_hero: dict[str, dict] = {}
    for part in parts:
        hero = by_hero.setdefault(
            part["heroId"], {"parts": 0, "blocks": 0, "top": 0, "columns": set(), "grades": {}}
        )
        hero["parts"] += 1
        hero["blocks"] += part["blocks"]
        hero["top"] = max(hero["top"], part["yTo"])
        hero["columns"] |= columns_of(part)
        hero["grades"][part["heightConfidence"]] = hero["grades"].get(part["heightConfidence"], 0) + 1

    ground = plan["groundY"]
    total_clear = 0
    for hero in by_hero.values():
        hero["clearColumns"] = len(dilate(hero["columns"], skirt))
        hero["clearBlocks"] = hero["clearColumns"] * (hero["top"] - ground + 1)
        total_clear += hero["clearBlocks"]
        del hero["columns"]

    return {
        "heroes": by_hero,
        "totalWrite": sum(p["blocks"] for p in parts),
        "totalClear": total_clear,
        "parts": len(parts),
    }


def apply(level, parts: list[dict], plan: dict, skirt: int, dry_run: bool) -> tuple[int, int, int]:
    """Clear each hero's columns, then write its parts bottom-up.

    Returns (cleared, written, failed). A failed write is a chunk that is not
    generated — the world is smaller than the plan — and is counted rather
    than raised, so one monument outside the generated area does not abort
    the other seven.
    """
    from amulet.api.block import Block  # noqa: PLC0415 — lazy so --dry-run needs no amulet

    ground = plan["groundY"]
    air = Block("minecraft", "air")

    by_hero: dict[str, list[dict]] = {}
    for part in parts:
        by_hero.setdefault(part["heroId"], []).append(part)

    cleared = written = failed = 0
    for hero_id, hero_parts in sorted(by_hero.items()):
        top = max(p["yTo"] for p in hero_parts)
        columns = dilate(set().union(*(columns_of(p) for p in hero_parts)), skirt)

        for x, z in columns:
            for y in range(ground, top + 1):
                if _set(level, x, y, z, air, dry_run):
                    cleared += 1

        # Bottom-up, so a taller part never writes into a lower one's space
        # before that space has been cleared.
        for part in sorted(hero_parts, key=lambda p: p["yFrom"]):
            ns, name = part["block"].split(":", 1)
            block = Block(ns, name)
            for z, a, b in part["spans"]:
                for x in range(a, b + 1):
                    for y in range(part["yFrom"], part["yTo"] + 1):
                        if _set(level, x, y, z, block, dry_run):
                            written += 1
                        else:
                            failed += 1
        print(f"  {hero_id}: {len(hero_parts)} parts to y={top}")

    return cleared, written, failed


def _set(level, x: int, y: int, z: int, block, dry_run: bool) -> bool:
    """Set one block. block_entity must be None, not [] — amulet reads [] as
    extra_input and rejects it. Same call apply-rattanakosin-to-world.py uses."""
    if dry_run:
        return True
    try:
        level.set_version_block(x, y, z, DIMENSION, GAME_VERSION, block, None)
        return True
    except Exception:
        return False


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--world", help="path to the Minecraft save (required unless --dry-run)")
    ap.add_argument("--plan", type=Path, default=PLAN,
                    help="placement plan to write (default the monuments)")
    ap.add_argument("--shophouses", action="store_const", const=SHOPHOUSE_PLAN, dest="plan",
                    help=f"shorthand for --plan {SHOPHOUSE_PLAN.name}")
    ap.add_argument("--skirt", type=int, default=1,
                    help="blocks of margin cleared around each monument (default 1)")
    ap.add_argument("--hero", action="append", dest="heroes",
                    help="build only this hero id; repeatable")
    ap.add_argument("--min-confidence", choices=CONFIDENCE_ORDER,
                    help="build only parts at this evidence grade or stronger")
    ap.add_argument("--dry-run", action="store_true",
                    help="report what would be written; needs neither amulet nor a world")
    args = ap.parse_args()

    plan = load_plan(args.plan)
    parts = plan_for(plan, args.heroes, args.min_confidence)
    if not parts:
        print("nothing selected — check --hero / --min-confidence")
        return 1

    r = report(plan, parts, args.skirt)
    print(f"plan: {r['parts']} parts across {len(r['heroes'])} monuments, ground y={plan['groundY']}")
    # The monument plan has 8 groups and every line is worth reading. The
    # shophouse plan has 2,433 and a full listing is noise, so it shows the
    # heaviest and says how many it did not print.
    ranked = sorted(r["heroes"].items(), key=lambda kv: -kv[1]["blocks"])
    shown = ranked if len(ranked) <= 12 else ranked[:8]
    for hero_id, h in shown:
        grades = " ".join(f"{k}={v}" for k, v in sorted(h["grades"].items()))
        print(f"  {hero_id:<38} {h['parts']:>2} parts  top y={h['top']:<4} "
              f"write {h['blocks']:>7}  clear {h['clearBlocks']:>8}  [{grades}]")
    if len(ranked) > len(shown):
        rest = sum(h["blocks"] for _, h in ranked[len(shown):])
        print(f"  … and {len(ranked) - len(shown):,} more groups, {rest:,} blocks between them")
    print(f"  {'TOTAL':<38} {r['parts']:>2} parts             "
          f"write {r['totalWrite']:>7}  clear {r['totalClear']:>8}")

    if args.dry_run:
        print("\ndry run — nothing written. Re-run with --world to build.")
        return 0

    if not args.world:
        ap.error("--world is required unless --dry-run")

    import amulet  # noqa: PLC0415 — lazy, so --dry-run works without it

    level = amulet.load_level(args.world)
    try:
        cleared, written, failed = apply(level, parts, plan, args.skirt, dry_run=False)
        level.save()
    finally:
        level.close()

    print(f"\ncleared {cleared:,} · wrote {written:,} · failed {failed:,}")
    if failed:
        print("failed writes are ungenerated chunks — the world is smaller than the plan.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
