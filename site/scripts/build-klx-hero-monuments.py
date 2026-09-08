#!/usr/bin/env python3
"""Build stacked, recognisable 3D parts for Kuala Lumpur's iconic buildings.

Published official dimensions define only the overall envelope (CTBUH
architectural height, occupied floors, skybridge, minaret, antenna).
Intermediate tiers are labelled interpretive. Footprints come from a
checked-in OpenStreetMap snapshot — except where OSM has no building
way (KL Tower, Murugan statue), in which case a schematic plan is
constructed from the node and labelled as such.

This is not a measured survey, BIM, or conservation record.
"""

from __future__ import annotations

import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/data/sources/klx-osm-way-snapshot.json"
HERO_OUT = ROOT / "public/data/klx-hero-monuments.geojson"
RIVER_OUT = ROOT / "public/data/klx-rivers.geojson"
FLOOD_OUT = ROOT / "public/data/klx-flood-corridor.geojson"

OSM_ATTRIBUTION = "https://www.openstreetmap.org/copyright"
CTBUH_PETRONAS = "https://www.skyscrapercenter.com/building/petronas-twin-towers/149"
CTBUH_MERDEKA = "https://www.skyscrapercenter.com/building/menara-merdeka-maybank/10115"
CTBUH_EXCHANGE = "https://www.skyscrapercenter.com/building/the-exchange-106/13247"
MENARA_KL = "https://www.menarakl.com.my/"
MASJID_NEGARA = "https://www.malaysia.travel/explore/masjid-negara"
JWN_2007 = "https://www.heritage.gov.my/ms/pengisytiharan-2007.html"
JWN_2009 = "https://www.heritage.gov.my/ms/pengisytiharan-2009.html"
TOURISM_MASJID = "https://ebrochures.malaysia.travel/"

PETRONAS_ARCH = 451.9
PETRONAS_OCCUPIED = 375.0
PETRONAS_SKYBRIDGE_AGL = 170.0
PETRONAS_SKYBRIDGE_LEN = 58.4
MERDEKA_ARCH = 678.9
MERDEKA_OCCUPIED = 502.8
EXCHANGE_ARCH = 453.6
KL_TOWER_ANTENNA = 421.0
KL_TOWER_POD = 336.5
KL_TOWER_OBS = 276.0
MASJID_NEGARA_MINARET = 73.0


def ring_for(element: dict) -> list[list[float]]:
    pts = [[point["lon"], point["lat"]] for point in element["geometry"]]
    if pts[0] != pts[-1]:
        pts.append(pts[0][:])
    return pts


def centroid(ring: list[list[float]]) -> tuple[float, float]:
    points = ring[:-1] if ring[0] == ring[-1] else ring
    return (
        sum(point[0] for point in points) / len(points),
        sum(point[1] for point in points) / len(points),
    )


def scale_ring(ring: list[list[float]], factor: float) -> list[list[float]]:
    center_x, center_y = centroid(ring)
    return [
        [
            round(center_x + (point[0] - center_x) * factor, 7),
            round(center_y + (point[1] - center_y) * factor, 7),
        ]
        for point in ring
    ]


def meters_to_deg(lat: float, east_m: float, north_m: float) -> tuple[float, float]:
    dlat = north_m / 111_320.0
    dlon = east_m / (111_320.0 * math.cos(math.radians(lat)))
    return dlon, dlat


def close(ring: list[list[float]]) -> list[list[float]]:
    if ring[0] != ring[-1]:
        return ring + [ring[0][:]]
    return ring


def regular_ring(
    lon: float,
    lat: float,
    radius_m: float,
    n: int = 16,
    rotation_deg: float = 0.0,
) -> list[list[float]]:
    coords: list[list[float]] = []
    for i in range(n):
        ang = math.radians(rotation_deg + i * 360.0 / n)
        dlon, dlat = meters_to_deg(lat, radius_m * math.sin(ang), radius_m * math.cos(ang))
        coords.append([round(lon + dlon, 7), round(lat + dlat, 7)])
    return close(coords)


def star_ring(
    lon: float,
    lat: float,
    radius_m: float,
    inner_ratio: float = 0.48,
    points: int = 8,
    rotation_deg: float = 22.5,
) -> list[list[float]]:
    """Eight-pointed star — the Petronas floor plate, schematic."""
    coords: list[list[float]] = []
    for i in range(points * 2):
        ang = math.radians(rotation_deg + i * 180.0 / points)
        r = radius_m if i % 2 == 0 else radius_m * inner_ratio
        dlon, dlat = meters_to_deg(lat, r * math.sin(ang), r * math.cos(ang))
        coords.append([round(lon + dlon, 7), round(lat + dlat, 7)])
    return close(coords)


