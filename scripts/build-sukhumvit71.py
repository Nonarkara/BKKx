#!/usr/bin/env python3
"""
build-sukhumvit71.py
--------------------
Build the Sukhumvit 71 (Pridi Banomyong) study corridor for
shophouses.nonarkara.org: the road centreline, and every building
footprint along it screened for shophouse morphology.

Why a morphology screen and not a "shophouse" tag: OpenStreetMap has no
shophouse tag, and Thailand's building attributes are sparse. What a
shophouse *is* geometrically, however, is unusually legible — a narrow
frontage (3.5-5 m per the studio's measured elevations), a deep plan
(10-12 m), a party wall on both sides, and neighbours repeating the same
rhythm along a street axis. That is what this screens for. The output is
a CANDIDATE set for field review, exactly like the rowhouse footprint
候補 layer already shipping at /rowhouses — it does not assert that any
individual building is a shophouse, its age, or its heritage status.

Sources
  * Geometry + attributes: OpenStreetMap via Overpass API (ODbL).
  * Frontage/depth expectations: Chuenrudeemol, "Shophouse Metropolis"
    (Harvard GSD studio book, 2026) — 3.5-5 m frontage, 10-12 m depth,
    2-4 storeys.

Usage:
    python3 scripts/build-sukhumvit71.py            # cached
    python3 scripts/build-sukhumvit71.py --refresh  # re-query Overpass
"""
from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "sukhumvit71"
OUT = ROOT / "site" / "public" / "data" / "sukhumvit71-corridor.geojson"
OVERPASS = "https://overpass-api.de/api/interpreter"
UA = "BKKx/1.0 (+https://shophouses.nonarkara.org; studio corridor build)"

# The corridor. Sukhumvit 71 / Pridi Banomyong runs north from Sukhumvit
# Road at Phra Khanong. This bbox covers the studio's stretch: the
# southern Sukhumvit intersection ("Little Myanmar", the old Phra Khanong
# theatre block) up through the mid-section to the northern end.
BBOX = (13.7075, 100.5790, 13.7405, 100.6015)  # S, W, N, E

# Shophouse morphology gates, from the studio's measured elevations.
MIN_FRONT_M, MAX_FRONT_M = 3.0, 7.5      # narrow bay
MIN_DEPTH_M, MAX_DEPTH_M = 7.0, 26.0     # deep plan
MIN_AREA_M2, MAX_AREA_M2 = 35.0, 260.0   # one unit's footprint
MIN_RATIO = 1.45                          # depth : frontage
NEIGHBOUR_RADIUS_M = 34.0                 # a row, not a lone building
MIN_ALIGNED_NEIGHBOURS = 2


def overpass(query: str, name: str, refresh: bool) -> dict:
    """Query Overpass, cached. Retries: the public instance rate-limits
    back-to-back queries and answers with an HTML error page, not JSON."""
    CACHE.mkdir(parents=True, exist_ok=True)
    cache = CACHE / f"{name}.json"
    if cache.exists() and not refresh:
        return json.loads(cache.read_text())
    last = ""
    for attempt in range(1, 5):
        print(f"  querying Overpass for {name} (attempt {attempt}) ...", file=sys.stderr)
        raw = subprocess.run(
            ["curl", "-s", "--max-time", "240", "-A", UA, "-d", query, OVERPASS],
            capture_output=True, check=True,
        ).stdout
        try:
            data = json.loads(raw)
            cache.write_text(json.dumps(data))
            return data
        except json.JSONDecodeError:
            last = raw[:200].decode("utf-8", "replace")
            time.sleep(20 * attempt)
    raise SystemExit(f"Overpass never returned JSON for {name}; last body: {last!r}")


def ring_from_way(el: dict, nodes: dict) -> list[tuple[float, float]] | None:
    if "geometry" in el:
        return [(p["lon"], p["lat"]) for p in el["geometry"]]
    ids = el.get("nodes") or []
    pts = [nodes[i] for i in ids if i in nodes]
    return pts if len(pts) >= 4 else None


def metres_per_degree(lat: float) -> tuple[float, float]:
    """Local planar scale. Bangkok is ~13.7°N; good to a fraction of a percent."""
    return (111_320.0 * math.cos(math.radians(lat)), 110_574.0)


