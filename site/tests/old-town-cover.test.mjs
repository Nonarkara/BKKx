import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HERITAGE_DETAIL_BBOX, OLD_TOWN_COVER, COVER_INSET_M, HIDE_FROM_ZOOM, baseBuildingFilter, insetCover } from '../app/atlas/[district]/old-town-cover.ts';

const detail = JSON.parse(readFileSync(new URL('../public/data/bkk-heritage-detail.geojson', import.meta.url), 'utf8'));

test('the cover follows the detail file it stands for', () => {
  // If the Old Town extract is regenerated with a new extent, the cover must
  // move with it, or base boxes vanish where nothing of ours replaces them.
  assert.deepEqual([...HERITAGE_DETAIL_BBOX], detail.bbox);
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const f of detail.features) for (const [x, y] of f.geometry.coordinates[0]) {
    w = Math.min(w, x); s = Math.min(s, y); e = Math.max(e, x); n = Math.max(n, y);
  }
  assert.deepEqual([w, s, e, n], detail.bbox, 'the file bbox is the true extent of its footprints');
});

test('the cover sits inside the extract, inset on every side', () => {
  const ring = OLD_TOWN_COVER.coordinates[0];
  assert.equal(ring.length, 5);
  assert.deepEqual(ring[0], ring[4]);
  const [w, s, e, n] = HERITAGE_DETAIL_BBOX;
  for (const [x, y] of ring) {
    assert.ok(x > w && x < e && y > s && y < n);
  }
  const insetLatM = (ring[0][1] - s) * 110540;
  assert.ok(Math.abs(insetLatM - COVER_INSET_M) < 0.5, `inset ${insetLatM} m`);
  assert.throws(() => insetCover(HERITAGE_DETAIL_BBOX, 5000));
});

test('base boxes hide only with Old Town 3D on, and only from the zoom the models draw', () => {
  assert.equal(baseBuildingFilter(false), null);
  const f = baseBuildingFilter(true);
  assert.deepEqual(f.slice(0, 4), ['step', ['zoom'], true, HIDE_FROM_ZOOM]);
  assert.ok(HIDE_FROM_ZOOM >= 13.5, 'the detail layer starts at z13.5');
  assert.deepEqual(f[4], ['>', ['distance', OLD_TOWN_COVER], 0]);
});
