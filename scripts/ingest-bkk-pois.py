#!/usr/bin/env python3
"""
ingest-bkk-pois.py — Pin 5 data.go.th POI datasets onto the bkk 3D atlas.

Inputs (raw downloads from data.go.th / data.bangkok.go.th / catalog.dra.go.th):
  - wat1 (temples, BKK-only, lat/lng CSV)
  - gis_fad005 (national museums, all-Thailand, lat/lng + UTM CSV)
  - gis_fad003 (national libraries, all-Thailand, UTM CSV)
  - gis_fad004 (national archives, all-Thailand, UTM CSV)
  - dra_0302_01 (royal temples พระอารามหลวง, XLS, addresses only)

Outputs: 5 static GeoJSON FeatureCollections under site/public/pois/<kind>.geojson

Each feature:
  { type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] },
    properties: {
      id, kind, name_th, name_en?, address?, district?, province?, kind_detail?,
      source, source_url
    }
}

Defense-in-depth: every feature is asserted to fall inside the BKK bbox
(lat 13.4–14.2, lng 100.2–101.0) before being written. Out-of-bbox rows are
counted and reported, not silently dropped — the summary is part of the output
so a future audit can see the filter rate.

For dra_0302_01 (no coordinates in source) we cross-match by temple name against
wat1.csv; remaining BKK rows are batch-geocoded via OpenStreetMap Nominatim with
a polite 1.1s/req cadence and a disk cache at var/dra-0302-01-geocoded.json.
Citation: "Geocoded via OpenStreetMap Nominatim, ODbL".

Run:
  python3 scripts/ingest-bkk-pois.py
  python3 scripts/ingest-bkk-pois.py --skip-geocode   # use only cache
"""
from __future__ import annotations

import argparse
import csv
import difflib
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import xlrd
from pathlib import Path
from typing import Iterable

