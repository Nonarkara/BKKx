#!/usr/bin/env node
// compare-page.mjs — the same page, two origins, counted the same way.
//
// Two sides of a comparison must be able to match at all. This counts the
// elements a vertical audit measures, on both origins, and prints them side
// by side so a difference in COUNT and a difference in LAYOUT are told apart.
//
//   node compare-page.mjs --a=https://bkk.nonarkara.org/ --b=http://127.0.0.1:43119/ \
//     --sel=span.atlas-shell-oldtown-note --w=1440 --h=900
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const arg = (n, d) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};

const A = arg('a');
const B = arg('b');
const SEL = arg('sel', 'span.atlas-shell-oldtown-note');
const W = Number(arg('w', 1440));
const H = Number(arg('h', 900));
const WAIT = Number(arg('wait', 6000));

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

async function count(origin) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 1,
    isMobile: W < 500, hasTouch: W < 500, locale: 'th-TH', timezoneId: 'Asia/Bangkok',
  });
  const page = await ctx.newPage();
  let loaded = false;
  for (let a = 1; a <= 4; a++) {
    try { await page.goto(origin, { waitUntil: 'domcontentloaded', timeout: 60000 }); loaded = true; break; }
    catch { if (a === 4) break; await page.waitForTimeout(3000 * a); }
  }
  if (!loaded) { await ctx.close(); return { origin, loaded: false }; }
  await page.waitForTimeout(WAIT);
  const res = await page.evaluate((sel) => {
    const els = [...document.querySelectorAll(sel)];
    const cs0 = getComputedStyle(document.body);
    return {
      loaded: true,
      title: document.title,
      bodyFont: cs0.fontFamily,
      count: els.length,
      items: els.map((e) => {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        return {
          text: (e.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 40),
          lines: Math.round(r.height / parseFloat(cs.lineHeight || '20')),
          sh: e.scrollHeight, ch: e.clientHeight,
          top: Math.round(r.top), w: Math.round(r.width),
          font: cs.fontFamily.slice(0, 40), fs: cs.fontSize,
        };
      }),
    };
  }, SEL);
  await ctx.close();
  return { origin, ...res };
}

const a = await count(A);
const b = await count(B);

console.log(`selector: ${SEL} @${W}x${H}\n`);
for (const side of [a, b]) {
  if (!side.loaded) { console.log(`${side.origin}: LOAD FAILED`); continue; }
  console.log(`${side.origin}`);
  console.log(`  count=${side.count}  bodyFont=${side.bodyFont}`);
  console.log(`  title=${side.title}`);
  const byText = new Map();
  for (const it of side.items) byText.set(it.text, (byText.get(it.text) || 0) + 1);
  console.log(`  distinct texts=${byText.size}`);
  for (const it of side.items.slice(0, 8)) {
    console.log(`    · "${it.text}" lines=${it.lines} sh=${it.sh} ch=${it.ch} w=${it.w} fs=${it.fs} font=${it.font}`);
  }
  if (side.items.length > 8) console.log(`    … and ${side.items.length - 8} more`);
}

if (a.loaded && b.loaded) {
  const ta = a.items.map((i) => i.text);
  const tb = b.items.map((i) => i.text);
  const onlyA = ta.filter((t) => !tb.includes(t));
  const onlyB = tb.filter((t) => !ta.includes(t));
  console.log(`\nonly in A: ${onlyA.length}${onlyA.length ? ' → ' + JSON.stringify(onlyA.slice(0, 5)) : ''}`);
  console.log(`only in B: ${onlyB.length}${onlyB.length ? ' → ' + JSON.stringify(onlyB.slice(0, 5)) : ''}`);
  const dupes = [...new Set(tb.filter((t, i) => tb.indexOf(t) !== i))];
  console.log(`duplicate texts in B: ${dupes.length}${dupes.length ? ' → ' + JSON.stringify(dupes.slice(0, 5)) : ''}`);
}

await browser.close();
