"use client";
// Flooded roads now: heat of every signal, the streets that carry reports
// drawn as moving water, reported closures cased in red. Data and method:
// app/flood/roads.ts. Motion is illustrative, not a measured current; it
// stops with the Animation toggle and for reduced motion.
import {useEffect,useState,type RefObject} from 'react';
import type {Map as MapLibreMap,GeoJSONSource,MapLayerMouseEvent} from 'maplibre-gl';
import {roadsAreFresh,type FloodRoads as Roads,type RoadProps} from './roads';
const roadSrc='flood-roads',heatSrc='flood-roads-heat';
const heatL='flood-roads-heat',closedL='flood-roads-closed',waterL='flood-roads-water',flowL='flood-roads-flow';
const LAYERS=[heatL,closedL,waterL,flowL];
// Deeper reported water reads darker and more violet; unknown depth is plain water.
const DEPTH=['match',['get','depth'],1,'#8fe3ff',2,'#8fe3ff',3,'#45bdff',4,'#1f86ff',5,'#3a55ff',6,'#6a3dff',7,'#b026c9','#62c9ff'] as unknown as string;
const DASH=[[0,4,3],[0.5,4,2.5],[1,4,2],[1.5,4,1.5],[2,4,1],[2.5,4,0.5],[3,4,0],[0,0.5,3,3.5],[0,1,3,3],[0,1.5,3,2.5],[0,2,3,2],[0,2.5,3,1.5],[0,3,3,1],[0,3.5,3,0.5]];
const width=(k=1,add=0)=>['interpolate',['exponential',1.6],['zoom'],
  10,['+',add,['*',k,['+',2.4,['*',3,['get','score']]]]],
  14,['+',add,['*',k,['+',5,['*',6,['get','score']]]]],
  17,['+',add,['*',k,['+',8,['*',10,['get','score']]]]]] as unknown as number;
const heatRadius=(m=1)=>['interpolate',['exponential',1.6],['zoom'],10,22*m,13,44*m,16,100*m] as unknown as number;
const heatIntensity=(m=1)=>['interpolate',['linear'],['zoom'],10,0.7*m,14,1.3*m] as unknown as number;

