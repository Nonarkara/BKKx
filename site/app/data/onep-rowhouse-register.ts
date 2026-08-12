// Canonical crosswalk to ONEP's Rattanakosin building survey. Category E is
// described by the report as rowhouse/commercial fabric, but the 46 records
// include four standalone commercial buildings and one related structure.
// Keeping those types explicit prevents a convenient but false "46 rows" claim.

export type OnepSurveyZone = "inner" | "intermediate" | "outer";
export type OnepRecordType = "rowhouse ensemble" | "commercial building" | "related structure";

export type OnepRowhouseRecord = {
  id: string;
  thai: string;
  english: string;
  zone: OnepSurveyZone;
  recordType: OnepRecordType;
  scores: [number, number, number, number, number];
  total: number;
  priority: 3 | 4 | 5;
  mappedSlugs: string[];
};

export const ONEP_ROWHOUSE_SURVEY = {
  title: "Rattanakosin conservation survey: buildings worthy of conservation and restoration",
  publisher: "Office of Natural Resources and Environmental Policy and Planning (ONEP)",
  url: "https://nced.onep.go.th/knowledge/E_BOOK_Publish_SURVEY.pdf",
  recordCount: 46,
  scoreLabels: ["aesthetic", "history / archaeology", "science / education", "society / culture", "condition / scale"],
} as const;

const rowhouse = "rowhouse ensemble" as const;

