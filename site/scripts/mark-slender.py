#!/usr/bin/env python3
"""
mark-slender.py
---------------
Flag the named chedis, prangs, mondops, prasats and throne pavilions whose
footprint is far narrower than the height the atlas gives them.

Drawn as a box at that height, Phra Thinang Sanam Chan (a ~3 m pavilion) is a
20 m column and a chedi base is a 40 m tower. Nobody who knows the Grand
Palace has seen those. Flagged footprints draw as a low pad: it says where the
building stands without inventing its shape. Where a Thai form or hero model
exists, that draws the real taper.

Rule: the name says it is a chedi/prang/mondop/prasat/throne hall (and not a
viharn or ubosot), and height > 1.5 x the narrow side of its bounding box.
Unnamed buildings are never guessed into spires. Writes `slender: true`,
clears a stale flag, and is a pure function of the files: running it twice
changes nothing.
"""
import json
import math
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "public" / "data"
LAYERS = [DATA / "bkk-heritage-detail.geojson", DATA / "bkk-landmarks.geojson"]
SPIRE_NAME = re.compile("เจดีย์|ปรางค์|มณฑป|ปราสาท|พระที่นั่ง")
HALL_NAME = re.compile("วิหาร|อุโบสถ")


def height_of(p: dict) -> float:
    for k in ("render_height", "height"):
        try:
            v = float(p.get(k))
            if v > 0:
                return v
        except (TypeError, ValueError):
            pass
    return 0.0


def narrow_side_m(geom: dict) -> float:
    ring = geom["coordinates"][0] if geom["type"] == "Polygon" else geom["coordinates"][0][0]
    xs = [c[0] for c in ring]
    ys = [c[1] for c in ring]
    lat = sum(ys) / len(ys)
    # ponytail: bounding box, so a rotated footprint reads wider and is spared.
    return min((max(xs) - min(xs)) * 111_320 * math.cos(math.radians(lat)), (max(ys) - min(ys)) * 110_540)


def is_slender(f: dict) -> bool:
    p = f.get("properties") or {}
    g = f.get("geometry") or {}
    name = p.get("name") or ""
    if g.get("type") not in ("Polygon", "MultiPolygon") or not SPIRE_NAME.search(name) or HALL_NAME.search(name):
        return False
    return height_of(p) > 1.5 * narrow_side_m(g)


def main() -> int:
    for path in LAYERS:
        raw = path.read_bytes()
        obj = json.loads(raw)
        n = 0
        for f in obj["features"]:
            p = f.setdefault("properties", {})
            if is_slender(f):
                p["slender"] = True
                n += 1
            else:
                p.pop("slender", None)
        text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
        out = (text + ("\n" if raw.endswith(b"\n") else "")).encode("utf-8")
        if out != raw:
            path.write_bytes(out)
        print(f"mark-slender: {path.name}: {n} slender")
    return 0


if __name__ == "__main__":
    sys.exit(main())
