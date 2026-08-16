export type HeritageMobilityMode =
  | "mrt"
  | "bts"
  | "river-express"
  | "tourist-boat"
  | "cross-river-ferry"
  | "canal-boat";

export type HeritageMobilityService = {
  id: string;
  name: string;
  thai: string;
  shortName: string;
  mode: HeritageMobilityMode;
  color: string;
  operator: string;
  serviceNote: string;
  sourceUrl: string;
  geometry: [number, number][];
  stopIds: string[];
};

export type HeritageMobilityStop = {
  id: string;
  name: string;
  thai: string;
  mode: HeritageMobilityMode;
  coordinates: [number, number];
  serviceIds: string[];
  nearby: string[];
};

const EXPRESS_SOURCE = "https://www.chaophrayaexpressboat.com/";
const TOURIST_BOAT_SOURCE = "https://www.chaophrayatouristboat.com/tourist_boat";
const MRT_SOURCE = "https://www.mrta.co.th/en/chaloem-ratchamongkhon-line/27808";
const SAEN_SAEP_SOURCE = "https://gcc.go.th/2021/01/14/%E0%B9%80%E0%B8%A3%E0%B8%B7%E0%B8%AD%E0%B9%82%E0%B8%94%E0%B8%A2%E0%B8%AA%E0%B8%B2%E0%B8%A3%E0%B8%84%E0%B8%A5%E0%B8%AD%E0%B8%87%E0%B9%81%E0%B8%AA%E0%B8%99%E0%B9%81%E0%B8%AA%E0%B8%9A/";
const BTS_SOURCE = "https://www.bts.co.th/eng/routemap.html";

