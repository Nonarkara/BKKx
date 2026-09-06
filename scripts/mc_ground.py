"""
mc_ground.py
------------
Where the ground actually is, measured from the world rather than assumed.

Every block plan in this repository once said `groundY: 64` — Minecraft's
vanilla sea level — for worlds Arnis generated as superflats with their
surface near y = −62 (AUDIT-2026-09-06.md §4.1). The repository already knew:
build-heritage-register.py reads SpawnY out of level.dat "because assuming 64
is ~120 blocks of freefall above a world whose ground sits near y = −60". The
knowledge lived in one docstring and did not reach the appliers, which would
have written every monument into the sky.

So the appliers no longer trust a plan's ground. They probe the world —
the highest non-air block over a spread of columns, the most common such
height across them, plus one — and re-base every y in the plan by the
difference. The plan's `groundY` becomes what it always was, an assumption
with its source stated; the world's answer wins.

Pure python apart from the level object handed in, so the arithmetic is
testable with a fake level (scripts/test-mc-ground.py) and the amulet import
stays lazy in the appliers.
"""
from __future__ import annotations

from collections import Counter

DIMENSION = "minecraft:overworld"
GAME_VERSION = ("java", (1, 21, 4))

# What the surface scan looks through. cave_air/void_air are air too.
AIR = {"air", "cave_air", "void_air"}

# Java 1.18+ world height. The scan starts at the top so a tall building
# never reads as "the ground"; the mode across columns takes care of the
# rest, because most columns of a city are street, not tower.
Y_TOP = 319
Y_BOTTOM = -64


def sample_columns(max_x: int, max_z: int, per_axis: int = 8) -> list[tuple[int, int]]:
    """A per_axis × per_axis grid of columns, inset so no sample sits on the
    world edge where chunks may be missing."""
    xs = [int(round(max_x * (i + 0.5) / per_axis)) for i in range(per_axis)]
    zs = [int(round(max_z * (j + 0.5) / per_axis)) for j in range(per_axis)]
    return [(x, z) for x in xs for z in zs]


def world_bounds(level, dimension: str = DIMENSION) -> tuple[int, int] | None:
    """The world's declared (min_y, max_y), or None if it will not say.

    Read from level.dat, not from the chunks: it is what amulet's save path
    obeys, and a world that declares the pre-1.18 range keeps only the
    sub-chunks inside it.
    """
    try:
        group = level.bounds(dimension)
    except Exception:
        return None
    try:
        return int(group.min_y), int(group.max_y)
    except AttributeError:
        pass
    boxes = list(getattr(group, "selection_boxes", []) or [])
    if not boxes:
        return None
    return min(int(b.min_y) for b in boxes), max(int(b.max_y) for b in boxes)


def sample_around(spans: list, margin: int = 6, per_axis: int = 9) -> list[tuple[int, int]]:
    """Columns to probe for the ground a plan will stand on.

    A grid over the plan's own bounding box, dilated by `margin`, with the
    plan's footprints themselves removed. Two reasons not to sample the
    footprints: whatever the generator already put there — the boxy
    extrusion the applier is about to clear — is standing on them, and it is
    the ground BESIDE a monument, the street it fronts, that the monument
    should sit on.

    And two reasons not to sample the whole world, which is what this did
    first: a partially generated world has no chunks at its far corner, so
    the probe refused a world it could have measured; and on a real city the
    ground under the Grand Palace is the only ground that matters to the
    Grand Palace.
    """
    occupied = {(x, z) for z, a, b in spans for x in range(a, b + 1)}
    xs = [x for _, a, b in spans for x in (a, b)]
    zs = [z for z, _, _ in spans]
    if not xs:
        return []
    x0, x1 = min(xs) - margin, max(xs) + margin
    z0, z1 = min(zs) - margin, max(zs) + margin
    out = []
    for i in range(per_axis):
        for j in range(per_axis):
            x = x0 + round((x1 - x0) * i / max(1, per_axis - 1))
            z = z0 + round((z1 - z0) * j / max(1, per_axis - 1))
            if (x, z) not in occupied:
                out.append((x, z))
    return out


def block_name(level, x: int, y: int, z: int) -> str | None:
    """The block's base name at (x, y, z), or None when the chunk is absent.

    Tries the versioned read the appliers write with, then the plain one the
    rattanakosin applier reads with; a fake level in the tests implements
    whichever it likes.
    """
    for call in (
        lambda: level.get_version_block(x, y, z, DIMENSION, GAME_VERSION),
        lambda: level.get_block(x, y, z, DIMENSION),
    ):
        try:
            got = call()
        except AttributeError:
            continue
        except Exception:
            return None
        block = got[0] if isinstance(got, tuple) else got
        name = getattr(block, "base_name", None)
        if name is None:
            name = str(block).split(":", 1)[-1].split("[", 1)[0]
        return name
    return None


def surface_at(level, x: int, z: int, top: int = Y_TOP, bottom: int = Y_BOTTOM) -> int | None:
    """Highest non-air y in the column, or None if the chunk is absent.

    The scan starts at the world's own ceiling, not at 319: reading above a
    world's declared height raises, which this would read as "chunk absent"
    and report every column of a perfectly good old world as ungenerated.
    """
    for y in range(top, bottom - 1, -1):
        name = block_name(level, x, y, z)
        if name is None:
            return None
        if name not in AIR:
            return y
    return None


