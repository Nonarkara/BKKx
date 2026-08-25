#!/usr/bin/env python3
"""Build the Rattanakosin water + wall + gate + fort layer for the BKKx Minecraft world.

This is the Phase 1 layer of the Rattanakosin world build. It takes the
moat (คลองรอบกรุง), the Chao Phraya river edge, the surviving 9 city
gates, and the 2 surviving wall forts and projects them into the world
block coordinates at 1:1 scale.

Operator-runnable. Single dependency: a working `requests`-equivalent
against Overpass's public API. Re-run after any source-data change.

Usage:
  python3 scripts/build-rattanakosin-water-and-walls.py

Outputs:
  site/public/data/rattanakosin-water.geojson
  site/public/data/rattanakosin-gates.geojson
  site/public/data/rattanakosin-forts.geojson
  site/public/data/rattanakosin-water-and-walls.meta.json  (provenance + counts)

The output schema is what the world-build pipeline consumes. Each
geometry is in world block coordinates (integer), with the original
WGS84 coordinates preserved in the properties so the placement is
auditable.
"""

from __future__ import annotations

import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "site/public/data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# World projection — from
# bangkok-historic-core-java/metadata.json
WORLD = {
    "min_mc_x": 0,
    "max_mc_x": 3383,
    "min_mc_z": 0,
    "max_mc_z": 3216,
    "min_lat": 13.737134,
    "max_lat": 13.766063,
    "min_lon": 100.478897,
    "max_lon": 100.510225,
    "scale": 1.0,
}
BBOX = f"{WORLD['min_lat']},{WORLD['min_lon']},{WORLD['max_lat']},{WORLD['max_lon']}"

# 9 surviving Rattanakosin city gates. Names match the official
# Ratcha-anusorn 1926 city plan; the heritage register carries
# them as registered Fine Arts Department monuments.
SURVIVING_GATES = [
    {"en": "Pratu Phi", "th": "ประตูผี", "description": "Ghost Gate, north side near Sanam Luang"},
    {"en": "Pratu Suan Mali", "th": "ประตูสวนมะลิ", "description": "Jasmine Garden Gate, east side"},
    {"en": "Pratu Tha Phra", "th": "ประตูท่าพระ", "description": "Monk's Landing Gate, west side near Tha Tien"},
    {"en": "Pratu Chakkrawat", "th": "ประตูจักรพรรดิ์", "description": "Emperor's Gate, west side near Tha Chang"},
    {"en": "Pratu Thep Ratcha", "th": "ประตูเทพหริรักษ์", "description": "north side"},
    {"en": "Pratu Ratcha Dindam", "th": "ประตูราชดำเนิน", "description": "south side, on Ratchadamnoen"},
    {"en": "Pratu Suan Phu", "th": "ประตูสวนพลู", "description": "Banana Garden Gate, east side"},
    {"en": "Pratu Damrong Sawan", "th": "ประตูดำรงสวรรค์", "description": "east side, Suan Amphorn"},
    {"en": "Pratu Phutthai Sawan", "th": "ประตูพุทธไสสวรรย์", "description": "north side near Phra Sumen"},
]

# 2 surviving Rattanakosin wall forts, both 1783, both hexagonal / octagonal.
SURVIVING_FORTS = [
    {
        "en": "Pom Phra Sumen",
        "th": "ป้อมพระสุเมรุ",
        "kind": "hexagonal-fort",
        "built": 1783,
        "description": "Hexagonal brick fort on the NW corner of the moat, by Rama I.",
    },
    {
        "en": "Pom Mahakan",
        "th": "ป้อมมหากาฬ",
        "kind": "octagonal-fort",
        "built": 1783,
        "description": "Octagonal brick fort on the SE corner of the moat, by Rama I.",
    },
]

UA = "BKKx/1.0 (audit; drnon@nonarkara.org)"

# ---------------------------------------------------------------------------
# Projection (matches bangkok-historic-core-java/metadata.json)
# ---------------------------------------------------------------------------