def min_area_rect(pts_m: list[tuple[float, float]]) -> tuple[float, float, float]:
    """Rotating-calipers minimum-area bounding rectangle.

    Returns (short_side_m, long_side_m, orientation_deg). The short side is
    the street frontage for a terraced building — that is the whole point of
    using the oriented rectangle rather than an axis-aligned bbox, which
    would report a diagonal street's buildings as square.
    """
    hull = convex_hull(pts_m)
    if len(hull) < 3:
        return (0.0, 0.0, 0.0)
    best = None
    for i in range(len(hull)):
        x1, y1 = hull[i]
        x2, y2 = hull[(i + 1) % len(hull)]
        ang = math.atan2(y2 - y1, x2 - x1)
        ca, sa = math.cos(-ang), math.sin(-ang)
        xs = [p[0] * ca - p[1] * sa for p in hull]
        ys = [p[0] * sa + p[1] * ca for p in hull]
        w, h = max(xs) - min(xs), max(ys) - min(ys)
        area = w * h
        if best is None or area < best[0]:
            best = (area, min(w, h), max(w, h), math.degrees(ang) % 180.0)
    return (best[1], best[2], best[3])


def convex_hull(pts: list[tuple[float, float]]) -> list[tuple[float, float]]:
    pts = sorted(set(pts))
    if len(pts) <= 2:
        return pts
    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower: list = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper: list = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def polygon_area_m2(pts_m: list[tuple[float, float]]) -> float:
    a = 0.0
    for i in range(len(pts_m)):
        x1, y1 = pts_m[i]
        x2, y2 = pts_m[(i + 1) % len(pts_m)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2.0


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--refresh", action="store_true")
    args = ap.parse_args()

    s, w, n, e = BBOX
    bbox = f"{s},{w},{n},{e}"

    road_q = f"""[out:json][timeout:120];
(
  way["name"~"Pridi Banomyong|ปรีดี พนมยงค์|Sukhumvit 71|สุขุมวิท 71"]({bbox});
);
out geom;"""
    bldg_q = f"""[out:json][timeout:180];
(
  way["building"]({bbox});
);
out geom;"""

    road = overpass(road_q, "road", args.refresh)
    bldgs = overpass(bldg_q, "buildings", args.refresh)

    features: list[dict] = []

    # --- the corridor centreline -------------------------------------
    # The Overpass name filter also returns every numbered soi branching off
    # Pridi Banomyong. The studio's site is the spine, so the spine and the
    # sois are separated here: only the spine seeds the distance band below.
    road_ways = [el for el in road.get("elements", []) if el.get("type") == "way"]
    spine_pts_m: list[list[tuple[float, float]]] = []
    mid_lat = (s + n) / 2
    mx, my = metres_per_degree(mid_lat)

    n_spine = 0
    for el in road_ways:
        geom = el.get("geometry") or []
        if len(geom) < 2:
            continue
        tags = el.get("tags", {})
        name = tags.get("name") or ""
        name_en = tags.get("name:en") or ""
        # The spine carries no soi number; the branches all do.
        is_spine = ("ซอย" not in name) and ("Soi" not in name_en) and not any(
            ch.isdigit() for ch in name.replace("71", "")
        )
        layer = "corridor" if is_spine else "soi"
        if is_spine:
            n_spine += 1
            spine_pts_m.append([((p["lon"]) * mx, (p["lat"]) * my) for p in geom])
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [[round(p["lon"], 6), round(p["lat"], 6)] for p in geom],
            },
            "properties": {
                "layer": layer,
                "osm_id": f"way/{el['id']}",
                "name_en": name_en or "Sukhumvit 71 (Pridi Banomyong)",
                "name_th": name or "ถนนปรีดี พนมยงค์",
                "source": "OpenStreetMap contributors (ODbL)",
            },
        })
    print(f"  corridor ways: {len(road_ways)} ({n_spine} spine, "
          f"{len(road_ways) - n_spine} soi)", file=sys.stderr)

    def dist_to_spine_m(lon: float, lat: float) -> float:
        """Shortest distance from a point to the spine polyline, in metres."""
        px, py = lon * mx, lat * my
        best = float("inf")
        for seg in spine_pts_m:
            for i in range(len(seg) - 1):
                ax, ay = seg[i]
                bx, by = seg[i + 1]
                dx, dy = bx - ax, by - ay
                L2 = dx * dx + dy * dy
                if L2 == 0:
                    d = math.hypot(px - ax, py - ay)
                else:
                    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / L2))
                    d = math.hypot(px - (ax + t * dx), py - (ay + t * dy))
                if d < best:
                    best = d
        return best

    # --- candidate shophouse footprints ------------------------------
    measured: list[dict] = []
    for el in bldgs.get("elements", []):
        if el.get("type") != "way":
            continue
        ring = ring_from_way(el, {})
        if not ring or len(ring) < 4:
            continue
        lon0 = sum(p[0] for p in ring) / len(ring)
        lat0 = sum(p[1] for p in ring) / len(ring)
        pts_m = [((p[0] - lon0) * mx, (p[1] - lat0) * my) for p in ring]
        area = polygon_area_m2(pts_m)
        if area <= 0:
            continue
        short, long, orient = min_area_rect(pts_m)
        if short <= 0:
            continue
        measured.append({
            "el": el, "ring": ring, "lon": lon0, "lat": lat0,
            "area": area, "front": short, "depth": long,
            "ratio": long / short, "orient": orient,
            "tags": el.get("tags", {}),
        })

    print(f"  buildings measured: {len(measured)}", file=sys.stderr)

    # Morphology gate
    passed = [
        b for b in measured
        if MIN_FRONT_M <= b["front"] <= MAX_FRONT_M
        and MIN_DEPTH_M <= b["depth"] <= MAX_DEPTH_M
        and MIN_AREA_M2 <= b["area"] <= MAX_AREA_M2
        and b["ratio"] >= MIN_RATIO
    ]
    print(f"  passed morphology gate: {len(passed)}", file=sys.stderr)

    # Row test: a shophouse has aligned neighbours of the same rhythm.
    kept = []
    for b in passed:
        aligned = 0
        for other in passed:
            if other is b:
                continue
            dx = (other["lon"] - b["lon"]) * mx
            dy = (other["lat"] - b["lat"]) * my
            if math.hypot(dx, dy) > NEIGHBOUR_RADIUS_M:
                continue
            d = abs(other["orient"] - b["orient"]) % 180.0
            if min(d, 180.0 - d) <= 22.0:
                aligned += 1
        if aligned >= MIN_ALIGNED_NEIGHBOURS:
            b["aligned"] = aligned
            kept.append(b)

    print(f"  passed row test: {len(kept)}", file=sys.stderr)

    on_spine = 0
    for b in kept:
        tags = b["tags"]
        levels = tags.get("building:levels")
        try:
            levels_i = int(float(levels)) if levels else None
        except ValueError:
            levels_i = None
        d_spine = round(dist_to_spine_m(b["lon"], b["lat"]))
        if d_spine <= 120:
            on_spine += 1
        features.append({
            "type": "Feature",
            "geometry": {
                # 5 dp ~= 1 m at this latitude. Enough for a footprint, and it
                # roughly halves the file the browser has to pull.
                "type": "Polygon",
                "coordinates": [[[round(p[0], 5), round(p[1], 5)] for p in b["ring"]]],
            },
            "properties": {
                "layer": "candidate",
                "osm_id": f"way/{b['el']['id']}",
                "name_th": tags.get("name"),
                "building": tags.get("building"),
                "levels": levels_i,
                "frontage_m": round(b["front"], 1),
                "depth_m": round(b["depth"], 1),
                "area_m2": round(b["area"]),
                "depth_to_frontage": round(b["ratio"], 2),
                "aligned_neighbours_34m": b["aligned"],
                "dist_to_spine_m": d_spine,
                "on_spine": d_spine <= 120,
                "method": "OSM footprint + oriented-rectangle morphology screen + row test",
                "review_status": "candidate — unverified, needs field review",
                "not_heritage_designation": True,
                "source": "OpenStreetMap contributors (ODbL)",
            },
        })
    print(f"  within 120 m of the spine: {on_spine}", file=sys.stderr)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    fc = {
        "type": "FeatureCollection",
        "properties": {
            "title": "Sukhumvit 71 (Pridi Banomyong) study corridor",
            "built": "scripts/build-sukhumvit71.py",
            "bbox": list(BBOX),
            "candidate_count": len(kept),
            "candidates_on_spine": on_spine,
            "measured_count": len(measured),
            "caveat": (
                "Candidate footprints screened by geometry alone. This does NOT "
                "confirm that a building is a shophouse, its age, its condition, "
                "or any heritage status. Field review required."
            ),
            "sources": [
                "OpenStreetMap contributors, ODbL",
                "Chuenrudeemol, C. 'Shophouse Metropolis', Harvard GSD studio book (2026) — 3.5-5 m frontage, 10-12 m depth",
            ],
        },
        "features": features,
    }
    OUT.write_text(json.dumps(fc))
    size_kb = OUT.stat().st_size / 1024
    print(f"wrote {OUT.relative_to(ROOT)} ({size_kb:.0f} KB, "
          f"{len(kept)} candidates, {len(road_ways)} corridor ways)")


if __name__ == "__main__":
    main()
