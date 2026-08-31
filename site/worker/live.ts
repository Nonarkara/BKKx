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

function envelope<T>(body: LiveEnvelope<T>, ttl = TTL_SECONDS, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": body.ok
        ? `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=600`
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
    const upstreamError =
      raw && typeof raw === "object" && typeof (raw as Record<string, unknown>).Error === "string"
        ? String((raw as Record<string, unknown>).Error)
        : null;
    if (upstreamError && /username|password|user|pass|ผู้ใช้|รหัส/i.test(upstreamError)) {
      return envelope({
        ...base,
        ok: false,
        reason:
          "BMA's gauge endpoint now requires credentials. No rainfall reading is shown until the agency provides authorised access.",
      });
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
  /** An HLS (or other) live stream. Opened on demand — never autoplayed
      across the whole rail, which would cost more than the rest of the
      page combined. */
  streamUrl: string | null;
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
        streamUrl: str(["stream", "hls", "m3u8", "video"]),
        pageUrl: str(["page", "url", "link"]),
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

/* ==================================================================== *
 * Weather + air quality — Open-Meteo.
 *
 * Keyless, and it sends `Access-Control-Allow-Origin: *`, so a browser
 * could call it directly. We proxy it anyway for two reasons, in this
 * order: a direct call hands every visitor's IP to a third party, and
 * this project's privacy rule is explicit that it will not collect that
 * itself — routing through the Worker keeps the same promise about who
 * else receives it. Edge caching is the bonus, not the reason.
 * ==================================================================== */

const BANGKOK = { lat: 13.7563, lon: 100.5018 };
// 15 min — the models do not update faster than this.
const WEATHER_TTL = 900;

const FORECAST_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${BANGKOK.lat}&longitude=${BANGKOK.lon}` +
  "&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m" +
  "&hourly=precipitation_probability,precipitation" +
  "&forecast_days=2&timezone=Asia%2FBangkok";

const AIR_URL =
  `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${BANGKOK.lat}&longitude=${BANGKOK.lon}` +
  "&current=pm2_5,pm10,ozone&timezone=Asia%2FBangkok";

export type WeatherPayload = {
  forecastAvailable: boolean;
  airAvailable: boolean;
  /** Plain-language upstream failure notes when only one half is available. */
  partialReason: string | null;
  temperatureC: number | null;
  humidityPct: number | null;
  precipitationMm: number | null;
  windKph: number | null;
  /** Highest hourly probability of precipitation in the next 24 h. */
  rainChanceNext24h: number | null;
  /** Total forecast precipitation over the next 24 h, mm. */
  rainNext24hMm: number | null;
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  observedAt: string | null;
  forecastObservedAt: string | null;
  airObservedAt: string | null;
  attribution: string;
};

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function handleLiveWeather(): Promise<Response> {
  const fetchedAt = new Date().toISOString();
  const base = { fetchedAt, source: "open-meteo.com" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    // Air quality is a separate host; a failure there must not lose the
    // forecast, so it is settled independently.
    const [fRes, aRes] = await Promise.allSettled([
      fetch(FORECAST_URL, { signal: ctrl.signal, headers: { accept: "application/json" } }),
      fetch(AIR_URL, { signal: ctrl.signal, headers: { accept: "application/json" } }),
    ]);

    const f = (fRes.status === "fulfilled" && fRes.value.ok
      ? await fRes.value.json().catch(() => null)
      : null) as {
      current?: Record<string, unknown>;
      hourly?: { precipitation_probability?: unknown[]; precipitation?: unknown[] };
    } | null;

    let air: Record<string, unknown> | null = null;
    if (aRes.status === "fulfilled" && aRes.value.ok) {
      const a = (await aRes.value.json().catch(() => null)) as { current?: Record<string, unknown> } | null;
      air = a?.current ?? null;
    }

    const forecast = f?.current ?? null;
    const settledReason = (name: string, result: PromiseSettledResult<Response>, hasShape: boolean): string | null => {
      if (result.status === "rejected") {
        return `${name} unavailable: ${(result.reason as Error)?.message ?? "unknown error"}.`;
      }
      if (!result.value.ok) return `${name} unavailable: HTTP ${result.value.status}.`;
      return hasShape ? null : `${name} returned an unexpected shape.`;
    };
    const forecastReason = settledReason("Forecast", fRes, Boolean(forecast));
    const airReason = settledReason("Air quality", aRes, Boolean(air));

    if (!forecast && !air) {
      return envelope({
        ...base,
        ok: false,
        reason: [forecastReason, airReason].filter(Boolean).join(" ") || "Weather and air services returned no readings.",
      });
    }

    const probs = (f?.hourly?.precipitation_probability ?? []).slice(0, 24).map(num);
    const rains = (f?.hourly?.precipitation ?? []).slice(0, 24).map(num);
    const forecastObservedAt = typeof forecast?.time === "string" ? forecast.time : null;
    const airObservedAt = typeof air?.time === "string" ? air.time : null;
    const attribution = [
      forecast ? "Open-Meteo forecast · ECMWF / DWD ICON / NOAA GFS" : null,
      air ? "Open-Meteo air quality · CAMS" : null,
    ].filter(Boolean).join(" · ");

    return envelope<WeatherPayload>({
      ...base,
      ok: true,
      data: {
        forecastAvailable: Boolean(forecast),
        airAvailable: Boolean(air),
        partialReason: [forecastReason, airReason].filter(Boolean).join(" ") || null,
        temperatureC: num(forecast?.temperature_2m),
        humidityPct: num(forecast?.relative_humidity_2m),
        precipitationMm: num(forecast?.precipitation),
        windKph: num(forecast?.wind_speed_10m),
        rainChanceNext24h: probs.length ? Math.max(...probs.map((p) => p ?? 0)) : null,
        rainNext24hMm: rains.length
          ? Math.round(rains.reduce<number>((s, r) => s + (r ?? 0), 0) * 10) / 10
          : null,
        pm25: air ? num(air.pm2_5) : null,
        pm10: air ? num(air.pm10) : null,
        ozone: air ? num(air.ozone) : null,
        observedAt: forecastObservedAt ?? airObservedAt,
        forecastObservedAt,
        airObservedAt,
        attribution,
      },
    }, WEATHER_TTL);
  } catch (err) {
    const reason =
      (err as Error)?.name === "AbortError"
        ? `Weather service did not respond within ${UPSTREAM_TIMEOUT_MS / 1000}s.`
        : `Weather service unreachable: ${(err as Error)?.message ?? "unknown error"}.`;
    return envelope({ ...base, ok: false, reason });
  } finally {
    clearTimeout(timer);
  }
}

/* ==================================================================== *
 * Longdo — Thai place search and the iTIC camera network.
 *
 * The key lives in Worker env and never leaves it: it is not imported,
 * not committed, and never echoed in a response or an error message. The
 * browser calls a same-origin route and receives only the result.
 * ==================================================================== */

export type LongdoKind = "search" | "cameras";

export async function handleLiveLongdo(
  kind: LongdoKind,
  key: string | undefined,
  query: URLSearchParams,
): Promise<Response> {
  const fetchedAt = new Date().toISOString();
  if (!key) {
    return envelope({
      ok: false,
      fetchedAt,
      source: "longdo",
      reason:
        "No Longdo API key configured on this deployment. Set LONGDO_API_KEY in the Worker environment — never in the repository.",
    });
  }

  // Build upstream from an allowlist of parameters. Never forward the
  // caller's query wholesale: that is how an open proxy is built by accident.
  let upstream: string;
  if (kind === "search") {
    const q = (query.get("q") ?? "").slice(0, 200);
    if (!q.trim()) {
      return envelope({ ok: false, fetchedAt, source: "longdo", reason: "Missing search term." });
    }
    const p = new URLSearchParams({ keyword: q, limit: "20", key });
    const lat = query.get("lat");
    const lon = query.get("lon");
    if (lat && Number.isFinite(Number(lat))) p.set("lat", lat);
    if (lon && Number.isFinite(Number(lon))) p.set("lon", lon);
    upstream = `https://search.longdo.com/mapsearch/json/search?${p}`;
  } else {
    upstream = `https://api.longdo.com/RouteService/json/camera?key=${encodeURIComponent(key)}`;
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(upstream, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) {
      // Deliberately does not include `upstream` — it carries the key.
      return envelope({ ok: false, fetchedAt, source: "longdo", reason: `Longdo returned HTTP ${res.status}.` });
    }
    const raw = await res.json().catch(() => null);
    if (raw === null) {
      return envelope({ ok: false, fetchedAt, source: "longdo", reason: "Longdo returned a body that is not JSON." });
    }
    return envelope({ ok: true, fetchedAt, source: "longdo", data: raw as Record<string, unknown> });
  } catch (err) {
    return envelope({
      ok: false,
      fetchedAt,
      source: "longdo",
      reason: `Longdo unreachable: ${(err as Error)?.message ?? "unknown error"}.`,
    });
  } finally {
    clearTimeout(timer);
  }
}

