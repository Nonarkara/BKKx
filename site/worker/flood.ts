import {normalizeTraffic} from '../app/flood/evidence.ts';
const DDS_BRIEFING='https://flood.nonarkara.org/api/dds/briefing';
export async function floodEvidenceResponse():Promise<Response> {
  try {
    const r=await fetch('https://flood.nonarkara.org/api/traffic',{signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw Error('Upstream unavailable');
    return Response.json(normalizeTraffic(await r.json()),{headers:{'Cache-Control':'public, max-age=60'}});
  } catch {
    return Response.json({error:'Flood reports unavailable; absence does not mean safe.'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
// The DDS morning bulletin, proxied same-origin like every other live feed:
// the browser must not depend on a third host at incident time, and visitor
// IPs must not reach it on every page view. Roads, rain and bulletin pass
// through structurally validated but otherwise untouched — this route is a
// pipe with a shape check, not an editor. Anything unreadable is a 503 with
// a reason, never a trimmed or zeroed bulletin.
export type DdsBulletin = {
  ok:boolean;fetchedAt:string;source:string;
  data?:{date:string|null;bulletinFetchedAt:string|null;stale:boolean;bulletinStale:boolean;errors:Record<string,string>;
    stations:{name:string;level:number;critical:number;observedAt:string|null}[];
    roads:{id:string;date:string|null;district:string|null;road:string|null;location:string|null;depthCm:number|null;lengthM:number|null;lanes:string|null;floodedAt:string|null;clearedAt:string|null;status:string}[];
    rain:{name:string;lat:number|null;lng:number|null;obsTime:string|null;ageMin:number|null;rain1h:number|null;rain24h:number|null;confidence:string|null}[]};
  reason?:string;
};
const finite=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)?v:null;
const cleanText=(v:unknown):string|null=>typeof v==='string'&&v.trim()?v.trim():null;
export function normalizeBulletin(raw:unknown):DdsBulletin['data']{
  if(!raw||typeof raw!=='object')throw Error('DDS bulletin is not an object');
  const r=raw as Record<string,unknown>;
  if(r.source!=='Bangkok DDS')throw Error('DDS bulletin from an unexpected source');
  const b=(r.bulletin&&typeof r.bulletin==='object'?r.bulletin:{}) as Record<string,unknown>;
  if(!Array.isArray(b.stations))throw Error('DDS bulletin carries no canal stations');
  const stations:NonNullable<DdsBulletin['data']>['stations'] = [];
  for(const v of b.stations){
    if(!v||typeof v!=='object')continue;
    const s=v as Record<string,unknown>,level=finite(s.levelMsl),critical=finite(s.criticalMsl),name=cleanText(s.name);
    if(!name||level===null||critical===null)continue;
    stations.push({name,level,critical,observedAt:cleanText(s.observedAt)});
  }
  const roads:NonNullable<DdsBulletin['data']>['roads'] = [];
  const rr=r.roads&&typeof r.roads==='object'?(r.roads as Record<string,unknown>):{};
  if(Array.isArray(rr.records))for(const v of rr.records){
    if(!v||typeof v!=='object')continue;
    const s=v as Record<string,unknown>,id=cleanText(s.id);
    if(!id)continue;
    roads.push({id,date:cleanText(s.date),district:cleanText(s.district),road:cleanText(s.road),location:cleanText(s.location),
      depthCm:finite(s.depthCm)??(typeof s.depthCm==='string'&&s.depthCm.trim()!==''&&Number.isFinite(Number(s.depthCm))?Number(s.depthCm):null),
      lengthM:finite(s.lengthM)??(typeof s.lengthM==='string'&&s.lengthM.trim()!==''&&Number.isFinite(Number(s.lengthM))?Number(s.lengthM):null),
      lanes:cleanText(s.lanes),floodedAt:cleanText(s.floodedAt),clearedAt:cleanText(s.clearedAt)??null,status:cleanText(s.status)??'unknown'});
  }
  const rain:NonNullable<DdsBulletin['data']>['rain'] = [];
  if(Array.isArray(r.rain))for(const v of r.rain){
    if(!v||typeof v!=='object')continue;
    const s=v as Record<string,unknown>,name=cleanText(s.name_th)??cleanText(s.name_en);
    if(!name)continue;
    const lat=finite(s.lat),lng=finite(s.lng);
    rain.push({name,lat,lng,obsTime:cleanText(s.obs_time),ageMin:finite(s.age_min),
      rain1h:finite(s.rain_1h),rain24h:finite(s.rain_24h),confidence:cleanText(s.data_confidence)});
  }
  const errs=r.errors&&typeof r.errors==='object'?r.errors:{};
  const errors:Record<string,string>={};
  for(const[k,v]of Object.entries(errs))if(typeof v==='string'&&v)errors[k]=v;
  return {date:cleanText(b.date),bulletinFetchedAt:cleanText(b.fetchedAt),
    stale:(r as Record<string,unknown>).stale===true||b.stale===true,
    bulletinStale:b.stale===true,errors,stations,roads,rain};
}
export async function floodBulletinResponse():Promise<Response>{
  const fetchedAt=new Date().toISOString();
  try{
    const r=await fetch(DDS_BRIEFING,{signal:AbortSignal.timeout(10000),headers:{accept:'application/json','user-agent':'BKKx/1.0 (+https://bkk.nonarkara.org)'}});
    if(!r.ok)return Response.json({ok:false,fetchedAt,source:DDS_BRIEFING,reason:`DDS briefing returned HTTP ${r.status}. Dated canal and road records are unavailable; this says nothing about current water.`},{headers:{'Cache-Control':'no-store'}});
    const data=normalizeBulletin(await r.json().catch(()=>null));
    return Response.json({ok:true,fetchedAt,source:DDS_BRIEFING,data},{headers:{'Cache-Control':'public, max-age=900, s-maxage=900, stale-while-revalidate=3600','x-bkkx-live':'hit'}});
  }catch(e){
    return Response.json({ok:false,fetchedAt,source:DDS_BRIEFING,reason:`DDS briefing unreachable: ${(e as Error)?.message??'unknown error'}. Dated records unavailable; this says nothing about current water.`},{headers:{'Cache-Control':'no-store'}});
  }
}
