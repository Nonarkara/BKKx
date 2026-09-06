#!/usr/bin/env python3
"""
make-fixture-world.py
---------------------
Build a small superflat Minecraft world in this repository's block frame, so
the appliers can be run and their writes read back.

Why this exists. `worlds/` holds manifests, not saves: the generated
Bangkok world is 49 region files distributed separately, and no applier in
this repository had ever been executed against a world at all
(AUDIT-2026-09-06.md, disposition). Every test up to now checked the
arithmetic that produces a plan. Nothing checked that writing the plan puts
blocks in a world — which is a different claim, resting on amulet's API, the
game version tuple, the dimension name and the world's declared height.

So this makes a world to write into: Java 1.21.4, superflat, three layers of
stone with its surface at `--surface` (default −62, where Arnis puts these
worlds), air above, chunks generated only over the bbox asked for. A
monument's fixture is four chunks and about 200 KB, which is a test fixture
rather than a download.

THE LEVEL.DAT MATTERS MORE THAN IT LOOKS. amulet reads a world's height from
`level.dat → Data → WorldGenSettings → dimensions → minecraft:overworld →
type`. Its own `create_and_open` leaves that unreadable, and amulet then
falls back to the pre-1.18 bounds of y=0..256 — whereupon `set_version_block`
still SUCCEEDS for y=−61, `save()` silently drops the out-of-range
sub-chunks, and the applier reports thousands of blocks written into a world
that has none. That is the exact shape of failure this repository keeps
finding: a claim nobody checks. So this script writes the tag itself, and
the appliers now refuse to write a plan that does not fit the world's
declared bounds.

    python3 scripts/make-fixture-world.py --out /tmp/w --hero grand-palace-siratana-chedi
    python3 scripts/make-fixture-world.py --out /tmp/w --cluster tha-tien
    python3 scripts/make-fixture-world.py --out /tmp/w --bbox 1430 1590 1460 1620
    python3 scripts/make-fixture-world.py --out /tmp/w --hero … --surface 63   # the old frame
"""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HERO_PLAN = ROOT / "site/public/data/bkk-hero-monument-blocks.json"
FABRIC_PLAN = ROOT / "site/public/data/bkk-shophouse-fabric-blocks.json"

GAME_VERSION = ("java", (1, 21, 4))
DIMENSION = "minecraft:overworld"
DIMENSIONS = ("minecraft:overworld", "minecraft:the_nether", "minecraft:the_end")

# Java 1.18+ overworld. The fixture declares this so a plan at y=−61 is
# inside the world rather than quietly outside it.
MIN_Y, MAX_Y = -64, 320


def spans_bbox(spans_iter) -> tuple[int, int, int, int]:
    xs: list[int] = []
    zs: list[int] = []
    for z, a, b in spans_iter:
        xs += [a, b]
        zs.append(z)
    if not xs:
        raise SystemExit("no spans — nothing to cover")
    return min(xs), min(zs), max(xs), max(zs)


def hero_bbox(hero_id: str) -> tuple[int, int, int, int]:
    plan = json.loads(HERO_PLAN.read_text())
    parts = [p for p in plan["parts"] if p["heroId"] == hero_id]
    if not parts:
        raise SystemExit(f"no hero {hero_id!r} in {HERO_PLAN.name}")
    return spans_bbox(s for p in parts for s in p["spans"])


def cluster_bbox(cluster: str) -> tuple[int, int, int, int]:
    plan = json.loads(FABRIC_PLAN.read_text())
    rows = [b for b in plan["buildings"] if b["cluster"] == cluster]
    if not rows:
        raise SystemExit(f"no cluster {cluster!r} in {FABRIC_PLAN.name}")
    spans = [s for b in rows for key in ("spans", "partyWalls", "firewalls") for s in (b.get(key) or [])]
    return spans_bbox(spans)


