// Why shophouses are good for cities.
//
// The diagrams are Abhinav Bhardwaj's carousel "Why Old Towns Feel Better"
// (Instagram, 27 September 2026). The Bangkok numbers are this repository's:
// the screened spine, the cluster rollup, the pressure model's stated road
// assumption, and the measured record already in the Bible. Where a diagram
// rounds a study, the sentence follows the study.
//
// STOREYS was counted from site/public/data/shophouse-spine.json on this
// branch (the `storeys` field). Re-count if the spine is rebuilt.
//   missing 1664 · known 769 · storeys 2–4: 653 · storeys ≥5: 111

import { DIMENSIONS } from "./shophouse-bible.ts";
import { SIGNATURE } from "./shophouse-gazetteer.ts";
import { PRESSURE_DISTRICTS, SPLITS } from "./shophouse-pressure.ts";
import { CLUSTER_RECORDS, SPINE_TOTAL } from "./shophouse-spine-index.ts";

export const CAROUSEL = {
  author: "Abhinav Bhardwaj",
  handle: "@abhinavbwj",
  profileUrl: "https://www.instagram.com/abhinavbwj/",
  postUrl: "https://www.instagram.com/p/DdydSbEkqR-/",
  title: "Why Old Towns Feel Better",
  date: "27 September 2026",
} as const;

/** Counted from the spine JSON. See the file header. */
export const STOREYS = {
  missing: 1664,
  known: 769,
  twoToFour: 653,
  fiveOrMore: 111,
} as const;

export type WhyPrinciple = {
  id: string;
  index: string;
  slide: number;
  src: string;
  alt: string;
  titleTh: string;
  titleEn: string;
  th: string;
  en: string;
  bangkokTh: string;
  bangkokEn: string;
  caveatTh?: string;
  caveatEn?: string;
};

export type WhySource = {
  id: string;
  citation: string;
  url?: string;
  usedFor: string;
};

function cluster(slug: string) {
  const row = CLUSTER_RECORDS.find((r) => r.slug === slug);
  if (!row) throw new Error(`shophouse-why: missing cluster ${slug}`);
  return row;
}

function district(name: string) {
  const row = PRESSURE_DISTRICTS.find((d) => d.district === name);
  if (!row) throw new Error(`shophouse-why: missing district ${name}`);
  return row;
}

function per100(frontageM: number): string {
  return (100 / frontageM).toFixed(1);
}

function metres(n: number): string {
  return n.toFixed(1);
}

const alley = DIMENSIONS.find((d) => d.metric === "Alley width, Tha Tien");
if (!alley) throw new Error("shophouse-why: Tha Tien alley width missing from the Bible");

const phraNakhon = district("Phra Nakhon");
const samphanthawong = district("Samphanthawong");
const samPhraeng = cluster("sam-phraeng");
const phrayaSi = cluster("phraya-si-rows");
const songWat = cluster("song-wat");
if (samPhraeng.medianFrontage !== phrayaSi.medianFrontage) {
  throw new Error("shophouse-why: rewrite the door paragraph; the two medians no longer match");
}
if (samPhraeng.documentedUnits == null) {
  throw new Error("shophouse-why: Sam Phraeng documented unit count missing");
}

const cityFront = SIGNATURE.frontage.p50;
const cityDoors = per100(cityFront);
const narrowFront = SIGNATURE.frontage.p10;
const wideFront = SIGNATURE.frontage.p90;

export const MEASURES = [
  {
    value: `${metres(cityFront)} m`,
    labelEn: "Median frontage",
    labelTh: "หน้ากว้างมัธยฐาน",
    noteEn: `${SIGNATURE.n.toLocaleString("en-US")} screened footprints`,
    noteTh: `รอยอาคารที่คัดไว้ ${SIGNATURE.n.toLocaleString("en-US")} หลัง`,
  },
  {
    value: cityDoors,
    labelEn: "Fronts per 100 m",
    labelTh: "หน้าบ้านต่อ 100 เมตร",
    noteEn: "If each median front is one door",
    noteTh: "ถ้านับหน้ามัธยฐานเป็นประตูหนึ่งบาน",
  },
  {
    value: `${metres(phraNakhon.medianFrontageM)} m`,
    labelEn: "Phra Nakhon median",
    labelTh: "มัธยฐานเขตพระนคร",
    noteEn: `${phraNakhon.count.toLocaleString("en-US")} footprints · ${per100(phraNakhon.medianFrontageM)} / 100 m`,
    noteTh: `${phraNakhon.count.toLocaleString("en-US")} หลัง · ${per100(phraNakhon.medianFrontageM)} ต่อ 100 เมตร`,
  },
  {
    value: `${SPLITS.assumedRoadM} m`,
    labelEn: "Assumed carriageway",
    labelTh: "ผิวจราจรที่แบบจำลองสมมติ",
    noteEn: "Stated in the pressure model. Not a measured section.",
    noteTh: "สมมติฐานในแบบจำลองแรงกดดัน ไม่ใช่รูปตัดที่วัดมา",
  },
] as const;

