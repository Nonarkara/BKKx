import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const [w,h] of [[390,844],[1440,900]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:w<500,hasTouch:w<500,locale:'ja'});
  const p=await ctx.newPage();
  for(let a=1;a<=4;a++){try{await p.goto('https://shophouses.nonarkara.org/',{waitUntil:'domcontentloaded',timeout:60000});break;}catch(e){if(a===4)throw e;await p.waitForTimeout(3000*a);}}
  await p.waitForTimeout(6000);
  console.log(w, JSON.stringify(await p.evaluate(()=>{
    const vis=(e)=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden';};
    const inFold=[...document.querySelectorAll('h1,h2,p,nav,ol,ul,a,button,details,summary')].filter(vis)
      .filter(e=>{const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;})
      .map(e=>({tag:e.tagName,top:Math.round(e.getBoundingClientRect().top),t:(e.innerText||'').trim().replace(/\s+/g,' ').slice(0,44)}));
    return {inFold:inFold.slice(0,16), docH:document.documentElement.scrollHeight};
  })));
  await p.screenshot({path:`/tmp/bkkx-shots/sh-nov13-${w}.png`,timeout:90000});
  await ctx.close();
}
await b.close();