def rect_between(
    a: tuple[float, float],
    b: tuple[float, float],
    width_m: float,
) -> list[list[float]]:
    """Thin rectangle spanning two lon/lat points, width in metres."""
    lon1, lat1 = a
    lon2, lat2 = b
    mid_lat = (lat1 + lat2) / 2
    dx = lon2 - lon1
    dy = lat2 - lat1
    length = math.hypot(dx, dy) or 1e-12
    # perpendicular unit vector in degrees, scaled to metres
    # convert dx,dy to metres first
    east_m = dx * 111_320.0 * math.cos(math.radians(mid_lat))
    north_m = dy * 111_320.0
    length_m = math.hypot(east_m, north_m) or 1e-12
    ux, uy = east_m / length_m, north_m / length_m
    px, py = -uy, ux
    half = width_m / 2
    corners_m = [
        (-0 * ux + (-half) * px, -0 * uy + (-half) * py),
        (length_m * ux + (-half) * px, length_m * uy + (-half) * py),
        (length_m * ux + half * px, length_m * uy + half * py),
        (0 * ux + half * px, 0 * uy + half * py),
    ]
    coords = []
    for e, n in corners_m:
        dlon, dlat = meters_to_deg(lat1, e, n)
        coords.append([round(lon1 + dlon, 7), round(lat1 + dlat, 7)])
    return close(coords)


def part(
    *,
    ring: list[list[float]],
    part_id: str,
    hero_id: str,
    name: str,
    name_en: str,
    name_ms: str,
    name_zh: str,
    part_label: str,
    kind: str,
    base: float,
    height: float,
    color: str,
    osm_id: int | str,
    footprint_source: str,
    height_source: str,
    height_confidence: str,
    model_status: str,
    source: str,
    source_url: str,
    source_note: str,
    scale: float = 1.0,
) -> dict:
    geometry_ring = scale_ring(ring, scale) if scale != 1.0 else ring
    if geometry_ring[0] != geometry_ring[-1]:
        geometry_ring = geometry_ring + [geometry_ring[0][:]]
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [geometry_ring]},
        "properties": {
            "id": part_id,
            "hero_id": hero_id,
            "name": name,
            "name_en": name_en,
            "name_ms": name_ms,
            "name_zh": name_zh,
            "part_label": part_label,
            "kind": kind,
            "height": height,
            "base_height": base,
            "material_color": color,
            "osm_id": osm_id,
            "footprint_source": footprint_source,
            "height_source": height_source,
            "height_confidence": height_confidence,
            "model_status": model_status,
            "source": source,
            "source_url": source_url,
            "source_note": source_note,
            "not_measured_survey": True,
        },
    }


def split_petronas(ring: list[list[float]]) -> tuple[tuple[float, float], tuple[float, float]]:
    cx, cy = centroid(ring)
    west = [p for p in ring[:-1] if p[0] < cx]
    east = [p for p in ring[:-1] if p[0] >= cx]
    return centroid(west + [west[0]]), centroid(east + [east[0]])


def build_petronas(by_id: dict) -> list[dict]:
    combined = by_id[279944536]
    podium_ring = ring_for(combined)
    west_c, east_c = split_petronas(podium_ring)
    # SW tower is west cluster, NE tower is east cluster — the real diagonal pair.
    towers = [
        ("petronas-1", "Petronas Tower 1", "Menara Petronas 1", "国油双峰塔一号", east_c, 22.5),
        ("petronas-2", "Petronas Tower 2", "Menara Petronas 2", "国油双峰塔二号", west_c, 22.5),
    ]
    note = (
        "CTBUH architectural height 451.9 m; occupied 375 m. Skybridge 58.4 m long at 170 m AGL, "
        "levels 41–42. OSM records the twins as one combined way (279944536); shafts are an "
        "interpretive eight-pointed-star split of that outline. Not a floor-by-floor survey."
    )
    footprint = "OpenStreetMap way 279944536 snapshot · 2026-09-08 · interpretive star split of the combined twin outline"
    features = [
        part(
            ring=podium_ring,
            part_id="petronas-podium",
            hero_id="petronas-twin-towers",
            name="Menara Berkembar Petronas",
            name_en="Petronas Twin Towers podium",
            name_ms="Podium Menara Berkembar Petronas",
            name_zh="国油双峰塔裙楼",
            part_label="shared podium",
            kind="hero_podium",
            base=0,
            height=22,
            color="#4a5563",
            osm_id=279944536,
            footprint_source=footprint,
            height_source="KLX interpretive podium · not an official dimension",
            height_confidence="interpretive-envelope",
            model_status="survey-informed schematic",
            source="CTBUH envelope + OSM combined twin outline",
            source_url=CTBUH_PETRONAS,
            source_note=note,
        )
    ]
    for hero_id, name_en, name_ms, name_zh, (lon, lat), rot in towers:
        star = star_ring(lon, lat, 23.0, rotation_deg=rot)
        tiers = [
            ("shaft", "office shaft", 22, PETRONAS_OCCUPIED, 1.00, "#c9d6e2", "official-envelope",
             f"CTBUH occupied height {PETRONAS_OCCUPIED:.0f} m"),
            ("shoulder", "setback shoulder", 300, PETRONAS_OCCUPIED, 0.78, "#b7c7d6", "interpretive-proportion",
             "Interpretive setback proportion below the occupied envelope"),
            ("pinnacle-base", "pinnacle base", PETRONAS_OCCUPIED, 410, 0.42, "#dfe7ee", "interpretive-proportion",
             "Interpretive pinnacle taper inside the 451.9 m CTBUH architectural envelope"),
            ("pinnacle", "pinnacle", 410, PETRONAS_ARCH, 0.16, "#eef3f7", "official-envelope",
             f"CTBUH architectural height {PETRONAS_ARCH} m"),
        ]
        for tier_id, label, base, height, scale, color, conf, src in tiers:
            features.append(
                part(
                    ring=star,
                    part_id=f"{hero_id}-{tier_id}",
                    hero_id="petronas-twin-towers",
                    name="Menara Berkembar Petronas",
                    name_en=name_en,
                    name_ms=name_ms,
                    name_zh=name_zh,
                    part_label=label,
                    kind="hero_tower",
                    base=base,
                    height=height,
                    color=color,
                    osm_id=279944536,
                    footprint_source=footprint,
                    height_source=src,
                    height_confidence=conf,
                    model_status="official-envelope schematic",
                    source="CTBUH Petronas Twin Towers + OSM way 279944536",
                    source_url=CTBUH_PETRONAS,
                    source_note=note,
                    scale=scale,
                )
            )
    sky = rect_between(west_c, east_c, 11.0)
    features.append(
        part(
            ring=sky,
            part_id="petronas-skybridge",
            hero_id="petronas-twin-towers",
            name="Skybridge Menara Berkembar Petronas",
            name_en="Petronas skybridge",
            name_ms="Jambatan langit Menara Berkembar Petronas",
            name_zh="双峰塔天空桥",
            part_label="skybridge levels 41–42",
            kind="hero_skybridge",
            base=PETRONAS_SKYBRIDGE_AGL,
            height=PETRONAS_SKYBRIDGE_AGL + 8,
            color="#8a9aab",
            osm_id=279944536,
            footprint_source="Interpretive span between OSM-derived tower centroids · published length 58.4 m",
            height_source=f"Published skybridge {PETRONAS_SKYBRIDGE_AGL:.0f} m AGL, {PETRONAS_SKYBRIDGE_LEN} m long, levels 41–42",
            height_confidence="official-envelope",
            model_status="official-envelope schematic",
            source="CTBUH / Petronas engineering notes",
            source_url=CTBUH_PETRONAS,
            source_note=note,
        )
    )
    # Menara 3 — OSM-tagged height
    m3 = by_id[469717874]
    m3_ring = ring_for(m3)
    osm_h = float(m3["tags"].get("height", 267))
    features.append(
        part(
            ring=m3_ring,
            part_id="menara-3-petronas-shaft",
            hero_id="menara-3-petronas",
            name="Menara 3 Petronas",
            name_en="Menara 3 Petronas",
            name_ms="Menara 3 Petronas",
            name_zh="国油第三峰",
            part_label="office shaft",
            kind="hero_tower",
            base=0,
            height=osm_h,
            color="#9aa8b5",
            osm_id=469717874,
            footprint_source="OpenStreetMap way 469717874 snapshot · 2026-09-08",
            height_source=f"OpenStreetMap height={osm_h:g} tag on way 469717874",
            height_confidence="osm-tagged",
            model_status="OSM-tagged schematic",
            source="OpenStreetMap tagged height",
            source_url="https://www.openstreetmap.org/way/469717874",
            source_note="OSM records height 267 m / 60 floors. Not a CTBUH architectural height for this shaft.",
        )
    )
    return features


