// The sweep never sees a map popup — they are closed by default. Open one and
// measure what is inside it: clipped text, overlaps, and whether it covers
// the chrome it sits on.
import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const [url,w,h] of [['https://bkk.nonarkara.org/',1440,900],['https://bkk.nonarkara.org/atlas/historic-core',1440,900],['https://bkk.nonarkara.org/atlas/historic-core',390,844]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:w<500,hasTouch:w<500,locale:'th-TH',timezoneId:'Asia/Bangkok'});
  const p=await ctx.newPage();
  for(let a=1;a<=4;a++){try{await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});break;}catch(e){if(a===4){console.log(url,'LOAD FAIL');await ctx.close();continue;}await p.waitForTimeout(3000*a);}}
  await p.waitForTimeout(9000);
  // open a popup: a heritage marker, or a landmark on the atlas
  const frames = p.frames().filter(f=>f!==p.mainFrame());
  const opened = await p.evaluate(()=>{
    const btn=document.querySelector('.bkkx-marker, .bkkx-heritage-marker, [data-landmark], .atlas-marker, button.bkkx-marker');
    if(!btn)return false; btn.click(); return true;
  });
  let openedFrame = opened;
  if (!opened && frames.length) {
    for (const f of frames) {
      try { const hit = await f.evaluate(()=>{ const b=document.querySelector('.bkkx-marker, .bkkx-heritage-marker, [data-landmark], .atlas-marker, button.bkkx-marker'); if(!b)return false; b.click(); return true; }); if (hit) { openedFrame = true; break; } } catch {}
    }
  }
  if(opened) await p.waitForTimeout(3500);
  const target = (openedFrame && frames.length) ? frames[0] : p;
  const res=await target.evaluate(()=>{
    const pops=[...document.querySelectorAll('.maplibregl-popup, .atlas-heritage-popup, [class*=popup]')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>4&&r.height>4&&cs.display!=='none'&&cs.visibility!=='hidden';});
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
  console.log(`\n=== ${url.replace('https://','')} @${w} === opened=${opened} popups=${res.length}`);
  for(const r of res) console.log(JSON.stringify(r));
  await ctx.close();
}
await b.close();
