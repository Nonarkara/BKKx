#!/usr/bin/env python3
"""Checks for site/scripts/cap-default-heights.py against the committed data."""
import importlib.util
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "site"
spec = importlib.util.spec_from_file_location("cap", ROOT / "scripts/cap-default-heights.py")
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)

detail = json.loads((ROOT / "public/data/bkk-heritage-detail.geojson").read_text())["features"]
landmarks = json.loads((ROOT / "public/data/bkk-landmarks.geojson").read_text())["features"]
by_id = {f["properties"]["id"]: f for f in detail}
fails = []


def check(ok, msg):
    if not ok:
        fails.append(msg)


capped = [f for f in detail if "height_cap" in f["properties"]]
check(len(capped) > 0, "nothing capped")
for f in detail:
    p = f["properties"]
    if C.eligible(p):
        cap = C.cap_for(f)
        check(cap is None or p["height"] <= round(cap, 1) + 1e-9, f"{p['id']}: {p['height']} m above its cap {cap}")
    else:
        check("height_cap" not in p, f"{p['id']}: {p.get('height_source')} height was capped; only category defaults may be")
for f in capped:
    p = f["properties"]
    check(p["type_default_height"] > p["height"], f"{p['id']}: cap did not lower the default")
    check(p["height"] == p["render_height"], f"{p['id']}: height and render_height disagree")
    check(p["height"] != C.SENTINEL, f"{p['id']}: capped to 9.0, which the paint reads as 'no height'")
    check(p.get("height_source") in ("type-default", *C.DEFAULT_SOURCES), f"{p['id']}: height_source rewritten")
for f in landmarks:
    p = f["properties"]
    if "height_cap" in p:
        d = by_id.get(p["id"], {}).get("properties", {})
        check(d.get("height") == p["height"], f"landmark {p['id']} capped differently from its detail record")

# The fault that prompted the rule: the pavilions round Wat Phra Kaew's ubosot
# (bkk-building-7824533xx, building=chapel) stood 14 m against walls of ~9 m.
wpk_pavilions = [f["properties"] for f in detail
                 if f["properties"]["id"].startswith("bkk-building-7824533") and f["properties"].get("building") == "chapel"]
check(len(wpk_pavilions) >= 10, "Wat Phra Kaew pavilions missing from the fixture")
check(all(p["height"] < 9 for p in wpk_pavilions), "a Wat Phra Kaew pavilion still stands 9 m or taller")

r = subprocess.run([sys.executable, str(ROOT / "scripts/cap-default-heights.py"), "--check"], capture_output=True, text=True)
check(r.returncode == 0, "committed heights are stale: " + r.stdout.strip())

if fails:
    print("\n".join(fails[:20]))
    sys.exit(1)
print(f"all checks passed ({len(capped)} capped)")