export const PRINCIPLES: WhyPrinciple[] = [
  {
    id: "wall",
    index: "01",
    slide: 3,
    src: "/shophouses/why/slide-3.png",
    alt: "Diagram of a street held by a continuous wall of buildings, against a street of detached buildings with gaps.",
    titleTh: "ผนังที่ทำให้ถนนเป็นห้อง",
    titleEn: "The wall that makes a street",
    th: "ถนนจะอ่านเป็นห้องกลางแจ้งได้เมื่อสองข้างมีผนังต่อเนื่อง Sitte เขียนเรื่องนี้ไว้ในปี 1889 Cullen เรียกผลนั้นว่า enclosure คือขอบที่กันไม่ให้สายตารั่วออกจากถนน Lynch เรียกขอบแบบเดียวกันว่า edge คือเส้นที่คนเดินใช้จำทาง Conzen มองผังเมืองเป็นเนื้อเยื่อของแปลง ถนน และอาคาร ตึกแถวเป็นผนังนั้นโดยวิธีสร้าง ผนังร่วมกั้นคูหา ตัวอาคารชิดเขตที่ดิน และหน้าร้านเรียงกันโดยไม่มีสนามหน้าบ้านมาคั่น",
    en: "A street reads as an outdoor room when both sides hold a continuous wall. Sitte wrote that in 1889. Cullen called the result enclosure: an edge that keeps the eye from leaking out of the street. Lynch's name for the same line is an edge, the one a walker uses to remember a route. Conzen read a town plan as a tissue of plots, streets and buildings. A shophouse row is that wall by the way it is built. Party walls divide the bays, the building sits on the plot line, and the shopfronts run on without a front garden between them.",
    bangkokTh: `กฎกระทรวงฉบับที่ 55 ข้อ 4 ตัดผนังนี้เอง แถวหนึ่งยาวได้ไม่เกิน 10 คูหา และไม่เกิน 40 เมตร แล้วต้องเว้น ช่องที่เห็นบนถนนเก่าหลายสายจึงเป็นจังหวะของกฎกันไฟ ที่สามแพร่ง ระบบคัดรอยอาคารได้ ${samPhraeng.n.toLocaleString("en-US")} หลัง ค่ามัธยฐานของแถวที่จับกลุ่มได้คือ ${samPhraeng.medianRowUnits} คูหา และ ${samPhraeng.overRowCap} หลังอยู่ในแถวที่ยาวเกิน 10 คูหาแล้ว อาคารเหล่านี้จำนวนมากสร้างก่อนกฎ`,
    bangkokEn: `Ministerial Regulation No. 55, clause 4, cuts that wall on purpose. A row may run no more than 10 bays and no more than 40 metres, and then it has to stop. The gap on many old streets is the rhythm of a fire rule. At Sam Phraeng the screen found ${samPhraeng.n.toLocaleString("en-US")} footprints. The median grouped row is ${samPhraeng.medianRowUnits} bays, and ${samPhraeng.overRowCap} footprints already sit in a run longer than 10 bays. Much of this fabric predates the rule.`,
    caveatTh: "ผนังต่อเนื่องทำให้ถนนเป็นห้องได้ และทำให้ถนนทึบได้ในคราวเดียวกัน หัวข้อเรื่องกำแพงทึบอยู่ถัดไป",
    caveatEn: "A continuous wall can hold a street, and it can also deaden one. The blank-wall section is the other half of this drawing.",
  },
  {
    id: "section",
    index: "02",
    slide: 4,
    src: "/shophouses/why/slide-4.png",
    alt: "Diagram of street width against building height, from an equal proportion to a street so wide the walls no longer enclose it.",
    titleTh: "ถนนกว้างเท่าไร เมื่อเทียบกับกำแพง",
    titleEn: "How wide the street is, against the wall",
    th: "กฎคร่าวที่ส่งต่อกันมาจาก Spreiregen สู่ Manual for Streets ของอังกฤษ ขอให้ระยะระหว่างแนวอาคารอยู่ระหว่างหนึ่งถึงสามเท่าของความสูงกำแพง ระยะเท่ากับความสูงอ่านเป็นตรอก ระยะเป็นสองเท่าของความสูงยังเป็นถนน สามเท่าคือปลายเปิดของสิ่งที่คู่มือยังเรียกว่ามี enclosure ตาราง 5.1 วางถนนทั่วไปไว้ระหว่างอัตราส่วนสูงต่อกว้าง 1:1.5 ถึง 1:3 และบอกว่า 1:3 ยังใช้ได้ดี พ้นราวหกเท่า กำแพงไม่กั้นพื้นที่อีกต่อไป คู่มือเรียกสิ่งนี้ว่าแนวทาง และเขียนไว้ว่าไม่มีกฎตายตัว",
    en: "The rule of thumb that runs from Spreiregen into the UK Manual for Streets asks the distance between frontages to sit between one and three times the height of the wall. Equal width and height reads as a lane. Twice the height still reads as a street. Three times the height is the open end of what the manual still calls enclosed. Table 5.1 puts ordinary streets between a height-to-width ratio of 1:1.5 and 1:3, and calls 1:3 generally effective. Past about six times, the wall no longer holds the space. The manual calls this a guide, and says there is no fixed rule.",
    bangkokTh: `ระบบนี้ไม่มีรูปตัดจากแนวอาคารถึงแนวอาคาร สิ่งที่มีแคบกว่านั้น งานสำรวจท่าเตียนของ Lin ให้ความกว้างซอยไว้ที่ ${alley.value} ข้อ 22 ของกฎกระทรวงเดียวกันกำหนดความสูงชั้นที่ตึกแถวใช้จริง ชั้นล่าง 3.5 เมตร ชั้นบนชั้นละ 3 เมตร ตึกสองชั้นจึงสูงราว 6.5 เมตร ซอยกว้างราว 3.3 เมตรจึงกว้างประมาณครึ่งหนึ่งของกำแพง แคบกว่าปลายเท่ากันของกฎคร่าว ตึกสี่ชั้นสูงราว 12.5 เมตร ทำให้ซอยเดียวกันเหลือราวหนึ่งในสี่ Lin ชี้ความแคบนี้ว่าเป็นเหตุหนึ่งที่การค้าเสียเปรียบ แบบจำลองแรงกดดันสมมติผิวจราจรกว้าง ${SPLITS.assumedRoadM} เมตร เพราะความกว้างถนนรายแปลงไม่ได้เผยแพร่ แปดเมตรนั้นคือทางรถ ทางเท้ากับระเบียงหน้าร้านอยู่นอกตัวเลขนี้ และไฟล์นี้ไม่ได้วัดระยะเต็มนั้น`,
    bangkokEn: `This project has no measured building-to-building section. What it does have is narrower. Lin's Tha Tien survey put the alleys at ${alley.value}. Clause 22 of the same regulation sets the floor heights these rows actually use: 3.5 metres on the ground, 3 metres above. A two-storey row is about 6.5 metres of wall, so an alley of about 3.3 metres is roughly half as wide as the wall is tall, tighter than the equal-width end of the guide. A four-storey row, about 12.5 metres, leaves that alley closer to a quarter. Lin already named the narrowness as one reason trade suffered. The pressure model assumes an ${SPLITS.assumedRoadM} metre carriageway because per-plot road widths are not published. Those eight metres are the vehicle way. Footways and the shop terrace sit outside the number, and this file does not measure the full distance.`,
    caveatTh: "ภาพวาดเขียนช่วงสัดส่วนราวกับเป็นกฎหมาย คู่มือถนนของอังกฤษเรียกว่าแนวทาง และบอกว่าระยะระหว่างแนวอาคารที่แคบกว่า 12 ถึง 18 เมตรซึ่งพบบนถนนที่อยู่อาศัยทั่วไป ก็ยังใช้ได้",
    caveatEn: "The diagram draws the bands as if they were a statute. Manual for Streets calls them a guide, and notes that distances under the usual 12 to 18 metres between residential frontages can still work.",
  },
  {
    id: "height",
    index: "03",
    slide: 16,
    src: "/shophouses/why/slide-16.png",
    alt: "Diagram of street buildings up to four storeys, where an upper window still belongs to the street, against a taller building that only overlooks it.",
    titleTh: "สี่ชั้นยังเป็นส่วนของถนน",
    titleEn: "Four storeys still belongs to the street",
    th: "งานเรื่องชีวิตบนถนนของ Gehl และแบบแผนที่ 21 ใน A Pattern Language วางความสูงที่ใช้ได้ของอาคารริมถนนไว้ราวสี่ชั้น จากทางเท้ายังเห็นหน้าคนที่หน้าต่างชั้นบน และคนข้างบนยังลงมาได้ พ้นจากนั้นชั้นบนกลายเป็นจุดชมถนน มากกว่าจะเป็นส่วนของถนน ชั้นล่างทำงานหนักกว่าทุกชั้นที่อยู่เหนือมัน Sitte สัดส่วนถนนเก่าให้กำแพงกับความกว้างอยู่ในบทสนทนาเดียวกัน อาคารสูงที่วางบนฐานถอยร่นออกจากบทสนทนานั้น",
    en: "Gehl's street-life work, and pattern 21 of A Pattern Language, put the useful height of a building on a street at about four storeys. From the pavement you can still see a face in an upper window, and the person up there can still come down. Above that, the upper floors become a view of the street. The ground floor does more of the work than any floor over it. Sitte proportioned old streets so the wall and the width stayed in one conversation. A tall building set back on a podium leaves that conversation.",
    bangkokTh: `ข้อ 22 คือรูปตัดนั้น ชั้นล่างไม่ต่ำกว่า 3.5 เมตร ชั้นถัดไปไม่ต่ำกว่า 3 เมตร สี่ชั้นจึงสูงราว 12.5 เมตรก่อนถึงหลังคา ในสไปน์รายอาคาร ${SPINE_TOTAL.toLocaleString("en-US")} หลัง ซึ่งคนละไฟล์กับชุดคัดทั้งเมือง ${SIGNATURE.n.toLocaleString("en-US")} หลังด้านบน มีจำนวนชั้นบันทึกไว้ ${STOREYS.known.toLocaleString("en-US")} หลัง ในจำนวนนั้น ${STOREYS.twoToFour.toLocaleString("en-US")} หลังเป็นสองถึงสี่ชั้น และ ${STOREYS.fiveOrMore.toLocaleString("en-US")} หลังสูงห้าชั้นขึ้นไป อีก ${STOREYS.missing.toLocaleString("en-US")} หลังไม่มีจำนวนชั้น ตึกแถวธรรมดา ในจุดที่เรามองเห็นจำนวนชั้น อยู่ในแถบสี่ชั้นนี้อยู่แล้ว`,
    bangkokEn: `Clause 22 is that section. The ground floor is at least 3.5 metres, and each floor above is at least 3 metres, so four storeys is about 12.5 metres of wall before the roof. The per-building spine holds ${SPINE_TOTAL.toLocaleString("en-US")} footprints, a later file than the ${SIGNATURE.n.toLocaleString("en-US")}-footprint screen above. Of those, ${STOREYS.known.toLocaleString("en-US")} have a storey count. ${STOREYS.twoToFour.toLocaleString("en-US")} of those are two, three or four storeys, and ${STOREYS.fiveOrMore.toLocaleString("en-US")} are five or taller. The other ${STOREYS.missing.toLocaleString("en-US")} have no storey in the file. Where a count exists, the ordinary shophouse already sits inside the four-storey band.`,
    caveatTh: "ประโยคที่ว่าคนอยู่เหนือชั้นสี่ไม่ค่อยลงมา เป็นข้อสังเกตจากถนนในยุโรป ไม่ใช่การนับครัวเรือนกรุงเทพฯ ครอบครัวที่อยู่ชั้นสามของคูหาไม่ใช่ผู้อยู่อาศัยในอาคารสูง",
    caveatEn: "The line that people above the fourth floor rarely come down is an observation from European streets. It is not a count of Bangkok households. A family on the third floor of a bay is a different thing from a resident of a tower.",
  },
  {
    id: "doors",
    index: "04",
    slide: 7,
    src: "/shophouses/why/slide-7.png",
    alt: "Diagram of a walking pace passing 15 to 20 shopfronts in 100 metres, a new door about every five seconds.",
    titleTh: "ประตูใหม่ทุกๆ ห้าวินาที",
    titleEn: "A new door every five seconds",
    th: "Gehl, Kaefer และ Reigstad นับถนนค้าขายที่คึกคักได้ที่ 15 ถึง 20 หน่วยต่อ 100 เมตร และ 20 ถึง 25 ช่องประตู ภาพวาดยุบสองช่วงนี้เหลือช่วงเดียว ที่ความเร็วเดิน ฉากข้างหน้าเปลี่ยนราวทุกห้าวินาที ช่วงหน่วยใหญ่ของพวกเขาคือ 2 ถึง 5 ประตูต่อ 100 เมตร การเดินเดียวกันนั้นยืดไปทางยี่สิบวินาทีระหว่างประตู และถนนเงียบ จังหวะนี้โผล่ในห้างด้วย มันคือการนับทางเข้า",
    en: "Gehl, Kaefer and Reigstad counted lively shopping streets at 15 to 20 units per 100 metres, and at 20 to 25 doorways. The diagram folds the two bands into one. At a walking pace the scene changes about every five seconds. Their large-unit category, 2 to 5 doors per 100 metres, stretches that same walk toward twenty seconds between doors, and the street goes quiet. The same rhythm turns up inside shopping malls. It is a count of entrances.",
    bangkokTh: `ชุดที่คัดทั้งเมืองมีหน้ากว้างมัธยฐาน ${metres(cityFront)} เมตร จากรอยอาคาร ${SIGNATURE.n.toLocaleString("en-US")} หลัง ถ้านับหนึ่งหน้าเป็นหนึ่งประตู จะได้ ${cityDoors} ประตูต่อ 100 เมตร อยู่ในช่วงนั้น เขตในชุดเดียวกันไม่เท่ากัน เขตพระนคร ${phraNakhon.count.toLocaleString("en-US")} หลัง มีหน้ากว้างมัธยฐาน ${metres(phraNakhon.medianFrontageM)} เมตร ราว ${per100(phraNakhon.medianFrontageM)} ต่อ 100 เมตร เขตสัมพันธวงศ์ ${samphanthawong.count.toLocaleString("en-US")} หลัง อยู่ที่ ${metres(samphanthawong.medianFrontageM)} เมตร ราว ${per100(samphanthawong.medianFrontageM)} ในบัญชีรายแถวซึ่งเป็นไฟล์ถัดมา สามแพร่งกับแถวพระยาศรีอยู่ที่ ${metres(samPhraeng.medianFrontage)} เมตรทั้งคู่ ราว ${per100(samPhraeng.medianFrontage)} ทรงวาดที่ ${metres(songWat.medianFrontage)} เมตร ได้ ${per100(songWat.medianFrontage)} พอดีขอบล่างของช่วงเดียวกัน หางที่กว้างไม่เข้าช่วง เปอร์เซ็นไทล์ที่ 90 ของชุดนั้นคือ ${metres(wideFront)} เมตร ราว ${per100(wideFront)} ประตูต่อ 100 เมตร ซึ่งในกระดาษของพวกเขาเป็นแนวผสม`,
    bangkokEn: `The citywide screen’s median frontage is ${metres(cityFront)} metres, across ${SIGNATURE.n.toLocaleString("en-US")} footprints. If each front is one door, that is ${cityDoors} doors per 100 metres, inside the band. Districts in that same screen are not alike. Phra Nakhon’s ${phraNakhon.count.toLocaleString("en-US")} footprints have a median front of ${metres(phraNakhon.medianFrontageM)} metres, about ${per100(phraNakhon.medianFrontageM)} per 100 metres. Samphanthawong’s ${samphanthawong.count.toLocaleString("en-US")} sit at ${metres(samphanthawong.medianFrontageM)} metres, about ${per100(samphanthawong.medianFrontageM)}. In the later per-building rollup, Sam Phraeng and the Phraya Si rows both come in at ${metres(samPhraeng.medianFrontage)} metres, about ${per100(samPhraeng.medianFrontage)}. Song Wat, at ${metres(songWat.medianFrontage)} metres, lands at ${per100(songWat.medianFrontage)}, on the lower edge of the same band. The wide tail misses it. The screen’s 90th percentile frontage is ${metres(wideFront)} metres, about ${per100(wideFront)} doors per 100 metres, which their paper would score as a mixed front.`,
    caveatTh: `หน้ากว้างจะนับเป็นประตูได้ก็ต่อเมื่อคูหานั้นยังมีทางเข้าเดียว สองคูหาที่ทะลุเป็นร้านเดียว หรือประตูม้วนที่ไม่เคยเปิด ตัดทางเข้าที่ตัวเลขนี้สมมติไว้ ข้อ 2 วางพื้นความกว้างทางกฎหมายไว้ที่ 4 เมตรจากศูนย์กลางเสาถึงศูนย์กลางเสา ซึ่งเป็นเหตุให้คูหาจำนวนมากกองอยู่แถวนั้น เปอร์เซ็นไทล์ที่ 10 คือ ${narrowFront} เมตร ราว ${per100(narrowFront)} ต่อ 100 เมตร บางหลังเป็นคูหาเก่าจริง บางหลังเป็นรูปทรงที่ไม่ควรเชื่อทีละหลัง`,
    caveatEn: `A frontage counts as a door only while that bay still has one entrance. Two bays knocked into one shop, or a shutter that never opens, remove the entrance this count assumes. Clause 2 sets a legal floor of 4 metres from column centre to column centre, which is why so many bays cluster there. The 10th percentile is ${narrowFront} metres, about ${per100(narrowFront)} per 100 metres. Some of those are real old bays. Some are geometry that should not be trusted one building at a time.`,
  },
  {
    id: "open",
    index: "05",
    slide: 8,
    src: "/shophouses/why/slide-8.png",
    alt: "Diagram of an open, active shopfront where people stop, against a closed front they walk past.",
    titleTh: "หน้าร้านที่เปิด คือที่ที่คนหยุด",
    titleEn: "An open front is where people stop",
    th: "บนถนนผสมเจ็ดสายในโคเปนเฮเกน ผู้เขียนชุดเดียวกันพบว่าการหยุดและกิจกรรมอื่นหน้าชั้นล่างที่เปิด มีมากกว่าหน้าชั้นล่างที่ปิดถึงเจ็ดเท่า คนยังเดินช้าลงราว 13 เปอร์เซ็นต์ และ 75 เปอร์เซ็นต์หันไปทางแนวที่เปิด เทียบกับ 21 เปอร์เซ็นต์ที่แนวปิด ภาพวาดปัดตัวเลขการหันหน้าเป็น 75 กับ 25 คำว่าเปิดในนิยามของพวกเขาหมายถึงมีของหรือมีชีวิตที่ขอบถนน มีประตูที่ไม่ได้ยกขั้น มีด้านหน้าที่มองทะลุได้ และมีประตูหลายบาน คำว่าปิดหมายถึงทางเข้าน้อย หน่วยใหญ่ และผิวที่ปิด ตัวเลขเจ็ดเท่าคือการหยุดกับเวลาที่คนอยู่ตรงนั้น พวกเขาไม่ให้มันกลายเป็นตัวเลขยอดขาย แล้วบันทึกสิ่งที่ตามมา ถนนที่คนหยุดคือถนนที่ร้านมีโอกาส",
    en: "On seven mixed streets in Copenhagen, the same authors found seven times as many stops and other activities in front of active ground floors as in front of passive ones. People also walked about 13 percent more slowly, and 75 percent turned their head toward an active front, against 21 percent at a closed one. The diagram rounds that head-turn gap to 75 and 25. Active, in their definition, means goods or life at the edge, a door without a step, a front you can see through, and many doors. Passive means few entrances, a large unit, and a closed skin. The sevenfold figure is stops and time spent. They refuse to turn it into a sales number, and then note the plain consequence: a street where people pause is a street where a shop has a chance.",
    bangkokTh: "ชั้นล่างของตึกแถวคือร้าน ทางเข้าด้านหน้ากับโถงในโครงของถิรพาสอยู่ติดถนน และระเบียงราวหนึ่งเมตรบนหน้าอาคารคือแถบที่เจ้าของกับหาบเร่ใช้จริง นั่นเป็นแนวเปิดเมื่อประตูม้วนยกขึ้น และเป็นกำแพงทึบเมื่อประตูม้วนลง ชนิดอาคารทำให้แบบแรกเป็นไปได้ มันไม่รับประกันว่าจะเกิด ธนาคาร ที่จอดรถ หรือโชว์รูมที่ปิดสนิทในคูหาเดียวกัน ใช้หน้ากว้างไป และยกเลิกผลที่กระดาษนั้นวัดได้",
    bangkokEn: "The ground floor of a shophouse is the shop. Tirapas's front entrance and hall sit on the street, and the terrace, about a metre of facade, is the strip owners and vendors actually occupy. That is an active front when the shutter is up. It is a blank wall when the shutter is down. The type makes the first possible. A bank, a car park, or a sealed showroom in the same bay spends the plot width and cancels the effect the paper measured.",
    caveatTh: "ถนนทั้งเจ็ดอยู่ในโคเปนเฮเกน ช่วงที่เปิดกับช่วงที่ปิดอยู่ใกล้กัน และตัวอย่างคือถนนเหล่านั้น มันเป็นตัวนับกลไกที่ดีที่สุดที่มีอยู่ มันไม่ใช่การสำรวจคนเดินในกรุงเทพฯ",
    caveatEn: "The seven streets were in Copenhagen, the active and passive stretches stood close together, and the sample is those streets. It is the best count we have of the mechanism. It is not a Bangkok pedestrian survey.",
  },
  {
    id: "blank",
    index: "06",
    slide: 9,
    src: "/shophouses/why/slide-9.png",
    alt: "Diagram of people walking faster and looking away beside a blank wall, and slowing where the front has doors and detail.",
    titleTh: "กำแพงทึบคือที่ที่คนเดินหนี",
    titleEn: "A blank wall is somewhere to walk away from",
    th: "ช่วงปิดของ Gehl คือศูนย์ถึงสองประตูต่อ 100 เมตร ผิวเรียบ ไม่มีอะไรที่ระดับสายตา คนเดินเร็วขึ้น มองออกไปทางอื่น และเลือกทางเท้าฝั่งตรงข้าม การเดินของ Colin Ellard ที่เขียนไว้ใน Places of the Heart ปี 2015 จับความเบื่อแบบนั้นที่ร่างกาย เซนเซอร์ที่ข้อมือวัดการนำไฟฟ้าของผิว ซึ่งตกเมื่อด้านหน้าอาคารไม่มีอะไรให้มอง และคนบอกว่าเบื่อ ภาพวาดเติมคอร์ติซอลกับอัตราเต้นของหัวใจเข้าไป การเดินบนถนนของ Ellard ไม่ได้เก็บน้ำลายหรือชีพจรสำหรับข้อนั้น ผลคอร์ติซอลที่เขาชี้ต่อไปเป็นงานทดลองในห้องแล็บเรื่องความเบื่อ จากการดูภาพที่น่าเบื่อ เขาถือว่าเส้นไปสู่สุขภาพเป็นโซ่ที่เป็นไปได้ ไม่ใช่ตัวเลขที่วัดบนทางเท้า",
    en: "Gehl's closed category is zero to two doors per 100 metres: a uniform skin, with nothing at eye level. People walk faster, look away, and take the other pavement. Colin Ellard's walks, written up in Places of the Heart (2015), caught the bodily version of that boredom. Wrist sensors measured skin conductance, which falls when a facade has nothing to look at, and people said they were bored. The diagram adds cortisol and heart rate. Ellard's street walks did not take saliva or a pulse for that claim. The cortisol result he points to is a separate laboratory study of boredom, watching a dull film. He treats the health link as a plausible chain, not as a number taken on the pavement.",
    bangkokTh: "ผนังร่วมระหว่างคูหาทึบโดยหน้าที่ของมัน และมันหันเข้าหาเพื่อนบ้าน ไม่ได้หันเข้าหาถนน ผนังที่สำคัญคือผนังริมถนน และมันเสียในแบบที่เฉพาะเจาะจงที่นี่ ประตูม้วนกว้างเท่าคูหา ชั้นล่างที่กลายเป็นที่จอดรถ หน้าธนาคารที่มีประตูบานเดียว ชั้นบนของตึกแถวมักเงียบ หน้าต่างเล็ก ครัวเรือน ผ้าที่ตาก และนั่นไม่ใช่ปัญหาที่กระดาษนี้ว่า ปัญหาคือชั้นล่างที่ตาย ไม่ใช่ชั้นสองที่เรียบ ช่องเว้นตามข้อ 4 เป็นจังหวะพักของแถว มันจะกลายเป็นกำแพงทึบก็ต่อเมื่อสิ่งที่อยู่ในช่องนั้นไม่มีอะไรให้หยุด",
    bangkokEn: "The party wall between bays is blank by its job, and it faces the neighbour. The wall that matters faces the street, and it fails here in a particular way: a roller shutter the width of the bay, a ground floor turned over to parking, a bank front with one door. Upper floors of a shophouse are often quiet — a small window, a household, laundry — and the paper is not complaining about a plain second storey. The complaint is a dead ground floor. Clause 4's fire gap is a pause in the row. It becomes a blank wall when whatever fills the gap offers nothing to stop for.",
  },
  {
    id: "owners",
    index: "07",
    slide: 12,
    src: "/shophouses/why/slide-12.png",
    alt: "Diagram of one large building with a single owner beside a row of narrow plots, each with its own owner.",
    titleTh: "แปลงแคบ เจ้าของมาก",
    titleEn: "Narrow plots, many owners",
    th: "ระยะร้อยเมตรที่มีเจ้าของคนเดียวเป็นได้ทั้งล็อบบี้เดียว ผู้เช่าเดียว และการตัดสินใจปิดร้านครั้งเดียว ระยะเดียวกันที่หั่นเป็นแปลงแคบคือเจ้าของหลายคน สัญญาเช่าหลายฉบับ และเหตุหลายอย่างที่ทำให้มีคนอยู่ตรงนั้นในบ่ายวันอังคาร ภาพวาดยก Poundbury กับ Dorchester มาประกอบ และใส่ราคาต่อตารางฟุตที่สูงกว่าไว้ฝั่ง Poundbury การเทียบนั้นเป็นภาพตลาด มันไม่ได้ตรึงอายุบ้าน ขนาดบ้าน ที่จอดรถ หรือว่าใครเป็นคนซื้อ ฉบับที่ตีพิมพ์ก็ไม่ตรงกัน Knight Frank ในบันทึกปี 2020 ให้คณะกรรมาธิการ Building Better, Building Beautiful วางส่วนต่างของ Poundbury เหนือ Dorchester ไว้ราว 6 ถึง 7 เปอร์เซ็นต์ต่อตารางฟุต และบันทึกว่าบ้านยังใหญ่กว่าประมาณ 30 เปอร์เซ็นต์ รายงานของ Prince's Foundation วางส่วนต่างของบ้านใหม่ไว้ใกล้ 27 เปอร์เซ็นต์นับตั้งแต่ปี 1996 เมื่อเทียบกับตลาดบ้านมือสองของ Dorchester เลขกลม 30 เปอร์เซ็นต์บนภาพอยู่ใกล้ตัวเลขที่สูงกว่า และใกล้ส่วนต่างของขนาด ซึ่งเป็นคนละข้อเท็จจริง ทั้งสองงานไม่ใช่การทดลองควบคุม และทั้งสองไม่ใช่งานเกี่ยวกับกรุงเทพฯ",
    en: "A hundred metres held by one owner can be one lobby, one tenant, and one decision to close. The same hundred metres cut into narrow plots is many owners, many leases, and many reasons for someone to be there on a Tuesday afternoon. The diagram sets this beside Poundbury and Dorchester, with a higher price per square foot on the Poundbury side. That comparison is a market snapshot. It does not hold the age of the houses, their size, the parking, or who is buying, and the published versions do not agree. Knight Frank's 2020 note for the Building Better, Building Beautiful Commission put Poundbury's premium over Dorchester at about 6 to 7 percent per square foot, and recorded that the homes were also about 30 percent larger. A Prince's Foundation report put a new-build premium near 27 percent since 1996, against Dorchester's second-hand market. The diagram's round 30 percent sits near the higher of those figures, and near the size difference, which is a different fact. It is not a controlled study, and it is not about Bangkok.",
    bangkokTh: `กรรมสิทธิ์เป็นช่องที่สไปน์นี้ไม่มี สิ่งที่มีคือแปลง หน้ากว้างมัธยฐานของชุดที่คัดทั้งเมืองคือ ${metres(cityFront)} เมตร ที่สามแพร่งกับพระยาศรีในบัญชีรายแถวคือ ${metres(samPhraeng.medianFrontage)} เมตร จากรอยอาคาร ${samPhraeng.n.toLocaleString("en-US")} และ ${phrayaSi.n.toLocaleString("en-US")} หลัง ข้อ 2 วางพื้นทางกฎหมายไว้ที่ 4 เมตร ซึ่งเป็นเหตุให้คูหาจำนวนมากรวมอยู่ตรงนั้น ถนนของคูหาเหล่านี้ ที่กั้นด้วยผนังร่วม คือถนนของคูหาที่แยกจากกัน ว่าแต่ละคูหายังมีเจ้าของของตัวเองหรือไม่ เป็นคำถามของสำนักงานที่ดิน ซึ่งไฟล์นี้ตอบไม่ได้ รูปทรงเป็นเงื่อนไขของเจ้าของหลายคน มันไม่ใช่บัญชีรายชื่อเจ้าของ`,
    bangkokEn: `Tenure is a field this spine does not have. What it has is the plot. The citywide screen’s median front is ${metres(cityFront)} metres. At Sam Phraeng and Phraya Si, in the cluster rollup, it is ${metres(samPhraeng.medianFrontage)} metres, across ${samPhraeng.n.toLocaleString("en-US")} and ${phrayaSi.n.toLocaleString("en-US")} footprints. Clause 2 sets a legal floor of 4 metres, which is why so many bays gather there. A street of those bays, divided by party walls, is a street of separate units. Whether each one still has its own owner is a land-office question, and this file cannot answer it. The morphology is the condition for many owners. It is not the owner list.`,
  },
  {
    id: "corners",
    index: "08",
    slide: 14,
    src: "/shophouses/why/slide-14.png",
    alt: "Diagram of a tight street corner, where a turning car slows, beside a wide corner radius that lets the car keep speed.",
    titleTh: "มุมที่แคบ ทำให้รถเลี้ยวช้า",
    titleEn: "A tight corner makes the car turn slowly",
    th: "Manual for Streets ปี 2007 ขอรัศมุมถนนที่เล็ก เพื่อให้คนข้ามบนเส้นที่กำลังเดินอยู่แล้ว และเพื่อให้รถที่เลี้ยวต้องชะลอ รูป 6.3 เทียบสองแบบ มุมแคบ รถเลี้ยวที่ราว 10 ถึง 15 ไมล์ต่อชั่วโมง มุมที่บานออก รถเลี้ยวที่ราว 20 ถึง 30 ไมล์ต่อชั่วโมง รถใหญ่สามารถใช้ความกว้างของถนนแคบทั้งผืนก็ได้ถ้าต้องเลี้ยว ภาพวาดเขียนเรื่องนี้เป็น 1 ถึง 3 เมตร เทียบกับ 6 ถึง 10 เมตร ตัวบทของคู่มือใช้คำว่าเล็ก และให้ความเร็วไว้ มันไม่ได้กำหนดสองช่วงนั้นเป็นกฎ",
    en: "Manual for Streets (2007) asks for small corner radii so a person can cross on the line they were already walking, and so a turning car has to slow down. Figure 6.3 sets the two side by side. On a tight corner, vehicles turn at about 10 to 15 miles an hour. Where the corner is opened up, turns run at about 20 to 30. A large vehicle may use the full width of a narrow street to get round. The diagram draws this as 1 to 3 metres against 6 to 10 metres. The manual's text says small, and it gives the speeds. It does not lay those two bands down as a rule.",
    bangkokTh: `ในคลังนี้ไม่มีการสำรวจรัศมุมถนน ข้อที่เกี่ยวข้องคือวิธีที่ตึกแถวบรรจบซอย อาคารมาถึงมุมแปลง ดังนั้นทางเลี้ยวจึงแคบ เว้นแต่อาคารใหม่จะถอยร่น ข้อ 41 คือแรงในทิศตรงข้าม รื้อแถวบนถนนแคบ แล้วอาคารทดแทนต้องถอยจากเส้นกึ่งกลางถนน ซึ่งเป็นการเปิดมุมที่คู่มือพยายามปิด ถนน ${SPLITS.assumedRoadM} เมตรในแบบจำลองแรงกดดันมีไว้เพื่อประมาณระยะถอยร่นนั้น มันไม่ใช่รัศมีที่วัดได้`,
    bangkokEn: `This repository has no corner-radius survey. The fact that bears on the drawing is how a shophouse meets a lane. The building comes to the plot corner, so the turn stays tight unless a new building is set back. Clause 41 pushes the other way. Demolish a row on a narrow road and the replacement steps back from the centreline, which opens the corner the manual is trying to keep tight. The ${SPLITS.assumedRoadM} metre road in the pressure model is there to estimate that setback. It is not a measured radius.`,
  },
  {
    id: "junctions",
    index: "09",
    slide: 13,
    src: "/shophouses/why/slide-13.png",
    alt: "Diagram of a district with many street junctions, where trips on foot get shorter, beside a district of long blocks.",
    titleTh: "ทางแยกถี่ คนเดินมากขึ้น",
    titleEn: "More junctions, more walking",
    th: "การวิเคราะห์อภิมานปี 2010 ของ Ewing กับ Cervero รวมงานเรื่องการเดินทางเท่าที่หาได้ การเดินสัมพันธ์แรงที่สุดกับกิจกรรมการใช้ที่ดินที่ปนกัน กับความหนาแน่นของทางแยก และกับจำนวนจุดหมายที่อยู่ในระยะเดิน ค่าความยืดหยุ่นของการเดินต่อความหนาแน่นทางแยกคือ 0.39 สูงสุดในตารางของพวกเขา ถ้าจำนวนทางแยกเพิ่มเป็นสองเท่า โดยตรึงปัจจัยอื่นไว้ มันล้อกับการเดินที่มากขึ้นราว 39 เปอร์เซ็นต์ กองงานนั้นมีเจ็ดการศึกษา สองการศึกษาพยายามหักกรณีที่คนเลือกย่านเดินได้เพราะชอบเดินอยู่แล้ว มันไม่ใช่แบบจำลองของกรุงเทพฯ ความหนาแน่นของคน เมื่อใส่ปัจจัยอื่นแล้ว เป็นตัวแปรที่อ่อน ทางแยกสำคัญเพราะมันย่นระยะทางและเพิ่มวิธีเดิน ไม่ใช่เพราะเขตที่คนหนาแน่นจะเดินเอง",
    en: "Ewing and Cervero's 2010 meta-analysis pooled the travel studies they could find. Walking's strongest ties were to a mix of uses, to intersection density, and to how many destinations sit within walking distance. The elasticity of walking with respect to intersection density is 0.39, the largest in their tables. A doubling of intersections, other things held equal, lines up with about 39 percent more walking. The pool is seven studies. Two of them tried to account for people who chose a walkable neighbourhood because they already liked to walk. It is not a Bangkok model. Once those other things are in the equation, the density of residents was the weak variable. Junctions matter because they shorten trips and multiply the ways to walk.",
    bangkokTh: `สไปน์ไม่ได้นับทางแยก สารบบมีสิ่งที่เมืองเก่าใช้แทนความหนาแน่นที่วัดแล้ว พระยาศรีถูกเขียนไว้เป็นบานพับสี่แยกเก่าแห่งหนึ่ง ที่เจริญกรุง เฟื้องนคร และบ้านหม้อเวียนเข้าหากัน และแถวที่คัดไว้ตรงนั้นมีหน้ากว้างมัธยฐาน ${phrayaSi.medianFrontage} เมตร จาก ${phrayaSi.n.toLocaleString("en-US")} หลัง สามแพร่งคือสามตรอกที่ตัดในที่ดินวังเดิม มี ${samPhraeng.documentedUnits} หน่วยการค้าในจำนวนที่ตีพิมพ์ ตรอกสั้นที่มาบรรจบแถวตึกคือรูปแบบทางแยก การใส่จำนวนทางแยกต่อตารางกิโลเมตรลงไปจะเป็นการเดา หน้านี้จึงไม่ใส่`,
    bangkokEn: `The spine does not count junctions. The gazetteer already describes what the old town uses in place of a measured density. Phraya Si is written as one of the old four-way hinges, where Charoen Krung, Fueang Nakhon and Ban Mo turn around one another, and the screened rows there have a median front of ${phrayaSi.medianFrontage} metres across ${phrayaSi.n.toLocaleString("en-US")} footprints. Sam Phraeng is three lanes cut through former palace land, ${samPhraeng.documentedUnits} commercial units in the published count. Short lanes meeting a row are the junction pattern. A figure for intersections per square kilometre would be a guess, so this page does not offer one.`,
    caveatTh: "ค่าความยืดหยุ่นไม่ใช่คำสัญญา การเพิ่มทางแยกเป็นสองเท่าในที่ที่ไม่มีอะไรให้เดินไปหา จะไม่ผลิตการเดินที่เพิ่มขึ้น 39 เปอร์เซ็นต์ คำเตือนของกระดาษเองคือตัวแปรเหล่านี้ไม่ยืดหยุ่นเมื่อแยกทีละตัว และมันถูกวัดที่อื่น",
    caveatEn: "An elasticity is not a promise. Doubling the junctions in a place with nothing to walk to will not produce a 39 percent increase. The paper's own warning is that the variables are inelastic one by one, and that they were measured somewhere else.",
  },
];

