import { AtlasView } from '../atlas/[district]/AtlasView';
import { worlds } from '../walkthrough-data';
import './flood.css';
export const metadata={title:'Bangkok Flood Edition',description:'Explore reported flooding on Bangkok’s 3D map. Source-labelled evidence, not a safe-route guarantee.'};
export default async function FloodPage({searchParams}:{searchParams:Promise<{at?:string}>}){
  const {at}=await searchParams;
  const p=at?.split(',').map(Number);
  const valid=p&&p.length===5&&p.every(Number.isFinite)&&p[0]>=100.2&&p[0]<=101&&p[1]>=13.4&&p[1]<=14.2&&p[2]>=0&&p[2]<=22&&p[3]>=0&&p[3]<=85&&Math.abs(p[4])<=360;
  const view=valid?{center:[p[0],p[1]] as [number,number],zoom:p[2],pitch:p[3],bearing:p[4]}:{center:[100.55,13.76] as [number,number],zoom:11,pitch:50};
  return <div className="flood-edition"><AtlasView world={worlds.find(w=>w.id==='historic-core')!} embedded floodEdition initialView={view} /></div>;
}
