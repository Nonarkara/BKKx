import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { handlePageviewPost } from "../worker/pageview-guard.ts";
import { PageviewLimiter } from "../worker/pageview-limiter.ts";
import {
  DEFAULT_ALLOWED_ORIGINS,
  DEFAULT_LIMITS,
  MESSAGES,
  allowedOrigins,
  bangkokDay,
  clientIp,
  consumeLimit,
  emptyLimitState,
  isAllowedSiteRequest,
  readLimits,
  secondsUntilBangkokMidnight,
} from "../worker/pageview-limits.ts";

const LIMITS = { ...DEFAULT_LIMITS };
const NOON = Date.parse("2026-10-13T05:00:00.000Z"); // 12:00 in Bangkok
const JUST_BEFORE_MIDNIGHT = Date.parse("2026-10-13T16:59:59.000Z");
const MIDNIGHT = Date.parse("2026-10-13T17:00:00.000Z"); // 2026-10-14 00:00 +07
const SITE = "https://bkk.nonarkara.org";

function take(state, ip, now, limits = LIMITS, chargeGlobal = true, maxTrackedIps) {
  return consumeLimit(state, { ip, now, limits, chargeGlobal, maxTrackedIps });
}

function fakeDb() {
  const writes = [];
  return {
    writes,
    async batch() {},
    prepare() {
      return {
        bind(...args) {
          return {
            async run() {
              writes.push(args);
            },
            async first() {
              return null;
            },
          };
        },
      };
    },
  };
}

function memoryStorage() {
  const data = new Map();
  return {
    data,
    async get(key) {
      await Promise.resolve();
      return data.has(key) ? structuredClone(data.get(key)) : undefined;
    },
    async put(key, value) {
      await Promise.resolve();
      data.set(key, structuredClone(value));
    },
  };
}

function limiterContext(storage) {
  let tail = Promise.resolve();
  return {
    storage,
    blockConcurrencyWhile(fn) {
      const run = tail.then(() => fn());
      tail = run.then(() => {}, () => {});
      return run;
    },
  };
}

function bindingFor(limiter) {
  return {
    idFromName(name) {
      assert.equal(name, "global");
      return "global";
    },
    get(id) {
      assert.equal(id, "global");
      return {
        fetch(url, init) {
          return limiter.fetch(new Request(url, init));
        },
      };
    },
  };
}

function freshLimiter() {
  return new PageviewLimiter(limiterContext(memoryStorage()));
}

function pageview({
  ip = "203.0.113.10",
  origin,
  referer,
  path = "/worlds",
  referrer = "https://example.test/from",
  country,
  url = `${SITE}/api/pageview`,
  extraHeaders = {},
  body,
} = {}) {
  const headers = {
    "content-type": "application/json",
    "accept-language": "th,en;q=0.8",
    "CF-Connecting-IP": ip,
    ...extraHeaders,
  };
  if (origin) headers.Origin = origin;
  if (referer) headers.Referer = referer;
  const request = new Request(url, {
    method: "POST",
    headers,
    body: body === undefined ? JSON.stringify({ path, referrer }) : body,
  });
  if (country) Object.defineProperty(request, "cf", { value: { country } });
  return request;
}

async function post(request, env, deps) {
  return handlePageviewPost(request, env, deps);
}

test("defaults are 10/min, 100/day, and 10000 writes", () => {
  assert.deepEqual(DEFAULT_LIMITS, {
    perIpPerMinute: 10,
    perIpPerDay: 100,
    globalPerDay: 10_000,
  });
  assert.deepEqual(readLimits({}), DEFAULT_LIMITS);
  assert.deepEqual(readLimits({
    RATE_LIMIT_PER_MINUTE: "4",
    RATE_LIMIT_PER_DAY: "9",
    GLOBAL_DAILY_CAP: "0",
  }), { perIpPerMinute: 4, perIpPerDay: 9, globalPerDay: 0 });
  assert.equal(readLimits({ GLOBAL_DAILY_CAP: "-5" }).globalPerDay, 10_000);
  assert.equal(readLimits({ GLOBAL_DAILY_CAP: "nope" }).globalPerDay, 10_000);
  assert.equal(readLimits({ GLOBAL_DAILY_CAP: "1000001" }).globalPerDay, 10_000);
});

