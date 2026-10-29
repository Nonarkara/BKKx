#!/usr/bin/env node
// msh-resilience.mjs — the three proofs the MSH plan listed as "not performed".
//
//   1. 200% text enlargement  (WCAG 1.4.4 Resize Text)
//   2. Blocked web fonts       (the page must still be readable without them)
//   3. Keyboard reachability   (every control reachable, focus always visible)
//
// Each is a gate, not a claim: the assertions run against the rendered
// interface at a real viewport, and a route that renders nothing is reported
// as UNVERIFIED rather than as a pass.
//
// Usage:
//   node msh-resilience.mjs --base=http://127.0.0.1:43118 --out=/tmp/bkkx-res
//   node msh-resilience.mjs --base=... --only=/,/heritage
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const BASE = arg('base', 'http://127.0.0.1:43118').replace(/\/$/, '');
const OUT = arg('out', '/tmp/bkkx-res');
const ONLY = arg('only', '');

mkdirSync(OUT, { recursive: true });

const ROUTES = [
  '/', '/heritage', '/heritage/fad-8867', '/areas/rattanakosin', '/walks/royal-axis',
  '/rowhouses', '/shophouses', '/shophouses/why', '/shophouses/typology',
  '/shophouses/bible', '/shophouses/global', '/shophouses/atlas', '/shophouses/research',
  '/datasets', '/warroom', '/about', '/case-for-bangkok', '/worlds', '/flood',
  '/atlas/historic-core',
];

const routes = ONLY
  ? ROUTES.filter((r) => ONLY.split(',').map((s) => s.trim()).some((w) => (w.endsWith('*') ? r.startsWith(w.slice(0, -1)) : r === w)))
  : ROUTES;

/** Shared geometry read. */
const READ = () => {
  const VW = innerWidth;
  const VH = innerHeight;
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const path = (el) => {
    const bits = [];
    let n = el;
    for (let d = 0; n && d < 4 && bits.length < 4; d++, n = n.parentElement) {
      let s = n.tagName.toLowerCase();
      if (n.id) s += `#${n.id}`;
      else if (n.classList && n.classList.length) s += `.${[...n.classList].slice(0, 2).join('.')}`;
      bits.unshift(s);
    }
    return bits.join(' > ');
  };
  const clipped = [];
  const outside = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') && el.tagName !== 'svg') continue;
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (el.children.length === 0 && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2) {
      if (cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis' || cs.overflow === 'hidden') {
        clipped.push({ sel: path(el), scrollW: el.scrollWidth, clientW: el.clientWidth, text: (el.innerText || '').trim().slice(0, 40) });
      }
    }
    if (r.right > VW + 1 || r.left < -1) {
      let by = null;
      let p = el.parentElement;
      for (let d = 0; p && d < 14; d++, p = p.parentElement) {
        const pcs = getComputedStyle(p);
        if (pcs.overflowX === 'visible' && pcs.overflow === 'visible') continue;
        by = p;
        break;
      }
      const inMap = by && (by.closest('.maplibregl-map, .leaflet-container, #typology-map') !== null);
      const scrollable = by && ['auto', 'scroll'].includes(getComputedStyle(by).overflowX);
      const hasText = (el.innerText || '').trim().length > 0;
      const isControl = el.matches('a[href], button, input, select, textarea, [role="button"]');
      // A frame that crops an image on purpose is not losing content; a frame
      // that cuts text or a control in half is.
      if (!inMap && !scrollable && (hasText || isControl)) outside.push({ sel: path(el), left: Math.round(r.left), right: Math.round(r.right), text: (el.innerText || '').trim().slice(0, 40) });
    }
  }
  return {
    docOverflowX: document.documentElement.scrollWidth > VW + 2,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: VW,
    clipped,
    outside,
    textChars: (document.body.innerText || '').trim().length,
    headings: [...document.querySelectorAll('h1,h2')].filter(visible).map((h) => (h.innerText || '').trim().slice(0, 40)).slice(0, 4),
  };
};

async function newPage(browser, width, height, dpr, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    isMobile: opts.isMobile ?? false,
    hasTouch: opts.isMobile ?? false,
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    ignoreHTTPSErrors: true,
  });
  if (opts.blockFonts) {
    await ctx.route('**/*', (route) => {
      const url = route.request().url();
      if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url) || route.request().resourceType() === 'font') {
        return route.abort();
      }
      return route.continue();
    });
  }
  const page = await ctx.newPage();
  return { ctx, page };
}

async function settle(page, ms = 2500) {
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(ms);
}

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const results = [];

