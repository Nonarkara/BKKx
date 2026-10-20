import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMapLibre } from '../app/atlas/[district]/maplibre-runtime.ts';

test('MapLibre accepts default and namespace bundles, not an absent runtime', () => {
  const runtime = { Map: class Map {}, Marker: class Marker {} };
  assert.equal(resolveMapLibre({ default: runtime }), runtime);
  assert.equal(resolveMapLibre(runtime), runtime);
  assert.equal(resolveMapLibre({ default: undefined, ...runtime }).Map, runtime.Map);
  assert.throws(() => resolveMapLibre({}), /runtime unavailable/);
});