def project(lon: float, lat: float) -> tuple[int, int]:
    """WGS84 (lon, lat) -> Minecraft (mcx, mcz) at scale 1.0."""
    w = WORLD
    mcx = (lon - w["min_lon"]) / (w["max_lon"] - w["min_lon"]) * (w["max_mc_x"] - w["min_mc_x"])
    mcz = (w["max_lat"] - lat) / (w["max_lat"] - w["min_lat"]) * (w["max_mc_z"] - w["min_mc_z"])
    return round(mcx), round(mcz)


# ---------------------------------------------------------------------------
# Overpass (read-only)
# ---------------------------------------------------------------------------

def overpass(query: str) -> dict:
    """Run an Overpass query and return the parsed JSON."""
    url = "https://overpass-api.de/api/interpreter"
    body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"User-Agent": UA})
    last_err = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            last_err = e
            if e.code in (429, 504):
                time.sleep(5 * (attempt + 1))
                continue
            raise
    raise RuntimeError(f"Overpass failed after 3 attempts: {last_err}")


def name_matches(tags: dict, en: str, th: str) -> bool:
    name = (tags.get("name", "") + " " + tags.get("name:en", "")).strip()
    return en.lower() in name.lower() or th in name


# ---------------------------------------------------------------------------
# Moat and river
# ---------------------------------------------------------------------------

def fetch_waterways() -> list[dict]:
    """All waterway features in the Rattanakosin bbox."""
    q = f"""
    [out:json][timeout:60];
    (
      way["waterway"~"canal|river|ditch|drain|boatyard"]({BBOX});
      way["water"]({BBOX});
    );
    out geom;
    """
    data = overpass(q)
    return data.get("elements", [])


def moat_fragments(elements: list[dict]) -> list[list[tuple[float, float]]]:
    """All the OSM way fragments that belong to the city moat."""
    frags = []
    for e in elements:
        if e.get("type") != "way":
            continue
        tags = e.get("tags", {})
        name = tags.get("name", "")
        # The moat carries these names
        if "คลองรอบกรุง" in name or "Khlong Rop" in name or "Moat" in name:
            geom = e.get("geometry", [])
            if geom:
                pts = [(p["lon"], p["lat"]) for p in geom]
                frags.append((name, pts))
    return frags


def river_fragments(elements: list[dict]) -> list[list[tuple[float, float]]]:
    """All OSM way fragments that belong to the Chao Phraya river."""
    frags = []
    for e in elements:
        if e.get("type") != "way":
            continue
        tags = e.get("tags", {})
        name = tags.get("name", "")
        waterway = tags.get("waterway", "")
        if "เจ้าพระยา" in name and waterway == "river":
            geom = e.get("geometry", [])
            if geom:
                pts = [(p["lon"], p["lat"]) for p in geom]
                frags.append((name, pts))
    return frags


def build_water_feature(fragments: list[tuple[str, list[tuple[float, float]]]], kind: str) -> dict:
    """Bundle OSM fragments into a single multi-line feature in block coordinates.

    Each fragment is clipped to the world bounding box so the world
    builder never has to place blocks outside the world extent.
    """
    lines = []
    clipped_count = 0
    for name, pts in fragments:
        projected = [list(project(lon, lat)) for lon, lat in pts]
        original = len(projected)
        projected = clip_to_world_bbox(projected)
        if original != len(projected):
            clipped_count += 1
        if projected:
            lines.append({
                "osm_name": name,
                "points_block": projected,
                "point_count": len(projected),
            })
    return {
        "type": "FeatureCollection",
        "name": f"rattanakosin-{kind}",
        "projection": "local-1.0",
        "scale_blocks_per_meter": 1.0,
        "fragment_count": len(lines),
        "total_points": sum(l["point_count"] for l in lines),
        "fragments_clipped": clipped_count,
        "lines": lines,
    }


def clip_to_world_bbox(pts: list[list[int]]) -> list[list[int]]:
    """Clip a polyline to the world [0..max_mc_x] x [0..max_mc_z] bbox.

    Drops points that fall outside the bbox. The world builder must
    not place blocks at negative or oversized coordinates, and the
    simplest way to enforce that is at the data layer.
    """
    x_min, x_max = 0, WORLD["max_mc_x"]
    z_min, z_max = 0, WORLD["max_mc_z"]
    out = []
    for p in pts:
        x, z = p[0], p[1]
        if x_min <= x <= x_max and z_min <= z <= z_max:
            out.append(p)
    return out


