import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,locale:'ja'});
const p=await ctx.newPage();
await p.goto('http://127.0.0.1:43118/shophouses',{waitUntil:'domcontentloaded',timeout:60000});
await p.waitForTimeout(5000);
console.log(JSON.stringify(await p.evaluate(()=>{
  const vis=(e)=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden';};
  const h1=document.querySelector('h1');
  const parts=[...document.querySelectorAll('.sh-parts a')].map(a=>{const r=a.getBoundingClientRect();return {t:(a.innerText||'').trim().replace(/\s+/g,' ').slice(0,30),top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height)};});
  const deks=[...document.querySelectorAll('.sh-part-dek')].map(e=>Math.round(e.getBoundingClientRect().height));
  const h1r=h1?.getBoundingClientRect();
  return {h1:h1?{text:(h1.innerText||'').trim().slice(0,40),top:Math.round(h1r.top),bottom:Math.round(h1r.bottom),inFold:h1r.top<innerHeight}:null,
    parts, partsAllAboveFold: parts.every(p=>p.bottom<=innerHeight), dekHeights:deks,
    ledeTop: Math.round(document.querySelector('.sh-essay-lede, .sh-lede, [class*=lede]')?.getBoundingClientRect().top ?? -1)};
}),null,1));
await p.screenshot({path:'/tmp/bkkx-shots/sh-local-390.png',timeout:90000});
await b.close();