export const SOURCES: WhySource[] = [
  {
    id: "gehl-2006",
    citation:
      "Gehl, Jan, Lotte Johansen Kaefer, and Solvejg Reigstad. 2006. “Close encounters with buildings.” Urban Design International 11: 29–47. The journal prints the second surname as Kaefer; the diagram writes Kæfer.",
    url: "https://doi.org/10.1057/palgrave.udi.9000162",
    usedFor:
      "15–20 units and 20–25 doorways per 100 metres; seven times the stops and other activities in front of active ground floors; head-turns of 75 percent against 21 percent; walking about 13 percent slower. The diagram’s door band, its sevenfold “stopping”, and its 75/25 split are this paper, rounded.",
  },
  {
    id: "gehl-2010",
    citation:
      "Gehl, Jan. 2010. Cities for People. Washington, DC: Island Press.",
    usedFor:
      "The book-length statement of the same street-life argument: ground floors, a height from which people still come down, and the difference between a lively front and a closed one. The counts on this page are taken from the 2006 paper, which the diagrams do not name.",
  },
  {
    id: "ewing-handy",
    citation:
      "Ewing, Reid, and Susan Handy. 2009. “Measuring the Unmeasurable: Urban Design Qualities Related to Walkability.” Journal of Urban Design 14 (1): 65–84.",
    url: "https://doi.org/10.1080/13574800802451155",
    usedFor:
      "Enclosure, human scale, transparency and complexity scored from physical features of the street edge. The paper arms a later test of walking. It does not itself deliver that test. It is why these diagrams are held against measured frontages.",
  },
  {
    id: "ewing-cervero",
    citation:
      "Ewing, Reid, and Robert Cervero. 2010. “Travel and the Built Environment: A Meta-Analysis.” Journal of the American Planning Association 76 (3): 265–294.",
    url: "https://doi.org/10.1080/01944361003766766",
    usedFor:
      "Walking’s elasticity of 0.39 with respect to intersection density, from seven studies, two of them with a self-selection control. The largest elasticity in their tables, and still inelastic. Not a Bangkok model.",
  },
  {
    id: "alexander",
    citation:
      "Alexander, Christopher, Sara Ishikawa, and Murray Silverstein, with Max Jacobson, Ingrid Fiksdahl-King, and Shlomo Angel. 1977. A Pattern Language: Towns, Buildings, Construction. New York: Oxford University Press.",
    usedFor:
      "Pattern 21, the four-storey limit: in any urban area, keep the majority of buildings at four storeys or under.",
  },
  {
    id: "cullen",
    citation:
      "Cullen, Gordon. 1971. The Concise Townscape. London: Architectural Press. First published as Townscape in 1961.",
    usedFor:
      "Enclosure, and the street as a sequence the eye enters. The 1971 date on the diagram is this paperback edition.",
  },
  {
    id: "sitte",
    citation:
      "Sitte, Camillo. 1889. Der Städtebau nach seinen künstlerischen Grundsätzen. Vienna: Carl Graeser. English translation by George R. Collins and Christiane Crasemann Collins, City Planning According to Artistic Principles. New York: Random House, 1965.",
    usedFor:
      "The street as an outdoor room, proportioned so the wall and the width belong together. The numbered 1:1 to 1:3 bands are not a quotation from Sitte; they come through Spreiregen and Manual for Streets.",
  },
  {
    id: "lynch",
    citation:
      "Lynch, Kevin. 1960. The Image of the City. Cambridge, MA: MIT Press.",
    usedFor:
      "The edge as one of the elements people use to hold a city in mind. A continuous shophouse wall is that kind of line.",
  },
  {
    id: "conzen",
    citation:
      "Conzen, M. R. G. 1960. Alnwick, Northumberland: A Study in Town-Plan Analysis. Institute of British Geographers Publication no. 27. London: George Philip.",
    usedFor:
      "The town plan as a tissue of plots, streets and buildings. The shophouse bay is the plot-series a study of that kind would map. Conzen did not map Bangkok.",
  },
  {
    id: "spreiregen",
    citation:
      "Spreiregen, Paul D. 1965. Urban Design: The Architecture of Towns and Cities. New York: McGraw-Hill.",
    usedFor:
      "The section proportions the diagram draws as a width-to-height guide of one to three. Manual for Streets restates the same guide as height-to-width in Table 5.1.",
  },
  {
    id: "mfs",
    citation:
      "Department for Transport. 2007. Manual for Streets. London: Thomas Telford. ISBN 978-0-7277-3501-0.",
    url: "https://www.gov.uk/government/publications/manual-for-streets",
    usedFor:
      "Table 5.1 and sections 5.4.2–5.4.3 on enclosure. Sections 6.3.12–6.3.13 and Figure 6.3 on small corner radii, with turns at about 10–15 mph against 20–30 mph. The diagram’s 1–3 m and 6–10 m bands are not stated as rules in that text.",
  },
  {
    id: "ellard",
    citation:
      "Ellard, Colin. 2015. Places of the Heart: The Psychogeography of Everyday Life. New York: Bellevue Literary Press.",
    usedFor:
      "Walks past blank facades, with skin conductance and self-reported boredom. The diagram’s cortisol and heart-rate claim is a step further than these walks. Ellard points to a separate laboratory study of boredom for the cortisol link.",
  },
  {
    id: "knight-frank",
    citation:
      "Knight Frank. 2020. Cost and Value. A note for the Building Better, Building Beautiful Commission.",
    url: "https://content.knightfrank.com/research/1930/documents/en/building-better-building-beautiful-commission-cost-value-2020-7017.pdf",
    usedFor:
      "A market comparison, not a controlled study: Poundbury’s premium over Dorchester of about 6.4 percent on resales and 7.3 percent on new build, in pounds per square foot, with homes also about 30 percent larger. Cited here because the diagram’s round 30 percent needs a real comparison beside it.",
  },
  {
    id: "princes-foundation",
    citation:
      "The Prince’s Foundation, with Savills and the University College of Estate Management. The Value of Community: Building a Legacy. Poundbury.",
    url: "https://www.ube.ac.uk/wp-content/uploads/2019/10/Value-of-Community-Building-a-Legacy-Full-Report-1.pdf",
    usedFor:
      "Another market comparison: a new-build premium near 27 percent per square foot since 1996, against Dorchester’s second-hand market. It does not agree with the Knight Frank figure. Neither is evidence about a Bangkok shophouse.",
  },
  {
    id: "jacobs",
    citation:
      "Jacobs, Jane. 1961. The Death and Life of Great American Cities. New York: Random House.",
    usedFor:
      "Eyes on the street, the phrase used in “Where I grew up”. Cited for that idea. He is not signing the preservation that freezes a low-rise street.",
  },
  {
    id: "glaeser",
    citation:
      "Glaeser, Edward L. 2011. Triumph of the City: How Our Greatest Invention Makes Us Richer, Smarter, Greener, Healthier, and Happier. New York: Penguin Press.",
    usedFor:
      "The density critique he agrees with: holding prime land as low-rise makes it expensive, and more people living there requires more building. Glaeser is an economist at Harvard. No page is cited. The sentence is his agreement, not a quotation.",
  },
  {
    id: "salerno",
    citation:
      "Ünaldi, Serhat. 2016. Working Towards the Monarchy: The Politics of Space in Downtown Bangkok. Honolulu: University of Hawaiʻi Press, pp. 149–151. ISBN 9780824855758. The Neal Prince archive at the New York School of Interior Design credits the Siam Inter-Continental Hotel: “Architecture by Joseph P. Salerno, AIA (1915–1981)”.",
    url: "https://nealprince.omeka.net/items/show/71",
    usedFor:
      "Joseph P. Salerno as architect of the Siam Intercontinental, later demolished for Siam Paragon. “A disciple of Frank Lloyd Wright” is his wording. The published note, from Ünaldi p. 149, is softer: a student and admirer who probably spent a summer apprenticing at Taliesin. The New York Times obituary of 5 April 1981 records Salerno’s Yale training and his work for Inter-Continental Hotels, and does not mention Wright.",
  },
];
