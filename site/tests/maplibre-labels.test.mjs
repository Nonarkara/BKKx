import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ATLAS_SRC = readFileSync(
  fileURLToPath(new URL('../app/atlas/[district]/AtlasView.tsx', import.meta.url)),
  'utf8',
);
const WORKER_SRC = readFileSync(
  fileURLToPath(new URL('../worker/live.ts', import.meta.url)),
  'utf8',
);

/**
 * Pull out every map.addLayer({...}) block by brace matching, so a guard
 * reads the layer as the author wrote it rather than as a text match.
 */
function addLayerBlocks(src) {
  const blocks = [];
  const re = /addLayer\(\s*\{/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    let i = m.index + m[0].length - 1; // at the opening brace
    let depth = 0;
    let end = i;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    blocks.push(src.slice(m.index, end + 1));
    re.lastIndex = end;
  }
  return blocks;
}

test('every symbol layer that draws text declares a font stack', () => {
  const blocks = addLayerBlocks(ATLAS_SRC);
  const textLayers = blocks.filter(
    (b) => /type:\s*["']symbol["']/.test(b) && /["']text-field["']/.test(b),
  );
  assert.ok(textLayers.length >= 4, `expected several labelled layers, found ${textLayers.length}`);

  for (const b of textLayers) {
    const id = (b.match(/id:\s*["']([^"']+)["']/) || [])[1] || '(unnamed)';
    assert.ok(
      /["']text-font["']/.test(b),
      `layer "${id}" sets text-field but no text-font: MapLibre then falls back to its default
       stack (Open Sans Regular, Arial Unicode MS Regular), which the OpenFreeMap glyph
       server answers 404 — the label silently never draws.`,
    );
  }
});

test('the declared font stack is the one the base style serves', () => {
  // The OpenFreeMap dark style uses "Noto Sans Regular" and its glyph server
  // answers 200 for that stack (read 2026-10-23) and 404 for MapLibre's
  // default stack. A label must name the style's own font.
  const stacks = [...ATLAS_SRC.matchAll(/["']text-font["']\s*:\s*\[([^\]]+)\]/g)].map((m) =>
    m[1].replace(/["']/g, '').trim(),
  );
  assert.ok(stacks.length > 0, 'no text-font declared anywhere in the atlas');
  for (const s of stacks) {
    assert.equal(
      s,
      'Noto Sans Regular',
      `font stack "${s}" is not the stack the OpenFreeMap glyph server serves`,
    );
  }
});

test('the atlas reads live weather through our own Worker, not from Open-Meteo', () => {
  // worker/live.ts states the rule: a direct call hands every visitor's IP to
  // a third party, and this project will not collect that itself.
  assert.ok(
    !/api\.open-meteo\.com/.test(ATLAS_SRC),
    'the atlas calls api.open-meteo.com directly — every visitor\'s IP leaves the origin',
  );
  assert.ok(
    !/air-quality-api\.open-meteo\.com/.test(ATLAS_SRC),
    'the atlas calls the Open-Meteo air-quality host directly',
  );
  assert.ok(
    /fetch\(\s*["'`]\/api\/live\/weather["'`]/.test(ATLAS_SRC),
    'the atlas no longer reads live weather from /api/live/weather',
  );
});

test('the Worker exposes the weather code the atlas needs', () => {
  // weather_code is fetched upstream; if the Worker drops it the atlas has no
  // way to pick a sky icon without calling Open-Meteo itself.
  assert.ok(/weather_code/.test(WORKER_SRC), 'the Worker no longer asks for weather_code');
  assert.ok(
    /weatherCode:\s*num\(forecast\?\.weather_code\)/.test(WORKER_SRC),
    'the Worker fetches weather_code but does not put it in the payload',
  );
  assert.ok(
    /weatherCode\??:\s*number\s*\|\s*null/.test(WORKER_SRC),
    'the WeatherPayload type does not declare weatherCode',
  );
});
