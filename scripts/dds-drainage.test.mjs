import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validGeometry } from './import-dds-drainage.mjs';
const dir = new URL('../site/public/drainage/data/',import.meta.url);
test('DDS snapshot matches manifest counts, checksums and geographic boundaries',async()=>{
  const m=JSON.parse(await readFile(new URL('manifest.json',dir),'utf8'));
  assert.equal(m.tier,'reference');
  for(const layer of m.layers){
    const bytes=await readFile(new URL(layer.file,dir));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),layer.sha256);
    const j=JSON.parse(bytes);assert.equal(j.features.length,layer.count);
    assert.equal(layer.count+layer.excludedGeometry,layer.upstreamCount);
    assert.equal(new Set(j.features.map(f=>f.id)).size,j.features.length);
    for(const f of j.features){assert.ok(validGeometry(f.geometry));assert.ok(f.properties.name);assert.doesNotMatch(JSON.stringify(Object.keys(f.properties)),/surveillant|mobile|telephone|creator|editor/);}
  }
});
test('2026 tide table covers every calendar day, preserves missing events and the printed September 25 values',async()=>{
  const t=JSON.parse(await readFile(new URL('tides-2026.json',dir),'utf8'));
  assert.equal(t.days.length,365);assert.equal(new Set(t.days.map(d=>d.date)).size,365);
  assert.equal(t.tier,'prediction');assert.equal(t.datum,'mean sea level');
  assert.deepEqual(t.days.find(d=>d.date==='2026-09-25').events,[
    {kind:'low',time:'01:07',metresMsl:.14},{kind:'high',time:'05:43',metresMsl:.53},
    {kind:'low',time:'12:41',metresMsl:-.51},{kind:'high',time:'19:15',metresMsl:1.06},
  ]);
  assert.equal(t.days.find(d=>d.date==='2026-01-01').events.length,1);
});
test('bad geometry is rejected without turning missing coordinates into zero',()=>{
  assert.equal(validGeometry(null),false);assert.equal(validGeometry({type:'Point',coordinates:[0,0]}),false);
  assert.equal(validGeometry({type:'Point',coordinates:[100.5,null]}),false);
});
