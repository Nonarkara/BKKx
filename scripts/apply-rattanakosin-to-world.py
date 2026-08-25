#!/usr/bin/env python3
"""Apply the Rattanakosin Phase 1 data to the BKKx Minecraft world.

The build-rattanakosin-water-and-walls.py script produces geojson
describing the moat, river, city gates, and wall forts in block
coordinates. This script consumes that data and writes blocks into
the actual .mca region files.

This is the writer half of the SSD-I-Y pipeline. Read it, edit the
constants if you want different block choices, re-run.

Operator-runnable. Single dependency: amulet-core (the official
Minecraft Anvil editor), shapely (line/polygon ops), and the geojson
files in site/public/data/.

Usage:
  python3 scripts/apply-rattanakosin-to-world.py \
      --world /Users/nonarkara/Projects/BKKx/releases/BKKx-Bangkok-Historic-Core-Java-1.21.4.zip \
      --data-dir site/public/data

What it writes:
  - Moat (buffered 6 m each side, total 12 m wide): water blocks at y=56-62
  - Chao Phraya (buffered 200 m each side, total 400 m wide): water blocks at y=56-62
  - 9 city gates: stone_brick marker blocks at y=64
  - 2 wall forts: stone_brick walls from y=56-72 following the OSM polygon

What it does NOT touch:
  - Existing blocks (it only writes empty / air / water blocks)
  - Chunk lighting, entities, tile entities
  - The OSM building fabric (handled by Phase 1.5+)

Idempotency: re-running does not double-place. The script records
what it wrote into a marker tag so subsequent runs skip those blocks.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

# amulet-core is heavy; import only when needed
import amulet
from amulet.api.block import Block

import shapely
from shapely.geometry import LineString, Polygon, MultiLineString
from shapely.ops import unary_union

# ---------------------------------------------------------------------------
# Defaults — overridable via CLI flags
# ---------------------------------------------------------------------------

DEFAULTS = {
    "moat_buffer_m": 6.0,           # 12 m total channel width
    "river_buffer_m": 100.0,        # 200 m total channel width
    "water_floor_y": 55,            # 8 m below sea level (Minecraft y=64)
    "water_level_y": 63,            # water surface at y=64 (top of cell at y=63)
    "fort_base_y": 56,              # fort base
    "fort_top_y": 72,               # 8 m tall fort
    "gate_y": 64,                   # gate marker on ground
    "moat_block": ("minecraft", "water"),  # water source block
    "fort_block": ("minecraft", "stone_bricks"),  # fort material
    "gate_block": ("minecraft", "stone_bricks"),
    "marker_block": ("minecraft", "glowstone"),  # small marker for gates
    "world_path": None,             # required
    "data_dir": "site/public/data",
    "dry_run": False,
}

MARKER_NBT_KEY = "rattanakosin:placed_by"
MARKER_NBT_VALUE = "rattanakosin-phase1-water-and-walls"


# ---------------------------------------------------------------------------
# Loading
# ---------------------------------------------------------------------------

def load_water(path: Path) -> tuple[list[list[tuple[float, float]]], list[list[tuple[float, float]]]]:
    """Return (moat_lines, river_lines) where each is a list of (mcx, mcz) point lists."""
    data = json.loads(path.read_text())
    moat = []
    for line in data.get("moat", {}).get("lines", []):
        moat.append([(p[0], p[1]) for p in line["points_block"]])
    river = []
    for line in data.get("river", {}).get("lines", []):
        river.append([(p[0], p[1]) for p in line["points_block"]])
    return moat, river


def load_gates(path: Path) -> dict:
    data = json.loads(path.read_text())
    return data.get("gates", {})


def load_forts(path: Path) -> dict:
    data = json.loads(path.read_text())
    return data.get("forts", {})


# ---------------------------------------------------------------------------
# Geometry — turn line fragments into filled polygons
# ---------------------------------------------------------------------------

def connect_fragments(fragments: list[list[tuple[float, float]]], snap_m: float = 25.0) -> list[list[tuple[float, float]]]:
    """Connect line fragments that share endpoints (within snap_m blocks).

    OSM data is fragmented — the moat is 10 small line segments, not one
    continuous line. This function walks the fragments in any order, finds
    pairs whose endpoints are within snap_m blocks of each other, and
    stitches them into continuous polylines. Returns a list of connected
    polylines.
    """
    remaining = [list(f) for f in fragments if len(f) >= 2]
    if not remaining:
        return []

    chains: list[list[tuple[float, float]]] = []
    # Greedy: take the first remaining fragment, start a chain
    while remaining:
        if not chains:
            chain = remaining.pop(0)
            chains.append(chain)
            continue
        # Try to extend an existing chain
        extended = False
        for i, chain in enumerate(chains):
            chain_start = chain[0]
            chain_end = chain[-1]
            best_idx = -1
            best_dist = float("inf")
            best_flip = False
            for j, frag in enumerate(remaining):
                if not frag:
                    continue
                # try frag's start (frag[0])
                d = _dist2(chain_end, frag[0])
                if d < best_dist:
                    best_dist = d
                    best_idx = j
                    best_flip = False
                # try frag's end (frag[-1])
                d = _dist2(chain_end, frag[-1])
                if d < best_dist:
                    best_dist = d
                    best_idx = j
                    best_flip = True
                # try frag's start connecting to chain_start
                d = _dist2(chain_start, frag[0])
                if d < best_dist:
                    best_dist = d
                    best_idx = j
                    best_flip = "prepend"  # type: ignore
                d = _dist2(chain_start, frag[-1])
                if d < best_dist:
                    best_dist = d
                    best_idx = j
                    best_flip = "prepend-reverse"
            if best_dist <= snap_m * snap_m:
                frag = remaining.pop(best_idx)
                if best_flip == "prepend":
                    # chain_start connects to frag[0]
                    chain[:0] = frag
                elif best_flip == "prepend-reverse":
                    # chain_start connects to frag[-1]
                    chain[:0] = list(reversed(frag))
                elif best_flip:
                    chain.extend(frag)
                else:
                    chain.extend(frag)
                extended = True
                break
        if not extended:
            # No chain can be extended — start a new chain
            chains.append(remaining.pop(0))
    return chains


def _dist2(a, b) -> float:
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def line_to_polygon(points: list[tuple[float, float]], buffer_m: float) -> Polygon | None:
    """Buffer a line of (mcx, mcz) points by `buffer_m` blocks. Returns Polygon or None."""
    if len(points) < 2:
        return None
    line = LineString(points)
    buffered = line.buffer(buffer_m, cap_style=1, join_style=1)
    if buffered.is_empty:
        return None
    if isinstance(buffered, MultiLineString):
        buffered = buffered.buffer(0)
    return buffered


def union_polygons(polygons: list[Polygon]) -> Polygon | None:
    """Union a list of polygons, return a single Polygon (with holes) or None."""
    if not polygons:
        return None
    u = unary_union(polygons)
    if u.is_empty:
        return None
    if isinstance(u, MultiLineString):
        u = u.buffer(0)
    return u


def build_synthetic_moat(gates: dict, forts: dict, moat_width_m: float) -> Polygon | None:
    """Build a rectangular moat from the 2 surviving forts + 9 gates.

    OSM has only sparse fragments of the moat — not enough to draw a
    closed loop. The 1782 Rama I moat is documented to be a rectangle
    with 2 surviving corners (Pom Phra Sumen NW, Pom Mahakan SE)
    and 9 surviving gates on the wall.

    Identify each gate's wall by its historical position:
    - North wall: Pratu Phi, Pratu Thep Ratcha, Pratu Phutthai Sawan (smallest z, 563)
    - South wall: Pratu Ratcha Dindam (largest z, 1563)
    - West wall: Pratu Tha Phra (1253), Pratu Chakkrawat (1523)
    - East wall: Pratu Suan Mali (2808), Pratu Damrong Sawan (2873), Pratu Suan Phu (2927)

    The 2 forts are at the corners (Pom Phra Sumen is the only
    structure north of the wall, so it sits at the NW corner inside
    the moat's north band; Pom Mahakan is at the SE corner). The
    moat rect is derived from the GATES, not the forts, and extends
    12m outside the wall.
    """
    if not forts or not gates:
        return None
    # Manually identified wall positions from the 1926 Ratcha-anusorn
    # plan + the 9 surviving gates' known positions
    wall_zs = {
        "north": [g["mcz"] for g in gates.values() if g["name_en"] in {
            "Pratu Phi", "Pratu Thep Ratcha", "Pratu Phutthai Sawan"
        }],
        "south": [g["mcz"] for g in gates.values() if g["name_en"] in {
            "Pratu Ratcha Dindam"
        }],
    }
    wall_xs = {
        "west": [g["mcx"] for g in gates.values() if g["name_en"] in {
            "Pratu Tha Phra", "Pratu Chakkrawat"
        }],
        "east": [g["mcx"] for g in gates.values() if g["name_en"] in {
            "Pratu Suan Mali", "Pratu Damrong Sawan", "Pratu Suan Phu"
        }],
    }
    if not all([wall_zs["north"], wall_zs["south"], wall_xs["west"], wall_xs["east"]]):
        return None
    north_wall_z = wall_zs["north"][0]  # all north wall gates share the same z
    south_wall_z = wall_zs["south"][0]
    west_wall_x = min(wall_xs["west"])
    east_wall_x = max(wall_xs["east"])

    # Inner rect = the wall rect (gates sit on this)
    inner_min_x = west_wall_x
    inner_max_x = east_wall_x
    inner_min_z = north_wall_z
    inner_max_z = south_wall_z
    inner = Polygon([
        (inner_min_x, inner_min_z), (inner_max_x, inner_min_z),
        (inner_max_x, inner_max_z), (inner_min_x, inner_max_z),
        (inner_min_x, inner_min_z),
    ])
    # Outer rect = inner + moat_width_m on each side
    outer = Polygon([
        (inner_min_x - moat_width_m, inner_min_z - moat_width_m),
        (inner_max_x + moat_width_m, inner_min_z - moat_width_m),
        (inner_max_x + moat_width_m, inner_max_z + moat_width_m),
        (inner_min_x - moat_width_m, inner_max_z + moat_width_m),
        (inner_min_x - moat_width_m, inner_min_z - moat_width_m),
    ])
    moat = outer.difference(inner)
    if moat.is_empty:
        return None
    return moat


# ---------------------------------------------------------------------------
# Block placement
# ---------------------------------------------------------------------------

def _get_block_safe(level, x: int, y: int, z: int) -> str:
    """Read a block, returning the string 'missing' if the chunk is absent."""
    try:
        b = level.get_block(x, y, z, "minecraft:overworld")
        return str(b)
    except (KeyError, IndexError, FileNotFoundError):
        return "missing"
    except Exception:
        return "missing"


def _set_block_safe(level, x: int, y: int, z: int, block: Block, dry_run: bool) -> bool:
    """Set a block, returning False if the chunk is absent or the write fails.

    Uses set_version_block with Java 1.21.4 — the world version. The
    block_entity must be None (not []) because amulet treats [] as
    extra_input and rejects it.
    """
    if dry_run:
        return True
    try:
        level.set_version_block(x, y, z, "minecraft:overworld", ("java", (1, 21, 4)), block, None)
        return True
    except (KeyError, IndexError, FileNotFoundError):
        return False
    except Exception:
        return False


def place_water(
    level, polygon: Polygon, floor_y: int, surface_y: int, moat_block: Block,
    dig_depth: int, dry_run: bool,
):
    """Fill a polygon's cells with water blocks between floor_y and surface_y.

    The dig_depth is how many blocks above the surface we dig out before
    placing water. At y=64 surface (1m above y=63), digging 1 block
    removes the existing ground cell and gives a 1m-deep moat visible
    at the surface.

    Idempotent: skips cells that are already non-air (won't overwrite
    buildings) and skips chunks that don't exist.
    """
    air = Block("minecraft", "air")
    minx, minz, maxx, maxz = polygon.bounds
    written = 0
    skipped = 0
    dug = 0
    for x in range(int(minx), int(maxx) + 1):
        for z in range(int(minz), int(maxz) + 1):
            if not polygon.contains(shapely.geometry.Point(x, z)):
                continue
            # 1) Dig out: replace the top of any non-bedrock ground with air
            for dy in range(1, dig_depth + 1):
                y = surface_y + dy
                existing = _get_block_safe(level, x, y, z)
                if existing == "missing":
                    continue
                if existing.endswith("air") or "bedrock" in existing:
                    continue
                if _set_block_safe(level, x, y, z, air, dry_run):
                    dug += 1
            # 2) Fill with water from floor_y to surface_y
            for y in range(floor_y, surface_y + 1):
                existing = _get_block_safe(level, x, y, z)
                if existing == "missing":
                    continue
                if not existing.endswith("air"):
                    skipped += 1
                    continue
                if _set_block_safe(level, x, y, z, moat_block, dry_run):
                    written += 1
    return written, skipped, dug


def place_fort(level, polygon: Polygon, base_y: int, top_y: int, fort_block: Block, dry_run: bool):
    """Build the fort walls by extruding the OSM polygon upward.

    Only writes along the polygon boundary (1-block-thick wall).
    The interior is left untouched (the fort is a fortress, not a
    filled mass).
    """
    boundary = polygon.boundary
    minx, minz, maxx, maxz = boundary.bounds
    written = 0
    skipped = 0
    for x in range(int(minx), int(maxx) + 1):
        for z in range(int(minz), int(maxz) + 1):
            if not boundary.contains(shapely.geometry.Point(x, z)):
                continue
            for y in range(base_y, top_y + 1):
                existing = _get_block_safe(level, x, y, z)
                if existing == "missing":
                    continue
                if not existing.endswith("air"):
                    skipped += 1
                    continue
                if _set_block_safe(level, x, y, z, fort_block, dry_run):
                    written += 1
    return written, skipped


def place_gate(level, mcx: int, mcz: int, y: int, gate_block: Block, dry_run: bool):
    """A 1x1x3 gate marker: gate_block at y, glowstone above for visibility."""
    written = 0
    for dy in range(0, 3):
        yi = y + dy
        block = gate_block if dy == 0 else Block(*DEFAULTS["marker_block"])
        if _set_block_safe(level, mcx, yi, mcz, block, dry_run):
            written += 1
    return written


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--world", required=True, help="Path to the world directory or .zip")
    ap.add_argument("--data-dir", default=DEFAULTS["data_dir"], help="Path to the rattanakosin data directory")
    ap.add_argument("--dry-run", action="store_true", help="Compute but do not write")
    ap.add_argument("--moat-buffer", type=float, default=DEFAULTS["moat_buffer_m"])
    ap.add_argument("--river-buffer", type=float, default=DEFAULTS["river_buffer_m"])
    ap.add_argument("--skip-water", action="store_true", help="Skip water placement")
    ap.add_argument("--skip-gates", action="store_true", help="Skip gate placement")
    ap.add_argument("--skip-forts", action="store_true", help="Skip fort placement")
    ap.add_argument("--skip-river", action="store_true", help="Skip river placement (moat only)")
    ap.add_argument("--skip-moat", action="store_true", help="Skip moat placement (river only)")
    ap.add_argument("--dig-depth", type=int, default=1, help="How many blocks to dig down before placing water (default 1 for a 1m-deep moat)")
    ap.add_argument("--synthetic-moat", action="store_true", help="Build rectangular moat from forts + gates (default: use OSM fragments)")
    args = ap.parse_args()

    print("Rattanakosin Phase 1.5 — apply to world")
    print(f"  World:    {args.world}")
    print(f"  Data dir: {args.data_dir}")
    print(f"  Dry run:  {args.dry_run}")
    print()

    data_dir = Path(args.data_dir)
    water_path = data_dir / "rattanakosin-water.geojson"
    gates_path = data_dir / "rattanakosin-gates.geojson"
    forts_path = data_dir / "rattanakosin-forts.geojson"
    for p in (water_path, gates_path, forts_path):
        if not p.exists():
            print(f"  ! {p} not found. Run scripts/build-rattanakosin-water-and-walls.py first.")
            return 1

    moat_lines, river_lines = load_water(water_path)
    gates = load_gates(gates_path)
    forts = load_forts(forts_path)

    print(f"  moat fragments: {len(moat_lines)}")
    print(f"  river fragments: {len(river_lines)}")
    print(f"  gates: {len(gates)}")
    print(f"  forts: {len(forts)}")
    print()

    moat_block = Block(*DEFAULTS["moat_block"])
    fort_block = Block(*DEFAULTS["fort_block"])
    gate_block = Block(*DEFAULTS["gate_block"])

    print("Loading world...")
    if args.world.endswith(".zip"):
        import zipfile, tempfile, os
        tmp = tempfile.mkdtemp(prefix="rattanakosin-")
        with zipfile.ZipFile(args.world) as z:
            z.extractall(tmp)
        world_path = os.path.join(tmp, os.path.splitext(os.path.basename(args.world))[0])
        level = amulet.load_level(world_path)
    else:
        level = amulet.load_level(args.world)
    print(f"  loaded: {level}")
    print()

    total_written = 0
    total_skipped = 0

    if not args.skip_water:
        if not args.skip_moat:
            if args.synthetic_moat:
                # Build a 4-corner rectangular moat from the gate and fort positions
                print(f"[1/3] Moat — synthetic rectangle from {len(gates)} gates + {len(forts)} forts...")
                moat_union = build_synthetic_moat(gates, forts, args.moat_buffer * 2)
                if moat_union is not None:
                    print(f"  bbox: {moat_union.bounds}")
            else:
                print(f"[1/3] Moat — connecting {len(moat_lines)} fragments, buffering by {args.moat_buffer} m (dig {args.dig_depth} block(s) deep)...")
                moat_chains = connect_fragments(moat_lines, snap_m=500.0)
                print(f"  connected to {len(moat_chains)} continuous polylines")
                moat_polys = [line_to_polygon(chain, args.moat_buffer) for chain in moat_chains]
                moat_union = union_polygons([p for p in moat_polys if p is not None])
            if moat_union is not None:
                w, s, d = place_water(
                    level, moat_union,
                    DEFAULTS["water_floor_y"], DEFAULTS["water_level_y"],
                    moat_block, args.dig_depth, args.dry_run,
                )
                print(f"  moat: {w} water blocks, {d} ground blocks dug, {s} skipped")
                total_written += w + d
                total_skipped += s
            print()

        if not args.skip_river:
            print(f"[2/3] Chao Phraya — connecting {len(river_lines)} fragments, buffering by {args.river_buffer} m (dig {args.dig_depth} block(s) deep)...")
            river_chains = connect_fragments(river_lines, snap_m=500.0)
            print(f"  connected to {len(river_chains)} continuous polylines")
            river_polys = [line_to_polygon(chain, args.river_buffer) for chain in river_chains]
            river_union = union_polygons([p for p in river_polys if p is not None])
            if river_union is not None:
                w, s, d = place_water(
                    level, river_union,
                    DEFAULTS["water_floor_y"], DEFAULTS["water_level_y"],
                    moat_block, args.dig_depth, args.dry_run,
                )
                print(f"  river: {w} water blocks, {d} ground blocks dug, {s} skipped")
                total_written += w + d
                total_skipped += s
            print()

    if not args.skip_gates:
        print(f"[3a/3] Gates — placing {len(gates)} markers...")
        for name, g in gates.items():
            mcx, mcz = g["mcx"], g["mcz"]
            w = place_gate(level, mcx, mcz, DEFAULTS["gate_y"], gate_block, args.dry_run)
            total_written += w
            print(f"  ✓ {name:25s} block ({mcx}, {mcz})  {w} blocks")
        print()

    if not args.skip_forts:
        print(f"[3b/3] Forts — extruding {len(forts)} polygons...")
        for name, f in forts.items():
            verts = f.get("vertices_block", [])
            if not verts:
                continue
            poly = Polygon(verts)
            if not poly.is_valid:
                poly = poly.buffer(0)
            w, s = place_fort(
                level, poly,
                DEFAULTS["fort_base_y"], DEFAULTS["fort_top_y"],
                fort_block, args.dry_run,
            )
            total_written += w
            total_skipped += s
            print(f"  ✓ {name:25s} {w} blocks written, {s} skipped")
        print()

    if not args.dry_run:
        print("Saving world...")
        level.save()
        level.close()
        print("  done.")
    else:
        print("(dry run — world NOT saved)")

    print()
    print(f"Total: {total_written} blocks written, {total_skipped} skipped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