test("the analytics day follows Asia/Bangkok", () => {
  assert.equal(bangkokDay(JUST_BEFORE_MIDNIGHT), "2026-10-13");
  assert.equal(bangkokDay(MIDNIGHT), "2026-10-14");
  assert.equal(secondsUntilBangkokMidnight(NOON), 12 * 60 * 60);
  assert.equal(secondsUntilBangkokMidnight(MIDNIGHT), 24 * 60 * 60);
});

test("a star origin does not open the guard", () => {
  assert.deepEqual(allowedOrigins({}), DEFAULT_ALLOWED_ORIGINS);
  assert.deepEqual(allowedOrigins({ ALLOWED_ORIGIN: "*" }), DEFAULT_ALLOWED_ORIGINS);
  assert.deepEqual(
    allowedOrigins({ ALLOWED_ORIGINS: "https://bkk.nonarkara.org/, https://preview.example" }),
    ["https://bkk.nonarkara.org", "https://preview.example"],
  );
});

test("origin is required, and a bad origin is not saved by Referer", () => {
  const site = (headers, url = `${SITE}/api/pageview`) => new Request(url, { headers });
  assert.equal(isAllowedSiteRequest(site({ Origin: SITE }), {}), true);
  assert.equal(isAllowedSiteRequest(site({ Referer: `${SITE}/worlds` }), {}), true);
  assert.equal(isAllowedSiteRequest(site({}), {}), false);
  assert.equal(isAllowedSiteRequest(site({ Origin: "null" }), {}), false);
  assert.equal(isAllowedSiteRequest(site({
    Origin: "https://evil.example",
    Referer: `${SITE}/`,
  }), {}), false);
  assert.equal(isAllowedSiteRequest(site({
    Origin: "https://bkk.nonarkara.org.evil.example",
  }), {}), false);
  assert.equal(isAllowedSiteRequest(site({
    Origin: "http://127.0.0.1:3000",
  }), {}), false);
  assert.equal(isAllowedSiteRequest(site(
    { Origin: "http://127.0.0.1:3000" },
    "http://127.0.0.1:3000/api/pageview",
  ), {}), true);
  assert.equal(isAllowedSiteRequest(site(
    { Origin: "http://localhost:3000" },
    "http://localhost:3000/api/pageview",
  ), {}), true);
  assert.equal(isAllowedSiteRequest(site(
    { Origin: "http://evil.localhost:3000" },
    "http://localhost:3000/api/pageview",
  ), {}), false);
});

test("CF-Connecting-IP wins over a spoofed forwarded header", () => {
  const request = new Request(`${SITE}/api/pageview`, {
    headers: {
      "CF-Connecting-IP": "203.0.113.8",
      "X-Forwarded-For": "198.51.100.9, 10.0.0.1",
    },
  });
  assert.equal(clientIp(request), "203.0.113.8");
  const forwarded = new Request(`${SITE}/api/pageview`, {
    headers: { "X-Forwarded-For": "198.51.100.9, 10.0.0.1" },
  });
  assert.equal(clientIp(forwarded), "198.51.100.9");
  assert.equal(clientIp(new Request(`${SITE}/api/pageview`)), "unknown");
  assert.equal(clientIp(new Request(`${SITE}/api/pageview`, {
    headers: { "CF-Connecting-IP": "not an ip" },
  })), "unknown");
});

test("token bucket allows a burst of 10 and refills one token per 6 seconds", () => {
  let state = emptyLimitState();
  for (let i = 0; i < 10; i += 1) {
    const step = take(state, "203.0.113.1", NOON);
    assert.equal(step.ok, true, `request ${i + 1}`);
    state = step.state;
  }
  const blocked = take(state, "203.0.113.1", NOON);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, "per_minute");
  assert.equal(blocked.retryAfter, 6);
  assert.equal(blocked.writes, null);
  assert.equal(blocked.state.globalCount, 10);

  const early = take(state, "203.0.113.1", NOON + 5999);
  assert.equal(early.ok, false);
  assert.equal(early.reason, "per_minute");

  const refilled = take(state, "203.0.113.1", NOON + 6000);
  assert.equal(refilled.ok, true);
  assert.equal(refilled.state.ips["203.0.113.1"].tokens, 0);

  const other = take(state, "203.0.113.2", NOON);
  assert.equal(other.ok, true);
});

