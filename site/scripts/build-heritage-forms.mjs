// Classify the Old Town's important buildings into Thai architectural forms.
//
//   node --experimental-strip-types scripts/build-heritage-forms.mjs
//
// Reads the heritage-detail footprints and the hero monuments, writes
// public/data/bkk-heritage-forms.json: one spec per building that gets a
// form (kind, footprint, base, height, tiers, finish, confidence) and the
// detail / hero ids it replaces on the map. Geometry is built in the
// browser from these specs (app/atlas/[district]/heritage-forms.ts).
// Deterministic: same inputs, same bytes — CI checks the committed file.
import { readFileSync, writeFileSync } from "node:fs";
import { classify, heroForms } from "../app/atlas/[district]/heritage-forms.ts";

const read = (p) => JSON.parse(readFileSync(new URL(`../public/data/${p}`, import.meta.url), "utf8"));
const heroes = read("bkk-hero-monuments.geojson").features;
// The curated landmark layer re-draws some register buildings under the same
// id with a reviewed height. Where it does, that height is the better one.
const landmarks = new Map(read("bkk-landmarks.geojson").features.map((f) => [String(f.properties.id), f.properties]));
const detail = read("bkk-heritage-detail.geojson").features.map((f) => {
  const l = landmarks.get(String(f.properties.id));
  if (!l || !(Number(l.height) > 0)) return f;
  return { ...f, properties: { ...f.properties, render_height: Number(l.height), render_min_height: Number(l.base_height ?? 0), height_source: f.properties.height_source } };
});

const detailByOsm = new Map(detail.map((f) => [String(f.properties.id).replace(/^bkk-building-/, ""), f]));
const forms = heroForms(heroes, detailByOsm);
const taken = new Set(forms.flatMap((f) => f.replaces.detail));

for (const f of detail) {
  const id = String(f.properties.id);
  if (taken.has(id) || f.properties.hide_3d === true) continue;
  const spec = classify(f);
  if (spec) forms.push({ ...spec, replaces: { detail: [id], hero: [] } });
}
forms.sort((a, b) => a.id.localeCompare(b.id));

const counts = {};
for (const f of forms) counts[f.kind] = (counts[f.kind] ?? 0) + 1;
const round = (r) => r.map(([x, y]) => [Math.round(x * 1e7) / 1e7, Math.round(y * 1e7) / 1e7]);
writeFileSync(new URL("../public/data/bkk-heritage-forms.json", import.meta.url), JSON.stringify({
  version: 1,
  note: "Interpretive Thai forms on OpenStreetMap footprints. Plan and placement are the footprint; overall height is the atlas value (survey envelope for hero monuments, register tags or type default); tiers, profiles and proportions are typological, not measured.",
  attribution: "© OpenStreetMap contributors (ODbL-1.0) · Fine Arts Department envelopes via BKKx hero monuments · BKKx typology",
  counts,
  forms: forms.map((f) => ({ ...f, ring: round(f.ring) })),
}) + "\n");
console.log(`heritage forms: ${forms.length}`, counts);
