import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTraffic,evidenceIsFresh} from '../app/flood/evidence.ts';
const now=Date.parse('2026-09-27T12:00:00Z');
const report={id:'1',category:'flood',lat:13.75,lng:100.5,start:'2026-09-27T11:00:00Z',title_th:'น้ำท่วม ถนนทดสอบ รายงานโดย 0812345678',desc_th:'private name',depth_cm:null};
test('reports stay located evidence, not passability or inferred depth',()=>{const j=normalizeTraffic({fetched_at:new Date(now).toISOString(),events:[report,report]},now);assert.equal(j.reports.length,1);assert.equal(j.reports[0].depthCm,null);assert.ok(!JSON.stringify(j).includes('0812345678'));assert.ok(!JSON.stringify(j).includes('private name'));assert.equal(j.reports[0].passable,undefined);});
test('exclude invalid geometry, old and future reports, other categories',()=>{for(const change of [{lat:NaN},{lng:Infinity},{lat:0},{category:'accident'},{start:'invalid'},{start:'2026-09-26T00:00:00Z'},{start:'2026-09-28T00:00:00Z'}])assert.equal(normalizeTraffic({events:[{...report,...change}]},now).reports.length,0);assert.throws(()=>normalizeTraffic({}));});
test('freshness expires with time and never promotes unknown age',()=>{assert.equal(evidenceIsFresh(new Date(now).toISOString(),now),true);assert.equal(evidenceIsFresh(new Date(now).toISOString(),now+16*60000),false);assert.equal(evidenceIsFresh(null,now),false);});
test('contact details with separators and Thai digits are not republished',()=>{for(const contact of ['081-234-5678','081 234 5678','๐๘๑-๒๓๔-๕๖๗๘','test@example.com']){const j=normalizeTraffic({events:[{...report,title_th:'น้ำท่วม ถนนทดสอบ '+contact}]},now);assert.ok(!j.reports[0].title.includes(contact));}});