/* ==================================================================== *
 * Camera poster proxy.
 *
 * The war room's rail shows a still for each live camera. Loading those
 * stills straight from Google would contact a third party on every page
 * view, before anyone has asked to watch anything — the same objection
 * that sends the weather feed through this Worker. So the poster is
 * fetched here and re-served from our own origin, and Google sees a
 * request only when a viewer actually presses play.
 *
 * Only a YouTube video id is accepted, and it is validated against the
 * id grammar before use: this route must never become a general-purpose
 * image proxy for arbitrary URLs.
 * ==================================================================== */

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const POSTER_TTL = 300; // live thumbnails move; five minutes is plenty

export async function handleCameraPoster(videoId: string | null): Promise<Response> {
  if (!videoId || !YT_ID.test(videoId)) {
    return new Response("Bad video id", { status: 400 });
  }

  // hqdefault exists for every video; maxresdefault often 404s on live.
  const candidates = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault_live.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault_live.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    for (const url of candidates) {
      let res: Response;
      try {
        res = await fetch(url, { signal: ctrl.signal });
      } catch {
        continue;
      }
      if (!res.ok || !res.body) continue;
      const type = res.headers.get("content-type") ?? "image/jpeg";
      if (!type.startsWith("image/")) continue;
      return new Response(res.body, {
        headers: {
          "content-type": type,
          "cache-control": `public, max-age=${POSTER_TTL}, s-maxage=${POSTER_TTL}, stale-while-revalidate=1800`,
          "x-bkkx-live": "poster",
        },
      });
    }
    // No poster is not an error worth breaking the rail over — the tile
    // falls back to its label.
    return new Response("No poster available", { status: 404 });
  } finally {
    clearTimeout(timer);
  }
}

