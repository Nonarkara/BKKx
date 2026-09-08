// Count the atlas's own evidence, so the Evidence-mode legend can state a
// figure instead of asserting one.
//
// Reads the four extruded layers, tallies every `height_source` on the Old
// Town detail footprints, every `height_confidence` on the hero monument
// parts and every `height_basis` on the extruded shophouse candidates, folds
// them into the tiers defined in app/data/evidence-tiers.ts, and writes
// app/data/evidence-tally.json.
//
// It enforces the contract in the direction that matters: a source value no
// tier claims FAILS the build. Without that, adding a new height rule to a
// generator would silently drop every building carrying it into "inferred",
// and the atlas would quietly understate its own evidence. A build that
// stops is better than a map that lies.
//
// A box flagged `hide_3d` by hide-under-heroes.py stands under a hero model
// and is not drawn, so it is not counted; the number of them is written
// alongside so the legend can say so rather than quietly shrinking.
//
// Runs as part of `npm run build` (data:evidence), after data:hide.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  EVIDENCE_TIERS,
  LANDMARK_TIER,
  tierForCandidateBasis,
  tierForDetailSource,
  tierForHeroConfidence,
} from "../app/data/evidence-tiers.ts";

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, "../public");
const out = resolve(here, "../app/data/evidence-tally.json");

const DETAIL = "/data/bkk-heritage-detail.geojson";
const HERO = "/data/bkk-hero-monuments.geojson";
const LANDMARKS = "/data/bkk-landmarks.geojson";
const CANDIDATES = "/data/bangkok-rowhouse-footprint-candidates.geojson";

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

const drawn = (f) => f.properties?.hide_3d !== true;
const detailAll = features(DETAIL);
const landmarksAll = features(LANDMARKS);
const detailDrawn = detailAll.filter(drawn);
const landmarksDrawn = landmarksAll.filter(drawn);
const hidden = {
  detail: detailAll.length - detailDrawn.length,
  landmarks: landmarksAll.length - landmarksDrawn.length,
};

// A candidate standing on a drawn OSM footprint is outlined, not extruded
// (has_detail_box, set by flag-candidates-over-detail.py), so only the rest
// are counted — and by height_basis, which the ladder grades.
const candidatesAll = features(CANDIDATES);
const candidatesExtruded = candidatesAll.filter((f) => f.properties?.has_detail_box !== true);
const candidates = {
  extruded: candidatesExtruded.length,
  onDetailBox: candidatesAll.length - candidatesExtruded.length,
};

const detailSources = tally(detailDrawn, "height_source");
const heroConfidences = tally(features(HERO), "height_confidence");
const candidateBases = tally(candidatesExtruded, "height_basis");
const landmarks = landmarksDrawn.length;

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
for (const value of Object.keys(candidateBases)) {
  if (!tierForCandidateBasis(value)) unclaimed.push(`height_basis=${JSON.stringify(value)}`);
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
for (const [value, n] of Object.entries(candidateBases)) byTier[tierForCandidateBasis(value)] += n;
byTier[LANDMARK_TIER] += landmarks;

const total = Object.values(byTier).reduce((a, b) => a + b, 0);

writeFileSync(
  out,
  JSON.stringify(
    {
      generatedFrom: [DETAIL, HERO, LANDMARKS, CANDIDATES],
      byTier,
      detailSources,
      heroConfidences,
      landmarks,
      hidden,
      candidateBases,
      candidates,
      total,
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `build-evidence-tally: ${total} extruded features · ` +
    EVIDENCE_TIERS.map((t) => `${t.tier} ${byTier[t.tier]}`).join(" · ") +
    ` · ${hidden.detail + hidden.landmarks} hidden under hero models` +
    ` · ${candidates.extruded} candidates extruded, ${candidates.onDetailBox} outlined on an OSM footprint`,
);
