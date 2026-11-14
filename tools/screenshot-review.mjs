// The review the context-save could not finish: six rendered pages, the
// first-screen read at each, and the legacy-anchor redirect.
import { chromium } from 'playwright';
import { retarget } from './lib/base.mjs';
const OUT = process.argv.find(a=>a.startsWith('--out='))?.slice(6) || '/tmp/bkkx-shots';
const PAGES = [
  { url: 'https://shophouses.nonarkara.org/', name: 'shophouses-front' },
  { url: 'https://shophouses.nonarkara.org/shophouses/read/1', name: 'shophouses-read-1' },
  { url: 'https://bkk.nonarkara.org/worlds', name: 'worlds' },
].map(p => ({ ...p, url: retarget(p.url) }));
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
for (const p of PAGES) {
  for (const [label, w, h] of [['390', 390, 844], ['1440', 1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 500, hasTouch: w < 500, locale: 'ja' });
    const page = await ctx.newPage();
    for (let attempt = 1; attempt <= 4; attempt++) {
      try { await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60000 }); break; }
      catch (e) { console.error(`  retry ${attempt}: ${String(e.message).split('\n')[0]}`); if (attempt === 4) throw e; await page.waitForTimeout(3000 * attempt); }
    }
    await page.waitForTimeout(4000);
    const read = await page.evaluate((vh) => {
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
      // what is in the first screen
      const first = [...document.querySelectorAll('h1,h2,h3,p,a,button,img,canvas,nav,header,main')].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); return r.top < vh && r.bottom > 0 && r.width > 0; });
      const heads = first.filter((e) => /^H[1-3]$/.test(e.tagName)).map((e) => ({ tag: e.tagName, size: Math.round(parseFloat(getComputedStyle(e).fontSize)), text: (e.innerText || '').trim().slice(0, 52) }));
      const actions = first.filter((e) => ['A', 'BUTTON'].includes(e.tagName)).map((e) => ({ tag: e.tagName, text: (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 34), top: Math.round(e.getBoundingClientRect().top) }));
      // the largest visible block in the first screen — where the eye lands
      let biggest = null;
      for (const e of first) { const r = e.getBoundingClientRect(); const a = Math.min(r.bottom, vh) * r.width; if (!biggest || a > biggest.a) biggest = { tag: e.tagName, cls: (typeof e.className === 'string' ? e.className : '').slice(0, 40), a: Math.round(a), top: Math.round(r.top) }; }
      return {
        heads, actionCount: actions.length, firstActions: actions.slice(0, 4),
        biggest, docHeight: document.documentElement.scrollHeight,
        docOverflowX: document.documentElement.scrollWidth > innerWidth + 2,
        h1Count: document.querySelectorAll('h1').length,
        title: document.title,
      };
    }, h);
    console.log(`\n=== ${p.name} @ ${label} ===`);
    console.log(JSON.stringify(read, null, 1));
    await page.screenshot({ path: `${OUT}/${p.name}-${label}.png`, fullPage: true, timeout: 90000 });
    await ctx.close();
  }
}
// legacy anchor redirect
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'ja' });
const page = await ctx.newPage();
for (let attempt = 1; attempt <= 4; attempt++) {
  try { await page.goto('https://shophouses.nonarkara.org/shophouses/#the-arithmetic-that-eats-a-street', { waitUntil: 'domcontentloaded', timeout: 60000 }); break; }
  catch (e) { console.error(`  retry ${attempt}: ${String(e.message).split('\n')[0]}`); if (attempt === 4) throw e; await page.waitForTimeout(3000 * attempt); }
}
await page.waitForTimeout(5000);
console.log('\n=== legacy anchor redirect ===');
console.log(JSON.stringify(await page.evaluate(() => ({ url: location.href, title: document.title, firstHeading: document.querySelector('h1,h2')?.innerText?.trim().slice(0, 70) })), null, 1));
await browser.close();
