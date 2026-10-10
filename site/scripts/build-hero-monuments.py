#!/usr/bin/env python3
"""Build transparent, survey-informed 3D parts for selected Bangkok monuments.

The input is a small checked-in OpenStreetMap way snapshot. Published official
dimensions define only the overall envelope; intermediate tiers are clearly
labelled proportional interpretation rather than measured conservation data.
"""

from __future__ import annotations

import json
import math
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
    # math.fsum, not sum(): CPython 3.12 changed sum() over floats to
    # compensated (Neumaier) summation, so the same ring gives a different
    # last bit on 3.11 and on 3.12. That reached the committed geojson as a
    # seventh-decimal difference on a couple of vertices and turned CI red
    # against a file generated here (AUDIT-2026-09-06.md §2.5). fsum is
    # correctly rounded and identical on every version, so the artifact is
    # a function of the input rather than of the interpreter.
    return (
        math.fsum(point[0] for point in points) / len(points),
        math.fsum(point[1] for point in points) / len(points),
    )


def scale_ring(ring: list[list[float]], factor: float) -> list[list[float]]:
    """Scale a ring about its centroid, to seven decimals.

    Seven, not the register's six: the smallest parts here are finials under
    a metre across, and a sixth-decimal rounding (~11 cm) moves their
    vertices by a tenth of their size, which changes how the block-plan
    builder rasterises them. The committed file once differed from a fresh
    build by one unit in the seventh decimal on two finials — a digit this
    generator does not produce (three runs here agree byte for byte), so a
    stale commit rather than arithmetic (AUDIT-2026-09-06.md §2.5). CI now
    fails if a build changes any committed generated file, which is the fix
    for that class; fewer digits would only have hidden it.
    """
    center_x, center_y = centroid(ring)
    return [
        [
            round(center_x + (point[0] - center_x) * factor, 7),
            round(center_y + (point[1] - center_y) * factor, 7),
        ]
        for point in ring
    ]


# ---------------------------------------------------------------------------
# Wat Arun at architectural resolution.
#
# The first model was seven stacked copies of the OSM ring, which reads as a
# stepped cone. A Khmer-derived prang is not a cone: it is a REDENTED plan —
# a square whose corners are stepped back twice, so each face carries three
# vertical ribs — standing on three terraces, rising as a bulging "corn cob"
# (fak kham) and ending in a metal trident finial. Four smaller prangs stand
# on the diagonals and four mondops on the cardinal faces.
#
# What is evidence and what is not, part by part:
#   * the 82 m overall height        — Fine Arts Department publication
#   * the footprints and orientation — OpenStreetMap ways (checked-in snapshot):
#     a 34 m square turned 17.5 degrees, satellites 8.3 m, ~29 m out on the
#     diagonals
#   * the redented plan, three terraces, corn-cob profile and the four
#     cardinal mondops — the documented TYPE of the monument, not a survey;
#     every tier height below is a proportion, and graded as one.
# ---------------------------------------------------------------------------

def _local_frame(ring: list[list[float]]):
    lon0, lat0 = centroid(ring)
    kx = math.cos(math.radians(lat0)) * 111320.0
    ky = 110540.0
    def to_m(lon, lat):
        return ((lon - lon0) * kx, (lat - lat0) * ky)
    def to_ll(x, y):
        return [round(lon0 + x / kx, 7), round(lat0 + y / ky, 7)]
    return to_m, to_ll


def redented_square(cx: float, cy: float, half: float, notch: float, angle_deg: float, to_ll) -> list[list[float]]:
    """A square of half-size `half` whose four corners are stepped back twice by `notch`.

    20 vertices; the plan of a Khmer-derived prang. A plain square tier reads as a
    box and a scaled OSM ring reads as a cone — the stepped corners are what make
    the silhouette catch light in ribs, which is how the monument is recognised.
    """
    a, n = half, min(notch, half / 3.2)
    corner = [(a, a - 2 * n), (a - n, a - 2 * n), (a - n, a - n), (a - 2 * n, a - n), (a - 2 * n, a)]
    pts = []
    for q in range(4):
        th = q * math.pi / 2
        c, sn = math.cos(th), math.sin(th)
        pts += [(x * c - y * sn, x * sn + y * c) for x, y in corner]
    th = math.radians(angle_deg)
    c, sn = math.cos(th), math.sin(th)
    ring = [to_ll(cx + x * c - y * sn, cy + x * sn + y * c) for x, y in pts]
    return ring + [ring[0]]


