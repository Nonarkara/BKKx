// One SQLite Durable Object holds every per-IP bucket and the daily write cap.
// Requests are serialized so two callers cannot both take the last slot.
// The worker maps the decision onto HTTP; this object always returns JSON.
//
// The storage key is the connecting address so one client cannot spend the
// whole site's cap. That address is not written to the D1 pageviews table.

import { consumeLimit, normalizeIp } from "./pageview-limits.ts";

interface StoredGlobal {
  day?: string;
  count?: number;
}

interface StoredMeta {
  day?: string;
  tracked?: number;
}

interface StoredIp {
  day: string;
  dayCount: number;
  tokens: number;
  updatedAt: number;
}

interface LimiterStorage {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<unknown>;
}

interface LimiterContext {
  storage: LimiterStorage;
  blockConcurrencyWhile?<T>(callback: () => Promise<T>): Promise<T>;
}

interface ConsumeBody {
  ip?: string;
  now?: number;
  limits?: {
    perIpPerMinute?: number;
    perIpPerDay?: number;
    globalPerDay?: number;
  };
  chargeGlobal?: boolean;
}

export class PageviewLimiter {
  ctx: LimiterContext;
  storage: LimiterStorage;

  constructor(ctx: LimiterContext) {
    this.ctx = ctx;
    this.storage = ctx.storage;
  }

  async fetch(request: Request): Promise<Response> {
    let body: ConsumeBody | null = null;
    try {
      body = await request.json() as ConsumeBody;
    } catch {
      body = null;
    }
    if (!body || typeof body !== "object") {
      return Response.json({ ok: false, reason: "limiter_unavailable", retryAfter: 30 });
    }

    const consume = () => this.consume(body as ConsumeBody);
    const decision = this.ctx.blockConcurrencyWhile
      ? await this.ctx.blockConcurrencyWhile(consume)
      : await consume();

    return Response.json({
      ok: Boolean(decision.ok),
      reason: decision.reason || null,
      retryAfter: decision.retryAfter || 0,
    });
  }

  async consume(body: ConsumeBody) {
    const ip = normalizeIp(body.ip);
    const now = Number.isFinite(body.now) ? Number(body.now) : Date.now();
    const [storedGlobal, storedMeta, storedIp] = await Promise.all([
      this.storage.get("global") as Promise<StoredGlobal | undefined>,
      this.storage.get("meta") as Promise<StoredMeta | undefined>,
      this.storage.get(`ip:${ip}`) as Promise<StoredIp | undefined>,
    ]);

    const state = {
      globalDay: (storedGlobal && storedGlobal.day) || "",
      globalCount: Number(storedGlobal && storedGlobal.count) || 0,
      trackedDay: (storedMeta && storedMeta.day) || "",
      tracked: Number(storedMeta && storedMeta.tracked) || 0,
      ips: storedIp ? { [ip]: storedIp } : {},
    };

    const result = consumeLimit(state, {
      ip,
      now,
      limits: body.limits,
      chargeGlobal: body.chargeGlobal,
    });

    if (result.writes) {
      const jobs: Promise<unknown>[] = [this.storage.put(`ip:${ip}`, result.writes.ip)];
      if (result.writes.global) jobs.push(this.storage.put("global", result.writes.global));
      if (result.writes.meta) jobs.push(this.storage.put("meta", result.writes.meta));
      await Promise.all(jobs);
    }

    return result;
  }
}
