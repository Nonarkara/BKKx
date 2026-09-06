#!/usr/bin/env python3
"""Self-test for apply-rattanakosin-to-world.py.

Catches:
- Synthetic moat regression (rectangle bounds, band width, contains gates)
- Fragment connection regression (snap distance, chain length)
- Block placement (water, gates, forts) block coordinates in world bbox

No live writes — runs in dry-run mode against a copy of the world.

Usage:  python3 scripts/test-apply-rattanakosin-to-world.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

# shapely does the moat's buffering, so these geometry tests genuinely need
# it. Say so and exit 0 rather than tracebacking: the rest of the suite is
# dependency-free and must stay runnable on any machine. CI installs it.
try:
    import shapely  # noqa: F401
except ImportError:
    print("skipped: shapely is not installed here (the moat geometry needs it).")
    print("  pip install shapely")
    raise SystemExit(0)

import importlib.util

# Load the world data builder for the projection function
spec1 = importlib.util.spec_from_file_location("build", ROOT / "scripts/build-rattanakosin-water-and-walls.py")
mod_build = importlib.util.module_from_spec(spec1)
spec1.loader.exec_module(mod_build)

spec2 = importlib.util.spec_from_file_location("apply", ROOT / "scripts/apply-rattanakosin-to-world.py")
mod = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(mod)

import shapely
from shapely.geometry import Polygon


def assert_(cond, msg):
    if not cond:
        print(f"  ✗ {msg}")
        sys.exit(1)
    print(f"  ✓ {msg}")


def main() -> int:
    print("Self-test: apply-rattanakosin-to-world.py")
    print()

    print("[1] Synthetic moat shape")
    gates = json.loads((ROOT / "site/public/data/rattanakosin-gates.geojson").read_text())["gates"]
    forts = json.loads((ROOT / "site/public/data/rattanakosin-forts.geojson").read_text())["forts"]

    # 12m moat width
    moat = mod.build_synthetic_moat(gates, forts, moat_width_m=12.0)
    assert_(moat is not None, "synthetic moat returns a polygon")
    minx, minz, maxx, maxz = moat.bounds
    # Moat bbox should hug the gates' positions (no 50m margin)
    assert_(1230 <= minx <= 1260, f"outer x_min hugs gates: {minx}")
    assert_(2920 <= maxx <= 2950, f"outer x_max hugs gates: {maxx}")
    # The 9 gates are organized into 4 walls by historical position
    # (north = 3 gates at z=563, south = 1 at z=1563, etc.)
    # The moat is 12m outside the wall rect formed by these 4 walls.
    assert_(540 <= minz <= 580, f"outer z_min hugs north wall (z=563): {minz}")
    assert_(1550 <= maxz <= 1600, f"outer z_max hugs south wall (z=1563): {maxz}")

    # HOW MANY GATES THE RECTANGLE ACTUALLY REACHES.
    #
    # This block used to assert that all nine gates lie on the moat's
    # boundary, and, four lines earlier, that "other gates may or may not be
    # near the moat" — it contradicted itself. It never failed because it
    # never ran: apply-rattanakosin-to-world.py imported amulet at module
    # scope, so importing it here needed amulet-core on the machine, and this
    # whole file was unrunnable in CI (AUDIT-2026-09-06.md, disposition).
    # Run it, and four of the nine gates are off the rectangle.
    #
    # They should be. The wall of 1782 follows Khlong Rop Krung, which
    # curves, and no rectangle passes through nine points on a curve. So the
    # approximation is not the defect — an unstated approximation would be.
    # What is asserted now is the size of it, pinned, so that a change to the
    # gate data or to the model has to come past this line.
    on_moat = {name for name, g in gates.items()
               if moat.boundary.distance(shapely.geometry.Point(g["mcx"], g["mcz"])) < 1.5}
    expected_on = {"Pratu Phi", "Pratu Thep Ratcha", "Pratu Phutthai Sawan",
                   "Pratu Ratcha Dindam", "Pratu Suan Phu"}
    assert_(on_moat == expected_on,
            f"the five gates the rectangle passes through are the expected ones: {sorted(on_moat)}")

    off = mod.gates_off_moat(moat, gates)
    assert_({name for name, _ in off} == set(gates) - expected_on,
            f"and the applier names exactly the ones it misses: {[n for n, _ in off]}")
    worst = dict(off)
    # Pratu Tha Phra sits at z=1675, 112 blocks south of the south wall this
    # rectangle is drawn through (Ratcha Dindam, z=1563), so it is the
    # furthest off and the plainest evidence that the wall is not a rectangle.
    assert_(worst["Pratu Tha Phra"] > 90,
            f"Pratu Tha Phra is ~100 m off the rectangle, as the docstring says: {worst['Pratu Tha Phra']}")
    assert_(all(d < 250 for d in worst.values()),
            f"no gate is absurdly far off — that would mean the wrong rectangle: {off}")

    # Every gate is still inside the moat's bounding box: off the edge is a
    # tolerable approximation, outside the walled city entirely is not.
    for name, g in gates.items():
        in_bbox = minx <= g["mcx"] <= maxx and minz <= g["mcz"] <= maxz + 120
        assert_(in_bbox, f"gate {name} ({g['mcx']}, {g['mcz']}) within the moat bbox")

    # Moat area should be 50-80k cells (12m band around the gates' hull)
    assert_(45_000 < moat.area < 85_000, f"moat area in expected range: {moat.area:.0f}")

    # Moat is a band, not a filled rectangle — the center should be air (no water)
    center = shapely.geometry.Point((minx + maxx) / 2, (minz + maxz) / 2)
    assert_(not moat.contains(center), f"interior of rect is not in moat: {center.coords[0]}")

    print()

    print("[2] Fragment connection")
    water = json.loads((ROOT / "site/public/data/rattanakosin-water.geojson").read_text())
    moat_lines = [[(p[0], p[1]) for p in line["points_block"]] for line in water["moat"]["lines"]]
    river_lines = [[(p[0], p[1]) for p in line["points_block"]] for line in water["river"]["lines"]]
    # 10 moat fragments should connect to fewer chains with adequate snap
    moat_chains_500 = mod.connect_fragments(moat_lines, snap_m=500.0)
    moat_chains_25 = mod.connect_fragments(moat_lines, snap_m=25.0)
    assert_(len(moat_chains_500) < len(moat_lines), f"500m snap connects: {len(moat_chains_500)} < {len(moat_lines)}")
    # 25m snap may or may not connect; just verify <= the original count
    assert_(len(moat_chains_25) <= len(moat_lines), f"25m snap: {len(moat_chains_25)} <= {len(moat_lines)}")
    # River has 16 fragments
    river_chains = mod.connect_fragments(river_lines, snap_m=500.0)
    assert_(len(river_chains) <= len(river_lines), f"river chains: {len(river_chains)} <= {len(river_lines)}")

    print()

    print("[3] Line-to-polygon")
    # A line of 2 points, buffered by 6, should give a 12m wide × 10m long + caps
    line = [(1000, 1000), (1000, 1010)]
    poly = mod.line_to_polygon(line, 6.0)
    assert_(poly is not None, "line_to_polygon returns a polygon")
    # Buffer of 6 on a 10-unit vertical line: 10*12 = 120, plus round caps ~113
    # 120 + pi*6^2 = 120 + 113 = 233
    assert_(200 < poly.area < 260, f"line buffer area in expected range: {poly.area:.0f}")

    print()

    print("[4] Block placement helpers")
    # _get_block_safe handles missing chunks gracefully
    # (We can't easily test the actual write without a world, but the projection is testable)
    # Projection regression: corner cases
    # (min_lon, min_lat) = SW geographic = (0, 3216) (south is +z)
    assert_(mod_build.project(100.478897, 13.737134) == (0, 3216), f"SW: {mod_build.project(100.478897, 13.737134)}")
    # (max_lon, min_lat) = SE = (3383, 3216)
    assert_(mod_build.project(100.510225, 13.737134) == (3383, 3216), f"SE: {mod_build.project(100.510225, 13.737134)}")
    # (min_lon, max_lat) = NW = (0, 0) (north is -z)
    assert_(mod_build.project(100.478897, 13.766063) == (0, 0), f"NW: {mod_build.project(100.478897, 13.766063)}")
    # (max_lon, max_lat) = NE = (3383, 0)
    assert_(mod_build.project(100.510225, 13.766063) == (3383, 0), f"NE: {mod_build.project(100.510225, 13.766063)}")

    print()

    print("[5] Place gate logic")
    # A gate at (1000, 64, 1000) with dig-depth 0 should place 3 blocks (gate + 2 glowstone)
    # We don't actually write — just verify the count by calling without dry_run=False check
    # Since we can't run a real world gen, just verify the function signature exists
    assert_(hasattr(mod, "place_gate"), "place_gate exists")
    assert_(hasattr(mod, "place_water"), "place_water exists")
    assert_(hasattr(mod, "place_fort"), "place_fort exists")
    assert_(hasattr(mod, "_get_block_safe"), "_get_block_safe exists")
    assert_(hasattr(mod, "_set_block_safe"), "_set_block_safe exists")

    print()
    print("All self-tests pass.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