export const HERITAGE_MOBILITY_SERVICES: HeritageMobilityService[] = [
  {
    id: "mrt-blue-old-town",
    name: "MRT Blue Line · Old Town arc",
    thai: "รถไฟฟ้ามหานคร สายสีน้ำเงิน · ช่วงเมืองเก่า",
    shortName: "MRT Blue",
    mode: "mrt",
    color: "#2f9de2",
    operator: "Mass Rapid Transit Authority of Thailand / BEM",
    serviceNote: "Daily 06:00–24:00. This map shows the five-station heritage arc; trains continue around the full Blue Line.",
    sourceUrl: MRT_SOURCE,
    geometry: [
      [100.51716, 13.73798],
      [100.51034, 13.74202],
      [100.49876, 13.74726],
      [100.49414, 13.74402],
      [100.48588, 13.73847],
    ],
    stopIds: ["mrt-hua-lamphong", "mrt-wat-mangkon", "mrt-sam-yot", "mrt-sanam-chai", "mrt-itsaraphap"],
  },
  {
    id: "chao-phraya-express-old-town",
    name: "Chao Phraya Express · heritage reach",
    thai: "เรือด่วนเจ้าพระยา · ช่วงย่านมรดก",
    shortName: "Express Boat",
    mode: "river-express",
    color: "#f29b38",
    operator: "Chao Phraya Express Boat Co., Ltd.",
    serviceNote: "Weekday flag services connect Bangkok's river districts. Stops differ by flag, so check the operator timetable before travelling.",
    sourceUrl: EXPRESS_SOURCE,
    geometry: [
      [100.51257, 13.71837], [100.51029, 13.72616], [100.50468, 13.73851],
      [100.49620, 13.74120], [100.48921, 13.74497], [100.49040, 13.74579],
      [100.48855, 13.75228], [100.48869, 13.75489], [100.49439, 13.76283],
      [100.50481, 13.76857],
    ],
    stopIds: ["pier-sathorn", "pier-ratchawong", "pier-pak-khlong", "pier-wat-arun", "pier-tha-tien", "pier-tha-chang", "pier-phra-arthit", "pier-thewet"],
  },
  {
    id: "chao-phraya-tourist",
    name: "Chao Phraya Tourist Boat",
    thai: "เรือท่องเที่ยวเจ้าพระยา",
    shortName: "Tourist Boat",
    mode: "tourist-boat",
    color: "#54c7ec",
    operator: "Chao Phraya Tourist Boat",
    serviceNote: "A visitor-oriented river service linking 11 piers, normally every 30 minutes. The evening extension reaches Asiatique.",
    sourceUrl: TOURIST_BOAT_SOURCE,
    geometry: [
      [100.50272, 13.70418], [100.51257, 13.71837], [100.51029, 13.72616],
      [100.50468, 13.73851], [100.49620, 13.74120], [100.48921, 13.74497],
      [100.49040, 13.74579], [100.48855, 13.75228], [100.48869, 13.75489],
      [100.48556, 13.75687], [100.49439, 13.76283],
    ],
    stopIds: ["pier-asiatique", "pier-sathorn", "pier-iconsiam", "pier-ratchawong", "pier-pak-khlong", "pier-wat-arun", "pier-tha-tien", "pier-tha-chang", "pier-tha-maharaj", "pier-prannok", "pier-phra-arthit"],
  },
  {
    id: "saen-saep-west",
    name: "Khlong Saen Saep Boat · western reach",
    thai: "เรือคลองแสนแสบ · ช่วงตะวันตก",
    shortName: "Saen Saep",
    mode: "canal-boat",
    color: "#31b7a3",
    operator: "Family Transport (2002) Co., Ltd.",
    serviceNote: "The western route terminates beside Golden Mount at Phan Fa Lilat and continues east through Pratunam by interchange.",
    sourceUrl: SAEN_SAEP_SOURCE,
    geometry: [
      [100.50474, 13.75555], [100.51484, 13.75418], [100.52377, 13.75212],
      [100.53279, 13.75016], [100.53918, 13.74872],
    ],
    stopIds: ["pier-phan-fa", "pier-bo-bae", "pier-hua-chang", "pier-pratunam"],
  },
  {
    id: "ferry-tha-tien-wat-arun",
    name: "Tha Tien ↔ Wat Arun ferry",
    thai: "เรือข้ามฟากท่าเตียน ↔ วัดอรุณ",
    shortName: "Cross-river ferry",
    mode: "cross-river-ferry",
    color: "#d8e7df",
    operator: "Local cross-river ferry",
    serviceNote: "A short cross-river connection between the Rattanakosin monuments and Wat Arun. Check pier notices for current hours and fare.",
    sourceUrl: TOURIST_BOAT_SOURCE,
    geometry: [[100.49040, 13.74579], [100.48921, 13.74497]],
    stopIds: ["pier-tha-tien", "pier-wat-arun"],
  },
  {
    id: "bts-silom-river-gateway",
    name: "BTS Silom Line · river gateway",
    thai: "รถไฟฟ้าบีทีเอส สายสีลม · ประตูสู่แม่น้ำ",
    shortName: "BTS Silom",
    mode: "bts",
    color: "#69b34c",
    operator: "Bangkok Mass Transit System PCL",
    serviceNote: "Saphan Taksin station connects directly to Sathorn Pier and the Chao Phraya boat network.",
    sourceUrl: BTS_SOURCE,
    geometry: [[100.52152, 13.71935], [100.51403, 13.71879]],
    stopIds: ["bts-surasak", "bts-saphan-taksin"],
  },
];

