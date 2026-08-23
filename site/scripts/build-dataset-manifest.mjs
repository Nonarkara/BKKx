// Measure every dataset the catalogue at /datasets describes.
//
// The annotations (title, source, license) are hand-written in
// app/data/datasets.ts; this script contributes the machine half —
// bytes, sha256, feature counts, geometry kinds — and enforces the
// completeness contract in both directions: a served data file with no
// annotation fails the build, and so does an annotation whose file is
// gone. Runs as part of `npm run build` (data:manifest).

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DATASETS } from "../app/data/datasets.ts";

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, "../public");
const out = resolve(here, "../app/data/dataset-manifest.json");

// What counts as a dataset this catalogue must cover. Support files that
// pages consume internally (heritage photo manifests, walk POI caches)
// are deliberately out of scope — they are page furniture, not datasets.
function servedDataFiles() {
  const files = [];
  for (const name of readdirSync(join(pub, "data"))) {
    if (name.endsWith(".geojson")) files.push(`/data/${name}`);
  }
  for (const name of readdirSync(join(pub, "data/sources"))) {
    if (name.endsWith(".json")) files.push(`/data/sources/${name}`);
  }
  for (const name of readdirSync(join(pub, "pois"))) {
    if (name.endsWith(".geojson")) files.push(`/pois/${name}`);
  }
  files.push("/heritage-register.json");
  return files.sort();
}

function measure(file) {
  const buf = readFileSync(join(pub, file));
  const sha256 = createHash("sha256").update(buf).digest("hex");
  let features = null;
  let kinds = [];
  try {
    const parsed = JSON.parse(buf.toString("utf8"));
    if (parsed?.type === "FeatureCollection" && Array.isArray(parsed.features)) {
      features = parsed.features.length;
      kinds = [...new Set(parsed.features.map((f) => f?.geometry?.type).filter(Boolean))].sort();
    } else if (Array.isArray(parsed?.sites)) {
      features = parsed.sites.length; // heritage-register.json
    } else if (Array.isArray(parsed?.elements)) {
      features = parsed.elements.length; // OSM way snapshot
    }
  } catch {
    // not JSON — bytes and checksum still stand
  }
  return { bytes: buf.length, sha256, features, kinds };
}

const annotated = new Set(DATASETS.map((d) => d.file));
const served = servedDataFiles();

const unannotated = served.filter((f) => !annotated.has(f));
const missing = [...annotated].filter((f) => !served.includes(f));
if (unannotated.length || missing.length) {
  if (unannotated.length) {
    console.error(`build-dataset-manifest: served but not in the catalogue (add to app/data/datasets.ts):`);
    for (const f of unannotated) console.error(`  ${f}`);
  }
  if (missing.length) {
    console.error(`build-dataset-manifest: in the catalogue but not on disk:`);
    for (const f of missing) console.error(`  ${f}`);
  }
  process.exit(1);
}

const manifest = Object.fromEntries(served.map((f) => [f, measure(f)]));
writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
console.log(`build-dataset-manifest: ${served.length} datasets measured -> ${out}`);
