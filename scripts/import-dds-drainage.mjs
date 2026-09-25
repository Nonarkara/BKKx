// Public DDS ArcGIS reference geometry. Run explicitly; builds use the last
// validated snapshot so an agency outage cannot erase published information.
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
export const BASE = 'https://bmasedgis.bangkok.go.th/sedgis/rest/services/Hosted/';
export const LAYERS = [
  ['risk', 'จุดเสี่ยงน้ำท่วม', 'Flood-risk locations', 'จุดเสี่ยงรวม_737_expo68/FeatureServer/0', 'name,district,problems,status_detail', 'name', 'district'],
  ['canals', 'คลอง', 'Canals', 'drainage_200268_gdb/FeatureServer/4', 'canal_name,district_t,year,f_canal,to_canal,canal_width,length_bma', 'canal_name', 'district_t'],
  ['pumps', 'สถานีสูบน้ำ', 'Pumping stations', 'drainage_200268_gdb/FeatureServer/2', 'pump_name,district_t,year,hy_lname,owner', 'pump_name', 'district_t'],
  ['gates', 'ประตูระบายน้ำ', 'Water gates', 'drainage_200268_gdb/FeatureServer/1', 'gate_name,district_t,year,hy_lname,owner', 'gate_name', 'district_t'],
  ['sumps', 'บ่อสูบน้ำ', 'Pump sumps', 'drainage_200268_gdb/FeatureServer/3', 'sump_name,district_t,year,owner', 'sump_name', 'district_t'],
  ['tunnels', 'อุโมงค์ระบายน้ำ', 'Drainage tunnels', 'drainage_200268_gdb/FeatureServer/7', 'tunnel_name,year,f_tunnel,to_tunnel,owner', 'tunnel_name', null],
  ['protection', 'พื้นที่ป้องกันน้ำท่วม', 'Flood-protection areas', 'drainage_200268_gdb/FeatureServer/8', 'fd_name,district_t,year,owner', 'fd_name', 'district_t'],
];
export function validGeometry(g) {
  if (!g || !['Point','MultiPoint','LineString','MultiLineString','Polygon','MultiPolygon'].includes(g.type)) return false;
  const visit = c => Array.isArray(c) && c.length > 0 && (typeof c[0] === 'number'
    ? c.length >= 2 && c.every(Number.isFinite) && c[0] >= 100 && c[0] <= 101.2 && c[1] >= 13.3 && c[1] <= 14.3
    : c.every(visit));
  return visit(g.coordinates);
}
async function get(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!r.ok) throw new Error(`DDS HTTP ${r.status}`);
  const j = await r.json();
  if (j.error) throw new Error(`DDS error: ${JSON.stringify(j.error)}`);
  return j;
}
export async function importDds(out) {
  await mkdir(out, { recursive: true });
  const fetchedAt = new Date().toISOString();
  const manifest = { source: 'BMA Department of Drainage and Sewerage', tier: 'reference', fetchedAt,
    observationDate: null, licence: 'Publicly accessible agency data; no explicit reuse licence supplied by these services.',
    caveat: 'Infrastructure and risk inventory; no current flooding, pump operation or gate position is measured here.', layers: [] };
  for (const [id, th, en, path, fields, nameField, districtField] of LAYERS) {
    const url = BASE + path;
    const meta = await get(url + '?f=json');
    const ids = await get(url + '/query?' + new URLSearchParams({ where:'1=1', returnIdsOnly:'true', f:'json' }));
    if (!Array.isArray(ids.objectIds) || !ids.objectIds.length) throw new Error(`No IDs for ${id}`);
    const features = [];
    for (let offset = 0; offset < ids.objectIds.length; offset += 200) {
      const wanted = ids.objectIds.slice(offset, offset + 200);
      const j = await get(url + '/query?' + new URLSearchParams({ objectIds:wanted.join(','), outFields:meta.objectIdField+','+fields,
        returnGeometry:'true', outSR:'4326', geometryPrecision:'6', maxAllowableOffset:'0.00001', f:'geojson' }));
      if (!Array.isArray(j.features) || j.features.length !== wanted.length || j.exceededTransferLimit) throw new Error(`Incomplete page: ${id}`);
      features.push(...j.features);
    }
    const seen = new Set();
    let excluded = 0;
    const safe = features.flatMap(f => {
      const oid = f.properties[meta.objectIdField];
      if (seen.has(oid)) throw new Error(`Duplicate ${id}/${oid}`);
      seen.add(oid);
      if (!validGeometry(f.geometry)) { excluded++; return []; }
      // Select public asset fields only; never mirror staff phone/name columns.
      const p = Object.fromEntries(fields.split(',').map(k=>[k,f.properties[k]??null]));
      return [{type:'Feature',id:oid,geometry:{type:f.geometry.type,coordinates:f.geometry.coordinates},properties:{...p,name:String(p[nameField]||th),district:districtField?String(p[districtField]||''):''}}];
    });
    if (!safe.length) throw new Error(`No usable geometry: ${id}`);
    const bytes = JSON.stringify({type:'FeatureCollection',features:safe});
    const hash = createHash('sha256').update(bytes).digest('hex');
    const file = `${id}-${hash.slice(0,12)}.geojson`;
    await writeFile(resolve(out,file),bytes+'\n');
    manifest.layers.push({id,th,en,url,file,count:safe.length,upstreamCount:features.length,excludedGeometry:excluded,
      sha256:createHash('sha256').update(bytes+'\n').digest('hex'),sourceEditedAt:meta.editingInfo?.lastEditDate?new Date(meta.editingInfo.lastEditDate).toISOString():null});
    console.log(`${id}: ${safe.length} mapped / ${features.length} source records; ${excluded} invalid geometries excluded`);
  }
  await writeFile(resolve(out,'manifest.json.tmp'),JSON.stringify(manifest,null,2)+'\n');
  await rename(resolve(out,'manifest.json.tmp'),resolve(out,'manifest.json'));
  return manifest;
}
if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  await importDds(resolve(process.argv[2] || 'site/public/drainage/data'));
}
