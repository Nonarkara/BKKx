// A ceiling on how many page views a day can cost, enforced without
// storing anything about the person who sent them.
//
// WHY NOT A PER-IP LIMITER
//
// PR12 (cursor/pageview-write-guards-bd27) proposed a Durable Object that
// keyed a per-address bucket — 10/minute, 100/day, 10,000/day globally — and
// was held for two reasons that are still true:
//
//   1. It stored the raw connecting address as the storage key. That is a
//      personal identifier in durable storage, and the buckets were only
//      pruned when a LATER request arrived: on a quiet day the last
//      addresses simply stayed. site/CLAUDE.md says D1 stores "never IP
//      addresses ... and nothing that identifies a person across requests".
//   2. It put a Durable Object in front of every page-view write. A DO
//      invocation costs more than the D1 row insert it was protecting, so
//      under attack the limiter made the bill worse, not better.
//
// WHAT THIS DOES INSTEAD
//
// One counter row per day, updated atomically. It bounds how many rows a day
// can add to D1, which is the thing that actually costs money and storage.
// It says nothing about who visited and it stores nothing that could:
// the row is (day, n, updated_at) and nothing else.
//
// The per-address limit belongs to the edge, where it is free: a Cloudflare
// rate-limiting rule on POST /api/pageview stops a flood before the Worker
// is ever invoked, so a flood costs the Worker nothing. That rule is
// configured in the zone and written down in
// docs/pageview-rate-limits.md — this file is the second line of defence,
// not the first.
//
// The Origin check in pageview-request.ts stays where it is. It reduces
// browser abuse. It is NOT authentication: a non-browser caller can forge an
// Origin header. Nothing here depends on it being true.

const CAP_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS pageview_daily (
    day TEXT PRIMARY KEY,
    n INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )
`;

/** Days of history kept in the counter table. Enough to see the shape. */
export const CAP_RETENTION_DAYS = 7;

/** The default ceiling on page-view rows written per Bangkok day. */
export const DEFAULT_DAILY_CAP = 10_000;

/**
 * The Bangkok calendar day. The site's day boundary is Bangkok's midnight,
 * not UTC's, so the ceiling resets when the city's day does.
 */
export function bangkokDay(now: number): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

/** Seconds until the next Bangkok midnight. */
export function secondsUntilBangkokMidnight(now: number): number {
  const day = bangkokDay(now);
  const next = Date.parse(`${day}T00:00:00+07:00`) + 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((next - now) / 1000));
}

export function parseCap(raw: string | undefined | null): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_DAILY_CAP;
  return Math.floor(value);
}

export type Capacity = {
  ok: boolean;
  count: number;
  cap: number;
  day: string;
  retryAfter: number;
};

/**
 * Claim one page view against today's ceiling.
 *
 * The increment is a single statement, so two concurrent requests cannot both
 * slip past the cap by reading the same count. The row that is claimed is
 * (day, n) — a count, not a record of anyone.
 */
export async function claimDailyCapacity(
  db: D1Database,
  opts: { cap?: number; now?: number } = {},
): Promise<Capacity> {
  const now = opts.now ?? Date.now();
  const cap = opts.cap && opts.cap > 0 ? Math.floor(opts.cap) : DEFAULT_DAILY_CAP;
  const day = bangkokDay(now);

  await db.prepare(CAP_TABLE_SQL).run();

  // Atomic increment-and-read. ON CONFLICT DO UPDATE keeps the count exact
  // under concurrency; RETURNING hands back the value AFTER the increment,
  // so `count` is the number of page views claimed today including this one.
  const row = await db
    .prepare(
      `INSERT INTO pageview_daily (day, n, updated_at) VALUES (?, 1, ?)
       ON CONFLICT(day) DO UPDATE SET n = pageview_daily.n + 1, updated_at = excluded.updated_at
       RETURNING n`,
    )
    .bind(day, now)
    .first<{ n: number }>();

  const count = Number(row?.n ?? 0);

  // Keep the counter table to a week. This matches no row on almost every
  // request, so it costs a query rather than a write.
  const cutoff = new Date(now - CAP_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await db
    .prepare(`DELETE FROM pageview_daily WHERE day < ?`)
    .bind(bangkokDay(cutoff.getTime()))
    .run();

  return {
    ok: count <= cap,
    count,
    cap,
    day,
    retryAfter: secondsUntilBangkokMidnight(now),
  };
}