def build_merdeka(by_id: dict) -> list[dict]:
    el = by_id[645604854]
    ring = ring_for(el)
    note = (
        "CTBUH architectural height 678.9 m, occupied 502.8 m, 118 floors "
        "(Menara Merdeka Maybank). OSM way 645604854 is a coarse 10-point "
        "footprint; the taper is interpretive so the spire reads as a spire."
    )
    tiers = [
        ("plinth", "plinth", 0, 28, 1.05, "#1c242c", "interpretive-envelope"),
        ("body", "occupied shaft", 28, MERDEKA_OCCUPIED, 0.72, "#24303a", "official-envelope"),
        ("waist", "upper occupied taper", 280, MERDEKA_OCCUPIED, 0.48, "#2e3d4a", "interpretive-proportion"),
        ("crown", "crown", MERDEKA_OCCUPIED, 580, 0.28, "#3a4d5c", "interpretive-proportion"),
        ("spire", "spire", 580, MERDEKA_ARCH, 0.08, "#c9a227", "official-envelope"),
        ("needle", "needle", 640, MERDEKA_ARCH, 0.035, "#e0c35a", "interpretive-proportion"),
    ]
    features = []
    for tier_id, label, base, height, scale, color, conf in tiers:
        src = (
            f"CTBUH architectural height {MERDEKA_ARCH} m"
            if conf == "official-envelope" and height == MERDEKA_ARCH
            else (
                f"CTBUH occupied height {MERDEKA_OCCUPIED} m"
                if conf == "official-envelope"
                else "KLX interpretive taper inside the published envelope · not a measured survey"
            )
        )
        features.append(
            part(
                ring=ring,
                part_id=f"merdeka-118-{tier_id}",
                hero_id="merdeka-118",
                name="Menara Merdeka Maybank",
                name_en="Merdeka 118",
                name_ms="Menara Merdeka Maybank",
                name_zh="默迪卡118",
                part_label=label,
                kind="hero_spire",
                base=base,
                height=height,
                color=color,
                osm_id=645604854,
                footprint_source="OpenStreetMap way 645604854 snapshot · 2026-09-08 (coarse 10-point footprint)",
                height_source=src,
                height_confidence=conf,
                model_status="official-envelope schematic",
                source="CTBUH Menara Merdeka Maybank + OSM footprint",
                source_url=CTBUH_MERDEKA,
                source_note=note,
                scale=scale,
            )
        )
    return features


