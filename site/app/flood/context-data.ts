export type Gauge = {id:string;name:string;agency:string;lat:number;lng:number;mm:number;hour1Mm:number|null;observedAt:string|null};
const obj=(v:unknown):Record<string,unknown>=>v!==null&&typeof v==='object'?v as Record<string,unknown>:{};
const number=(v:unknown):number|null=>typeof v==='number'&&Number.isFinite(v)?v:null;
const text=(v:unknown):string=>typeof v==='string'?v:'';
// ThaiWater's timezone-less telemetry is Bangkok local time, never browser local time.
export function observationTime(v:unknown):string|null {
  const s=text(v).trim();
  const parts=/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(s);
  if(!parts)return null;
  const [,year,month,day,hour,minute,second='0']=parts;
  const calendar=new Date(Date.UTC(+year,+month-1,+day));
  if(calendar.getUTCFullYear()!==+year||calendar.getUTCMonth()!==+month-1||calendar.getUTCDate()!==+day||+hour>23||+minute>59||+second>59)return null;
  const local=/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(s);
  const iso=local?s.replace(' ','T')+'+07:00':s;
  if(!local&&!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(iso))return null;
  return Number.isFinite(Date.parse(iso))?new Date(iso).toISOString():null;
}
export function readingCurrent(at:string|null,now:number):boolean {const age=at?now-Date.parse(at):NaN;return age>=-300000&&age<=120*60000;}
export function parseRain(raw:unknown):{fetchedAt:string|null;stations:Gauge[]} {
  const root=obj(raw),payload=obj(root.data);
  if(root.ok!==true||!Array.isArray(payload.stations))throw Error('Rain unavailable');
  const stations:Gauge[]=[],seen=new Set<string>();
  for(const v of payload.stations){const s=obj(v),lat=number(s.lat),lng=number(s.lon),mm=number(s.mm),hour=number(s.hour1Mm),id=text(s.id);
    if(!id||seen.has(id)||lat===null||lng===null||lat<13.4||lat>14.2||lng<100.2||lng>101||mm===null||mm<0)continue;
    seen.add(id);stations.push({id,name:text(s.name)||id,agency:text(s.agency)||'ThaiWater',lat,lng,mm,hour1Mm:hour!==null&&hour>=0?hour:null,observedAt:observationTime(s.observedAt)});
  }
  return {fetchedAt:observationTime(root.fetchedAt),stations};
}
export function nearbyGauges(stations:Gauge[],point:{lat:number;lng:number}) {
  const rad=Math.PI/180;
  return stations.map(s=>{const a=Math.sin((s.lat-point.lat)*rad/2)**2+Math.cos(point.lat*rad)*Math.cos(s.lat*rad)*Math.sin((s.lng-point.lng)*rad/2)**2;return {...s,distanceKm:6371*2*Math.asin(Math.sqrt(Math.min(1,a)))};}).filter(s=>s.distanceKm<=10).sort((a,b)=>a.distanceKm-b.distanceKm).slice(0,3);
}
export type Canal = {name:string;level:number;critical:number;observedAt:string|null};
export function parseBulletin(raw:unknown):{date:string;fetchedAt:string|null;stale:boolean;stations:Canal[]} {
  const root=obj(raw),b=obj(root.bulletin);
  if(root.source!=='Bangkok DDS'||!Array.isArray(b.stations))throw Error('DDS bulletin unavailable');
  const stations:Canal[]=[];
  for(const v of b.stations){const s=obj(v),level=number(s.levelMsl),critical=number(s.criticalMsl);if(!text(s.name)||level===null||critical===null)continue;stations.push({name:text(s.name),level,critical,observedAt:observationTime(s.observedAt)});}
  return {date:text(b.date),fetchedAt:observationTime(b.fetchedAt),stale:b.stale===true,stations};
}
