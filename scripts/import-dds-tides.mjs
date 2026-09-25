import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
export function parseTides(text) {
  const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  const days = [];
  for (const [m, month] of months.entries()) {
    const page = text.split('\f').find(p=>new RegExp(`\\b${month}\\s+2026`).test(p));
    if (!page) throw new Error(`Missing ${month}`);
    for (const line of page.split('\n')) {
      const tokens = line.trim().split(/\s+/);
      if (tokens.length !== 9 || !/^\d{1,2}$/.test(tokens[0])) continue;
      const day = Number(tokens[0]);
      const events = [];
      for (let i=0;i<4;i++) {
        const time=tokens[1+i*2], height=tokens[2+i*2];
        if (time==='-' && height==='-') continue;
        if (!/^\d{4}$/.test(time) || Number(time.slice(0,2))>23 || Number(time.slice(2))>59 || !Number.isFinite(Number(height))) throw new Error(`Bad tide row ${line}`);
        events.push({kind:i%2===0?'high':'low',time:time.slice(0,2)+':'+time.slice(2),metresMsl:Number(height)});
      }
      const date=`2026-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      if (day<1 || day>new Date(Date.UTC(2026,m+1,0)).getUTCDate()) throw new Error('Invalid date');
      days.push({date,page:m+1,events:events.sort((a,b)=>a.time.localeCompare(b.time))});
    }
  }
  if (days.length!==365 || new Set(days.map(d=>d.date)).size!==365) throw new Error(`Expected 365 unique dates; got ${days.length}`);
  return {source:'Royal Thai Navy Hydrographic Department, hosted by Bangkok DDS',url:'https://dds.bangkok.go.th/public_content/files/001/0006030_1.pdf',station:'Royal Thai Navy Headquarters',stationTh:'กองบัญชาการกองทัพเรือ',tier:'prediction',year:2026,timeZone:'Asia/Bangkok',datum:'mean sea level',caveat:'Astronomical prediction only. Excludes rainfall and dam releases; not a measured river level or flood warning.',days};
}
if (process.argv[1] && resolve(process.argv[1])===new URL(import.meta.url).pathname) {
  const result=parseTides(await readFile(process.argv[2],'utf8'));
  await writeFile(process.argv[3],JSON.stringify({...result,fetchedAt:new Date().toISOString()},null,2)+'\n');
  console.log(`${result.days.length} complete tide days`);
}
