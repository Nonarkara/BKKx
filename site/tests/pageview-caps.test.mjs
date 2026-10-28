import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import {
  CAP_RETENTION_DAYS,
  DEFAULT_DAILY_CAP,
  bangkokDay,
  claimDailyCapacity,
  parseCap,
  secondsUntilBangkokMidnight,
} from '../worker/pageview-caps.ts';

// A D1 stand-in that actually implements the statements the cap issues, so
// the test exercises the SQL rather than a canned answer.
//
//   CREATE TABLE IF NOT EXISTS pageview_daily (...)
//   INSERT INTO pageview_daily (day, n, updated_at) VALUES (?,1,?)
//     ON CONFLICT(day) DO UPDATE SET n = pageview_daily.n + 1, ...
//     RETURNING n
//   DELETE FROM pageview_daily WHERE day < ?
function fakeDb() {
  const days = new Map();
  const statements = [];
  return {
    days,
    statements,
    prepare(sql) {
      const trimmed = sql.trim();
      const exec = {
        args: [],
        async run() {
          statements.push({ sql: trimmed, args: [] });
          if (/^DELETE FROM pageview_daily/i.test(trimmed)) {
            const cutoff = exec.args[0];
            for (const day of [...days.keys()]) if (day < cutoff) days.delete(day);
          }
          return { meta: { changes: 0 } };
        },
        async first() {
          statements.push({ sql: trimmed, args: exec.args });
          if (/INSERT INTO pageview_daily/i.test(trimmed)) {
            const [day, , updatedAt] = exec.args;
            const n = (days.get(day)?.n ?? 0) + 1;
            days.set(day, { n, updated_at: updatedAt });
            return { n };
          }
          return null;
        },
      };
      const stmt = {
        args: [],
        bind(...args) { stmt.args = args; exec.args = args; return exec; },
        run: exec.run,
        first: exec.first,
      };
      return stmt;
    },
  };
}

const NOON_BANGKOK = Date.parse('2026-10-28T05:00:00.000Z'); // 12:00 +07
const NIGHT_BANGKOK = Date.parse('2026-10-28T16:59:00.000Z'); // 23:59 +07

test('the daily ceiling fires when the day is full, and stops exactly there', async () => {
  const db = fakeDb();
  const cap = 3;
  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(await claimDailyCapacity(db, { cap, now: NOON_BANGKOK }));
  }
  assert.deepEqual(results.map((r) => r.ok), [true, true, true, false, false]);
  assert.deepEqual(results.map((r) => r.count), [1, 2, 3, 4, 5]);
  // The counter keeps counting after the cap closes, so the site stays shut
  // for the rest of the day rather than reopening on the next request.
  assert.equal(db.days.get('2026-10-28').n, 5);
});

test('the ceiling resets on the Bangkok day, not the UTC day', async () => {
  const db = fakeDb();
  // 23:59 Bangkok on the 28th is 16:59 UTC on the 28th — the same UTC day,
  // a different Bangkok day twenty minutes later.
  const lastNight = await claimDailyCapacity(db, { cap: 1, now: NIGHT_BANGKOK });
  assert.equal(lastNight.ok, true);
  assert.equal(lastNight.day, '2026-10-28');
  const nextDay = await claimDailyCapacity(db, { cap: 1, now: NIGHT_BANGKOK + 60_000 });
  assert.equal(nextDay.day, '2026-10-29');
  assert.equal(nextDay.ok, true, 'a new Bangkok day starts with a fresh allowance');
  assert.equal(secondsUntilBangkokMidnight(NIGHT_BANGKOK), 60);
});

