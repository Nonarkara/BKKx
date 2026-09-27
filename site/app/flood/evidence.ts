export type FloodReport = { id:string; title:string; lat:number; lng:number; start:string; depthCm:number|null };
export type FloodEvidence = { fetchedAt:string|null; reports:FloodReport[] };
// Report coordinates are not surveyed inundation boundaries.
export function normalizeTraffic(value: unknown, now=Date.now()): FloodEvidence {
  if (!value || typeof value !== 'object') throw Error('Invalid traffic response');
  const v=value as Record<string,unknown>;
  if (v.error) throw Error('Upstream reports degraded');
  if (!Array.isArray(v.events)) throw Error('Reports unavailable');
  const seen=new Set<string>(), reports:FloodReport[]=[];
  for (const item of v.events) {
    if (!item || typeof item !== 'object') continue;
    const r=item as Record<string,unknown>;
    if(r.category!=='flood'||typeof r.lat!=='number'||typeof r.lng!=='number'||!Number.isFinite(r.lat)||!Number.isFinite(r.lng)||r.lat<13.4||r.lat>14.2||r.lng<100.2||r.lng>101||typeof r.start!=='string')continue;
    const age=now-Date.parse(r.start),id=String(r.id??'');
    if(!Number.isFinite(age)||age < -300000||age>86400000||!id||seen.has(id))continue;
    seen.add(id);
    // Do not forward descriptions, photos or contributors: they can identify residents.
    const title=typeof r.title_th==='string'?r.title_th.split(/รายงานโดย|Report by|ติดต่อ|โทรศัพท์|โทร\s|contact|phone/i)[0]
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,'[redacted]')
      .replace(/[+＋]?[0-9๐-๙][0-9๐-๙\s().-]{7,}[0-9๐-๙]/g,'[redacted]').slice(0,180):'Reported flooding';
    reports.push({id,title,lat:r.lat,lng:r.lng,start:r.start,depthCm:typeof r.depth_cm==='number'&&Number.isFinite(r.depth_cm)&&r.depth_cm>=0&&r.depth_cm<=1000?r.depth_cm:null});
  }
  return {fetchedAt:typeof v.fetched_at==='string'&&Number.isFinite(Date.parse(v.fetched_at))?v.fetched_at:null,reports:reports.sort((a,b)=>Date.parse(b.start)-Date.parse(a.start))};
}
export function evidenceIsFresh(fetchedAt:string|null,now:number) {
  const age=fetchedAt?now-Date.parse(fetchedAt):NaN;
  return Number.isFinite(age)&&age>=-300000&&age<=15*60000;
}
