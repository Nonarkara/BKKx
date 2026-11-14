// A blind spot in the horizontal gate: a clamped element can still be cut
// VERTICALLY (a third line hidden), and scrollHeight says so while
// scrollWidth says nothing.
import { chromium } from 'playwright';
import { retarget } from './lib/base.mjs';
import { loadPage, Coverage } from './lib/measure.mjs';
const PAGES=['https://bkk.nonarkara.org/','https://bkk.nonarkara.org/atlas/historic-core',
 'https://bkk.nonarkara.org/heritage','https://bkk.nonarkara.org/warroom','https://bkk.nonarkara.org/datasets',
 'https://shophouses.nonarkara.org/','https://shophouses.nonarkara.org/shophouses/read/1',
 'https://shophouses.nonarkara.org/shophouses/typology'].map(retarget);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const coverage=new Coverage('vertical audit');
let found=0;
for(const url of PAGES) for(const [w,h] of [[390,844],[1440,900]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,isMobile:w<500,hasTouch:w<500,locale:'th-TH',timezoneId:'Asia/Bangkok'});
  const p=await ctx.newPage();
  const ok=await loadPage(p,url,{attempts:3,settle:6000});
  coverage.record(url,ok);
  if(!ok){await ctx.close();continue;}
  const cut=await p.evaluate(()=>{
    const out=[];
    for(const el of document.querySelectorAll('body *')){
      if(el.closest('svg')&&el.tagName!=='svg')continue;
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden')continue;
      if(!cs.webkitLineClamp||cs.webkitLineClamp==='none')continue;
      if(el.scrollHeight>el.clientHeight+2)
        out.push({sel:el.tagName.toLowerCase()+'.'+(typeof el.className==='string'?el.className.split(/\s+/).slice(0,2).join('.'):''),
          clamp:cs.webkitLineClamp, sh:el.scrollHeight, ch:el.clientHeight, text:(el.innerText||'').trim().replace(/\s+/g,' ').slice(0,40)});
    }
    return out;
  });
  for(const c of cut){ found++; console.log(`CUT ${w} ${url.replace('https://','')} → ${JSON.stringify(c)}`); }
  await ctx.close();
}
console.log(found? `\n${found} vertically-clamped element(s) are cut` : '\nno clamped element is cut vertically on any page checked');
const code=coverage.summary();
await b.close();
process.exit(code);
