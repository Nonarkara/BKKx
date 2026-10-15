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

export const CLIMATE_POST = {
  name: "Abhinav Bhardwaj",
  handle: "@abhinavbwj",
  profile: "https://www.instagram.com/abhinavbwj",
  post: "https://www.instagram.com/p/DeUKkA8kvDF/",
  /** Street height-to-width slide. 1-based, matching ?img_index=. */
  imageIndex: 4,
} as const;

export const SAFETY_POST = {
  name: "@avanidoesart",
  handle: "posted by @urbanistcomix (Leewardists)",
  artist: "https://www.instagram.com/avanidoesart/",
  profile: "https://www.instagram.com/urbanistcomix/",
  post: "https://www.instagram.com/p/Dedgqo9jFOM/",
  /** “Design for visibility” panel. 1-based, matching ?img_index=. */
  imageIndex: 3,
} as const;

export const PLACES_POST = {
  name: "Abhinav Bhardwaj",
  handle: "@abhinavbwj",
  profile: "https://www.instagram.com/abhinavbwj",
  post: "https://www.instagram.com/p/DeNAO6ZEvAV/",
  /** “Saturday at the bowling alley.” 1-based, matching ?img_index=. */
  imageIndex: 14,
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
    title: "Climate responsive Urbanism!",
    url: CLIMATE_POST.post,
    credit:
      "Abhinav Bhardwaj, @abhinavbwj. Instagram carousel of ten climate-responsive urban design moves. His images are not copied. The neighbourhood plan is marked on the slide as an illustration, not a real site. Claims below are as printed on the slides, including Oke’s height-to-width middle path of about 0.4 to 0.6.",
  },
  {
    title: "We need to talk about the basics now",
    url: SAFETY_POST.post,
    credit:
      "Comic by @avanidoesart, posted by @urbanistcomix (Leewardists). A guide to a street a woman can walk: light, a clear line of sight from the rooms above, a ground floor that does not empty, vendors after the shops close, upkeep, women’s own knowledge of the unguarded stretch, crossings, who is on duty, how help responds, and education. The drawings are not copied.",
  },
  {
    title: "Places that only exist in your memory now",
    url: PLACES_POST.post,
    credit:
      "Abhinav Bhardwaj, @abhinavbwj. Instagram carousel, caption “Places that only exist in your memory now! :)”. Seventeen everyday places, counted at their height and counted again. The bowling-alley plate is image 14. His drawings are not copied.",
  },
  {
    title: "Palette",
    url: "https://github.com/Nonarkara/palette",
    credit:
      "The elevations on this page are drawn for this library in Palette colours: flat fields, no gradients. Palette is the drawing style, not a source for the buildings.",
  },
];

