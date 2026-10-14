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
  "lat-phrao-row",
  "awning-row",
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

/** Official Instagram post. imageIndex is 1-based, matching ?img_index=. */
export type TypologyEmbed = {
  postUrl: string;
  imageIndex: number;
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
  /** The creator's post for this type. Slide in with a URL and an image index. */
  embed?: TypologyEmbed;
  sources: TypologyCredit[];
  /** Parts this entry refuses to guess. */
  toConfirm: ConfirmPart[];
};

export const CREATOR = {
  name: "Pheangporn Khanti",
  nameTh: "แป้ง-เพียงพร ขันตี",
  handle: "@shophouse.supply",
  profile: "https://www.instagram.com/shophouse.supply/",
  article: "https://urbancreature.co/shophouse-supply/",
  post: "https://www.instagram.com/p/DeG4utWGjvO/",
} as const;

export const JACOBS_POST = {
  name: "Abhinav Bhardwaj",
  handle: "@abhinavbwj",
  profile: "https://www.instagram.com/abhinavbwj",
  post: "https://www.instagram.com/p/DeaILEpk_xF/",
} as const;

export const TYPOLOGY_CREDITS: TypologyCredit[] = [
  {
    title: "Shophouse Supply — แอ็กเคานต์ที่วาดภาพตึกแถวในเมือง",
    url: CREATOR.article,
    credit:
      "Urban Creature, 5 October 2026. Profile of architect Pheangporn Khanti (แป้ง-เพียงพร ขันตี, @shophouse.supply). Her images are not copied.",
  },
  {
    title: "Urban Creature on Instagram",
    url: CREATOR.post,
    credit:
      "Pheangporn Khanti (แป้ง-เพียงพร ขันตี), @shophouse.supply. Posted by urbancreatureth, the same profile, with the article link. Carousel place-names read from the sheets: ถนนบรรทัดทอง, ถนนลาดพร้าว, ย่านประตูน้ำ, ย่านพระราม 4. Two further sheets did not yield a place name clear enough to file.",
  },
  {
    title: "@shophouse.supply",
    url: CREATOR.profile,
    credit:
      "Pheangporn Khanti (แป้ง-เพียงพร ขันตี), @shophouse.supply. The drawings are hers. This library credits and links them.",
  },
  {
    title: "Did Jane Jacobs survive the data?",
    url: JACOBS_POST.post,
    credit:
      "Abhinav Bhardwaj, @abhinavbwj. Instagram post. Jacobs’s four conditions tested on 857,000 New York lots and 98 streets of pedestrian counts, 2007–2026. Data named on the slides: NYC DCP MapPLUTO 26v2, NYC DOT Bi-Annual Pedestrian Counts, MTA ridership 2024. Method after Sung, Lee and Cheon 2015, JPER 35(2).",
  },
  {
    title: "Palette",
    url: "https://github.com/Nonarkara/palette",
    credit:
      "The elevations on this page are drawn for this library in Palette colours: flat fields, no gradients. Palette is the drawing style, not a source for the buildings.",
  },
];

