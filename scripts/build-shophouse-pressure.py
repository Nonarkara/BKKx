#!/usr/bin/env python3
"""Join citywide shophouse candidates to Treasury land appraisals.

Produces the two map layers and the summary table behind
/shophouses/atlas — every figure in app/data/shophouse-pressure.ts comes
from here rather than from anyone's estimate.

Inputs
  site/public/data/bangkok-rowhouse-footprint-candidates.geojson
      Candidate shophouse footprints screened from Overture/OSM geometry.
  ../bkk-3d-atlas/public/bkk-land-price-districts.geojson
      Treasury (กรมธนารักษ์) appraisal bands per district, quoted per
      square wah. Same source as the atlas.nonarkara.org land layer.

Outputs
  site/public/data/shophouse-pressure.geojson   one point per candidate
  site/public/data/bkk-land-price.geojson       district polygons + price
  site/app/data/shophouse-pressure.ts           district table + splits

Two conversions matter and both are easy to get wrong:
  * Thai land is appraised per ตารางวา (square wah). 1 wah² = 4 m².
  * Appraised value is the base for transfer tax and generally sits BELOW
    market, so every figure here understates pressure rather than inflating it.

Usage:  python3 scripts/build-shophouse-pressure.py
"""

import json
import math
import statistics as st
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOOTPRINTS = ROOT / "site/public/data/bangkok-rowhouse-footprint-candidates.geojson"
LANDPRICE = ROOT.parent / "bkk-3d-atlas/public/bkk-land-price-districts.geojson"

WAH2_TO_M2 = 4.0
SETBACK_FROM_CENTRE_M = 6.0   # Ministerial Regulation No. 55 B.E. 2543, ข้อ 41
ASSUMED_ROAD_M = 8.0          # a typical narrow soi; kerb 4 m from the centreline


def outer_ring(geom):
    c = geom["coordinates"]
    while isinstance(c[0][0], list):
        c = c[0]
    return c


def to_metres(pts, lat0):
    k = math.cos(math.radians(lat0))
    return [(x * 111_320 * k, y * 110_540) for x, y in pts]


def min_area_rect(pts):
    """Rotating calipers. Returns (short_side, long_side) in metres."""
    best = None
    for i in range(len(pts) - 1):
        dx = pts[i + 1][0] - pts[i][0]
        dy = pts[i + 1][1] - pts[i][1]
        L = math.hypot(dx, dy)
        if L < 1e-9:
            continue
        ux, uy = dx / L, dy / L
        us = [p[0] * ux + p[1] * uy for p in pts]
        vs = [-p[0] * uy + p[1] * ux for p in pts]
        w, h = max(us) - min(us), max(vs) - min(vs)
        if best is None or w * h < best[0]:
            best = (w * h, min(w, h), max(w, h))
    return (best[1], best[2]) if best else (0.0, 0.0)


def point_in_ring(pt, ring):
    x, y = pt
    inside = False
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        if (y1 > y) != (y2 > y):
            if x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                inside = not inside
    return inside


def main():
    fp = json.loads(FOOTPRINTS.read_text())
    lp = json.loads(LANDPRICE.read_text())

    districts = []
    for f in lp["features"]:
        p, g = f["properties"], f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        districts.append({
            "name": p["name_en"], "name_th": p.get("name_th"),
            "peak": p.get("peakNewPrice"), "min": p.get("groupMinNewPrice"),
            "rings": [pl[0] for pl in polys],
        })

    rows = []
    for f in fp["features"]:
        props = f["properties"]
        try:
            ring = outer_ring(f["geometry"])
        except Exception:
            continue
        lat0 = sum(y for _, y in ring) / len(ring)
        lon0 = sum(x for x, _ in ring) / len(ring)
        short, long = min_area_rect(to_metres(ring, lat0))
        if short < 1.5 or long < 3:
            continue

        district = next(
            (d for d in districts if any(point_in_ring((lon0, lat0), r) for r in d["rings"])),
            None,
        )
        if district is None:
            continue

        floor_m2 = (district["min"] or 0) / WAH2_TO_M2
        peak_m2 = (district["peak"] or 0) / WAH2_TO_M2
        area = props.get("area_m2") or (short * long)

        rows.append({
            "district": district["name"], "district_th": district["name_th"],
            "frontage": round(short, 1), "depth": round(long, 1),
            "area_m2": round(area, 1), "floors": props.get("num_floors") or 0,
            "cluster": props.get("cluster_slug"),
            "cluster_name": props.get("cluster_name"),
            "strength": props.get("candidate_strength"),
            "land_floor_m2": round(floor_m2), "land_peak_m2": round(peak_m2),
            "land_under_floor": round(floor_m2 * area),
            "lon": round(lon0, 6), "lat": round(lat0, 6),
        })

    # Two axes: how much the ground is worth, and whether the setback bites.
    price_split = sorted(r["land_under_floor"] for r in rows)[len(rows) // 2]
    depth_split = st.median([r["depth"] for r in rows])
    loss_m = SETBACK_FROM_CENTRE_M - ASSUMED_ROAD_M / 2

    for r in rows:
        hi = r["land_under_floor"] >= price_split
        shallow = r["depth"] < depth_split
        r["quadrant"] = (
            "tell-the-owner" if hi and shallow
            else "at-risk" if hi
            else "lawful-reuse" if shallow
            else "low-pressure"
        )
        r["loss_pct"] = round(min(loss_m / r["depth"], 1.0) * 100)

    (ROOT / "site/public/data/shophouse-pressure.geojson").write_text(json.dumps({
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [r["lon"], r["lat"]]},
            "properties": {
                "q": r["quadrant"], "d": r["depth"], "f": r["frontage"],
                "a": r["area_m2"], "v": r["land_under_floor"],
                "s": 1 if r["strength"] == "strong morphology" else 0,
                "dist": r["district"], "cl": r["cluster_name"] or "",
            },
        } for r in rows],
    }, separators=(",", ":")))

    (ROOT / "site/public/data/bkk-land-price.geojson").write_text(json.dumps({
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature", "geometry": f["geometry"],
            "properties": {
                "name": f["properties"]["name_en"],
                "name_th": f["properties"].get("name_th"),
                "peak": f["properties"].get("peakNewPrice"),
                "min": f["properties"].get("groupMinNewPrice"),
            },
        } for f in lp["features"]],
    }, separators=(",", ":")))

    by_district = {}
    for r in rows:
        by_district.setdefault(r["district"], []).append(r)

    print(f"{len(rows)} footprints matched across {len(by_district)} districts")
    print(f"price split ฿{price_split:,} · depth split {depth_split} m · setback loss {loss_m} m")
    for name, v in sorted(by_district.items(), key=lambda kv: -len(kv[1])):
        tell = sum(1 for x in v if x["quadrant"] == "tell-the-owner")
        risk = sum(1 for x in v if x["quadrant"] == "at-risk")
        print(f"  {name:24s} n={len(v):5d}  tell={tell:4d}  at-risk={risk:4d}")
    print("\nRegenerate app/data/shophouse-pressure.ts from these figures if they move.")


if __name__ == "__main__":
    main()
