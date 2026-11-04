import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport:{width:1440,height:900}, locale:'th-TH', timezoneId:'Asia/Bangkok' });
const p = await ctx.newPage();
const url = process.argv[2] || 'https://atlas.nonarkara.org/?at=100.4913,13.7500,16';
await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(12000);
const before = await p.evaluate(()=>({center:window.__atlasCenter?.(), zoom:document.querySelector('.maplibregl-canvas')?'canvas ok':'no canvas'}));
await p.mouse.click(720, 450);
await p.waitForTimeout(3000);
const out = await p.evaluate(()=>{
  const vis=(e)=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'&&cs.opacity!=='0';};
  const popups=[...document.querySelectorAll('.maplibregl-popup')].filter(vis).map(e=>{
    const r=e.getBoundingClientRect();
    return {cls:e.className, text:(e.innerText||'').trim().replace(/\s+/g,' ').slice(0,80), x:Math.round(r.left), y:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height)};
  });
  const card=document.getElementById('atlas-inspect-card');
  const cr=card&&vis(card)?card.getBoundingClientRect():null;
  const brief=document.getElementById('atlas-place-briefing');
  const br=brief&&vis(brief)?brief.getBoundingClientRect():null;
  return {popups,
    inspectCard: cr?{x:Math.round(cr.left),y:Math.round(cr.top),w:Math.round(cr.width),h:Math.round(cr.height),text:(card.innerText||'').trim().replace(/\s+/g,' ').slice(0,80)}:null,
    placeBriefing: br?{x:Math.round(br.left),y:Math.round(br.top),w:Math.round(br.width),h:Math.round(br.height)}:null,
    coords:(document.getElementById('atlas-inspect-coords')?.textContent||'').trim()};
});
console.log(JSON.stringify(out,null,1));
await p.screenshot({path:'/tmp/atlas-popup-after-click.png',timeout:60000});
await b.close();