export const TYPOLOGY_RECORD: Trilingual = {
  en: "Pheangporn Khanti (แป้ง-เพียงพร ขันตี, @shophouse.supply) draws Bangkok shophouses because the type was once prosperous and is now changing, from how people live, from business, and from development. She asks what happens to the rows next. She treats the shophouse as infrastructure for small business: daily life, the local economy and the activity of the street, tied together. In Singapore, official care keeps the type in the city and draws tourists, investors and other users; conservation and a higher price also change the uses, the users and the shops. She chooses rows she has already studied as likely to be renovated, changed or redeveloped, where old shops go and some buildings are replaced. Staying or going, the effect lands on the city’s identity, on how people live, and on the businesses. After the account opened, people found the real building from the drawing with no coordinates published. Others write when they find one, suggest rows, and artists abroad talk about shophouses in their own countries. Many of them are not architects, which was her aim. A drawing can leave out the sign and the awning that hide the front, and it forces a slow look. She hopes people outside the profession look up. A Bangkok row records the life and the development of its period. If you never look up, the awning and the sign are all you see.\n\nAbhinav Bhardwaj (@abhinavbwj), in “Did Jane Jacobs survive the data?”, measures the four 1961 conditions on 857,000 New York lots. 555 Hudson Street is where Jacobs lived. Mixed uses are scored as floor-area entropy of five uses within a 400 m walk. New York has 28,739 tax blocks; the median long side is 184 m citywide and about 245 m in Midtown. Age mix uses seven eras and fades by 800 m, while concentration grows stronger with distance. Dwellings per hectare against footfall: r = 0.47, the strongest of the four. Mean block length against footfall: r = 0.16, so long blocks are slightly busier, and with all four conditions plus transit the longer blocks still carry more people (p = 0.05). Outside Manhattan, with density and transit held equal, land-use mix is +21% people per standard deviation (p = 0.03); across all 98 streets the mix barely registers. Subway ridership lifts R² from 0.37 to 0.67 and correlates with density at r = 0.62. Streets meeting all four conditions above the median are not the busiest, and there is no steady climb from none to four. In the combined model, concentration shares its effect with the subway, age mix holds, mixed uses wobble, and short blocks fail. In Seoul the conditions held (Sung, Lee and Cheon 2015). Every counter stands on a shopping street. The quiet residential sidewalks were never counted. 98 streets in one city show correlation, not cause.",
  th: "เพียงพร ขันตี (แป้ง, @shophouse.supply) วาดตึกแถวกรุงเทพฯ เพราะมันเคยรุ่งเรืองและกำลังเปลี่ยน ทั้งจากวิถีชีวิต ธุรกิจ และการพัฒนาเมือง เธอชวนให้คิดว่าตึกเหล่านี้จะเป็นอย่างไรต่อไป เธอมองตึกแถวเป็นโครงสร้างรองรับธุรกิจเล็ก ที่ผูกชีวิตประจำวัน เศรษฐกิจท้องถิ่น และกิจกรรมบนถนนเข้าด้วยกัน ที่สิงคโปร์ การดูแลอย่างเป็นระบบทำให้อาคารประเภทนี้ยังทำงานอยู่ในเมือง และดึงนักท่องเที่ยว นักลงทุน และผู้ใช้ แต่การอนุรักษ์และการเพิ่มมูลค่าก็เปลี่ยนรูปแบบการใช้ กลุ่มผู้ใช้ และประเภทร้าน เธอเลือกแถวที่ทำการบ้านแล้วว่ามีแนวโน้มจะถูกปรับปรุง เปลี่ยนแปลง หรือพัฒนา จนร้านเก่าหายและบางตึกถูกแทนที่ ไม่ว่าจะคงอยู่หรือหายไป ผลตกที่อัตลักษณ์เมือง วิถีชีวิต และธุรกิจในพื้นที่ คนตามภาพวาดไปเจอตึกจริงทั้งที่ไม่มีพิกัด คนทักเมื่อเจอตึกที่เธอวาด แนะนำแถวในพื้นที่อื่น และศิลปินต่างชาติคุยเรื่องตึกแถวในประเทศตัวเอง หลายคนไม่ได้อยู่ในวงสถาปัตยกรรม ซึ่งตรงกับความตั้งใจตอนเปิดแอ็กเคานต์ ภาพวาดตัดป้ายและกันสาดที่บังอาคารได้ และบังคับให้มองละเอียด เธออยากให้คนนอกวงการเงยหน้าดู ตึกแถวกรุงเทพฯ บันทึกวิถีชีวิตและการพัฒนาของแต่ละช่วง ถ้าไม่เงยหน้า ก็เห็นแต่กันสาดกับป้าย\n\nAbhinav Bhardwaj (@abhinavbwj) ในโพสต์ “Did Jane Jacobs survive the data?” วัดเงื่อนไขสี่ข้อของ Jacobs ปี 1961 บนล็อตนิวยอร์ก 857,000 ล็อต และจุดนับคนเดิน 98 จุด ระหว่างปี 2007–2026 ความหนาแน่นของที่อยู่อาศัยสัมพันธ์กับคนเดินมากที่สุดในสี่ข้อ (r = 0.47) ถนนที่ครบสี่ข้อไม่ใช่ถนนที่คนเดินมากที่สุด และไม่มีลำดับเพิ่มจากศูนย์ถึงสี่ การใส่จำนวนผู้โดยสารรถไฟใต้ดินยกกำลังอธิบายจาก 37% เป็น 67% จุดนับอยู่บนถนนการค้า ดังนั้นนี่คือสหสัมพันธ์ ไม่ใช่เหตุ และทางเท้าที่อยู่อาศัยเงียบๆ ไม่ได้ถูกนับ",
  zh: "仅蓬·坎提（แป้ง-เพียงพร ขันตี，@shophouse.supply）画曼谷店屋，因为这种房子曾经兴旺，现在正因生活方式、生意和城市开发而改变。她请人一起想，这些排屋以后会怎样。她把店屋看成小生意的基础设施，把日常生活、本地经济和街上的活动连在一起。在新加坡，有系统的维护让这种房子继续留在城里，也引来游客、投资者和使用者；保护和升值同时改变用途、使用者和店铺种类。她先做功课，挑那些可能被整修、改变或再开发的地方，老店会消失，有的房子会被换掉。留下或消失，都会落到城市的身份、生活方式和当地生意上。账号开了以后，有人没有坐标，只靠画找到真房子。也有人遇见她画过的房子就来信，推荐别处的排屋，外国艺术家谈自己国家的店屋。其中很多人不是建筑师，这正是她开账号时要的。画可以把挡住立面的招牌和雨篷去掉，也逼人慢慢看。她希望行业以外的人抬头。曼谷店屋记下每个时期的生活和开发。不抬头，就只看见雨篷和招牌。\n\nAbhinav Bhardwaj（@abhinavbwj）在 “Did Jane Jacobs survive the data?” 里，用 1961 年 Jacobs 的四个条件，对照纽约 857,000 宗地和 98 条街、2007 到 2026 年的步行人数。居住密度是四个条件里最强的一项（r = 0.47）。四项都达到的街并不是最热闹的，从零项到四项也没有稳定的上升。加上地铁客流，解释力从 37% 升到 67%。计数点设在商业街上，所以这是相关，不是因果，安静的居住人行道没有被数进去。",
};

