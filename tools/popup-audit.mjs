// The sweep never sees a map popup — they are closed by default. Open one and
// measure what is inside it: clipped text, overlaps, and whether it covers
// the chrome it sits on.
//
// 15 Nov 2026: the atlas markers no longer open MapLibre popups — activation
// opens a heritage inspector card (role=dialog, class
// heritage-inspector-card). The old selector list matched none of them, so
// the tool reported popups=0 and read as a pass while measuring nothing. It
// now matches the cards markers actually open, and says MEASURED NOTHING
// (exit 1) instead of passing when a marker opened but no popup appeared.
import { chromium } from 'playwright';
import { retarget } from './lib/base.mjs';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let measuredPages=0, emptyPages=0;
for (const [rawUrl,w,h] of [['https://bkk.nonarkara.org/',1440,900],['https://bkk.nonarkara.org/atlas/historic-core',1440,900],['https://bkk.nonarkara.org/atlas/historic-core',390,844]]) {
  const url=retarget(rawUrl);
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:w<500,hasTouch:w<500,locale:'th-TH',timezoneId:'Asia/Bangkok'});
  const p=await ctx.newPage();
  for(let a=1;a<=4;a++){try{await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});break;}catch(e){if(a===4){console.log(url,'LOAD FAIL');await ctx.close();continue;}await p.waitForTimeout(3000*a);}}
  await p.waitForTimeout(9000);
  // open a popup: a heritage marker, or a landmark on the atlas
  const frames = p.frames().filter(f=>f!==p.mainFrame());
  // NOTE: a comma selector list returns the first match in DOCUMENT order,
  // not selector order — chapter markers are added to the map before
  // heritage markers, so the list always hit a chapter marker (which only
  // flies the camera). Query the heritage markers first, then fall back.
  const openIn = async (scope, label) => {
    try {
      const r = await scope.evaluate(()=>{
        const btn=document.querySelector('.bkkx-heritage-marker')
          || document.querySelector('.heritage-marker, [data-landmark], .atlas-marker, .bkkx-marker');
        if(!btn)return null; btn.click();
        return String(btn.className).slice(0,40);
      });
      if (r) console.log(`  clicked in ${label}: ${r}`);
      return r;
    } catch (e) { console.log(`  click in ${label} failed: ${String(e.message).split('\n')[0].slice(0,90)}`); return null; }
  };
  let opened = await openIn(p, 'main doc');
  let openedFrame = !!opened;
  if (!opened && frames.length) {
    for (const f of frames) { if (await openIn(f, 'frame')) { openedFrame = true; break; } }
  }
  if (openedFrame) await p.waitForTimeout(3500);
  const target = (openedFrame && frames.length) ? frames[0] : p;
  const tLabel = target === p ? 'main doc' : 'frame';
  const res=await target.evaluate(()=>{
    const pops=[...document.querySelectorAll('.maplibregl-popup, .atlas-heritage-popup, .heritage-inspector-card, [class*=popup]')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>4&&r.height>4&&cs.display!=='none'&&cs.visibility!=='hidden';});
    return pops.map(pop=>{
      const pr=pop.getBoundingClientRect();
      const clipped=[];
      for(const el of pop.querySelectorAll('*')){
        const cs=getComputedStyle(el);
        if(cs.display==='none'||cs.visibility==='hidden')continue;
        if(el.children.length)continue;
        if(el.clientWidth>0&&el.scrollWidth>el.clientWidth+2&&(cs.overflowX==='hidden'||cs.textOverflow==='ellipsis'||cs.overflow==='hidden'))
          clipped.push((typeof el.className==='string'?el.className:el.tagName)+' '+el.scrollWidth+'>'+el.clientWidth+' "'+(el.innerText||'').trim().slice(0,30)+'"');
      }
      const cs=getComputedStyle(pop);
      return {cls:typeof pop.className==='string'?pop.className:'', bg:cs.backgroundColor, color:cs.color,
        rect:{x:Math.round(pr.x),y:Math.round(pr.y),w:Math.round(pr.width),h:Math.round(pr.height)},
        clipped, text:(pop.innerText||'').trim().replace(/\s+/g,' ').slice(0,90)};
    });
  });
  console.log(`\n=== ${url.replace('https://','')} @${w} === opened=${openedFrame} measured in ${tLabel} popups=${res.length}`);
  for(const r of res) console.log(JSON.stringify(r));
  if (res.length) measuredPages++; else emptyPages++;
  await ctx.close();
}
console.log(measuredPages ? `\nmeasured popups on ${measuredPages} page(s)` : '\nMEASURED NOTHING: no marker opened a popup or inspector card on any page checked');
if (emptyPages) console.log(`no popup appeared on ${emptyPages} page(s) that were checked`);
await b.close();
process.exit(measuredPages ? 0 : 1);