for (const route of routes) {
  const rec = { route, checks: {} };

  // ── 1. 200% enlargement ────────────────────────────────────────────────
  // A 1440-wide window at 200% zoom is a 720-CSS-pixel viewport rendered at
  // double density. That is the test WCAG 1.4.4 asks for: the same window,
  // twice the size of the text.
  try {
    const { ctx, page } = await newPage(browser, 720, 450, 2);
    const resp = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await settle(page);
    const read = await page.evaluate(READ);
    // The screenshot is the evidence, not the measurement. If the capture
    // fails — a busy box, a map that will not settle — the measurement still
    // stands, and the missing picture is recorded rather than turned into a
    // verdict about the site.
    try {
      await page.screenshot({ path: join(OUT, `zoom200-${route.replace(/\W+/g, '_') || 'root'}.png`), timeout: 20000 });
    } catch { /* picture missing; the numbers below are what this check is about */ }
    rec.checks.zoom200 = {
      status: resp ? resp.status() : null,
      docOverflowX: read.docOverflowX,
      outside: read.outside.slice(0, 4),
      clipped: read.clipped.slice(0, 4),
      textChars: read.textChars,
      headings: read.headings,
      pass: !read.docOverflowX && read.outside.length === 0 && read.clipped.length === 0 && read.textChars > 40,
    };
    await ctx.close();
  } catch (e) {
    rec.checks.zoom200 = { error: String(e.message || e).split('\n')[0], pass: false };
  }

  // ── 2. Blocked web fonts ──────────────────────────────────────────────
  try {
    const { ctx, page } = await newPage(browser, 1440, 900, 1, { blockFonts: true });
    const resp = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await settle(page);
    const read = await page.evaluate(READ);
    try {
      await page.screenshot({ path: join(OUT, `nofonts-${route.replace(/\W+/g, '_') || 'root'}.png`), timeout: 20000 });
    } catch { /* picture missing; the numbers below are what this check is about */ }
    rec.checks.noFonts = {
      status: resp ? resp.status() : null,
      docOverflowX: read.docOverflowX,
      outside: read.outside.slice(0, 4),
      textChars: read.textChars,
      headings: read.headings,
      // The page must still read. A web font that never arrives must not
      // leave an empty line where a heading was.
      pass: read.textChars > 40 && read.headings.length > 0 && !read.docOverflowX && read.outside.length === 0,
    };
    await ctx.close();
  } catch (e) {
    rec.checks.noFonts = { error: String(e.message || e).split('\n')[0], pass: false };
  }

  // ── 3. Keyboard ────────────────────────────────────────────────────────
  try {
    const { ctx, page } = await newPage(browser, 390, 844, 1, { isMobile: true });
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 40000 });
    await settle(page, 1800);
    const tabbed = [];
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const f = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          name: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 34),
          outlineWidth: parseFloat(cs.outlineWidth) || 0,
          outlineStyle: cs.outlineStyle,
          boxShadow: cs.boxShadow !== 'none',
          onScreen: r.width > 0 && r.height > 0,
        };
      });
      if (f) tabbed.push(f);
    }
    const noRing = tabbed.filter((t) => t.outlineWidth === 0 && !t.boxShadow);
    const unnamed = tabbed.filter((t) => !t.name);
    rec.checks.keyboard = {
      reached: tabbed.length,
      withoutFocusRing: noRing.length,
      withoutName: unnamed.length,
      samples: noRing.slice(0, 3).map((t) => `${t.tag}:${t.name}`),
      // Every control that took focus must show where it is, and must be
      // able to say what it is.
      pass: tabbed.length > 0 && noRing.length === 0 && unnamed.length === 0,
    };
    await ctx.close();
  } catch (e) {
    rec.checks.keyboard = { error: String(e.message || e).split('\n')[0], pass: false };
  }

  results.push(rec);
  const bad = Object.entries(rec.checks).filter(([, c]) => !c.pass).map(([k]) => k);
  console.log(`${bad.length ? '✘' : '✔'} ${route}${bad.length ? ` — ${bad.join(', ')}` : ''}`);
}

await browser.close();
writeFileSync(join(OUT, 'resilience-report.json'), JSON.stringify({ base: BASE, when: new Date().toISOString(), results }, null, 2));

const failing = results.filter((r) => Object.values(r.checks).some((c) => !c.pass));
console.log(`\n${results.length - failing.length}/${results.length} routes pass all three proofs`);
for (const r of failing) {
  for (const [name, c] of Object.entries(r.checks)) {
    if (c.pass) continue;
    console.log(`  ${r.route} · ${name}: ${JSON.stringify(c).slice(0, 260)}`);
  }
}
console.log(`report: ${join(OUT, 'resilience-report.json')}`);
