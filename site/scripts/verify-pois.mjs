// Hold the committed POI files to the counts the catalogue claims.
//
// The renderer tests already check that each file parses, is non-empty, and
// sits inside the BKK bbox. Empty-or-not is the wrong test: temples dropping
// from 460 to 1 would still pass. A generated file nobody compares to a pin
// is the same bug as the stale hero plan, in a different directory.
//
// ingest-bkk-pois.py cannot re-run here (raw downloads, Nominatim). The
// committed FeatureCollections can. Pinned counts are the catalogue's
// "what" line made machine-checkable.
//
// walk-pois-index.json is the same pattern: it summarises walk-pois.json,
// and the two can drift independently.

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, "../public");

const PINNED = {
  "/pois/temples.geojson": 460,
  "/pois/royal-temples.geojson": 94,
  "/pois/national-museums.geojson": 6,
  "/pois/national-libraries.geojson": 3,
  "/pois/national-archives.geojson": 1,
  "/pois/oldtown.geojson": 29,
};

const BKK = { lngMin: 100.2, lngMax: 101.0, latMin: 13.4, latMax: 14.2 };
const problems = [];

for (const [file, pinned] of Object.entries(PINNED)) {
  const data = JSON.parse(readFileSync(resolve(pub, file.slice(1)), "utf8"));
  const n = data.features?.length ?? 0;
  if (n !== pinned) {
    problems.push(`  ${file}: catalogue ${pinned}, file ${n}`);
  }
  for (const f of data.features || []) {
    const [lng, lat] = f.geometry?.coordinates || [];
    if (lng < BKK.lngMin || lng > BKK.lngMax || lat < BKK.latMin || lat > BKK.latMax) {
      problems.push(`  ${file} ${f.properties?.id}: out of BKK bbox (${lng}, ${lat})`);
    }
  }
}

const pois = JSON.parse(readFileSync(resolve(pub, "heritage/walk-pois.json"), "utf8"));
const index = JSON.parse(readFileSync(resolve(pub, "heritage/walk-pois-index.json"), "utf8"));
for (const [key, entry] of Object.entries(index)) {
  const actual = pois[key]?.pois?.length ?? null;
  if (actual !== entry.count) {
    problems.push(`  walk-pois ${key}: index count ${entry.count}, file ${actual}`);
  }
}
for (const key of Object.keys(pois)) {
  if (!(key in index)) {
    problems.push(`  walk-pois.json has ${key}, which the index omits`);
  }
}

if (problems.length) {
  console.error(
    `verify-pois: ${problems.length} disagreement(s):\n\n` +
      problems.join("\n") +
      `\n\nIf the ingest genuinely changed, update the pin in this file and the\n` +
      `catalogue line in app/data/datasets.ts together. A corrected total on a\n` +
      `stale pin is how the last drift shipped.\n`,
  );
  process.exit(1);
}

console.log(
  `verify-pois: ${Object.keys(PINNED).length} layers · ` +
    Object.values(PINNED).reduce((a, b) => a + b, 0) +
    ` pins · walk-pois ${Object.keys(index).length} stops`,
);
