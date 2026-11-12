// One pass over the live surface: every fix this round claims, measured on
// the deployed build rather than in the source.
//
// Each evaluated function is self-contained — `page.evaluate` serialises the
// function, not its closure, so a helper defined outside it is not in scope.
import { chromium } from 'playwright';

const CLIP = `const __c=[];for(const el of document.querySelectorAll('body *')){if(el.closest('svg')&&el.tagName!=='svg')continue;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')continue;if(el.children.length)continue;if(el.clientWidth>0&&el.scrollWidth>el.clientWidth+2&&(cs.overflowX==='hidden'||cs.textOverflow==='ellipsis'||cs.overflow==='hidden'))__c.push((typeof el.className==='string'?el.className:el.tagName)+': "'+(el.innerText||'').trim().replace(/\\s+/g,' ').slice(0,34)+'"');}const clipped=__c;`;

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const checks = [];

async function measure(url, w, h, body, label) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: 1,
    isMobile: w < 500, hasTouch: w < 500, locale: 'th-TH', timezoneId: 'Asia/Bangkok',
  });
  const page = await ctx.newPage();
  let loaded = false;
  for (let a = 1; a <= 4; a++) {
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }); loaded = true; break; }
    catch { if (a === 4) break; await page.waitForTimeout(3000 * a); }
  }
  if (!loaded) { checks.push([label, 'LOAD FAILED']); await ctx.close(); return; }
  await page.waitForTimeout(7000);
  try { checks.push([label, await page.evaluate(`(()=>{${CLIP}${body}})()`)]); }
  catch (e) { checks.push([label, { error: String(e.message).slice(0, 90) }]); }
  await ctx.close();
}

await measure('https://bkk.nonarkara.org/', 1440, 900,
  `return {clippedCount:clipped.length, clipped:clipped.slice(0,4),
    metaClamp:getComputedStyle(document.querySelector('.atlas-shell-oldtown-meta')).webkitLineClamp,
    metaOverflow:[...document.querySelectorAll('.atlas-shell-oldtown-meta')].filter(e=>e.scrollWidth>e.clientWidth+2).length};`,
  'homepage 1440');

await measure('https://bkk.nonarkara.org/', 390, 844,
  `return {clippedCount:clipped.length, clipped:clipped.slice(0,4)};`,
  'homepage 390');

await measure('https://bkk.nonarkara.org/warroom', 1440, 900,
  `return {clippedCount:clipped.length, clipped:clipped.slice(0,4),
    unitSizes:[...new Set([...document.querySelectorAll('.wr-tally-unit')].map(e=>Math.round(parseFloat(getComputedStyle(e).fontSize)*10)/10))]};`,
  'warroom 1440');

await measure('https://bkk.nonarkara.org/atlas/historic-core', 1440, 900,
  `return {clippedCount:clipped.length, clipped:clipped.slice(0,4),
    layerButtons:[...document.querySelectorAll('.layer-toggle-btn')].map(e=>({t:(e.innerText||'').trim().replace(/\\s+/g,' ').slice(0,24),sw:e.scrollWidth,cw:e.clientWidth,clamp:getComputedStyle(e).webkitLineClamp}))};`,
  'atlas 1440');

await measure('https://shophouses.nonarkara.org/shophouses/read/1', 390, 844,
  `const a=document.querySelector('.sh-contents-strip a');
   return {clippedCount:clipped.length, clipped:clipped.slice(0,4),
     chip:a?{h:Math.round(a.getBoundingClientRect().height),min:getComputedStyle(a).minHeight}:null,
     stripRows:new Set([...document.querySelectorAll('.sh-contents-strip a')].map(e=>Math.round(e.getBoundingClientRect().top))).size};`,
  'shophouses read/1 390');

for (const [label, out] of checks) console.log(label, '→', JSON.stringify(out));
await browser.close();
