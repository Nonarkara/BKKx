import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const DETAIL = JSON.parse(
  readFileSync(new URL('../public/data/bkk-heritage-detail.geojson', import.meta.url), 'utf8'),
);
const LANDMARKS = JSON.parse(
  readFileSync(new URL('../public/data/bkk-landmarks.geojson', import.meta.url), 'utf8'),
);

const SPIRE_NAME = /เจดีย์|ปรางค์|มณฑป|ปราสาท|พระที่นั่ง/;
const HALL_NAME = /วิหาร|อุโบสถ/;

function heightOf(p) {
  for (const k of ['render_height', 'height']) {
    const v = Number(p[k]);
    if (v > 0) return v;
  }
  return 0;
}

function narrowSideM(geom) {
  const ring =
    geom.type === 'Polygon' ? geom.coordinates[0] : geom.coordinates[0][0];
  const xs = ring.map((c) => c[0]);
  const ys = ring.map((c) => c[1]);
  const lat = ys.reduce((a, b) => a + b, 0) / ys.length;
  return Math.min(
    (Math.max(...xs) - Math.min(...xs)) * 111320 * Math.cos((lat * Math.PI) / 180),
    (Math.max(...ys) - Math.min(...ys)) * 110540,
  );
}

function isSlender(f) {
  const p = f.properties || {};
  const g = f.geometry || {};
  const name = p.name || '';
  if (
    g.type !== 'Polygon' &&
    g.type !== 'MultiPolygon'
  ) return false;
  if (!SPIRE_NAME.test(name) || HALL_NAME.test(name)) return false;
  return heightOf(p) > 1.5 * narrowSideM(g);
}

function checkSlender(features, label) {
  for (const f of features) {
    const p = f.properties || {};
    const expected = isSlender(f);
    const actual = p.slender === true;
    assert.equal(
      actual,
      expected,
      `${label} "${p.name || 'NONAME'}": slender=${actual} but geometry says ${expected}`,
    );
  }
}

test('every slender-flagged feature meets the slender criteria', () => {
  checkSlender(DETAIL.features, 'detail');
  checkSlender(LANDMARKS.features, 'landmark');
});

test('every feature meeting the slender criteria is flagged', () => {
  checkSlender(DETAIL.features, 'detail');
  checkSlender(LANDMARKS.features, 'landmark');
});

test('unnamed buildings are never slender', () => {
  for (const f of [...DETAIL.features, ...LANDMARKS.features]) {
    const p = f.properties || {};
    if (!p.name) {
      assert.notEqual(p.slender, true, `unnamed feature ${f.id} should not be slender`);
    }
  }
});

test('viharns and ubosots are never slender', () => {
  for (const f of [...DETAIL.features, ...LANDMARKS.features]) {
    const p = f.properties || {};
    const name = p.name || '';
    if (HALL_NAME.test(name)) {
      assert.notEqual(
        p.slender,
        true,
        `hall "${name}" should not be slender`,
      );
    }
  }
});

test('slender features draw as pads at 2 m', () => {
  for (const f of [...DETAIL.features, ...LANDMARKS.features]) {
    const p = f.properties || {};
    if (p.slender === true) {
      assert.ok(
        SPIRE_NAME.test(p.name || ''),
        `slender "${p.name || 'NONAME'}" has a spire name`,
      );
      assert.ok(
        !HALL_NAME.test(p.name || ''),
        `slender "${p.name || 'NONAME'}" is not a hall`,
      );
    }
  }
});
