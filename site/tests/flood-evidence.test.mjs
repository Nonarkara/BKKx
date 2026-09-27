import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTraffic,evidenceIsFresh} from '../app/flood/evidence.ts';
import {parseRain,parseBulletin,observationTime,readingCurrent,nearbyGauges} from '../app/flood/context-data.ts';
import {normaliseThaiwaterRain} from '../worker/live.ts';
const now=Date.parse('2026-09-27T12:00:00Z');
const report={id:'1',category:'flood',lat:13.75,lng:100.5,start:'2026-09-27T11:00:00Z',title_th:'น้ำท่วม ถนนทดสอบ รายงานโดย 0812345678',desc_th:'private name',depth_cm:null};
test('reports stay located evidence, not passability or inferred depth',()=>{const j=normalizeTraffic({fetched_at:new Date(now).toISOString(),events:[report,report]},now);assert.equal(j.reports.length,1);assert.equal(j.reports[0].depthCm,null);assert.ok(!JSON.stringify(j).includes('0812345678'));assert.ok(!JSON.stringify(j).includes('private name'));assert.equal(j.reports[0].passable,undefined);});
test('exclude invalid geometry, old and future reports, other categories',()=>{for(const change of [{lat:NaN},{lng:Infinity},{lat:0},{category:'accident'},{start:'invalid'},{start:'2026-09-26T00:00:00Z'},{start:'2026-09-28T00:00:00Z'}])assert.equal(normalizeTraffic({events:[{...report,...change}]},now).reports.length,0);assert.throws(()=>normalizeTraffic({}));});
test('freshness expires with time and never promotes unknown age',()=>{assert.equal(evidenceIsFresh(new Date(now).toISOString(),now),true);assert.equal(evidenceIsFresh(new Date(now).toISOString(),now+16*60000),false);assert.equal(evidenceIsFresh(null,now),false);});
test('contact details with separators and Thai digits are not republished',()=>{for(const contact of ['081-234-5678','081 234 5678','๐๘๑-๒๓๔-๕๖๗๘','test@example.com']){const j=normalizeTraffic({events:[{...report,title_th:'น้ำท่วม ถนนทดสอบ '+contact}]},now);assert.ok(!j.reports[0].title.includes(contact));}});
test('ThaiWater never converts missing or invalid rainfall to dry readings',()=>{
  for(const v of [null,undefined,'', ' ',false,[],{},-999,'-999'])assert.equal(normaliseThaiwaterRain({data:[{rain_24h:v}]}).stations.length,0);
  const j=normaliseThaiwaterRain({data:[{rain_24h:'0',rain_1h:null,station:{tele_station_lat:null,tele_station_long:''}}]});
  assert.equal(j.stations[0].mm,0);assert.equal(j.stations[0].hour1Mm,null);assert.equal(j.stations[0].lat,null);assert.equal(j.stations[0].lon,null);
});
test('Bangkok observation times are timezone-independent and freshness advances',()=>{
  for(const invalid of ['2026-02-30 12:00','2026-09-27 24:00','2026-09-27T12:60:00Z'])assert.equal(observationTime(invalid),null);
  const at=observationTime('2026-09-27 19:00');assert.equal(at,'2026-09-27T12:00:00.000Z');assert.equal(readingCurrent(at,now),true);assert.equal(readingCurrent(at,now+121*60000),false);assert.equal(readingCurrent(at,now-6*60000),false);assert.equal(readingCurrent(null,now),false);assert.equal(observationTime('yesterday'),null);
});
const station={id:'s1',name:'Gauge',agency:'BMA',lat:13.75,lon:100.5,mm:0,hour1Mm:null,observedAt:'2026-09-27 19:00'};
test('rain map accepts only valid located readings, preserving unknown one-hour rain',()=>{
  const j=parseRain({ok:true,data:{stations:[station,station,{...station,id:'s2',lat:null},{...station,id:'s3',mm:-1},{...station,id:'s4',lon:0}]}});
  assert.equal(j.stations.length,1);assert.equal(j.stations[0].hour1Mm,null);assert.equal(j.stations[0].mm,0);assert.equal(j.fetchedAt,null);assert.throws(()=>parseRain({ok:false,data:{stations:[]}}));
});
test('nearby gauges use bounded straight-line distance, not a flood interpolation',()=>{
  const gauges=parseRain({ok:true,data:{stations:[station,{...station,id:'near',lat:13.76},{...station,id:'far',lat:14.15}]}}).stations;
  const near=nearbyGauges(gauges,{lat:13.75,lng:100.5});assert.deepEqual(near.map(s=>s.id),['s1','near']);assert.equal(near[0].distanceKm,0);assert.ok(near[1].distanceKm>1&&near[1].distanceKm<1.2);
});
test('DDS retains dated MSL reference and rejects missing levels instead of zero',()=>{
  const j=parseBulletin({source:'Bangkok DDS',bulletin:{date:'2026-09-25',stale:true,stations:[{name:'Canal',levelMsl:-0.04,criticalMsl:0.4,observedAt:'2026-09-25T07:00:00+07:00'},{name:'Missing',levelMsl:null,criticalMsl:1}]}});
  assert.equal(j.stations.length,1);assert.equal(j.stations[0].level,-0.04);assert.equal(j.stale,true);assert.equal(j.date,'2026-09-25');assert.throws(()=>parseBulletin({}));
});
test('DDS briefing proxies structurally, failing loudly on wrong shapes', async () => {
  const { normalizeBulletin, floodBulletinResponse } = await import('../worker/flood.ts');
  const raw = { source: 'Bangkok DDS', stale: true, errors: { roads: 'DDS road total mismatch' },
    bulletin: { date: '2026-09-25', fetchedAt: '2026-09-26T01:00:00Z', stale: true,
      stations: [{ name: 'ปตร.คลองสอง', levelMsl: 1.65, criticalMsl: 1.8, observedAt: '2026-09-25T07:00:00+07:00' }, { name: 'No level', levelMsl: null, criticalMsl: 1 }] },
    roads: { records: [{ id: 'r1', district: 'จตุจักร', road: 'พหลโยธิน', location: 'BTSเกษตร', depthCm: '20', lengthM: 300, floodedAt: '2026-09-25T15:45:00+07:00', clearedAt: null, status: 'clearance-unrecorded' }, { noId: true }] },
    rain: [{ name_th: 'คลองลาดพร้าว', lat: 13.8, lng: 100.6, obs_time: '2026-09-27 17:00', age_min: 30, rain_1h: 5, rain_24h: 40, data_confidence: 'high' }] };
  const d = normalizeBulletin(raw);
  assert.equal(d.stations.length, 1);
  assert.equal(d.roads.length, 1);
  assert.equal(d.roads[0].depthCm, 20);
  assert.equal(d.roads[0].clearedAt, null);
  assert.equal(d.rain.length, 1);
  assert.equal(d.errors.roads, 'DDS road total mismatch');
  assert.throws(() => normalizeBulletin({ source: 'Someone else' }));
  assert.throws(() => normalizeBulletin(null));
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json(raw);
  try {
    const ok = await (await floodBulletinResponse()).json();
    assert.equal(ok.ok, true);
    assert.equal(ok.data.roads.length, 1);
  } finally { globalThis.fetch = original; }
  globalThis.fetch = async () => new Response('down', { status: 502 });
  try {
    const down = await (await floodBulletinResponse()).json();
    assert.equal(down.ok, false);
    assert.match(down.reason, /HTTP 502/);
  } finally { globalThis.fetch = original; }
});
test('proxied roads sort clearance-unknown first and never invent clearance', async () => {
  const { parseProxiedBulletin } = await import('../app/flood/context-data.ts');
  const env = { ok: true, fetchedAt: '2026-09-27T17:20:00Z', data: { date: '2026-09-25', bulletinFetchedAt: '2026-09-26T01:00:00Z', stale: true, errors: {},
    stations: [{ name: 'C', level: 1, critical: 2, observedAt: null }],
    roads: [
      { id: 'a', road: 'Cleared Rd', floodedAt: '2026-09-25T16:40:00+07:00', clearedAt: '2026-09-25T18:05:00+07:00', status: 'reported-cleared' },
      { id: 'b', road: 'Unknown Rd', floodedAt: '2026-09-24T03:30:00+07:00', clearedAt: null, status: 'clearance-unrecorded' },
      { id: 'a', road: 'dup' },
    ] } };
  const j = parseProxiedBulletin(env);
  assert.deepEqual(j.roads.map((r) => r.id), ['b', 'a']);
  assert.equal(j.roads[0].clearedAt, null);
  assert.equal(j.stale, true);
  assert.throws(() => parseProxiedBulletin({ ok: false, reason: 'down' }));
});
test('recurrence snapshot is licensed, dated and shaped', async () => {
  const { readFileSync } = await import('node:fs');
  const s = JSON.parse(readFileSync(new URL('../public/data/flood-road-recurrence.json', import.meta.url), 'utf8'));
  assert.match(s.licence, /Creative Commons/i);
  assert.ok(Date.parse(s.fetchedAt) > Date.parse('2026-09-01'));
  assert.ok(s.roads.length > 100);
  for (const r of s.roads.slice(0, 20)) {
    assert.ok(r.district && r.road && Array.isArray(r.years) && r.years.length >= 1);
    assert.ok(Number.isInteger(r.events) && r.events >= r.years.length);
  }
  assert.ok(s.roads[0].years.length >= s.roads[Math.min(10, s.roads.length - 1)].years.length, 'sorted by recurrence');
});
