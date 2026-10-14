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

// The library's question, in Non's voice. Glaeser's publisher page was
// fetched on 14 October 2026. sigus.mit.edu did not resolve that day, so
// SIGUS is cited from the Internet Archive copy that names Goethert.
// web.mit.edu/incrementalhousing returned 404; the archive still describes
// staged, owner-driven housing as the ordinary pattern of urban growth.
export const TYPOLOGY_STANCE: { intro: Trilingual; sources: TypologyCredit[] } = {
  intro: {
    en: "How can a city house a large number of people and keep its core identity? A shophouse row is one answer. It is dense and mixed-use. It changes one bay at a time. A household and a livelihood share the lot. Each type below is a lesson in that density.\n\nThe question is Edward Glaeser's, in Triumph of the City (Penguin, 2011), and Reinhard Goethert's, in the incremental-housing work of MIT SIGUS. Freezing a neighbourhood so the next household cannot get in is middle-class NIMBYism. This library does not take that side.",
    th: "เมืองหนึ่งจะให้คนอยู่ได้มาก และยังรักษาแก่นของตัวเองไว้ได้อย่างไร ตึกแถวเป็นคำตอบหนึ่ง หนาแน่น ใช้ปนกัน ปรับได้ทีละห้องแถว บ้านกับอาชีพอยู่บนที่ดินผืนเดียวกัน ประเภทด้านล่างคือบทเรียนของความหนาแน่นนั้น\n\nคำถามนี้มาจาก Edward Glaeser ใน Triumph of the City (Penguin, 2011) และจาก Reinhard Goethert ในงานที่อยู่อาศัยที่ปลูกเพิ่มทีละส่วนของ MIT SIGUS การแช่แข็งละแวกเพื่อไม่ให้ครัวเรือนใหม่เข้ามา คือการกีดกันแบบชนชั้นกลาง ห้องสมุดนี้ไม่เดินตามทางนั้น",
    zh: "一座城市怎样住下很多人，又保住自己的核心？店屋排屋是一个答案。它密，商住混用，一开间一开间地改，同一块地上既是家也是生计。下面每一种，都是这种密度的一课。\n\n这个问题来自 Edward Glaeser 的 Triumph of the City（Penguin，2011），也来自 Reinhard Goethert 在 MIT SIGUS 的渐进式住房。把街坊冻住、不让下一户进来，是中产式的邻避。这个馆不走那条路。",
  },
  sources: [
    {
      title: "Triumph of the City",
      url: "https://www.penguinrandomhouse.com/books/303439/triumph-of-the-city-by-edward-glaeser/",
      credit:
        "Edward Glaeser, Triumph of the City (Penguin, 2011). The publisher lists the ebook on 10 February 2011. This library takes the question of housing many people in a city, and does not treat the book as a quotation for the sentence about identity.",
    },
    {
      title: "MIT SIGUS",
      url: "https://web.archive.org/web/20231226060819/http://sigus.mit.edu/about.php",
      credit:
        "Internet Archive, 26 December 2023, of the SIGUS about page. sigus.mit.edu did not resolve on 14 October 2026. The page says the Special Interest Group in Urban Settlement is coordinated by Dr.-Ing. Reinhard Goethert, at the MIT School of Architecture and Planning, and that its work is participatory method for affordable housing.",
    },
    {
      title: "Incremental housing",
      url: "https://web.archive.org/web/20241223082938/http://web.mit.edu/incrementalhousing/",
      credit:
        "Internet Archive, 23 December 2024, of the incremental-housing site linked from SIGUS. web.mit.edu/incrementalhousing returned 404 on 14 October 2026. The page calls owner-driven, staged housing the ordinary pattern of growth in rapidly growing cities.",
    },
  ],
};

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
      en: "The type Non grew up in, along Lat Phrao Road: a household and a shop repeated down a long road. That is how this city added people. The lesson is ordinary density. People lived and worked on the same lot, and the row could take another bay when a family needed it. No drawing in the 5 October 2026 Urban Creature article is clearly labelled Lat Phrao, so the facade, the era, the district and any map point stay open. The road name is his, not a label read off her sheet.",
      th: "ประเภทที่นนโตมา ตามถนนลาดพร้าว เป็นบ้านและร้านที่ซ้ำไปตามถนนสายยาว นี่คือวิธีที่เมืองนี้เพิ่มคน บทเรียนคือความหนาแน่นธรรมดา คนอยู่และทำมาหากินบนที่ดินผืนเดียวกัน และแถวรับห้องใหม่ได้เมื่อครอบครัวต้องการ ไม่มีภาพวาดในบทความ Urban Creature วันที่ 5 ตุลาคม 2026 ที่ป้ายชัดว่าลาดพร้าว จึงยังไม่ระบุหน้าอาคาร ยุค เขต หรือจุดบนแผนที่ ชื่อถนนมาจากนน ไม่ได้ถอดจากป้ายบนภาพ",
      zh: "这是 Non 在拉抛路长大时住的那种店屋：一户人家、一间店，沿着一条长路重复下去。这座城市就是这样加人的。这一课是普通的密度。人在同一块地上住，也在同一块地上谋生，家里需要时，排屋再加一开间。2026年10月5日 Urban Creature 的文章里，没有一张图清楚标着拉抛路，所以立面、年代、区和地图上的点都先空着。路名是他本人说的，不是从图纸上认出来的。",
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
      en: "A tall commercial row: thin vertical fins run up the front, flower boxes sit on the balconies, and the shop closes with a folding steel door. The lesson is height as density. Four or five storeys on one shop front put more people on the same narrow lot, and the ground floor still opens onto the sidewalk, so the livelihood stays in the building. One of the three types on the cover of Urban Creature’s 5 October 2026 profile of Pheangporn Khanti. The street written on her drawing is not transcribed until it can be read clearly.",
      th: "ตึกพาณิชย์สูง ครีบบางเรียงขึ้นตามหน้าอาคาร ระเบียงมีกระถางดอกไม้ และร้านปิดด้วยประตูเหล็กพับ บทเรียนคือความสูงในฐานะความหนาแน่น สี่ถึงห้าชั้นบนหน้าร้านเดียว ทำให้คนอยู่บนที่ดินผืนแคบเดิมได้มากขึ้น และชั้นล่างยังเปิดออกสู่ทางเท้า อาชีพจึงยังอยู่ในตึก เป็นหนึ่งในสามแบบบนหน้าปกบทความ Urban Creature วันที่ 5 ตุลาคม 2026 ที่เล่าถึงเพียงพร ขันตี ชื่อถนนบนภาพของเธอยังไม่ถอดมา จนกว่าจะอ่านได้ชัด",
      zh: "一座高的商业排屋。立面有细竖肋，阳台放着花箱，店铺用折叠钢门关上。这一课是用高度做密度。同一间店面叠到四层或五层，窄地上住下更多的人，底层仍然开向人行道，生计还在这栋楼里。这是 Urban Creature 2026年10月5日介绍仅蓬·坎提的封面三种类型之一。她图纸上的街名，在能清楚辨认之前，这里不转录。",
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
      en: "A two- to three-storey row. The upper windows are arched, and columns stand on the front. The lesson is adaptability. The columned ground floor can change trade, and the household above stays. One bay can take a new shop without asking the whole row to become something else. One of the three types on that same Urban Creature cover. The street label is left open rather than guessed.",
      th: "ตึกสองถึงสามชั้น หน้าต่างชั้นบนเป็นวงโค้ง และมีเสาที่ด้านหน้า บทเรียนคือการปรับได้ ชั้นล่างที่มีเสาเปลี่ยนอาชีพได้ บ้านข้างบนยังอยู่ ห้องแถวหนึ่งรับร้านใหม่ได้โดยไม่ต้องให้ทั้งแถวกลายเป็นอย่างอื่น เป็นอีกแบบบนหน้าปกเดียวกัน ชื่อถนนยังเปิดไว้ ไม่เดา",
      zh: "两至三层的排屋。上层窗子发券，立面有列柱。这一课是适应。有列柱的底层可以换营生，楼上的家还在。一开间可以换一家店，不必让整排变成别的东西。同样来自那张封面。街名先空着，不猜。",
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
      en: "A low two-storey row in brick, with windows set in pairs. The lesson is the smallest complete unit. A shop and rooms on one lot, and a wall a household can repair one bay at a time, is already density: mixed-use, incremental, and able to grow taller later. The third type on that cover. Where it stands in Bangkok is not stated here until a label can be read.",
      th: "ตึกเตี้ยสองชั้น ก่ออิฐ หน้าต่างจับเป็นคู่ บทเรียนคือหน่วยที่เล็กที่สุดที่ยังครบ ร้านกับห้องบนที่ดินผืนเดียว และกำแพงที่ครัวเรือนซ่อมได้ทีละห้องแถว คือความหนาแน่นอยู่แล้ว ใช้ปนกัน ปลูกเพิ่มได้ และพร้อมจะสูงขึ้นภายหลัง เป็นแบบที่สามบนหน้าปกเดียวกัน จะอยู่ตรงไหนของกรุงเทพฯ ยังไม่ระบุจนกว่าจะอ่านป้ายได้",
      zh: "低矮的两层砖楼，窗子成对。这一课是最小而仍然完整的一户。一块地上有店有房间，墙可以一开间一开间地修，这已经是密度：商住混用，可以逐步加建，以后还能再长高。封面三种里的第三型。在曼谷的哪一条街，等街名能读清再写。",
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
