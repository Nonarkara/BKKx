#!/usr/bin/env python3
"""Build transparent, survey-informed 3D parts for selected Bangkok monuments.

The input is a small checked-in OpenStreetMap way snapshot. Published official
dimensions define only the overall envelope; intermediate tiers are clearly
labelled proportional interpretation rather than measured conservation data.
"""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/data/sources/wat-arun-osm-way-snapshot.json"
LANDMARKS = ROOT / "public/data/bkk-landmarks.geojson"
OUTPUT = ROOT / "public/data/bkk-hero-monuments.geojson"

FINE_ARTS_SOURCE = (
    "https://www.finearts.go.th/storage/contents/2023/09/file/"
    "gC5gxouHsHKEl8WM0ywhLlkdrW3OR1WKmfpwoSM2.pdf"
)
BMA_SOURCE = "https://webportal.bangkok.go.th/public/bangkokyai/page/sub/1492"
OSM_ATTRIBUTION = "https://www.openstreetmap.org/copyright"
GRAND_PALACE_PLAN = "https://www.royalgrandpalace.th/download/plan_eng.pdf"
FINE_ARTS_PALACE_SOURCE = (
    "https://www.finearts.go.th/storage/contents/2020/09/file/"
    "7HyIvuwwlVMUPue5a0kEH4vEkgJdLKZRhQBNH1A3.pdf"
)
WAT_PHO_SOURCE = "https://watpho.com/en/architecture/detail/262"
LOHA_PRASAT_SOURCE = "https://www.tourismthailand.org/Attraction/wat-ratchanaddaram"
GOLDEN_MOUNT_SOURCE = "https://www.tourismthailand.org/Attraction/wat-saket"
FINE_ARTS_RAMA_III_SOURCE = (
    "https://www.finearts.go.th/main/view/29960-"
    "%E0%B8%AB%E0%B8%99%E0%B8%B1%E0%B8%87%E0%B8%AA%E0%B8%B7%E0%B8%AD%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87--"
    "%E0%B8%95%E0%B8%B3%E0%B8%99%E0%B8%B2%E0%B8%99%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%A7%E0%B8%B1%E0%B8%95%E0%B8%96%E0%B8%B8%E0%B8%AA%E0%B8%96%E0%B8%B2%E0%B8%99%E0%B8%95%E0%B9%88%E0%B8%B2%E0%B8%87-%E0%B9%86-"
    "%E0%B8%8B%E0%B8%B6%E0%B9%88%E0%B8%87%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%9A%E0%B8%B2%E0%B8%97%E0%B8%AA%E0%B8%A1%E0%B9%80%E0%B8%94%E0%B9%87%E0%B8%88%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%99%E0%B8%B1%E0%B9%88%E0%B8%87%E0%B9%80%E0%B8%81%E0%B8%A5%E0%B9%89%E0%B8%B2%E0%B9%80%E0%B8%88%E0%B9%89%E0%B8%B2%E0%B8%AD%E0%B8%A2%E0%B8%B9%E0%B9%88%E0%B8%AB%E0%B8%B1%E0%B8%A7%E0%B8%97%E0%B8%A3%E0%B8%87%E0%B8%AA%E0%B8%96%E0%B8%B2%E0%B8%9B%E0%B8%99%E0%B8%B2--"
    "%E0%B8%88%E0%B8%B1%E0%B8%94%E0%B8%9E%E0%B8%B4%E0%B8%A1%E0%B8%9E%E0%B9%8C%E0%B9%83%E0%B8%99%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A8%E0%B8%9E-"
    "%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%A7%E0%B8%B4%E0%B8%A1%E0%B8%B2%E0%B8%94%E0%B8%B2%E0%B9%80%E0%B8%98%E0%B8%AD-%E0%B8%81%E0%B8%A3%E0%B8%A1%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%AA%E0%B8%B8%E0%B8%97%E0%B8%98%E0%B8%B2%E0%B8%AA%E0%B8%B4%E0%B8%99%E0%B8%B5%E0%B8%99%E0%B8%B2%E0%B8%8E-"
    "%E0%B8%9B%E0%B8%B4%E0%B8%A2%E0%B8%A1%E0%B8%AB%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%8A%E0%B8%9B%E0%B8%94%E0%B8%B4%E0%B8%A7%E0%B8%A3%E0%B8%B1%E0%B8%94%E0%B8%B2-%E0%B8%84%E0%B8%A3%E0%B8%9A%E0%B8%A8%E0%B8%95%E0%B8%A1%E0%B8%B2%E0%B8%AB--%E0%B8%93--"
    "%E0%B8%A7%E0%B8%B1%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%88-12-%E0%B8%95%E0%B8%B8%E0%B8%A5%E0%B8%B2%E0%B8%84%E0%B8%A1-%E0%B8%9E-%E0%B8%A8---2472?type1=10"
)