// The library's question, in Non's voice. Glaeser's publisher page was
// fetched on 14 October 2026. sigus.mit.edu did not resolve that day, so
// SIGUS is cited from the Internet Archive copy that names Goethert.
// web.mit.edu/incrementalhousing returned 404; the archive still describes
// staged, owner-driven housing as the ordinary pattern of urban growth.
export const TYPOLOGY_STANCE: {
  intro: Trilingual;
  sources: TypologyCredit[];
  embed: TypologyEmbed;
} = {
  embed: { postUrl: JACOBS_POST.post, imageIndex: 8 },
  intro: {
    en: "How can a city house a large number of people and keep its core identity? A shophouse row is one answer. It is dense and mixed-use. It changes one bay at a time. A household and a livelihood share the lot. Each type below is a lesson in that density.\n\nThe question is Edward Glaeser's, in Triumph of the City (Penguin, 2011), and Reinhard Goethert's, in the incremental-housing work of MIT SIGUS. Freezing a neighbourhood so the next household cannot get in is middle-class NIMBYism. This library does not take that side.\n\nAbhinav Bhardwaj (@abhinavbwj) measured Jane Jacobs’s four 1961 conditions on 857,000 New York lots and 19 years of counts on 98 streets. Dwelling concentration was the strongest (r = 0.47). Streets that met all four were not the busiest. Subway ridership lifted the fit from 37% to 67%. The counters stand on shopping streets, so this is correlation, not a cause. The part that meets this library is the concentration: many households, and a shop, on narrow lots.",
    th: "เมืองหนึ่งจะให้คนอยู่ได้มาก และยังรักษาแก่นของตัวเองไว้ได้อย่างไร ตึกแถวเป็นคำตอบหนึ่ง หนาแน่น ใช้ปนกัน ปรับได้ทีละห้องแถว บ้านกับอาชีพอยู่บนที่ดินผืนเดียวกัน ประเภทด้านล่างคือบทเรียนของความหนาแน่นนั้น\n\nคำถามนี้มาจาก Edward Glaeser ใน Triumph of the City (Penguin, 2011) และจาก Reinhard Goethert ในงานที่อยู่อาศัยที่ปลูกเพิ่มทีละส่วนของ MIT SIGUS การแช่แข็งละแวกเพื่อไม่ให้ครัวเรือนใหม่เข้ามา คือการกีดกันแบบชนชั้นกลาง ห้องสมุดนี้ไม่เดินตามทางนั้น\n\nAbhinav Bhardwaj (@abhinavbwj) วัดเงื่อนไขสี่ข้อของ Jane Jacobs ปี 1961 บนล็อตนิวยอร์ก 857,000 ล็อต และจุดนับ 98 จุดตลอด 19 ปี ความหนาแน่นของที่อยู่อาศัยแรงที่สุด (r = 0.47) ถนนที่ครบสี่ข้อไม่ใช่ถนนที่คนเดินมากที่สุด ผู้โดยสารรถไฟใต้ดินยกกำลังอธิบายจาก 37% เป็น 67% จุดนับอยู่บนถนนการค้า จึงเป็นสหสัมพันธ์ ไม่ใช่เหตุ ส่วนที่ตรงกับห้องสมุดนี้คือความหนาแน่น หลายครัวเรือนและร้าน บนที่ดินผืนแคบ",
    zh: "一座城市怎样住下很多人，又保住自己的核心？店屋排屋是一个答案。它密，商住混用，一开间一开间地改，同一块地上既是家也是生计。下面每一种，都是这种密度的一课。\n\n这个问题来自 Edward Glaeser 的 Triumph of the City（Penguin，2011），也来自 Reinhard Goethert 在 MIT SIGUS 的渐进式住房。把街坊冻住、不让下一户进来，是中产式的邻避。这个馆不走那条路。\n\nAbhinav Bhardwaj（@abhinavbwj）用 Jane Jacobs 1961 年的四个条件，对照纽约 857,000 宗地和 98 条街、19 年的人数。居住密度最强（r = 0.47）。四项都达到的街并不是最热闹的。地铁客流把解释力从 37% 抬到 67%。计数点在商业街上，所以这是相关，不是因果。和这个馆相接的是密度：很多户人家，加一间店，在窄地上。",
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
    facade: [
      { en: "Two storeys", th: "สองชั้น", zh: "两层" },
      { en: "Brick front", th: "หน้าอาคารอิฐ", zh: "砖砌立面" },
      { en: "Arched upper windows", th: "หน้าต่างโค้งชั้นบน", zh: "上层拱窗" },
      { en: "Paired windows", th: "หน้าต่างคู่", zh: "成对的窗" },
      { en: "Columns at the shop", th: "เสาหน้าร้าน", zh: "店面列柱" },
    ],
    description: {
      en: "The type Non grew up in. Pheangporn Khanti’s sheet in the 5 October 2026 post is titled for Lat Phrao Road: a low two-storey row, brick, arched upper windows, windows in pairs, columns at the shop. The lesson is ordinary density. A household and a shop share the lot, and people have found her buildings from the drawing alone, because she publishes no coordinates. The decade, the district and any map point stay open.",
      th: "ประเภทที่นนโตมา ภาพของเพียงพร ขันตีในโพสต์วันที่ 5 ตุลาคม 2026 ตั้งชื่อว่าถนนลาดพร้าว เป็นตึกเตี้ยสองชั้น ก่ออิฐ หน้าต่างชั้นบนโค้ง หน้าต่างจับคู่ และมีเสาหน้าร้าน บทเรียนคือความหนาแน่นธรรมดา บ้านกับร้านอยู่บนที่ดินผืนเดียวกัน และมีคนตามภาพไปเจอตึกจริงเพราะเธอไม่ลงพิกัด ทศวรรษ เขต และจุดบนแผนที่ยังเปิดไว้",
      zh: "这是 Non 长大时住的那种。仅蓬·坎提在 2026年10月5日那条帖子里的一张图，标题写着拉抛路：低矮的两层，砖墙，上层拱窗，窗子成对，店面有列柱。这一课是普通的密度。一户人家和一间店在同一块地上，而且有人只靠画就找到房子，因为她不公布坐标。具体年代、区和地图上的点都先空着。",
    },
    featured: {
      en: "The type Non grew up in",
      th: "ประเภทที่นนโตมา",
      zh: "Non 长大时住的那种",
    },
    drawingRef: {
      en: `${COVER}, Instagram carousel image 3, titled for Lat Phrao Road. Elevation drawn for this library. Her image is not reproduced.`,
      th: `${COVER} ภาพที่ 3 ในคารูเซล อินสตาแกรม ตั้งชื่อถนนลาดพร้าว รูปด้านวาดขึ้นสำหรับห้องสมุดนี้ ไม่คัดลอกภาพของเธอ`,
      zh: `${COVER}，Instagram 轮播第 3 张，标题为拉抛路。立面是为本馆画的，不复制她的图。`,
    },
    elevation: "lat-phrao-row",
    embed: { postUrl: CREATOR.post, imageIndex: 3 },
    sources: TYPOLOGY_CREDITS,
    toConfirm: ["era", "district", "point"],
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
    street: {
      en: "Banthat Thong Road",
      th: "ถนนบรรทัดทอง",
      zh: "班塔通路",
    },
    district: TO_CONFIRM,
    facade: [
      { en: "Vertical fins", th: "ครีบตั้ง", zh: "竖向肋片" },
      { en: "Flower-box balconies", th: "ระเบียงกระถางดอกไม้", zh: "花箱阳台" },
      { en: "Folding steel door", th: "ประตูเหล็กพับ", zh: "折叠钢门" },
    ],
    description: {
      en: "Pheangporn Khanti’s sheet is titled ถนนบรรทัดทอง, Banthat Thong Road: thin vertical fins, flower-box balconies, a folding steel door, four to five storeys. The lesson is height as density. More dwellings on the same shop front, which is the concentration Abhinav Bhardwaj measured as the strongest of Jacobs’s four conditions, and the ground floor still opens onto the sidewalk. She draws rows she expects to be renovated or replaced, signs and awnings left out so the front can be read.",
      th: "ภาพของเพียงพร ขันตีตั้งชื่อถนนบรรทัดทอง ครีบตั้ง ระเบียงกระถาง ประตูเหล็กพับ สี่ถึงห้าชั้น บทเรียนคือความสูงในฐานะความหนาแน่น ที่อยู่มากขึ้นบนหน้าร้านเดิม ซึ่งคือความหนาแน่นที่ Abhinav Bhardwaj วัดได้ว่าแรงที่สุดในสี่เงื่อนไขของ Jacobs และชั้นล่างยังเปิดสู่ทางเท้า เธอเลือกแถวที่คาดว่าจะถูกปรับปรุงหรือแทนที่ และตัดป้ายกับกันสาดออกเพื่อให้อ่านหน้าอาคารได้",
      zh: "仅蓬·坎提的这张图标题是班塔通路：竖向肋片，花箱阳台，折叠钢门，四到五层。这一课是用高度做密度。同一间店面上住下更多的人，这也是 Abhinav Bhardwaj 量到的、Jacobs 四个条件里最强的那种集中，底层仍然开向人行道。她挑可能被整修或替换的排屋来画，并去掉招牌和雨篷，好让立面可读。",
    },
    drawingRef: {
      en: `${COVER}, Instagram carousel image 2, titled ถนนบรรทัดทอง. Elevation drawn for this library. Her image is not reproduced.`,
      th: `${COVER} ภาพที่ 2 ในคารูเซล ตั้งชื่อถนนบรรทัดทอง รูปด้านวาดขึ้นสำหรับห้องสมุดนี้ ไม่คัดลอกภาพของเธอ`,
      zh: `${COVER}，Instagram 轮播第 2 张，标题为班塔通路。立面是为本馆画的，不复制她的图。`,
    },
    elevation: "fin-and-flowerbox",
    embed: { postUrl: CREATOR.post, imageIndex: 2 },
    sources: TYPOLOGY_CREDITS,
    toConfirm: ["district", "point"],
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
    street: {
      en: "Rama IV area",
      th: "ย่านพระราม 4",
      zh: "拉玛四世路一带",
    },
    district: TO_CONFIRM,
    facade: [
      { en: "Arched upper windows", th: "หน้าต่างโค้งชั้นบน", zh: "上层拱窗" },
      { en: "Columns", th: "เสา", zh: "列柱" },
    ],
    description: {
      en: "Pheangporn Khanti’s sheet is titled ย่านพระราม 4, the Rama IV area: two to three storeys, arched upper windows, columns on the front. The lesson is adaptability. The columned shop can change trade while the household above stays, which is how a row keeps a livelihood instead of being frozen as a specimen. One bay can take a new shop without asking the whole row to become something else. Outside Manhattan, Bhardwaj found land-use mix did add people once density and transit were held equal (+21% per standard deviation, p = 0.03). The mix here is the shop and the house on one lot.",
      th: "ภาพของเพียงพร ขันตีตั้งชื่อย่านพระราม 4 สองถึงสามชั้น หน้าต่างชั้นบนโค้ง มีเสาด้านหน้า บทเรียนคือการปรับได้ ร้านที่มีเสาเปลี่ยนอาชีพได้ บ้านข้างบนยังอยู่ คือวิธีที่แถวยังมีอาชีพแทนที่จะถูกแช่แข็งเป็นตัวอย่าง ห้องแถวหนึ่งรับร้านใหม่ได้โดยไม่ต้องให้ทั้งแถวกลายเป็นอย่างอื่น นอกแมนฮัตตัน Bhardwaj พบว่าส่วนผสมการใช้ที่ดินเพิ่มคนเดินเมื่อคุมความหนาแน่นและระบบขนส่งไว้เท่ากัน (+21% ต่อหนึ่งส่วนเบี่ยงเบนมาตรฐาน, p = 0.03) ส่วนผสมที่นี่คือร้านกับบ้านบนที่ดินผืนเดียว",
      zh: "仅蓬·坎提的这张图标题是拉玛四世路一带：两到三层，上层拱窗，立面有列柱。这一课是适应。有列柱的店铺可以换营生，楼上的家还在。排屋靠这个继续过日子，而不是被冻成标本。一开间可以换一家店，不必让整排变成别的东西。在曼哈顿以外，Bhardwaj 发现在密度和交通持平之后，土地用途的混合确实增加了人（每标准差 +21%，p = 0.03）。这里的混合，就是同一块地上的店和家。",
    },
    drawingRef: {
      en: `${COVER}, Instagram carousel image 6, titled ย่านพระราม 4. Elevation drawn for this library. Her image is not reproduced.`,
      th: `${COVER} ภาพที่ 6 ในคารูเซล ตั้งชื่อย่านพระราม 4 รูปด้านวาดขึ้นสำหรับห้องสมุดนี้ ไม่คัดลอกภาพของเธอ`,
      zh: `${COVER}，Instagram 轮播第 6 张，标题为拉玛四世路一带。立面是为本馆画的，不复制她的图。`,
    },
    elevation: "arch-and-column",
    embed: { postUrl: CREATOR.post, imageIndex: 6 },
    sources: TYPOLOGY_CREDITS,
    toConfirm: ["district", "point"],
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
      en: "A low two-storey row in brick, with windows set in pairs, one of the three families on the cover. The lesson is the smallest complete unit. A shop and rooms on one lot, repaired one bay at a time, is already density: mixed-use, incremental, and able to grow taller later. Bhardwaj found no steady climb from meeting none of Jacobs’s conditions to meeting all four, so a complete small unit beats a frozen checklist. The street on this cover sheet was not clear enough to file.",
      th: "ตึกเตี้ยสองชั้น ก่ออิฐ หน้าต่างจับเป็นคู่ เป็นหนึ่งในสามตระกูลบนหน้าปก บทเรียนคือหน่วยที่เล็กที่สุดที่ยังครบ ร้านกับห้องบนที่ดินผืนเดียว ซ่อมได้ทีละห้องแถว คือความหนาแน่นอยู่แล้ว ใช้ปนกัน ปลูกเพิ่มได้ และพร้อมจะสูงขึ้นภายหลัง Bhardwaj พบว่าไม่มีลำดับเพิ่มจากการไม่เข้าเงื่อนไขเลยไปจนครบสี่ข้อของ Jacobs ดังนั้นหน่วยเล็กที่ครบจึงสำคัญกว่าบัญชีที่ถูกแช่แข็ง ชื่อถนนบนหน้าปกนี้ยังอ่านได้ไม่ชัดพอจะลงบันทึก",
      zh: "低矮的两层砖楼，窗子成对，是封面上的三种之一。这一课是最小而仍然完整的一户。一块地上有店有房间，可以一开间一开间地修，这已经是密度：商住混用，可以逐步加建，以后还能再长高。Bhardwaj 发现，从 Jacobs 的条件一条都不达到四条都达到，并没有稳定的上升，所以一个完整的小单元比一份被冻住的清单有用。这张封面上的街名还不够清楚，先不登记。",
    },
    drawingRef: {
      en: `${COVER}: the low brick type with paired windows. Elevation drawn for this library. Her image is not reproduced.`,
      th: `${COVER}: แบบอิฐเตี้ยหน้าต่างคู่ รูปด้านวาดขึ้นสำหรับห้องสมุดนี้ ไม่คัดลอกภาพของเธอ`,
      zh: `${COVER}：封面三种里低矮、窗子成对的砖楼。立面是为本馆画的，不复制她的图。`,
    },
    elevation: "paired-window-brick",
    embed: { postUrl: CREATOR.post, imageIndex: 1 },
    sources: TYPOLOGY_CREDITS,
    toConfirm: ["street", "district", "point"],
  },
  {
    id: "pratunam",
    name: {
      en: "Pratunam row",
      th: "ตึกแถวย่านประตูน้ำ",
      zh: "水门一带店屋",
    },
    era: {
      en: "Four to five storeys, with a ground-floor awning. Decade to confirm.",
      th: "สี่ถึงห้าชั้น มีกันสาดชั้นล่าง ทศวรรษยังไม่ยืนยัน",
      zh: "四至五层，底层有雨篷。具体年代待确认。",
    },
    street: {
      en: "Pratunam",
      th: "ย่านประตูน้ำ",
      zh: "水门一带",
    },
    district: TO_CONFIRM,
    facade: [
      { en: "Four to five storeys", th: "สี่ถึงห้าชั้น", zh: "四至五层" },
      { en: "Ground-floor awning", th: "กันสาดชั้นล่าง", zh: "底层雨篷" },
      { en: "Shopfronts", th: "หน้าร้าน", zh: "店面" },
    ],
    description: {
      en: "Pheangporn Khanti’s sheet is titled ย่านประตูน้ำ, Pratunam: a four- to five-storey row with a ground-floor awning and shopfronts. The lesson is density with a livelihood that stays visible. She says that if you never look up, the awning and the sign are all you see, so the drawing leaves them out and the building can be read. The awning is still part of how the shop meets the street. The decade, the district and any map point stay open. She publishes no coordinates.",
      th: "ภาพของเพียงพร ขันตีตั้งชื่อย่านประตูน้ำ เป็นตึกสี่ถึงห้าชั้น มีกันสาดชั้นล่างและหน้าร้าน บทเรียนคืออาชีพที่ยังมองเห็น เธอบอกว่าถ้าไม่เงยหน้า จะเห็นแต่กันสาดกับป้าย ภาพวาดจึงตัดสิ่งที่บังออกเพื่อให้อ่านอาคารได้ แต่กันสาดก็ยังเป็นวิธีที่ร้านเจอถนน ทศวรรษ เขต และจุดบนแผนที่ยังเปิดไว้ เธอไม่ลงพิกัด",
      zh: "仅蓬·坎提的这张图标题是水门一带：四到五层，底层有雨篷和店面。这一课是生计还看得见。她说不抬头就只看见雨篷和招牌，所以画把挡住的东西去掉，房子才读得出来。雨篷仍然是店铺接到街上的方式。具体年代、区和地图上的点都先空着。她不公布坐标。",
    },
    drawingRef: {
      en: `${COVER}, Instagram carousel image 5, titled ย่านประตูน้ำ. Elevation drawn for this library. Her image is not reproduced.`,
      th: `${COVER} ภาพที่ 5 ในคารูเซล ตั้งชื่อย่านประตูน้ำ รูปด้านวาดขึ้นสำหรับห้องสมุดนี้ ไม่คัดลอกภาพของเธอ`,
      zh: `${COVER}，Instagram 轮播第 5 张，标题为水门一带。立面是为本馆画的，不复制她的图。`,
    },
    elevation: "awning-row",
    embed: { postUrl: CREATOR.post, imageIndex: 5 },
    sources: TYPOLOGY_CREDITS,
    toConfirm: ["district", "point"],
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
