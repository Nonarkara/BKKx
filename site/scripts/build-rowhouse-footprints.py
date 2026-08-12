#!/usr/bin/env python3
"""Build a review queue of rowhouse-shaped footprints near sourced corridors.

This is intentionally a candidate generator, not a heritage classifier. It uses
the latest Overture building release and a published Bangkok shophouse survey to
rank present-day roof/footprint morphology for human archival and field review.
"""

from __future__ import annotations

import concurrent.futures
import json
import math
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

try:
    import duckdb
    from shapely.geometry import LineString, mapping, shape
    from shapely.ops import transform
except ImportError as exc:  # pragma: no cover - actionable local setup error
    raise SystemExit("Install the data dependencies first: pip install duckdb shapely") from exc


HERE = Path(__file__).resolve().parent
SITE = HERE.parent
CORRIDORS = SITE / "public/data/bangkok-rowhouse-atlas.geojson"
OUTPUT = SITE / "public/data/bangkok-rowhouse-footprint-candidates.geojson"
SUMMARY = SITE / "app/data/rowhouse-footprint-summary.json"
CACHE = SITE / ".cache/overture"
CATALOG_URL = "https://stac.overturemaps.org/catalog.json"
SEARCH_RADIUS_M = 58
MIN_AREA_M2 = 16
MAX_AREA_M2 = 1600
SCORE_THRESHOLD = 0.48
CALIBRATION = {
    "source": "A Study on the Composition of Shophouses in the Central Part of Bangkok",
    "url": "https://www.jstage.jst.go.jp/article/journalcpij/23/0/23_319/_article/-char/en",
    "sample_units": 14421,
    "mean_frontage_m": 3.8,
    "mean_depth_to_width_ratio": 2.93,
    "note": (
        "The 1988 study calibrates morphology only. It does not establish the age, use, "
        "condition or heritage value of any present-day footprint."
    ),
}


def read_json(url: str) -> dict:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "BKKx cultural atlas research; https://bkk.nonarkara.org"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response)


def load_corridors() -> list[dict]:
    if not CORRIDORS.exists():
        raise SystemExit("Run npm run data:rowhouses before building footprint candidates.")
    collection = json.loads(CORRIDORS.read_text())
    return [feature for feature in collection["features"] if feature["geometry"]["type"] == "LineString"]


def latest_release() -> str:
    return read_json(CATALOG_URL)["latest"]


def intersecting_shards(release: str, bounds: tuple[float, float, float, float]) -> list[str]:
    CACHE.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE / f"{release}-bangkok-building-shards.json"
    if cache_file.exists():
        return json.loads(cache_file.read_text())["hrefs"]

    collection_url = f"https://stac.overturemaps.org/{release}/buildings/building/collection.json"
    collection = read_json(collection_url)
    item_urls = [
        urllib.request.urljoin(collection_url, link["href"])
        for link in collection["links"]
        if link["rel"] == "item"
    ]
    west, south, east, north = bounds

    def inspect(url: str) -> str | None:
        item = read_json(url)
        left, bottom, right, top = item["bbox"]
        if left <= east and right >= west and bottom <= north and top >= south:
            return item["assets"]["aws"]["href"]
        return None

    with concurrent.futures.ThreadPoolExecutor(max_workers=24) as executor:
        hrefs = sorted(filter(None, executor.map(inspect, item_urls)))
    cache_file.write_text(json.dumps({"release": release, "hrefs": hrefs}, indent=2) + "\n")
    return hrefs


def project_geometry(geometry, origin_lat: float):
    cosine = math.cos(math.radians(origin_lat))
    return transform(lambda x, y, z=None: (x * 111320 * cosine, y * 110574), geometry)


def shape_metrics(geometry) -> dict:
    origin_lat = geometry.centroid.y
    projected = project_geometry(geometry, origin_lat)
    if projected.is_empty or not projected.is_valid:
        projected = projected.buffer(0)
    rectangle = projected.minimum_rotated_rectangle
    rectangle_coords = list(rectangle.exterior.coords)
    edges = [
        math.dist(rectangle_coords[index], rectangle_coords[index + 1])
        for index in range(4)
    ]
    width = max(min(edges), 0.01)
    depth = max(edges)
    major_edge = max(
        range(4),
        key=lambda index: math.dist(rectangle_coords[index], rectangle_coords[index + 1]),
    )
    start = rectangle_coords[major_edge]
    end = rectangle_coords[major_edge + 1]
    orientation = (math.degrees(math.atan2(end[1] - start[1], end[0] - start[0])) + 180) % 180
    perimeter = projected.length
    return {
        "area": projected.area,
        "centroid": geometry.centroid,
        "shape_ratio": depth / width,
        "orientation": orientation,
        "compactness": (4 * math.pi * projected.area / perimeter**2) if perimeter else 0,
    }


