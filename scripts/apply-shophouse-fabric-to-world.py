#!/usr/bin/env python3
"""
apply-shophouse-fabric-to-world.py
----------------------------------
Write the shophouse-fabric placement plan into a Minecraft world.

The writer half of the pair. scripts/build-shophouse-fabric.py does the
arithmetic — 4 m module, firewall every five bays, storey grades, hero
punch, shop openings, windows, awning, courtyard void — and writes
site/public/data/bkk-shophouse-fabric-blocks.json.
This script reads that plan and sets blocks.

Same shape as apply-hero-monuments-to-world.py. The amulet import is
lazy, so --dry-run works on any machine. --min-confidence makes the
storey grade a filter: a world meant to be cited rather than played can
be built from overture-storeys buildings alone.

SKIRT IS ZERO. Adjacent shophouses share a party wall. A one-block
margin would eat the neighbour, which is the opposite of the rhythm
this plan exists to keep. Heroes are isolated monuments; these are not.

WHAT IT CLEARS FIRST. Only the columns the building occupies, from the
ground plane up to that building's firewall top. Never the whole bbox:
a cluster bbox contains temples, roads and other people's plots.

Usage:
    python3 scripts/apply-shophouse-fabric-to-world.py --dry-run
    python3 scripts/apply-shophouse-fabric-to-world.py --dry-run --cluster tanao-road-rows
    python3 scripts/apply-shophouse-fabric-to-world.py \\
        --world ~/.minecraft/saves/BKKx-Bangkok-Historic-Core
    python3 scripts/apply-shophouse-fabric-to-world.py --world … \\
        --min-confidence overture-storeys
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "site/public/data/bkk-shophouse-fabric-blocks.json"

GAME_VERSION = ("java", (1, 21, 4))
DIMENSION = "minecraft:overworld"

# Strongest first. --min-confidence keeps this grade and everything above it.
CONFIDENCE_ORDER = ["overture-storeys", "interpretive-storeys"]


def load_plan(path: Path) -> dict:
    if not path.exists():
        raise SystemExit(f"{path} not found — run build-shophouse-fabric.py first")
    plan = json.loads(path.read_text())
    if not plan.get("buildings"):
        raise SystemExit(f"{path} contains no buildings")
    return plan


def columns_of(spans) -> set[tuple[int, int]]:
    return {(x, z) for z, a, b in spans for x in range(a, b + 1)}


def select(plan: dict, clusters: list[str] | None, min_conf: str | None) -> list[dict]:
    keep = plan["buildings"]
    if clusters:
        wanted = set(clusters)
        keep = [b for b in keep if b["cluster"] in wanted]
    if min_conf:
        allowed = set(CONFIDENCE_ORDER[: CONFIDENCE_ORDER.index(min_conf) + 1])
        keep = [b for b in keep if b["heightConfidence"] in allowed]
    return keep


def report(plan: dict, buildings: list[dict]) -> dict:
    by_cluster: dict[str, dict] = {}
    for b in buildings:
        row = by_cluster.setdefault(
            b["cluster"],
            {"buildings": 0, "bays": 0, "blocks": 0, "firewalls": 0, "overCap": 0, "top": 0, "grades": {}},
        )
        row["buildings"] += 1
        row["bays"] += b["nBays"]
        row["blocks"] += b["blocks"]
        row["firewalls"] += 1 if b["firewalls"] else 0
        row["overCap"] += 1 if b["overRowCap"] else 0
        row["top"] = max(row["top"], b["yTo"] + (1 if b["firewalls"] else 0))
        row["grades"][b["heightConfidence"]] = row["grades"].get(b["heightConfidence"], 0) + 1
    return {
        "clusters": by_cluster,
        "totalWrite": sum(b["blocks"] for b in buildings),
        "buildings": len(buildings),
        "bays": sum(b["nBays"] for b in buildings),
    }


def _set(level, x: int, y: int, z: int, block, dry_run: bool) -> bool:
    if dry_run:
        return True
    try:
        level.set_version_block(x, y, z, DIMENSION, GAME_VERSION, block, None)
        return True
    except Exception:
        return False


def apply(level, buildings: list[dict], plan: dict, dry_run: bool) -> tuple[int, int, int]:
    from amulet.api.block import Block  # noqa: PLC0415 — lazy so --dry-run needs no amulet

    ground = plan["groundY"]
    air = Block("minecraft", "air")
    cleared = written = failed = 0

    for b in buildings:
        body = Block(*b["block"].split(":", 1))
        party = Block(*b["partyBlock"].split(":", 1))
        fire = Block(*b["firewallBlock"].split(":", 1))
        roof = Block(*b["roofBlock"].split(":", 1))
        top = b["yTo"] + (1 if b["firewalls"] else 0)
        cols = columns_of(b["spans"]) | columns_of(b["partyWalls"]) | columns_of(b["firewalls"])

        for x, z in cols:
            for y in range(ground, top + 1):
                if _set(level, x, y, z, air, dry_run):
                    cleared += 1
                else:
                    failed += 1

        def fill(spans, block, y_from, y_to):
            nonlocal written, failed
            for z, a, end in spans:
                for x in range(a, end + 1):
                    for y in range(y_from, y_to + 1):
                        if _set(level, x, y, z, block, dry_run):
                            written += 1
                        else:
                            failed += 1

        fill(b["spans"], body, b["yFrom"], b["yTo"])
        fill(b["partyWalls"], party, b["yFrom"], b["yTo"])
        fill(b["firewalls"], fire, b["yFrom"], b["yTo"] + 1)
        # Roof on the body only — firewall already rises through it.
        fill(b["spans"], roof, b["yTo"], b["yTo"])

        glass = Block("minecraft", "glass")
        awning_block = Block(*(plan["palette"].get("awning") or "minecraft:oak_planks").split(":", 1))
        gf = int(round(plan["module"]["gfHeightM"]))
        up = int(round(plan["module"]["upperHeightM"]))
        opening_h = int(plan["module"].get("openingHeightBlocks") or 3)
        fill(b.get("openings") or [], air, b["yFrom"], b["yFrom"] + opening_h - 1)
        y = b["yFrom"] + gf
        for _ in range(max(0, b["storeys"] - 1)):
            mid = y + up // 2
            fill(b.get("windows") or [], glass, mid, mid)
            y += up
        awning_y = b["yFrom"] + gf - 1
        fill(b.get("awning") or [], awning_block, awning_y, awning_y)

    return cleared, written, failed


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--world", help="path to the Minecraft save (required unless --dry-run)")
    ap.add_argument("--plan", type=Path, default=PLAN)
    ap.add_argument("--cluster", action="append", dest="clusters",
                    help="build only this cluster slug; repeatable")
    ap.add_argument("--min-confidence", choices=CONFIDENCE_ORDER,
                    help="build only buildings at this evidence grade or stronger")
    ap.add_argument("--dry-run", action="store_true",
                    help="report what would be written; needs neither amulet nor a world")
    args = ap.parse_args()

    plan = load_plan(args.plan)
    buildings = select(plan, args.clusters, args.min_confidence)
    if not buildings:
        print("nothing selected — check --cluster / --min-confidence")
        return 1

    r = report(plan, buildings)
    print(
        f"plan: {r['buildings']} buildings, {r['bays']} bays, "
        f"ground y={plan['groundY']}  (skirt=0 — shared party walls)"
    )
    for slug, h in sorted(r["clusters"].items(), key=lambda kv: -kv[1]["buildings"]):
        grades = " ".join(f"{k}={v}" for k, v in sorted(h["grades"].items()))
        print(
            f"  {slug:<28} {h['buildings']:>4} bldgs  {h['bays']:>4} bays  "
            f"write {h['blocks']:>7}  fire {h['firewalls']:>3}  over-cap {h['overCap']:>3}  [{grades}]"
        )
    print(f"  {'TOTAL':<28} {r['buildings']:>4} bldgs  {r['bays']:>4} bays  write {r['totalWrite']:>7}")

    if args.dry_run:
        print("\ndry run — nothing written. Re-run with --world to build.")
        return 0

    if not args.world:
        ap.error("--world is required unless --dry-run")

    import amulet  # noqa: PLC0415 — lazy, so --dry-run works without it

    level = amulet.load_level(args.world)
    try:
        cleared, written, failed = apply(level, buildings, plan, dry_run=False)
        level.save()
    finally:
        level.close()

    print(f"\ncleared {cleared:,} · wrote {written:,} · failed {failed:,}")
    if failed:
        print("failed writes are ungenerated chunks — the world is smaller than the plan.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
