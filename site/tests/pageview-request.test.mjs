import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { readPageviewRequest } from '../worker/pageview-request.ts';

function request(body, headers = {}, url = 'https://bkkx-site.drnon.workers.dev/api/pageview') {
  return new Request(url, { method: 'POST', headers: {
    origin: 'https://bkk.nonarkara.org', 'content-type': 'application/json', ...headers,
  }, body });
}
async function status(req, expected) {
  const result = await readPageviewRequest(req);
  assert.equal(result.ok, false);
  assert.equal(result.response.status, expected);
  assert.equal(result.response.headers.get('cache-control'), 'no-store');
}
test('pageview input rejects null, scalar, array, broken JSON and invalid fields', async () => {
  for (const body of ['null', '1', 'true', '"text"', '[]', '{', '{}', '{"path":42}', '{"path":"https://evil.test"}', '{"path":"//evil.test"}', '{"path":"/a\\\\b"}', '{"path":"/","referrer":{}}']) {
    await status(request(body), 400);
  }
});
test('pageview boundary accepts existing browser payload and minimizes stored URLs', async () => {
  const result = await readPageviewRequest(request(JSON.stringify({ path: '/worlds?token=private#secret', referrer: 'https://user:pass@example.test/private?q=secret#fragment' })));
  assert.deepEqual(result, { ok: true, path: '/worlds', referrer: 'https://example.test' });
  assert.deepEqual(await readPageviewRequest(request('{"path":"/","referrer":null}')), { ok: true, path: '/', referrer: null });
});
test('pageview origin is exact and a hostile Origin cannot use a trusted Referer', async () => {
  for (const source of ['null', '', 'https://bkk.nonarkara.org.evil.test', 'https://evil.test']) {
    await status(request('{"path":"/"}', { origin: source, referer: 'https://bkk.nonarkara.org/' }), 403);
  }
  await status(request('{"path":"/"}', { 'sec-fetch-site': 'cross-site' }), 403);
  const local = request('{"path":"/"}', { origin: 'http://localhost:3017' }, 'http://localhost:3017/api/pageview');
  assert.equal((await readPageviewRequest(local)).ok, true);
  await status(request('{"path":"/"}', { origin: 'http://localhost:3017' }), 403);
  const fallback = request('{"path":"/"}', { referer: 'https://bkk.nonarkara.org/worlds' });
  fallback.headers.delete('origin');
  assert.equal((await readPageviewRequest(fallback)).ok, true);
});
test('pageview body limit counts streamed bytes, not just Content-Length or characters', async () => {
  await status(request('{"path":"/"}', { 'content-type': 'text/plain' }), 415);
  await status(request('{"path":"/"}', { 'content-length': '5000' }), 413);
  await status(request(JSON.stringify({ path: '/', ignored: 'ก'.repeat(1500) })), 413);
  let cancelled = false;
  const stream = new ReadableStream({
    start(c) { c.enqueue(new Uint8Array(3000)); c.enqueue(new Uint8Array(2000)); },
    cancel() { cancelled = true; },
  });
  const req = new Request('https://bkkx-site.drnon.workers.dev/api/pageview', { method: 'POST', duplex: 'half', headers: { origin: 'https://bkk.nonarkara.org', 'content-type': 'application/json' }, body: stream });
  await status(req, 413);
  assert.equal(cancelled, true);
});
test('worker validates pageview requests before any D1 recording', () => {
  const src = readFileSync(new URL('../worker/index.ts', import.meta.url), 'utf8');
  const route = src.slice(src.indexOf('if (url.pathname === "/api/pageview"'), src.indexOf('// Live civic feeds.'));
  assert.ok(route.indexOf('readPageviewRequest(request)') < route.indexOf('recordPageview(env.DB'));
  assert.match(route, /if \(!body\.ok\) return body\.response/);
});

test('built Worker refuses bad requests without D1 and records a valid minimized payload', async () => {
  const { default: worker } = await import('../dist/server/index.js');
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const noDb = { get DB() { throw new Error('Rejected input must not access D1'); } };
  for (const [body, headers, expected] of [
    ['null', {}, 400], ['[]', {}, 400], ['{', {}, 400],
    ['{"path":"/"}', { origin: 'https://evil.test' }, 403],
    ['{"path":"/"}', { 'content-type': 'text/plain' }, 415],
    [JSON.stringify({ path: '/', extra: 'x'.repeat(4096) }), {}, 413],
  ]) {
    const response = await worker.fetch(request(body, headers), noDb, ctx);
    assert.equal(response.status, expected);
  }
  let recorded;
  const db = {
    async batch() {},
    prepare(sql) { return { bind(...args) {
      assert.match(sql, /INSERT INTO pageviews/);
      recorded = args;
      return { async run() {} };
    } }; },
  };
  const response = await worker.fetch(request('{"path":"/worlds?q=secret","referrer":"https://example.test/private?q=secret"}'), { DB: db }, ctx);
  assert.equal(response.status, 201);
  assert.deepEqual(recorded.slice(0, 2), ['/worlds', 'https://example.test']);
});