# ---------------------------------------------------------------------------
# City gates (typically nodes or small ways in OSM)
# ---------------------------------------------------------------------------

def fetch_gates() -> dict[str, dict]:
    """For each surviving gate, find the OSM node / way best matching its name.

    Falls back to the operator-maintained known-rattanakosin-gates.json
    when OSM has no city_gate marker under that name. The 8 of 9 surviving
    Rattanakosin gates were demolished but their positions are recorded
    in the 1926 Ratcha-anusorn plan; the operator file is how those get
    into the model.
    """
    matches: dict[str, dict] = {}
    REJECT_OSM_TYPES = {"restaurant", "cafe", "amenity", "shop"}

    # Build one big union query for all gates, single round trip
    all_names = "|".join(g["en"] for g in SURVIVING_GATES) + "|" + "|".join(g["th"] for g in SURVIVING_GATES)
    q = f"""
    [out:json][timeout:60];
    (
      node["name"~"{all_names}"]({BBOX});
      way["name"~"{all_names}"]({BBOX});
    );
    out geom;
    """
    try:
        data = overpass(q)
    except Exception:
        data = {"elements": []}

    # Match each element to the first gate that matches
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        # filter out amenities / restaurants named after the gate
        if any(k in tags for k in REJECT_OSM_TYPES):
            continue
        for gate in SURVIVING_GATES:
            if name_matches(tags, gate["en"], gate["th"]) and gate["en"] not in matches:
                geom = el.get("geometry", [])
                if not geom:
                    break
                first = geom[0]
                lon, lat = first["lon"], first["lat"]
                mcx, mcz = project(lon, lat)
                matches[gate["en"]] = {
                    "name_en": gate["en"],
                    "name_th": gate["th"],
                    "description": gate["description"],
                    "osm_id": el.get("id"),
                    "osm_type": el.get("type"),
                    "lon": round(lon, 7),
                    "lat": round(lat, 7),
                    "mcx": mcx,
                    "mcz": mcz,
                    "source": "OpenStreetMap",
                    "source_url": f"https://www.openstreetmap.org/{el.get('type')}/{el.get('id')}",
                }
                break
    return matches


def load_known_gates() -> dict[str, dict]:
    """Read the operator-maintained known-rattanakosin-gates.json file.

    This file holds positions for the 8 Rattanakosin gates that OSM does
    not have tagged as historic=city_gate. Positions come from the 1926
    Ratcha-anusorn plan and public-domain BMA city maps. Operators can
    edit this file as new research refines the positions.
    """
    path = OUT_DIR / "known-rattanakosin-gates.json"
    if not path.exists():
        return {}
    return json.loads(path.read_text())


def merge_known_gates(osm: dict[str, dict], known: dict[str, dict]) -> dict[str, dict]:
    """Layer operator-known positions over OSM hits.

    OSM wins where it has a real match (filtered against the false-positive
    list). For every other surviving gate, take the known position and
    project it.
    """
    out = dict(osm)
    for name, info in known.items():
        if name in out:
            continue  # OSM already has this one
        lon, lat = info["lon"], info["lat"]
        mcx, mcz = project(lon, lat)
        out[name] = {
            "name_en": name,
            "name_th": info.get("th", "?"),
            "description": info.get("notes", ""),
            "lon": round(lon, 7),
            "lat": round(lat, 7),
            "mcx": mcx,
            "mcz": mcz,
            "source": info.get("source", "operator override"),
            "source_url": info.get("source_url", ""),
        }
    return out


# ---------------------------------------------------------------------------
# Wall forts (small OSM ways with historic=* tags)
# ---------------------------------------------------------------------------

