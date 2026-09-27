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
export type RoadRecord = {id:string;date:string|null;district:string|null;road:string|null;location:string|null;depthCm:number|null;lengthM:number|null;lanes:string|null;floodedAt:string|null;clearedAt:string|null;status:string};
// The Worker's /api/flood/bulletin envelope around the same DDS briefing:
// {ok,fetchedAt,data:{date,bulletinFetchedAt,stale,errors,stations,roads,rain}}.
// Stations are mapped back onto the raw briefing shape so parseBulletin stays
// the single validator for canal levels; roads are validated here.
export function parseProxiedBulletin(raw:unknown):{bulletin:ReturnType<typeof parseBulletin>;roads:RoadRecord[];stale:boolean;errors:Record<string,string>;fetchedAt:string|null} {
  const root=obj(raw),data=obj(root.data);
  if(root.ok!==true)throw Error(text(root.reason)||'DDS briefing unavailable');
  const bulletin=parseBulletin({source:'Bangkok DDS',bulletin:{date:data.date??null,fetchedAt:data.bulletinFetchedAt??null,stale:data.stale===true,
    stations:(Array.isArray(data.stations)?data.stations:[]).map(v=>{const s=obj(v);return{name:s.name,levelMsl:s.level,criticalMsl:s.critical,observedAt:s.observedAt};})}});
  const roads:RoadRecord[]=[],seen=new Set<string>();
  if(Array.isArray(data.roads))for(const v of data.roads){
    const s=obj(v),id=text(s.id);
    if(!id||seen.has(id))continue;
    seen.add(id);
    const depth=number(s.depthCm),length=number(s.lengthM);
    roads.push({id,date:text(s.date)||null,district:text(s.district)||null,road:text(s.road)||null,location:text(s.location)||null,
      depthCm:depth!==null&&depth>=0?depth:null,lengthM:length!==null&&length>=0?length:null,lanes:text(s.lanes)||null,
      floodedAt:observationTime(s.floodedAt),clearedAt:observationTime(s.clearedAt),status:text(s.status)||'unknown'});
  }
  // Clearance unknown first (possibly still flooded), then newest first.
  // Counts are records, not severity: several rows can describe one street.
  roads.sort((a,b)=>(a.clearedAt===null?0:1)-(b.clearedAt===null?0:1)||String(b.floodedAt??'').localeCompare(String(a.floodedAt??'')));
  const errors:Record<string,string>={};
  for(const[k,v]of Object.entries(obj(data.errors)))if(typeof v==='string'&&v)errors[k]=v;
  return {bulletin,roads,stale:data.stale===true,errors,fetchedAt:observationTime(root.fetchedAt)};
}
