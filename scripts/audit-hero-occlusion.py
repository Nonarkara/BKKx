#!/usr/bin/env python3
"""Which OSM detail boxes stand under each hero monument, and how many rowhouse
candidates are extruded twice.

Written for AUDIT-2026-09-06.md. Pure python (ray-cast point-in-polygon), reads
the atlas's own geojson, prints two tables:

  A. per hero group: the detail boxes whose centroid lies inside the hero's
     lowest part (or vice versa), the tallest box, and how many parts of the
     monument sit entirely below that box's top — i.e. are occluded in the
     atlas's opaque, depth-tested extrusion.
  B. rowhouse candidates whose centroid lies inside a detail box, split by
     which of the two extrusions is taller.

Run:  python3 scripts/audit-hero-occlusion.py            # this checkout
      python3 scripts/audit-hero-occlusion.py <repo-root>  # another worktree

When the boxes under the monuments are hidden (hide_3d), table A should read
zero occluded parts everywhere; that is the moment this becomes a verify step.
"""
import json, sys, statistics
W = sys.argv[1] if len(sys.argv) > 1 else str(__import__("pathlib").Path(__file__).resolve().parents[1])
D = lambda n: json.load(open(f"{W}/site/public/data/{n}"))["features"]
detail, heroes, cands = D("bkk-heritage-detail.geojson"), D("bkk-hero-monuments.geojson"), D("bangkok-rowhouse-footprint-candidates.geojson")

def rings(geom):
    if geom["type"] == "Polygon": yield geom["coordinates"][0]
    elif geom["type"] == "MultiPolygon":
        for poly in geom["coordinates"]: yield poly[0]
def pip(pt, ring):
    x, y = pt; inside = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: inside = not inside
    return inside
def inside(pt, geom): return any(pip(pt, r) for r in rings(geom))
def centroid(geom):
    pts = [p for r in rings(geom) for p in r]
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))
def bbox(geom):
    pts = [p for r in rings(geom) for p in r]
    return min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts)

# (a) boxes under heroes
by_hero = {}
for f in heroes: by_hero.setdefault(f["properties"]["hero_id"], []).append(f)
print("A. OSM detail boxes under each hero monument (as committed in this checkout)")
print(f"{'hero':32s} {'parts':>5s} {'top m':>6s} {'plinth m':>8s} {'boxes':>5s} {'box h max':>9s}  box ids / height_source / render_height")
tot_parts = tot_occluded = 0
for hid, parts in by_hero.items():
    top = max(p["properties"].get("base_height", 0) + p["properties"]["height"] for p in parts)
    lowest = min(parts, key=lambda p: p["properties"].get("base_height", 0))
    plinth = lowest["properties"]["height"]
    hb = bbox(lowest["geometry"])
    hc = centroid(lowest["geometry"])
    boxes = []
    for d in detail:
        db = bbox(d["geometry"])
        if db[2] < hb[0] or db[0] > hb[2] or db[3] < hb[1] or db[1] > hb[3]: continue
        if inside(centroid(d["geometry"]), lowest["geometry"]) or inside(hc, d["geometry"]):
            boxes.append(d)
    tot_parts += len(parts)
    bh = max((b["properties"].get("render_height") or b["properties"].get("height") or 0) for b in boxes) if boxes else 0
    # a part is occluded if a box under it is at least as tall as the part's top
    occl = sum(1 for p in parts if bh >= p["properties"].get("base_height", 0) + p["properties"]["height"])
    tot_occluded += occl
    ids = "; ".join(f"{b['properties'].get('id')}/{b['properties'].get('height_source')}/rh={b['properties'].get('render_height')} h={b['properties'].get('height')}" for b in boxes[:4])
    print(f"{hid:32s} {len(parts):5d} {top:6.0f} {plinth:8.1f} {len(boxes):5d} {bh:9.1f}  {ids}  occluded_parts={occl}")
print(f"TOTAL parts={tot_parts} parts fully inside a box={tot_occluded}")
print("detail features with render_height==0 or missing:", sum(1 for d in detail if not d["properties"].get("render_height")))

# (b) candidates double-extruded
def cand_h(p):
    n = p.get("num_floors")
    try: n = float(n) if n not in (None, "") else 0
    except: n = 0
    return 3.5 + 3 * (n - 1) if n > 0 else 6.5
# spatial index on detail bboxes by coarse grid
grid = {}
for i, d in enumerate(detail):
    x0, y0, x1, y1 = bbox(d["geometry"])
    for gx in range(int(x0 * 1000), int(x1 * 1000) + 1):
        for gy in range(int(y0 * 1000), int(y1 * 1000) + 1):
            grid.setdefault((gx, gy), []).append(i)
same = cand_taller = det_taller = 0; diffs = []; keys = set()
for c in cands:
    keys |= set(c["properties"].keys())
    pt = centroid(c["geometry"])
    hit = None
    for i in grid.get((int(pt[0] * 1000), int(pt[1] * 1000)), []):
        if inside(pt, detail[i]["geometry"]): hit = detail[i]; break
    if not hit: continue
    ch = cand_h(c["properties"]); dh = hit["properties"].get("render_height") or hit["properties"].get("height") or 0
    if abs(ch - dh) < 0.01: same += 1
    elif ch > dh: cand_taller += 1
    else: det_taller += 1
    diffs.append(abs(ch - dh))
print("\nB. candidates whose centroid lies inside an OSM detail box (both layers extrude by default)")
print(f"overlapping={len(diffs)} same_height={same} candidate_taller={cand_taller} detail_taller={det_taller} median_abs_diff_m={statistics.median(diffs) if diffs else None}")
print("candidate has num_floors key:", "num_floors" in keys, "| keys:", sorted(keys))