def fetch_forts() -> dict[str, dict]:
    matches: dict[str, dict] = {}
    # one combined query
    all_names = "|".join(f["en"] for f in SURVIVING_FORTS) + "|" + "|".join(f["th"] for f in SURVIVING_FORTS)
    q = f"""
    [out:json][timeout:60];
    (
      way["name"~"{all_names}"]["historic"]({BBOX});
      relation["name"~"{all_names}"]["historic"]({BBOX});
    );
    out geom;
    """
    try:
        data = overpass(q)
    except Exception:
        data = {"elements": []}
    for el in data.get("elements", []):
        tags = el.get("tags", {})
        for fort in SURVIVING_FORTS:
            if name_matches(tags, fort["en"], fort["th"]) and fort["en"] not in matches:
                geom = el.get("geometry", [])
                if not geom:
                    break
                lons = [p["lon"] for p in geom]
                lats = [p["lat"] for p in geom]
                clon, clat = sum(lons) / len(lons), sum(lats) / len(lats)
                mcx, mcz = project(clon, clat)
                bbox_pts = [list(project(p["lon"], p["lat"])) for p in geom]
                matches[fort["en"]] = {
                    "name_en": fort["en"],
                    "name_th": fort["th"],
                    "kind": fort["kind"],
                    "built": fort["built"],
                    "description": fort["description"],
                    "osm_id": el.get("id"),
                    "osm_type": el.get("type"),
                    "centroid_lon": round(clon, 7),
                    "centroid_lat": round(clat, 7),
                    "centroid_mcx": mcx,
                    "centroid_mcz": mcz,
                    "vertex_count": len(bbox_pts),
                    "vertices_block": bbox_pts,
                    "source": "OpenStreetMap",
                    "source_url": f"https://www.openstreetmap.org/{el.get('type')}/{el.get('id')}",
                }
                break
    return matches


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    print("Rattanakosin Phase 1 — water, walls, gates, forts")
    print(f"  World: {WORLD['max_mc_x']+1} × {WORLD['max_mc_z']+1} blocks at 1:1")
    print(f"  Bbox: {BBOX}")
    print()

    print("[1/4] Fetching waterways from Overpass...")
    elements = fetch_waterways()
    print(f"  total waterway features: {len(elements)}")

    moat_frags = moat_fragments(elements)
    river_frags = river_fragments(elements)
    print(f"  moat fragments: {len(moat_frags)}")
    print(f"  river fragments: {len(river_frags)}")

    water = build_water_feature(moat_frags, "moat")
    river = build_water_feature(river_frags, "river")
    water_blob = {
        "type": "FeatureCollection",
        "name": "rattanakosin-water",
        "version": "2026-08-25.1",
        "scale_blocks_per_meter": 1.0,
        "moat": water,
        "river": river,
        "sources": [
            {"label": "OpenStreetMap", "url": "https://www.openstreetmap.org/copyright"},
            {"label": "Overpass API", "url": "https://overpass-api.de/"},
        ],
        "caveat": (
            "Moat and river are linear in OSM, not polygons. The world-build "
            "pipeline should buffer each line by the channel width from the "
            "heritage register (moat ≈ 12 m, Chao Phraya ≈ 400 m at this reach) "
            "before placing water blocks."
        ),
    }
    (OUT_DIR / "rattanakosin-water.geojson").write_text(
        json.dumps(water_blob, ensure_ascii=False, separators=(",", ":")) + "\n"
    )
    print(f"  -> rattanakosin-water.geojson ({sum(water_blob['moat']['total_points'] for _ in [0]) + water_blob['river']['total_points']} pts)")

    print()
    print("[2/4] Fetching city gates from Overpass + operator file...")
    osm_gates = fetch_gates()
    known_gates = load_known_gates()
    print(f"  OSM hits: {len(osm_gates)}")
    print(f"  Operator-known: {len(known_gates)}")
    gates = merge_known_gates(osm_gates, known_gates)
    for g in SURVIVING_GATES:
        if g["en"] in osm_gates:
            d = osm_gates[g["en"]]
            print(f"  ✓ {g['en']:25s} (OSM)  block ({d['mcx']:5d}, {d['mcz']:5d})")
        elif g["en"] in known_gates:
            d = gates[g["en"]]
            print(f"  ✓ {g['en']:25s} (known)  block ({d['mcx']:5d}, {d['mcz']:5d})")
        else:
            print(f"  ✗ {g['en']:25s} — not found")
    gates_blob = {
        "type": "FeatureCollection",
        "name": "rattanakosin-gates",
        "version": "2026-08-25.2",
        "scale_blocks_per_meter": 1.0,
        "expected_count": len(SURVIVING_GATES),
        "found_count": len(gates),
        "osm_hits": len(osm_gates),
        "operator_hits": len(known_gates),
        "gates": gates,
        "missing": [g["en"] for g in SURVIVING_GATES if g["en"] not in gates],
        "sources": [
            {"label": "OpenStreetMap", "url": "https://www.openstreetmap.org/copyright"},
            {"label": "Overpass API", "url": "https://overpass-api.de/"},
            {"label": "1926 Ratcha-anusorn plan (operator override file)", "url": "https://en.wikipedia.org/wiki/Rattanakosin"},
        ],
    }
    (OUT_DIR / "rattanakosin-gates.geojson").write_text(
        json.dumps(gates_blob, ensure_ascii=False, separators=(",", ":")) + "\n"
    )

    print()
    print("[3/4] Fetching wall forts from Overpass...")
    forts = fetch_forts()
    for f in SURVIVING_FORTS:
        if f["en"] in forts:
            d = forts[f["en"]]
            print(f"  ✓ {f['en']:25s} block ({d['centroid_mcx']:5d}, {d['centroid_mcz']:5d})  vertices={d['vertex_count']}")
        else:
            print(f"  ✗ {f['en']:25s} — not in OSM")
    forts_blob = {
        "type": "FeatureCollection",
        "name": "rattanakosin-forts",
        "version": "2026-08-25.1",
        "scale_blocks_per_meter": 1.0,
        "expected_count": len(SURVIVING_FORTS),
        "found_count": len(forts),
        "forts": forts,
        "missing": [f["en"] for f in SURVIVING_FORTS if f["en"] not in forts],
        "sources": [
            {"label": "OpenStreetMap", "url": "https://www.openstreetmap.org/copyright"},
            {"label": "Overpass API", "url": "https://overpass-api.de/"},
        ],
    }
    (OUT_DIR / "rattanakosin-forts.geojson").write_text(
        json.dumps(forts_blob, ensure_ascii=False, separators=(",", ":")) + "\n"
    )

    print()
    print("[4/4] Writing provenance meta...")
    meta = {
        "build": "build-rattanakosin-water-and-walls.py",
        "version": "2026-08-25.1",
        "world_projection": WORLD,
        "sources": {
            "overpass": "https://overpass-api.de/",
            "openstreetmap": "https://www.openstreetmap.org/copyright",
            "ratcha-anusorn_1926": "Ratcha-anusorn 1926 city plan (referenced, not extracted here)",
        },
        "outputs": {
            "water": "rattanakosin-water.geojson",
            "gates": "rattanakosin-gates.geojson",
            "forts": "rattanakosin-forts.geojson",
        },
        "moat_fragments": len(moat_frags),
        "river_fragments": len(river_frags),
        "gates_found": len(gates),
        "gates_expected": len(SURVIVING_GATES),
        "forts_found": len(forts),
        "forts_expected": len(SURVIVING_FORTS),
        "caveat": (
            "All placements are linear / point features. The world-build "
            "pipeline must buffer the moat line by ~12 m to make water, and "
            "the river line by the channel width. This script does not place "
            "blocks itself — that is the world gen's job."
        ),
    }
    (OUT_DIR / "rattanakosin-water-and-walls.meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2) + "\n"
    )

    print()
    print("Done.")
    print(f"  {len(moat_frags)} moat fragments, {len(river_frags)} river fragments")
    print(f"  {len(gates)}/{len(SURVIVING_GATES)} gates found")
    print(f"  {len(forts)}/{len(SURVIVING_FORTS)} forts found")
    return 0


if __name__ == "__main__":
    sys.exit(main())
