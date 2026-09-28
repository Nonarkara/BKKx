// Flooded roads — read from atlas.nonarkara.org/api/flood/roads, where the
// engine lives (bkk-3d-atlas src/floodroads.ts). Residents' Traffy Fondue
// reports, iTIC road reports and BMA DDS flooded roads placed on the
// OpenStreetMap road they describe; gauges and news add to the heat only.
// Method stolen from FloodDash (flood.nonarkara.org): streetReports.js depth
// words, streetFlood.js evidence order.
//
// A lit stretch means "a report within ~100 m on this road", not a surveyed
// flood extent, a depth model or a route. This file is the shape check: a
// wrong shape throws, it is never trimmed into something that looks fine.

export type RoadProps = {
  road: string | null; n: number; traffy: number; itic: number; dds: number;
  depth: number; depthEn: string | null; depthTh: string | null;
  closed: boolean; latest: string; score: number; placed: 'report' | 'road-name';
};
export type FloodRoads = {
  fetchedAt: string;
  stretches: number;
  closed: number;
  sources: Record<string, { ok: boolean; count: number; error: string | null }>;
  roads: { type: 'FeatureCollection'; features: { type: 'Feature'; geometry: { type: 'LineString'; coordinates: [number, number][] }; properties: RoadProps }[] };
  heat: { type: 'FeatureCollection'; features: { type: 'Feature'; geometry: { type: 'Point'; coordinates: [number, number] }; properties: { w: number; n: number } }[] };
};

const num = (v: unknown, lo = -Infinity, hi = Infinity): number | null =>
  typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : null;
const inBkk = (c: unknown): c is [number, number] =>
  Array.isArray(c) && num(c[0], 100.2, 101) !== null && num(c[1], 13.4, 14.2) !== null;
const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 120) : null);

export function normalizeRoads(raw: unknown): FloodRoads {
  if (!raw || typeof raw !== 'object') throw Error('Flood roads: not an object');
  const r = raw as Record<string, unknown>;
  if (r.tool !== 'flood-roads') throw Error('Flood roads: unexpected payload');
  const fetchedAt = typeof r.fetchedAt === 'string' && Number.isFinite(Date.parse(r.fetchedAt)) ? r.fetchedAt : null;
  if (!fetchedAt) throw Error('Flood roads: no reading time');
  const rc = r.roads as { features?: unknown[] } | undefined;
  const hc = r.heat as { features?: unknown[] } | undefined;
  if (!Array.isArray(rc?.features) || !Array.isArray(hc?.features)) throw Error('Flood roads: missing collections');

  const roads: FloodRoads['roads']['features'] = [];
  for (const f of rc.features) {
    const g = (f as { geometry?: { type?: string; coordinates?: unknown[] } })?.geometry;
    const p = ((f as { properties?: Record<string, unknown> })?.properties ?? {}) as Record<string, unknown>;
    if (g?.type !== 'LineString' || !Array.isArray(g.coordinates) || g.coordinates.length < 2 || !g.coordinates.every(inBkk)) continue;
    const latest = typeof p.latest === 'string' && Number.isFinite(Date.parse(p.latest)) ? p.latest : null;
    const score = num(p.score, 0, 1);
    if (!latest || score === null) continue;
    roads.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: g.coordinates as [number, number][] },
      properties: {
        road: text(p.road),
        n: num(p.n, 0) ?? 0, traffy: num(p.traffy, 0) ?? 0, itic: num(p.itic, 0) ?? 0, dds: num(p.dds, 0) ?? 0,
        depth: num(p.depth, 0, 7) ?? 0, depthEn: text(p.depthEn), depthTh: text(p.depthTh),
        closed: p.closed === true, latest, score,
        placed: p.placed === 'road-name' ? 'road-name' : 'report',
      },
    });
  }
  const heat: FloodRoads['heat']['features'] = [];
  for (const f of hc.features) {
    const g = (f as { geometry?: { type?: string; coordinates?: unknown } })?.geometry;
    const p = ((f as { properties?: Record<string, unknown> })?.properties ?? {}) as Record<string, unknown>;
    const w = num(p.w, 0, 1000);
    if (g?.type !== 'Point' || !inBkk(g.coordinates) || w === null) continue;
    heat.push({ type: 'Feature', geometry: { type: 'Point', coordinates: g.coordinates }, properties: { w, n: num(p.n, 0) ?? 0 } });
  }
  const sources: FloodRoads['sources'] = {};
  for (const [k, v] of Object.entries((r.sources as Record<string, Record<string, unknown>>) ?? {})) {
    sources[k] = { ok: v?.ok === true, count: num(v?.count, 0) ?? 0, error: text(v?.error) };
  }
  return {
    fetchedAt, stretches: roads.length, closed: roads.filter((f) => f.properties.closed).length, sources,
    roads: { type: 'FeatureCollection', features: roads },
    heat: { type: 'FeatureCollection', features: heat },
  };
}

/** Fresh = relayed within 20 minutes. Unknown age is never fresh. */
export function roadsAreFresh(fetchedAt: string | null, now: number) {
  const age = fetchedAt ? now - Date.parse(fetchedAt) : NaN;
  return Number.isFinite(age) && age >= -300000 && age <= 20 * 60000;
}
