// Shophouse typology — one object per type.
//
// To add a type, append one entry to SHOPHOUSE_TYPES. If the facade is
// confirmed, point `elevation` at a drawing in
// app/shophouses/typology/elevations.tsx (or add one id there).
// Leave lat/lng unset until a point is confirmed. If a source drawing's
// street label cannot be read clearly, use TO_CONFIRM and list the open
// part in `toConfirm`. Credit the drawing. Do not copy the image.
//
// Seeded from Urban Creature's 5 October 2026 profile of architect
// Pheangporn Khanti (@shophouse.supply). The cover shows three facade
// families. Her images are not licensed for reuse; the elevations on
// /shophouses/typology are drawn for this library. Street labels on the
// published sheets were not clear enough to transcribe, so those streets
// stay open. Lat Phrao Road is the type Non grew up in; no sheet is
// clearly labelled ถนนลาดพร้าว, so its facade is not guessed.

export const TO_CONFIRM = {
  en: "To confirm",
  th: "ยังไม่ยืนยัน",
  zh: "待确认",
} as const;

export const ELEVATION_IDS = [
  "fin-and-flowerbox",
  "arch-and-column",
  "paired-window-brick",
  "to-confirm",
] as const;

export type ElevationId = (typeof ELEVATION_IDS)[number];

export type Lang = "en" | "th" | "zh";

export type Trilingual = { en: string; th: string; zh: string };

export type ConfirmPart = "era" | "street" | "district" | "facade" | "point";

export type TypologyCredit = {
  title: string;
  url: string;
  /** What this library owes the source, in our own words. */
  credit: string;
};

export type ShophouseTypeEntry = {
  id: string;
  name: Trilingual;
  era: Trilingual;
  street: Trilingual;
  district: Trilingual;
  /** Set both, or neither. A pin is drawn only when both are numbers. */
  lat?: number;
  lng?: number;
  facade: Trilingual[];
  description: Trilingual;
  /** Set on the type Non grew up in. Shown in the active language. */
  featured?: Trilingual;
  drawingRef: Trilingual;
  elevation: ElevationId;
  sources: TypologyCredit[];
  /** Parts this entry refuses to guess. */
  toConfirm: ConfirmPart[];
};

export const TYPOLOGY_CREDITS: TypologyCredit[] = [
  {
    title: "Shophouse Supply — แอ็กเคานต์ที่วาดภาพตึกแถวในเมือง",
    url: "https://urbancreature.co/shophouse-supply/",
    credit:
      "Urban Creature, 5 October 2026. A profile of architect Pheangporn Khanti (แป้ง-เพียงพร ขันตี, @shophouse.supply), who draws Bangkok shophouses as they disappear. The cover shows three facade families. Her images are not copied.",
  },
  {
    title: "Urban Creature on Instagram",
    url: "https://www.instagram.com/p/DeG4utWGjvO/",
    credit:
      "The same profile, posted by urbancreatureth. It names her account and links the article. It does not add street labels beyond the drawings.",
  },
  {
    title: "@shophouse.supply",
    url: "https://www.instagram.com/shophouse.supply/",
    credit:
      "Pheangporn Khanti’s own account. The drawings this typology describes are hers. This library credits and links them.",
  },
  {
    title: "Palette",
    url: "https://github.com/Nonarkara/palette",
    credit:
      "The elevations on this page are drawn for this library in Palette colours: flat fields, no gradients. Palette is the drawing style, not a source for the buildings.",
  },
];

const COVER = "Urban Creature, 5 October 2026";

