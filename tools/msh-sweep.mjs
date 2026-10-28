#!/usr/bin/env node
// msh-sweep.mjs — the exhaustive geometry gate over EVERY public URL.
//
// msh-audit.mjs is evidence-grade: it measures one representative page of
// each template with screenshots, focus traversal and slop scoring. It cannot
// cover all ~635 sitemap URLs at that depth in one session.
//
// This is the other half: a cheap, mechanical pass over every single URL that
// catches the failure mode that is deterministic, template-independent and
// the one that silently breaks a page — GEOMETRY. Does anything stick out of
// the viewport? Is any text clipped instead of wrapped? Does the phone
// layout scroll sideways? Does the chrome eat the first screen?
//
// It is a gate, not evidence: it proves absence of a class of defect on every
// URL. The screenshots and the MSH §6 record come from msh-audit.mjs.
//
// Usage:
//   node msh-sweep.mjs --base=http://localhost:4173 --out=/tmp/bkkx-sweep
//   node msh-sweep.mjs --base=... --viewports=390,1440 --concurrency=6
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const BASE = arg('base', 'http://localhost:4173').replace(/\/$/, '');
const OUT = arg('out', '/tmp/bkkx-sweep');
const CONCURRENCY = Math.max(1, Number(arg('concurrency', '6')));
const VIEWPORTS = arg('viewports', '390,1440')
  .split(',')
  .map((v) => Number(v.trim()))
  .filter(Boolean);

const GEOMETRY = () => {
  const VW = innerWidth;
  const VH = innerHeight;
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
  const overflow = [];
  const clipped = [];
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') && el.tagName !== 'svg') continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;

    // Classify by WHERE the content goes when it leaves the viewport.
    //
    //   clipped     — an ancestor with overflow:hidden takes the content away.
    //                 Unreachable. A defect.
    //   scrollable  — an ancestor with overflow:auto|scroll takes it with a
    //                 gesture. Reachable. Not a geometry failure, but it is
    //                 reported separately, because a scroll region with no
    //                 visible affordance is its own kind of problem.
    //   map         — a map's own tiles and markers sit outside the frame by
    //                 design. Not a defect.
    //
    // Without this distinction the gate cannot tell "the content is gone"
    // from "the content moves sideways", and the first version of this gate
    // reported 387 pages as broken when the truth was 176.
    let kind = 'clipped';
    let by = null;
    let p = el.parentElement;
    for (let d = 0; p && d < 14; d++, p = p.parentElement) {
      const pcs = getComputedStyle(p);
      if (pcs.overflowX === 'visible' && pcs.overflow === 'visible') continue;
      by = p;
      break;
    }
    if (by) {
      const bcs = getComputedStyle(by);
      const scrollable = bcs.overflowX === 'auto' || bcs.overflowX === 'scroll';
      const inMap = by.matches('.maplibregl-map, .leaflet-container, #typology-map') ||
        by.closest('.maplibregl-map, .leaflet-container, #typology-map') !== null;
      kind = inMap ? 'map' : scrollable ? 'scrollable' : 'clipped';
    }
    if (kind !== 'map') {
      overflow.push({
        kind,
        sel: path(el),
        left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
        clippedBy: by ? path(by) : null,
        text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40),
      });
    }
    if (el.children.length === 0 && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2) {
      if (cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis' || cs.overflow === 'hidden') {
        clipped.push({ sel: path(el), scrollW: el.scrollWidth, clientW: el.clientWidth, text: (el.innerText || '').trim().slice(0, 40) });
      }
    }
  }
  // Chrome cost: the persistent frame at the top of the first screen.
  const header = document.querySelector('header, [role="banner"]');
  const hr = header && getComputedStyle(header).display !== 'none' ? header.getBoundingClientRect() : null;
  const topPx = hr && hr.top < 12 ? Math.round(hr.bottom) : 0;
  return {
    overflow: overflow.slice(0, 6),
    overflowCount: overflow.length,
    clipped: clipped.slice(0, 6),
    clippedCount: clipped.length,
    docOverflowX: document.documentElement.scrollWidth > VW + 2,
    topChrome: topPx,
    topChromeShare: +(topPx / VH).toFixed(3),
    textChars: (document.body.innerText || '').length,
  };
};

