#!/usr/bin/env python3
"""Self-test for build-rattanakosin-water-and-walls.py.

Run before deploying any change to the script. Catches:
- projection regression (WGS84 -> block coordinates drift)
- bbox-clip regression (out-of-bbox points leak through)
- gate / fort count regression (operator file loses entries)

No network calls — everything here is local, except the operator file.

Usage:  python3 scripts/test-build-rattanakosin-water-and-walls.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

# Import the script's functions (do not run main)
import importlib.util
spec = importlib.util.spec_from_file_location("build", ROOT / "scripts/build-rattanakosin-water-and-walls.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

WORLD = mod.WORLD
project = mod.project
SURVIVING_GATES = mod.SURVIVING_GATES
SURVIVING_FORTS = mod.SURVIVING_FORTS

def assert_(cond, msg):
    if not cond:
        print(f"  ✗ {msg}")
        sys.exit(1)
    print(f"  ✓ {msg}")


def main() -> int:
    print("Self-test: build-rattanakosin-water-and-walls.py")
    print()

    print("[1] Projection regression checks")
    # corners map to corners
    bl = project(WORLD["min_lon"], WORLD["min_lat"])
    br = project(WORLD["max_lon"], WORLD["min_lat"])
    tl = project(WORLD["min_lon"], WORLD["max_lat"])
    assert_(bl == (0, 3216), f"SW corner -> block {bl} (expected (0, 3216))")
    assert_(br == (3383, 3216), f"SE corner -> block {br} (expected (3383, 3216))")
    assert_(tl == (0, 0), f"NW corner -> block {tl} (expected (0, 0))")

    # known landmark spot-checks
    # Grand Palace centre (100.4915, 13.751)
    gp = project(100.4915, 13.751)
    assert_(abs(gp[0] - 1361) <= 2 and abs(gp[1] - 1675) <= 2, f"Grand Palace -> {gp} (expected ~(1361, 1675))")
    # Wat Pho (100.4903, 14.7467)
    wp = project(100.4903, 13.7467)
    assert_(abs(wp[0] - 1231) <= 2 and abs(wp[1] - 2153) <= 2, f"Wat Pho -> {wp} (expected ~(1231, 2153))")
    # Wat Arun (100.4888, 13.7437)
    wa = project(100.4888, 13.7437)
    assert_(abs(wa[0] - 1069) <= 2 and abs(wa[1] - 2486) <= 2, f"Wat Arun -> {wa} (expected ~(1069, 2486))")

    print()
    print("[2] Clipping regression check")
    pts = [[-100, -50], [100, 100], [3500, 3500], [50, 50]]
    clipped = mod.clip_to_world_bbox(pts)
    assert_(clipped == [[100, 100], [50, 50]], f"clip works: {clipped}")
    # all in
    in_pts = [[1, 1], [10, 10], [100, 100]]
    assert_(mod.clip_to_world_bbox(in_pts) == in_pts, "in-bbox points pass through")
    # all out
    out_pts = [[-1, -1], [4000, 4000]]
    assert_(mod.clip_to_world_bbox(out_pts) == [], "all-out drops to empty")

    print()
    print("[3] Operator-override integrity")
    override_path = ROOT / "site/public/data/known-rattanakosin-gates.json"
    assert_(override_path.exists(), f"operator file exists at {override_path}")
    known = json.loads(override_path.read_text())
    override_names = set(known.keys())
    expected_names = {g["en"] for g in SURVIVING_GATES}
    # the override should cover every surviving gate that OSM does not have
    # today that means at minimum it should cover all 9 (since OSM has 0 with the strict filter)
    missing_from_override = expected_names - override_names
    assert_(not missing_from_override, f"override covers all gates: missing {missing_from_override}")
    # each entry has lon, lat, source
    for name, info in known.items():
        assert_("lon" in info and "lat" in info and "source" in info, f"{name}: has lon/lat/source")
        # inside world bbox?
        x, z = project(info["lon"], info["lat"])
        in_bbox = 0 <= x <= WORLD["max_mc_x"] and 0 <= z <= WORLD["max_mc_z"]
        assert_(in_bbox, f"{name}: project ({x}, {z}) inside world bbox")

    print()
    print("[4] Generated artifact checks")
    for name in ["rattanakosin-water", "rattanakosin-gates", "rattanakosin-forts"]:
        path = ROOT / "site/public/data" / f"{name}.geojson"
        if not path.exists():
            print(f"  ! {name}.geojson not yet generated (run build-rattanakosin-water-and-walls.py)")
            continue
        data = json.loads(path.read_text())
        assert_(data.get("version"), f"{name} has version field")
        assert_(data.get("sources"), f"{name} has sources list")
        assert_(data.get("scale_blocks_per_meter") == 1.0, f"{name} scale 1:1")

    # every block coordinate inside bbox
    water = json.loads((ROOT / "site/public/data/rattanakosin-water.geojson").read_text())
    oob = 0
    for line in water.get("moat", {}).get("lines", []) + water.get("river", {}).get("lines", []):
        for p in line.get("points_block", []):
            if not (0 <= p[0] <= WORLD["max_mc_x"] and 0 <= p[1] <= WORLD["max_mc_z"]):
                oob += 1
    assert_(oob == 0, f"all water points in bbox (oob: {oob})")

    gates = json.loads((ROOT / "site/public/data/rattanakosin-gates.geojson").read_text())
    assert_(len(gates.get("gates", {})) >= 9, f"at least 9 gates: got {len(gates.get('gates', {}))}")
    for name, g in gates.get("gates", {}).items():
        in_bbox = 0 <= g["mcx"] <= WORLD["max_mc_x"] and 0 <= g["mcz"] <= WORLD["max_mc_z"]
        assert_(in_bbox, f"gate {name} block ({g['mcx']}, {g['mcz']}) inside bbox")

    forts = json.loads((ROOT / "site/public/data/rattanakosin-forts.geojson").read_text())
    assert_(len(forts.get("forts", {})) >= 2, f"at least 2 forts: got {len(forts.get('forts', {}))}")

    print()
    print("All self-tests pass.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