def probe_ground(level, columns: list[tuple[int, int]]) -> dict:
    """The ground plane — the first air block above the most common surface.

    Returns the plane and how it was reached, so an applier can print the
    evidence beside the number it is about to build on.
    """
    bounds = world_bounds(level)
    top, bottom = (bounds[1] - 1, bounds[0]) if bounds else (Y_TOP, Y_BOTTOM)
    surfaces = []
    missing = 0
    for x, z in columns:
        s = surface_at(level, x, z, top, bottom)
        if s is None:
            missing += 1
        else:
            surfaces.append(s)
    if not surfaces:
        raise SystemExit(
            f"probe_ground: none of the {len(columns)} sampled columns has a generated chunk — "
            "is this the right world?"
        )
    histogram = Counter(surfaces)
    # The mode; the lowest of tied modes, because a tie between street and
    # something on it should resolve to the street.
    best = max(histogram.values())
    surface = min(y for y, n in histogram.items() if n == best)
    return {
        "groundY": surface + 1,
        "surface": surface,
        "samples": len(columns),
        "missing": missing,
        "agreement": best / len(surfaces),
        "histogram": dict(sorted(histogram.items())),
    }


def rebase(items: list[dict], delta: int, keys: tuple[str, ...] = ("yFrom", "yTo")) -> int:
    """Shift every y range in place. Returns the number of items touched."""
    if not delta:
        return 0
    for item in items:
        for key in keys:
            if key in item:
                item[key] += delta
    return len(items)


def assert_fits(level, y_from: int, y_to: int, dimension: str = DIMENSION) -> str:
    """Refuse a plan the world cannot hold. Returns the line to print.

    THE FAILURE THIS PREVENTS. amulet's `set_version_block` succeeds for a y
    outside the world's declared height — the block goes into the in-memory
    chunk, `save()` drops the sub-chunk, and the applier reports every block
    written while the world receives none. Measured, not supposed: a world
    whose level.dat does not declare its height falls back to y=0..256, and
    writes at y=-61 vanish on save with no error anywhere
    (AUDIT-2026-09-06.md, disposition).

    So the plan's range is checked against the declared bounds before a
    single block is written, and a world that cannot hold it is refused
    rather than half-built.
    """
    bounds = world_bounds(level, dimension)
    if bounds is None:
        return f"world bounds: not declared — writing y {y_from}..{y_to} unchecked"
    lo, hi = bounds
    if y_from < lo or y_to >= hi:
        raise SystemExit(
            f"the plan spans y {y_from}..{y_to}, the world declares y {lo}..{hi - 1}.\n"
            "Blocks outside a world's declared height are accepted by the API and "
            "dropped by the save, so this would report success and write nothing.\n"
            "Either the world is the wrong one, or its level.dat does not declare its "
            "height (see scripts/make-fixture-world.py, fix_level_dat)."
        )
    return f"world bounds: y {lo}..{hi - 1} — the plan's y {y_from}..{y_to} fits"


def sample_writes(writes: dict[tuple[int, int, int], str], want: int = 240) -> list[tuple[int, int, int, str]]:
    """An evenly spread, deterministic sample of the plan's FINAL intended state.

    A dict keyed by cell, not a list of calls, because the appliers write some
    cells more than once by design — a party wall over a body, a roof course
    over the top of it, glass punched into a window, air punched into a
    shopfront. Checking a cell against the first thing written there fails on
    every one of those, which is what the first version of this did: it
    reported 53 of 240 wrong on a world that was correct.
    """
    cells = sorted(writes.items())
    if len(cells) > want:
        step = len(cells) / want
        cells = [cells[int(i * step)] for i in range(want)]
    return [(x, y, z, name) for (x, y, z), name in cells]


def verify_written(level, samples: list[tuple[int, int, int, str]], dimension: str = DIMENSION) -> dict:
    """Read sampled blocks back and count how many are what the plan said.

    Call it on a level opened AFTER the save: reading the level that did the
    writing proves only that they reached memory.
    """
    ok = wrong = missing = 0
    first_bad = None
    for x, y, z, expected in samples:
        name = block_name(level, x, y, z)
        if name is None:
            missing += 1
            first_bad = first_bad or (x, y, z, expected, "chunk absent")
        elif name == expected.split(":", 1)[-1]:
            ok += 1
        else:
            wrong += 1
            first_bad = first_bad or (x, y, z, expected, name)
    return {"sampled": len(samples), "ok": ok, "wrong": wrong, "missing": missing, "firstBad": first_bad}


def resolve_ground(plan_ground: int, level, override: int | None, probe: bool, columns) -> tuple[int, str]:
    """The ground to build on, and where the number came from."""
    if override is not None:
        return override, f"--ground-y {override} (given; plan says {plan_ground})"
    if not probe or level is None:
        return plan_ground, f"plan groundY {plan_ground} (not probed)"
    p = probe_ground(level, columns)
    how = (
        f"probed: surface y={p['surface']} in {p['agreement']:.0%} of {p['samples'] - p['missing']} "
        f"sampled columns ({p['missing']} missing) -> ground plane y={p['groundY']}; plan said {plan_ground}"
    )
    return p["groundY"], how