def ring_for(element: dict) -> list[list[float]]:
    return [[point["lon"], point["lat"]] for point in element["geometry"]]


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


def part(
    *,
    osm_id: int,
    ring: list[list[float]],
    part_id: str,
    part_label: str,
    base: float,
    height: float,
    scale: float,
    color: str,
    central: bool,
) -> dict:
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [scale_ring(ring, scale)]},
        "properties": {
            "id": part_id,
            "hero_id": "wat-arun-prang-group",
            "name": "พระปรางค์วัดอรุณราชวราราม",
            "name_en": "Wat Arun prang group",
            "part_label": part_label,
            "kind": "hero_prang" if central else "satellite_prang",
            "height": height,
            "base_height": base,
            "material_color": color,
            "osm_id": osm_id,
            "footprint_source": "OpenStreetMap way snapshot · 2026-08-17",
            "height_source": (
                "Fine Arts Department publication · 82 m overall envelope"
                if central
                else "proportional schematic · 51% of central envelope"
            ),
            "height_confidence": "official-envelope" if central else "interpretive-proportion",
            "model_status": "survey-informed schematic",
            "source": (
                "Fine Arts Department official-height envelope + OSM footprint"
                if central
                else "OSM footprint + BKKx proportional tiering"
            ),
            "source_url": FINE_ARTS_SOURCE,
            "source_note": (
                "Fine Arts publishes 82 m; BMA publishes 67 m and TAT publishes 81 m. "
                "This model uses the Fine Arts envelope and does not resolve that source disagreement."
            ),
            "not_measured_survey": True,
        },
    }


PALACE_PLAN_NOTE = (
    "The official Grand Palace plan confirms this structure's identity. "
    "The stacked envelope is interpretive and is not a measured survey, BIM or conservation record."
)


def stacked_part(
    *,
    source_feature: dict,
    hero_id: str,
    name: str,
    name_en: str,
    kind: str,
    part_id: str,
    part_label: str,
    base: float,
    height: float,
    scale: float,
    color: str,
    morphology_source: str,
    morphology_url: str,
    model_status: str,
    source_note: str,
) -> dict:
    """Stacked schematic tier on an OSM / landmark footprint.

    Identity can be source-confirmed (a named hall on the Grand Palace plan,
    a published chedi). The envelope itself is always interpretive.
    """
    ring = source_feature["geometry"]["coordinates"][0]
    raw_id = source_feature["properties"]["id"]
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [scale_ring(ring, scale)]},
        "properties": {
            "id": part_id,
            "hero_id": hero_id,
            "name": name,
            "name_en": name_en,
            "part_label": part_label,
            "kind": kind,
            "height": height,
            "base_height": base,
            "material_color": color,
            "osm_id": raw_id.removeprefix("bkk-building-"),
            "footprint_source": "OpenStreetMap footprint · BKKx landmark extract 2026-08-10",
            "height_source": "BKKx curated interpretive envelope · not an official dimension",
            "height_confidence": "interpretive-envelope",
            "model_status": model_status,
            "source": morphology_source,
            "source_url": morphology_url,
            "source_note": source_note,
            "not_measured_survey": True,
        },
    }


def palace_part(
    *,
    source_feature: dict,
    hero_id: str,
    name: str,
    name_en: str,
    kind: str,
    part_id: str,
    part_label: str,
    base: float,
    height: float,
    scale: float,
    color: str,
    morphology_source: str,
    morphology_url: str,
    source_note: str = PALACE_PLAN_NOTE,
    model_status: str = "official-plan matched schematic",
) -> dict:
    """Create an official-plan-matched but explicitly interpretive palace tier."""
    return stacked_part(
        source_feature=source_feature,
        hero_id=hero_id,
        name=name,
        name_en=name_en,
        kind=kind,
        part_id=part_id,
        part_label=part_label,
        base=base,
        height=height,
        scale=scale,
        color=color,
        morphology_source=morphology_source,
        morphology_url=morphology_url,
        model_status=model_status,
        source_note=source_note,
    )


