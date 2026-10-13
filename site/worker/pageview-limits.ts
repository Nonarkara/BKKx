// Spend and abuse guards for POST /api/pageview.
//
// Cloudflare does not enforce a hard spend cap, so the worker keeps its
// own counters and refuses the D1 write past them. The day boundary is
// midnight in Asia/Bangkok, where the site is.

export const DEFAULT_LIMITS = {
  perIpPerMinute: 10,
  perIpPerDay: 100,
  globalPerDay: 10_000,
};

export const DEFAULT_ALLOWED_ORIGINS = ["https://bkk.nonarkara.org"];

export const MAX_TRACKED_IPS = 4096;

export const MESSAGES = {
  per_minute: "Too many page views from this connection. Please wait a minute and try again.",
  per_day: "This connection has reached today's page view limit. Please come back tomorrow.",
  global_day: "The site has reached today's page view limit. Please come back tomorrow.",
  crowded: "The site is busy right now. Please try again in a little while.",
  origin: "Page views are only accepted from this site.",
  limiter_unavailable: "Page views are paused for a moment. Please try again shortly.",
};

const DAY_MS = 24 * 60 * 60 * 1000;

export interface LimitValues {
  perIpPerMinute: number;
  perIpPerDay: number;
  globalPerDay: number;
}

export interface IpBucket {
  day: string;
  dayCount: number;
  tokens: number;
  updatedAt: number;
}

export interface LimitState {
  globalDay: string;
  globalCount: number;
  trackedDay: string;
  tracked: number;
  ips: Record<string, IpBucket>;
}

export interface LimitDecision {
  ok: boolean;
  reason: string | null;
  retryAfter: number;
  state: LimitState;
  writes: {
    ip: IpBucket;
    global?: { day: string; count: number };
    meta?: { day: string; tracked: number };
  } | null;
}

interface LimitEnv {
  RATE_LIMIT_PER_MINUTE?: string | number;
  RATE_LIMIT_PER_DAY?: string | number;
  GLOBAL_DAILY_CAP?: string | number;
  ALLOWED_ORIGINS?: string;
  ALLOWED_ORIGIN?: string;
}

export function emptyLimitState(): LimitState {
  return { globalDay: "", globalCount: 0, trackedDay: "", tracked: 0, ips: {} };
}

export function bangkokDay(now: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(now));
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function secondsUntilBangkokMidnight(now: number): number {
  const start = Date.parse(`${bangkokDay(now)}T00:00:00+07:00`);
  const next = start + DAY_MS;
  return Math.max(1, Math.ceil((next - now) / 1000));
}

function readInt(value: string | number | undefined, fallback: number): number {
  if (value == null || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0 || n > 1_000_000) return fallback;
  return Math.floor(n);
}

export function readLimits(env: LimitEnv = {}): LimitValues {
  return {
    perIpPerMinute: readInt(env.RATE_LIMIT_PER_MINUTE, DEFAULT_LIMITS.perIpPerMinute),
    perIpPerDay: readInt(env.RATE_LIMIT_PER_DAY, DEFAULT_LIMITS.perIpPerDay),
    globalPerDay: readInt(env.GLOBAL_DAILY_CAP, DEFAULT_LIMITS.globalPerDay),
  };
}

function sanitizeLimits(limits: Partial<LimitValues> | undefined): LimitValues {
  return readLimits({
    RATE_LIMIT_PER_MINUTE: limits?.perIpPerMinute,
    RATE_LIMIT_PER_DAY: limits?.perIpPerDay,
    GLOBAL_DAILY_CAP: limits?.globalPerDay,
  });
}

export function normalizeOrigin(value: string | null | undefined): string {
  const text = String(value || "").trim();
  if (!text || text === "*" || text === "null") return "";
  try {
    return new URL(text).origin;
  } catch {
    return "";
  }
}

export function allowedOrigins(env: LimitEnv = {}): string[] {
  const plural = String(env.ALLOWED_ORIGINS || "").trim();
  const singular = String(env.ALLOWED_ORIGIN || "").trim();
  const source = plural || (singular && singular !== "*" ? singular : "");
  const list = source
    .split(",")
    .map((part) => normalizeOrigin(part))
    .filter(Boolean);
  return list.length ? [...new Set(list)] : DEFAULT_ALLOWED_ORIGINS.slice();
}

function loopbackOrigin(request: Request): string {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return "";
  }
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]") {
    return url.origin;
  }
  return "";
}

export function isAllowedSiteRequest(request: Request, env: LimitEnv = {}): boolean {
  const allowed = new Set(allowedOrigins(env));
  const local = loopbackOrigin(request);
  if (local) allowed.add(local);
  const origin = (request.headers.get("Origin") || "").trim();
  if (origin === "null") return false;
  if (origin) return allowed.has(normalizeOrigin(origin));
  const referer = (request.headers.get("Referer") || "").trim();
  if (!referer) return false;
  return allowed.has(normalizeOrigin(referer));
}

