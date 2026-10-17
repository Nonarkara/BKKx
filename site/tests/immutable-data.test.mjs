import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Runs after `npm run build`, which runs data:publish.
const site = new URL('..', import.meta.url).pathname;
const pub = join(site, 'public');
const { files } = JSON.parse(readFileSync(join(site, 'app/data/data-urls.json'), 'utf8'));

test('every pointer names a copy whose folder is the hash of the file it stands for', () => {
  assert.ok(Object.keys(files).length >= 10);
  for (const [stable, versioned] of Object.entries(files)) {
    const src = readFileSync(join(pub, stable));
    const hash = createHash('sha256').update(src).digest('hex').slice(0, 12);
    assert.equal(versioned, `/data/v/${hash}/${stable.split('/').pop()}`, `${stable} pointer is stale — run npm run data:publish`);
    assert.ok(existsSync(join(pub, versioned)), `${versioned} missing`);
    assert.ok(src.equals(readFileSync(join(pub, versioned))), `${versioned} differs from ${stable}`);
  }
});

test('the stable paths still exist for /datasets and anyone linking to them', () => {
  for (const stable of Object.keys(files)) assert.ok(statSync(join(pub, stable)).isFile());
});

test('_headers caches the versioned copies and keeps vinext\'s /assets rule', () => {
  const h = readFileSync(join(pub, '_headers'), 'utf8');
  for (const rule of ['/assets/*', '/data/v/*']) {
    const block = h.split(/\n(?=\/)/).find((b) => b.startsWith(rule));
    assert.ok(block, `${rule} rule missing`);
    assert.match(block, /Cache-Control: public, max-age=31536000, immutable/);
  }
  const built = join(site, 'dist/client/_headers');
  if (existsSync(built)) assert.equal(readFileSync(built, 'utf8'), h, 'the build must ship our _headers, not vinext\'s');
});

test('map code loads listed files only through dataUrl(); download links stay stable', () => {
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : /\.(tsx?|mjs)$/.test(e.name) ? [join(d, e.name)] : []);
  // datasets.ts is the download catalogue: it links the stable paths on purpose.
  const sources = walk(join(site, 'app')).filter((f) => !f.endsWith('data/datasets.ts'));
  for (const f of sources) {
    const text = readFileSync(f, 'utf8');
    for (const stable of Object.keys(files)) {
      let i = text.indexOf(`"${stable}"`);
      while (i !== -1) {
        // A download link keeps the stable path on purpose; a fetch or a map source must not.
        const before = text.slice(Math.max(0, i - 8), i);
        assert.ok(before === 'dataUrl(' || before.endsWith('href='), `${f.replace(site, '')} loads ${stable} without dataUrl()`);
        i = text.indexOf(`"${stable}"`, i + 1);
      }
    }
  }
});
