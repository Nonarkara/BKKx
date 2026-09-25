/* global L */
import { mountBriefing } from './briefing.js?v=4.41.2';
const $ = id => document.getElementById(id);
let lang = 'th', manifest, tides, map, current, selected, generation = 0, limit = 60;
const collections = new Map();
const renderBriefing = mountBriefing(document.getElementById('briefing'),()=>lang);
const labels = {
  back:['กลับหน้าหลัก','Back to main site'],title:['ทางน้ำกรุงเทพฯ','Bangkok drainage & tides'],
  intro:['ดูคลอง เครื่องสูบน้ำ และจุดเสี่ยงจากสำนักการระบายน้ำ กทม. พร้อมตารางน้ำขึ้นลงปี 2569','Explore the city’s drainage infrastructure and flood-risk register, with the Navy’s 2026 tide table.'],
  reference:['ข้อมูลอ้างอิง ไม่ใช่สถานการณ์น้ำท่วมปัจจุบัน ไม่ใช่ประกาศราชการ · เหตุฉุกเฉิน ปภ. 1784','Reference data, not current flood conditions or an official warning. Emergency: DDPM 1784.'],
  layer:['ชั้นข้อมูล','Map layer'],search:['ค้นหาชื่อหรือเขต','Search name or district'],download:['ดาวน์โหลด GeoJSON','Download GeoJSON'],more:['แสดงเพิ่ม','Show more'],
  select:['เลือกจุดบนแผนที่หรือชื่อในรายการเพื่อดูข้อมูล','Select a map feature or a record to inspect it.'],
  tides:['น้ำขึ้นลงที่กองบัญชาการกองทัพเรือ','Tides at Royal Thai Navy Headquarters'],
  tideNote:['ค่าทำนายทางดาราศาสตร์ ปี 2569 หน่วยเมตรจากระดับทะเลปานกลาง ไม่รวมฝนและน้ำระบายจากเขื่อน จึงใช้แทนระดับน้ำจริงไม่ได้','Astronomical predictions for 2026, in metres above mean sea level. Excludes rainfall and dam releases; this is not a measured river level.'],
  date:['วันที่ · เวลากรุงเทพฯ','Date · Bangkok time'],pdf:['ตรวจตารางต้นฉบับ กรมอุทกศาสตร์','Check the original Navy tide table'],
  sources:['เอกสารและข้อจำกัดของข้อมูล','Sources and limits'],footer:['สำนักการระบายน้ำ กทม. / กรมอุทกศาสตร์','Bangkok DDS / Royal Thai Navy Hydrographic Department'],
};
const t = (th,en) => lang === 'th' ? th : en;
function node(tag, text, attrs={}) { const n=document.createElement(tag); if(text!==null)n.textContent=text; for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v); return n; }
function dateLabel(iso) { return iso ? new Date(iso).toLocaleDateString(lang==='th'?'th-TH':'en-GB',{timeZone:'Asia/Bangkok',year:'numeric',month:'short',day:'numeric'}) : t('ไม่ระบุ','not stated'); }
async function json(path) { const r=await fetch(path); if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json(); }
function translate() {
  renderBriefing();
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-copy]').forEach(n=>{n.textContent=labels[n.dataset.copy][lang==='th'?0:1];});
  $('language').textContent=lang==='th'?'English':'ไทย';
  if(manifest){ for(const option of $('layer').options)option.textContent=manifest.layers.find(l=>l.id===option.value)[lang]; renderRecords(); renderSources(); }
  if(tides)renderTides();
  if(selected)inspect(selected,false);
  else $('detail').replaceChildren(node('p',labels.select[lang==='th'?0:1]));
}
function showLayerMeta(layer) {
  $('provenance').textContent=t('ข้อมูลอ้างอิง สนน. · แก้ไขใน GIS ','DDS reference · GIS edited ')+dateLabel(layer.sourceEditedAt)+t(' · ดาวน์โหลด ',' · retrieved ')+dateLabel(manifest.fetchedAt);
  $('download').href='./data/'+layer.file;
}
let drawn;
function renderRecords() {
  if(!current)return;
  const query=$('search').value.trim().toLocaleLowerCase();
  const matches=current.features.filter(f=>(f.properties.name+' '+f.properties.district).toLocaleLowerCase().includes(query));
  const layer=manifest.layers.find(l=>l.id===$('layer').value);
  showLayerMeta(layer);
  $('status').textContent=`${matches.length.toLocaleString()} / ${layer.count.toLocaleString()} `+t('ระเบียนอ้างอิง','reference records');
  $('records').replaceChildren(...matches.slice(0,limit).map(f=>{
    const b=node('button',f.properties.name,{type:'button',class:'record','aria-pressed':String(selected===f)});
    b.append(node('small',f.properties.district||layer[lang]));b.onclick=()=>inspect(f,true);return b;
  }));
  $('more').hidden=matches.length<=limit;
  if(!map)return;
  if(drawn)map.removeLayer(drawn);
  drawn=L.geoJSON({type:'FeatureCollection',features:matches},{
    style:()=>({color:'#635c48',weight:2,fillColor:'#f59e0b',fillOpacity:0.10}),
    pointToLayer:(_f,latlng)=>L.circleMarker(latlng,{radius:5,color:'#635c48',weight:1,fillColor:'#f59e0b',fillOpacity:.85}),
    onEachFeature:(f,l)=>{l.bindTooltip(node('span',f.properties.name));l.on('click',()=>inspect(f,false));},
  }).addTo(map);
  if(query && matches.length && drawn.getBounds().isValid())map.fitBounds(drawn.getBounds(),{maxZoom:15,padding:[20,20],animate:false});
}
function inspect(feature, zoom) {
  selected=feature;
  const p=feature.properties;
  const dl=node('dl',null);
  const fields=[['district','เขต','District'],['year','ปีตามทะเบียน (พ.ศ.)','Register year (BE)'],['problems','กลุ่มปัญหา','Problem category'],['status_detail','สถานะตามทะเบียน','Recorded status'],['f_canal','จาก','From'],['to_canal','ถึง','To'],['canal_width','ความกว้าง (ม.)','Width (m)'],['length_bma','ความยาวตามทะเบียน (ม.)','Register length (m)'],['hy_lname','ทางน้ำ','Waterway'],['owner','หน่วยงาน','Agency'],['f_tunnel','จาก','From'],['to_tunnel','ถึง','To']];
  for(const[k,th,en]of fields)if(p[k]!=null&&p[k]!==''&&p[k]!=='-'){dl.append(node('dt',t(th,en)),node('dd',String(p[k])));}
  const layer=manifest.layers.find(l=>l.id===$('layer').value);
  const src=node('a',t('เปิดข้อมูลต้นฉบับ สนน.','Open DDS source'),{href:layer.url+'?f=pjson',target:'_blank',rel:'noreferrer'});
  $('detail').replaceChildren(node('h2',p.name),dl,node('p',t('ข้อมูลอ้างอิง ไม่มีการวัดสถานะปัจจุบัน','Reference record; current operating or flood status is not measured.'),{class:'meta'}),src);
  for(const b of $('records').children)b.setAttribute('aria-pressed',String(b.firstChild?.textContent===p.name));
  if(zoom&&map){const bounds=L.geoJSON(feature).getBounds();if(bounds.isValid())map.fitBounds(bounds,{maxZoom:16,padding:[30,30],animate:false});}
}
async function loadLayer() {
  const request=++generation,id=$('layer').value,layer=manifest.layers.find(l=>l.id===id);
  current=null; selected=null; limit=60;
  if(drawn&&map){map.removeLayer(drawn);drawn=null;}
  $('records').replaceChildren();$('detail').replaceChildren(node('p',labels.select[lang==='th'?0:1]));
  $('status').textContent=t('กำลังโหลด…','Loading…');
  try {
    if(!collections.has(id)){const j=await json('./data/'+layer.file);if(j.type!=='FeatureCollection'||j.features.length!==layer.count)throw new Error('Invalid collection');collections.set(id,j);}
    if(request!==generation)return;
    current=collections.get(id);renderRecords();
  }catch{if(request===generation)$('status').textContent=t('โหลดข้อมูลไม่ได้ ลองเลือกชั้นข้อมูลอีกครั้ง','Data unavailable. Select the layer again to retry.');}
}
function renderTides() {
  const day=tides.days.find(d=>d.date===$('tide-date').value);
  $('tide-age').textContent=t('กรมอุทกศาสตร์ · ตารางปี 2569 · ดาวน์โหลด ','Navy Hydrographic Department · 2026 annual predictions · retrieved ')+dateLabel(tides.fetchedAt);
  if(!day){$('tide-events').replaceChildren(node('p',t('ไม่มีค่าทำนายสำหรับวันที่เลือก ตารางนี้ครอบคลุมเฉพาะปี 2569','No prediction for this date. This table covers 2026 only.')));return;}
  $('tide-source').href=tides.url+'#page='+day.page;
  const table=node('table',null);table.append(node('caption',dateLabel(day.date+'T00:00:00+07:00')));
  const head=node('tr',null);for(const title of [t('ระดับน้ำ','Event'),t('เวลา (+07:00)','Time (+07:00)'),t('เมตร รทก.','Metres MSL')])head.append(node('th',title,{scope:'col'}));
  const thead=node('thead',null);thead.append(head);table.append(thead);const tbody=node('tbody',null);
  for(const event of day.events){const row=node('tr',null);row.append(node('td',event.kind==='high'?t('น้ำขึ้นเต็มที่','High water'):t('น้ำลงเต็มที่','Low water')),node('td',event.time),node('td',event.metresMsl.toFixed(2)));tbody.append(row);}table.append(tbody);$('tide-events').replaceChildren(table);
}
function renderSources() {
  const rows=[
    ['ชุดข้อมูลระบบระบายน้ำ','Drainage GIS','https://bmasedgis.bangkok.go.th/portal/apps/dashboards/e76fe4f3a9884565ac65dd80d43a9287',t('นำเข้า 7 ชั้นข้อมูลสาธารณะพร้อมพิกัด เก็บเฉพาะข้อมูลทรัพย์สิน ไม่เผยแพร่ชื่อหรือเบอร์โทรเจ้าหน้าที่ สถานีสูบน้ำบนแผนที่ไม่ได้บอกว่าเครื่องกำลังทำงาน','Seven public layers with agency geometry. Staff contact fields are excluded. A mapped pump does not establish whether it is running.')],
    ['จุดเสี่ยงน้ำท่วม','Flood-risk register','https://bmasedgis.bangkok.go.th/portal/apps/dashboards/a3d8a9fa438f4e219d56a3be16fcce5e',t('สถานะเป็นบันทึกการแก้ไขจุดเสี่ยง ไม่ใช่รายงานน้ำท่วมขณะนี้ ชั้นเพิ่มเติมปี 2568 ยังไม่รวม เพราะพบพิกัดในคอลัมน์ไม่ตรงกับรูปทรงและต้องตรวจสอบการซ้ำ','Statuses describe recorded remedial work, not flooding now. The separate 2025 additions are excluded pending coordinate and duplicate review.')],
    ['บัญชีคลอง คู ลำราง ลำกระโดง','Canal and drainage inventory','https://drive.google.com/file/d/1QqLbpWbZudTgxWEr0zo1peSI5osU5iML/view',t('หน้า 2 ระบุ 1,980 แห่ง: คลอง 1,210 และคู/ลำราง/ลำกระโดง 770 ความยาวรวม 2,744,923 ม. เป็นจำนวนในเอกสาร ไม่ใช่จำนวนเส้น GIS วันที่สำรวจไม่ระบุในส่วนที่ตรวจสอบ หน้า 372–373 มีบัญชีบึงรับน้ำ 21 แห่ง ไม่ใช้ตัวเลขนี้แทนความจุปัจจุบัน','Page 2 lists 1,980 waterways: 1,210 canals and 770 smaller drainage channels, totalling 2,744,923 m. Document inventory counts differ from GIS segments. Survey date was not established. Pages 372–373 list 21 retention basins; these figures are not current storage readings.')],
    ['ศูนย์ข้อมูล สนน.','DDS datacenter','https://datacenter.dds.bangkok.go.th/',t('หน้าแรกเป็นแบบฟอร์มเข้าสู่ระบบ ยังไม่พบ API สาธารณะ จึงเปิดเป็นแหล่งอ้างอิงเท่านั้น','The landing page requires sign-in. No public data API was established; linked for agency access only.')],
    ['ข่าวและประกาศ สนน.','DDS notices','https://dds.bangkok.go.th/index2.php',t('ดูประกาศต้นฉบับและวันเวลาเผยแพร่กับหน่วยงาน ข้อมูลในหน้านี้ไม่ใช่ประกาศเตือนภัย','Check original notices and publication times with the agency. This explorer does not issue warnings.')],
  ];
  $('sources').replaceChildren(...rows.map(([th,en,url,note])=>{const d=node('details',null);d.append(node('summary',t(th,en)),node('p',note),node('a',t('เปิดแหล่งข้อมูล','Open source'),{href:url,target:'_blank',rel:'noreferrer'}));return d;}),node('p',t('ตรวจสอบแหล่งข้อมูล 25 กันยายน 2569 · ไม่พบเงื่อนไขอนุญาตใช้ซ้ำที่ชัดเจนในบริการ GIS โปรดตรวจสอบกับหน่วยงานก่อนเผยแพร่ต่อ','Sources reviewed 25 September 2026. The GIS services supply no explicit reuse licence; check agency terms before redistribution.'),{class:'meta'}));
}
$('language').onclick=()=>{lang=lang==='th'?'en':'th';translate();};
$('layer').onchange=loadLayer;
$('search').oninput=()=>{limit=60;renderRecords();};
$('more').onclick=()=>{limit+=60;renderRecords();};
$('tide-date').onchange=renderTides;
try {
  if(typeof L!=='undefined'){
    map=L.map('map',{preferCanvas:true,zoomControl:true}).setView([13.752,100.505],13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    map.attributionControl.addAttribution('BMA DDS · reference');
  }else $('map').textContent=t('แผนที่โหลดไม่ได้ ยังอ่านรายการด้านข้างได้','Map unavailable; records remain accessible.');
}catch{$('map').textContent=t('แผนที่โหลดไม่ได้ ยังอ่านรายการด้านข้างได้','Map unavailable; records remain accessible.');}
await Promise.allSettled([
  (async()=>{try{manifest=await json('./data/manifest.json');for(const layer of manifest.layers)$('layer').append(node('option',layer[lang],{value:layer.id}));$('layer').disabled=false;renderSources();await loadLayer();}catch{$('status').textContent=t('โหลดทะเบียนไม่ได้ โปรดลองรีเฟรช','Register unavailable. Please reload.');}})(),
  (async()=>{try{tides=await json('./data/tides-2026.json');$('tide-date').value=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());renderTides();}catch{$('tide-events').textContent=t('ตารางน้ำขึ้นลงยังไม่พร้อม เปิด PDF ต้นฉบับได้','Tide table unavailable; use the original PDF.');}})(),
]);