def build_exchange(by_id: dict) -> list[dict]:
    el = by_id[503451214]
    ring = ring_for(el)
    note = (
        "CTBUH architectural height 453.6 m, 95 floors. Some Chinese-language "
        "summaries quote 445.5 m; this model uses CTBUH 453.6 m. Intermediate "
        "tapers are interpretive."
    )
    tiers = [
        ("podium", "podium", 0, 24, 1.05, "#2a3a48", "interpretive-envelope"),
        ("shaft", "office shaft", 24, 400, 0.88, "#3d5a73", "interpretive-proportion"),
        ("crown", "crown", 400, EXCHANGE_ARCH, 0.55, "#4d6e8a", "official-envelope"),
    ]
    features = []
    for tier_id, label, base, height, scale, color, conf in tiers:
        src = (
            f"CTBUH architectural height {EXCHANGE_ARCH} m"
            if conf == "official-envelope"
            else "KLX interpretive taper inside the published envelope"
        )
        features.append(
            part(
                ring=ring,
                part_id=f"exchange-106-{tier_id}",
                hero_id="exchange-106",
                name="Menara Exchange 106",
                name_en="The Exchange 106",
                name_ms="Menara Exchange 106",
                name_zh="交易所106",
                part_label=label,
                kind="hero_tower",
                base=base,
                height=height,
                color=color,
                osm_id=503451214,
                footprint_source="OpenStreetMap way 503451214 snapshot · 2026-09-08",
                height_source=src,
                height_confidence=conf,
                model_status="official-envelope schematic",
                source="CTBUH The Exchange 106 + OSM footprint",
                source_url=CTBUH_EXCHANGE,
                source_note=note,
                scale=scale,
            )
        )
    return features


def build_kl_tower(by_id: dict) -> list[dict]:
    node = by_id[5839389988]
    lon, lat = node["lon"], node["lat"]
    note = (
        "Menara KL publishes antenna 421 m, pod roof 336.5 m, observatory 276 m. "
        "OSM has only a node (5839389988), no building way — the circular shaft "
        "and bulb are an interpretive footprint constructed from that node."
    )
    footprint = "Interpretive circular plan constructed from OSM node 5839389988 · 2026-09-08"
    specs = [
        ("base", "shaft", 0, KL_TOWER_OBS, 9.0, "#d8cbb8", "official-envelope",
         f"Observatory {KL_TOWER_OBS:g} m (Menara KL)"),
        ("pod", "observation pod", KL_TOWER_OBS, KL_TOWER_POD, 18.0, "#c45c8a", "official-envelope",
         f"Pod roof {KL_TOWER_POD:g} m (Menara KL)"),
        ("antenna", "antenna", KL_TOWER_POD, KL_TOWER_ANTENNA, 2.4, "#9aa0a6", "official-envelope",
         f"Antenna {KL_TOWER_ANTENNA:g} m (Menara KL / OSM height tag)"),
    ]
    features = []
    for tier_id, label, base, height, radius, color, conf, src in specs:
        features.append(
            part(
                ring=regular_ring(lon, lat, radius, n=24),
                part_id=f"kl-tower-{tier_id}",
                hero_id="menara-kl",
                name="Menara Kuala Lumpur",
                name_en="Kuala Lumpur Tower",
                name_ms="Menara Kuala Lumpur",
                name_zh="吉隆坡塔",
                part_label=label,
                kind="hero_tower",
                base=base,
                height=height,
                color=color,
                osm_id=5839389988,
                footprint_source=footprint,
                height_source=src,
                height_confidence=conf,
                model_status="official-envelope schematic",
                source="Menara KL published heights + OSM node 5839389988",
                source_url=MENARA_KL,
                source_note=note,
            )
        )
    return features


def build_masjid_negara(by_id: dict) -> list[dict]:
    el = by_id[585264338]
    ring = ring_for(el)
    cx, cy = centroid(ring)
    note = (
        "Tourism Malaysia publishes the 73 m minaret and the 16-point star "
        "umbrella roof. Hall height is not an official figure here. Minaret "
        "plan is interpretive, placed at the north of the OSM hall footprint."
    )
    dlon, dlat = meters_to_deg(cy, 28, 42)
    minaret = regular_ring(cx + dlon, cy + dlat, 4.5, n=16)
    features = [
        part(
            ring=ring,
            part_id="masjid-negara-hall",
            hero_id="masjid-negara",
            name="Masjid Negara",
            name_en="National Mosque",
            name_ms="Masjid Negara",
            name_zh="国家清真寺",
            part_label="prayer hall",
            kind="hero_mosque",
            base=0,
            height=12,
            color="#f4f0e6",
            osm_id=585264338,
            footprint_source="OpenStreetMap way 585264338 snapshot · 2026-09-08",
            height_source="KLX interpretive hall envelope · not an official dimension",
            height_confidence="interpretive-envelope",
            model_status="survey-informed schematic",
            source="OSM footprint + Tourism Malaysia identification",
            source_url=MASJID_NEGARA,
            source_note=note,
        ),
        part(
            ring=ring,
            part_id="masjid-negara-umbrella",
            hero_id="masjid-negara",
            name="Masjid Negara",
            name_en="National Mosque umbrella roof",
            name_ms="Bumbung payung Masjid Negara",
            name_zh="国家清真寺折伞屋顶",
            part_label="16-point umbrella roof",
            kind="hero_mosque_roof",
            base=12,
            height=28,
            color="#2f7f86",
            osm_id=585264338,
            footprint_source="OpenStreetMap way 585264338 snapshot · 2026-09-08",
            height_source="Interpretive folded-umbrella roof on the identified 16-point star form",
            height_confidence="interpretive-proportion",
            model_status="survey-informed schematic",
            source="Tourism Malaysia identification of the 16-point star roof",
            source_url=MASJID_NEGARA,
            source_note=note,
            scale=0.72,
        ),
        part(
            ring=minaret,
            part_id="masjid-negara-minaret",
            hero_id="masjid-negara",
            name="Menara Masjid Negara",
            name_en="National Mosque minaret",
            name_ms="Menara Masjid Negara",
            name_zh="国家清真寺宣礼塔",
            part_label="minaret",
            kind="hero_minaret",
            base=0,
            height=MASJID_NEGARA_MINARET,
            color="#d9d2c5",
            osm_id=585264338,
            footprint_source="Interpretive circular minaret beside OSM hall way 585264338",
            height_source=f"Published minaret {MASJID_NEGARA_MINARET:g} m (Tourism Malaysia)",
            height_confidence="official-envelope",
            model_status="official-envelope schematic",
            source="Tourism Malaysia / Masjid Negara",
            source_url=MASJID_NEGARA,
            source_note=note,
        ),
    ]
    return features


