import {normalizeTraffic} from '../app/flood/evidence';
export async function floodEvidenceResponse():Promise<Response> {
  try {
    const r=await fetch('https://flood.nonarkara.org/api/traffic',{signal:AbortSignal.timeout(10000)});
    if(!r.ok)throw Error('Upstream unavailable');
    return Response.json(normalizeTraffic(await r.json()),{headers:{'Cache-Control':'public, max-age=60'}});
  } catch {
    return Response.json({error:'Flood reports unavailable; absence does not mean safe.'},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