def wat_pho_part(
    *, source_feature: dict, hero_id: str, name: str, name_en: str,
    part_id: str, part_label: str, base: float, height: float,
    scale: float, color: str,
) -> dict:
    """Create a source-identified, explicitly interpretive Great Chedi tier."""
    ring = source_feature["geometry"]["coordinates"][0]
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [scale_ring(ring, scale)]},
        "properties": {
            "id": part_id,
            "hero_id": hero_id,
            "name": name,
            "name_en": name_en,
            "part_label": part_label,
            "kind": "hero_wat_pho_chedi",
            "height": height,
            "base_height": base,
            "material_color": color,
            "osm_id": source_feature["properties"]["id"].removeprefix("bkk-building-"),
            "footprint_source": "OpenStreetMap footprint · BKKx landmark extract 2026-08-10",
            "height_source": "BKKx curated 40 m silhouette envelope · not an official dimension",
            "height_confidence": "interpretive-envelope",
            "model_status": "official-source identified schematic",
            "source": "Wat Pho official architecture record + Fine Arts Department royal chronology",
            "source_url": WAT_PHO_SOURCE,
            "source_note": (
                "Wat Pho identifies the four-pagoda group; Fine Arts documents its royal chronology. "
                "The stacked envelope and colour palette are interpretive, not a measured survey or tile record."
            ),
            "not_measured_survey": True,
        },
    }