from pyproj import Transformer

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = Path("/tmp/bkk-poi-ingest")
OUT_DIR = ROOT / "site" / "public" / "pois"
CACHE_DIR = ROOT / "var"
CACHE_DIR.mkdir(exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

BKK_BBOX = {"lat_min": 13.4, "lat_max": 14.2, "lng_min": 100.2, "lng_max": 101.0}

# ---------------------------------------------------------------------------
# Source metadata
# ---------------------------------------------------------------------------

SOURCES = {
    "temples": {
        "label_th": "วัด",
        "label_en": "Temples (Office of National Buddhism)",
        "source": "data.bangkok.go.th · wat1",
        "source_url": "https://data.bangkok.go.th/dataset/wat1",
    },
    "royal-temples": {
        "label_th": "พระอารามหลวง",
        "label_en": "Royal Temples (Department of Royal Affairs)",
        "source": "catalog.dra.go.th · dra_0302_01 (BKK subset)",
        "source_url": "https://data.go.th/dataset/dra_0302_01",
    },
    "national-museums": {
        "label_th": "พิพิธภัณฑสถานแห่งชาติ",
        "label_en": "National Museums (Fine Arts Dept.)",
        "source": "data.go.th · gis_fad005",
        "source_url": "https://data.go.th/dataset/gis_fad005",
    },
    "national-archives": {
        "label_th": "หอจดหมายเหตุแห่งชาติ",
        "label_en": "National Archives (Fine Arts Dept.)",
        "source": "data.go.th · gis_fad004",
        "source_url": "https://data.go.th/dataset/gis_fad004",
    },
    "national-libraries": {
        "label_th": "หอสมุดแห่งชาติ",
        "label_en": "National Libraries (Fine Arts Dept.)",
        "source": "data.go.th · gis_fad003",
        "source_url": "https://data.go.th/dataset/gis_fad003",
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def in_bkk_bbox(lng: float, lat: float) -> bool:
    return (
        BKK_BBOX["lat_min"] <= lat <= BKK_BBOX["lat_max"]
        and BKK_BBOX["lng_min"] <= lng <= BKK_BBOX["lng_max"]
    )


def write_geojson(kind: str, features: list[dict], dropped_count: int, dropped_reason: str = "outside BKK bbox") -> None:
    out_path = OUT_DIR / f"{kind}.geojson"
    collection = {
        "type": "FeatureCollection",
        "kind": kind,
        "label_th": SOURCES[kind]["label_th"],
        "label_en": SOURCES[kind]["label_en"],
        "source": SOURCES[kind]["source"],
        "source_url": SOURCES[kind]["source_url"],
        "bbox": [
            BKK_BBOX["lng_min"],
            BKK_BBOX["lat_min"],
            BKK_BBOX["lng_max"],
            BKK_BBOX["lat_max"],
        ],
        "features": features,
    }
    out_path.write_text(
        json.dumps(collection, ensure_ascii=False, separators=(",", ":"))
    )
    print(
        f"  → {out_path.relative_to(ROOT)}  {len(features)} pins  "
        f"({dropped_count} source rows dropped: {dropped_reason})"
    )


# ---------------------------------------------------------------------------
# UTM Zone 47N → WGS84 (covers all of Thailand).
# pyproj handles the Transverse Mercator math; we keep a single shared
# Transformer to avoid re-allocating per row.
# The Thai government datasets note "Indian 1975" datum in places; WGS84 is
# within ~50m of Indian 1975 at these latitudes, well under the dataset's
# own stated GPS error margin.
# ---------------------------------------------------------------------------

_utm_to_wgs = Transformer.from_crs("EPSG:32647", "EPSG:4326", always_xy=True)


def utm_to_latlng(easting: float, northing: float) -> tuple[float, float]:
    lng, lat = _utm_to_wgs.transform(easting, northing)
    return lat, lng


# ---------------------------------------------------------------------------
# wat1 — Bangkok temples, lat/lng CSV
# ---------------------------------------------------------------------------


def ingest_temples() -> tuple[list[dict], int]:
    src = RAW_DIR / "wat1.csv"
    print(f"Reading {src.name}…")
    features: list[dict] = []
    oob = 0
    with src.open(encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            try:
                lat = float(row["lat"])
                lng = float(row["lng"])
            except (KeyError, ValueError):
                continue
            if not in_bkk_bbox(lng, lat):
                oob += 1
                continue
            features.append(
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "properties": {
                        "id": f"wat1:{row['id']}",
                        "kind": "temple",
                        "name_th": row["name"].strip(),
                        "name_en": None,
                        "address": row.get("location", "").strip() or None,
                        "district": row.get("dname", "").strip() or None,
                        "sub_district": None,
                        "province": "กรุงเทพมหานคร",
                        "temple_class": row.get("type", "").strip() or None,
                        "sect": row.get("sect", "").strip() or None,
                        "established_be": row.get("establish", "").strip() or None,
                        "source": SOURCES["temples"]["source"],
                        "source_url": SOURCES["temples"]["source_url"],
                    },
                }
            )
    return features, oob


# ---------------------------------------------------------------------------
# gis_fad003 / 004 — UTM Zone 47N, all-Thailand → filter to BKK
# ---------------------------------------------------------------------------


def ingest_fad_utm(kind: str, filename: str, name_field: str = "หน่วยงาน") -> tuple[list[dict], int]:
    src = RAW_DIR / filename
    print(f"Reading {src.name}…")
    features: list[dict] = []
    oob = 0
    with src.open(encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            try:
                easting = float(row["พิกัด(ตะวันออก)"])
                northing = float(row["พิกัด(เหนือ)"])
            except (KeyError, ValueError, TypeError):
                continue
            if not easting or not northing:
                continue
            lat, lng = utm_to_latlng(easting, northing)
            if not in_bkk_bbox(lng, lat):
                oob += 1
                continue
            province = (row.get("จังหวัด") or "").strip()
            # Keep only BKK rows beyond bbox: assert province for double check
            if province and province != "กรุงเทพมหานคร":
                # Province is set; trust it over the UTM math
                continue
            features.append(
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lng, lat]},
                    "properties": {
                        "id": f"{kind}:{row.get('ลำดับ', '').strip()}",
                        "kind": kind,
                        "name_th": (row.get(name_field) or "").strip(),
                        "name_en": None,
                        "address": (row.get("ที่อยู่") or "").strip() or None,
                        "sub_district": (row.get("ตำบล") or "").strip() or None,
                        "district": (row.get("อำเภอ") or "").strip() or None,
                        "province": province or None,
                        "postal_code": (row.get("รหัสไปรษณีย์") or "").strip() or None,
                        "source": SOURCES[kind]["source"],
                        "source_url": SOURCES[kind]["source_url"],
                    },
                }
            )
    return features, oob


# ---------------------------------------------------------------------------
# gis_fad005 — has direct lat/lng columns + UTM; multi-line header
# ---------------------------------------------------------------------------


def ingest_fad005() -> tuple[list[dict], int]:
    src = RAW_DIR / "fad005.csv"
    print(f"Reading {src.name}…")
    features: list[dict] = []
    oob = 0
    with src.open(encoding="utf-8-sig") as f:
        text = f.read()
    # Skip the 5 lines of metadata/header preamble; data starts on the 6th line
    lines = text.splitlines()
    # Find the real header (the line that starts with "ลำดับ,ชื่อพิพิธภัณฑ์")
    header_idx = None
    for i, line in enumerate(lines):
        if line.startswith("ลำดับ,ชื่อพิพิธภัณฑ์"):
            header_idx = i
            break
    if header_idx is None:
        raise RuntimeError("fad005 header not found")
    body = "\n".join([lines[header_idx]] + lines[header_idx + 1 :])
    for row in csv.DictReader(io.StringIO(body)):
        try:
            lat = float(row["พิกัดภูมิศาสตร์(ละติจูด)"])
            lng = float(row["พิกัดภูมิศาสตร์(ลองติจูด)"])
        except (KeyError, ValueError, TypeError):
            continue
        if not in_bkk_bbox(lng, lat):
            oob += 1
            continue
        province = (row.get("จังหวัด") or "").strip()
        if province and province != "กรุงเทพมหานคร":
            continue
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lng, lat]},
                "properties": {
                    "id": f"national-museum:{row.get('ลำดับ', '').strip()}",
                    "kind": "national-museum",
                    "name_th": (row.get("ชื่อพิพิธภัณฑ์") or "").strip(),
                    "name_en": None,
                    "museum_type": (row.get("ประเภท") or "").strip() or None,
                    "museum_branch": (row.get("สาขา") or "").strip() or None,
                    "is_ancient_site": (row.get("เป็นโบราณสถาน") or "").strip() or None,
                    "address": (row.get("ที่ตั้ง") or "").strip() or None,
                    "sub_district": (row.get("ตำบล") or "").strip() or None,
                    "district": (row.get("อำเภอ") or "").strip() or None,
                    "province": province or None,
                    "postal_code": (row.get("รหัสไปรษณีย์") or "").strip() or None,
                    "source": SOURCES["national-museums"]["source"],
                    "source_url": SOURCES["national-museums"]["source_url"],
                },
            }
        )
    return features, oob


