import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const [w,h] of [[390,844],[1440,900]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:w<500,hasTouch:w<500,locale:'ja'});
  const p=await ctx.newPage();
  for(let a=1;a<=4;a++){try{await p.goto('https://shophouses.nonarkara.org/',{waitUntil:'domcontentloaded',timeout:60000});break;}catch(e){if(a===4)throw e;await p.waitForTimeout(3000*a);}}
  await p.waitForTimeout(6000);
  console.log(w, JSON.stringify(await p.evaluate(()=>{
    const h1=document.querySelector('h1'), r=h1?.getBoundingClientRect();
    const parts=[...document.querySelectorAll('.sh-parts a')].map(a=>a.getBoundingClientRect());
    return {h1:(h1?.innerText||'').trim().slice(0,34), h1Top:Math.round(r?.top??-1), h1Bottom:Math.round(r?.bottom??-1),
      h1FullyInFold: r? r.bottom<=innerHeight : false,
      partsAllAboveFold: parts.every(p=>p.bottom<=innerHeight),
      partsBottom: Math.round(Math.max(...parts.map(p=>p.bottom))),
      dekLines: [...document.querySelectorAll('.sh-part-dek')].map(e=>Math.round(e.getBoundingClientRect().height))};
  })));
  await ctx.close();
}
await b.close();