# (tier id, label, base m, top m, half-size as a fraction of the footprint's
#  half-size, notch fraction, colour). Wat Arun is clad in broken porcelain:
#  it reads pale, near-white with a grey-blue cast, not gold.
_PRANG_TERRACES = [
    ("base", "first terrace", 0.0, 6.0, 1.00, 0.07, "#d9d4c6"),
    ("terrace-2", "second terrace", 6.0, 13.0, 0.86, 0.07, "#e2ddd0"),
    ("terrace-3", "third terrace", 13.0, 20.0, 0.73, 0.07, "#d9d4c6"),
    ("plinth", "tower plinth", 20.0, 25.0, 0.60, 0.08, "#ece8de"),
    ("body", "redented tower body", 25.0, 38.0, 0.53, 0.09, "#efece4"),
    ("niche", "niche level (Indra on Erawan)", 38.0, 42.0, 0.49, 0.09, "#dfe3e4"),
]
_CORN_COB_TIERS = 11          # the fak kham, 42 m to 75 m
_CORN_COB_BASE, _CORN_COB_TOP = 42.0, 75.0
_PRANG_FINIAL = [
    ("neck", "neck", 75.0, 77.0, 0.075, 0.0, "#d4d0c4"),
    ("finial", "trident finial (nopphasun)", 77.0, 82.0, 0.035, 0.0, "#c9b26a"),
]


def prang_profile(height: float) -> list[tuple]:
    """The full tier list for a prang of `height` metres, scaled from 82 m."""
    k = height / 82.0
    rows = [(t, l, b * k, h * k, f, n, c) for t, l, b, h, f, n, c in _PRANG_TERRACES]
    span = (_CORN_COB_TOP - _CORN_COB_BASE) / _CORN_COB_TIERS
    for i in range(_CORN_COB_TIERS):
        t = (i + 0.5) / _CORN_COB_TIERS
        # A bullet, not a cone: the tower stays nearly full for most of its
        # height and closes fast near the top. (1 - t^2.2) is ~0.78 at mid
        # height; a linear taper would already be at 0.5 — the first version
        # used one and the render read as a pyramid.
        frac = 0.47 * (1.0 - (0.97 * t) ** 2.2) ** 0.85
        b = _CORN_COB_BASE + i * span
        shade = "#eef0ed" if i % 2 == 0 else "#dfe5e6"
        rows.append((f"cob-{i + 1}", f"corn-cob tier {i + 1}", b * k, (b + span) * k, frac, 0.10, shade))
    rows += [(t, l, b * k, h * k, f, n, c) for t, l, b, h, f, n, c in _PRANG_FINIAL]
    return rows


def _min_area_angle(pts_m: list[tuple[float, float]]) -> tuple[float, float]:
    """Orientation (degrees) and half of the shorter side of the min-area rectangle."""
    best = None
    for tenth in range(0, 900, 5):
        a = math.radians(tenth / 10)
        c, sn = math.cos(a), math.sin(a)
        us = [x * c + y * sn for x, y in pts_m]
        vs = [-x * sn + y * c for x, y in pts_m]
        w, h = max(us) - min(us), max(vs) - min(vs)
        if best is None or w * h < best[0]:
            best = (w * h, tenth / 10, min(w, h) / 2)
    return best[1], best[2]


