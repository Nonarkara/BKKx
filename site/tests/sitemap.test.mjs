import assert from 'node:assert/strict';
import test from 'node:test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

// The sitemap is how a crawler learns what exists. A public page that is
// missing from it is a page nobody finds, and a page that says
// `robots: { index: false }` and is in it anyway is a page that promised not
// to be indexed.
//
// The useful assertion is not a list of URLs somebody typed — it is that every
// route on disk is accounted for: either listed, or explicitly a page that
// asked not to be. A new route added to the app and forgotten here fails this
// test, which is the point.
//
// app/sitemap.ts cannot be imported directly — it imports its data modules
// without file extensions, which is a bundler convention Node's resolver does
// not share — so this reads the module's source and its data files instead.

const APP_DIR = fileURLToPath(new URL('../app/', import.meta.url));
const SITE_DIR = fileURLToPath(new URL('../', import.meta.url));
const SITEMAP_SRC = readFileSync(join(APP_DIR, 'sitemap.ts'), 'utf8');

/** Routes that are deliberately not indexed, and the reason each one is not. */
const NOT_INDEXED = new Map([
  ['/warroom', 'the operational picture — a live console, not a document'],
  ['/shophouses/manuscript', 'a manuscript for print, not a web page'],
  ['/shophouses/print', 'the print edition'],
  ['/shophouses/fig/[id]', 'the figure export route, used by the export script'],
]);

/** The static paths the sitemap lists, read out of its source. */
const STATIC_PATHS = new Set(
  [...SITEMAP_SRC.matchAll(/^\s*"\/([^"]*)",$/gm)].map((m) => `/${m[1]}`),
);

function routeFiles(dir = APP_DIR, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'data' || entry.name === 'i18n') continue;
      routeFiles(full, out);
    } else if (entry.name === 'page.tsx') {
      out.push(full);
    }
  }
  return out;
}

/** '/areas/[slug]/page.tsx' -> '/areas/[slug]' */
function routeOf(file) {
  const rel = relative(APP_DIR, file).replace(/\\/g, '/');
  const route = rel.replace(/\/page\.tsx$/, '');
  return route === 'page.tsx' ? '/' : `/${route}`;
}

function readJson(...parts) {
  return JSON.parse(readFileSync(join(SITE_DIR, ...parts), 'utf8'));
}

test('the sitemap lists the public pages a visitor can reach', () => {
  for (const path of [
    '/heritage', '/rowhouses', '/about', '/case-for-bangkok', '/datasets', '/flood',
    '/shophouses', '/shophouses/why', '/shophouses/typology', '/shophouses/atlas',
    '/shophouses/bible', '/shophouses/global', '/shophouses/research',
  ]) {
    assert.ok(STATIC_PATHS.has(path), `${path} is a public page and is not in the sitemap`);
  }
  // The home page and /worlds are written as template literals, not as the
  // quoted list, so they are checked in the source instead.
  assert.match(SITEMAP_SRC, /url:\s*siteUrl,/);
  assert.match(SITEMAP_SRC, /\$\{siteUrl\}\/worlds/);
});

test('the sitemap does not list pages that asked not to be indexed', () => {
  for (const path of NOT_INDEXED.keys()) {
    const prefix = path.replace(/\/\[[^\]]+\]$/, '');
    assert.ok(!STATIC_PATHS.has(prefix), `${path} is marked noindex but appears in the sitemap`);
  }
});

test('every dynamic route family is mapped, and carries every member', () => {
  const places = readJson('app', 'data', 'heritage-places.json');
  const areas = places.areas?.length ?? 0;
  const walks = places.walks?.length ?? 0;
  const register = readJson('public', 'heritage-register.json');
  const registerCount = Array.isArray(register) ? register.length : (register.sites ?? register.records ?? []).length;
  const clusterSrc = readFileSync(join(APP_DIR, 'data', 'shophouse-spine-index.ts'), 'utf8');
  const clusters = (clusterSrc.match(/"slug":\s*"/g) || []).length;

  assert.ok(areas >= 9, `the sitemap claims nine quarters; the data has ${areas}`);
  assert.ok(walks >= 7, `the sitemap claims seven walks; the data has ${walks}`);
  assert.ok(registerCount >= 500, `the register has only ${registerCount} entries`);
  assert.ok(clusters >= 32, `the spine index has only ${clusters} clusters`);

  for (const [family, symbol] of [
    ['/areas/', 'AREAS'],
    ['/walks/', 'WALKS'],
    ['/heritage/', 'REGISTER_SITES'],
    ['/shophouses/cluster/', 'CLUSTER_RECORDS'],
    ['/atlas/', 'worlds'],
  ]) {
    assert.ok(
      SITEMAP_SRC.includes(`${symbol}.map`),
      `the sitemap does not map ${symbol}, so ${family} is not in it`,
    );
  }
});

test('every route on disk is either listed or deliberately unlisted', () => {
  const missing = [];
  for (const file of routeFiles()) {
    const route = routeOf(file);
    if (route.includes('[')) continue; // dynamic: covered above
    if (NOT_INDEXED.has(route)) continue;
    if (STATIC_PATHS.has(route)) continue;
    // The home page and /worlds are template literals in the source.
    if (route === '/' || route === '/worlds') continue;
    missing.push(route);
  }
  assert.deepEqual(
    missing,
    [],
    `these routes exist as pages but are in neither the sitemap nor the noindex list: ${missing.join(', ')}`,
  );
});

test('a noindex page really does carry the directive the sitemap relies on', () => {
  for (const route of NOT_INDEXED.keys()) {
    if (route.includes('[')) continue;
    const file = join(APP_DIR, route.slice(1), 'page.tsx');
    assert.ok(existsSync(file), `${route} is listed as noindex but has no page`);
    const src = readFileSync(file, 'utf8');
    assert.match(src, /robots:\s*\{\s*index:\s*false/, `${route} does not declare robots: { index: false }`);
  }
});