def build_sultan_abdul_samad(by_id: dict) -> list[dict]:
    el = by_id[801337963]
    ring = ring_for(el)
    cx, cy = centroid(ring)
    lons = [p[0] for p in ring]
    lats = [p[1] for p in ring]
    west = min(lons)
    # Clock tower reads on the Dataran Merdeka (west) frontage.
    tower_lon = west + (cx - west) * 0.35
    tower_lat = cy
    note = (
        "National Heritage 2007 (Jabatan Warisan Negara). Identity is "
        "heritage-confirmed. Copper-dome and clock-tower envelopes are "
        "interpretive — a secondary 41 m clock-tower figure is not treated "
        "as official here."
    )
    features = [
        part(
            ring=ring,
            part_id="sas-body",
            hero_id="sultan-abdul-samad",
            name="Bangunan Sultan Abdul Samad",
            name_en="Sultan Abdul Samad Building",
            name_ms="Bangunan Sultan Abdul Samad",
            name_zh="苏丹阿都沙末大厦",
            part_label="civic range",
            kind="hero_civic",
            base=0,
            height=16,
            color="#8c4a3a",
            osm_id=801337963,
            footprint_source="OpenStreetMap way 801337963 snapshot · 2026-09-08",
            height_source="KLX interpretive civic envelope · not an official dimension",
            height_confidence="interpretive-envelope",
            model_status="heritage-identified schematic",
            source="Jabatan Warisan Negara 2007 + OSM detailed footprint",
            source_url=JWN_2007,
            source_note=note,
        )
    ]
    for i, (dx, dy, r, h, label) in enumerate(
        [
            (0, 0, 7.5, 28, "central copper dome"),
            (-38, 8, 5.5, 24, "north copper dome"),
            (38, -6, 5.5, 24, "south copper dome"),
        ]
    ):
        dlon, dlat = meters_to_deg(cy, dx, dy)
        features.append(
            part(
                ring=regular_ring(cx + dlon, cy + dlat, r, n=16),
                part_id=f"sas-dome-{i+1}",
                hero_id="sultan-abdul-samad",
                name="Bangunan Sultan Abdul Samad",
                name_en="Sultan Abdul Samad Building",
                name_ms="Bangunan Sultan Abdul Samad",
                name_zh="苏丹阿都沙末大厦",
                part_label=label,
                kind="hero_dome",
                base=16,
                height=h,
                color="#b87333",
                osm_id=801337963,
                footprint_source="Interpretive dome discs on OSM way 801337963",
                height_source="KLX interpretive copper-dome envelope · not a measured survey",
                height_confidence="interpretive-envelope",
                model_status="heritage-identified schematic",
                source="Jabatan Warisan Negara 2007 + OSM detailed footprint",
                source_url=JWN_2007,
                source_note=note,
            )
        )
    features.append(
        part(
            ring=regular_ring(tower_lon, tower_lat, 6.5, n=8, rotation_deg=12),
            part_id="sas-clock-tower",
            hero_id="sultan-abdul-samad",
            name="Menara jam Bangunan Sultan Abdul Samad",
            name_en="Sultan Abdul Samad clock tower",
            name_ms="Menara jam Bangunan Sultan Abdul Samad",
            name_zh="苏丹阿都沙末钟楼",
            part_label="clock tower",
            kind="hero_clock_tower",
            base=0,
            height=38,
            color="#7a3f32",
            osm_id=801337963,
            footprint_source="Interpretive clock-tower plan on the west frontage of way 801337963",
            height_source="KLX interpretive clock-tower envelope · 41 m figures in secondary copy are not used as official",
            height_confidence="interpretive-envelope",
            model_status="heritage-identified schematic",
            source="Jabatan Warisan Negara 2007 + OSM detailed footprint",
            source_url=JWN_2007,
            source_note=note,
        )
    )
    return features