export const TYPOLOGY_RECORD: Trilingual = {
  en: "Pheangporn Khanti (แป้ง-เพียงพร ขันตี, @shophouse.supply) draws Bangkok shophouses because the type was once prosperous and is now changing, from how people live, from business, and from development. She asks what happens to the rows next. She treats the shophouse as infrastructure for small business: daily life, the local economy and the activity of the street, tied together. In Singapore, official care keeps the type in the city and draws tourists, investors and other users; conservation and a higher price also change the uses, the users and the shops. She chooses rows she has already studied as likely to be renovated, changed or redeveloped, where old shops go and some buildings are replaced. Staying or going, the effect lands on the city’s identity, on how people live, and on the businesses. After the account opened, people found the real building from the drawing with no coordinates published. Others write when they find one, suggest rows, and artists abroad talk about shophouses in their own countries. Many of them are not architects, which was her aim. A drawing can leave out the sign and the awning that hide the front, and it forces a slow look. She hopes people outside the profession look up. A Bangkok row records the life and the development of its period. If you never look up, the awning and the sign are all you see.\n\nAbhinav Bhardwaj (@abhinavbwj), in “Did Jane Jacobs survive the data?”, measures the four 1961 conditions on 857,000 New York lots. 555 Hudson Street is where Jacobs lived. Mixed uses are scored as floor-area entropy of five uses within a 400 m walk. New York has 28,739 tax blocks; the median long side is 184 m citywide and about 245 m in Midtown. Age mix uses seven eras and fades by 800 m, while concentration grows stronger with distance. Dwellings per hectare against footfall: r = 0.47, the strongest of the four. Mean block length against footfall: r = 0.16, so long blocks are slightly busier, and with all four conditions plus transit the longer blocks still carry more people (p = 0.05). Outside Manhattan, with density and transit held equal, land-use mix is +21% people per standard deviation (p = 0.03); across all 98 streets the mix barely registers. Subway ridership lifts R² from 0.37 to 0.67 and correlates with density at r = 0.62. Streets meeting all four conditions above the median are not the busiest, and there is no steady climb from none to four. In the combined model, concentration shares its effect with the subway, age mix holds, mixed uses wobble, and short blocks fail. In Seoul the conditions held (Sung, Lee and Cheon 2015). Every counter stands on a shopping street. The quiet residential sidewalks were never counted. 98 streets in one city show correlation, not cause.\n\nIn “Climate responsive Urbanism!” the same author sets out ten moves for a street’s climate. The line that meets this library is his: the shape of a street sets its temperature. A deep street, height over width, stays cooler by day and warmer by night. He prints T. R. Oke’s middle path as a height-to-width ratio of about 0.4 to 0.6 (Oke 1988, Energy and Buildings 11; Oke 1981, Journal of Climatology 1; Johansson 2006, Building and Environment 41). Shade changes the heat a person feels much more than it changes the air temperature (Ali-Toudert and Mayer 2007, Solar Energy 81(6); Erell, Pearlmutter and Williamson 2011). East–west streets take the sun; turning the grid moves the shade (Ali-Toudert and Mayer 2006, Building and Environment 41(2); Givoni 1998; Olgyay 1963). A pale pavement can throw that heat back onto the person walking. A court, open water, a joined tree canopy and a setback each do one job, and none of the ten works alone: a district needs most of them at once. The neighbourhood plan on the carousel is his illustration, not a real site. This library has not measured the height-to-width of the Bangkok rows below. The bibliography is the last slide.\n\nA comic by @avanidoesart, “We need to talk about the basics now,” posted by @urbanistcomix (Leewardists), treats a safe street as a set of basics. Lighting is one of the strongest predictors of whether a street feels safe, and one of the easiest fixes. Visibility means no high walls or blind corners, so the people living above have a clear line of sight to the street. A street that is only offices, or only housing, empties at some hour. It stays alive if there is somewhere to sit, and vendors keep it occupied and watched after the shops close. A light opened once and then forgotten still needs a budget for upkeep. Women already know which stretch is unguarded; a formal audit turns that knowledge into a recurring process whose findings go to the municipality that can act. Ramps, tactile paths and safe crossings belong on the same street, as do women on the bus and at the station, police and helplines who support her without asking why she was out, and an education that treats the hardware as a temporary patch. For this library the row is that street: many households over a working shop, so the sidewalk stays watched and walkable. Housing those people is the safety. Freezing the buildings, so the next household cannot get in, is not. The lighting, the vendors and the crossings on the rows below are not surveyed here.\n\n@abhinavbwj, in “Places that only exist in your memory now,” counts seventeen everyday places at their height and again today. He draws them as they are remembered, in lines that fade, and says each figure on the following plates was checked against its publisher. Britain’s public phone boxes: 92,000 in 1992, and BT now lists 10,338, nearly 2,000 of those no longer fully working (Ofcom, 2024; BT payphone statistics, 2026). Pubs: 69,000 in 1980 and about 45,000 in 2024, roughly one in three gone (British Beer and Pub Association). Japan’s game arcades: 26,573 in the 1986 police count, 4,007 at the end of 2024 (National Police Agency). India’s public call offices: 6.2 million in March 2009, about 10,000 by March 2025, a telephone and a meter on a shop counter. British bank branches: 6,896 closed since January 2015, 70 percent of those open then (Which? tracker, September 2026). South Korea’s PC bangs, the internet cafés where a generation learned to play together: 23,548 in 2001, 7,243 in 2024. Blockbuster: 9,094 stores in 2004, and one left, in Bend, Oregon, the last in the world since March 2019. India’s single-screen cinemas: about 24,000 in 1990 and, by one count, fewer than 6,000 now, with most pin codes having no cinema at all (Hemant Chaturvedi; EY media and entertainment report, 2025). Fotomat’s drive-up huts: over 4,000 in American car parks in the early 1980s, and none left. Drive-in theatres in America: 4,063 in 1958, 280 still open in 2025. British public libraries, the room where a generation learned to read: almost 800 closed between 2010 and 2019, leaving 3,583. Japan’s public baths, where neighbours washed side by side under a painted Mount Fuji: once 17,999, and 1,493 left in April 2026 (national bath association figures, reported by Tokyo Shoko Research, June 2026). Bowling centres in Japan: 3,697 in 1972, at the height of a national craze, and 621 at the end of 2025. Hong Kong’s dai pai dong street kitchens: no new licences since 1956, 28 left in 2005, 17 in 2024 (Food and Environmental Hygiene Department). America’s milk at the door: more than half in 1954, and 19.3 percent carried by the milkman in 1971. Debenhams: opened in 1778, and on 15 May 2021 its last 124 shops closed together (the administrators, 2021). Enclosed malls in the United States: more than 1,500 built between 1956 and 2005, about 1,150 still open in 2022 (Federal Reserve Bank of Richmond, Econ Focus, 2022). The last plate says the building goes and the memory stays, and asks which place on the list lives only in your memory, where it was, and who you went with. His drawings are not copied. This library has not counted the Bangkok rows in that way.",
  th: "เพียงพร ขันตี (แป้ง, @shophouse.supply) วาดตึกแถวกรุงเทพฯ เพราะมันเคยรุ่งเรืองและกำลังเปลี่ยน ทั้งจากวิถีชีวิต ธุรกิจ และการพัฒนาเมือง เธอชวนให้คิดว่าตึกเหล่านี้จะเป็นอย่างไรต่อไป เธอมองตึกแถวเป็นโครงสร้างรองรับธุรกิจเล็ก ที่ผูกชีวิตประจำวัน เศรษฐกิจท้องถิ่น และกิจกรรมบนถนนเข้าด้วยกัน ที่สิงคโปร์ การดูแลอย่างเป็นระบบทำให้อาคารประเภทนี้ยังทำงานอยู่ในเมือง และดึงนักท่องเที่ยว นักลงทุน และผู้ใช้ แต่การอนุรักษ์และการเพิ่มมูลค่าก็เปลี่ยนรูปแบบการใช้ กลุ่มผู้ใช้ และประเภทร้าน เธอเลือกแถวที่ทำการบ้านแล้วว่ามีแนวโน้มจะถูกปรับปรุง เปลี่ยนแปลง หรือพัฒนา จนร้านเก่าหายและบางตึกถูกแทนที่ ไม่ว่าจะคงอยู่หรือหายไป ผลตกที่อัตลักษณ์เมือง วิถีชีวิต และธุรกิจในพื้นที่ คนตามภาพวาดไปเจอตึกจริงทั้งที่ไม่มีพิกัด คนทักเมื่อเจอตึกที่เธอวาด แนะนำแถวในพื้นที่อื่น และศิลปินต่างชาติคุยเรื่องตึกแถวในประเทศตัวเอง หลายคนไม่ได้อยู่ในวงสถาปัตยกรรม ซึ่งตรงกับความตั้งใจตอนเปิดแอ็กเคานต์ ภาพวาดตัดป้ายและกันสาดที่บังอาคารได้ และบังคับให้มองละเอียด เธออยากให้คนนอกวงการเงยหน้าดู ตึกแถวกรุงเทพฯ บันทึกวิถีชีวิตและการพัฒนาของแต่ละช่วง ถ้าไม่เงยหน้า ก็เห็นแต่กันสาดกับป้าย\n\nAbhinav Bhardwaj (@abhinavbwj) ในโพสต์ “Did Jane Jacobs survive the data?” วัดเงื่อนไขสี่ข้อของ Jacobs ปี 1961 บนล็อตนิวยอร์ก 857,000 ล็อต และจุดนับคนเดิน 98 จุด ระหว่างปี 2007–2026 ความหนาแน่นของที่อยู่อาศัยสัมพันธ์กับคนเดินมากที่สุดในสี่ข้อ (r = 0.47) ถนนที่ครบสี่ข้อไม่ใช่ถนนที่คนเดินมากที่สุด และไม่มีลำดับเพิ่มจากศูนย์ถึงสี่ การใส่จำนวนผู้โดยสารรถไฟใต้ดินยกกำลังอธิบายจาก 37% เป็น 67% จุดนับอยู่บนถนนการค้า ดังนั้นนี่คือสหสัมพันธ์ ไม่ใช่เหตุ และทางเท้าที่อยู่อาศัยเงียบๆ ไม่ได้ถูกนับ\n\nใน “Climate responsive Urbanism!” ผู้เขียนคนเดียวกันวางสิบท่าสำหรับภูมิอากาศของถนน ประโยคที่ตรงกับห้องสมุดนี้คือ รูปทรงของถนนกำหนดอุณหภูมิของมัน ถนนที่ลึก อัตราส่วนความสูงต่อความกว้าง จะเย็นกว่าในตอนกลางวันและอุ่นกว่าในตอนกลางคืน เขาพิมพ์ทางสายกลางของ Oke ไว้ที่อัตราส่วนประมาณ 0.4 ถึง 0.6 ร่มเปลี่ยนความร้อนที่คนรู้สึกมากกว่าอุณหภูมิอากาศ ถนนตะวันออก–ตะวันตกรับแดด และการหมุนผังย้ายร่ม ไม่มีท่าใดทำงานลำพัง เขตหนึ่งต้องใช้ส่วนใหญ่พร้อมกัน ผังย่านบนคารูเซลเป็นภาพประกอบ ไม่ใช่พื้นที่จริง และห้องสมุดนี้ยังไม่ได้วัดอัตราส่วนของตึกแถวกรุงเทพฯ ด้านล่าง บรรณานุกรมอยู่ภาพสุดท้าย\n\nการ์ตูนของ @avanidoesart ชื่อ “We need to talk about the basics now” โพสต์โดย @urbanistcomix (Leewardists) มองถนนที่ปลอดภัยเป็นเรื่องพื้นฐาน แสงไฟเป็นหนึ่งในตัวบ่งชี้ที่แรงที่สุดว่าถนนรู้สึกปลอดภัยหรือไม่ และเป็นหนึ่งในสิ่งที่แก้ได้ง่ายที่สุด การมองเห็นหมายถึงไม่มีกำแพงสูงหรือมุมอับ เพื่อให้คนที่อยู่ชั้นบนมองลงมาถึงถนนได้ ถนนที่มีแต่ออฟฟิศ หรือมีแต่ที่อยู่ ว่างลงในบางชั่วโมง มันยังมีชีวิตได้ถ้ามีที่ให้นั่ง และแผงลอยทำให้ถนนมีคนและมีสายตาเฝ้าหลังร้านปิด ไฟที่เปิดครั้งเดียวแล้วถูกลืมยังต้องมีงบดูแล ผู้หญิงรู้แล้วว่าช่วงไหนไม่มีใครเฝ้า การสำรวจอย่างเป็นทางการเปลี่ยนความรู้นั้นเป็นกระบวนการที่เกิดซ้ำ และส่งผลไปยังหน่วยงานที่ทำให้เกิดการได้ ทางลาด ทางสัมผัส และทางข้ามที่ปลอดภัยอยู่บนถนนเดียวกัน เช่นเดียวกับผู้หญิงบนรถและในสถานี ตำรวจกับสายด่วนที่ช่วยโดยไม่ถามว่าเธอออกมาทำไม และการศึกษาที่ถือว่าอุปกรณ์เป็นเพียงการแก้ชั่วคราว สำหรับห้องสมุดนี้ ตึกแถวคือถนนนั้น หลายครัวเรือนอยู่เหนือร้านที่ยังทำงาน ทางเท้าจึงมีคนมองและเดินได้ การให้คนอยู่คือความปลอดภัย การแช่แข็งอาคารจนครัวเรือนใหม่เข้าไม่ได้ไม่ใช่ แสงไฟ แผงลอย และทางข้ามของแถวด้านล่างยังไม่ได้สำรวจที่นี่\n\n@abhinavbwj ใน “Places that only exist in your memory now” นับสถานที่ประจำวันสิบเจ็ดแห่งตอนที่มันมากที่สุด และนับอีกครั้งวันนี้ เขาวาดอย่างที่คนจำได้ เป็นเส้นที่จางลง และบอกว่าตัวเลขในแผ่นถัดไปตรวจกับผู้ตีพิมพ์แล้ว ตู้โทรศัพท์สาธารณะในอังกฤษ 92,000 ตู้ในปี 1992 ตอนนี้ BT ระบุไว้ 10,338 ตู้ และเกือบ 2,000 ตู้ในจำนวนนั้นทำงานไม่เต็มที่ (Ofcom, 2024; สถิติตู้โทรศัพท์ของ BT, 2026) ผับ 69,000 แห่งในปี 1980 และประมาณ 45,000 แห่งในปี 2024 หายไปราวหนึ่งในสาม (British Beer and Pub Association) ตู้เกมในญี่ปุ่น ตำรวจจด 26,573 แห่งในปี 1986 และ 4,007 แห่งตอนสิ้นปี 2024 (National Police Agency) สำนักงานโทรศัพท์สาธารณะในอินเดีย 6.2 ล้านแห่งในเดือนมีนาคม 2009 เหลือประมาณ 10,000 แห่งในเดือนมีนาคม 2025 เป็นโทรศัพท์กับมิเตอร์บนเคาน์เตอร์ร้าน สาขาธนาคารอังกฤษ ปิดไป 6,896 แห่งตั้งแต่เดือนมกราคม 2015 คิดเป็น 70 เปอร์เซ็นต์ของสาขาที่เปิดอยู่ในตอนนั้น (Which?, กันยายน 2026) พีซีบางในเกาหลีใต้ คาเฟ่อินเทอร์เน็ตที่คนรุ่นหนึ่งหัดเล่นด้วยกัน 23,548 แห่งในปี 2001 และ 7,243 แห่งในปี 2024 Blockbuster มีร้าน 9,094 แห่งในปี 2004 เหลือร้านเดียวที่ Bend, Oregon เป็นร้านสุดท้ายในโลกตั้งแต่มีนาคม 2019 โรงหนังจอเดียวในอินเดีย ประมาณ 24,000 แห่งในปี 1990 และตามการนับหนึ่ง เหลือน้อยกว่า 6,000 แห่งตอนนี้ รหัสไปรษณีย์ส่วนใหญ่ไม่มีโรงหนังเลย (Hemant Chaturvedi; รายงานสื่อและบันเทิงของ EY, 2025) กระท่อมล้างฟิล์มของ Fotomat กว่า 4,000 หลังในลานจอดรถอเมริกาช่วงต้นทศวรรษ 1980 ตอนนี้ไม่เหลือ โรงหนังไดรฟ์อินในอเมริกา 4,063 แห่งในปี 1958 และยังเปิด 280 แห่งในปี 2025 ห้องสมุดสาธารณะอังกฤษ ห้องที่คนรุ่นหนึ่งหัดอ่าน ปิดไปเกือบ 800 แห่งระหว่างปี 2010 ถึง 2019 เหลือ 3,583 แห่ง โรงอาบน้ำสาธารณะญี่ปุ่น ที่เพื่อนบ้านอาบเคียงกันใต้ภาพภูเขาไฟฟูจิ เคยมี 17,999 แห่ง และเหลือ 1,493 แห่งในเดือนเมษายน 2026 (ตัวเลขสมาคมโรงอาบน้ำแห่งชาติ อ้างโดย Tokyo Shoko Research, มิถุนายน 2026) ศูนย์โบว์ลิ่งในญี่ปุ่น 3,697 แห่งในปี 1972 ตอนที่ความคลั่งถึงจุดสูงสุด และ 621 แห่งตอนสิ้นปี 2025 ครัวริมถนนไต้เผ่ยตงของฮ่องกง หยุดออกใบอนุญาตใหม่ตั้งแต่ปี 1956 เหลือ 28 แห่งในปี 2005 และ 17 แห่งในปี 2024 (Food and Environmental Hygiene Department) นมส่งถึงประตูบ้านในอเมริกา มากกว่าครึ่งในปี 1954 และคนส่งนมถือ 19.3 เปอร์เซ็นต์ในปี 1971 Debenhams เปิดปี 1778 และวันที่ 15 พฤษภาคม 2021 ร้าน 124 แห่งสุดท้ายปิดพร้อมกัน (ผู้จัดการมรดกกิจการ, 2021) ห้างปิดทึบในสหรัฐ สร้างกว่า 1,500 แห่งระหว่างปี 1956 ถึง 2005 และยังเปิดประมาณ 1,150 แห่งในปี 2022 (Federal Reserve Bank of Richmond, Econ Focus, 2022) แผ่นสุดท้ายบอกว่าอาคารไป ความจำอยู่ และถามว่าที่ไหนในรายการนี้อยู่แค่ในความจำ คุณอยู่ที่ไหน และไปกับใคร ภาพของเขาไม่ได้ถูกคัดลอก ห้องสมุดนี้ไม่ได้มานับตึกแถวกรุงเทพฯ ด้วยวิธีนั้น",
  zh: "仅蓬·坎提（แป้ง-เพียงพร ขันตี，@shophouse.supply）画曼谷店屋，因为这种房子曾经兴旺，现在正因生活方式、生意和城市开发而改变。她请人一起想，这些排屋以后会怎样。她把店屋看成小生意的基础设施，把日常生活、本地经济和街上的活动连在一起。在新加坡，有系统的维护让这种房子继续留在城里，也引来游客、投资者和使用者；保护和升值同时改变用途、使用者和店铺种类。她先做功课，挑那些可能被整修、改变或再开发的地方，老店会消失，有的房子会被换掉。留下或消失，都会落到城市的身份、生活方式和当地生意上。账号开了以后，有人没有坐标，只靠画找到真房子。也有人遇见她画过的房子就来信，推荐别处的排屋，外国艺术家谈自己国家的店屋。其中很多人不是建筑师，这正是她开账号时要的。画可以把挡住立面的招牌和雨篷去掉，也逼人慢慢看。她希望行业以外的人抬头。曼谷店屋记下每个时期的生活和开发。不抬头，就只看见雨篷和招牌。\n\nAbhinav Bhardwaj（@abhinavbwj）在 “Did Jane Jacobs survive the data?” 里，用 1961 年 Jacobs 的四个条件，对照纽约 857,000 宗地和 98 条街、2007 到 2026 年的步行人数。居住密度是四个条件里最强的一项（r = 0.47）。四项都达到的街并不是最热闹的，从零项到四项也没有稳定的上升。加上地铁客流，解释力从 37% 升到 67%。计数点设在商业街上，所以这是相关，不是因果，安静的居住人行道没有被数进去。\n\n在 “Climate responsive Urbanism!” 里，同一位作者列出十条街道气候的做法。和这个馆相接的一句是：街的形状决定它的温度。高宽比更大的深街，白天更凉，夜里更暖。他印出 Oke 的中间路径，高宽比大约 0.4 到 0.6。遮阳改变人感到的热，远多于改变气温。东西向的街接太阳，转动路网就移动阴影。十条里没有一条能单独成立，一个区需要其中的大部分一起做。轮播里的街区平面是他的示意，不是真实地块。这个馆没有测量下面这些曼谷店屋街的高宽比。参考文献在最后一张。\n\n@avanidoesart 的漫画 “We need to talk about the basics now”，由 @urbanistcomix（Leewardists）发布，把一条女人走得了的街写成一组基本事。路灯是街上安不安全的最强迹象之一，也是最容易补上的一件。看得见，是不要高墙和死角，让住在楼上的人能看到下面的街。只有办公室、或只有住宅的街，总会有一段时间空掉。有地方可坐，它就还活着；店铺打烊以后，摊贩让街还有人、还有目光。灯亮过一次就没人管，预算里仍要有维护。女人已经知道哪一段没人照看。正式的巡查把这份知识变成反复进行的过程，结果交给能动手的市政部门。坡道、盲道和安全过街属于同一条街，车上和车站里也要有女人当班，警察和求助热线在帮助时不问她为什么出门，教育则把这些硬件看成一时的补丁。对这个馆，店屋就是这条街：很多户住在还开着的店上面，人行道才有人看着、走得了。让人住下来，才是安全。把房子冻住、不让下一户进来，不是。下面这些排屋的灯光、摊贩和过街，这里没有调查。\n\n@abhinavbwj 在 “Places that only exist in your memory now” 里，把十七个日常的地方按最盛的时候数一遍，再按今天数一遍。他按人们记得的样子来画，线条是淡下去的，并说后面每一张上的数字都对照过发布者。英国的公共电话亭：1992 年 92,000 个，BT 现在列出 10,338 个，其中近 2,000 个已经不能完全使用（Ofcom，2024；BT 付费电话统计，2026）。酒馆：1980 年 69,000 家，2024 年大约 45,000 家，大约走了三分之一（British Beer and Pub Association）。日本的游戏厅：1986 年警方统计 26,573 家，2024 年底 4,007 家（National Police Agency）。印度的公用电话点：2009 年 3 月 620 万个，到 2025 年 3 月大约 10,000 个，一台电话、一只计费表，放在店铺柜台上。英国的银行分行：2015 年 1 月以来关掉 6,896 家，是当时还开着的百分之七十（Which?，2026 年 9 月）。韩国的网吧，一代人学着一起玩的地方：2001 年 23,548 家，2024 年 7,243 家。Blockbuster：2004 年 9,094 家店，剩下一家，在俄勒冈州的 Bend，自 2019 年 3 月起是世界上的最后一家。印度的单厅电影院：1990 年大约 24,000 家，按一种计数，现在不到 6,000 家，大多数邮编里一家电影院也没有（Hemant Chaturvedi；EY 媒体与娱乐报告，2025）。Fotomat 的路边冲印小屋：1980 年代初在美国停车场里有 4,000 多间，现在一间不剩。美国的汽车影院：1958 年 4,063 家，2025 年还开着 280 家。英国的公共图书馆，一代人学会读书的那间屋子：2010 到 2019 年间关掉近 800 家，剩下 3,583 家。日本的公共澡堂，邻居在画着富士山的墙下并排洗澡：曾经 17,999 家，2026 年 4 月剩下 1,493 家（全国澡堂协会的数字，Tokyo Shoko Research 2026 年 6 月转述）。日本的保龄球馆：1972 年热潮最高时 3,697 家，2025 年底 621 家。香港的大排档：1956 年起不再发新牌，2005 年剩 28 家，2024 年剩 17 家（食物环境卫生署）。美国送上门的牛奶：1954 年超过一半送到门口，1971 年送奶人只送了百分之 19.3。Debenhams：1778 年开业，2021 年 5 月 15 日最后 124 家店同一天关上（清盘人，2021）。美国的封闭式商场：1956 到 2005 年间建了 1,500 多家，2022 年大约还有 1,150 家开着（Federal Reserve Bank of Richmond，Econ Focus，2022）。最后一张说，房子走了，记忆还在，并问这份名单上哪一处只活在你的记忆里，它在哪里，你当时和谁一起去。他的画没有被复制。这个馆没有用同样的办法去数下面这些曼谷排屋。",
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
    en: "How can a city house a large number of people and keep its core identity? A shophouse row is one answer. It is dense and mixed-use. It changes one bay at a time. A household and a livelihood share the lot. Each type below is a lesson in that density.\n\nThe question is Edward Glaeser's, in Triumph of the City (Penguin, 2011), and Reinhard Goethert's, in the incremental-housing work of MIT SIGUS. Freezing a neighbourhood so the next household cannot get in is middle-class NIMBYism. This library does not take that side.\n\nAbhinav Bhardwaj (@abhinavbwj) measured Jane Jacobs’s four 1961 conditions on 857,000 New York lots and 19 years of counts on 98 streets. Dwelling concentration was the strongest (r = 0.47). Streets that met all four were not the busiest. Subway ridership lifted the fit from 37% to 67%. The counters stand on shopping streets, so this is correlation, not a cause. The part that meets this library is the concentration: many households, and a shop, on narrow lots.\n\nThe same rows are a climate. In “Climate responsive Urbanism!” Bhardwaj writes that the shape of a street sets its temperature. A deeper row is cooler by day and warmer by night. Shade, including a shop awning, changes the heat a person feels more than the air. The height-to-width of these Bangkok streets is not measured here.\n\nThat density is also how a street stays walkable. A comic by @avanidoesart, posted by @urbanistcomix, says a street feels safer when the people living above can see it, when the ground floor stays occupied, and when the light is kept working. Housing many people over working shops is that safety. Keeping the next household out is not.",
    th: "เมืองหนึ่งจะให้คนอยู่ได้มาก และยังรักษาแก่นของตัวเองไว้ได้อย่างไร ตึกแถวเป็นคำตอบหนึ่ง หนาแน่น ใช้ปนกัน ปรับได้ทีละห้องแถว บ้านกับอาชีพอยู่บนที่ดินผืนเดียวกัน ประเภทด้านล่างคือบทเรียนของความหนาแน่นนั้น\n\nคำถามนี้มาจาก Edward Glaeser ใน Triumph of the City (Penguin, 2011) และจาก Reinhard Goethert ในงานที่อยู่อาศัยที่ปลูกเพิ่มทีละส่วนของ MIT SIGUS การแช่แข็งละแวกเพื่อไม่ให้ครัวเรือนใหม่เข้ามา คือการกีดกันแบบชนชั้นกลาง ห้องสมุดนี้ไม่เดินตามทางนั้น\n\nAbhinav Bhardwaj (@abhinavbwj) วัดเงื่อนไขสี่ข้อของ Jane Jacobs ปี 1961 บนล็อตนิวยอร์ก 857,000 ล็อต และจุดนับ 98 จุดตลอด 19 ปี ความหนาแน่นของที่อยู่อาศัยแรงที่สุด (r = 0.47) ถนนที่ครบสี่ข้อไม่ใช่ถนนที่คนเดินมากที่สุด ผู้โดยสารรถไฟใต้ดินยกกำลังอธิบายจาก 37% เป็น 67% จุดนับอยู่บนถนนการค้า จึงเป็นสหสัมพันธ์ ไม่ใช่เหตุ ส่วนที่ตรงกับห้องสมุดนี้คือความหนาแน่น หลายครัวเรือนและร้าน บนที่ดินผืนแคบ\n\nแถวเดียวกันนี้ก็เป็นภูมิอากาศ ใน “Climate responsive Urbanism!” Bhardwaj เขียนว่ารูปทรงของถนนกำหนดอุณหภูมิ แถวที่ลึกกว่าจะเย็นกว่าตอนกลางวันและอุ่นกว่าตอนกลางคืน ร่ม รวมถึงกันสาดหน้าร้าน เปลี่ยนความร้อนที่คนรู้สึกมากกว่าอุณหภูมิอากาศ อัตราส่วนความสูงต่อความกว้างของถนนกรุงเทพฯ เหล่านี้ยังไม่ได้วัดไว้ที่นี่\n\nความหนาแน่นนั้นเองทำให้ถนนเดินได้ การ์ตูนของ @avanidoesart ที่ @urbanistcomix โพสต์ บอกว่าถนนรู้สึกปลอดภัยกว่าเมื่อคนที่อยู่ข้างบนมองลงมาเห็น เมื่อชั้นล่างยังมีคนอยู่ และเมื่อไฟยังทำงาน การให้คนจำนวนมากอยู่เหนือร้านที่ยังเปิด คือความปลอดภัยนั้น การไม่ให้ครัวเรือนถัดไปเข้ามา ไม่ใช่",
    zh: "一座城市怎样住下很多人，又保住自己的核心？店屋排屋是一个答案。它密，商住混用，一开间一开间地改，同一块地上既是家也是生计。下面每一种，都是这种密度的一课。\n\n这个问题来自 Edward Glaeser 的 Triumph of the City（Penguin，2011），也来自 Reinhard Goethert 在 MIT SIGUS 的渐进式住房。把街坊冻住、不让下一户进来，是中产式的邻避。这个馆不走那条路。\n\nAbhinav Bhardwaj（@abhinavbwj）用 Jane Jacobs 1961 年的四个条件，对照纽约 857,000 宗地和 98 条街、19 年的人数。居住密度最强（r = 0.47）。四项都达到的街并不是最热闹的。地铁客流把解释力从 37% 抬到 67%。计数点在商业街上，所以这是相关，不是因果。和这个馆相接的是密度：很多户人家，加一间店，在窄地上。\n\n同一排房子也是气候。在 “Climate responsive Urbanism!” 里，Bhardwaj 写道，街的形状决定它的温度。更深的排屋白天更凉，夜里更暖。阴影，包括店面雨篷，改变人感到的热，多于改变气温。这些曼谷街道的高宽比，这里没有测量。\n\n这种密度也是一条街还走得了的原因。@avanidoesart 的漫画，由 @urbanistcomix 发布，说街上的人住在上面、看得见下面，底层还开着，灯也还亮着，街才更让人安心。让很多人住在还开着的店上面，才是这种安全。把下一户挡在外面，不是。",
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

// Social capital, in Non's framing. Hanifan's 1916 article is the first
// known use of the phrase. Jacobs carried it into the city argument; she
// did not invent it. Pages below were fetched on 15 October 2026.
export const SOCIAL_CAPITAL: {
  title: Trilingual;
  body: Trilingual;
  sources: TypologyCredit[];
  embed: TypologyEmbed;
} = {
  embed: { postUrl: PLACES_POST.post, imageIndex: PLACES_POST.imageIndex },
  title: {
    en: "Social capital",
    th: "ทุนทางสังคม",
    zh: "社会资本",
  },
  body: {
    en: "A shophouse row builds social capital. That is the trust and the familiarity of knowing your neighbours. It buys what money does not, including a kind of safety: eyes on the street. A camera cannot replace a person who knows the child, and who knows when the shop usually opens.\n\nThe phrase is not Jane Jacobs’s invention. L. J. Hanifan used it in 1916, for the goodwill, fellowship and social intercourse among the families of a place. That article is the first known use. Jacobs’s The Death and Life of Great American Cities (1961) is what carried the term into the city: neighbourhood networks as a city’s social capital, lost quickly and rebuilt only slowly. Robert Putnam’s Bowling Alone (2000) is the account of the decline, and the image is the bowling league. Pierre Bourdieu, in “The Forms of Capital” (1986), describes cultural capital as something that takes time. Money cannot hand it over in a moment.\n\n@abhinavbwj’s plate “Saturday at the bowling alley” counts the rooms, not the leagues: Japan had 3,697 bowling centres in 1972 and 621 at the end of 2025. The same carousel remembers a bath the whole street shared, the local on the corner, and a street kitchen. Read as an argument, Jacobs and Putnam both treat a life cut off from neighbours as a loss: she, in the street a project empties; he, in the league that no longer meets, people bowling alone. Isolation in the high-rise is that argument. This library does not treat it as settled. What remains is Glaeser’s question and Goethert’s: house a large number of people close together, and keep the life of the street. Freezing the buildings is not that.",
    th: "ตึกแถวสร้างทุนทางสังคม คือความไว้ใจและความคุ้นเคยที่เกิดจากการรู้จักเพื่อนบ้าน มันซื้อสิ่งที่เงินซื้อไม่ได้ รวมถึงความปลอดภัยแบบหนึ่ง คือสายตาบนถนน กล้องแทนคนที่รู้จักเด็ก และรู้จักว่าปกติร้านเปิดกี่โมง ไม่ได้\n\nคำนี้ไม่ใช่สิ่งที่ Jane Jacobs คิดขึ้น L. J. Hanifan ใช้ในปี 1916 สำหรับไมตรี จิตใจร่วม และการคบหากันของครอบครัวในที่แห่งหนึ่ง บทความนั้นเป็นการใช้ที่รู้จักกันครั้งแรก Jacobs ไม่ได้เป็นคนตั้งคำ หนังสือ The Death and Life of Great American Cities (1961) ของเธอคือสิ่งที่พาคำนี้เข้าสู่เรื่องเมือง เครือข่ายเพื่อนบ้านคือทุนทางสังคมของเมือง สูญได้เร็ว และค่อยๆ สร้างกลับได้เท่านั้น Robert Putnam ใน Bowling Alone (2000) เขียนถึงการลดลง และภาพของเขาคือลีกโบว์ลิ่ง Pierre Bourdieu ใน “The Forms of Capital” (1986) อธิบายทุนทางวัฒนธรรมว่าเป็นสิ่งที่ต้องใช้เวลา เงินส่งมอบให้ในพริบตาไม่ได้\n\nแผ่น “Saturday at the bowling alley” ของ @abhinavbwj นับห้อง ไม่ได้นับลีก ญี่ปุ่นมีศูนย์โบว์ลิ่ง 3,697 แห่งในปี 1972 และ 621 แห่งตอนสิ้นปี 2025 คารูเซลเดียวกันจำโรงอาบน้ำที่ทั้งถนนใช้ร่วมกัน ผับหัวมุม และครัวริมถนน ถ้าอ่านเป็นข้อถกเถียง Jacobs และ Putnam ต่างถือว่าชีวิตที่ขาดจากเพื่อนบ้านเป็นการสูญเสีย เธอพูดถึงถนนที่โครงการทำให้ว่าง เขาพูดถึงลีกที่เลิกประชุม และคนที่ไปโบว์ลิ่งคนเดียว ความโดดเดี่ยวในตึกสูงคือข้อถกเถียงนั้น ห้องสมุดนี้ไม่ถือว่ามันยุติแล้ว สิ่งที่ยังอยู่คือคำถามของ Glaeser และของ Goethert จะให้คนจำนวนมากอยู่ใกล้กัน และยังรักษาชีวิตของถนนไว้ได้อย่างไร การแช่แข็งอาคารไม่ใช่คำตอบนั้น",
    zh: "店屋排屋积累社会资本。那是认识邻居之后的信任和熟稔。它买到钱买不到的东西，其中一种是安全：街上有眼睛。摄像头代替不了认得孩子的人，也代替不了知道这家店平常几点开门的人。\n\n这个词不是 Jane Jacobs 造的。L. J. Hanifan 在 1916 年用它，指一个地方上各家之间的善意、情谊和往来。那是已知的第一次使用。Jacobs 没有发明它。她的 The Death and Life of Great American Cities（1961）把这个词带进了城市的争论：邻里网络是一座城市的社会资本，失去得快，再积起来很慢。Robert Putnam 的 Bowling Alone（2000）写的是这种资本的下降，他的图像是保龄球联盟。Pierre Bourdieu 在 “The Forms of Capital”（1986）里写文化资本：它要时间，钱不能在一瞬间交到手里。\n\n@abhinavbwj 的 “Saturday at the bowling alley” 数的是场地，不是联盟。日本 1972 年有 3,697 家保龄球馆，2025 年底剩下 621 家。同一组图也记得整条街共用的澡堂、街角的酒馆，和街头的厨房。当作论点来读，Jacobs 和 Putnam 都把与邻居隔开的生活看成一种损失：她说的是被项目腾空的街，他说的是不再聚会的联盟，人们一个人去打保龄球。高层里的隔绝，是这个论点。这个馆不把它当成已经定案的事实。留下来的仍是 Glaeser 和 Goethert 的问题：让很多人住得很近，同时保住街上的生活。把房子冻住，不是这个答案。",
  },
  sources: [
    {
      title: "The Rural School Community Center",
      url: "https://archive.org/details/jstor-1013498",
      credit:
        "L. J. Hanifan, “The Rural School Community Center,” The Annals of the American Academy of Political and Social Science 67 (September 1916), pp. 130–138. Internet Archive copy fetched on 15 October 2026. He uses social capital for goodwill, fellowship, mutual sympathy and social intercourse among the families of a place. This is the first known use of the phrase. Jacobs did not invent it.",
    },
    {
      title: "The Death and Life of Great American Cities",
      url: "https://www.penguinrandomhouse.com/books/86058/the-death-and-life-of-great-american-cities-by-jane-jacobs/",
      credit:
        "Jane Jacobs, The Death and Life of Great American Cities (Random House, 1961). The Penguin Random House page for the Vintage edition was fetched on 15 October 2026 and names 1961. The book carried the term into the argument about streets. It is not the first use.",
    },
    {
      title: "Bowling Alone",
      url: "https://archive.org/details/bowlingalonecoll00putn",
      credit:
        "Robert D. Putnam, Bowling Alone: The Collapse and Revival of American Community (Simon & Schuster, 2000). Internet Archive record fetched on 15 October 2026. His account of the decline pictures the bowling league that no longer meets, so that people bowl alone.",
    },
    {
      title: "The Forms of Capital",
      url: "https://www.marxists.org/reference/subject/philosophy/works/fr/bourdieu-forms-capital.htm",
      credit:
        "Pierre Bourdieu, “The Forms of Capital,” in John G. Richardson, ed., Handbook of Theory and Research for the Sociology of Education (Greenwood, 1986), pp. 241–258. English text of 1986, translated by Richard Nice, from the German essay of 1983. The page was fetched on 15 October 2026. Cultural capital, in that essay, takes time to embody. Money cannot hand it over in a moment.",
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
      en: "The type Non grew up in. Pheangporn Khanti’s sheet in the 5 October 2026 post is titled for Lat Phrao Road: a low two-storey row, brick, arched upper windows, windows in pairs, columns at the shop. The lesson is ordinary density. A household and a shop share the lot, and people have found her buildings from the drawing alone, because she publishes no coordinates. The decade, the district and any map point stay open. A two-storey row is the shallower street in Bhardwaj’s climate account: less shade at noon, more sky to lose heat at night. That ratio is not measured here. The household above the shop is also the line of sight in the comic by @avanidoesart, posted by @urbanistcomix: residents who can see the street, and a ground floor that does not empty. The lighting on this road is not surveyed here.",
      th: "ประเภทที่นนโตมา ภาพของเพียงพร ขันตีในโพสต์วันที่ 5 ตุลาคม 2026 ตั้งชื่อว่าถนนลาดพร้าว เป็นตึกเตี้ยสองชั้น ก่ออิฐ หน้าต่างชั้นบนโค้ง หน้าต่างจับคู่ และมีเสาหน้าร้าน บทเรียนคือความหนาแน่นธรรมดา บ้านกับร้านอยู่บนที่ดินผืนเดียวกัน และมีคนตามภาพไปเจอตึกจริงเพราะเธอไม่ลงพิกัด ทศวรรษ เขต และจุดบนแผนที่ยังเปิดไว้ ตึกสองชั้นคือถนนที่ตื้นกว่าในบันทึกภูมิอากาศของ Bhardwaj ร่มน้อยตอนเที่ยง และมีท้องฟ้าให้คลายร้อนตอนกลางคืนมากกว่า อัตราส่วนนี้ยังไม่ได้วัด ครัวเรือนเหนือร้านยังเป็นเส้นสายตาในการ์ตูนของ @avanidoesart ที่ @urbanistcomix โพสต์ คนอยู่ข้างบนมองเห็นถนน และชั้นล่างไม่ว่าง แสงไฟบนถนนนี้ยังไม่ได้สำรวจ",
      zh: "这是 Non 长大时住的那种。仅蓬·坎提在 2026年10月5日那条帖子里的一张图，标题写着拉抛路：低矮的两层，砖墙，上层拱窗，窗子成对，店面有列柱。这一课是普通的密度。一户人家和一间店在同一块地上，而且有人只靠画就找到房子，因为她不公布坐标。具体年代、区和地图上的点都先空着。两层的排屋，在 Bhardwaj 的气候笔记里是较浅的街：中午阴影少，夜里有更多天空把热散掉。这个比例这里没有测量。店上面的那一户，也是 @avanidoesart 的漫画、由 @urbanistcomix 发布的那条视线：住在上面的人看得见街，底层不会空掉。这条路的灯光这里没有调查。",
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
      en: "Pheangporn Khanti’s sheet is titled ถนนบรรทัดทอง, Banthat Thong Road: thin vertical fins, flower-box balconies, a folding steel door, four to five storeys. The lesson is height as density. More dwellings on the same shop front, which is the concentration Abhinav Bhardwaj measured as the strongest of Jacobs’s four conditions, and the ground floor still opens onto the sidewalk. She draws rows she expects to be renovated or replaced, signs and awnings left out so the front can be read. On his climate slides, that same height deepens the street: cooler by day, warmer by night, with Oke’s middle path printed as a height-to-width ratio of about 0.4 to 0.6. This row’s ratio is not measured here. The extra storeys are also more households looking down to the sidewalk, the visibility @avanidoesart’s comic, posted by @urbanistcomix, asks for. The lighting is not surveyed here.",
      th: "ภาพของเพียงพร ขันตีตั้งชื่อถนนบรรทัดทอง ครีบตั้ง ระเบียงกระถาง ประตูเหล็กพับ สี่ถึงห้าชั้น บทเรียนคือความสูงในฐานะความหนาแน่น ที่อยู่มากขึ้นบนหน้าร้านเดิม ซึ่งคือความหนาแน่นที่ Abhinav Bhardwaj วัดได้ว่าแรงที่สุดในสี่เงื่อนไขของ Jacobs และชั้นล่างยังเปิดสู่ทางเท้า เธอเลือกแถวที่คาดว่าจะถูกปรับปรุงหรือแทนที่ และตัดป้ายกับกันสาดออกเพื่อให้อ่านหน้าอาคารได้ บนภาพภูมิอากาศของเขา ความสูงเดียวกันนี้ทำให้ถนนลึกขึ้น เย็นกว่าตอนกลางวัน อุ่นกว่าตอนกลางคืน และทางสายกลางของ Oke ที่เขาพิมพ์ไว้คืออัตราส่วนความสูงต่อความกว้างประมาณ 0.4 ถึง 0.6 อัตราส่วนของแถวนี้ยังไม่ได้วัด ชั้นที่เพิ่มขึ้นคือครัวเรือนที่มองลงมาที่ทางเท้ามากขึ้น ซึ่งคือการมองเห็นที่การ์ตูนของ @avanidoesart ที่ @urbanistcomix โพสต์ขอไว้ แสงไฟยังไม่ได้สำรวจ",
      zh: "仅蓬·坎提的这张图标题是班塔通路：竖向肋片，花箱阳台，折叠钢门，四到五层。这一课是用高度做密度。同一间店面上住下更多的人，这也是 Abhinav Bhardwaj 量到的、Jacobs 四个条件里最强的那种集中，底层仍然开向人行道。她挑可能被整修或替换的排屋来画，并去掉招牌和雨篷，好让立面可读。在他的气候图里，同样的高度把街变深：白天更凉，夜里更暖。他印出的 Oke 中间路径是高宽比大约 0.4 到 0.6。这一排的比例这里没有测量。多出来的层，也是更多户人家看着人行道，就是 @avanidoesart 的漫画、由 @urbanistcomix 发布所要的可见性。灯光这里没有调查。",
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
      en: "Pheangporn Khanti’s sheet is titled ย่านพระราม 4, the Rama IV area: two to three storeys, arched upper windows, columns on the front. The lesson is adaptability. The columned shop can change trade while the household above stays, which is how a row keeps a livelihood instead of being frozen as a specimen. One bay can take a new shop without asking the whole row to become something else. Outside Manhattan, Bhardwaj found land-use mix did add people once density and transit were held equal (+21% per standard deviation, p = 0.03). The mix here is the shop and the house on one lot. @avanidoesart, posted by @urbanistcomix, reads a working ground floor as safety: a street of only one use empties, and a shop that stays open keeps the sidewalk watched. The lighting and any vendors on this stretch are not surveyed here.",
      th: "ภาพของเพียงพร ขันตีตั้งชื่อย่านพระราม 4 สองถึงสามชั้น หน้าต่างชั้นบนโค้ง มีเสาด้านหน้า บทเรียนคือการปรับได้ ร้านที่มีเสาเปลี่ยนอาชีพได้ บ้านข้างบนยังอยู่ คือวิธีที่แถวยังมีอาชีพแทนที่จะถูกแช่แข็งเป็นตัวอย่าง ห้องแถวหนึ่งรับร้านใหม่ได้โดยไม่ต้องให้ทั้งแถวกลายเป็นอย่างอื่น นอกแมนฮัตตัน Bhardwaj พบว่าส่วนผสมการใช้ที่ดินเพิ่มคนเดินเมื่อคุมความหนาแน่นและระบบขนส่งไว้เท่ากัน (+21% ต่อหนึ่งส่วนเบี่ยงเบนมาตรฐาน, p = 0.03) ส่วนผสมที่นี่คือร้านกับบ้านบนที่ดินผืนเดียว @avanidoesart ที่ @urbanistcomix โพสต์ อ่านชั้นล่างที่ยังทำงานว่าเป็นความปลอดภัย ถนนที่มีการใช้แบบเดียวจะว่างลง และร้านที่ยังเปิดทำให้ทางเท้ามีคนมอง แสงไฟและแผงลอยบนช่วงนี้ยังไม่ได้สำรวจ",
      zh: "仅蓬·坎提的这张图标题是拉玛四世路一带：两到三层，上层拱窗，立面有列柱。这一课是适应。有列柱的店铺可以换营生，楼上的家还在。排屋靠这个继续过日子，而不是被冻成标本。一开间可以换一家店，不必让整排变成别的东西。在曼哈顿以外，Bhardwaj 发现在密度和交通持平之后，土地用途的混合确实增加了人（每标准差 +21%，p = 0.03）。这里的混合，就是同一块地上的店和家。@avanidoesart 的漫画，由 @urbanistcomix 发布，把还在营业的底层读成安全：只有一种用途的街会空掉，店还开着，人行道才有人看着。这一段的灯光和摊贩，这里没有调查。",
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
      en: "A low two-storey row in brick, with windows set in pairs, one of the three families on the cover. The lesson is the smallest complete unit. A shop and rooms on one lot, repaired one bay at a time, is already density: mixed-use, incremental, and able to grow taller later. Bhardwaj found no steady climb from meeting none of Jacobs’s conditions to meeting all four, so a complete small unit beats a frozen checklist. The street on this cover sheet was not clear enough to file. @avanidoesart, posted by @urbanistcomix, would call the shop-and-rooms bay the smallest street that does not empty: someone lives over the shop, so the front stays watched. The light and the crossing are not surveyed here.",
      th: "ตึกเตี้ยสองชั้น ก่ออิฐ หน้าต่างจับเป็นคู่ เป็นหนึ่งในสามตระกูลบนหน้าปก บทเรียนคือหน่วยที่เล็กที่สุดที่ยังครบ ร้านกับห้องบนที่ดินผืนเดียว ซ่อมได้ทีละห้องแถว คือความหนาแน่นอยู่แล้ว ใช้ปนกัน ปลูกเพิ่มได้ และพร้อมจะสูงขึ้นภายหลัง Bhardwaj พบว่าไม่มีลำดับเพิ่มจากการไม่เข้าเงื่อนไขเลยไปจนครบสี่ข้อของ Jacobs ดังนั้นหน่วยเล็กที่ครบจึงสำคัญกว่าบัญชีที่ถูกแช่แข็ง ชื่อถนนบนหน้าปกนี้ยังอ่านได้ไม่ชัดพอจะลงบันทึก @avanidoesart ที่ @urbanistcomix โพสต์ จะเรียกห้องแถวที่มีร้านและห้องว่าเป็นถนนที่เล็กที่สุดที่ไม่ว่าง มีคนอยู่เหนือร้าน ด้านหน้าจึงมีคนมอง ไฟและทางข้ามยังไม่ได้สำรวจ",
      zh: "低矮的两层砖楼，窗子成对，是封面上的三种之一。这一课是最小而仍然完整的一户。一块地上有店有房间，可以一开间一开间地修，这已经是密度：商住混用，可以逐步加建，以后还能再长高。Bhardwaj 发现，从 Jacobs 的条件一条都不达到四条都达到，并没有稳定的上升，所以一个完整的小单元比一份被冻住的清单有用。这张封面上的街名还不够清楚，先不登记。@avanidoesart 的漫画，由 @urbanistcomix 发布，会把这一开间店加房间看成最小的、不会空掉的街：有人住在店上面，门面才有人看着。灯和过街，这里没有调查。",
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
      en: "Pheangporn Khanti’s sheet is titled ย่านประตูน้ำ, Pratunam: a four- to five-storey row with a ground-floor awning and shopfronts. The lesson is density with a livelihood that stays visible. She says that if you never look up, the awning and the sign are all you see, so the drawing leaves them out and the building can be read. The awning is still part of how the shop meets the street. On his climate slides, shade changes the heat a person feels more than the air temperature, which is the awning’s other job while it hides the floors above. The decade, the district and any map point stay open. She publishes no coordinates. The shopfront is the watched edge in the comic by @avanidoesart, posted by @urbanistcomix: people above, and a ground floor that meets the sidewalk. The lighting here is not surveyed.",
      th: "ภาพของเพียงพร ขันตีตั้งชื่อย่านประตูน้ำ เป็นตึกสี่ถึงห้าชั้น มีกันสาดชั้นล่างและหน้าร้าน บทเรียนคืออาชีพที่ยังมองเห็น เธอบอกว่าถ้าไม่เงยหน้า จะเห็นแต่กันสาดกับป้าย ภาพวาดจึงตัดสิ่งที่บังออกเพื่อให้อ่านอาคารได้ แต่กันสาดก็ยังเป็นวิธีที่ร้านเจอถนน บนภาพภูมิอากาศของเขา ร่มเปลี่ยนความร้อนที่คนรู้สึกมากกว่าอุณหภูมิอากาศ ซึ่งเป็นอีกหน้าที่ของกันสาดขณะที่มันบังชั้นบน ทศวรรษ เขต และจุดบนแผนที่ยังเปิดไว้ เธอไม่ลงพิกัด หน้าร้านคือขอบที่ถูกมองในการ์ตูนของ @avanidoesart ที่ @urbanistcomix โพสต์ คนอยู่ข้างบน และชั้นล่างจรดทางเท้า แสงไฟที่นี่ยังไม่ได้สำรวจ",
      zh: "仅蓬·坎提的这张图标题是水门一带：四到五层，底层有雨篷和店面。这一课是生计还看得见。她说不抬头就只看见雨篷和招牌，所以画把挡住的东西去掉，房子才读得出来。雨篷仍然是店铺接到街上的方式。在他的气候图里，遮阳改变人感到的热，多于改变气温。雨篷挡住楼上的时候，也在做这件事。具体年代、区和地图上的点都先空着。她不公布坐标。店面是 @avanidoesart 的漫画、由 @urbanistcomix 发布里被看着的那一边：上面有人住，底层接到人行道。这里的灯光没有调查。",
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
