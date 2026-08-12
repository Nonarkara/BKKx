import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OLDTOWN_SPOTS } from "../app/data/oldtown-spots.ts";

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, "../public/data/bangkok-rowhouse-atlas.geojson");

const features = OLDTOWN_SPOTS.flatMap((spot) => {
  const properties = {
    slug: spot.slug,
    name_en: spot.name,
    name_th: spot.thai,
    kind: spot.kind,
    period: spot.period,
    typology: spot.typology,
    evidence: spot.evidence,
    documented_units: spot.units ?? null,
    register_id: spot.registerId ?? null,
    note: spot.note,
    explorer_tip: spot.explorerTip,
    source: spot.source,
    source_url: spot.sourceUrl,
    geometry_method: spot.fabric.method,
    geometry_confidence: spot.fabric.geometryConfidence,
  };
  return [
    {
      type: "Feature",
      id: `${spot.slug}-corridor`,
      properties: { ...properties, feature_role: "cultural corridor" },
      geometry: { type: "LineString", coordinates: spot.fabric.coordinates },
    },
    {
      type: "Feature",
      id: `${spot.slug}-anchor`,
      properties: { ...properties, feature_role: "explorer anchor" },
      geometry: { type: "Point", coordinates: spot.center },
    },
  ];
});

const collection = {
  type: "FeatureCollection",
  name: "Bangkok Rowhouse Atlas",
  dataset_version: "2026-08-12",
  license: "CC BY 4.0 for BKKx curation; underlying OpenStreetMap geometry is ODbL",
  attribution: "BKKx / Non Arkara; OpenStreetMap contributors; linked institutional and scholarly sources per feature",
  caveat: "Cultural corridors and explorer anchors, not cadastral parcels, statutory conservation zones, or a complete building inventory.",
  features,
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(collection, null, 2)}\n`, "utf8");
console.log(`export-rowhouse-data: ${features.length} features -> ${output}`);
