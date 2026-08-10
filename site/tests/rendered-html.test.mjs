import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the Bangkok walkthrough", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Bangkok, block by block · BKKx<\/title>/i);
  assert.match(html, /Bangkok,/);
  assert.match(html, /block by block\./);
  assert.match(html, /Ratchathewi/);
  assert.match(html, /Historic Core/);
  assert.match(html, /Walk in 3D/);
  assert.match(html, /\/atlas\/ratchathewi/);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("renders the 3D atlas page for a district", async () => {
  const response = await render("/atlas/ratchathewi");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Ratchathewi — 3D atlas · BKKx<\/title>/i);
  assert.match(html, /Ratchathewi/);
  assert.match(html, /ราชเทวี/);
  assert.match(html, /Victory Monument/);
  assert.match(html, /Download world/);
  assert.match(html, /Walk in 3D|atlas-page|bkkx-marker/);
  assert.doesNotMatch(html, /Heritage\s*\([^)]*16|Historic context/);
});

test("limits Old Town context layers to Historic Core", async () => {
  const response = await render("/atlas/historic-core");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Heritage\s*\([^)]*16/);
  assert.match(html, /Historic context/);
  assert.match(html, /orientation only/i);
});

test("returns 404 for an unknown atlas district", async () => {
  const response = await render("/atlas/atlantis");
  assert.equal(response.status, 404);
});
