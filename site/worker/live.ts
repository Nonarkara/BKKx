/**
 * Live civic feeds, proxied server-side.
 *
 * Two reasons this cannot be a browser fetch. The BMA drainage feed is plain
 * HTTP, and an HTTPS page may not fetch it (mixed content); and it sends no
 * CORS headers, so even over HTTPS the browser would refuse the response. The
 * Worker has neither restriction, so it fetches upstream and re-serves the
 * result same-origin, cached at the edge.
 *
 * The contract with the war room is that this endpoint NEVER invents a
 * reading. Every response carries `ok`, and on failure it carries `reason` —
 * the panel renders the reason rather than a zero, because a zero millimetre
 * reading and an unreachable gauge network are opposite facts.
 */

const RAIN_UPSTREAM = "http://weather.bangkok.go.th/dds_webservices/api/rain/lastdata";
const UPSTREAM_TIMEOUT_MS = 6_000;
const TTL_SECONDS = 300;

export type LiveEnvelope<T> = {
  ok: boolean;
  /** ISO timestamp of this Worker's fetch, not of the upstream reading. */
  fetchedAt: string;
  source: string;
  /** Present when ok. */
  data?: T;
  /** Present when !ok — shown to the operator verbatim. */
  reason?: string;
};

function envelope<T>(body: LiveEnvelope<T>, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": body.ok
        ? `public, max-age=${TTL_SECONDS}, s-maxage=${TTL_SECONDS}, stale-while-revalidate=600`
        : "no-store",
      "x-bkkx-live": body.ok ? "hit" : "degraded",
    },
  });
}

/**
 * Normalise whatever the gauge feed returns into a station list.
 *
 * The upstream shape is not documented and could not be observed from the
 * authoring environment, so this reads defensively: it accepts a bare array or
 * a wrapped one, and pulls the first plausible key for each field rather than
 * demanding an exact schema. Anything it cannot read becomes null, and a
 * station with no usable reading is dropped rather than defaulted to zero.
 */
function normaliseRain(raw: unknown): { stations: RainStation[]; parsed: number; skipped: number } {
  const rows: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown[] })?.data)
      ? ((raw as { data: unknown[] }).data)
      : Array.isArray((raw as { result?: unknown[] })?.result)
        ? ((raw as { result: unknown[] }).result)
        : [];

  const pickNum = (o: Record<string, unknown>, keys: string[]): number | null => {
    for (const k of Object.keys(o)) {
      if (keys.some((c) => k.toLowerCase().includes(c))) {
        const n = Number(o[k]);
        if (Number.isFinite(n)) return n;
      }
    }
    return null;
  };
  const pickStr = (o: Record<string, unknown>, keys: string[]): string | null => {
    for (const k of Object.keys(o)) {
      if (keys.some((c) => k.toLowerCase().includes(c))) {
        const v = o[k];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
    }
    return null;
  };

  const stations: RainStation[] = [];
  let skipped = 0;
  for (const row of rows) {
    if (!row || typeof row !== "object") { skipped += 1; continue; }
    const o = row as Record<string, unknown>;
    const mm = pickNum(o, ["rain", "amount", "value", "mm"]);
    if (mm === null) { skipped += 1; continue; }
    stations.push({
      id: pickStr(o, ["id", "code", "station"]) ?? `station-${stations.length + 1}`,
      name: pickStr(o, ["name", "stationname", "location", "ชื่อ"]),
      district: pickStr(o, ["district", "area", "เขต"]),
      mm,
      observedAt: pickStr(o, ["time", "date", "updated", "timestamp"]),
      lat: pickNum(o, ["lat"]),
      lon: pickNum(o, ["lon", "lng", "long"]),
    });
  }
  return { stations, parsed: stations.length, skipped };
}

export type RainStation = {
  id: string;
  name: string | null;
  district: string | null;
  /** Millimetres, as reported. */
  mm: number;
  observedAt: string | null;
  lat: number | null;
  lon: number | null;
};

export type RainPayload = {
  stations: RainStation[];
  stationCount: number;
  /** Stations reporting any rain at all. */
  wet: number;
  maxMm: number;
  /** Rows the upstream sent that carried no readable reading. */
  unreadable: number;
  agency: string;
};