def orientation_difference(first: float, second: float) -> float:
    difference = abs(first - second) % 180
    return min(difference, 180 - difference)


def clamp(value: float) -> float:
    return max(0, min(1, value))


def query_buildings(shards: list[str], corridors: list[dict]) -> list[tuple]:
    clauses = []
    for feature in corridors:
        coordinates = feature["geometry"]["coordinates"]
        lngs = [point[0] for point in coordinates]
        lats = [point[1] for point in coordinates]
        latitude_padding = SEARCH_RADIUS_M / 110574
        longitude_padding = SEARCH_RADIUS_M / (111320 * math.cos(math.radians(sum(lats) / len(lats))))
        clauses.append(
            "(bbox.xmin <= {east} AND bbox.xmax >= {west} AND bbox.ymin <= {north} AND bbox.ymax >= {south})".format(
                west=min(lngs) - longitude_padding,
                east=max(lngs) + longitude_padding,
                south=min(lats) - latitude_padding,
                north=max(lats) + latitude_padding,
            )
        )
    placeholders = ", ".join("?" for _ in shards)
    query = f"""
        SELECT id, height, num_floors, class, subtype, CAST(sources AS JSON), ST_AsWKB(geometry)
        FROM read_parquet([{placeholders}], union_by_name=true)
        WHERE {' OR '.join(clauses)}
    """
    connection = duckdb.connect()
    try:
        connection.execute("LOAD spatial; LOAD httpfs;")
    except duckdb.Error:
        connection.execute("INSTALL spatial; INSTALL httpfs; LOAD spatial; LOAD httpfs;")
    return connection.execute(query, shards).fetchall()