export const HERITAGE_MOBILITY_STOPS: HeritageMobilityStop[] = [
  { id: "mrt-hua-lamphong", name: "Hua Lamphong", thai: "หัวลำโพง", mode: "mrt", coordinates: [100.51716, 13.73798], serviceIds: ["mrt-blue-old-town"], nearby: ["Railway Station", "Talad Noi"] },
  { id: "mrt-wat-mangkon", name: "Wat Mangkon", thai: "วัดมังกร", mode: "mrt", coordinates: [100.51034, 13.74202], serviceIds: ["mrt-blue-old-town"], nearby: ["Yaowarat", "Plaeng Nam"] },
  { id: "mrt-sam-yot", name: "Sam Yot", thai: "สามยอด", mode: "mrt", coordinates: [100.49876, 13.74726], serviceIds: ["mrt-blue-old-town"], nearby: ["Wang Burapha", "Sao Chingcha"] },
  { id: "mrt-sanam-chai", name: "Sanam Chai", thai: "สนามไชย", mode: "mrt", coordinates: [100.49414, 13.74402], serviceIds: ["mrt-blue-old-town"], nearby: ["Museum Siam", "Wat Pho", "Pak Khlong Talat"] },
  { id: "mrt-itsaraphap", name: "Itsaraphap", thai: "อิสรภาพ", mode: "mrt", coordinates: [100.48588, 13.73847], serviceIds: ["mrt-blue-old-town"], nearby: ["Kudi Chin", "Wat Arun hinterland"] },
  { id: "pier-asiatique", name: "Asiatique", thai: "เอเชียทีค", mode: "tourist-boat", coordinates: [100.50272, 13.70418], serviceIds: ["chao-phraya-tourist"], nearby: ["Charoen Krung riverfront"] },
  { id: "pier-sathorn", name: "Sathorn Pier", thai: "ท่าสาทร", mode: "river-express", coordinates: [100.51257, 13.71837], serviceIds: ["chao-phraya-express-old-town", "chao-phraya-tourist", "bts-silom-river-gateway"], nearby: ["BTS Saphan Taksin", "Bang Rak"] },
  { id: "pier-iconsiam", name: "ICONSIAM Pier", thai: "ท่าไอคอนสยาม", mode: "tourist-boat", coordinates: [100.51029, 13.72616], serviceIds: ["chao-phraya-tourist"], nearby: ["Khlong San"] },
  { id: "pier-ratchawong", name: "Ratchawongse Pier", thai: "ท่าราชวงศ์", mode: "river-express", coordinates: [100.50468, 13.73851], serviceIds: ["chao-phraya-express-old-town", "chao-phraya-tourist"], nearby: ["Song Wat", "Yaowarat"] },
  { id: "pier-pak-khlong", name: "Yodpiman / Pak Khlong Talat", thai: "ยอดพิมาน / ปากคลองตลาด", mode: "tourist-boat", coordinates: [100.49620, 13.74120], serviceIds: ["chao-phraya-tourist"], nearby: ["Flower Market", "Memorial Bridge"] },
  { id: "pier-wat-arun", name: "Wat Arun Pier", thai: "ท่าวัดอรุณ", mode: "tourist-boat", coordinates: [100.48921, 13.74497], serviceIds: ["chao-phraya-tourist", "chao-phraya-express-old-town", "ferry-tha-tien-wat-arun"], nearby: ["Wat Arun", "Wang Derm"] },
  { id: "pier-tha-tien", name: "Tha Tien", thai: "ท่าเตียน", mode: "river-express", coordinates: [100.49040, 13.74579], serviceIds: ["chao-phraya-tourist", "chao-phraya-express-old-town", "ferry-tha-tien-wat-arun"], nearby: ["Wat Pho", "Tha Tien shophouses"] },
  { id: "pier-tha-chang", name: "Tha Chang", thai: "ท่าช้าง", mode: "river-express", coordinates: [100.48855, 13.75228], serviceIds: ["chao-phraya-tourist", "chao-phraya-express-old-town"], nearby: ["Grand Palace", "Silpakorn University"] },
  { id: "pier-tha-maharaj", name: "Tha Maharaj", thai: "ท่ามหาราช", mode: "tourist-boat", coordinates: [100.48869, 13.75489], serviceIds: ["chao-phraya-tourist"], nearby: ["National Museum", "Thammasat University"] },
  { id: "pier-prannok", name: "Prannok / Wang Lang", thai: "พรานนก / วังหลัง", mode: "tourist-boat", coordinates: [100.48556, 13.75687], serviceIds: ["chao-phraya-tourist"], nearby: ["Wang Lang", "Siriraj Museum"] },
  { id: "pier-phra-arthit", name: "Phra Arthit", thai: "พระอาทิตย์", mode: "river-express", coordinates: [100.49439, 13.76283], serviceIds: ["chao-phraya-tourist", "chao-phraya-express-old-town"], nearby: ["Bang Lamphu", "Phra Sumen Fort"] },
  { id: "pier-thewet", name: "Thewet", thai: "เทเวศร์", mode: "river-express", coordinates: [100.50481, 13.76857], serviceIds: ["chao-phraya-express-old-town"], nearby: ["Thewet Market", "Dusit"] },
  { id: "pier-phan-fa", name: "Phan Fa Lilat", thai: "ผ่านฟ้าลีลาศ", mode: "canal-boat", coordinates: [100.50474, 13.75555], serviceIds: ["saen-saep-west"], nearby: ["Golden Mount", "Mahakan Fort"] },
  { id: "pier-bo-bae", name: "Bo Bae", thai: "โบ๊เบ๊", mode: "canal-boat", coordinates: [100.51484, 13.75418], serviceIds: ["saen-saep-west"], nearby: ["Bo Bae Market", "Nang Loeng"] },
  { id: "pier-hua-chang", name: "Hua Chang", thai: "หัวช้าง", mode: "canal-boat", coordinates: [100.53279, 13.75016], serviceIds: ["saen-saep-west"], nearby: ["Jim Thompson House", "Ratchathewi"] },
  { id: "pier-pratunam", name: "Pratunam", thai: "ประตูน้ำ", mode: "canal-boat", coordinates: [100.53918, 13.74872], serviceIds: ["saen-saep-west"], nearby: ["Pratunam", "Ratchaprasong"] },
  { id: "bts-surasak", name: "Surasak", thai: "สุรศักดิ์", mode: "bts", coordinates: [100.52152, 13.71935], serviceIds: ["bts-silom-river-gateway"], nearby: ["Bang Rak"] },
  { id: "bts-saphan-taksin", name: "Saphan Taksin", thai: "สะพานตากสิน", mode: "bts", coordinates: [100.51403, 13.71879], serviceIds: ["bts-silom-river-gateway"], nearby: ["Sathorn Pier", "Charoen Krung"] },
];