export async function handleLiveRain(): Promise<Response> {
  const fetchedAt = new Date().toISOString();
  const base = { fetchedAt, source: RAIN_UPSTREAM };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(RAIN_UPSTREAM, {
      signal: ctrl.signal,
      headers: { accept: "application/json", "user-agent": "BKKx/1.0 (+https://bkk.nonarkara.org)" },
    });
    if (!res.ok) {
      return envelope({ ...base, ok: false, reason: `Gauge network returned HTTP ${res.status}.` });
    }
    const raw = await res.json().catch(() => null);
    if (raw === null) {
      return envelope({ ...base, ok: false, reason: "Gauge network returned a body that is not JSON." });
    }
    const { stations, skipped } = normaliseRain(raw);
    if (stations.length === 0) {
      return envelope({
        ...base,
        ok: false,
        reason: `Gauge network responded, but no station carried a readable rainfall value (${skipped} row(s) unreadable). The upstream shape has probably changed — normaliseRain() in worker/live.ts needs updating.`,
      });
    }
    return envelope<RainPayload>({
      ...base,
      ok: true,
      data: {
        stations,
        stationCount: stations.length,
        wet: stations.filter((s) => s.mm > 0).length,
        maxMm: stations.reduce((m, s) => Math.max(m, s.mm), 0),
        unreadable: skipped,
        agency: "สำนักการระบายน้ำ กทม. · BMA Department of Drainage and Sewerage",
      },
    });
  } catch (err) {
    const reason =
      (err as Error)?.name === "AbortError"
        ? `Gauge network did not respond within ${UPSTREAM_TIMEOUT_MS / 1000}s.`
        : `Gauge network unreachable: ${(err as Error)?.message ?? "unknown error"}.`;
    return envelope({ ...base, ok: false, reason });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The CCTV registry.
 *
 * Deliberately empty of hard-coded cameras. The war room's camera rail is
 * built and wired, but no camera endpoint is invented here: a fabricated
 * stream URL would be worse than an empty rail, because it would render a
 * broken tile that looks like a working system. Point CCTV_SOURCE_URL at a
 * real registry (a JSON array of cameras, or a CSV) and the rail fills.
 *
 * Expected item shape — extra keys are passed through untouched:
 *   { id, name, district?, lat?, lon?, snapshotUrl?, pageUrl?, attribution? }
 */
export type Camera = {
  id: string;
  name: string;
  district: string | null;
  lat: number | null;
  lon: number | null;
  /** A still image refreshed by the client, if the source offers one. */
  snapshotUrl: string | null;
  /** Where a human can watch it properly. */
  pageUrl: string | null;
  attribution: string | null;
};

export type CctvPayload = { cameras: Camera[]; cameraCount: number; configured: boolean };

export async function handleLiveCctv(sourceUrl: string | undefined): Promise<Response> {
  const fetchedAt = new Date().toISOString();
  if (!sourceUrl) {
    return envelope<CctvPayload>({
      ok: true,
      fetchedAt,
      source: "unconfigured",
      data: { cameras: [], cameraCount: 0, configured: false },
    });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(sourceUrl, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) {
      return envelope({ ok: false, fetchedAt, source: sourceUrl, reason: `Camera registry returned HTTP ${res.status}.` });
    }
    const raw = await res.json().catch(() => null);
    const rows: unknown[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { cameras?: unknown[] })?.cameras)
        ? (raw as { cameras: unknown[] }).cameras
        : [];
    const cameras: Camera[] = rows.flatMap((row, i) => {
      if (!row || typeof row !== "object") return [];
      const o = row as Record<string, unknown>;
      const str = (k: string[]): string | null => {
        for (const key of Object.keys(o)) {
          if (k.some((c) => key.toLowerCase().includes(c))) {
            const v = o[key];
            if (typeof v === "string" && v.trim()) return v.trim();
          }
        }
        return null;
      };
      const num = (k: string[]): number | null => {
        for (const key of Object.keys(o)) {
          if (k.some((c) => key.toLowerCase().includes(c))) {
            const n = Number(o[key]);
            if (Number.isFinite(n)) return n;
          }
        }
        return null;
      };
      const name = str(["name", "title", "location", "ชื่อ"]);
      if (!name) return [];
      return [{
        id: str(["id", "code"]) ?? `cam-${i + 1}`,
        name,
        district: str(["district", "area", "เขต"]),
        lat: num(["lat"]),
        lon: num(["lon", "lng", "long"]),
        snapshotUrl: str(["snapshot", "image", "thumb", "jpg"]),
        pageUrl: str(["page", "url", "link", "stream"]),
        attribution: str(["attribution", "owner", "agency"]),
      }];
    });
    return envelope<CctvPayload>({
      ok: true,
      fetchedAt,
      source: sourceUrl,
      data: { cameras, cameraCount: cameras.length, configured: true },
    });
  } catch (err) {
    return envelope({
      ok: false,
      fetchedAt,
      source: sourceUrl,
      reason: `Camera registry unreachable: ${(err as Error)?.message ?? "unknown error"}.`,
    });
  } finally {
    clearTimeout(timer);
  }
}
