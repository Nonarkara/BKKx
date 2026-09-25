// Shared with FloodDash. One ingestion pipeline; no browser scrapes of DDS.
const API='https://flood.nonarkara.org/api/dds/briefing';
export function readingAge(reading, generatedAt, now=Date.now()) {
  const generated=Date.parse(generatedAt);
  return reading.age_min!=null && Number.isFinite(reading.age_min) && Number.isFinite(generated) && now>=generated
    ? reading.age_min+(now-generated)/60_000 : null;
}
export function mountBriefing(root, language) {
  let freshnessUpdates=[];
  let data=null, error=false, busy=false, query='', filter='all', receivedAt=null;
  const tr=(th,en)=>language()==='th'?th:en;
  const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
  const time=value=>{if(!value)return '—';const d=new Date(value);return Number.isFinite(+d)?d.toLocaleString(language()==='th'?'th-TH':'en-GB',{timeZone:'Asia/Bangkok',dateStyle:'medium',timeStyle:'short'}):'—';};
  const link=(label,url)=>el('a',label,{href:url,target:'_blank',rel:'noreferrer'});
  const dynamic=(value)=>{const n=el('p',null,{class:'meta'});const update=()=>{n.textContent=value();};freshnessUpdates.push(update);update();return n;};
  const old=p=>p?.stale || !p?.fetchedAt || Date.now()-Date.parse(p.fetchedAt)>30*60_000;
  function render(){
    freshnessUpdates=[];
    const title=el('h2',tr('รายงานถนน ฝน และระดับคลอง','Road reports, rainfall and canal levels'));
    const refresh=el('button',busy?tr('กำลังตรวจสอบ…','Checking…'):tr('ตรวจสอบข้อมูลอีกครั้ง','Check again'),{type:'button'});refresh.disabled=busy;refresh.onclick=load;
    const intro=el('p',tr('รายงานถนนไม่ครอบคลุมทุกซอย และไม่ได้ยืนยันว่าผ่านได้ตอนนี้ · ไม่ใช่ประกาศราชการ · ปภ. 1784','Road reports do not cover every lane or confirm passability now. Not an official warning. DDPM 1784.'));
    root.replaceChildren(title,intro,refresh);
    if(receivedAt)root.append(el('p',tr('อ่านจาก FloodDash เมื่อ ','Read from FloodDash at ')+time(receivedAt),{class:'meta'}));
    if(error)root.append(el('p',tr('เชื่อมต่อไม่ได้ ข้อมูลที่ยังแสดงเป็นสำเนาจากครั้งก่อน โปรดตรวจต้นฉบับ','Connection failed. Any records still shown are from the previous request; check the original.'),{class:'notice',role:'status'}));
    if(!data){root.append(el('p',busy?tr('กำลังโหลดรายงาน…','Loading reports…'):tr('ยังไม่มีข้อมูล ไม่ได้หมายความว่าไม่มีน้ำท่วม','No data available. This does not mean there is no flooding.'),{role:'status'}));return;}
    const roads=el('section',null,{'aria-label':tr('รายงานถนน','Road reports')});
    roads.append(el('h3',tr('ถนนที่มีรายงานน้ำท่วมขัง','Reported road flooding')));
    const r=data.roads;
    if(!r)roads.append(el('p',tr('รายงานถนนยังไม่พร้อม','Road report unavailable')));
    else{
      roads.append(dynamic(()=>tr('สนน. · รายงานลงวันที่ ','DDS · dated reports ')+r.days.join(' / ')+tr(' · ดึงข้อมูล ',' · retrieved ')+time(r.fetchedAt)+(old(r)?tr(' · สำเนาเก่า/ต้นทางขัดข้อง',' · STALE / upstream unavailable'):'')));
      roads.append(el('p',tr('ไม่มีเวลาแห้ง = ต้นทางยังไม่ได้บันทึก ไม่ได้ยืนยันว่ายังท่วม','No clearance time means it was not recorded; it does not confirm flooding continues.')));
      const controls=el('div',null,{class:'brief-controls'}),label=el('label',tr('ค้นหาถนนหรือเขต','Find road or district'),{for:'road-query'}),input=el('input',null,{id:'road-query',type:'search'});input.value=query;
      const statusLabel=el('label',tr('สถานะตามรายงาน','Reported status'),{for:'road-filter'}),select=el('select',null,{id:'road-filter'});
      for(const[value,th,en]of[['all','ทั้งหมด','All records'],['clearance-unrecorded','ไม่มีเวลาแห้งบันทึกไว้','Clearance unrecorded'],['reported-cleared','มีรายงานว่าแห้งแล้ว','Reported cleared']])select.append(el('option',tr(th,en),{value}));select.value=filter;
      controls.append(label,input,statusLabel,select);roads.append(controls);
      const count=el('p',null,{role:'status'}),list=el('div',null,{class:'brief-records'});roads.append(count,list);
      function paint(){
        const matches=r.records.filter(x=>(filter==='all'||x.status===filter)&&[x.road,x.district,x.location].join(' ').toLowerCase().includes(query.toLowerCase()));
        count.textContent=tr('รายการที่ตรงกัน ','Matching records: ')+matches.length;
        list.replaceChildren(...matches.slice().sort((a,b)=>b.floodedAt.localeCompare(a.floodedAt)).map(x=>{
          const row=el('article',null,{class:'brief-record'});row.append(el('h3',`${x.road} · ${x.district}`),el('p',x.location));
          row.append(el('p',tr('ความลึกตามรายงาน ','Reported depth ')+(x.depthCm??'—')+tr(' ซม. · ระยะทาง ',' cm · length ')+(x.lengthM??'—')+tr(' ม. · กระทบ ',' m · affected ')+x.lanes));
          row.append(el('p',tr('ท่วมเมื่อ ','Flood reported at ')+time(x.floodedAt),{class:'meta'}));
          row.append(el('p',x.clearedAt?tr('รายงานว่าแห้งเมื่อ ','Reported cleared at ')+time(x.clearedAt):tr('ยังไม่มีเวลาแห้งบันทึกไว้','Clearance time not recorded'),{class:'meta'}));return row;
        }));
      }
      input.oninput=()=>{query=input.value;paint();};select.onchange=()=>{filter=select.value;paint();};paint();
    }
    roads.append(link(tr('ตรวจรายงานถนนต้นฉบับ','Original DDS road report'),'https://dds.bangkok.go.th/flood_report.php'));root.append(roads);
    const canal=el('section',null,{'aria-label':tr('ระดับคลอง','Canal levels')});canal.append(el('h3',tr('ระดับคลองในรายงานเช้า ไม่ใช่ค่าปัจจุบัน','Morning canal bulletin, not current readings')));
    canal.append(el('p',tr('ม.รทก. คือความสูงเทียบระดับทะเลปานกลาง ไม่ใช่ความลึกของน้ำบนถนน','Metres MSL is height relative to mean sea level, not flood depth on a road.')));
    const b=data.bulletin;
    if(!b)canal.append(el('p',tr('รายงานเช้ายังไม่พร้อม','Morning bulletin unavailable')));
    else{
      canal.append(dynamic(()=>tr('สนน. · วัดเวลา 07:00 น. วันที่ ','DDS · observed at 07:00 on ')+b.date+tr(' · ดึงข้อมูล ',' · retrieved ')+time(b.fetchedAt)+(old(b)?tr(' · สำเนาเก่า/ต้นทางขัดข้อง',' · STALE / upstream unavailable'):'')));
      const list=el('div',null,{class:'brief-records'});
      for(const s of b.stations){const diff=s.levelMsl-s.criticalMsl;const row=el('article',null,{class:'brief-record'});row.append(el('h3',s.name),el('p',`${s.levelMsl.toFixed(2)} ${tr('ม.รทก.','m MSL')} · ${tr('ระดับวิกฤตตามรายงาน','published critical level')} ${s.criticalMsl.toFixed(2)}`),el('p',`${Math.abs(diff).toFixed(2)} ${tr('ม.','m')} ${diff>=0?tr('สูงกว่าหรือเท่าระดับวิกฤต','at/above critical level'):tr('ต่ำกว่าระดับวิกฤต','below critical level')}`),el('p',tr('สถานะที่ สนน. ระบุ: ','DDS status (original Thai): ')+s.statusTh,{class:'meta'}));list.append(row);}canal.append(list);
    }
    canal.append(el('p',tr('ตารางและภาพฝนใน PDF อาจใช้ช่วงเวลาต่างกันหรือมีค่าขัดแย้งกัน จึงไม่รวมเข้ากับค่าฝนโทรมาตร','Rainfall tables and images in the PDF may use different periods or disagree; they are not merged into telemetry readings.')));
    canal.append(link(tr('เปิด PDF ต้นฉบับ','Original DDS PDF'),'https://dds.bangkok.go.th/public_content/files/001/0004901_1.pdf'));root.append(canal);
    const rain=el('section',null);rain.append(el('h3',tr('ฝนที่สถานีวัดได้ · ThaiWater','Measured rain · ThaiWater')));
    const gauges=(data.rain||[]).slice().sort((a,b)=>(b.rain_24h??-1)-(a.rain_24h??-1));
    if(!gauges.length)rain.append(el('p',tr('ไม่มีข้อมูลสถานีกรุงเทพฯ ในคำตอบนี้','No Bangkok gauge readings in this response.')));
    const rainlist=el('div',null,{class:'brief-records'});
    for(const s of gauges){const row=el('article',null,{class:'brief-record'});row.append(el('h3',s.name_th),el('p',`${tr('1 ชม.','1 hour')}: ${s.rain_1h??'—'} mm · ${tr('24 ชม.','24 hours')}: ${s.rain_24h??'—'} mm`),dynamic(()=>{const age=readingAge(s,data.generatedAt);return `${s.meta?.agency||'ThaiWater'} · ${s.obs_time||tr('ไม่ระบุเวลา','time unavailable')} (+07:00) · ${age!=null?Math.round(age)+tr(' นาที',' min'):tr('ไม่ทราบอายุ','age unknown')}${age==null||age>120||age<0?tr(' · ไม่เป็นปัจจุบัน',' · NOT CURRENT'):''}`;}));rainlist.append(row);}rain.append(rainlist);root.append(rain);
    const guidance=el('section',null);guidance.append(el('h3',tr('อ่านเรดาร์และภาพรายงานอย่างไร','How to read the radar and report images')),
      el('p',tr('เรดาร์: ตรวจเวลาบนภาพก่อน เปรียบเทียบหลายภาพเพื่อดูทิศทางฝน ภาพสะท้อนอาจไม่ใช่ฝน และใช้บอกนาทีที่ฝนจะถึงไม่ได้ ภาพ DDS เปิดที่ต้นทางเท่านั้น','Radar: check the image time first, then compare frames for movement. Echoes can be non-rain targets; they do not establish an exact arrival time. DDS imagery remains on the source site.')),
      link(tr('เปิดเรดาร์ DDS','Open DDS radar'),'https://weather.bangkok.go.th/radar/RadarAnimation.aspx'),el('p',tr('เงื่อนไข DDS ห้ามใช้ภาพเรดาร์เชิงพาณิชย์','DDS terms prohibit commercial use of radar imagery'),{class:'meta'}),
      link(tr('กราฟฝนรายเดือนและสะสม: บริบทฤดูกาล ไม่ใช่ฝนขณะนี้','Monthly and cumulative rain: seasonal context, not rain now'),'https://dds.bangkok.go.th/rain_graph.php'),el('br',null),
      link(tr('แผนที่ฝน 24 ชม. — ตรวจวันที่และช่วงเวลาในภาพ','24-hour rainfall map — check the printed interval'),'https://dds.bangkok.go.th/public_content/files/001/0004903_1.jpg'),el('br',null),
      link(tr('ระดับเจ้าพระยาสูงสุดตามวันในภาพ — ไม่ใช่ระดับขณะนี้','Chao Phraya daily peak — not the current river level'),'https://dds.bangkok.go.th/public_content/files/001/0004911_1.jpg'));
    root.append(guidance);
  }
  async function load(){if(busy)return;busy=true;render();try{const r=await fetch(API,{signal:AbortSignal.timeout(15000),cache:'no-store'});if(!r.ok)throw Error('unavailable');const j=await r.json();if(j.source!=='Bangkok DDS')throw Error('wrong response');data=j;receivedAt=new Date().toISOString();error=false;}catch{error=true;}finally{busy=false;render();}}
  setInterval(()=>freshnessUpdates.forEach(update=>update()),60_000);
  document.addEventListener('visibilitychange',()=>freshnessUpdates.forEach(update=>update()));
  load();return render;
}
