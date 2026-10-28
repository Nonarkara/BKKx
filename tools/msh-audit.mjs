#!/usr/bin/env node
// msh-audit.mjs — measure every public BKKx route against MSH §6.
//
// The law (docs/MSH-LAW.md, §6) requires five things per viewport, for the
// real interface, at 390 / 1024 / 1440:
//
//   chrome cost · task visibility · geometry failures · hierarchy · preservation
//
// "Source scans and successful builds cannot prove a visual pass." So this
// drives a real browser, measures the rendered geometry, and writes
// screenshots next to the numbers. A route that renders nothing is reported
// as UNVERIFIED, never as a pass.
//
// Usage:
//   node msh-audit.mjs --base=http://localhost:8788 --out=/tmp/bkkx-msh
//   node msh-audit.mjs --base=https://bkk.nonarkara.org --only=/,/heritage
//
// It vendors tools/slop-lint.mjs for the AI-slop half of the house rules and
// adds the MSH-specific measurements the linter does not make: what the
// chrome costs, whether the task is on the screen, what geometry failed, what
// the hierarchy is, and what survived the change.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { measure, score } from './slop-lint.mjs';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const BASE = arg('base', 'http://localhost:8788').replace(/\/$/, '');
const OUT = arg('out', '/tmp/bkkx-msh');
const ONLY = arg('only', '');
const SHOTS = args.includes('--shots');
const SETTLE = Number(arg('settle', '3500'));

const VIEWPORTS = [
  { name: 'phone', w: 390, h: 844 },
  { name: 'tablet', w: 1024, h: 900 },
  { name: 'desktop', w: 1440, h: 900 },
];

/**
 * What each route is FOR, and the selector for the information and the action
 * a visitor came for. MSH §6 asks whether "the primary information and
 * action are visible together" — that is a claim about a page's purpose, so
 * it cannot be answered by a generic selector.
 */
