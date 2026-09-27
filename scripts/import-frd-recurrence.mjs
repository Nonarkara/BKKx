// BMA annual road-flood records → road recurrence snapshot.
//
// The DDS morning bulletin says what flooded this week; these yearly tables
// say which roads flood every year. Source: สำนักการระบายน้ำ กทม. on
// data.bangkok.go.th (CKAN datastore, keyless), licence "Creative Commons
// Attributions" as the portal states it — read, not assumed.
//
// Run explicitly; the flood page reads the last validated snapshot so an
// agency outage or a schema change cannot erase published information:
//   node scripts/import-frd-recurrence.mjs            # refresh the snapshot
// Re-run when a new yearly file drops (2026), not on a timer.
import { writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../site/public/data/flood-road-recurrence.json');
const CKAN = 'https://data.bangkok.go.th/api/3/action/datastore_search';
export const RESOURCES = [
  ['2021', '6e8385aa-0aec-4869-a462-a4e8dac55a94'],
  ['2022', 'd37b1d75-9b11-4db9-8f1e-5d4ce49bc9bf'],
  ['2023', '7507873c-8d8c-47e8-83cb-d3adbd5c28ac'],
  ['2024', 'ebcc95bb-1567-4da4-9eec-8d715eb2ccd0'],
  ['2025', '9d924c20-8f56-46ae-9bd3-4c2a1c0d83ef'],
];
const norm = (v) => (typeof v === 'string' ? v.replace(/^เขต/, '').trim() : '');
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

async function fetchAll(resource) {
  const rows = [];
  let offset = 0;
  for (;;) {
    const r = await fetch(`${CKAN}?resource_id=${resource}&limit=500&offset=${offset}`, {
      signal: AbortSignal.timeout(45000),
      headers: { accept: 'application/json', 'user-agent': 'BKKx/1.0 (+https://bkk.nonarkara.org)' },
    });
    if (!r.ok) throw new Error(`CKAN HTTP ${r.status} for ${resource}`);
    const j = await r.json();
    if (j.success !== true || !Array.isArray(j.result?.records)) throw new Error(`CKAN shape changed for ${resource}`);
    rows.push(...j.result.records);
    if (rows.length >= (j.result.total ?? rows.length)) break;
    offset += 500;
  }
  return rows;
}

export function aggregate(years) {
  // years: [{year, rows}]. Keyed by normalised district + road: Thai agency
  // tables vary spacing and the เขต prefix, so normalise before grouping —
  // and keep every raw spelling in `areas` for audit, never silently merged
  // beyond the key.
  const byKey = new Map();
  for (const { year, rows } of years) {
    for (const r of rows) {
      const district = norm(r.district);
      const road = (typeof r.frd_road === 'string' ? r.frd_road : '').trim();
      if (!district || !road) continue;
      const key = `${district}‖${road}`;
      if (!byKey.has(key)) byKey.set(key, { district, road, areas: new Set(), years: new Set(), events: 0, maxHeightCm: null });
      const g = byKey.get(key);
      if (typeof r.frd_area === 'string' && r.frd_area.trim()) g.areas.add(r.frd_area.trim());
      g.years.add(year);
      g.events += 1;
      const h = num(r.frd_flood_height);
      if (h !== null && h >= 0 && (g.maxHeightCm === null || h > g.maxHeightCm)) g.maxHeightCm = h;
    }
  }
  return [...byKey.values()]
    .map((g) => ({ ...g, areas: [...g.areas].sort(), years: [...g.years].sort() }))
    .sort((a, b) => b.years.length - a.years.length || b.events - a.events);
}

async function main() {
  const years = [];
  for (const [year, resource] of RESOURCES) {
    const rows = await fetchAll(resource);
    console.log(`${year}: ${rows.length} rows`);
    years.push({ year, rows });
  }
  const roads = aggregate(years);
  const snapshot = {
    source: 'สำนักการระบายน้ำ กทม. — BMA Drainage & Sewerage, annual road-flood records via data.bangkok.go.th',
    licence: 'Creative Commons Attributions, as stated on the portal dataset page (read 2026-09-27).',
    fetchedAt: new Date().toISOString(),
    resources: RESOURCES.map(([year, id]) => ({ year, resource_id: id })),
    roads,
  };
  const text = JSON.stringify(snapshot, null, 1) + '\n';
  const tmp = OUT + '.tmp';
  await writeFile(tmp, text);
  await rename(tmp, OUT);
  console.log(`roads: ${roads.length} · 5-year roads: ${roads.filter((r) => r.years.length === 5).length} · wrote ${OUT}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