/* ==================================================================== *
 * NASA FIRMS — active fire detection.
 *
 * Adapted from the pattern in bilawalsidhu/gods-eye-view: proxy the FIRMS
 * area API server-side (the MAP_KEY must never reach the browser), cache
 * long enough to respect the shared 5,000-transactions-per-10-minutes
 * quota that key carries, and merge the reading against a real question —
 * here, distance to the heritage register's precisely-located monuments,
 * because Bangkok's oldest protected stock is wood-frame construction in
 * narrow lanes and a fire feed with no register nearby to check it against
 * is a curiosity, not a finding.
 *
 * The CSV column layout is read from FIRMS's own header row rather than
 * assumed — this environment could not reach firms.modaps.eosdis.nasa.gov
 * to confirm the schema at build time (egress-blocked), so the same
 * defensive discipline as normaliseRain() applies: pick columns by name,
 * drop what cannot be read, and report the drop count rather than hide it.
 * ==================================================================== */

// Same bounding box scripts/ingest-bkk-water.py uses for its defence-in-depth
// guard: minlon, minlat, maxlon, maxlat.
const FIRMS_BBOX = { west: 100.2, south: 13.4, east: 101.0, north: 14.2 };
const FIRMS_TTL = 1800; // 30 min — matches FIRMS's own quota-respecting cadence
const FIRMS_DAY_RANGE = 1; // trailing 24h, single most-recent VIIRS pass