const TASKS = [
  { re: /^\/$/, label: 'the 3D heritage map', info: 'iframe, .maplibregl-map', action: 'a[href], button' },
  { re: /^\/heritage$/, label: 'the monument register', info: 'main', action: 'input, a[href^="/heritage/"]' },
  { re: /^\/heritage\//, label: 'one monument', info: 'main h1', action: 'a[href]' },
  { re: /^\/areas\//, label: 'one quarter', info: 'main h1', action: 'a[href], img' },
  { re: /^\/walks\//, label: 'one walk', info: 'main h1', action: 'a[href], .maplibregl-map' },
  { re: /^\/rowhouses/, label: 'the rowhouse atlas', info: 'main', action: 'a[href], .maplibregl-map' },
  { re: /^\/shophouses\/atlas/, label: 'the shophouse pressure map', info: '.maplibregl-map, main', action: '.maplibregl-map, a[href]' },
  { re: /^\/shophouses\/why/, label: 'the shophouse essay', info: 'main h1, article', action: 'a[href], figure, svg' },
  { re: /^\/shophouses\/typology/, label: 'the typology library', info: 'main h1', action: 'a[href], img' },
  { re: /^\/shophouses\/bible/, label: 'the reference artifacts', info: 'main h1', action: 'a[href], svg, canvas' },
  { re: /^\/shophouses\/cluster\//, label: 'one documented cluster', info: 'main h1', action: 'a[href], svg' },
  { re: /^\/shophouses\/fig\//, label: 'one figure', info: 'main h1, figure', action: 'a[href]' },
  { re: /^\/shophouses/, label: 'the shophouse research companion', info: 'main h1', action: 'a[href], svg' },
  { re: /^\/atlas\//, label: 'the 3D atlas', info: '.maplibregl-map, canvas, main', action: '.maplibregl-map, button' },
  { re: /^\/warroom/, label: 'the live war room', info: 'main', action: 'a[href], button, .maplibregl-map' },
  { re: /^\/datasets/, label: 'the dataset catalogue', info: 'main h1, table', action: 'a[href]' },
  { re: /^\/about/, label: 'why the project exists', info: 'main h1', action: 'a[href], img' },
  { re: /^\/case-for-bangkok/, label: 'the comparative dossier', info: 'main h1', action: 'a[href], table' },
  { re: /^\/worlds/, label: 'the generated worlds', info: 'main h1', action: 'a[href], img' },
  { re: /^\/flood/, label: 'the flood edition', info: 'main', action: 'a[href], button' },
];

function taskFor(pathname) {
  for (const t of TASKS) if (t.re.test(pathname)) return t;
  return { label: 'the page', info: 'main', action: 'a[href], button' };
}

/**
 * In-page measurement. One evaluate() call per viewport so the numbers and
 * the DOM state cannot drift apart.
 */
function mshMetrics() {
  const VW = innerWidth;
  const VH = innerHeight;
  const VA = VW * VH;
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

  // ── chrome cost ─────────────────────────────────────────────────────────
  // Stacked fixed/sticky bands, plus the page's own top band. The number that
  // matters is the combined footprint, including the gaps between them.
  const chromeEls = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 2 || r.width < VW * 0.5) continue;
    chromeEls.push({ el, r, cs });
  }
  // Group overlapping bands into rows so a header made of three stacked
  // elements is counted once, at its true height.
  const rows = [];
  for (const c of chromeEls.sort((a, b) => a.r.top - b.r.top || b.r.height - a.r.height)) {
    const row = rows.find((x) => c.r.top < x.bottom - 2 && c.r.bottom > x.top + 2);
    if (row) {
      row.top = Math.min(row.top, c.r.top);
      row.bottom = Math.max(row.bottom, c.r.bottom);
      row.els.push(c);
    } else {
      rows.push({ top: c.r.top, bottom: c.r.bottom, els: [c] });
    }
  }
  const topRows = rows.filter((r) => r.top < 220);
  const bottomRows = rows.filter((r) => r.bottom > VH - 90);
  const topPx = topRows.length ? Math.max(...topRows.map((r) => r.bottom)) : 0;
  const bottomPx = bottomRows.length ? Math.min(...bottomRows.map((r) => r.top)) : VH;
  const bottomH = bottomRows.length ? VH - Math.min(...bottomRows.map((r) => r.top)) : 0;
  // The non-sticky page header still costs the first screen.
  const headerEl = document.querySelector('header, [role="banner"]');
  const headerRect = headerEl && visible(headerEl) ? headerEl.getBoundingClientRect() : null;
  const pageHeaderPx = headerRect && headerRect.top < 12 ? headerRect.bottom : 0;
  const effectiveTop = Math.max(topPx, pageHeaderPx);

  // ── geometry failures ───────────────────────────────────────────────────
  // Element rects, not just documentElement.scrollWidth. The 2026-10-25 plan
  // recorded a 390px viewport whose children measured 673px wide while
  // scrollWidth reported no overflow — clipping masked the regression.
  const overflowing = [];
  const clipped = [];
  const smallTargets = [];
  const orphanGaps = [];
  const all = [...document.querySelectorAll('body *')];
  for (const el of all) {
    if (el.closest('svg') && el.tagName !== 'svg') continue;
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.right > VW + 1 || r.left < -1) {
      // Is an ancestor clipping it? Then the page "fits" but the content does not.
      let clippedBy = null;
      let p = el.parentElement;
      for (let d = 0; p && d < 12; d++, p = p.parentElement) {
        const pcs = getComputedStyle(p);
        if (pcs.overflowX !== 'visible' || pcs.overflow !== 'visible') { clippedBy = path(p); break; }
      }
      overflowing.push({
        sel: path(el),
        left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
        text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 48),
        clippedBy,
      });
    }
    if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
      const cs2 = cs;
      if (cs2.overflowX === 'hidden' || cs2.textOverflow === 'ellipsis' || cs2.overflow === 'hidden') {
        clipped.push({ sel: path(el), text: (el.innerText || '').trim().slice(0, 48), scrollW: el.scrollWidth, clientW: el.clientWidth });
      }
    }
    if (el.matches('a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])')) {
      if (r.width < 24 || r.height < 24) {
        smallTargets.push({ sel: path(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 32) });
      }
    }
  }

  // ── hierarchy ───────────────────────────────────────────────────────────
  const fontSizes = new Map();
  const heads = [];
  let textMass = 0;
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = tw.nextNode())) {
    const t = node.textContent.trim();
    if (!t || !node.parentElement) continue;
    if (node.parentElement.closest('script,style,noscript')) continue;
    const cs = getComputedStyle(node.parentElement);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const fs = Math.round(parseFloat(cs.fontSize) * 2) / 2;
    fontSizes.set(fs, (fontSizes.get(fs) || 0) + t.length);
    textMass += t.length;
  }
  for (const h of document.querySelectorAll('h1,h2,h3,h4')) {
    if (!visible(h)) continue;
    const r = h.getBoundingClientRect();
    heads.push({ tag: h.tagName, size: Math.round(parseFloat(getComputedStyle(h).fontSize)), top: Math.round(r.top), text: (h.innerText || '').trim().slice(0, 40) });
  }
  const sortedSizes = [...fontSizes.entries()].sort((a, b) => b[1] - a[1]);
  const winner = sortedSizes[0]?.[0] ?? null;
  const winnerShare = textMass ? +(sortedSizes[0][1] / textMass).toFixed(2) : 0;

  // ── what is on the first screen ─────────────────────────────────────────
  const onFirstScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < VH && r.bottom > 0 && r.width > 0 && r.height > 0;
  };

  // ── map / data share of the first screen ────────────────────────────────
  const mapSel = '.maplibregl-map, .leaflet-container, iframe[src*="atlas"], canvas';
  let mapArea = 0;
  let mapRect = null;
  for (const el of document.querySelectorAll(mapSel)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 120 || r.height < 80) continue;
    const a = Math.max(0, Math.min(r.right, VW) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, VH) - Math.max(r.top, 0));
    if (a > mapArea) { mapArea = a; mapRect = r; }
  }

  return {
    vw: VW, vh: VH,
    chrome: {
      topPx: Math.round(effectiveTop),
      topShare: +(effectiveTop / VH).toFixed(3),
      bottomPx: Math.round(bottomH),
      bottomShare: +(bottomH / VH).toFixed(3),
      combinedShare: +((effectiveTop + bottomH) / VH).toFixed(3),
      bands: rows.map((r) => ({ top: Math.round(r.top), height: Math.round(r.bottom - r.top), parts: r.els.length })),
    },
    geometry: {
      docOverflowX: document.documentElement.scrollWidth > VW + 2,
      overflowing: overflowing.slice(0, 12),
      overflowingCount: overflowing.length,
      clipped: clipped.slice(0, 10),
      clippedCount: clipped.length,
      smallTargets: smallTargets.slice(0, 10),
      smallTargetCount: smallTargets.length,
    },
    hierarchy: {
      distinctFontSizes: fontSizes.size,
      fontSizeHistogram: [...fontSizes.entries()].sort((a, b) => b[0] - a[0]).slice(0, 10).map(([s, m]) => ({ size: s, chars: m })),
      heads: heads.slice(0, 8),
      winnerSize: winner,
      winnerShare,
    },
    map: { share: +(mapArea / VA).toFixed(3), rect: mapRect ? { w: Math.round(mapRect.width), h: Math.round(mapRect.height), top: Math.round(mapRect.top) } : null },
    textChars: (document.body.innerText || '').length,
    firstScreenText: (() => {
      const tw2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n2, c = 0;
      while ((n2 = tw2.nextNode())) {
        const t = n2.textContent.trim();
        if (!t || !n2.parentElement) continue;
        const r = n2.parentElement.getBoundingClientRect();
        if (r.top < VH && r.bottom > 0 && r.width > 0) c += t.length;
      }
      return c;
    })(),
  };
}