export function normalizeIp(ip: string | null | undefined): string {
  const value = String(ip || "").trim().slice(0, 80);
  if (/^[0-9a-fA-F:.]+$/.test(value)) return value;
  return "unknown";
}

export function clientIp(request: Request): string {
  const cf = request.headers.get("CF-Connecting-IP");
  if (cf && cf.trim()) return normalizeIp(cf);
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) return normalizeIp(forwarded.split(",")[0]);
  return "unknown";
}

function copyRec(rec: IpBucket): IpBucket {
  return {
    day: rec.day,
    dayCount: rec.dayCount,
    tokens: rec.tokens,
    updatedAt: rec.updatedAt,
  };
}

function refill(rec: IpBucket, now: number, capacity: number): IpBucket {
  const ms = 60000 / capacity;
  const elapsed = Math.max(0, now - rec.updatedAt);
  const gained = Math.floor(elapsed / ms);
  if (gained <= 0) return copyRec(rec);
  return {
    day: rec.day,
    dayCount: rec.dayCount,
    tokens: Math.min(capacity, rec.tokens + gained),
    updatedAt: rec.updatedAt + gained * ms,
  };
}

function secondsUntilToken(rec: IpBucket, now: number, capacity: number): number {
  const ms = 60000 / capacity;
  const elapsed = Math.max(0, now - rec.updatedAt);
  const into = elapsed % ms;
  const remainMs = into === 0 ? ms : ms - into;
  return Math.max(1, Math.ceil(remainMs / 1000));
}

export function consumeLimit(
  rawState: LimitState | null | undefined,
  input: {
    ip: string;
    now: number;
    limits?: Partial<LimitValues>;
    chargeGlobal?: boolean;
    maxTrackedIps?: number;
  },
): LimitDecision {
  const state = rawState || emptyLimitState();
  const limits = sanitizeLimits(input.limits);
  const ip = normalizeIp(input.ip);
  const now = Number(input.now);
  const chargeGlobal = Boolean(input.chargeGlobal);
  const maxTracked = input.maxTrackedIps == null ? MAX_TRACKED_IPS : input.maxTrackedIps;
  const day = bangkokDay(now);

  const globalCount = state.globalDay === day ? state.globalCount : 0;
  const tracked = state.trackedDay === day ? state.tracked : 0;
  const storedRec = state.ips && state.ips[ip];
  const previous = storedRec && storedRec.day === day ? storedRec : null;

  const base: LimitState = {
    globalDay: day,
    globalCount,
    trackedDay: day,
    tracked,
    ips: { ...(state.ips || {}) },
  };
  const deny = (reason: string, retryAfter: number): LimitDecision => ({
    ok: false,
    reason,
    retryAfter,
    state: base,
    writes: null,
  });

  if (!Number.isFinite(now)) return deny("limiter_unavailable", 30);
  if (limits.perIpPerMinute <= 0) return deny("per_minute", 60);
  if (limits.perIpPerDay <= 0) return deny("per_day", secondsUntilBangkokMidnight(now));

  const isNew = !previous;
  if (isNew && tracked >= maxTracked) return deny("crowded", 60);

  const capacity = limits.perIpPerMinute;
  const rec = previous
    ? refill(previous, now, capacity)
    : { day, dayCount: 0, tokens: capacity, updatedAt: now };

  if (rec.tokens < 1) return deny("per_minute", secondsUntilToken(rec, now, capacity));
  if (rec.dayCount >= limits.perIpPerDay) return deny("per_day", secondsUntilBangkokMidnight(now));
  if (chargeGlobal && globalCount >= limits.globalPerDay) {
    return deny("global_day", secondsUntilBangkokMidnight(now));
  }

  const saved: IpBucket = {
    day,
    dayCount: rec.dayCount + 1,
    tokens: rec.tokens - 1,
    updatedAt: rec.updatedAt,
  };
  const ips = { ...base.ips, [ip]: saved };
  for (const key of Object.keys(ips)) {
    if (!ips[key] || ips[key].day !== day) delete ips[key];
  }

  const next: LimitState = {
    globalDay: day,
    globalCount: chargeGlobal ? globalCount + 1 : globalCount,
    trackedDay: day,
    tracked: isNew ? tracked + 1 : tracked,
    ips,
  };
  return {
    ok: true,
    reason: null,
    retryAfter: 0,
    state: next,
    writes: {
      ip: saved,
      global: chargeGlobal ? { day, count: next.globalCount } : undefined,
      meta: isNew ? { day, tracked: next.tracked } : undefined,
    },
  };
}