def main() -> None:
    from shapely import from_wkb

    corridors = load_corridors()
    all_coordinates = [point for feature in corridors for point in feature["geometry"]["coordinates"]]
    bounds = (
        min(point[0] for point in all_coordinates) - 0.002,
        min(point[1] for point in all_coordinates) - 0.002,
        max(point[0] for point in all_coordinates) + 0.002,
        max(point[1] for point in all_coordinates) + 0.002,
    )
    release = latest_release()
    shards = intersecting_shards(release, bounds)
    if not shards:
        raise SystemExit(f"No Overture building shards intersect Bangkok in release {release}.")
    rows = query_buildings(shards, corridors)

    corridor_models = []
    for feature in corridors:
        line = LineString(feature["geometry"]["coordinates"])
        corridor_models.append({
            "feature": feature,
            "line": line,
            "projected": project_geometry(line, line.centroid.y),
        })

    preliminary = []
    for identifier, height, floors, building_class, subtype, source_json, wkb in rows:
        geometry = from_wkb(bytes(wkb))
        if geometry.geom_type not in {"Polygon", "MultiPolygon"}:
            continue
        metrics = shape_metrics(geometry)
        if not (MIN_AREA_M2 <= metrics["area"] <= MAX_AREA_M2 and metrics["shape_ratio"] >= 1.15):
            continue
        nearest = None
        for corridor in corridor_models:
            point = project_geometry(metrics["centroid"], corridor["line"].centroid.y)
            distance = point.distance(corridor["projected"])
            if distance <= SEARCH_RADIUS_M and (nearest is None or distance < nearest["distance"]):
                nearest = {"corridor": corridor, "distance": distance}
        if nearest:
            preliminary.append({
                "id": identifier,
                "height": height,
                "floors": floors,
                "class": building_class,
                "subtype": subtype,
                "sources": json.loads(source_json) if source_json else [],
                "geometry": geometry,
                "metrics": metrics,
                **nearest,
            })

    for candidate in preliminary:
        origin_lat = candidate["metrics"]["centroid"].y
        candidate_point = project_geometry(candidate["metrics"]["centroid"], origin_lat)
        neighbours = 0
        for other in preliminary:
            if other is candidate:
                continue
            candidate_slug = candidate["corridor"]["feature"]["properties"]["slug"]
            other_slug = other["corridor"]["feature"]["properties"]["slug"]
            if candidate_slug != other_slug:
                continue
            other_point = project_geometry(other["metrics"]["centroid"], origin_lat)
            if candidate_point.distance(other_point) <= 32 and orientation_difference(
                candidate["metrics"]["orientation"], other["metrics"]["orientation"]
            ) <= 24:
                neighbours += 1
        proximity = clamp(1 - candidate["distance"] / SEARCH_RADIUS_M)
        morphology = clamp(
            (candidate["metrics"]["shape_ratio"] - 1.3)
            / (CALIBRATION["mean_depth_to_width_ratio"] - 1.3)
        )
        repetition = clamp(neighbours / 3)
        plausible_size = 1 if 24 <= candidate["metrics"]["area"] <= 650 else 0.55
        candidate["neighbours"] = neighbours
        candidate["score"] = 0.36 * proximity + 0.34 * morphology + 0.2 * repetition + 0.1 * plausible_size

    accepted = [candidate for candidate in preliminary if candidate["score"] >= SCORE_THRESHOLD]
    accepted.sort(key=lambda candidate: (
        candidate["corridor"]["feature"]["properties"]["slug"],
        candidate["id"],
    ))
    features = []
    for candidate in accepted:
        corridor_properties = candidate["corridor"]["feature"]["properties"]
        features.append({
            "type": "Feature",
            "id": candidate["id"],
            "properties": {
                "overture_id": candidate["id"],
                "overture_release": release,
                "overture_sources": candidate["sources"],
                "height_m": candidate["height"],
                "num_floors": candidate["floors"],
                "building_class": candidate["class"],
                "building_subtype": candidate["subtype"],
                "cluster_slug": corridor_properties["slug"],
                "cluster_name": corridor_properties["name_en"],
                "documentary_evidence": corridor_properties["evidence"],
                "candidate_strength": "strong morphology" if candidate["score"] >= 0.72 else "possible morphology",
                "morphology_score": round(candidate["score"], 3),
                "area_m2": round(candidate["metrics"]["area"], 1),
                "shape_ratio": round(candidate["metrics"]["shape_ratio"], 2),
                "orientation_deg": round(candidate["metrics"]["orientation"], 1),
                "compactness": round(candidate["metrics"]["compactness"], 3),
                "aligned_neighbours_32m": candidate["neighbours"],
                "corridor_distance_m": round(candidate["distance"], 1),
                "method": "Overture footprint morphology screen v1",
                "review_status": "unverified candidate",
                "not_heritage_designation": True,
            },
            "geometry": mapping(candidate["geometry"]),
        })

    by_cluster = {
        feature["properties"]["slug"]: sum(
            candidate["properties"]["cluster_slug"] == feature["properties"]["slug"]
            for candidate in features
        )
        for feature in corridors
    }
    output = {
        "type": "FeatureCollection",
        "name": "Bangkok Rowhouse Footprint Candidates",
        "dataset_version": "2026-08-13.1",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source": f"Overture Maps buildings release {release}",
        "source_url": "https://docs.overturemaps.org/guides/buildings/",
        "license": "Overture Data License; linked source licences remain attached per feature; BKKx metrics CC BY 4.0",
        "calibration": CALIBRATION,
        "method": {
            "corridor_search_radius_m": SEARCH_RADIUS_M,
            "accepted_area_m2": [MIN_AREA_M2, MAX_AREA_M2],
            "score_threshold": SCORE_THRESHOLD,
            "factors": ["corridor proximity", "narrow/deep shape", "aligned neighbours", "plausible footprint area"],
        },
        "caveat": (
            "Machine-screened present-day building roofprints/footprints near documented cultural corridors. "
            "These polygons are not confirmed rowhouses, age estimates, cadastral parcels, statutory conservation "
            "zones or heritage designations. Field and archival verification are required."
        ),
        "candidate_count": len(features),
        "by_cluster": by_cluster,
        "features": features,
    }
    strong_count = sum(
        feature["properties"]["candidate_strength"] == "strong morphology"
        for feature in features
    )
    summary = {
        "dataset_version": output["dataset_version"],
        "generated_at": output["generated_at"],
        "overture_release": release,
        "candidate_count": len(features),
        "strong_count": strong_count,
        "possible_count": len(features) - strong_count,
        "source_url": output["source_url"],
        "calibration": CALIBRATION,
        "by_cluster": by_cluster,
        "caveat": output["caveat"],
    }
    # The public candidate file is machine-consumed and can exceed 100,000
    # pretty-printed lines; compact JSON keeps the Git and network footprint
    # materially smaller. The human-facing summary remains indented.
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n")
    SUMMARY.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    print(f"build-rowhouse-footprints: {len(rows)} buildings -> {len(features)} candidates -> {OUTPUT}")
    print(f"build-rowhouse-footprints: {strong_count} strong morphology + {len(features) - strong_count} possible")
    print(json.dumps(by_cluster, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # keep the command-line failure concise and actionable
        print(f"build-rowhouse-footprints: {exc}", file=sys.stderr)
        raise