async function measureRoute(browser, path, shotDir) {
  const task = taskFor(path);
  const result = { path, task: task.label, viewports: {} };
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
      isMobile: vp.w < 500,
      hasTouch: vp.w < 500,
      locale: 'th-TH',
      timezoneId: 'Asia/Bangkok',
      ignoreHTTPSErrors: true,
    });
    const page = await ctx.newPage();
    const rec = { viewport: `${vp.w}x${vp.h}` };
    try {      const resp = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 40000 });
      rec.status = resp ? resp.status() : null;
      // A map page never goes network-idle (tiles keep arriving), so the wait
      // is capped. What replaces it: the fonts must be ready, and the frame
      // must have had a moment to paint. The pixel stats below say whether
      // the map actually rendered, so a screenshot that caught an empty
      // canvas is visible in the evidence rather than hidden.
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      await page.evaluate(() => document.fonts?.ready).catch(() => {});
      await page.waitForTimeout(SETTLE);
      rec.finalUrl = page.url();

      const msh = await page.evaluate(mshMetrics);
      const { dom, shot } = await measure(page);
      rec.msh = msh;
      rec.slop = { score: dom.score ?? null, points: dom.points ?? null, hits: dom.hits ?? null };
      rec.pixels = { flatShare: dom.flatShare, largestFlatRegion: dom.largestFlatRegion, meanLum: dom.meanLum };
      rec.dom = {
        boxesMeasured: dom.boxesMeasured, inflatedBoxes: dom.inflatedBoxes, statTilesStretched: dom.statTilesStretched,
        wideChips: dom.wideChips, shadows: dom.shadows, gradients: dom.gradients, glassBlur: dom.glassBlur,
        pills: dom.pills, emojiIcons: dom.emojiIcons, fontSizes: dom.fontSizes, radiusDistinct: dom.radiusDistinct,
        maxLineEm: dom.maxLineEm, textColumnShare: dom.textColumnShare, largestNonMapBoxShare: dom.largestNonMapBoxShare,
        heroShare: dom.heroShare, hOverflow: dom.hOverflow, placeholderHits: dom.placeholderHits, primaryFont: dom.primaryFont,
        stretchedTotal: dom.stretchedTotal, stretchByCause: dom.stretchByCause, stretchExamples: dom.stretchExamples,
      };
      const lint = score(dom, {});
      rec.lint = { ...lint, verdict: lint.points >= 6 ? 'SLOP' : lint.points >= 3 ? 'REVIEW' : 'OK' };

      // Task visibility — the MSH question the generic metrics cannot answer.
      const taskState = await page.evaluate((t) => {
        const pick = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const onScreen = r.top < innerHeight && r.bottom > 0 && r.width > 0 && r.height > 0;
          const text = (el.innerText || el.getAttribute('aria-label') || el.tagName).trim();
          return { found: true, onScreen, text: text.slice(0, 60), top: Math.round(r.top), h: Math.round(r.height) };
        };
        const info = pick(t.info);
        const action = pick(t.action);
        return {
          info, action,
          bothVisible: !!(info && action && info.onScreen && action.onScreen),
        };
      }, task);
      rec.taskVisibility = taskState;

      // Preservation — can you see where you are, and hit what you need to hit?
      const preservation = await page.evaluate(() => {
        const tabbables = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')]
          .filter((el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; });
        let unnamed = 0;
        for (const el of tabbables) {
          const name = (el.innerText || '').trim() || el.getAttribute('aria-label') || el.getAttribute('title') || el.getAttribute('alt') || '';
          if (!name) unnamed++;
        }
        return { tabbables: tabbables.length, unnamedControls: unnamed };
      });
      // Real keyboard focus: tab in and read the focus ring.
      await page.evaluate(() => { document.body.focus(); window.scrollTo(0, 0); });
      const focusRing = [];
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press('Tab');
        const f = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName, text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30),
            outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
            outlineWidth: parseFloat(cs.outlineWidth) || 0,
            boxShadow: cs.boxShadow === 'none' ? 'none' : 'yes',
            visible: r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0,
          };
        });
        if (f) focusRing.push(f);
      }
      rec.preservation = {
        ...preservation,
        focusRing,
        focusVisibleCount: focusRing.filter((f) => f.outlineWidth > 0 || f.boxShadow !== 'none').length,
        focusReached: focusRing.length,
      };

      if (SHOTS) {
        const slug = path.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || 'root';
        writeFileSync(join(shotDir, `${slug}-${vp.name}.png`), shot);
      }
    } catch (e) {
      rec.error = String(e.message || e).split('\n')[0].slice(0, 300);
      rec.verdict = 'UNVERIFIED';
    }
    await ctx.close();
    result.viewports[vp.name] = rec;
  }
  return result;
}