def fix_level_dat(path: Path) -> None:
    """Write the dimension types amulet reads the world height from."""
    from amulet_nbt import CompoundTag, StringTag, load as nbt_load  # noqa: PLC0415

    tag = nbt_load(str(path / "level.dat"))
    data = tag.compound.get_compound("Data")
    settings = data.setdefault_compound("WorldGenSettings", CompoundTag())
    dims = settings.setdefault_compound("dimensions", CompoundTag())
    for name in DIMENSIONS:
        dims.setdefault_compound(name, CompoundTag())["type"] = StringTag(name)
    tag.save_to(str(path / "level.dat"))


def build(out: Path, bbox: tuple[int, int, int, int], surface: int, margin: int, overwrite: bool) -> dict:
    import amulet  # noqa: PLC0415
    from amulet.api.block import Block  # noqa: PLC0415
    from amulet.api.selection import SelectionBox, SelectionGroup  # noqa: PLC0415
    from amulet.level.formats.anvil_world import AnvilFormat  # noqa: PLC0415

    if out.exists():
        if not overwrite:
            raise SystemExit(f"{out} exists — pass --overwrite to replace it")
        shutil.rmtree(out)

    x0, z0, x1, z1 = bbox
    x0, z0, x1, z1 = x0 - margin, z0 - margin, x1 + margin, z1 + margin

    fmt = AnvilFormat(str(out))
    fmt.create_and_open(
        "java", GAME_VERSION[1],
        SelectionGroup([SelectionBox((x0, MIN_Y, z0), (x1 + 1, MAX_Y, z1 + 1))]),
        overwrite=True,
    )
    fmt.close()
    fix_level_dat(out)

    level = amulet.load_level(str(out))
    stone = Block("minecraft", "stone")
    written = 0
    try:
        # Whole chunks, so the fixture has no ragged edge to explain later.
        for x in range((x0 // 16) * 16, ((x1 // 16) + 1) * 16):
            for z in range((z0 // 16) * 16, ((z1 // 16) + 1) * 16):
                for y in (surface - 2, surface - 1, surface):
                    level.set_version_block(x, y, z, DIMENSION, GAME_VERSION, stone, None)
                    written += 1
        level.save()
    finally:
        level.close()

    level = amulet.load_level(str(out))
    try:
        bounds = level.bounds(DIMENSION)
        probe = str(level.get_version_block(x0, surface, z0, DIMENSION, GAME_VERSION)[0])
    finally:
        level.close()

    return {
        "path": str(out), "bbox": (x0, z0, x1, z1), "surface": surface,
        "groundY": surface + 1, "blocks": written, "bounds": str(bounds),
        "readBack": probe,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", type=Path, required=True, help="directory for the world")
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument("--hero", help="cover this hero monument's footprint")
    group.add_argument("--cluster", help="cover this shophouse cluster's footprints")
    group.add_argument("--bbox", nargs=4, type=int, metavar=("X0", "Z0", "X1", "Z1"))
    ap.add_argument("--surface", type=int, default=-62,
                    help="y of the top stone layer (default -62, where Arnis puts these worlds)")
    ap.add_argument("--margin", type=int, default=4, help="blocks of flat ground around the bbox")
    ap.add_argument("--overwrite", action="store_true")
    args = ap.parse_args()

    if args.hero:
        bbox = hero_bbox(args.hero)
    elif args.cluster:
        bbox = cluster_bbox(args.cluster)
    else:
        bbox = tuple(args.bbox)

    r = build(args.out, bbox, args.surface, args.margin, args.overwrite)
    print(f"fixture world: {r['path']}")
    print(f"  bbox x {r['bbox'][0]}..{r['bbox'][2]}  z {r['bbox'][1]}..{r['bbox'][3]}")
    print(f"  surface y={r['surface']} (ground plane y={r['groundY']}), {r['blocks']:,} stone blocks")
    print(f"  declared bounds {r['bounds']}")
    print(f"  read back at the corner: {r['readBack']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
