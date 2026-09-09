// Hold the shophouse pressure figures to the geojson they claim to come from.
//
// WHY THIS EXISTS. app/data/shophouse-pressure.ts opens with "every number in
// this file is produced by scripts/build-shophouse-pressure.py". That was true
// when it was written and had quietly stopped being true: the candidate screen
// was regenerated from 2,311 footprints to 2,433, the geojson on disk grew with
// it, and the hand-committed summary did not. Every quadrant count, every
// district row and both axis splits drifted, and nothing failed — the numbers
// were internally consistent with each other and wrong about the data.
//
// The generator cannot re-run here: it reads Treasury appraisal polygons from a
// sibling repository (../bkk-3d-atlas) that is not part of this checkout. But
// its OUTPUT is committed, and the output carries everything the summary
// asserts — district, quadrant, depth, frontage and land value per footprint.
// So this verifies rather than regenerates: it recomputes each published figure
// from shophouse-pressure.geojson and fails the build on any disagreement.
//
// That split is deliberate. The editorial half of those files — what each
// quadrant means, why it matters, the Thai district names — is written by a
// person and must survive. The numeric half must not be allowed to drift from
// the data again. Keeping the numbers in the source file keeps them reviewable
// in a diff; this script keeps them honest.
//
// Runs as part of `npm run build` (data:pressure).

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PRESSURE_DISTRICTS,
  PRESSURE_TOTAL,
  QUADRANTS,
  SPLITS,
} from "../app/data/shophouse-pressure.ts";
import { SIGNATURE } from "../app/data/shophouse-gazetteer.ts";

const here = dirname(fileURLToPath(import.meta.url));
const PRESSURE = resolve(here, "../public/data/shophouse-pressure.geojson");

// Note on what is NOT checked here: landFloorBahtM2 / landPeakBahtM2 are the
// Treasury appraisal bands, which live in the sibling repo's district polygons
// and are converted from ตารางวา (1 wah² = 4 m²) on the way in. The pressure
// geojson carries only the derived per-footprint value, so those two columns
// cannot be re-derived from this checkout and are left to the generator.
const rows = JSON.parse(readFileSync(PRESSURE, "utf8")).features.map((f) => f.properties);

/** statistics.median — the linear-interpolating median the generator uses. */
function median(values) {
  const a = [...values].sort((x, y) => x - y);
  const mid = a.length >> 1;
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

/** Nearest-rank percentile, matching the generator's index arithmetic. */
function percentile(values, p) {
  const a = [...values].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor(p * a.length))];
}

const round1 = (n) => Math.round(n * 10) / 10;

const problems = [];
function expect(label, actual, published) {
  if (actual !== published) {
    problems.push(`  ${label}\n      published ${published}\n      actual    ${actual}`);
  }
}

/* ---- the corpus ---- */
expect("PRESSURE_TOTAL", rows.length, PRESSURE_TOTAL);

/* ---- the two axis splits ---- */
expect("SPLITS.priceBaht", Math.round(median(rows.map((r) => r.v))), SPLITS.priceBaht);
expect("SPLITS.depthM", round1(median(rows.map((r) => r.d))), SPLITS.depthM);

/* ---- the quadrants ---- */
for (const q of QUADRANTS) {
  expect(`QUADRANTS[${q.id}].count`, rows.filter((r) => r.q === q.id).length, q.count);
}
const unclaimed = [...new Set(rows.map((r) => r.q))].filter(
  (q) => !QUADRANTS.some((published) => published.id === q),
);
if (unclaimed.length) {
  problems.push(`  quadrant values in the data that QUADRANTS does not list: ${unclaimed.join(", ")}`);
}

/* ---- the district table ---- */
const byDistrict = new Map();
for (const r of rows) {
  if (!byDistrict.has(r.dist)) byDistrict.set(r.dist, []);
  byDistrict.get(r.dist).push(r);
}
for (const d of PRESSURE_DISTRICTS) {
  const group = byDistrict.get(d.district);
  if (!group) {
    problems.push(`  PRESSURE_DISTRICTS lists ${d.district}, which the geojson does not contain`);
    continue;
  }
  expect(`${d.district}.count`, group.length, d.count);
  expect(`${d.district}.medianDepthM`, round1(median(group.map((r) => r.d))), d.medianDepthM);
  expect(`${d.district}.medianFrontageM`, round1(median(group.map((r) => r.f))), d.medianFrontageM);
  expect(
    `${d.district}.medianLandUnderFootprint`,
    Math.round(median(group.map((r) => r.v))),
    d.medianLandUnderFootprint,
  );
  expect(
    `${d.district}.tellTheOwner`,
    group.filter((r) => r.q === "tell-the-owner").length,
    d.tellTheOwner,
  );
  expect(`${d.district}.atRisk`, group.filter((r) => r.q === "at-risk").length, d.atRisk);
}
for (const name of byDistrict.keys()) {
  if (!PRESSURE_DISTRICTS.some((d) => d.district === name)) {
    problems.push(`  the geojson contains district ${name}, which PRESSURE_DISTRICTS omits`);
  }
}

/* ---- the dimensional signature ----
   SIGNATURE claims to be measured across the same screened footprints. It has
   never had a generator, which is how it drifted furthest. */
expect("SIGNATURE.n", rows.length, SIGNATURE.n);
for (const [axis, key] of [
  ["frontage", "f"],
  ["depth", "d"],
]) {
  const values = rows.map((r) => r[key]);
  for (const p of [10, 50, 90]) {
    expect(
      `SIGNATURE.${axis}.p${p}`,
      round1(percentile(values, p / 100)),
      SIGNATURE[axis][`p${p}`],
    );
  }
}

if (problems.length) {
  console.error(
    `verify-shophouse-pressure: ${problems.length} published figure(s) disagree with\n` +
      `public/data/shophouse-pressure.geojson (${rows.length} footprints):\n\n` +
      problems.join("\n") +
      `\n\nThese files state that every number in them is computed from that\n` +
      `screen. Re-derive them rather than editing the prose around them — a\n` +
      `corrected total sitting on stale component counts is worse than the\n` +
      `visible disagreement, because nothing is left to notice it.\n`,
  );
  process.exit(1);
}

console.log(
  `verify-shophouse-pressure: ${rows.length} footprints · ` +
    QUADRANTS.map((q) => `${q.id} ${q.count}`).join(" · ") +
    ` · ${PRESSURE_DISTRICTS.length} districts · signature p50 ${SIGNATURE.frontage.p50}×${SIGNATURE.depth.p50} m`,
);