async function fetchRoutes() {
  // Prove the surface being measured is the surface meant. On 2026-10-28 a
  // second agent's server took the same port on IPv6 and Chromium preferred
  // IPv6, so a sweep measured a different website for the last stretch of its
  // run and reported findings about someone else's dog breeds. The audit
  // refuses to measure a site it cannot identify.
  const probe = await fetch(`${BASE}/`);
  const html = await probe.text();
  if (!/BKKxC\(ulture\)|BKKxC&#x27;ulture|atlas-shell|register-wordmark/.test(html)) {
    throw new Error(
      `msh-audit: ${BASE} is not serving BKKx. Refusing to measure a site it cannot identify — ` +
        `someone else may be on this port, or the server may not be running.`,
    );
  }
  const out = [];
  try {
    const res = await fetch(`${BASE}/sitemap.xml`);
    const xml = await res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    if (urls.length) return urls;
  } catch { /* the site may not expose a sitemap; fall back to the known list */ }
  return [
    '/', '/heritage', '/rowhouses', '/shophouses', '/shophouses/why', '/shophouses/typology',
    '/shophouses/atlas', '/shophouses/bible', '/shophouses/global', '/shophouses/research',
    '/shophouses/manuscript', '/shophouses/print',
    '/datasets', '/warroom', '/about', '/case-for-bangkok', '/worlds', '/flood',
    '/atlas/historic-core', '/atlas/ratchathewi',
    '/areas/rattanakosin', '/areas/talad-noi', '/areas/bang-krachao',
    '/walks/royal-axis', '/walks/bang-krachao-loop',
  ];
}

