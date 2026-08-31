// Count the atlas's own evidence, so the Evidence-mode legend can state a
// figure instead of asserting one.
//
// Reads the three extruded layers, tallies every `height_source` on the Old
// Town detail footprints and every `height_confidence` on the hero monument
// parts, folds them into the tiers defined in app/data/evidence-tiers.ts,
// and writes app/data/evidence-tally.json.
//
// It enforces the contract in the direction that matters: a source value no
// tier claims FAILS the build. Without that, adding a new height rule to a
// generator would silently drop every building carrying it into "inferred",
// and the atlas would quietly understate its own evidence. A build that
// stops is better than a map that lies.
//
// Runs as part of `npm run build` (data:evidence).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EVIDENCE_TIERS,
  LANDMARK_TIER,
  tierForDetailSource,
  tierForHeroConfidence,
} from "../app/data/evidence-tiers.ts";

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, "../public");
const out = resolve(here, "../app/data/evidence-tally.json");

const DETAIL = "/data/bkk-heritage-detail.geojson";
const HERO = "/data/bkk-hero-monuments.geojson";
const LANDMARKS = "/data/bkk-landmarks.geojson";

function features(file) {
  const parsed = JSON.parse(readFileSync(resolve(pub, `.${file}`), "utf8"));
  if (!Array.isArray(parsed.features)) {
    throw new Error(`build-evidence-tally: ${file} has no feature array`);
  }
  return parsed.features;
}

function tally(list, key) {
  const counts = {};
  for (const f of list) {
    // A feature with no value at all is still a feature the map draws, and
    // "" is what the MapLibre expression matches on, so count it under the
    // same empty key rather than dropping it.
    const raw = f.properties?.[key] ?? "";
    counts[raw] = (counts[raw] ?? 0) + 1;
  }
  return counts;
}

const detailSources = tally(features(DETAIL), "height_source");
const heroConfidences = tally(features(HERO), "height_confidence");
const landmarks = features(LANDMARKS).length;

// The guard. Every value the data actually contains must be claimed by a
// tier; the empty string is allowed only where the layer legitimately has no
// such field (the hero layer always sets height_confidence, so an empty one
// there is a generator bug worth stopping for).
const unclaimed = [];
for (const value of Object.keys(detailSources)) {
  if (!tierForDetailSource(value)) unclaimed.push(`height_source=${JSON.stringify(value)}`);
}
for (const value of Object.keys(heroConfidences)) {
  if (!tierForHeroConfidence(value)) unclaimed.push(`height_confidence=${JSON.stringify(value)}`);
}
if (unclaimed.length) {
  console.error(
    `build-evidence-tally: ${unclaimed.length} value(s) no evidence tier claims:\n` +
      unclaimed.map((u) => `  ${u}`).join("\n") +
      `\n\nEvery height source has to sit on the ladder, or Evidence mode will\n` +
      `colour those buildings as guesses without saying so. Add the value to\n` +
      `the right tier in app/data/evidence-tiers.ts.`,
  );
  process.exit(1);
}

const byTier = Object.fromEntries(EVIDENCE_TIERS.map((t) => [t.tier, 0]));
for (const [value, n] of Object.entries(detailSources)) byTier[tierForDetailSource(value)] += n;
for (const [value, n] of Object.entries(heroConfidences)) byTier[tierForHeroConfidence(value)] += n;
byTier[LANDMARK_TIER] += landmarks;

const total = Object.values(byTier).reduce((a, b) => a + b, 0);

writeFileSync(
  out,
  JSON.stringify(
    {
      generatedFrom: [DETAIL, HERO, LANDMARKS],
      byTier,
      detailSources,
      heroConfidences,
      landmarks,
      total,
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `build-evidence-tally: ${total} extruded features · ` +
    EVIDENCE_TIERS.map((t) => `${t.tier} ${byTier[t.tier]}`).join(" · "),
);