def build_masjid_jamek(by_id: dict) -> list[dict]:
    el = by_id[480717734]
    ring = ring_for(el)
    cx, cy = centroid(ring)
    note = (
        "National Heritage 2009. Onion-dome and minaret envelopes are "
        "interpretive so the confluence mosque reads as itself."
    )
    features = [
        part(
            ring=ring,
            part_id="jamek-hall",
            hero_id="masjid-jamek",
            name="Masjid Jamek Kuala Lumpur",
            name_en="Jamek Mosque",
            name_ms="Masjid Jamek Kuala Lumpur",
            name_zh="占美清真寺",
            part_label="prayer hall",
            kind="hero_mosque",
            base=0,
            height=10,
            color="#f7f2e8",
            osm_id=480717734,
            footprint_source="OpenStreetMap way 480717734 snapshot · 2026-09-08",
            height_source="KLX interpretive hall envelope · not an official dimension",
            height_confidence="interpretive-envelope",
            model_status="heritage-identified schematic",
            source="Jabatan Warisan Negara 2009 + OSM footprint",
            source_url=JWN_2009,
            source_note=note,
        )
    ]
    for i, (dx, dy, r, h) in enumerate([(-8, 4, 5.5, 22), (0, 8, 6.5, 26), (8, 4, 5.5, 22)]):
        dlon, dlat = meters_to_deg(cy, dx, dy)
        features.append(
            part(
                ring=regular_ring(cx + dlon, cy + dlat, r, n=16),
                part_id=f"jamek-dome-{i+1}",
                hero_id="masjid-jamek",
                name="Masjid Jamek Kuala Lumpur",
                name_en="Jamek Mosque",
                name_ms="Masjid Jamek Kuala Lumpur",
                name_zh="占美清真寺",
                part_label="onion dome",
                kind="hero_dome",
                base=10,
                height=h,
                color="#e8d9a8",
                osm_id=480717734,
                footprint_source="Interpretive onion discs on OSM way 480717734",
                height_source="KLX interpretive onion-dome envelope",
                height_confidence="interpretive-envelope",
                model_status="heritage-identified schematic",
                source="Jabatan Warisan Negara 2009 + OSM footprint",
                source_url=JWN_2009,
                source_note=note,
            )
        )
    return features


def build_thean_hou(by_id: dict) -> list[dict]:
    el = by_id[453802547]
    ring = ring_for(el)
    note = (
        "OSM way 453802547, building:levels=4. Not confirmed as National Heritage "
        "on the 2007/2009/2012 JWN lists pulled for this twin. Stacked tiers are "
        "interpretive so the hillside temple reads as a Chinese temple."
    )
    tiers = [
        ("terrace", "hill terrace", 0, 6, 1.05, "#8b2e2e"),
        ("hall", "prayer halls", 6, 16, 0.88, "#c43c3c"),
        ("roof", "upturned roofs", 16, 24, 0.62, "#d4a017"),
        ("pagoda", "central pavilion", 24, 32, 0.28, "#e8c547"),
    ]
    features = []
    for tier_id, label, base, height, scale, color in tiers:
        features.append(
            part(
                ring=ring,
                part_id=f"thean-hou-{tier_id}",
                hero_id="thean-hou",
                name="Thean Hou Temple",
                name_en="Thean Hou Temple",
                name_ms="Kuil Thean Hou",
                name_zh="天后宫",
                part_label=label,
                kind="hero_temple",
                base=base,
                height=height,
                color=color,
                osm_id=453802547,
                footprint_source="OpenStreetMap way 453802547 snapshot · 2026-09-08",
                height_source="KLX interpretive temple envelope from OSM levels=4 · not an official dimension",
                height_confidence="interpretive-envelope",
                model_status="survey-informed schematic",
                source="OpenStreetMap footprint; identity from named way",
                source_url="https://www.openstreetmap.org/way/453802547",
                source_note=note,
                scale=scale,
            )
        )
    return features


def build_parlimen(by_id: dict) -> list[dict]:
    el = by_id[229254507]
    ring = ring_for(el)
    note = "National Heritage 2007. Roof and chamber height are interpretive."
    return [
        part(
            ring=ring,
            part_id="parlimen-body",
            hero_id="parlimen",
            name="Bangunan Parlimen Malaysia",
            name_en="Parliament of Malaysia",
            name_ms="Bangunan Parlimen Malaysia",
            name_zh="马来西亚国会大厦",
            part_label="chambers",
            kind="hero_civic",
            base=0,
            height=18,
            color="#efe7d6",
            osm_id=229254507,
            footprint_source="OpenStreetMap way 229254507 snapshot · 2026-09-08",
            height_source="KLX interpretive civic envelope · not an official dimension",
            height_confidence="interpretive-envelope",
            model_status="heritage-identified schematic",
            source="Jabatan Warisan Negara 2007 + OSM footprint",
            source_url=JWN_2007,
            source_note=note,
        ),
        part(
            ring=ring,
            part_id="parlimen-roof",
            hero_id="parlimen",
            name="Bangunan Parlimen Malaysia",
            name_en="Parliament of Malaysia",
            name_ms="Bangunan Parlimen Malaysia",
            name_zh="马来西亚国会大厦",
            part_label="butterfly roof",
            kind="hero_civic_roof",
            base=18,
            height=28,
            color="#d7c7a2",
            osm_id=229254507,
            footprint_source="OpenStreetMap way 229254507 snapshot · 2026-09-08",
            height_source="KLX interpretive roof envelope",
            height_confidence="interpretive-envelope",
            model_status="heritage-identified schematic",
            source="Jabatan Warisan Negara 2007 + OSM footprint",
            source_url=JWN_2007,
            source_note=note,
            scale=0.7,
        ),
    ]


