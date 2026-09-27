"use client";
import {useEffect,useMemo,useState,type RefObject} from 'react';
import type {Map as MapLibreMap,GeoJSONSource,MapLayerMouseEvent} from 'maplibre-gl';
import {nearbyGauges,parseRain,parseBulletin,readingCurrent,type Gauge} from './context-data';
import type {FloodReport} from './evidence';
const source='flood-rain-gauges',layer='flood-rain-points';
export function FloodContext({mapRef,ready,selected,thai,now,reload,reduced}:{mapRef:RefObject<MapLibreMap|null>;ready:boolean;selected:FloodReport|null;thai:boolean;now:number;reload:number;reduced:boolean}){
  const [rain,setRain]=useState<ReturnType<typeof parseRain>|null>(null),[bulletin,setBulletin]=useState<ReturnType<typeof parseBulletin>|null>(null);
  const [rainError,setRainError]=useState(false),[ddsError,setDdsError]=useState(false),[show,setShow]=useState(true),[gauge,setGauge]=useState<Gauge|null>(null);
  const t=(th:string,en:string)=>thai?th:en;
  const stamp=(s:string|null)=>s?new Date(s).toLocaleString(thai?'th-TH':'en-GB',{timeZone:'Asia/Bangkok',dateStyle:'short',timeStyle:'short'}):t('ไม่ระบุเวลา','Time unknown');
  useEffect(()=>{let active=true;const ctrl=new AbortController();
    async function load(){await Promise.all([
      (async()=>{try{const r=await fetch('/api/live/rain',{signal:AbortSignal.any([ctrl.signal,AbortSignal.timeout(12000)])});if(!r.ok)throw Error();const j=parseRain(await r.json());if(active){setRain(j);setRainError(false);}}catch{if(active)setRainError(true);}})(),
      (async()=>{try{const r=await fetch('https://flood.nonarkara.org/api/dds/briefing',{signal:AbortSignal.any([ctrl.signal,AbortSignal.timeout(15000)])});if(!r.ok)throw Error();const j=parseBulletin(await r.json());if(active){setBulletin(j);setDdsError(false);}}catch{if(active)setDdsError(true);}})(),
    ]);}
    void load();const timer=setInterval(load,300000);return()=>{active=false;ctrl.abort();clearInterval(timer);};
  },[reload]);
  const nearby=useMemo(()=>selected?nearbyGauges(rain?.stations??[],selected):[],[selected,rain]);
  const current=(s:Gauge)=>!rainError&&readingCurrent(s.observedAt,now)&&readingCurrent(rain?.fetchedAt??null,now);
  useEffect(()=>{const map=mapRef.current;if(!map||!ready)return;
    if(!map.getSource(source))map.addSource(source,{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    if(!map.getLayer(layer))map.addLayer({id:layer,type:'circle',source,paint:{'circle-radius':8,'circle-opacity':0,'circle-stroke-width':2,'circle-stroke-color':['case',['get','current'],'#f2f1e8','#77796f']}});
    (map.getSource(source) as GeoJSONSource).setData({type:'FeatureCollection',features:(rain?.stations??[]).map(s=>({type:'Feature',geometry:{type:'Point',coordinates:[s.lng,s.lat]},properties:{id:s.id,current:!rainError&&readingCurrent(s.observedAt,now)&&readingCurrent(rain?.fetchedAt??null,now)}}))});
    map.setLayoutProperty(layer,'visibility',show?'visible':'none');
    const click=(e:MapLayerMouseEvent)=>{const s=rain?.stations.find(s=>s.id===e.features?.[0]?.properties?.id);if(s)setGauge(s);};map.on('click',layer,click);
    return()=>{map.off('click',layer,click);};
  },[mapRef,ready,rain,rainError,now,show]);
  useEffect(()=>()=>{const map=mapRef.current;if(map){if(map.getLayer(layer))map.removeLayer(layer);if(map.getSource(source))map.removeSource(source);}},[mapRef]);
  const activeGauge=gauge&&rain?.stations.find(s=>s.id===gauge.id);
  function focus(s:Gauge){setGauge(s);mapRef.current?.flyTo({center:[s.lng,s.lat],zoom:14,pitch:50,duration:reduced?0:900});}
  function reading(s:Gauge){return <><strong>{s.name}</strong><span>{t('1 ชม.','1 h')}: {s.hour1Mm??'—'} mm · {t('24 ชม.','24 h')}: {s.mm} mm</span><span>{s.agency} / ThaiWater · {stamp(s.observedAt)}</span><span>{current(s)?t('ค่าที่วัดได้ · ภายใน 2 ชม.','Observed · within 2 h'):t('ข้อมูลเก่า / ไม่ทราบอายุ / สำเนาเดิม','STALE / age unknown / previous copy')}</span></>;}
  return <section className="flood-context" aria-label="Rain and drainage evidence">
    <button aria-pressed={show} onClick={()=>setShow(!show)}>{t('○ สถานีฝน','○ Rain gauges')}: {show?'ON':'OFF'}</button>
    <p className="flood-meta">{t('วงโปร่ง = สถานีฝน · จุดทึบ = รายงานน้ำท่วม','Hollow rings = rain gauges · filled dots = flood reports')}</p>
    {rainError&&<p role="status">{t('ฝน: เชื่อมต่อไม่ได้ สำเนาเดิมถ้ามี','Rain: connection failed; previous copy if available')}</p>}
    {!rain&&!rainError&&<p role="status">{t('กำลังโหลดสถานีฝน…','Loading rain gauges…')}</p>}
    {rain&&<p className="flood-meta">{t('สำเนา ThaiWater ดึงเมื่อ','ThaiWater copy retrieved')} {stamp(rain.fetchedAt)}</p>}
    {selected&&<div><h2>{t('ฝนใกล้จุดรายงาน','Rain near this report')}</h2><p className="flood-meta">{t('สูงสุด 3 สถานีในรัศมี 10 กม. · ไม่ใช่ฝน ณ จุดเกิดเหตุหรือหลักฐานว่าถนนท่วม','Up to 3 gauges within 10 km · not rainfall at the incident or proof of street flooding')}</p>{rain&&!nearby.length&&<p>{t('ไม่มีสถานีในรัศมีนี้','No gauges within this radius')}</p>}<div className="flood-list">{nearby.map(s=><button key={s.id} onClick={()=>focus(s)}>{reading(s)}<span>{s.distanceKm.toFixed(1)} km · {t('ระยะเส้นตรง','straight-line distance')}</span></button>)}</div></div>}
    {activeGauge&&<div className="flood-inspector"><button onClick={()=>setGauge(null)}>{t('ปิดสถานี','Close gauge')}</button><div className="flood-gauge-reading">{reading(activeGauge)}</div><a href="https://www.thaiwater.net/" target="_blank" rel="noreferrer">ThaiWater</a></div>}
    <details><summary>{t('สถานีฝนทั้งหมด','All rain gauges')} {rain?.stations.length??'—'}</summary><div className="flood-list">{rain?.stations.map(s=><button key={s.id} onClick={()=>focus(s)}>{reading(s)}</button>)}</div>{rain&&!rain.stations.length&&<p>{t('ไม่มีสถานีที่มีพิกัดและค่าที่อ่านได้','No gauges with usable coordinates and readings')}</p>}</details>
    <details><summary>{t('ระดับคลอง · รายงานเช้า สนน.','Canal levels · DDS morning bulletin')}</summary>
      <p>{t('ข้อมูลรายวัน ไม่ใช่ระดับขณะนี้ และยังไม่ได้จับคู่กับจุดรายงาน','Daily reference, not current levels; not matched to the selected report.')}</p>
      {ddsError&&<p role="status">{t('เชื่อมต่อรายงานไม่ได้ สำเนาเดิมถ้ามี','Bulletin unavailable; previous copy if available')}</p>}
      {!bulletin&&!ddsError&&<p>{t('กำลังโหลดรายงาน…','Loading bulletin…')}</p>}
      {bulletin&&<><p className="flood-meta">DDS → FloodDash · {t('ฉบับวันที่','Bulletin dated')} {bulletin.date||'—'} · {t('ดึงเมื่อ','retrieved')} {stamp(bulletin.fetchedAt)}{bulletin.stale||ddsError||!readingCurrent(bulletin.fetchedAt,now)?t(' · สำเนาเก่า',' · STALE COPY'):''}</p><p>{t('ม.รทก. = ความสูงเทียบระดับทะเล ไม่ใช่ความลึกบนถนน','m MSL = height relative to mean sea level, not street flood depth')}</p><dl className="flood-canal-list">{bulletin.stations.map((s,i)=><div key={i}><dt>{s.name}</dt><dd>{s.level.toFixed(2)} m MSL · {t('ระดับวิกฤตที่เผยแพร่','published critical level')} {s.critical.toFixed(2)} m MSL<br/><span className="flood-meta">{t('วัดเมื่อ','Observed')} {stamp(s.observedAt)}</span></dd></div>)}</dl></>}
      <a href="https://dds.bangkok.go.th/public_content/files/001/0004901_1.pdf" target="_blank" rel="noreferrer">{t('PDF ต้นฉบับ สนน.','Original DDS PDF')}</a> · <a href="/drainage/">{t('รายงานถนนและระบบระบายน้ำ','Road reports & drainage')}</a>
    </details>
  </section>;
}