def main() -> None:
    source = json.loads(SOURCE.read_text())
    by_id = {element["id"]: element for element in source["elements"]}
    landmark_source = json.loads(LANDMARKS.read_text())
    landmark_by_id = {feature["properties"]["id"]: feature for feature in landmark_source["features"]}

    main_ring = ring_for(by_id[23482275])
    central_tiers = [
        ("base", "stepped base", 0, 12, 1.00, "#e7d4aa"),
        ("terrace", "processional terrace", 12, 24, 0.86, "#c9ad78"),
        ("body", "central prang body", 24, 56, 0.60, "#eee2c5"),
        ("shoulder", "upper shoulder", 56, 68, 0.39, "#b8a77e"),
        ("crown", "crown", 68, 74, 0.27, "#e9d39d"),
        ("spire", "spire", 74, 79, 0.16, "#d8b85e"),
        ("finial", "gilded finial", 79, 82, 0.075, "#f4c84d"),
    ]
    features = [
        part(
            osm_id=23482275,
            ring=main_ring,
            part_id=f"wat-arun-central-{tier_id}",
            part_label=label,
            base=base,
            height=height,
            scale=scale,
            color=color,
            central=True,
        )
        for tier_id, label, base, height, scale, color in central_tiers
    ]

    satellite_tiers = [
        ("base", "satellite base", 0, 10, 1.00, "#d9c69f"),
        ("body", "satellite body", 10, 28, 0.64, "#e9ddc1"),
        ("crown", "satellite crown", 28, 36, 0.34, "#c5aa74"),
        ("spire", "satellite spire", 36, 42, 0.12, "#e8bd50"),
    ]
    for index, osm_id in enumerate([1148151954, 1148151955, 1148151956, 1148151957], start=1):
        ring = ring_for(by_id[osm_id])
        for tier_id, label, base, height, scale, color in satellite_tiers:
            features.append(
                part(
                    osm_id=osm_id,
                    ring=ring,
                    part_id=f"wat-arun-satellite-{index}-{tier_id}",
                    part_label=f"{label} {index}",
                    base=base,
                    height=height,
                    scale=scale,
                    color=color,
                    central=False,
                )
            )

    palace_models = [
        {
            "source_id": "bkk-building-23482988",
            "hero_id": "grand-palace-siratana-chedi",
            "name": "พระศรีรัตนเจดีย์",
            "name_en": "Phra Siratana Chedi",
            "kind": "hero_chedi",
            "source": "Bureau of the Royal Household official plan · structure 3",
            "source_url": GRAND_PALACE_PLAN,
            "tiers": [
                ("base", "square plinth", 0, 4, 1.00, "#d9b75e"),
                ("terrace", "stepped terrace", 4, 9, 0.88, "#ebca6e"),
                ("drum", "circular drum massing", 9, 18, 0.72, "#dcb445"),
                ("bell", "bell-form envelope", 18, 32, 0.56, "#f0cf66"),
                ("crown", "upper crown", 32, 37, 0.32, "#d6a932"),
                ("spire", "spire", 37, 40, 0.14, "#f1d579"),
                ("finial", "finial", 40, 42, 0.06, "#f7df83"),
            ],
        },
        {
            "source_id": "bkk-building-23482989",
            "hero_id": "grand-palace-phra-mondop",
            "name": "พระมณฑป",
            "name_en": "Phra Mondop",
            "kind": "hero_mondop",
            "source": "Fine Arts Department publication · seven-tier roof; official plan structure 7",
            "source_url": FINE_ARTS_PALACE_SOURCE,
            "tiers": [
                ("body", "scripture-hall body", 0, 12, 1.00, "#bf7e32"),
                ("roof-1", "roof tier 1 of 7", 12, 15, 0.92, "#3f7c62"),
                ("roof-2", "roof tier 2 of 7", 15, 18, 0.82, "#d5a53e"),
                ("roof-3", "roof tier 3 of 7", 18, 20.5, 0.70, "#3f7c62"),
                ("roof-4", "roof tier 4 of 7", 20.5, 22.5, 0.58, "#d5a53e"),
                ("roof-5", "roof tier 5 of 7", 22.5, 24.5, 0.46, "#3f7c62"),
                ("roof-6", "roof tier 6 of 7", 24.5, 26.5, 0.34, "#d5a53e"),
                ("roof-7", "roof tier 7 of 7", 26.5, 28, 0.18, "#f0c95a"),
            ],
        },
        {
            "source_id": "bkk-building-23482990",
            "hero_id": "grand-palace-thepbidorn",
            "name": "ปราสาทพระเทพบิดร",
            "name_en": "Prasat Phra Dhepbidorn",
            "kind": "hero_prasat",
            "source": "Bureau of the Royal Household official plan · structure 9",
            "source_url": GRAND_PALACE_PLAN,
            "tiers": [
                ("body", "pantheon body", 0, 12, 1.00, "#a95536"),
                ("lower-roof", "lower roof envelope", 12, 18, 0.88, "#3f6b55"),
                ("upper-roof", "upper roof envelope", 18, 24, 0.62, "#c89236"),
                ("spire", "central spire envelope", 24, 29, 0.28, "#42745a"),
                ("finial", "finial", 29, 32, 0.09, "#efc757"),
            ],
        },
    ]
    for model in palace_models:
        source_feature = landmark_by_id[model["source_id"]]
        for tier_id, label, base, height, scale, color in model["tiers"]:
            features.append(
                palace_part(
                    source_feature=source_feature,
                    hero_id=model["hero_id"],
                    name=model["name"],
                    name_en=model["name_en"],
                    kind=model["kind"],
                    part_id=f"{model['hero_id']}-{tier_id}",
                    part_label=label,
                    base=base,
                    height=height,
                    scale=scale,
                    color=color,
                    morphology_source=model["source"],
                    morphology_url=model["source_url"],
                )
            )

    wat_pho_chedis = [
        ("bkk-building-783589708", "wat-pho-srisanphetdayan", "พระมหาเจดีย์ศรีสรรเพชดาญาณ", "Phra Maha Chedi Si Sanphetdayan", "#4f8a68"),
        ("bkk-building-783589706", "wat-pho-dilok", "พระมหาเจดีย์ดิลกธรรมนิทาน", "Phra Maha Chedi Dilok Thammanithan", "#eee7d5"),
        ("bkk-building-783589709", "wat-pho-munibat", "พระมหาเจดีย์มุนีปัตตบริขาร", "Phra Maha Chedi Muni Bat Borikhan", "#e4bd47"),
        ("bkk-building-783589707", "wat-pho-srisuriyothai", "พระมหาเจดีย์ทรงพระศรีสุริโยทัย", "Phra Maha Chedi Song Phra Srisuriyothai", "#5279a5"),
    ]
    wat_pho_tiers = [
        ("plinth", "tiled plinth", 0, 5, 1.00),
        ("terrace", "stepped terrace", 5, 10, 0.88),
        ("body", "bell-form body envelope", 10, 26, 0.63),
        ("shoulder", "upper shoulder", 26, 32, 0.40),
        ("spire", "spire", 32, 38, 0.18),
        ("finial", "finial", 38, 40, 0.07),
    ]
    for source_id, hero_id, name, name_en, color in wat_pho_chedis:
        source_feature = landmark_by_id[source_id]
        for tier_id, label, base, height, scale in wat_pho_tiers:
            features.append(wat_pho_part(
                source_feature=source_feature,
                hero_id=hero_id,
                name=name,
                name_en=name_en,
                part_id=f"{hero_id}-{tier_id}",
                part_label=label,
                base=base,
                height=height,
                scale=scale,
                color=color,
            ))

    # Distinctive landmarks that were still a single box. Identity is sourced;
    # the stacked envelope is interpretive and stays inside the curated height
    # already published on the landmark layer. Loha Prasat is not modelled as
    # thirty-seven spires — that would invent positions this data does not have.
    further_models = [
        {
            "source_id": "bkk-building-103097698",
            "hero_id": "loha-prasat",
            "name": "โลหะปราสาท",
            "name_en": "Loha Prasat",
            "kind": "hero_loha_prasat",
            "source": "Tourism Authority of Thailand · Wat Ratchanaddaram / Loha Prasat",
            "source_url": LOHA_PRASAT_SOURCE,
            "model_status": "source-identified schematic",
            "source_note": (
                "TAT identifies the metal castle at Wat Ratchanaddaram. "
                "The stacked envelope is interpretive and does not place the thirty-seven spires."
            ),
            "tiers": [
                ("body", "square body", 0, 14, 1.00, "#b8a88a"),
                ("pavilion", "concentric pavilion roof", 14, 22, 0.78, "#9a8b6e"),
                ("tower", "central tower", 22, 29, 0.42, "#c9ad78"),
                ("spire", "gilded central spire", 29, 33, 0.14, "#e8bd50"),
            ],
        },
        {
            "source_id": "bkk-building-82541999",
            "hero_id": "dusit-maha-prasat",
            "name": "พระที่นั่งดุสิตมหาปราสาท",
            "name_en": "Dusit Maha Prasat",
            "kind": "hero_prasat",
            "source": "Bureau of the Royal Household official plan · Dusit Maha Prasat",
            "source_url": GRAND_PALACE_PLAN,
            "model_status": "official-plan matched schematic",
            "source_note": PALACE_PLAN_NOTE,
            "tiers": [
                ("body", "throne-hall body", 0, 12, 1.00, "#eee2c5"),
                ("lower-roof", "lower stacked gable", 12, 18, 0.88, "#3f7c62"),
                ("upper-roof", "upper stacked gable", 18, 24, 0.62, "#d5a53e"),
                ("spire", "central spire envelope", 24, 28, 0.28, "#42745a"),
                ("finial", "finial", 28, 30, 0.09, "#efc757"),
            ],
        },
        {
            "source_id": "bkk-building-229783128",
            "hero_id": "aphonphimok-prasat",
            "name": "พระที่นั่งอาภรณ์พิโมกข์ปราสาท",
            "name_en": "Aphonphimok Prasat",
            "kind": "hero_prasat",
            "source": "Bureau of the Royal Household official plan · Aphonphimok Prasat",
            "source_url": GRAND_PALACE_PLAN,
            "model_status": "official-plan matched schematic",
            "source_note": PALACE_PLAN_NOTE,
            "tiers": [
                ("body", "open pavilion body", 0, 10, 1.00, "#e9ddc1"),
                ("roof", "pyramidal roof envelope", 10, 18, 0.82, "#3f7c62"),
                ("spire", "central spire envelope", 18, 25, 0.34, "#d5a53e"),
                ("finial", "finial", 25, 28, 0.10, "#f0c95a"),
            ],
        },
        {
            "source_id": "bkk-building-82546665",
            "hero_id": "siwalai-maha-prasat",
            "name": "พระที่นั่งศิวาลัยมหาปราสาท",
            "name_en": "Siwalai Maha Prasat",
            "kind": "hero_prasat",
            "source": "Bureau of the Royal Household official plan · Siwalai Maha Prasat",
            "source_url": GRAND_PALACE_PLAN,
            "model_status": "official-plan matched schematic",
            "source_note": PALACE_PLAN_NOTE,
            "tiers": [
                ("body", "prasat body", 0, 12, 1.00, "#e7d4aa"),
                ("roof", "stacked roof envelope", 12, 20, 0.78, "#3f7c62"),
                ("spire", "central spire envelope", 20, 26, 0.32, "#d5a53e"),
                ("finial", "finial", 26, 28, 0.10, "#efc757"),
            ],
        },
        {
            "source_id": "landmark-golden-mount-chedi",
            "hero_id": "golden-mount-chedi",
            "name": "พระบรมบรรพต",
            "name_en": "Golden Mount Chedi",
            "kind": "hero_chedi",
            "source": "Tourism Authority of Thailand · Wat Saket / Golden Mount",
            "source_url": GOLDEN_MOUNT_SOURCE,
            "model_status": "source-identified schematic",
            "source_note": (
                "TAT identifies the chedi on the artificial hill at Wat Saket. "
                "Tiers sit on the 45 m hill already modelled as a landmark box "
                "and stay inside the 60 m schematic silhouette; they are not a measured survey."
            ),
            "tiers": [
                ("plinth", "chedi plinth on the hill", 45, 48, 1.00, "#d9b75e"),
                ("bell", "bell-form envelope", 48, 54, 0.72, "#ebca6e"),
                ("shoulder", "upper shoulder", 54, 57, 0.40, "#d6a932"),
                ("spire", "spire", 57, 60, 0.14, "#e8bd50"),
            ],
        },
    ]
    for model in further_models:
        source_feature = landmark_by_id[model["source_id"]]
        for tier_id, label, base, height, scale, color in model["tiers"]:
            features.append(
                stacked_part(
                    source_feature=source_feature,
                    hero_id=model["hero_id"],
                    name=model["name"],
                    name_en=model["name_en"],
                    kind=model["kind"],
                    part_id=f"{model['hero_id']}-{tier_id}",
                    part_label=label,
                    base=base,
                    height=height,
                    scale=scale,
                    color=color,
                    morphology_source=model["source"],
                    morphology_url=model["source_url"],
                    model_status=model["model_status"],
                    source_note=model["source_note"],
                )
            )

    payload = {
        "type": "FeatureCollection",
        "name": "bkk-hero-monuments",
        "version": "2026-09-05.1",
        "description": (
            "Survey-informed procedural monument parts. Wat Arun uses current OSM footprints "
            "and the Fine Arts Department's published 82 m central envelope. Wat Phra Kaew hero "
            "structures are matched to the official Grand Palace plan. Wat Pho's Four Great Chedis are "
            "identified from Wat Pho and Fine Arts records. Loha Prasat, Dusit Maha Prasat, "
            "Aphonphimok Prasat, Siwalai Maha Prasat and the Golden Mount chedi are stacked "
            "from the same landmark footprints, still interpretive. All tiering remains interpretive."
        ),
        "modelStatus": "survey-informed schematic · not a measured conservation model",
        "sourceConflict": (
            "Fine Arts: 82 m; Tourism Authority of Thailand: 81 m; BMA Bangkok Yai: 67 m. "
            "The Fine Arts figure defines this model's envelope."
        ),
        "sources": [
            {"label": "Fine Arts Department publication", "url": FINE_ARTS_SOURCE},
            {"label": "BMA Bangkok Yai record", "url": BMA_SOURCE},
            {"label": "OpenStreetMap attribution", "url": OSM_ATTRIBUTION},
            {"label": "Bureau of the Royal Household official plan", "url": GRAND_PALACE_PLAN},
            {"label": "Fine Arts Department palace reference", "url": FINE_ARTS_PALACE_SOURCE},
            {"label": "Wat Pho official architecture record", "url": WAT_PHO_SOURCE},
            {"label": "Fine Arts Department Rama III record", "url": FINE_ARTS_RAMA_III_SOURCE},
            {"label": "Tourism Authority of Thailand · Wat Ratchanaddaram", "url": LOHA_PRASAT_SOURCE},
            {"label": "Tourism Authority of Thailand · Wat Saket", "url": GOLDEN_MOUNT_SOURCE},
        ],
        "complexes": {
            "wat-arun-prang-group": 23,
            "wat-phra-kaew-hero-structures": 20,
            "wat-pho-four-great-chedis": 24,
            "loha-prasat": 4,
            "dusit-maha-prasat": 5,
            "aphonphimok-prasat": 4,
            "siwalai-maha-prasat": 4,
            "golden-mount-chedi": 4,
        },
        "featureCount": len(features),
        "features": features,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"build-hero-monuments: {len(features)} parts -> {OUTPUT}")


if __name__ == "__main__":
    main()