def build_tugu(by_id: dict) -> list[dict]:
    el = by_id[1212049483]
    ring = ring_for(el)
    cx, cy = centroid(ring)
    note = "National Heritage 2007. Bronze group envelope is interpretive; OSM way is a 5-point stub."
    return [
        part(
            ring=regular_ring(cx, cy, 8, n=12),
            part_id="tugu-negara-plinth",
            hero_id="tugu-negara",
            name="Tugu Negara",
            name_en="National Monument",
            name_ms="Tugu Negara",
            name_zh="国家纪念碑",
            part_label="plinth",
            kind="hero_monument",
            base=0,
            height=6,
            color="#5c5146",
            osm_id=1212049483,
            footprint_source="Interpretive disc on OSM way 1212049483 snapshot · 2026-09-08",
            height_source="KLX interpretive monument envelope",
            height_confidence="interpretive-envelope",
            model_status="heritage-identified schematic",
            source="Jabatan Warisan Negara 2007",
            source_url=JWN_2007,
            source_note=note,
        ),
        part(
            ring=regular_ring(cx, cy, 4, n=10),
            part_id="tugu-negara-group",
            hero_id="tugu-negara",
            name="Tugu Negara",
            name_en="National Monument",
            name_ms="Tugu Negara",
            name_zh="国家纪念碑",
            part_label="bronze group",
            kind="hero_monument",
            base=6,
            height=15,
            color="#8a7030",
            osm_id=1212049483,
            footprint_source="Interpretive disc on OSM way 1212049483 snapshot · 2026-09-08",
            height_source="KLX interpretive monument envelope",
            height_confidence="interpretive-envelope",
            model_status="heritage-identified schematic",
            source="Jabatan Warisan Negara 2007",
            source_url=JWN_2007,
            source_note=note,
        ),
    ]


def build_murugan(by_id: dict) -> list[dict]:
    node = by_id[2911346279]
    lon, lat = node["lon"], node["lat"]
    note = (
        "Lord Murugan Statue at Batu Caves, Gombak, Selangor — not inside "
        "Wilayah Persekutuan Kuala Lumpur. OSM node 2911346279. A 42.7 m "
        "figure is widely repeated in tourism copy and is used here only as "
        "an interpretive envelope, not as a published official dimension."
    )
    return [
        part(
            ring=regular_ring(lon, lat, 6, n=12),
            part_id="murugan-plinth",
            hero_id="batu-caves-murugan",
            name="Patung Lord Murugan, Batu Caves",
            name_en="Lord Murugan Statue, Batu Caves",
            name_ms="Patung Lord Murugan, Batu Caves",
            name_zh="黑风洞穆鲁甘神像",
            part_label="plinth",
            kind="hero_statue",
            base=0,
            height=4,
            color="#c4b8a0",
            osm_id=2911346279,
            footprint_source="Interpretive disc from OSM node 2911346279 · 2026-09-08",
            height_source="KLX interpretive plinth",
            height_confidence="interpretive-envelope",
            model_status="metro-context schematic",
            source="OpenStreetMap node · Selangor / Gombak, not WP KL",
            source_url="https://www.openstreetmap.org/node/2911346279",
            source_note=note,
        ),
        part(
            ring=regular_ring(lon, lat, 3.2, n=10),
            part_id="murugan-statue",
            hero_id="batu-caves-murugan",
            name="Patung Lord Murugan, Batu Caves",
            name_en="Lord Murugan Statue, Batu Caves",
            name_ms="Patung Lord Murugan, Batu Caves",
            name_zh="黑风洞穆鲁甘神像",
            part_label="statue",
            kind="hero_statue",
            base=4,
            height=42.7,
            color="#d4a017",
            osm_id=2911346279,
            footprint_source="Interpretive disc from OSM node 2911346279 · 2026-09-08",
            height_source="Tourism-copy 42.7 m figure used as interpretive envelope only — not treated as official",
            height_confidence="interpretive-envelope",
            model_status="metro-context schematic",
            source="OpenStreetMap node · Selangor / Gombak, not WP KL",
            source_url="https://www.openstreetmap.org/node/2911346279",
            source_note=note,
        ),
    ]


def buffer_line(coords: list[list[float]], half_width_m: float) -> list[list[float]] | None:
    if len(coords) < 2:
        return None
    left: list[list[float]] = []
    right: list[list[float]] = []
    for i, (lon, lat) in enumerate(coords):
        if i == 0:
            lon2, lat2 = coords[i + 1]
            lon0, lat0 = lon, lat
        elif i == len(coords) - 1:
            lon0, lat0 = coords[i - 1]
            lon2, lat2 = lon, lat
        else:
            lon0, lat0 = coords[i - 1]
            lon2, lat2 = coords[i + 1]
        east = (lon2 - lon0) * 111_320.0 * math.cos(math.radians(lat))
        north = (lat2 - lat0) * 111_320.0
        length = math.hypot(east, north) or 1e-12
        px, py = -north / length, east / length
        dlon, dlat = meters_to_deg(lat, px * half_width_m, py * half_width_m)
        left.append([round(lon + dlon, 7), round(lat + dlat, 7)])
        right.append([round(lon - dlon, 7), round(lat - dlat, 7)])
    ring = left + list(reversed(right))
    return close(ring)


