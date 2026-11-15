import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { emitMapLibreWorker } from '../scripts/emit-maplibre-worker.mjs';

// MapLibre 6 spawns its web worker as a SIBLING of the module that starts it:
//
//   new URL(`./maplibre-gl-worker.mjs`, import.meta.url)
//
// The bundler does not emit that file — nothing imports it by name — so the
// browser asks for a path that is not there. The worker 404s, MapLibre says
// "Worker failed to load", and every map on the site becomes a grey
// rectangle: 2,647 WebGL draw calls before, 93 after.
//
// These cases hold the placement, and hold the FAILURE: a build that refers
// to a worker it cannot place must not go green.

/** A fake built tree: one chunk, and optionally a fake package worker. */
function tree({ chunkName = 'CHkVEz81.js', chunkBody = 'maplibre-gl-worker.mjs', withWorker = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'bkkx-worker-'));
  const chunkDir = join(root, 'dist/client/_next/static/chunks');
  mkdirSync(chunkDir, { recursive: true });
  writeFileSync(join(chunkDir, chunkName), `// chunk\nconst t = ${JSON.stringify(chunkBody)};\n`);
  const pkg = join(root, 'node_modules/maplibre-gl/dist');
  mkdirSync(pkg, { recursive: true });
  if (withWorker) {
    writeFileSync(join(pkg, 'maplibre-gl-worker.mjs'), '// worker\n');
    writeFileSync(join(pkg, 'maplibre-gl-worker-dev.mjs'), '// worker dev\n');
  }
  return { root, chunkDir };
}

test('it places the worker next to the chunk that refers to it', () => {
  const { root, chunkDir } = tree();
  const result = emitMapLibreWorker(root);
  const placed = join(chunkDir, 'maplibre-gl-worker.mjs');
  assert.ok(existsSync(placed), 'the worker must sit beside the chunk that spawns it');
  assert.equal(result.placed.length, 1);
  assert.match(result.placed[0].target, /_next\/static\/chunks\/maplibre-gl-worker\.mjs$/);
});

test('it places the worker wherever the chunk is, not at an assumed path', () => {
  // The layout moved once already — dist/client/assets to
  // dist/client/_next/static — and assuming a path is what broke every
  // dependency PR in this repo before. The chunk decides.
  const { root } = tree();
  const moved = join(root, 'dist/client/_next/static/chunks');
  const elsewhere = join(root, 'dist/client/other/place');
  mkdirSync(elsewhere, { recursive: true });
  writeFileSync(join(elsewhere, 'XyZ12.js'), 'const t = "maplibre-gl-worker.mjs";\n');
  const result = emitMapLibreWorker(root);
  assert.ok(existsSync(join(elsewhere, 'maplibre-gl-worker.mjs')));
  assert.ok(existsSync(join(moved, 'maplibre-gl-worker.mjs')));
  assert.equal(result.referrers.length, 2);
});

test('it does not ship the dev worker to production readers', () => {
  // The dev worker is 1.2 MB and the chunk names it only in a ternary it
  // never takes outside a dev build.
  const { root, chunkDir } = tree();
  emitMapLibreWorker(root);
  assert.ok(!existsSync(join(chunkDir, 'maplibre-gl-worker-dev.mjs')));
});

test('a dev module gets the dev worker', () => {
  const { root, chunkDir } = tree({ chunkName: 'abc-dev.mjs' });
  emitMapLibreWorker(root);
  assert.ok(existsSync(join(chunkDir, 'maplibre-gl-worker-dev.mjs')));
});

test('it fails the build when a chunk refers to a worker it cannot place', () => {
  const { root } = tree({ withWorker: false });
  assert.throws(() => emitMapLibreWorker(root), /not placed/);
});

test('a build with no MapLibre chunk needs no worker', () => {
  const { root } = tree();
  const other = join(root, 'dist/client/_next/static/chunks/Other.js');
  writeFileSync(other, '// no maplibre here\n');
  // Remove the reference by rewriting the only chunk that had it.
  writeFileSync(join(root, 'dist/client/_next/static/chunks/CHkVEz81.js'), '// nothing\n');
  const result = emitMapLibreWorker(root);
  assert.equal(result.placed.length, 0);
  assert.equal(result.referrers.length, 0);
});

test('the build script emits the worker before it stamps the build', () => {
  // Order matters: a stamped build that cannot load its map is worse than
  // an unstamped one, because the stamp is the thing that says what shipped.
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  const build = pkg.scripts.build;
  assert.ok(build.includes('emit-maplibre-worker.mjs'), 'the build must emit the MapLibre worker');
  assert.ok(
    build.indexOf('emit-maplibre-worker.mjs') < build.indexOf('stamp-build-id.mjs'),
    'the worker must be emitted before the build is stamped',
  );
});
