import { chromium } from 'playwright';
const OUT='/tmp/bkkx-shots';
const PAGES=[
  { url:'https://shophouses.nonarkara.org/', name:'shophouses-front' },
  { url:'https://shophouses.nonarkara.org/shophouses/read/1', name:'shophouses-read-1' },
  { url:'https://bkk.nonarkara.org/worlds', name:'worlds' },
];
const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
for (const p of PAGES) for (const [label,w,h] of [['390',390,844],['1440',1440,900]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:1, isMobile:w<500, hasTouch:w<500, locale:'ja' });
  const page = await ctx.newPage();
  for (let a=1;a<=4;a++){ try{ await page.goto(p.url,{waitUntil:'domcontentloaded',timeout:60000}); break;}catch(e){ if(a===4) throw e; await page.waitForTimeout(3000*a);} }
  await page.waitForTimeout(4000);
  await page.screenshot({ path:`${OUT}/first-${p.name}-${label}.png`, timeout:90000 });
  await ctx.close();
}
await b.close();
console.log('first-screen shots written');
