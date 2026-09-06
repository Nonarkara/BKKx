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


def surface_at(level, x: int, z: int) -> int | None:
    """Highest non-air y in the column, or None if the chunk is absent."""
    for y in range(Y_TOP, Y_BOTTOM - 1, -1):
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
    surfaces = []
    missing = 0
    for x, z in columns:
        s = surface_at(level, x, z)
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