def build_rivers(elements: list[dict]) -> tuple[dict, dict]:
    river_features = []
    flood_features = []
    keep_names = {
        "Sungai Klang",
        "Sungai Gombak",
        "Sungai Batu",
        "Terusan Lencongan Sungai Gombak",
    }
    for el in elements:
        if el["type"] != "way":
            continue
        tags = el.get("tags") or {}
        name = tags.get("name")
        if name not in keep_names:
            continue
        geom = el.get("geometry") or []
        if len(geom) < 8:
            continue
        coords = [[p["lon"], p["lat"]] for p in geom]
        river_features.append(
            {
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": coords},
                "properties": {
                    "id": f"river-{el['id']}",
                    "name": name,
                    "name_en": {
                        "Sungai Klang": "Klang River",
                        "Sungai Gombak": "Gombak River",
                        "Sungai Batu": "Batu River",
                        "Terusan Lencongan Sungai Gombak": "Gombak River diversion canal",
                    }[name],
                    "name_ms": name,
                    "name_zh": {
                        "Sungai Klang": "巴生河",
                        "Sungai Gombak": "鹅麦河",
                        "Sungai Batu": "batu河",
                        "Terusan Lencongan Sungai Gombak": "鹅麦河分流渠",
                    }[name],
                    "osm_id": el["id"],
                    "waterway": tags.get("waterway"),
                    "source": "OpenStreetMap waterway",
                    "source_url": f"https://www.openstreetmap.org/way/{el['id']}",
                },
            }
        )
        buf = buffer_line(coords, 90)
        if buf:
            flood_features.append(
                {
                    "type": "Feature",
                    "geometry": {"type": "Polygon", "coordinates": [buf]},
                    "properties": {
                        "id": f"flood-corridor-{el['id']}",
                        "name": f"{name} drainage corridor",
                        "kind": "interpretive-drainage-corridor",
                        "width_m": 180,
                        "source_note": (
                            "Interpretive 90 m buffer either side of the OSM river centreline. "
                            "This is NOT Jabatan Pengairan dan Saliran zon banjir, NOT MyGDI "
                            "DATA BANJIR 2002/2003, and must not be read as an official floodplain."
                        ),
                        "osm_id": el["id"],
                    },
                }
            )
    rivers = {
        "type": "FeatureCollection",
        "name": "KLX rivers",
        "attribution": "© OpenStreetMap contributors, ODbL 1.0",
        "retrieved_at": "2026-09-08",
        "features": river_features,
        "featureCount": len(river_features),
    }
    flood = {
        "type": "FeatureCollection",
        "name": "KLX interpretive drainage corridors",
        "modelStatus": "interpretive drainage corridor, not official JPS zon banjir",
        "sourceNote": (
            "JPS / MyGDI flood-area datasets for WP Kuala Lumpur (2002/2003) are catalogued "
            "as awaiting-ingest. Until they are fetched, this layer is a labelled schematic "
            "around OSM river geometry only."
        ),
        "features": flood_features,
        "featureCount": len(flood_features),
    }
    return rivers, flood


def main() -> None:
    source = json.loads(SOURCE.read_text())
    by_id = {element["id"]: element for element in source["elements"]}

    features: list[dict] = []
    features += build_petronas(by_id)
    features += build_merdeka(by_id)
    features += build_exchange(by_id)
    features += build_kl_tower(by_id)
    features += build_masjid_negara(by_id)
    features += build_sultan_abdul_samad(by_id)
    features += build_masjid_jamek(by_id)
    features += build_thean_hou(by_id)
    features += build_parlimen(by_id)
    features += build_tugu(by_id)
    features += build_murugan(by_id)

    complexes = dict(Counter(f["properties"]["hero_id"] for f in features))
    collection = {
        "type": "FeatureCollection",
        "name": "KLX hero monuments",
        "modelStatus": (
            "Stacked schematic parts for mayor-demo recognisability. "
            "Not a measured conservation model, BIM, or as-built survey."
        ),
        "attribution": "© OpenStreetMap contributors, ODbL 1.0. Published heights from CTBUH, Menara KL, Tourism Malaysia, Jabatan Warisan Negara.",
        "retrieved_at": "2026-09-08",
        "complexes": complexes,
        "featureCount": len(features),
        "features": features,
    }
    HERO_OUT.write_text(json.dumps(collection, ensure_ascii=False, indent=2) + "\n")

    rivers, flood = build_rivers(source["elements"])
    RIVER_OUT.write_text(json.dumps(rivers, ensure_ascii=False, indent=2) + "\n")
    FLOOD_OUT.write_text(json.dumps(flood, ensure_ascii=False, indent=2) + "\n")

    print(f"klx heroes: {len(features)} parts across {len(complexes)} complexes -> {HERO_OUT}")
    print(f"  complexes: {complexes}")
    print(f"  max height: {max(f['properties']['height'] for f in features)}")
    print(f"rivers: {rivers['featureCount']}  flood corridors: {flood['featureCount']}")


if __name__ == "__main__":
    main()