test('the counter stores a count and a day, and nothing about the visitor', async () => {
  const db = fakeDb();
  await claimDailyCapacity(db, { cap: 10, now: NOON_BANGKOK });
  const row = db.days.get('2026-10-28');
  assert.deepEqual(Object.keys(row).sort(), ['n', 'updated_at']);
  assert.equal(typeof row.n, 'number');
  // The only values ever bound into the counter are the day and a timestamp.
  const bound = db.statements.flatMap((s) => s.args);
  for (const value of bound) {
    assert.ok(
      typeof value === 'number' || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)),
      `the counter was bound with something that is not a day or a timestamp: ${JSON.stringify(value)}`,
    );
  }
  const src = readFileSync(new URL('../worker/pageview-caps.ts', import.meta.url), 'utf8');
  // Strip the comments: the module is allowed to NAME the thing it refuses
  // (the comments say "the raw connecting address" when explaining why PR12
  // was held). What it must not do is use one.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
  assert.doesNotMatch(
    code,
    /\bip\b|address|user.?agent|x-forwarded|connecting-ip|cf-connecting/i,
    'the cap module must not read or store anything that identifies a visitor',
  );
  // The strongest form of the rule: the function is never handed a request.
  assert.doesNotMatch(
    code,
    /headers|get\(["']CF-Connecting-IP|Request\b/,
    'the cap must not be given anything it could derive an address from',
  );
  assert.match(code, /export async function claimDailyCapacity\(\s*db: D1Database,\s*opts:/);
});

test('the counter table is pruned, so it cannot grow without bound', async () => {
  const db = fakeDb();
  await claimDailyCapacity(db, { cap: 10, now: NOON_BANGKOK });
  assert.ok(
    db.statements.some((s) => /DELETE FROM pageview_daily WHERE day < \?/i.test(s.sql)),
    'the cap never prunes the counter table',
  );
  assert.ok(CAP_RETENTION_DAYS > 0 && CAP_RETENTION_DAYS <= 30);
});

test('the ceiling is a number a deployment chooses, not one a pull request can raise', async () => {
  assert.equal(parseCap(undefined), DEFAULT_DAILY_CAP);
  assert.equal(parseCap(''), DEFAULT_DAILY_CAP);
  assert.equal(parseCap('not-a-number'), DEFAULT_DAILY_CAP);
  assert.equal(parseCap('0'), DEFAULT_DAILY_CAP);
  assert.equal(parseCap('-5'), DEFAULT_DAILY_CAP);
  assert.equal(parseCap('250'), 250);
  const workerSrc = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
  assert.match(workerSrc, /PAGEVIEW_DAILY_CAP\?: string/);
  assert.ok(
    !/"PAGEVIEW_DAILY_CAP"\s*:/.test(workerSrc),
    'the ceiling is hard-coded in the Worker; it must come from the environment',
  );
});

test('the Worker claims the ceiling before it writes a page view', () => {
  const src = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
  const route = src.slice(src.indexOf('if (url.pathname === "/api/pageview"'), src.indexOf('// Live civic feeds.'));
  assert.ok(
    route.indexOf('claimDailyCapacity(env.DB') < route.indexOf('recordPageview(env.DB'),
    'the page view is written before the ceiling is claimed',
  );
  assert.ok(
    route.indexOf('readPageviewRequest(request)') < route.indexOf('claimDailyCapacity(env.DB'),
    'the ceiling is claimed before the request is even validated',
  );
  assert.match(route, /status: 429/);
});

test('the built Worker answers 429 and writes no page view once the day is full', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  let pageviewWrites = 0;
  let counter = 0;
  const db = {
    async batch() {},
    prepare(sql) {
      if (/INSERT INTO pageviews/i.test(sql)) {
        return { bind() { return { async run() { pageviewWrites++; } }; } };
      }
      if (/INSERT INTO pageview_daily/i.test(sql)) {
        return { bind() { return { async first() { counter++; return { n: counter }; } }; } };
      }
      return { bind() { return { async run() {} }; }, async run() {} };
    },
  };
  const request = () => new Request('https://bkkx-site.drnon.workers.dev/api/pageview', {
    method: 'POST',
    headers: { origin: 'https://bkk.nonarkara.org', 'content-type': 'application/json' },
    body: JSON.stringify({ path: '/worlds' }),
  });
  // The environment's ceiling is one, so the second request in the day is
  // over it. The first must be recorded; the second must not be.
  const first = await worker.fetch(request(), { DB: db, PAGEVIEW_DAILY_CAP: '1' }, ctx);
  const second = await worker.fetch(request(), { DB: db, PAGEVIEW_DAILY_CAP: '1' }, ctx);
  assert.equal(first.status, 201);
  assert.equal(second.status, 429);
  assert.equal(pageviewWrites, 1, 'a page view was written past the ceiling');
  assert.equal(second.headers.get('retry-after') !== null, true);
  assert.equal(second.headers.get('cache-control'), 'no-store');
});

test('the Bangkok day is the city\'s, not the server\'s', () => {
  assert.equal(bangkokDay(NOON_BANGKOK), '2026-10-28');
  // 2026-10-28T17:30:00Z is 2026-10-29 00:30 in Bangkok.
  assert.equal(bangkokDay(Date.parse('2026-10-28T17:30:00.000Z')), '2026-10-29');
});
