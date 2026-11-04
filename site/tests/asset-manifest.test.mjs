import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fixAssetManifest } from '../scripts/fix-asset-manifest.mjs';

// The script that repairs the RSC preload manifest had a hard-coded path:
// `dist/client/assets`. vinext 1.x moved the client statics to
// `dist/client/_next/static`, and every dependency PR carrying that bump
// failed the build with "no dist/client/assets — run the build first" — a
// failure that reads like a dependency problem and is not one.
//
// These cases pin the behaviour to the layout, not to a path.

function tree(layout, manifestBody, extra = []) {
  const root = mkdtempSync(join(tmpdir(), 'bkkx-manifest-'));
  for (const file of layout) {
    const full = join(root, 'dist/client', file);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, '// chunk\n');
  }
  for (const file of extra) {
    const full = join(root, 'dist/client', file);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, '// chunk\n');
  }
  const manifestPath = join(root, 'dist/server/__vite_rsc_assets_manifest.js');
  mkdirSync(join(manifestPath, '..'), { recursive: true });
  writeFileSync(manifestPath, manifestBody);
  return { root, manifestPath };
}

const ask = (path) => `export const m=["${path}"];\n`;

test('it repairs a missing chunk in the current layout', () => {
  const { root, manifestPath } = tree(
    ['assets/maplibre-gl-BjusSPiM.js'],
    ask('assets/maplibre-gl-B3EYWl7f.js'),
  );
  const result = fixAssetManifest(root);
  assert.equal(result.fixed, 1);
  assert.match(readFileSync(manifestPath, 'utf8'), /assets\/maplibre-gl-BjusSPiM\.js/);
});

test('it repairs a missing chunk when vinext moves the statics', () => {
  const { root, manifestPath } = tree(
    ['_next/static/maplibre-gl-BjusSPiM.js'],
    ask('_next/static/maplibre-gl-B3EYWl7f.js'),
  );
  const result = fixAssetManifest(root);
  assert.equal(result.fixed, 1);
  assert.match(readFileSync(manifestPath, 'utf8'), /_next\/static\/maplibre-gl-BjusSPiM\.js/);
});

test('it rewrites into the directory the chunk actually sits in', () => {
  // The manifest asks for one directory and the chunk lives in another; the
  // repair must land on the real path, or the 404 it replaces comes back.
  const { root, manifestPath } = tree(
    ['_next/static/chunks/maplibre-gl-BjusSPiM.js'],
    ask('assets/maplibre-gl-B3EYWl7f.js'),
  );
  fixAssetManifest(root);
  assert.match(readFileSync(manifestPath, 'utf8'), /_next\/static\/chunks\/maplibre-gl-BjusSPiM\.js/);
});

test('it leaves an entry that already exists alone', () => {
  const { root, manifestPath } = tree(
    ['assets/maplibre-gl-BjusSPiM.js'],
    ask('assets/maplibre-gl-BjusSPiM.js'),
  );
  const result = fixAssetManifest(root);
  assert.equal(result.fixed, 0);
  assert.equal(result.skipped, 0);
  assert.match(readFileSync(manifestPath, 'utf8'), /assets\/maplibre-gl-BjusSPiM\.js/);
});

test('it refuses to guess when two chunks match', () => {
  // A wrong rewrite is worse than the 404 it replaces, so ambiguity means the
  // entry stays as it is and the script says so.
  const { root, manifestPath } = tree(
    ['assets/maplibre-gl-BjusSPiM.js'],
    ask('assets/maplibre-gl-B3EYWl7f.js'),
    ['assets/maplibre-gl-QqwerTYu.js'],
  );
  const result = fixAssetManifest(root);
  assert.equal(result.fixed, 0);
  assert.equal(result.skipped, 1);
  assert.match(readFileSync(manifestPath, 'utf8'), /maplibre-gl-B3EYWl7f/);
});
test('it fails loudly when there is no client build at all', () => {
  const root = mkdtempSync(join(tmpdir(), 'bkkx-manifest-empty-'));
  assert.throws(() => fixAssetManifest(root));
});