test("per-IP day cap is 100 and resets at Bangkok midnight", () => {
  const limits = { perIpPerMinute: 1000, perIpPerDay: 100, globalPerDay: 1000 };
  let state = emptyLimitState();
  for (let i = 0; i < 100; i += 1) {
    const step = take(state, "203.0.113.1", NOON, limits);
    assert.equal(step.ok, true);
    state = step.state;
  }
  const blocked = take(state, "203.0.113.1", NOON, limits);
  assert.equal(blocked.reason, "per_day");
  assert.equal(blocked.state.globalCount, 100);

  const nextDay = take(state, "203.0.113.1", MIDNIGHT, limits);
  assert.equal(nextDay.ok, true);
  assert.equal(nextDay.state.globalCount, 1);
  assert.equal(nextDay.state.ips["203.0.113.1"].dayCount, 1);
});

test("global cap counts writes and stops at the configured ceiling", () => {
  const limits = { perIpPerMinute: 1000, perIpPerDay: 1000, globalPerDay: 200 };
  let state = emptyLimitState();
  const unpaid = take(state, "203.0.113.1", NOON, limits, false);
  assert.equal(unpaid.ok, true);
  assert.equal(unpaid.writes.global, undefined);
  assert.equal(unpaid.state.globalCount, 0);
  state = unpaid.state;

  for (let i = 0; i < 200; i += 1) {
    const step = take(state, `203.0.113.${i}`, NOON, limits, true, 5000);
    assert.equal(step.ok, true, `call ${i + 1}`);
    state = step.state;
  }
  assert.equal(state.globalCount, 200);
  const blocked = take(state, "203.0.113.250", NOON, limits, true, 5000);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, "global_day");
  assert.equal(blocked.state.globalCount, 200);
  assert.equal(blocked.state.ips["203.0.113.250"], undefined);
});

test("a full global cap does not consume the caller bucket", () => {
  const limits = { perIpPerMinute: 10, perIpPerDay: 100, globalPerDay: 0 };
  const blocked = take(emptyLimitState(), "203.0.113.1", NOON, limits, true);
  assert.equal(blocked.reason, "global_day");
  assert.equal(blocked.writes, null);
  const personal = take(blocked.state, "203.0.113.1", NOON, limits, false);
  assert.equal(personal.ok, true);
});

test("new addresses are refused once the tracked-IP cap is full", () => {
  const limits = { perIpPerMinute: 10, perIpPerDay: 100, globalPerDay: 50 };
  let state = emptyLimitState();
  state = take(state, "203.0.113.1", NOON, limits, true, 1).state;
  const crowded = take(state, "203.0.113.2", NOON, limits, true, 1);
  assert.equal(crowded.reason, "crowded");
  const again = take(state, "203.0.113.1", NOON, limits, true, 1);
  assert.equal(again.ok, true);
});

test("wrangler.toml is the knob for the caps and the free SQLite limiter", () => {
  const toml = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");
  assert.match(toml, /RATE_LIMIT_PER_MINUTE\s*=\s*"10"/);
  assert.match(toml, /RATE_LIMIT_PER_DAY\s*=\s*"100"/);
  assert.match(toml, /GLOBAL_DAILY_CAP\s*=\s*"10000"/);
  assert.match(toml, /ALLOWED_ORIGINS\s*=\s*"https:\/\/bkk\.nonarkara\.org"/);
  assert.match(toml, /name\s*=\s*"PAGEVIEW_LIMITER"/);
  assert.match(toml, /class_name\s*=\s*"PageviewLimiter"/);
  assert.match(toml, /new_sqlite_classes\s*=\s*\["PageviewLimiter"\]/);
  const vite = readFileSync(new URL("../vite.config.ts", import.meta.url), "utf8");
  assert.match(vite, /configPath:\s*"\.\/wrangler\.toml"/);
  const worker = readFileSync(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /export \{ PageviewLimiter \}/);
  assert.match(worker, /return handlePageviewPost\(request, env\)/);
  assert.match(worker, /pathname === "\/api\/stats"/);
});

test("a normal page view still returns 201 and stores no address", async () => {
  const db = fakeDb();
  const res = await post(
    pageview({ origin: SITE, path: "/worlds", country: "TH" }),
    { DB: db, PAGEVIEW_LIMITER: bindingFor(freshLimiter()) },
    { now: () => NOON },
  );
  assert.equal(res.status, 201);
  assert.equal(res.headers.get("retry-after"), null);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(db.writes.length, 1);
  const [path, referrer, country, language] = db.writes[0];
  assert.equal(path, "/worlds");
  assert.equal(referrer, "https://example.test/from");
  assert.equal(country, "TH");
  assert.equal(language, "th,en;q=0.8");
  assert.equal(db.writes[0].includes("203.0.113.10"), false);
});