export const HERITAGE_MOBILITY_ROUTE_GEOJSON = {
  type: "FeatureCollection" as const,
  features: HERITAGE_MOBILITY_SERVICES.map((service) => ({
    type: "Feature" as const,
    properties: {
      id: service.id,
      name: service.name,
      thai: service.thai,
      mode: service.mode,
      color: service.color,
      family: service.mode === "mrt" || service.mode === "bts" ? "rail" : service.mode === "cross-river-ferry" ? "ferry" : "boat",
    },
    geometry: { type: "LineString" as const, coordinates: service.geometry },
  })),
};

export const HERITAGE_MOBILITY_STOP_GEOJSON = {
  type: "FeatureCollection" as const,
  features: HERITAGE_MOBILITY_STOPS.map((stop) => ({
    type: "Feature" as const,
    properties: { id: stop.id, name: stop.name, thai: stop.thai, mode: stop.mode },
    geometry: { type: "Point" as const, coordinates: stop.coordinates },
  })),
};

function distanceKm(a: [number, number], b: [number, number]) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(b[1] - a[1]);
  const dLng = radians(b[0] - a[0]);
  const lat1 = radians(a[1]);
  const lat2 = radians(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function nearestHeritageMobilityStops(center: [number, number], limit = 2) {
  return HERITAGE_MOBILITY_STOPS
    .map((stop) => ({ ...stop, distanceKm: distanceKm(center, stop.coordinates) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

export const HERITAGE_MOBILITY_NOTE =
  "Routes are schematic orientation lines, not live vehicle positions. Service patterns and pier calls can change; check the linked operator before travel.";
