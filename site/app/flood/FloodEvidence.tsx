"use client";
import Link from 'next/link';
import {useEffect,useMemo,useState,type RefObject} from 'react';
import type {Map as MapLibreMap,MapLayerMouseEvent,GeoJSONSource} from 'maplibre-gl';
import {evidenceIsFresh,type FloodEvidence as Evidence,type FloodReport} from './evidence';
const source='flood-evidence',pulse='flood-evidence-pulse',points='flood-evidence-points';
export function FloodEvidence({mapRef,ready}:{mapRef:RefObject<MapLibreMap|null>;ready:boolean}){
  const [data,setData]=useState<Evidence|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState(true);
  const [now,setNow]=useState(0),[query,setQuery]=useState(''),[hours,setHours]=useState(3),[motion,setMotion]=useState(true),[reduced,setReduced]=useState(false),[selected,setSelected]=useState<FloodReport|null>(null);
  const [reload,setReload]=useState(0),[thai,setThai]=useState(true);
  const t=(th:string,en:string)=>thai?th:en;
  useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(mq.matches);change();mq.addEventListener('change',change);const tick=()=>setNow(Date.now());tick();const timer=setInterval(tick,30000);return()=>{clearInterval(timer);mq.removeEventListener('change',change);};},[]);
  useEffect(()=>{let active=true;const controller=new AbortController();async function load(){setBusy(true);try{const r=await fetch('/api/flood/evidence',{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(12000)])});if(!r.ok)throw Error();const j=await r.json() as Evidence;if(!Array.isArray(j.reports))throw Error();if(active){setData(j);setError(false);}}catch{if(active)setError(true);}finally{if(active)setBusy(false);}}void load();const timer=setInterval(load,60000);return()=>{active=false;controller.abort();clearInterval(timer);};},[reload]);
  const reports=useMemo(()=>(data?.reports??[]).filter(r=>now-Date.parse(r.start)<=hours*3600000&&r.title.toLowerCase().includes(query.toLowerCase())),[data,now,hours,query]);
  const fresh=!!data&&evidenceIsFresh(data.fetchedAt,now)&&!error;
  useEffect(()=>{
    const map=mapRef.current;if(!map||!ready)return;
    if(!map.getSource(source))map.addSource(source,{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    if(!map.getLayer(pulse))map.addLayer({id:pulse,type:'circle',source,paint:{'circle-radius':13,'circle-color':'#58b8db','circle-opacity':0.15,'circle-stroke-width':1,'circle-stroke-color':'#58b8db','circle-pitch-alignment':'map'}});
    if(!map.getLayer(points))map.addLayer({id:points,type:'circle',source,paint:{'circle-radius':5,'circle-color':fresh?'#58b8db':'#b8b5aa','circle-stroke-width':1,'circle-stroke-color':'#111','circle-pitch-alignment':'map'}});
    (map.getSource(source) as GeoJSONSource).setData({type:'FeatureCollection',features:reports.map(r=>({type:'Feature',geometry:{type:'Point',coordinates:[r.lng,r.lat]},properties:{id:r.id}}))});
    map.setPaintProperty(points,'circle-color',fresh?'#58b8db':'#b8b5aa');
    const click=(e:MapLayerMouseEvent)=>{const r=reports.find(r=>r.id===e.features?.[0]?.properties?.id);if(r)setSelected(r);};map.on('click',points,click);
    let frame=0,last=0;
    const animate=(time:number)=>{if(time-last>80&&map.getLayer(pulse)){const phase=(time%2400)/2400;map.setPaintProperty(pulse,'circle-radius',8+phase*18);map.setPaintProperty(pulse,'circle-opacity',(1-phase)*0.22);last=time;}frame=requestAnimationFrame(animate);};
    map.setLayoutProperty(pulse,'visibility',fresh&&motion&&!reduced?'visible':'none');
    if(fresh&&motion&&!reduced)frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);map.off('click',points,click);};
  },[mapRef,ready,reports,fresh,motion,reduced]);
  useEffect(()=>()=>{const map=mapRef.current;if(map){for(const id of [points,pulse])if(map.getLayer(id))map.removeLayer(id);if(map.getSource(source))map.removeSource(source);}},[mapRef]);
  function focus(r:FloodReport){setSelected(r);mapRef.current?.flyTo({center:[r.lng,r.lat],zoom:14,pitch:50,duration:reduced?0:900});}
  const stamp=(s:string)=>new Date(s).toLocaleString(thai?'th-TH':'en-GB',{timeZone:'Asia/Bangkok',dateStyle:'short',timeStyle:'short'});
  return <aside className="flood-rail" aria-label="Flood evidence">
    <header><Link href="/">BKKx</Link><button onClick={()=>setThai(!thai)}>{thai?'English':'ไทย'}</button></header>
    <h1>{t('กรุงเทพฯ · เฝ้าระวังน้ำ','Bangkok · Flood watch')}</h1>
    <p className="flood-warning">{t('ถนนที่ไม่มีจุดรายงาน ไม่ได้แปลว่าปลอดภัย','Unmarked roads are unknown, not safe.')}</p>
    <p>{t('วงกระเพื่อม = จุดรายงาน ไม่ใช่ขอบเขต ความลึก หรือทิศทางน้ำ','Ripples mark reports—not flood extent, depth or flow.')}</p>
    <div className="flood-actions"><button onClick={()=>setMotion(!motion)} aria-pressed={motion&&!reduced}>{t('ภาพเคลื่อนไหว','Animation')}: {motion&&!reduced?'ON':'OFF'}</button><button disabled={busy} onClick={()=>setReload(v=>v+1)}>{busy?t('กำลังตรวจ…','Checking…'):t('ตรวจอีกครั้ง','Refresh')}</button></div>
    <p role="status">{error?t('เชื่อมต่อไม่ได้ · สำเนาเดิมถ้ามี','Connection failed · previous copy if available'):data?(fresh?t('สำเนาล่าสุดจากต้นทาง','Recent source copy'):t('ข้อมูลเก่า / ไม่ทราบอายุ','Stale / age unknown')):t('กำลังโหลดรายงาน','Loading reports')}{data?.fetchedAt?' · '+stamp(data.fetchedAt):''}</p>
    <p className="flood-meta">iTIC / Longdo → FloodDash · {t('รายงานสาธารณะ ไม่ใช่การสำรวจยืนยัน','Public reports, not verified surveys')}</p>
    <label>{t('ค้นหาถนนหรือสถานที่','Find road or place')}<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <label>{t('ช่วงเวลารายงาน','Report window')}<select value={hours} onChange={e=>setHours(Number(e.target.value))}>{[1,3,6,24].map(h=><option key={h} value={h}>{h} {t('ชั่วโมง','hours')}</option>)}</select></label>
    <p>{reports.length} {t('รายงานที่ตรงกัน · กรุงเทพฯ และปริมณฑล','matching reports · Bangkok region')}</p>
    {selected&&<section className="flood-inspector"><button onClick={()=>setSelected(null)}>{t('ปิดรายละเอียด','Close details')}</button><h2>{selected.title}</h2><dl><dt>{t('เวลารายงาน','Reported')}</dt><dd>{stamp(selected.start)}</dd><dt>{t('ความลึกตามรายงาน','Reported depth')}</dt><dd>{selected.depthCm===null?t('ไม่ระบุ','Unknown'):selected.depthCm+' cm'}</dd><dt>{t('สถานะปัจจุบัน','Current status')}</dt><dd>{t('ยังไม่ยืนยันการคลี่คลายหรือการผ่านได้','Resolution and passability unverified')}</dd><dt>{t('ตำแหน่ง','Location')}</dt><dd>{t('พิกัดจากรายงาน · ความแม่นยำไม่ระบุ','Source report coordinate · accuracy unspecified')}</dd></dl><a href="https://traffic.longdo.com/" target="_blank" rel="noreferrer">{t('ตรวจสอบกับ Longdo Traffic','Check Longdo Traffic')}</a></section>}
    <div className="flood-list">{reports.map(r=><button key={r.id} onClick={()=>focus(r)} aria-pressed={selected?.id===r.id}><strong>{r.title}</strong><span>{stamp(r.start)}</span></button>)}</div>
    {!reports.length&&!busy&&<p>{t('ไม่มีรายงานตรงตัวกรอง ไม่ได้แปลว่าไม่มีน้ำท่วม','No matching reports—not evidence of no flooding.')}</p>}
    <details><summary>{t('ข้อจำกัดและข้อมูลเชิงลึก','Limitations & deeper evidence')}</summary><p>{t('หลายรายงานอาจกล่าวถึงเหตุเดียวกัน จำนวนจุดไม่เท่ากับความรุนแรง ยังไม่มีข้อมูลยืนยันกระแสน้ำ การปิดถนน หรือสถานะคำขอช่วยเหลือในชั้นนี้','Several reports may describe one event. Counts are not severity. Verified currents, road closures and assistance-request status are not available in this layer.')}</p><a href="/drainage/">{t('ฝน ระดับคลอง และระบบระบายน้ำ','Rain, canal levels & drainage')}</a><br/><a href="/warroom">{t('กล้องและข้อมูลสถานการณ์','Cameras & operational evidence')}</a></details>
    <footer>{t('ไม่ใช่ประกาศราชการ · ปภ.','Not an official warning · DDPM')} <a href="tel:1784">1784</a></footer>
  </aside>;
}