export function FloodRoads({mapRef,ready,motion,reduced,thai,now}:{mapRef:RefObject<MapLibreMap|null>;ready:boolean;motion:boolean;reduced:boolean;thai:boolean;now:number}){
  const [data,setData]=useState<Roads|null>(null),[error,setError]=useState(false),[picked,setPicked]=useState<RoadProps|null>(null);
  const t=(th:string,en:string)=>thai?th:en;
  useEffect(()=>{let active=true;async function load(){try{const r=await fetch('/api/flood/roads',{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error();const j=await r.json() as Roads;if(!Array.isArray(j.roads?.features))throw Error();if(active){setData(j);setError(false);}}catch{if(active)setError(true);}}void load();const timer=setInterval(load,120000);return()=>{active=false;clearInterval(timer);};},[]);
  useEffect(()=>{
    const map=mapRef.current;if(!map||!ready||!data)return;
    for(const [id,d] of [[roadSrc,data.roads],[heatSrc,data.heat]] as const){const s=map.getSource(id) as GeoJSONSource|undefined;if(s)s.setData(d as GeoJSON.FeatureCollection);else map.addSource(id,{type:'geojson',data:d as GeoJSON.FeatureCollection});}
    if(!map.getLayer(heatL))map.addLayer({id:heatL,type:'heatmap',source:heatSrc,paint:{
      'heatmap-weight':['interpolate',['linear'],['get','w'],0,0,0.1,0.2,0.6,0.5,2.5,1],'heatmap-intensity':heatIntensity(),'heatmap-radius':heatRadius(),
      'heatmap-color':['interpolate',['linear'],['heatmap-density'],0,'rgba(0,0,0,0)',0.1,'rgba(98,201,255,0.3)',0.3,'rgba(56,160,255,0.52)',0.55,'rgba(40,100,255,0.66)',0.8,'rgba(106,61,255,0.76)',1,'rgba(176,38,201,0.86)'],
      'heatmap-opacity':['interpolate',['linear'],['zoom'],10,0.95,15,0.55,17,0.3]}});
    if(!map.getLayer(closedL))map.addLayer({id:closedL,type:'line',source:roadSrc,filter:['==',['get','closed'],true],layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':'#C8102E','line-width':width(1,4),'line-opacity':0.95}});
    if(!map.getLayer(waterL))map.addLayer({id:waterL,type:'line',source:roadSrc,layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':DEPTH,'line-width':width(),'line-opacity':['interpolate',['linear'],['get','score'],0,0.45,0.6,0.95]}});
    if(!map.getLayer(flowL))map.addLayer({id:flowL,type:'line',source:roadSrc,layout:{'line-join':'round','line-cap':'butt'},paint:{'line-color':'#e8fbff','line-width':width(0.45),'line-opacity':0.8,'line-dasharray':DASH[0]}});
    const click=(e:MapLayerMouseEvent)=>{const p=e.features?.[0]?.properties as RoadProps|undefined;if(p)setPicked({...p,closed:String(p.closed)==='true'});};
    map.on('click',waterL,click);
    let frame=0,last=0,step=0;
    const animate=(time:number)=>{frame=requestAnimationFrame(animate);if(time-last<70||!map.getLayer(heatL))return;last=time;
      const slosh=1+0.11*Math.sin(time/1400),drift=1+0.12*Math.sin(time/2300+1.3);
      map.setPaintProperty(heatL,'heatmap-radius',heatRadius(slosh));map.setPaintProperty(heatL,'heatmap-intensity',heatIntensity(drift));
      step=(step+1)%DASH.length;map.setPaintProperty(flowL,'line-dasharray',DASH[step]);};
    if(motion&&!reduced)frame=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(frame);map.off('click',waterL,click);};
  },[mapRef,ready,data,motion,reduced]);
  useEffect(()=>()=>{const map=mapRef.current;if(!map)return;for(const id of LAYERS)if(map.getLayer(id))map.removeLayer(id);for(const id of [roadSrc,heatSrc])if(map.getSource(id))map.removeSource(id);},[mapRef]);
  const fresh=!!data&&roadsAreFresh(data.fetchedAt,now)&&!error;
  const ago=data?Math.max(0,Math.round((now-Date.parse(data.fetchedAt))/60000)):null;
  const s=data?.sources??{};
  return <section className="flood-roads" aria-label={t('ถนนที่มีรายงานน้ำท่วม','Flooded roads')}>
    <h2>{t('ถนนที่มีรายงานน้ำท่วมตอนนี้','Flooded roads now')}</h2>
    <p role="status">{error&&!data?t('เชื่อมต่อไม่ได้ · ไม่ได้แปลว่าถนนแห้ง','Unavailable · not evidence of dry streets'):data?`${data.stretches} ${t('ช่วงถนน','road stretches')} · ${data.closed} ${t('ปิด/ผ่านไม่ได้','closed')} · ${fresh?t('ล่าสุด','updated'):t('ข้อมูลเก่า','stale')} ${ago} ${t('นาทีก่อน','min ago')}`:t('กำลังโหลด','Loading')}</p>
    {data&&<p className="flood-meta">{t('ประชาชน (Traffy Fondue)','Residents (Traffy Fondue)')} {s.traffy?.count??0} · iTIC {s.itic?.count??0} · {t('สำนักการระบายน้ำ','BMA DDS')} {s.dds?.count??0}{s.dds?.error?` (${t('รายการของ กทม. ยังไม่อัปเดต','DDS list not updated')})`:''} · {t('สถานีวัด','gauges')} {s.sensors?.count??0}</p>}
    <ul className="flood-roads-key" aria-label={t('ความลึกตามรายงาน','Reported depth')}>
      {[['#8fe3ff',t('ผิวถนน–ข้อเท้า','surface–ankle')],['#45bdff',t('หน้าแข้ง','shin')],['#1f86ff',t('หัวเข่า','knee')],['#3a55ff',t('ต้นขา','thigh')],['#6a3dff',t('เอว','waist')],['#b026c9',t('หน้าอก','chest')],['#C8102E',t('เส้นแดง = รายงานว่าปิด/ผ่านไม่ได้','red casing = reported closed')]].map(([c,l])=><li key={l}><span style={{background:c}} aria-hidden="true"/>{l}</li>)}
    </ul>
    {picked&&<div className="flood-inspector"><button onClick={()=>setPicked(null)}>{t('ปิด','Close')}</button><h3>{picked.road??t('ถนนไม่มีชื่อ','Unnamed road')}</h3><dl>
      <dt>{t('ความลึกสูงสุดตามรายงาน','Deepest reported')}</dt><dd>{(thai?picked.depthTh:picked.depthEn)??t('ไม่ระบุ','not given')}</dd>
      <dt>{t('รายงาน','Reports')}</dt><dd>{[picked.traffy?`${picked.traffy} ${t('จากประชาชน','residents')}`:'',picked.itic?`${picked.itic} iTIC`:'',picked.dds?t('อยู่ในรายการของสำนักการระบายน้ำ','in BMA DDS list'):''].filter(Boolean).join(' · ')}</dd>
      <dt>{t('ล่าสุด','Latest')}</dt><dd>{new Date(picked.latest).toLocaleString(thai?'th-TH':'en-GB',{timeZone:'Asia/Bangkok',dateStyle:'short',timeStyle:'short'})}</dd>
      <dt>{t('ตำแหน่ง','Placement')}</dt><dd>{picked.placed==='road-name'?t('ทั้งถนนที่ชื่อตรงกันในเขต — กทม. ไม่ระบุพิกัด','Whole named road in the khet — DDS gives no coordinates'):t('ราว 100 ม. สองข้างของแต่ละรายงาน ไม่ใช่ขอบเขตน้ำท่วมที่สำรวจ','~100 m either side of each report, not a surveyed extent')}</dd>
      {picked.closed&&<><dt>{t('สถานะ','Status')}</dt><dd>{t('รายงานว่าปิด/ผ่านไม่ได้','Reported closed or impassable')}</dd></>}
    </dl></div>}
    <p className="flood-meta">{t('ความลึกเป็นคำของผู้แจ้ง ไม่ใช่การวัด · ถนนที่ไม่มีสี ไม่ได้แปลว่าแห้ง · วิธีการจาก FloodDash','Depth is the reporter’s word, not a measurement · Unmarked streets are unknown, not dry · Method from FloodDash')} (<a href="https://flood.nonarkara.org" target="_blank" rel="noreferrer">flood.nonarkara.org</a>) · <a href="https://atlas.nonarkara.org/#research" target="_blank" rel="noreferrer">{t('วิธีการ','Method')}</a></p>
  </section>;
}
