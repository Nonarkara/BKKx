// POST /api/pageview. A browser on this site still gets { ok: true }.
// Anything off-site, over the cap, or without a working counter is refused
// before D1 is touched.

import { recordPageview } from "./pageviews.ts";
import {
  MESSAGES,
  clientIp,
  isAllowedSiteRequest,
  readLimits,
} from "./pageview-limits.ts";

interface LimitDecision {
  ok: boolean;
  reason?: string | null;
  retryAfter?: number;
}

export interface PageviewGuardEnv {
  DB: D1Database;
  PAGEVIEW_LIMITER?: DurableObjectNamespace;
  RATE_LIMIT_PER_MINUTE?: string | number;
  RATE_LIMIT_PER_DAY?: string | number;
  GLOBAL_DAILY_CAP?: string | number;
  ALLOWED_ORIGINS?: string;
  ALLOWED_ORIGIN?: string;
}

export interface PageviewGuardDeps {
  now?: () => number;
  reserve?: (env: PageviewGuardEnv, request: Request, opts: { now: number }) => Promise<LimitDecision>;
}

export async function handlePageviewPost(
  request: Request,
  env: PageviewGuardEnv,
  deps: PageviewGuardDeps = {},
): Promise<Response> {
  if (!isAllowedSiteRequest(request, env)) {
    return json({ ok: false, error: MESSAGES.origin, code: "origin" }, 403, {
      "cache-control": "no-store",
    });
  }

  const body = await request.json().catch(() => ({})) as {
    path?: unknown;
    referrer?: unknown;
  };
  const now = typeof deps.now === "function" ? deps.now() : Date.now();
  const decision = deps.reserve
    ? await deps.reserve(env, request, { now })
    : await reserveWithDurableObject(env, request, now);
  if (!decision.ok) return limitResponse(decision);

  const cloudflareRequest = request as Request & { cf?: { country?: string } };
  await recordPageview(env.DB, {
    path: typeof body.path === "string" ? body.path : "/",
    referrer: typeof body.referrer === "string" ? body.referrer : null,
    country: cloudflareRequest.cf?.country ?? null,
    language: request.headers.get("accept-language"),
  });
  return json({ ok: true }, 201);
}

async function reserveWithDurableObject(
  env: PageviewGuardEnv,
  request: Request,
  now: number,
): Promise<LimitDecision> {
  const ns = env.PAGEVIEW_LIMITER;
  if (!ns || typeof ns.idFromName !== "function" || typeof ns.get !== "function") {
    return { ok: false, reason: "limiter_unavailable", retryAfter: 30 };
  }
  try {
    const stub = ns.get(ns.idFromName("global"));
    const res = await stub.fetch("https://limiter.internal/consume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ip: clientIp(request),
        now,
        limits: readLimits(env),
        chargeGlobal: true,
      }),
    });
    if (!res.ok) return { ok: false, reason: "limiter_unavailable", retryAfter: 30 };
    const decision = await res.json() as LimitDecision;
    if (!decision || typeof decision.ok !== "boolean") {
      return { ok: false, reason: "limiter_unavailable", retryAfter: 30 };
    }
    return {
      ok: decision.ok,
      reason: decision.reason || null,
      retryAfter: decision.retryAfter || 0,
    };
  } catch {
    return { ok: false, reason: "limiter_unavailable", retryAfter: 30 };
  }
}

function limitResponse(decision: LimitDecision): Response {
  const reason = decision.reason || "limiter_unavailable";
  const status = reason === "limiter_unavailable" ? 503 : 429;
  const code = reason === "global_day"
    ? "daily_cap"
    : reason === "limiter_unavailable"
      ? "unavailable"
      : "rate_limited";
  const retryAfter = Math.max(1, Number(decision.retryAfter) || 1);
  if (reason === "global_day") {
    console.warn("pageview global daily cap reached; further writes refused until midnight in Bangkok");
  } else if (reason === "limiter_unavailable") {
    console.warn("pageview limiter unavailable; write refused");
  }
  const message = MESSAGES[reason as keyof typeof MESSAGES] || MESSAGES.limiter_unavailable;
  return json({
    ok: false,
    error: message,
    code,
    retry_after: retryAfter,
  }, status, {
    "cache-control": "no-store",
    "retry-after": String(retryAfter),
  });
}

function json(obj: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return Response.json(obj, { status, headers: extraHeaders });
}