const shotDir = join(OUT, 'shots');
mkdirSync(shotDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME || undefined,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
let routes = await fetchRoutes();
if (ONLY) {
  const wanted = ONLY.split(',').map((s) => s.trim()).filter(Boolean);
  routes = routes.filter((r) => wanted.some((w) => (w.endsWith('*') ? r.startsWith(w.slice(0, -1)) : r === w)));
}
console.error(`msh-audit: ${routes.length} route(s) × ${VIEWPORTS.length} viewport(s) against ${BASE}`);
const results = [];
const CONCURRENCY = Math.max(1, Number(arg('concurrency', '3')));
// Routes are independent, so they are measured in parallel. Each route still
// gets its own browser context, its own viewport and its own screenshot.
const queue = [...routes];
async function worker() {
  for (;;) {
    const path = queue.shift();
    if (!path) return;
    const res = await measureRoute(browser, path, shotDir);
    results.push(res);
    const bad = Object.values(res.viewports).filter((v) => v.error).length;
    process.stderr.write(`${bad ? 'ERROR' : 'ok  '} ${path}\n`);
    writeFileSync(join(OUT, 'msh-report.json'), JSON.stringify({ base: BASE, when: new Date().toISOString(), routes: results }, null, 2));
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await browser.close();

writeFileSync(join(OUT, 'msh-report.json'), JSON.stringify({ base: BASE, when: new Date().toISOString(), routes: results }, null, 2));

// ── human summary ─────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(78)}\nMSH AUDIT — ${BASE}\n${'='.repeat(78)}`);
for (const r of results) {
  const issues = [];
  for (const [vpName, v] of Object.entries(r.viewports)) {
    if (v.error) { issues.push(`${vpName}: UNVERIFIED (${v.error})`); continue; }
    if (v.msh.geometry.overflowingCount) issues.push(`${vpName}: ${v.msh.geometry.overflowingCount} element(s) outside the viewport`);
    if (v.msh.geometry.clippedCount) issues.push(`${vpName}: ${v.msh.geometry.clippedCount} clipped text node(s)`);
    if (v.msh.geometry.smallTargetCount) issues.push(`${vpName}: ${v.msh.geometry.smallTargetCount} target(s) under 24px`);
    if (v.msh.chrome.combinedShare > 0.25) issues.push(`${vpName}: chrome takes ${(v.msh.chrome.combinedShare * 100).toFixed(0)}% of the viewport`);
    if (v.taskVisibility && !v.taskVisibility.bothVisible) issues.push(`${vpName}: task not visible together (${r.task})`);
    if (v.lint.points >= 3) issues.push(`${vpName}: slop-lint ${v.lint.points} pts — ${v.lint.hits.join(', ')}`);
    if (v.preservation && v.preservation.focusReached > 0 && v.preservation.focusVisibleCount === 0) issues.push(`${vpName}: no visible focus ring`);
  }
  const head = `${r.path.padEnd(42)} ${r.task}`;
  if (!issues.length) console.log(`✔ ${head}`);
  else {
    console.log(`✘ ${head}`);
    for (const i of issues) console.log(`    · ${i}`);
  }
}
console.log(`\nreport: ${join(OUT, 'msh-report.json')}`);