# ---------------------------------------------------------------------------
# dra_0302_01 — Royal Temples XLS, no coordinates; cross-match wat1 + Nominatim
# ---------------------------------------------------------------------------

GEOCODE_CACHE = CACHE_DIR / "dra-0302-01-geocoded.json"


def load_geocode_cache() -> dict[str, list[float] | None]:
    if GEOCODE_CACHE.exists():
        return json.loads(GEOCODE_CACHE.read_text())
    return {}


def save_geocode_cache(cache: dict) -> None:
    GEOCODE_CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2))


def nominatim_geocode(query: str) -> list[float] | None:
    """Return [lng, lat] or None. Polite 1.1s/req via User-Agent."""
    try:
        url = (
            "https://nominatim.openstreetmap.org/search?"
            + urllib.parse.urlencode({"q": query, "format": "json", "limit": 1, "countrycodes": "th"})
        )
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "BKKx-PinIngest/1.0 (https://bkk.nonarkara.org)"},
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
        if not data:
            return None
        return [float(data[0]["lon"]), float(data[0]["lat"])]
    except Exception as e:
        print(f"    geocode failed for {query!r}: {e}", file=sys.stderr)
        return None


def ingest_royal_temples(skip_geocode: bool) -> tuple[list[dict], int, int]:
    src = RAW_DIR / "dra_0302_01.xls"
    print(f"Reading {src.name}…")
    # 1) Build wat1 name → (lng, lat) lookup for fast cross-match.
    # Real-world name discrepancies: wat1 uses "วัดกาญจนสิงหาสน์วรวิหาร",
    # dra uses "วัดกาญจนสิงหาสน์". Same temple, different formality. We handle
    # this by:
    #   (a) exact match on full or paren-stripped name
    #   (b) one of the names is a prefix of the other (after paren strip)
    # (b) catches the suffix differences and small spelling variations
    # without crossing wires (every BKK wat1 row is unique by name).
    wat1_by_name: dict[str, tuple[float, float]] = {}
    wat1_list: list[tuple[str, tuple[float, float]]] = []
    with (RAW_DIR / "wat1.csv").open(encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            try:
                lat = float(row["lat"])
                lng = float(row["lng"])
            except (KeyError, ValueError):
                continue
            name = row["name"].strip()
            base = name.split("(")[0].strip()
            wat1_by_name[name] = (lng, lat)
            wat1_by_name[base] = (lng, lat)
            wat1_list.append((base, (lng, lat)))

    def find_wat1_match(dra_name: str) -> tuple[float, float] | None:
        # exact / paren-stripped
        base = dra_name.split("(")[0].strip()
        if base in wat1_by_name:
            return wat1_by_name[base]
        if dra_name in wat1_by_name:
            return wat1_by_name[dra_name]
        # prefix match — catches วัด vs วัดXวรวิหาร and small spelling variations
        for wname, coords in wat1_list:
            if not wname:
                continue
            if (wname.startswith(base) or base.startswith(wname)) and abs(len(wname) - len(base)) <= 12:
                return coords
        # fuzzy match — catches small spelling drifts like โพธินิมิต vs โพธินิมิตร
        # Only accept ratio >= 0.85 to avoid wrong-temple collisions.
        best_ratio = 0.0
        best_coords: tuple[float, float] | None = None
        for wname, coords in wat1_list:
            if not wname or abs(len(wname) - len(base)) > 4:
                continue
            r = difflib.SequenceMatcher(None, wname, base).ratio()
            if r > best_ratio:
                best_ratio = r
                best_coords = coords
        if best_ratio >= 0.85 and best_coords is not None:
            return best_coords
        return None

    wb = xlrd.open_workbook(str(src))
    ws = wb.sheet_by_index(0)
    cache = load_geocode_cache()
    features: list[dict] = []
    oob = 0
    geocoded = 0
    matched = 0
    for r in range(1, ws.nrows):
        row = list(ws.row_values(r))
        rid = int(row[0]) if row[0] else 0
        kathin_type = (row[1] or "").strip()
        name = (row[2] or "").strip()
        sub_district = (row[3] or "").strip()
        district = (row[4] or "").strip()
        province = (row[5] or "").strip()
        if province != "กรุงเทพมหานคร":
            continue  # BKK subset only

        # 1) Cross-match against wat1 by temple name
        coords = find_wat1_match(name)
        if coords is not None:
            matched += 1
        else:
            # 2) Geocode via Nominatim (cached)
            cache_key = name
            if cache_key in cache:
                coords = cache[cache_key]
            elif skip_geocode:
                coords = None
            else:
                time.sleep(1.1)  # OSM ToS
                coords = nominatim_geocode(f"{name}, {district}, Bangkok, Thailand")
                cache[cache_key] = coords
                if coords:
                    geocoded += 1

        if coords is None:
            oob += 1
            continue
        lng, lat = coords[0], coords[1]
        if not in_bkk_bbox(lng, lat):
            oob += 1
            continue
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lng, lat]},
                "properties": {
                    "id": f"royal-temple:{rid}",
                    "kind": "royal-temple",
                    "name_th": name,
                    "name_en": None,
                    "kathin_type": kathin_type or None,
                    "address": f"แขวง{sub_district} เขต{district}, {province}".replace("แขวง เขต", "เขต"),
                    "sub_district": sub_district or None,
                    "district": district or None,
                    "province": province or None,
                    "source": SOURCES["royal-temples"]["source"],
                    "source_url": SOURCES["royal-temples"]["source_url"],
                },
            }
        )
    save_geocode_cache(cache)
    print(
        f"  royal-temple source: {matched} cross-matched from wat1, "
        f"{geocoded} freshly geocoded via Nominatim"
    )
    # The dropped count here is "no coordinate available" — not strictly OOB
    return features, oob, geocoded


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--skip-geocode", action="store_true", help="use only cached geocodes")
    args = p.parse_args()

    print(f"Output → {OUT_DIR.relative_to(ROOT)}")
    print(f"Cache  → {CACHE_DIR.relative_to(ROOT)}")
    print()

    totals: dict[str, int] = {}

    # 1) wat1 — temples
    feats, oob = ingest_temples()
    write_geojson("temples", feats, oob)
    totals["temples"] = len(feats)

    # 2) dra_0302_01 — royal temples (must come after wat1, uses wat1 index)
    feats, oob, _ = ingest_royal_temples(args.skip_geocode)
    write_geojson("royal-temples", feats, oob, dropped_reason="no coord source (no match in wat1, Nominatim miss)")
    totals["royal-temples"] = len(feats)

    # 3) gis_fad005 — national museums (lat/lng columns)
    feats, oob = ingest_fad005()
    write_geojson("national-museums", feats, oob)
    totals["national-museums"] = len(feats)

    # 4) gis_fad003 — national libraries (UTM)
    feats, oob = ingest_fad_utm("national-libraries", "fad003.csv")
    write_geojson("national-libraries", feats, oob)
    totals["national-libraries"] = len(feats)

    # 5) gis_fad004 — national archives (UTM)
    feats, oob = ingest_fad_utm("national-archives", "fad004.csv", name_field="หน่วยงาน")
    write_geojson("national-archives", feats, oob)
    totals["national-archives"] = len(feats)

    # Summary
    print()
    print("=== Summary ===")
    total = 0
    for kind, count in totals.items():
        print(f"  {kind:<22} {count:>4} pins")
        total += count
    print(f"  {'TOTAL':<22} {total:>4} pins across 5 datasets")
    print()
    print("All 5 GeoJSON files written. Next: `cd site && npm run build && npx wrangler deploy`.")


if __name__ == "__main__":
    main()