test("Referer from the site is enough when Origin is absent", async () => {
  const db = fakeDb();
  const res = await post(
    pageview({ referer: `${SITE}/worlds` }),
    { DB: db, PAGEVIEW_LIMITER: bindingFor(freshLimiter()) },
    { now: () => NOON },
  );
  assert.equal(res.status, 201);
  assert.equal(db.writes.length, 1);
});

test("an off-site caller is refused before the limiter or D1", async () => {
  const db = fakeDb();
  const limiter = freshLimiter();
  let reservations = 0;
  const wrapped = bindingFor(limiter);
  const realGet = wrapped.get;
  wrapped.get = (id) => {
    reservations += 1;
    return realGet(id);
  };
  const res = await post(
    pageview({ origin: "https://evil.example" }),
    { DB: db, PAGEVIEW_LIMITER: wrapped },
    { now: () => NOON },
  );
  assert.equal(res.status, 403);
  assert.deepEqual(await res.json(), { ok: false, error: MESSAGES.origin, code: "origin" });
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(db.writes.length, 0);
  assert.equal(reservations, 0);
});

test("the 11th write in a minute is a friendly 429 and does not touch D1", async () => {
  const db = fakeDb();
  const env = { DB: db, PAGEVIEW_LIMITER: bindingFor(freshLimiter()) };
  let now = NOON;
  for (let i = 0; i < 10; i += 1) {
    const res = await post(pageview({ origin: SITE, path: `/worlds?n=${i}` }), env, { now: () => now });
    assert.equal(res.status, 201, `write ${i + 1}`);
  }
  const blocked = await post(pageview({ origin: SITE, path: "/worlds?extra=1" }), env, { now: () => now });
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("retry-after"), "6");
  const body = await blocked.json();
  assert.equal(body.ok, false);
  assert.equal(body.error, MESSAGES.per_minute);
  assert.equal(body.code, "rate_limited");
  assert.equal(body.retry_after, 6);
  assert.equal(db.writes.length, 10);

  const spoofed = await post(pageview({
    origin: SITE,
    extraHeaders: { "X-Forwarded-For": "198.51.100.77" },
  }), env, { now: () => now });
  assert.equal(spoofed.status, 429);
  assert.equal(db.writes.length, 10);

  const other = await post(
    pageview({ ip: "203.0.113.77", origin: SITE }),
    env,
    { now: () => now },
  );
  assert.equal(other.status, 201);

  now += 5999;
  const early = await post(pageview({ origin: SITE }), env, { now: () => now });
  assert.equal(early.status, 429);

  now += 1;
  const later = await post(pageview({ origin: SITE }), env, { now: () => now });
  assert.equal(later.status, 201);
});

test("the daily write cap stops further D1 inserts", async () => {
  const db = fakeDb();
  const warnings = [];
  const previous = console.warn;
  console.warn = (...args) => {
    warnings.push(args.join(" "));
  };
  try {
    const env = {
      DB: db,
      PAGEVIEW_LIMITER: bindingFor(freshLimiter()),
      GLOBAL_DAILY_CAP: "2",
      RATE_LIMIT_PER_MINUTE: "10",
      RATE_LIMIT_PER_DAY: "100",
    };
    const deps = { now: () => NOON };
    const first = await post(pageview({ ip: "203.0.113.1", origin: SITE }), env, deps);
    const second = await post(pageview({ ip: "203.0.113.2", origin: SITE }), env, deps);
    const third = await post(pageview({ ip: "203.0.113.3", origin: SITE }), env, deps);
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(third.status, 429);
    const body = await third.json();
    assert.equal(body.code, "daily_cap");
    assert.equal(body.error, MESSAGES.global_day);
    assert.equal(db.writes.length, 2);
    assert.ok(warnings.some((line) => line.includes("global daily cap")));
  } finally {
    console.warn = previous;
  }
});