export type FireDetection = {
  lat: number;
  lon: number;
  /** 0-100 for VIIRS, or "low"/"nominal"/"high" depending on source — kept
      as the raw string so a downstream reader never assumes a numeric scale
      that a different FIRMS source would violate. */
  confidence: string | null;
  /** Fire radiative power, MW, when the column is present. */
  frpMw: number | null;
  acqDate: string | null;
  acqTime: string | null;
  satellite: string | null;
};

export type FirePayload = {
  detections: FireDetection[];
  /** Rows FIRMS sent that carried no readable lat/lon. */
  unreadable: number;
  bbox: typeof FIRMS_BBOX;
  dayRange: number;
  source: "VIIRS_SNPP_NRT";
  attribution: string;
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 1) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    if (cells.length < header.length) continue;
    const row: Record<string, string> = {};
    header.forEach((h, i) => (row[h] = (cells[i] ?? "").trim()));
    rows.push(row);
  }
  return rows;
}

export async function handleLiveFires(mapKey: string | undefined): Promise<Response> {
  const fetchedAt = new Date().toISOString();
  const base = { fetchedAt, source: "firms.modaps.eosdis.nasa.gov" };

  if (!mapKey) {
    return envelope({
      ...base,
      ok: false,
      reason:
        "No FIRMS_MAP_KEY configured on this deployment. Request a free key at https://firms.modaps.eosdis.nasa.gov/api_map_key/ and set FIRMS_MAP_KEY in the Worker environment — never in the repository.",
    });
  }

  const bbox = `${FIRMS_BBOX.west},${FIRMS_BBOX.south},${FIRMS_BBOX.east},${FIRMS_BBOX.north}`;
  const upstream = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/${bbox}/${FIRMS_DAY_RANGE}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(upstream, { signal: ctrl.signal });
    if (!res.ok) {
      // Never include `upstream` — it carries the key, same rule as Longdo.
      return envelope({ ...base, ok: false, reason: `FIRMS returned HTTP ${res.status}.` });
    }
    const text = await res.text();
    const rows = parseCsv(text);

    const detections: FireDetection[] = [];
    let unreadable = 0;
    for (const row of rows) {
      const lat = Number(row.latitude);
      const lon = Number(row.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        unreadable += 1;
        continue;
      }
      detections.push({
        lat,
        lon,
        confidence: row.confidence || null,
        frpMw: row.frp && Number.isFinite(Number(row.frp)) ? Number(row.frp) : null,
        acqDate: row.acq_date || null,
        acqTime: row.acq_time || null,
        satellite: row.satellite || null,
      });
    }

    if (rows.length > 0 && detections.length === 0 && unreadable === rows.length) {
      return envelope({
        ...base,
        ok: false,
        reason: `FIRMS responded with ${rows.length} row(s), but none carried a readable latitude/longitude. The CSV column layout has probably changed — parseCsv()/handleLiveFires() in worker/live.ts needs updating.`,
      });
    }

    return envelope<FirePayload>(
      {
        ...base,
        ok: true,
        data: {
          detections,
          unreadable,
          bbox: FIRMS_BBOX,
          dayRange: FIRMS_DAY_RANGE,
          source: "VIIRS_SNPP_NRT",
          attribution: "NASA FIRMS / LANCE, VIIRS Suomi-NPP near-real-time",
        },
      },
      FIRMS_TTL,
    );
  } catch (err) {
    const reason =
      (err as Error)?.name === "AbortError"
        ? `FIRMS did not respond within ${UPSTREAM_TIMEOUT_MS / 1000}s.`
        : `FIRMS unreachable: ${(err as Error)?.message ?? "unknown error"}.`;
    return envelope({ ...base, ok: false, reason });
  } finally {
    clearTimeout(timer);
  }
}
