// Verify the house type scale (14px / 11px / display) actually holds, and
// check what the underlined magenta eyebrow on the essay parts actually is.
import { chromium } from 'playwright';
const PAGES=[
 'https://bkk.nonarkara.org/','https://bkk.nonarkara.org/worlds','https://bkk.nonarkara.org/heritage',
 'https://bkk.nonarkara.org/datasets','https://bkk.nonarkara.org/warroom','https://bkk.nonarkara.org/about',
 'https://shophouses.nonarkara.org/','https://shophouses.nonarkara.org/shophouses/read/1',
 'https://shophouses.nonarkara.org/shophouses/typology','https://shophouses.nonarkara.org/shophouses/global',
 'https://bkk.nonarkara.org/areas/rattanakosin','https://bkk.nonarkara.org/walks/royal-axis',
];
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const sizes=new Map(); const outliers=new Map();
for(const url of PAGES) for(const w of [390,1440]){
  const ctx=await b.newContext({viewport:{width:w,height:900},deviceScaleFactor:1,isMobile:w<500,hasTouch:w<500,locale:'ja'});
  const page=await ctx.newPage();
  for(let a=1;a<=3;a++){try{await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});break;}catch(e){if(a===3)throw e;await page.waitForTimeout(2500*a);}}
  await page.waitForTimeout(2500);
  const r=await page.evaluate(()=>{
    const out={sizes:{},outliers:[],eyebrow:null};
    const seen=new Set();
    for(const el of document.querySelectorAll('body *')){
      if(el.closest('svg')&&el.tagName!=='svg')continue;
      const cs=getComputedStyle(el);
      if(cs.display==='none'||cs.visibility==='hidden')continue;
      // only elements that directly render text
      const direct=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
      if(!direct)continue;
      const rect=el.getBoundingClientRect();
      if(rect.width<2||rect.height<2)continue;
      const size=Math.round(parseFloat(cs.fontSize)*10)/10;
      out.sizes[size]=(out.sizes[size]||0)+1;
      const key=el.tagName+'.'+(typeof el.className==='string'?el.className.split(/\s+/).slice(0,2).join('.'):'');
      if(!seen.has(key+'|'+size)){seen.add(key+'|'+size); out.outliers.push({sel:key,size});}
    }
    const eb=document.querySelector('.sh-part-eyebrow, .sh-part-head a, [class*=eyebrow]');
    if(eb) out.eyebrow={tag:eb.tagName, cls:eb.className, href:eb.getAttribute('href'), text:(eb.innerText||'').trim().slice(0,60), decoration:getComputedStyle(eb).textDecorationLine};
    return out;
  });
  for(const [s,n] of Object.entries(r.sizes)) sizes.set(s,(sizes.get(s)||0)+n);
  for(const o of r.outliers) { const k=o.sel+' @'+o.size; if(!outliers.has(k)) outliers.set(k,(outliers.get(k)||0)+1); }
  if(r.eyebrow) console.log(`eyebrow @${w} ${url.split('/')[2]}${url.slice(url.indexOf('/',8))}:`, JSON.stringify(r.eyebrow));
  await ctx.close();
}
console.log('\n=== font sizes seen across 12 pages × 2 widths ===');
console.log([...sizes.entries()].sort((a,b)=>b[1]-a[1]).map(([s,n])=>`${s}px×${n}`).join('  '));
console.log('\n=== distinct sizes ===', [...sizes.keys()].sort((a,b)=>a-b).join(', '));
console.log('\n=== elements at the rare sizes ===');
[...outliers.entries()].filter(([k])=>{const m=/ @([\d.]+)$/.exec(k);return m&&![11,14].includes(parseFloat(m[1]));}).slice(0,22).forEach(([k,n])=>console.log('  ',k));
await b.close();
