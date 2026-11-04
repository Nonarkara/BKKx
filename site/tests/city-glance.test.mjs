import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the actual component/effect/Item render, not a copied normalizer.
// Hook and JSX stubs provide a DOM-free state harness; pixels are tested separately.
function component(fetch, props) {
  const source=readFileSync(new URL('../app/heritage-atlas/CityGlance.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  let state={},cleanup,started=false,writes=0;
  const effects=[];
  const jsx=(type,props)=>typeof type==='function'?type(props):({type,props});
  const mod={exports:{}};
  const require=name=>{
    if(name==='react')return {useState:initial=>[started?state:initial,next=>{state=next;writes++;}],useEffect:effect=>{if(!started)effects.push(effect);}};
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};
    if(name==='next/link')return {__esModule:true,default:props=>({type:'a',props})};
    throw Error(`Unexpected component import: ${name}`);
  };
  vm.runInNewContext(code,{exports:mod.exports,require,fetch,console,Date,AbortController,AbortSignal});
  return {
    mount(){const tree=mod.exports.CityGlance(props);started=true;cleanup=effects[0]();return tree;},
    render(){return mod.exports.CityGlance(props);},
    unmount(){cleanup?.();},
    writes(){return writes;},
  };
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function text(node){if(typeof node==='string'||typeof node==='number')return String(node);if(Array.isArray(node))return node.map(text).join(' ');return node?.props?text(node.props.children):'';}
function links(node){if(!node)return [];if(Array.isArray(node))return node.flatMap(links);return [...(node.type==='a'?[node]:[]),...links(node.props?.children)];}

test('CityGlance distinguishes initial loading from settled network failure in all five cells',async()=>{
  const c=component(async()=>{throw Error('network unavailable');});
  const initial=c.mount();
  assert.equal(links(initial).length,5);
  assert.match(text(initial),/polling/);
  await settle();
  const settled=c.render();
  assert.equal(links(settled).length,5);
  assert.doesNotMatch(text(settled),/polling/);
  assert.match(text(settled),/unavailable/i);
  for(const link of links(settled))assert.match(text(link),/—/);
});

test('CityGlance does not accept an HTTP failure as valid observed or modelled data',async()=>{
  const c=component(async()=>new Response(JSON.stringify({ok:true,data:{temperatureC:37,stations:[],maxMm:0,bangkokCount:0,nationalCount:0}}),{status:502}));
  c.mount();await settle();
  const rendered=text(c.render());
  assert.doesNotMatch(rendered,/37\.0|none in Bangkok/);
  assert.match(rendered,/unavailable/i);
  assert.doesNotMatch(rendered,/polling/);
});

test('CityGlance preserves useful successful cells and upstream failure qualifications',async()=>{
  const c=component(async path=>{
    if(path.endsWith('/weather'))return Response.json({ok:true,fetchedAt:'2026-11-04T12:00:00Z',source:'Open-Meteo',data:{temperatureC:29.5,rainChanceNext24h:40,rainNext24hMm:2,pm25:12,observedAt:'2026-11-04T12:00:00Z',attribution:'model'}});
    if(path.endsWith('/rain'))throw Error('offline');
    return Response.json({ok:false,reason:'HII warning table unavailable'});
  });
  c.mount();await settle();
  const rendered=text(c.render());
  assert.match(rendered,/29\.5/);
  assert.match(rendered,/model, not gauges/);
  assert.match(rendered,/HII warning table unavailable/);
  assert.match(rendered,/CAMS/);
  assert.doesNotMatch(rendered,/polling/);
});

test('CityGlance stops loading on malformed JSON and does not update an unmounted component',async()=>{
  const malformed=component(async()=>new Response('not JSON'));
  malformed.mount();await settle();
  assert.doesNotMatch(text(malformed.render()),/polling/);
  assert.match(text(malformed.render()),/unavailable/i);
  const pending=[];
  const signals=[];
  const delayed=component((_path,options)=>{signals.push(options.signal);return new Promise(resolve=>pending.push(resolve));});
  delayed.mount();delayed.unmount();
  assert.equal(signals.length,3);
  assert.ok(signals.every(signal=>signal.aborted));
  for(const resolve of pending)resolve(Response.json({ok:false,reason:'unavailable'}));
  await settle();
  assert.equal(delayed.writes(),0);
});

test('a feed that never answers stops saying polling',async()=>{
  // The unmount signal only fires when the reader leaves, so a request that
  // hangs was indistinguishable from a slow one and left the strip reading
  // "polling…" for the life of the page. The deadline is what ends it.
  //
  // The stub fetch behaves like a real one: it rejects when the signal it was
  // handed aborts. With the old code the only signal was the unmount
  // controller, so this request never settled and the strip never stopped
  // polling — which is exactly the failure this test exists to catch.
  const hung=component((_path,options)=>new Promise((_resolve,reject)=>{
    options.signal.addEventListener('abort',()=>reject(Error('aborted')));
  }),{timeoutMs:25});
  hung.mount();
  await new Promise(resolve=>setTimeout(resolve,80));
  const settled=text(hung.render());
  assert.doesNotMatch(settled,/polling/);
  assert.match(settled,/unavailable/i);
  for(const link of links(hung.render()))assert.match(text(link),/—/);
});