export const ONEP_ROWHOUSE_RECORDS: OnepRowhouseRecord[] = [
  { id: "1E1-057", thai: "ตึกแถวสองฟากถนนแพร่งภูธร", english: "Phraeng Phuthon rows", zone: "inner", recordType: rowhouse, scores: [3, 2, 3, 3, 3], total: 14, priority: 3, mappedSlugs: ["sam-phraeng"] },
  { id: "1E1-058", thai: "ตึกแถวบริเวณลานเสาชิงช้าโค้งถนนบำรุงเมือง", english: "Giant Swing and curved Bamrung Mueang rows", zone: "inner", recordType: rowhouse, scores: [3, 2, 3, 3, 3], total: 14, priority: 3, mappedSlugs: ["bamrung-mueang"] },
  { id: "1E1-059", thai: "ตึกแถวริมถนนตะนาว (ช่วงที่ 1)", english: "Tanao Road rows, section 1", zone: "inner", recordType: rowhouse, scores: [3, 2, 3, 3, 3], total: 14, priority: 3, mappedSlugs: ["tanao-road-rows"] },
  { id: "1E1-060", thai: "ตึกแถวริมถนนมหาราช บริเวณท่าช้างวังหลวง", english: "Maha Rat Road rows at Tha Chang Wang Luang", zone: "inner", recordType: rowhouse, scores: [3, 2, 3, 3, 3], total: 14, priority: 3, mappedSlugs: ["tha-chang"] },
  { id: "1E1-061", thai: "ตึกแถวบริเวณท่าเตียน", english: "Tha Tien rows", zone: "inner", recordType: rowhouse, scores: [3, 2, 3, 3, 3], total: 14, priority: 3, mappedSlugs: ["tha-tien"] },
  { id: "1E1-062", thai: "ตึกแถวสองฟากถนนแพร่งนรา ตึกแถวบางส่วนของถนนอัษฎางค์ ตึกแถวบางส่วนของถนนตะนาว และอาคารโรงเรียนตะละภัฏศึกษา", english: "Phraeng Nara, Asdang and Tanao rows with Talaphat Suksa School", zone: "inner", recordType: rowhouse, scores: [3, 2, 3, 3, 3], total: 14, priority: 3, mappedSlugs: ["sam-phraeng"] },
  { id: "1E1-063", thai: "ตึกแถวริมถนนหน้าพระลาน", english: "Na Phra Lan rows", zone: "inner", recordType: rowhouse, scores: [3, 2, 2, 3, 3], total: 13, priority: 3, mappedSlugs: ["na-phra-lan"] },
  { id: "1E5-064", thai: "ตึก S.E.C.", english: "S.E.C. Building", zone: "inner", recordType: "commercial building", scores: [3, 2, 2, 2, 3], total: 12, priority: 4, mappedSlugs: [] },
  { id: "1E1-065", thai: "ตึกแถวบางส่วนริมถนนอัษฎางค์ ตึกแถวบางส่วนริมถนนพระพิทักษ์ และตึกแถวบางส่วนริมถนนบ้านหม้อ", english: "Asdang, Phra Phitak and Ban Mo rows", zone: "inner", recordType: rowhouse, scores: [3, 2, 3, 3, 3], total: 14, priority: 3, mappedSlugs: ["ban-mo-old-moat"] },
  { id: "1E5-066", thai: "ตึก S.A.B.", english: "S.A.B. Building", zone: "inner", recordType: "commercial building", scores: [3, 2, 2, 2, 3], total: 12, priority: 4, mappedSlugs: [] },
  { id: "1E6-067", thai: "ห้างทองตั้งโต๊ะกัง", english: "Tang Toh Kang gold shop", zone: "inner", recordType: "commercial building", scores: [2, 2, 3, 3, 2], total: 12, priority: 4, mappedSlugs: [] },
  { id: "1E6-068", thai: "ธนาคารกรุงเทพ สาขาสำเพ็ง", english: "Bangkok Bank, Sampheng branch", zone: "inner", recordType: "commercial building", scores: [2, 2, 2, 2, 2], total: 10, priority: 4, mappedSlugs: [] },

  { id: "2E1-066", thai: "ตึกแถวข้างวัดบวรนิเวศวิหาร", english: "Bowonniwet Temple rows", zone: "intermediate", recordType: rowhouse, scores: [3, 2, 3, 2, 3], total: 13, priority: 3, mappedSlugs: ["bowonniwet-temple-rows"] },
  { id: "2E1-067", thai: "ตึกแถวริมถนนตะนาวช่วงที่ 2 และช่วงที่ 3", english: "Tanao Road rows, sections 2 and 3", zone: "intermediate", recordType: rowhouse, scores: [3, 2, 3, 2, 3], total: 13, priority: 3, mappedSlugs: ["tanao-road-rows"] },
  { id: "2E1-068", thai: "ตึกแถวถนนบำรุงเมือง (จากแยกสะพานช้างโรงสีถึงแยกมหาไชย)", english: "Bamrung Mueang rows, Saphan Chang Rong Si to Maha Chai", zone: "intermediate", recordType: rowhouse, scores: [3, 2, 3, 2, 3], total: 13, priority: 3, mappedSlugs: ["bamrung-mueang"] },
  { id: "2E1-069", thai: "ตึกแถวชั้นเดียวริมถนนดินสอ–ถนนพระสุเมรุ", english: "Single-storey Dinso–Phra Sumen rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 3, 2, 3], total: 12, priority: 4, mappedSlugs: ["bowonniwet-temple-rows"] },
  { id: "2E5-070", thai: "ตึกแถวในซอยบรมบรรพต", english: "Borom Banphot alley rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 3, 2, 3], total: 12, priority: 4, mappedSlugs: [] },
  { id: "2E1-071", thai: "ตึกแถวริมถนนเฟื่องนคร", english: "Fueang Nakhon Road rows", zone: "intermediate", recordType: rowhouse, scores: [3, 2, 3, 2, 2], total: 12, priority: 4, mappedSlugs: [] },
  { id: "2E1-072", thai: "ตึกแถวริมถนนพระอาทิตย์–ถนนพระสุเมรุ", english: "Phra Athit–Phra Sumen rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 2, 3], total: 11, priority: 4, mappedSlugs: ["phra-athit-khao-hong"] },
  { id: "2E1-073", thai: "ตึกแถวริมถนนตานีและอาคารวรพรต", english: "Tani Road rows and Woraphot Building", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 2, 3], total: 11, priority: 4, mappedSlugs: ["tani-road-rows"] },
  { id: "2E1-074", thai: "ตึกแถวชั้นเดียวในซอยสุขา 1 และสุขา 2 ถนนเฟื่องนคร", english: "Single-storey rows at Sukha 1/2, Fueang Nakhon", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 3, 2, 2], total: 11, priority: 4, mappedSlugs: [] },
  { id: "2E1-075", thai: "ตึกแถวบริเวณด้านหลังวัดสุทัศนเทพวราราม–คลองหลอดวัดราชบพิธ", english: "Srasong–Longtha rows behind Wat Suthat", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 3, 2, 2], total: 11, priority: 4, mappedSlugs: ["srasong-longtha"] },
  { id: "2E1-076", thai: "ตึกแถวริมถนนพระยาศรี", english: "Phraya Si Road rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 3, 2, 2], total: 11, priority: 4, mappedSlugs: ["phraya-si-rows"] },
  { id: "2E1-077", thai: "ตึกแถวเชิงสะพานพระพุทธยอดฟ้า ริมถนนจักรเพชร", english: "Chak Phet rows at Memorial Bridge", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 2, 2], total: 10, priority: 4, mappedSlugs: ["memorial-bridge-rows"] },
  { id: "2E1-078", thai: "ตึกแถวเชิงสะพานพระพุทธยอดฟ้า ฝั่งพระนคร", english: "Phra Nakhon bridgehead rows at Memorial Bridge", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 2, 2], total: 10, priority: 4, mappedSlugs: ["memorial-bridge-rows"] },
  { id: "2E1-079", thai: "ตึกแถวในซอยบ้านพานถม ถนนพระสุเมรุ", english: "Ban Phan Thom alley and Phra Sumen rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 2, 2], total: 10, priority: 4, mappedSlugs: ["ban-phan-thom-rows"] },
  { id: "2E5-080", thai: "ตึกแถวริมถนนเจริญกรุง", english: "Charoen Krung Road rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 2, 2], total: 10, priority: 4, mappedSlugs: ["bang-rak-charoen-krung"] },
  { id: "2E6-081", thai: "ตึกแถวริมถนนเยาวราช", english: "Yaowarat Road rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 3, 3], total: 12, priority: 4, mappedSlugs: ["plaeng-nam"] },
  { id: "2E6-082", thai: "ตึกแถวถนนวานิช 1 (สำเพ็งหรือสามเพ็ง)", english: "Wanit 1 / Sampheng rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 3, 3], total: 12, priority: 4, mappedSlugs: ["wanit-sampheng"] },
  { id: "2E6-083", thai: "ตึกแถวริมถนนทรงวาด", english: "Song Wat Road rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 3, 2], total: 11, priority: 4, mappedSlugs: ["song-wat"] },
  { id: "2E6-084", thai: "ตึกแถวบริเวณจักรวรรดิ", english: "Chakkrawat Road rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 2, 2], total: 10, priority: 4, mappedSlugs: [] },
  { id: "2E5-085", thai: "ตึกแถวริมถนนวรจักร", english: "Worachak Road rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 2, 2], total: 10, priority: 4, mappedSlugs: [] },
  { id: "2E6-086", thai: "ตึกแถวถนนอนุวงศ์", english: "Anuwong Road rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 2, 2], total: 10, priority: 4, mappedSlugs: [] },
  { id: "2E6-087", thai: "ตึกแถวบริเวณท่าน้ำราชวงศ์", english: "Ratchawong Pier rows", zone: "intermediate", recordType: rowhouse, scores: [2, 2, 2, 2, 2], total: 10, priority: 4, mappedSlugs: [] },

  { id: "3E1-036", thai: "ตึกแถวถนนบ้านหม้อ", english: "Ban Mo Road rows", zone: "outer", recordType: rowhouse, scores: [3, 1, 2, 2, 3], total: 11, priority: 4, mappedSlugs: ["ban-mo-old-moat"] },
  { id: "3E5-037", thai: "ตึกแถวถนนนครสวรรค์", english: "Nakhon Sawan Road rows", zone: "outer", recordType: rowhouse, scores: [2, 1, 2, 2, 3], total: 10, priority: 4, mappedSlugs: [] },
  { id: "3E1-038", thai: "ตึกแถว สี่กั๊กพระยาศรี", english: "Si Kak Phraya Si rows", zone: "outer", recordType: rowhouse, scores: [2, 1, 2, 2, 3], total: 10, priority: 4, mappedSlugs: ["phraya-si-rows"] },
  { id: "3E5-039", thai: "ตึกแถวถนนบริพัตร", english: "Boriphat Road rows", zone: "outer", recordType: rowhouse, scores: [2, 1, 2, 2, 3], total: 10, priority: 4, mappedSlugs: [] },
  { id: "3E5-040", thai: "ตึกแถวหลังวัดสระเกศ", english: "Rows behind Wat Saket", zone: "outer", recordType: rowhouse, scores: [1, 1, 1, 2, 3], total: 8, priority: 5, mappedSlugs: [] },
  { id: "3E1-041", thai: "ตึกแถวถนนสามเสน", english: "Samsen Road rows", zone: "outer", recordType: rowhouse, scores: [1, 1, 1, 1, 3], total: 7, priority: 5, mappedSlugs: [] },
  { id: "3E2-042", thai: "ศาลาท่าน้ำ วัดซางตาครู้ส", english: "Santa Cruz church pier pavilion", zone: "outer", recordType: "related structure", scores: [2, 1, 1, 2, 1], total: 7, priority: 5, mappedSlugs: [] },
  { id: "3E6-043", thai: "ตึกแถวเวิ้งนาครเขษม", english: "Woeng Nakhon Kasem rows", zone: "outer", recordType: rowhouse, scores: [2, 1, 2, 2, 3], total: 10, priority: 4, mappedSlugs: [] },
  { id: "3E5-044", thai: "ตึกแถวสวนมะลิ", english: "Suan Mali rows", zone: "outer", recordType: rowhouse, scores: [1, 1, 1, 2, 3], total: 8, priority: 5, mappedSlugs: [] },
  { id: "3E5-045", thai: "ตึกแถวถนนไมตรีจิตต์", english: "Maitri Chit Road rows", zone: "outer", recordType: rowhouse, scores: [1, 1, 1, 1, 2], total: 6, priority: 5, mappedSlugs: [] },
  { id: "3E4-046", thai: "ตึกแถวปรกอรุณ", english: "Prok Arun rows", zone: "outer", recordType: rowhouse, scores: [1, 1, 1, 1, 1], total: 5, priority: 5, mappedSlugs: [] },
  { id: "3E6-047", thai: "เวิ้งเลื่อนฤทธิ์", english: "Luenrit rows", zone: "outer", recordType: rowhouse, scores: [2, 1, 2, 3, 3], total: 11, priority: 4, mappedSlugs: ["luenrit"] },
];

export const ONEP_MAPPED_RECORDS = ONEP_ROWHOUSE_RECORDS.filter((record) => record.mappedSlugs.length > 0);
export const ONEP_MAPPING_QUEUE = ONEP_ROWHOUSE_RECORDS.filter((record) => record.mappedSlugs.length === 0);

export function onepRecordsForSlug(slug: string): OnepRowhouseRecord[] {
  return ONEP_ROWHOUSE_RECORDS.filter((record) => record.mappedSlugs.includes(slug));
}
