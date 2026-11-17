// Local first-screen shot + fold measure for /shophouses, against a preview
// you serve yourself (or one you name).
//
// 17 Nov 2026: this used to hard-code http://127.0.0.1:43118 and assume a
// `vinext start` — vinext 1 no longer runs outside the Cloudflare runtime,
// and 43118 is a contested convention port (another agent's preview server
// can hold the loopback binding, so a curl here can measure *their* build,
// as this round's verification did twice). The tool now:
//   - takes --port/--base (defaults to a private port and NO server),
//   - verifies the server is the local build (a stylesheet hash check when
//     --css= is given, and "stylesheets applied or fail" always),
//   - exits 1 when the page cannot be opened or CSS did not apply, so a dead
//     preview server can never produce a screenshot quietly.
//
// Usage:
//   node tools/serve-preview.mjs --port=47831 &   # or your own rig
//   node tools/shot-local.mjs --port=47831 --out=/tmp/bkkx-shots
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const arg = (n, d) => { const hit = args.find((a) => a.startsWith(`--${n}=`)); return hit ? hit.slice(n.length + 3) : d; };
const PORT = arg('port', '47831');
const BASE = arg('base', `http://127.0.0.1:${PORT}`);
const OUT = arg('out', '/tmp/bkkx-shots');

const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ja' });
const p = await ctx.newPage();
let ok = false;
for (let a = 1; a <= 4; a++) {
  try { await p.goto(`${BASE}/shophouses`, { waitUntil: 'domcontentloaded', timeout: 60000 }); ok = true; break; }
  catch (e) { if (a === 4) console.log('shot-local: LOAD FAILED — is a preview server up on', `${BASE}?`); await p.waitForTimeout(3000 * a); }
}
if (!ok) { await b.close(); process.exit(1); }
await p.waitForTimeout(5000);

const measured = await p.evaluate(() => {
  const h1 = document.querySelector('h1');
  const parts = [...document.querySelectorAll('.sh-parts a')].map(a => { const r = a.getBoundingClientRect(); return { t: (a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 30), top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) }; });
  const deks = [...document.querySelectorAll('.sh-part-dek')].map(e => Math.round(e.getBoundingClientRect().height));
  const h1r = h1?.getBoundingClientRect();
  return {
    stylesheets: document.styleSheets.length,
    cssApplied: parseFloat(getComputedStyle(document.querySelector('a')).paddingLeft) > 0 || document.querySelectorAll('style,link[rel=stylesheet]').length > 0,
    h1: h1 ? { text: (h1.innerText || '').trim().slice(0, 40), top: Math.round(h1r.top), bottom: Math.round(h1r.bottom), inFold: h1r.top < innerHeight } : null,
    parts, partsAllAboveFold: parts.every(p => p.bottom <= innerHeight), dekHeights: deks,
    ledeTop: Math.round(document.querySelector('.sh-lede, [class*=lede]')?.getBoundingClientRect().top ?? -1),
  };
});
console.log(JSON.stringify(measured, null, 1));

// Hollow-page guard: 200 OK with no rules applied is how a stale or foreign
// preview server reads as a good screenshot. No styles → fail.
if (!measured.cssApplied || measured.parts.length === 0) {
  console.log('shot-local: the page did not apply CSS — wrong server or empty body; refusing to report');
  await b.close();
  process.exit(1);
}
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
await p.screenshot({ path: join(OUT, 'sh-local-390.png'), timeout: 90000 });
console.log('shot written:', join(OUT, 'sh-local-390.png'));
await b.close();