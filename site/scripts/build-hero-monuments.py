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
OUTPUT = ROOT / "public/data/bkk-hero-monuments.geojson"

FINE_ARTS_SOURCE = (
    "https://www.finearts.go.th/storage/contents/2023/09/file/"
    "gC5gxouHsHKEl8WM0ywhLlkdrW3OR1WKmfpwoSM2.pdf"
)
BMA_SOURCE = "https://webportal.bangkok.go.th/public/bangkokyai/page/sub/1492"
OSM_ATTRIBUTION = "https://www.openstreetmap.org/copyright"


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


def main() -> None:
    source = json.loads(SOURCE.read_text())
    by_id = {element["id"]: element for element in source["elements"]}

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

    payload = {
        "type": "FeatureCollection",
        "name": "bkk-hero-monuments",
        "version": "2026-08-17.1",
        "description": (
            "Survey-informed procedural monument parts. Wat Arun uses current OSM footprints "
            "and the Fine Arts Department's published 82 m central envelope; tiering is interpretive."
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
        ],
        "featureCount": len(features),
        "features": features,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"build-hero-monuments: {len(features)} parts -> {OUTPUT}")


if __name__ == "__main__":
    main()