def wat_arun_parts(by_id: dict, main_ring: list[list[float]]) -> list[dict]:
    to_m, to_ll = _local_frame(main_ring)
    main_m = [to_m(*p) for p in main_ring]
    angle, half = _min_area_angle(main_m)
    cx = math.fsum(x for x, _ in main_m[:-1]) / (len(main_m) - 1)
    cy = math.fsum(y for _, y in main_m[:-1]) / (len(main_m) - 1)

    out: list[dict] = []

    def emit(osm_id, ring, part_id, label, base, top, color, central, kind=None,
             confidence=None, height_source=None):
        f = part(osm_id=osm_id, ring=main_ring, part_id=part_id, part_label=label,
                 base=round(base, 2), height=round(top, 2), scale=1.0, color=color, central=central)
        f["geometry"] = {"type": "Polygon", "coordinates": [ring]}
        pr = f["properties"]
        pr["footprint_source"] = (
            "Plan generated from the OSM way's extent and orientation (snapshot 2026-08-17): "
            "redented square, documented type of a Khmer-derived prang"
        )
        if kind:
            pr["kind"] = kind
        if confidence:
            pr["height_confidence"] = confidence
        if height_source:
            pr["height_source"] = height_source
        out.append(f)

    for tid, label, base, top, frac, notch, color in prang_profile(82.0):
        emit(23482275, redented_square(cx, cy, half * frac, half * notch, angle, to_ll),
             f"wat-arun-central-{tid}", label, base, top, color, True)

    # Satellite prangs: same type, 42 m (51% of the central envelope), each on
    # its own OSM footprint.
    sat_centres = []
    for index, osm_id in enumerate([1148151954, 1148151955, 1148151956, 1148151957], start=1):
        ring_m = [to_m(*p) for p in ring_for(by_id[osm_id])]
        sx = math.fsum(x for x, _ in ring_m[:-1]) / (len(ring_m) - 1)
        sy = math.fsum(y for _, y in ring_m[:-1]) / (len(ring_m) - 1)
        s_angle, s_half = _min_area_angle(ring_m)
        sat_centres.append((sx, sy))
        for tid, label, base, top, frac, notch, color in prang_profile(42.0):
            emit(osm_id, redented_square(sx, sy, s_half * frac, s_half * notch, s_angle, to_ll),
                 f"wat-arun-satellite-{index}-{tid}", f"satellite {index} · {label}",
                 base, top, color, False)

    # Four mondops on the cardinal faces, midway between neighbouring satellite
    # prangs — where the plan puts them. Their heights are an envelope, nothing more.
    order = sorted(sat_centres, key=lambda p: math.atan2(p[1] - cy, p[0] - cx))
    mondop = [
        ("base", "mondop base", 0.0, 4.0, 3.6, "#d9d4c6"),
        ("hall", "mondop hall", 4.0, 9.0, 2.8, "#efece4"),
        ("roof-1", "mondop roof tier 1", 9.0, 11.0, 2.4, "#dfe5e6"),
        ("roof-2", "mondop roof tier 2", 11.0, 13.0, 1.7, "#eef0ed"),
        ("roof-3", "mondop roof tier 3", 13.0, 14.5, 1.1, "#dfe5e6"),
        ("spire", "mondop spire", 14.5, 17.0, 0.45, "#c9b26a"),
    ]
    for i in range(4):
        (ax, ay), (bx, by) = order[i], order[(i + 1) % 4]
        mx, my = (ax + bx) / 2, (ay + by) / 2
        for tid, label, base, top, h, color in mondop:
            emit(23482275, redented_square(mx, my, h, h * 0.12, angle, to_ll),
                 f"wat-arun-mondop-{i + 1}-{tid}", f"mondop {i + 1} · {label}",
                 base, top, color, False, kind="hero_mondop",
                 confidence="interpretive-envelope",
                 height_source="documented type (four cardinal mondops); 17 m envelope is an estimate")
    return out


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


COMPLEX_OF = {
    "grand-palace-siratana-chedi": "wat-phra-kaew-hero-structures",
    "grand-palace-phra-mondop": "wat-phra-kaew-hero-structures",
    "grand-palace-thepbidorn": "wat-phra-kaew-hero-structures",
    "wat-pho-srisanphetdayan": "wat-pho-four-great-chedis",
    "wat-pho-dilok": "wat-pho-four-great-chedis",
    "wat-pho-munibat": "wat-pho-four-great-chedis",
    "wat-pho-srisuriyothai": "wat-pho-four-great-chedis",
}


def complexes(features: list[dict]) -> dict:
    out: dict[str, int] = {}
    for f in features:
        hero = f["properties"]["hero_id"]
        key = COMPLEX_OF.get(hero, hero)
        out[key] = out.get(key, 0) + 1
    return out


def main() -> None:
    source = json.loads(SOURCE.read_text())
    by_id = {element["id"]: element for element in source["elements"]}
    landmark_source = json.loads(LANDMARKS.read_text())
    landmark_by_id = {feature["properties"]["id"]: feature for feature in landmark_source["features"]}

    main_ring = ring_for(by_id[23482275])
    features = wat_arun_parts(by_id, main_ring)

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
        # Derived, not typed: the last hand-written version of this said 23
        # parts for Wat Arun after the model had grown.
        "complexes": complexes(features),
        "featureCount": len(features),
        "features": features,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"build-hero-monuments: {len(features)} parts -> {OUTPUT}")


if __name__ == "__main__":
    main()
