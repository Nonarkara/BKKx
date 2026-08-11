#!/usr/bin/env python3
"""
ingest-walk-pois.py
-------------------
Pull real OpenStreetMap POIs (restaurants, cafes, shops, historic
sites) within a tight radius of every heritage walk stop, so the
walk pages can show what is actually near each stop — the
practical "where to eat, where to buy" layer that lets the
heritage lens read against the street economy.

What this produces:
    site/public/heritage/walk-pois.json
        Map keyed by "<walk-slug>/<stop-n>" → list of POIs:
        { name, kind, tags, lat, lon, distanceM }

Why a real source:
    The register is "what is protected." The walks are "where to
    walk." The POIs are the third leg — what is actually open
    nearby that a tourist or a local can walk into. We do not
    curate or rank; we resolve OSM tags and emit them. The walk
    page surfaces the top N per stop with a "nearby food, nearby
    shops, nearby history" sub-list.

Source policy:
    - OpenStreetMap via Overpass, free, no key.
    - Radius 150 m per stop (tight — a stop's neighbourhood).
    - Categories: amenity in {restaurant, cafe, fast_food, food_court,
      bakery, bar, pub}; shop (any); tourism in {museum, gallery,
      artwork, attraction, viewpoint}; historic (any). This matches
      the kinds a tourist or local economy browser actually cares
      about.
    - One Overpass request per stop, cached in .cache/heritage/
      pois/<walk-slug>-<stop-n>.json, so re-runs are fast and a
      partial network failure does not blank the page.

Usage:
    python3 scripts/ingest-walk-pois.py
    python3 scripts/ingest-walk-pois.py --radius 200
    python3 scripts/ingest-walk-pois.py --per-stop 8
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "heritage" / "pois"
PLACES = ROOT / "site" / "app" / "data" / "heritage-places.json"
OUT = ROOT / "site" / "public" / "heritage" / "walk-pois.json"
OUT_INDEX = ROOT / "site" / "public" / "heritage" / "walk-pois-index.json"

OVERPASS_PRIMARY = "https://overpass.kumi.systems/api/interpreter"
OVERPASS_FALLBACK = "https://overpass-api.de/api/interpreter"
UA = "BKKx/1.0 (+https://bkk.nonarkara.org; walk POI ingest)"

# (osm_key, osm_value) — what we surface. Tourism / historic / amenity
# / shop. The walk page will further group by `kind` ("food", "shop",
# "history", "drink") to render compact, scannable sub-lists.
INTEREST = [
    ("amenity", "restaurant"),
    ("amenity", "cafe"),
    ("amenity", "fast_food"),
    ("amenity", "food_court"),
    ("amenity", "bakery"),
    ("amenity", "ice_cream"),
    ("amenity", "bar"),
    ("amenity", "pub"),
    ("amenity", "marketplace"),
    ("shop", "bakery"),
    ("shop", "convenience"),
    ("shop", "books"),
    ("shop", "gift"),
    ("shop", "souvenir"),
    ("shop", "art"),
    ("shop", "antiques"),
    ("shop", "jewelry"),
    ("shop", "clothes"),
    ("shop", "tea"),
    ("shop", "herbalist"),
    ("tourism", "museum"),
    ("tourism", "gallery"),
    ("tourism", "artwork"),
    ("tourism", "attraction"),
    ("tourism", "viewpoint"),
    ("historic", None),  # any historic=*
]

def haversine_m(a_lat: float, a_lon: float, b_lat: float, b_lon: float) -> float:
    R = 6371000
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dphi = math.radians(b_lat - a_lat)
    dl = math.radians(b_lon - a_lon)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def osm_kind_for(key: str, value: str | None) -> str:
    """Bucket OSM tags into the four kinds the walk page renders."""
    if key == "amenity":
        if value in ("restaurant", "fast_food", "food_court", "bakery", "marketplace"):
            return "food"
        if value in ("cafe", "tea"):
            return "drink"
        if value in ("bar", "pub", "ice_cream"):
            return "drink"
    if key == "shop":
        return "shop"
    if key in ("tourism", "historic"):
        return "history"
    return "other"


def overpass_query(lat: float, lon: float, radius_m: int) -> str:
    # One node clause per (key, value) pair, OR'd together. The
    # union-of-conditions form (`node[a][b](around:..);`) is faster
    # on the public instance but gets a Bad Request from Overpass
    # when the keys overlap (shop=bakery, amenity=bakery both
    # present). One line per pair is the safer shape.
    clauses = []
    for key, value in INTEREST:
        if value is None:
            clauses.append(f'  node["{key}"](around:{radius_m},{lat},{lon});')
        else:
            clauses.append(
                f'  node["{key}"="{value}"](around:{radius_m},{lat},{lon});'
            )
    body = "\n".join(clauses)
    return f'[out:json][timeout:20];(\n{body}\n);out tags;'


def fetch_pois(lat: float, lon: float, radius_m: int, cache_path: Path) -> list[dict]:
    if cache_path.exists():
        try:
            return json.loads(cache_path.read_text("utf-8"))
        except Exception:
            pass  # fall through and re-fetch

    q = overpass_query(lat, lon, radius_m)
    body = urllib.parse.urlencode({"data": q}).encode()
    for endpoint in (OVERPASS_PRIMARY, OVERPASS_FALLBACK):
        try:
            req = urllib.request.Request(endpoint, data=body, headers={"user-agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.loads(r.read().decode("utf-8"))
            break
        except Exception as e:
            last_err = e
            continue
    else:
        print(f"  ! overpass failed for ({lat},{lon}): {last_err}", file=sys.stderr)
        return []

    pois = []
    for el in data.get("elements", []):
        tags = el.get("tags", {}) or {}
        name = tags.get("name") or tags.get("name:en") or tags.get("name:th")
        if not name:
            continue
        if el["type"] != "node":
            continue
        p_lat, p_lon = el.get("lat"), el.get("lon")
        if p_lat is None or p_lon is None:
            continue
        # collapse to a single (key,value) tag for the kind.
        kind = "other"
        for k, v in INTEREST:
            if tags.get(k) == v or (v is None and k in tags):
                kind = osm_kind_for(k, v)
                break
        pois.append({
            "name": name,
            "kind": kind,
            "osmKey": next((k for k, _ in INTEREST if k in tags), None),
            "osmValue": next((tags.get(k) for k, _ in INTEREST if k in tags and tags.get(k)), None),
            "lat": p_lat,
            "lon": p_lon,
            "distanceM": round(haversine_m(lat, lon, p_lat, p_lon)),
        })

    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(pois), "utf-8")
    return pois


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--radius", type=int, default=150, help="metres around each stop (default 150)")
    ap.add_argument("--per-stop", type=int, default=8, help="max POIs per stop per kind (default 8)")
    args = ap.parse_args()

    places = json.loads(PLACES.read_text("utf-8"))
    walks = places.get("walks", [])
    print(f"ingesting POIs for {len(walks)} walks × up to {max(len(w['stops']) for w in walks)} stops", file=sys.stderr)

    out: dict = {}
    index: dict = {}
    total = 0
    for w in walks:
        for i, stop in enumerate(w["stops"], start=1):
            stop_key = f"{w['slug']}/{i}"
            cache_path = CACHE / f"{w['slug']}-{i}.json"
            print(f"  · {stop['name']} ({w['slug']}/{i})", file=sys.stderr)
            t0 = time.time()
            pois = fetch_pois(stop["lat"], stop["lon"], args.radius, cache_path)
            # Sort by distance, then keep top N per kind, then cap total.
            pois.sort(key=lambda p: p["distanceM"])
            by_kind: dict = {"food": [], "drink": [], "shop": [], "history": []}
            for p in pois:
                by_kind.setdefault(p["kind"], []).append(p)
            for k in by_kind:
                by_kind[k] = by_kind[k][: args.per_stop]
            trimmed = [p for arr in by_kind.values() for p in arr]
            trimmed.sort(key=lambda p: p["distanceM"])
            out[stop_key] = {
                "walkSlug": w["slug"],
                "stopN": i,
                "stopName": stop["name"],
                "lat": stop["lat"],
                "lon": stop["lon"],
                "radiusM": args.radius,
                "pois": trimmed,
            }
            index[stop_key] = {
                "walkSlug": w["slug"],
                "stopN": i,
                "stopName": stop["name"],
                "count": len(trimmed),
                "fetchedAt": int(time.time()),
                "tookMs": int((time.time() - t0) * 1000),
            }
            total += len(trimmed)
            # Kumi's instance is happy with 4 req/s; the public
            # overpass-api.de rate-limits harder. 0.3 s keeps us
            # inside the polite envelope on the primary and
            # gives the fallback a chance to be used without a
            # full second of dead air.
            time.sleep(0.3)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2), "utf-8")
    OUT_INDEX.write_text(json.dumps(index, ensure_ascii=False, indent=2), "utf-8")
    print(f"wrote {OUT} ({total} POIs across {len(out)} stops)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
