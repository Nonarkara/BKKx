import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for (const [url,w,h] of [['https://bkk.nonarkara.org/',1440,900],['https://bkk.nonarkara.org/warroom',1440,900]]) {
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,locale:'th-TH',timezoneId:'Asia/Bangkok'});
  const p=await ctx.newPage();
  for(let a=1;a<=4;a++){try{await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});break;}catch(e){if(a===4)throw e;await p.waitForTimeout(3000*a);}}
  await p.waitForTimeout(6000);
  console.log(url, JSON.stringify(await p.evaluate(()=>{
    const clipped=[];
    for(const el of document.querySelectorAll('body *')){
      if(el.closest('svg')&&el.tagName!=='svg')continue;
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden')continue;
      if(el.children.length)continue;
      if(el.clientWidth>0&&el.scrollWidth>el.clientWidth+2&&(cs.overflowX==='hidden'||cs.textOverflow==='ellipsis'||cs.overflow==='hidden')){
        clipped.push((typeof el.className==='string'?el.className:el.tagName)+': '+el.scrollWidth+'>'+el.clientWidth);
      }
    }
    const units=[...document.querySelectorAll('.wr-tally-unit')].map(e=>Math.round(parseFloat(getComputedStyle(e).fontSize)*10)/10);
    const metas=[...document.querySelectorAll('.atlas-shell-oldtown-meta')].slice(0,3).map(e=>{const cs=getComputedStyle(e);return {clamp:cs.webkitLineClamp, sw:e.scrollWidth, cw:e.clientWidth, text:(e.innerText||'').trim().slice(0,44)};});
    const sizes=new Set();
    for(const el of document.querySelectorAll('body *')){const cs=getComputedStyle(el);if(cs.display==='none')continue;
      const direct=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()); if(!direct)continue;
      const r=el.getBoundingClientRect(); if(r.width<2||r.height<2)continue;
      sizes.add(Math.round(parseFloat(cs.fontSize)*10)/10);}
    return {clippedCount:clipped.length, clipped:clipped.slice(0,5), units:[...new Set(units)], metaSample:metas, fontSizes:[...sizes].sort((a,b)=>a-b)};
  }),null,1));
  await ctx.close();
}
await b.close();
