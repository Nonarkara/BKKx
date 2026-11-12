// MSH on the text-bearing controls: every input, textarea and select on the
// public surface — its size, its label, its focus ring.
import { chromium } from 'playwright';
const PAGES=['https://bkk.nonarkara.org/','https://bkk.nonarkara.org/heritage','https://bkk.nonarkara.org/datasets',
 'https://bkk.nonarkara.org/warroom','https://bkk.nonarkara.org/about','https://bkk.nonarkara.org/worlds',
 'https://shophouses.nonarkara.org/','https://shophouses.nonarkara.org/shophouses/read/1'];
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const all=new Map();
for(const url of PAGES) for(const [w,h] of [[390,844],[1440,900]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,locale:'th-TH',timezoneId:'Asia/Bangkok'});
  const p=await ctx.newPage();
  for(let a=1;a<=3;a++){try{await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});break;}catch(e){if(a===3)continue;await p.waitForTimeout(2500*a);}}
  await p.waitForTimeout(3500);
  for(const c of await p.evaluate(()=>{
    const out=[];
    for(const el of document.querySelectorAll('input:not([type=hidden]), textarea, select')){
      const cs=getComputedStyle(el), r=el.getBoundingClientRect();
      if(cs.display==='none'||cs.visibility==='hidden'||r.width<2)continue;
      const label=el.labels?.[0]?.innerText?.trim()||el.getAttribute('aria-label')||el.getAttribute('placeholder')||el.getAttribute('title')||'';
      out.push({tag:el.tagName.toLowerCase(),type:el.type||'',w:Math.round(r.width),h:Math.round(r.height),
        pad:cs.padding, font:Math.round(parseFloat(cs.fontSize)*10)/10, label:label.replace(/\s+/g,' ').slice(0,40),
        named:!!(el.labels?.length||el.getAttribute('aria-label')||el.getAttribute('title')||el.getAttribute('placeholder')),
        outlined:cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0});
    }
    return out;
  })) {
    const key=`${c.tag}/${c.type}`;
    const prev=all.get(key);
    if(!prev||c.h<prev.h)all.set(key,{...c,url,w});
    if(c.h<32) console.log(`  SMALL ${c.tag}[${c.type}] ${c.w}×${c.h} @${w} on ${url} — "${c.label}"`);
    if(!c.named) console.log(`  UNNAMED ${c.tag}[${c.type}] @${w} on ${url}`);
  }
  await ctx.close();
}
console.log('\n=== every text control on the surface ===');
for(const [k,v] of [...all].sort((a,b)=>a[0].localeCompare(b[0]))) console.log(`  ${k.padEnd(14)} ${String(v.w).padStart(4)}×${String(v.h).padStart(3)}  font ${v.font}  named=${v.named}  "${v.label}"  (${v.url})`);
await b.close();