async function getRoutes() {
  const res = await fetch(`${BASE}/sitemap.xml`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  // The sitemap is not the whole public surface: /warroom and /flood are
  // public pages that sitemap.ts never listed. The gate must cover what a
  // visitor can reach, not what the sitemap admits to.
  const extra = (arg('extra', '/warroom,/flood,/shophouses/manuscript,/shophouses/print'))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const e of extra) if (!urls.includes(e)) urls.push(e);
  if (!urls.length) throw new Error('sitemap.xml produced no URLs');
  return urls;
}

/**
 * Prove the surface being measured is the surface meant.
 *
 * On 2026-10-28 this gate measured 639 URLs against localhost:4173 while a
 * second agent's server ("Canine OS") took the same port on IPv6. Chromium
 * prefers IPv6, so the sweep silently measured a different website for the
 * last stretch of its run — and every "finding" from that stretch was about
 * someone else's dog breeds. A gate that can measure the wrong thing is not
 * a gate. The marker below is the BKKx wordmark, present on every editorial
 * surface.
 */
async function assertRightSite() {
  const res = await fetch(`${BASE}/`);
  const html = await res.text();
  if (!/BKKxC\(ulture\)|BKKxC&#x27;ulture|atlas-shell|register-wordmark/.test(html)) {
    throw new Error(
      `msh-sweep: ${BASE} is not serving BKKx. The gate refuses to measure a site it cannot identify — ` +
        `someone else may be on this port, or the server may not be running.`,
    );
  }
  return true;
}

mkdirSync(OUT, { recursive: true });
await assertRightSite();
const routes = await getRoutes();
console.error(`msh-sweep: ${routes.length} URLs × ${VIEWPORTS.length} viewport(s) against ${BASE}`);

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const failures = [];
const checked = [];
const queue = [...routes];

async function worker() {
  for (;;) {
    const route = queue.shift();
    if (!route) return;
    const rec = { route, viewports: {} };
    let bad = false;
    for (const w of VIEWPORTS) {
      const h = w === 390 ? 844 : w === 1024 ? 900 : 900;
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 500, hasTouch: w < 500, locale: 'th-TH', timezoneId: 'Asia/Bangkok', ignoreHTTPSErrors: true });
      const page = await ctx.newPage();
      try {
        const resp = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const status = resp ? resp.status() : null;
        await page.waitForTimeout(900);
        const g = await page.evaluate(GEOMETRY);
        rec.viewports[w] = { status, ...g };
        const hardFail = (g.overflow || []).filter((o) => o.kind === 'clipped').length > 0;
        const scrollables = (g.overflow || []).filter((o) => o.kind === 'scrollable');
        rec.viewports[w].scrollableCount = scrollables.length;
        if (status !== 200 || hardFail || g.clippedCount > 0 || g.docOverflowX) bad = true;
      } catch (e) {
        rec.viewports[w] = { error: String(e.message || e).split('\n')[0].slice(0, 160) };
        bad = true;
      }
      await ctx.close();
    }
    checked.push(rec);
    if (bad) {
      failures.push(rec);
      console.error(`FAIL ${route}`);
      for (const [w, v] of Object.entries(rec.viewports)) {
        if (v.error) console.error(`     ${w}: ERROR ${v.error}`);
        else if (v.status !== 200) console.error(`     ${w}: HTTP ${v.status}`);
        else {
          const hard = (v.overflow || []).filter((o) => o.kind === 'clipped');
          if (hard.length) console.error(`     ${w}: ${hard.length} element(s) CLIPPED — the content is taken away`);
          for (const o of hard) console.error(`        ${o.sel} [${o.left}..${o.right}] clipped by ${o.clippedBy} "${o.text}"`);
          if (v.scrollableCount) console.error(`     ${w}: ${v.scrollableCount} element(s) in a scroll region (reachable, listed for the record)`);
          if (v.clippedCount) console.error(`     ${w}: ${v.clippedCount} clipped text node(s)`);
          for (const c of v.clipped) console.error(`        ${c.sel} ${c.scrollW}>${c.clientW} "${c.text}"`);
        }
      }
    }
    writeFileSync(join(OUT, 'sweep-report.json'), JSON.stringify({ base: BASE, when: new Date().toISOString(), total: routes.length, checked: checked.length, failures, records: checked }, null, 2));
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await browser.close();
writeFileSync(join(OUT, 'sweep-report.json'), JSON.stringify({ base: BASE, when: new Date().toISOString(), total: routes.length, checked: checked.length, failures, records: checked }, null, 2));
console.error(`\nmsh-sweep: ${checked.length}/${routes.length} URLs checked · ${failures.length} with geometry failures`);
console.error(`report: ${join(OUT, 'sweep-report.json')}`);