test("per-day env limit is enforced", async () => {
  const db = fakeDb();
  const env = {
    DB: db,
    PAGEVIEW_LIMITER: bindingFor(freshLimiter()),
    RATE_LIMIT_PER_MINUTE: "10",
    RATE_LIMIT_PER_DAY: "2",
    GLOBAL_DAILY_CAP: "50",
  };
  const deps = { now: () => NOON };
  assert.equal((await post(pageview({ origin: SITE, path: "/a" }), env, deps)).status, 201);
  assert.equal((await post(pageview({ origin: SITE, path: "/b" }), env, deps)).status, 201);
  const third = await post(pageview({ origin: SITE, path: "/c" }), env, deps);
  assert.equal(third.status, 429);
  assert.equal((await third.json()).error, MESSAGES.per_day);
  assert.equal(db.writes.length, 2);
});

test("a zero global cap refuses the write", async () => {
  const db = fakeDb();
  const res = await post(
    pageview({ origin: SITE }),
    { DB: db, PAGEVIEW_LIMITER: bindingFor(freshLimiter()), GLOBAL_DAILY_CAP: "0" },
    { now: () => NOON },
  );
  assert.equal(res.status, 429);
  assert.equal((await res.json()).code, "daily_cap");
  assert.equal(db.writes.length, 0);
});

test("a missing or broken limiter fails closed", async () => {
  const db = fakeDb();
  const deps = { now: () => NOON };
  const warnings = [];
  const previous = console.warn;
  console.warn = (...args) => {
    warnings.push(args.join(" "));
  };
  try {
    const missing = await post(pageview({ origin: SITE }), { DB: db }, deps);
    assert.equal(missing.status, 503);
    const missingBody = await missing.json();
    assert.equal(missingBody.error, MESSAGES.limiter_unavailable);
    assert.equal(missingBody.code, "unavailable");
    assert.equal(missing.headers.get("retry-after"), "30");

    const broken = await post(pageview({ origin: SITE }), {
      DB: db,
      PAGEVIEW_LIMITER: {
        idFromName() {
          return "global";
        },
        get() {
          return { fetch() { throw new Error("storage down"); } };
        },
      },
    }, deps);
    assert.equal(broken.status, 503);
    assert.equal(db.writes.length, 0);
    assert.ok(warnings.some((line) => line.includes("limiter unavailable")));
  } finally {
    console.warn = previous;
  }
});

test("a limiter that returns a bad payload fails closed", async () => {
  const db = fakeDb();
  const res = await post(pageview({ origin: SITE }), {
    DB: db,
    PAGEVIEW_LIMITER: {
      idFromName() {
        return "global";
      },
      get() {
        return { fetch() { return Response.json({ nope: true }); } };
      },
    },
  }, { now: () => NOON });
  assert.equal(res.status, 503);
  assert.equal(db.writes.length, 0);
});

test("the durable object does not hand the last global slot to two callers", async () => {
  const limiter = freshLimiter();
  const limits = { perIpPerMinute: 10, perIpPerDay: 100, globalPerDay: 1 };
  const call = (ip) => limiter.fetch(new Request("https://limiter.internal/consume", {
    method: "POST",
    body: JSON.stringify({ ip, now: NOON, limits, chargeGlobal: true }),
  }));
  const [a, b] = await Promise.all([call("203.0.113.1"), call("203.0.113.2")]);
  const bodyA = await a.json();
  const bodyB = await b.json();
  assert.equal([bodyA.ok, bodyB.ok].filter(Boolean).length, 1);
  assert.equal(bodyA.state, undefined);
  assert.equal(bodyA.ips, undefined);
  assert.equal(limiter.storage.data.get("global").count, 1);
});

test("storage errors inside the limiter refuse the write", async () => {
  const limiter = new PageviewLimiter(limiterContext({
    async get() {
      throw new Error("disk");
    },
    async put() {
      throw new Error("disk");
    },
  }));
  const db = fakeDb();
  const res = await post(pageview({ origin: SITE }), {
    DB: db,
    PAGEVIEW_LIMITER: bindingFor(limiter),
  }, { now: () => NOON });
  assert.equal(res.status, 503);
  assert.equal(db.writes.length, 0);
});

test("loopback dev still records, and a broken body still counts as one write", async () => {
  const db = fakeDb();
  const res = await post(
    pageview({
      url: "http://localhost:3000/api/pageview",
      origin: "http://localhost:3000",
      body: "{",
    }),
    { DB: db, PAGEVIEW_LIMITER: bindingFor(freshLimiter()) },
    { now: () => NOON },
  );
  assert.equal(res.status, 201);
  assert.equal(db.writes[0][0], "/");
  assert.equal(db.writes[0][1], null);
});