export const SHOPHOUSE_TYPES: ShophouseTypeEntry[] = [
  {
    id: "lat-phrao",
    name: {
      en: "Lat Phrao Road row",
      th: "ตึกแถวถนนลาดพร้าว",
      zh: "拉抛路店屋",
    },
    era: TO_CONFIRM,
    street: {
      en: "Lat Phrao Road",
      th: "ถนนลาดพร้าว",
      zh: "拉抛路",
    },
    district: TO_CONFIRM,
    facade: [TO_CONFIRM],
    description: {
      en: "The type Non grew up in, along Lat Phrao Road. No drawing in the 5 October 2026 Urban Creature article is clearly labelled Lat Phrao, so the facade, the era, the district and any map point stay open. The road name is his, not a label read off her sheet.",
      th: "ประเภทที่นนโตมา อยู่ตามถนนลาดพร้าว ไม่มีภาพวาดในบทความ Urban Creature วันที่ 5 ตุลาคม 2026 ที่ป้ายชัดว่าลาดพร้าว จึงยังไม่ระบุหน้าอาคาร ยุค เขต หรือจุดบนแผนที่ ชื่อถนนมาจากนน ไม่ได้ถอดจากป้ายบนภาพ",
      zh: "这是 Non 在拉抛路长大时住的那种店屋。2026年10月5日 Urban Creature 的文章里，没有一张图清楚标着拉抛路，所以立面、年代、区和地图上的点都先空着。路名是他本人说的，不是从图纸上认出来的。",
    },
    featured: {
      en: "The type Non grew up in",
      th: "ประเภทที่นนโตมา",
      zh: "Non 长大时住的那种",
    },
    drawingRef: {
      en: "No sheet in the 5 October 2026 Urban Creature article is clearly labelled Lat Phrao Road, so this elevation is withheld. Her images are not reproduced.",
      th: "ไม่มีภาพในบทความ Urban Creature วันที่ 5 ตุลาคม 2026 ที่ป้ายชัดว่าถนนลาดพร้าว จึงยังไม่วาดรูปด้าน และไม่คัดลอกภาพของเธอ",
      zh: "2026年10月5日 Urban Creature 的文章里，没有一张图清楚标着拉抛路，所以立面先不画，也不复制她的图。",
    },
    elevation: "to-confirm",
    sources: TYPOLOGY_CREDITS,
    toConfirm: ["era", "district", "facade", "point"],
  },
  {
    id: "fin-and-flowerbox",
    name: {
      en: "Fin-and-flower-box row",
      th: "ตึกครีบและกระถาง",
      zh: "竖肋花箱店屋",
    },
    era: {
      en: "Four to five storeys, modernist commercial. Decade to confirm.",
      th: "สี่ถึงห้าชั้น ตึกพาณิชย์สมัยใหม่ ทศวรรษยังไม่ยืนยัน",
      zh: "四至五层，现代主义商业排屋。具体年代待确认。",
    },
    street: TO_CONFIRM,
    district: TO_CONFIRM,
    facade: [
      { en: "Vertical fins", th: "ครีบตั้ง", zh: "竖向肋片" },
      { en: "Flower-box balconies", th: "ระเบียงกระถางดอกไม้", zh: "花箱阳台" },
      { en: "Folding steel door", th: "ประตูเหล็กพับ", zh: "折叠钢门" },
    ],
    description: {
      en: "A tall commercial row: thin vertical fins run up the front, flower boxes sit on the balconies, and the shop closes with a folding steel door. One of the three types on the cover of Urban Creature’s 5 October 2026 profile of Pheangporn Khanti. The street written on her drawing is not transcribed until it can be read clearly.",
      th: "ตึกพาณิชย์สูง ครีบบางเรียงขึ้นตามหน้าอาคาร ระเบียงมีกระถางดอกไม้ และร้านปิดด้วยประตูเหล็กพับ เป็นหนึ่งในสามแบบบนหน้าปกบทความ Urban Creature วันที่ 5 ตุลาคม 2026 ที่เล่าถึงเพียงพร ขันตี ชื่อถนนบนภาพของเธอยังไม่ถอดมา จนกว่าจะอ่านได้ชัด",
      zh: "一座高的商业排屋。立面有细竖肋，阳台放着花箱，店铺用折叠钢门关上。这是 Urban Creature 2026年10月5日介绍仅蓬·坎提的封面三种类型之一。她图纸上的街名，在能清楚辨认之前，这里不转录。",
    },
    drawingRef: {
      en: `${COVER}: the tall modernist of the three cover types. Elevation drawn for this library. Her image is not reproduced.`,
      th: `${COVER}: แบบสูงสมัยใหม่ในสามแบบบนหน้าปก รูปด้านวาดขึ้นสำหรับห้องสมุดนี้ ไม่คัดลอกภาพของเธอ`,
      zh: `${COVER}：封面三种里较高的现代主义那一型。立面是为本馆画的，不复制她的图。`,
    },
    elevation: "fin-and-flowerbox",
    sources: TYPOLOGY_CREDITS,
    toConfirm: ["street", "district", "point"],
  },
  {
    id: "arch-and-column",
    name: {
      en: "Arch-and-column row",
      th: "ตึกโค้งและเสา",
      zh: "拱窗列柱店屋",
    },
    era: {
      en: "Two to three storeys, arched upper floor. Decade to confirm.",
      th: "สองถึงสามชั้น ชั้นบนเป็นหน้าต่างโค้ง ทศวรรษยังไม่ยืนยัน",
      zh: "两至三层，上层发券。具体年代待确认。",
    },
    street: TO_CONFIRM,
    district: TO_CONFIRM,
    facade: [
      { en: "Arched upper windows", th: "หน้าต่างโค้งชั้นบน", zh: "上层拱窗" },
      { en: "Columns", th: "เสา", zh: "列柱" },
    ],
    description: {
      en: "A two- to three-storey row. The upper windows are arched, and columns stand on the front. One of the three types on that same Urban Creature cover. The street label is left open rather than guessed.",
      th: "ตึกสองถึงสามชั้น หน้าต่างชั้นบนเป็นวงโค้ง และมีเสาที่ด้านหน้า เป็นอีกแบบบนหน้าปกเดียวกัน ชื่อถนนยังเปิดไว้ ไม่เดา",
      zh: "两至三层的排屋。上层窗子发券，立面有列柱。同样来自那张封面。街名先空着，不猜。",
    },
    drawingRef: {
      en: `${COVER}: the arched, columned type of the three on the cover. Elevation drawn for this library. Her image is not reproduced.`,
      th: `${COVER}: แบบหน้าต่างโค้งและเสาในสามแบบบนหน้าปก รูปด้านวาดขึ้นสำหรับห้องสมุดนี้ ไม่คัดลอกภาพของเธอ`,
      zh: `${COVER}：封面三种里带拱窗和列柱的那一型。立面是为本馆画的，不复制她的图。`,
    },
    elevation: "arch-and-column",
    sources: TYPOLOGY_CREDITS,
    toConfirm: ["street", "district", "point"],
  },
  {
    id: "paired-window-brick",
    name: {
      en: "Paired-window brick row",
      th: "ตึกอิฐหน้าต่างคู่",
      zh: "双窗砖砌店屋",
    },
    era: {
      en: "Two storeys, low brick row. Decade to confirm.",
      th: "สองชั้น ตึกอิฐเตี้ย ทศวรรษยังไม่ยืนยัน",
      zh: "两层，低矮砖楼。具体年代待确认。",
    },
    street: TO_CONFIRM,
    district: TO_CONFIRM,
    facade: [
      { en: "Brick facade", th: "หน้าอาคารอิฐ", zh: "砖砌立面" },
      { en: "Paired windows", th: "หน้าต่างคู่", zh: "成对的窗" },
    ],
    description: {
      en: "A low two-storey row in brick, with windows set in pairs. The third type on that cover. Where it stands in Bangkok is not stated here until a label can be read.",
      th: "ตึกเตี้ยสองชั้น ก่ออิฐ หน้าต่างจับเป็นคู่ เป็นแบบที่สามบนหน้าปกเดียวกัน จะอยู่ตรงไหนของกรุงเทพฯ ยังไม่ระบุจนกว่าจะอ่านป้ายได้",
      zh: "低矮的两层砖楼，窗子成对。封面三种里的第三型。在曼谷的哪一条街，等街名能读清再写。",
    },
    drawingRef: {
      en: `${COVER}: the low brick type with paired windows. Elevation drawn for this library. Her image is not reproduced.`,
      th: `${COVER}: แบบอิฐเตี้ยหน้าต่างคู่ รูปด้านวาดขึ้นสำหรับห้องสมุดนี้ ไม่คัดลอกภาพของเธอ`,
      zh: `${COVER}：封面三种里低矮、窗子成对的砖楼。立面是为本馆画的，不复制她的图。`,
    },
    elevation: "paired-window-brick",
    sources: TYPOLOGY_CREDITS,
    toConfirm: ["street", "district", "point"],
  },
];

export function typologyPoints(
  types: ShophouseTypeEntry[] = SHOPHOUSE_TYPES,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: types.flatMap((t) =>
      typeof t.lat === "number" && typeof t.lng === "number"
        ? [
            {
              type: "Feature" as const,
              id: t.id,
              properties: { id: t.id },
              geometry: {
                type: "Point" as const,
                coordinates: [t.lng, t.lat],
              },
            },
          ]
        : [],
    ),
  };
}
