// Real, currently-operating Bangkok venues — one hand-curated set per
// heritage quarter, each tagged to a "side quest" theme (eat, sit still,
// explore, make something, talk to a stranger). Every entry was verified by
// live web search before being written here — not recalled from training
// data, since Bangkok's cafe/bar scene turns over fast and a stale
// recommendation is worse than none. A few themes are genuinely unfilled
// for a given quarter rather than padded with a weak pick; that's
// deliberate, matching the register's own honesty rule.
//
// EN and TH copy live together per entry (not routed through the
// AREA_TH/WALK_TH translation-key system) since this content is
// self-contained and outside the register's own translation-coverage test.

export type QuestTheme = "eat" | "mindful" | "explore" | "create" | "connect";

export type QuestSpot = {
  name: string;
  thai: string;
  theme: QuestTheme;
  note: string;
  noteTh: string;
  address: string;
};

export const QUEST_THEME_LABEL: Record<QuestTheme, { en: string; th: string; icon: string }> = {
  eat: { en: "Eat", th: "กิน", icon: "🍜" },
  mindful: { en: "Sit still", th: "ใคร่ครวญ", icon: "🙏" },
  explore: { en: "Explore", th: "สำรวจ", icon: "🧭" },
  create: { en: "Make something", th: "สร้างสรรค์", icon: "✋" },
  connect: { en: "Talk to someone", th: "พบปะ", icon: "💬" },
};

export const QUEST_SPOTS: Record<string, QuestSpot[]> = {
  rattanakosin: [
    {
      name: "Tang Heng Kee",
      thai: "ตั้งเฮงกี่",
      theme: "eat",
      note: "A family-run Thai-Chinese kitchen a few minutes from Wat Pho, feeding this block since long before the tour buses found it. Order the fried chicken and finish with coconut ice cream.",
      noteTh: "ร้านอาหารไทย-จีนของครอบครัวใกล้วัดโพธิ์ เปิดมาก่อนที่รถทัวร์นักท่องเที่ยวจะรู้จักที่นี่เสียอีก สั่งไก่ทอดแล้วปิดท้ายด้วยไอศกรีมกะทิ",
      address: "302 Maha Rat Road, Phra Nakhon",
    },
    {
      name: "Wat Mahathat — International Buddhist Meditation Center",
      thai: "วัดมหาธาตุ · ศูนย์วิปัสสนานานาชาติ",
      theme: "mindful",
      note: "Section 5 of Wat Mahathat has taught walk-in meditation in English since the 1960s. You don't need to book a course — sit in on a session and see what a working meditation hall actually feels like.",
      noteTh: "คณะ 5 ของวัดมหาธาตุสอนวิปัสสนาเป็นภาษาอังกฤษมาตั้งแต่ทศวรรษ 1960 ไม่ต้องจองล่วงหน้า เดินเข้าไปนั่งฟังได้เลยว่าศาลาปฏิบัติธรรมจริง ๆ รู้สึกอย่างไร",
      address: "Wat Mahathat, Maha Rat Road, Phra Nakhon",
    },
    {
      name: "Tha Phra Chan Amulet Market",
      thai: "ตลาดพระเครื่องท่าพระจันทร์",
      theme: "explore",
      note: "A working trade market, not a souvenir stall — monks, taxi drivers and serious collectors arguing over lineage and blessing provenance on small folding tables. Busiest noon to 4pm.",
      noteTh: "ตลาดค้าขายจริง ไม่ใช่แผงขายของที่ระลึก พระ คนขับแท็กซี่ และนักสะสมตัวจริงมานั่งถกเถียงเรื่องสายพระและความศักดิ์สิทธิ์บนโต๊ะพับเล็ก ๆ คนเยอะสุดช่วงเที่ยงถึงบ่ายสี่",
      address: "Maha Rat Road / Phra Chan Road, by Tha Phra Chan pier",
    },
    {
      name: "Rub Aroon Cafe",
      thai: "รับอรุณ",
      theme: "connect",
      note: "A converted teak-house herbal dispensary near Wat Pho, sidewalk seating under one parasol that puts you shoulder to shoulder with whoever else is having breakfast that morning.",
      noteTh: "ร้านขายยาสมุนไพรเรือนไม้สักเก่าที่แปลงเป็นคาเฟ่ ใกล้วัดโพธิ์ โต๊ะริมทางใต้ร่มเดียวที่นั่งชิดกับใครก็ตามที่มากินมื้อเช้าเช้าวันนั้น",
      address: "310–312 Maharaj Road, Phra Nakhon",
    },
  ],
  "kudi-chin": [
    {
      name: "Thanusingha Bakery House",
      thai: "ธนูสิงห์ ขนมฝรั่งกุฎีจีน",
      theme: "eat",
      note: "One of three families left in Bangkok still baking khanom farang kudi chin — duck-egg cake with raisins and candied winter melon, a recipe carried from the original 1770s Portuguese settlers. Sells out by late morning.",
      noteTh: "หนึ่งในสามครอบครัวสุดท้ายในกรุงเทพฯ ที่ยังทำขนมฝรั่งกุฎีจีน — เค้กไข่เป็ดใส่ลูกเกดและฟักเชื่อม สูตรตกทอดจากชาวโปรตุเกสที่มาตั้งรกรากตั้งแต่ปี 1770 ของหมดเร็วก่อนสาย",
      address: "235–237 Soi Kudichin 7, Thonburi",
    },
    {
      name: "Kian Un Keng Shrine",
      thai: "ศาลเจ้าเกียนอันเกง",
      theme: "mindful",
      note: "The oldest Hokkien joss house in Bangkok, older than the Chakri dynasty, with a rare seated Guanyin. It draws almost no tour groups — genuinely quiet, even on a Sunday.",
      noteTh: "ศาลเจ้าฮกเกี้ยนที่เก่าแก่ที่สุดในกรุงเทพฯ เก่ากว่าราชวงศ์จักรีเสียอีก มีเจ้าแม่กวนอิมปางประทับนั่งซึ่งพบไม่บ่อย แทบไม่มีทัวร์มาเยือน เงียบสงบจริง ๆ แม้แต่วันอาทิตย์",
      address: "Soi Thetsaban Sai 1, Wat Kalaya, Thonburi",
    },
    {
      name: "Khao Mor, Wat Prayurawongsawat",
      thai: "เขามอ วัดประยุรวงศาวาส",
      theme: "explore",
      note: "An artificial rock mountain built in 1828 as a miniature Mount Meru, ringed by a turtle pond. A working temple garden — locals feed the turtles, few visitors make it this far along the river walk.",
      noteTh: "ภูเขาจำลองที่สร้างขึ้นในปี 1828 เปรียบดังเขาพระสุเมรุ ล้อมรอบด้วยสระเต่า เป็นสวนวัดที่ยังใช้งานจริง คนแถวนี้มาให้อาหารเต่า นักท่องเที่ยวน้อยรายที่เดินมาไกลถึงตรงนี้",
      address: "Wat Prayurawongsawat, near Memorial Bridge, Thonburi",
    },
    {
      name: "Aunty Noi's Piggy Bank House",
      thai: "บ้านป้าน้อย ตุ๊กตาปั้นหมูออมสิน",
      theme: "create",
      note: "A century-old family workshop making the papier-mâché pig banks tied to a Wat Prayun legend. Painting a pre-made one is a same-visit activity — the family will sit with you while you do it.",
      noteTh: "โรงงานครอบครัวอายุร้อยปีที่ปั้นกระปุกหมูกระดาษตามตำนานวัดประยุรฯ มาระบายสีกระปุกที่ปั้นไว้แล้วได้เลยในวันเดียว ครอบครัวจะนั่งเป็นเพื่อนคุณระหว่างทำ",
      address: "24 Prajadhipok Road, Wat Kalaya, Thonburi",
    },
    {
      name: "CAF Kudeejeen Cafe River Walk View",
      thai: "คาเฟ่กุฎีจีน ริเวอร์วอล์ค",
      theme: "connect",
      note: "A community-run riverside cafe, weekends only — which is exactly when neighborhood families and visitors end up sharing the same outdoor tables on the Chao Phraya.",
      noteTh: "คาเฟ่ริมแม่น้ำที่ชุมชนดูแลกันเอง เปิดเฉพาะเสาร์-อาทิตย์ ซึ่งเป็นช่วงที่ครอบครัวในย่านกับนักท่องเที่ยวมักได้นั่งโต๊ะเดียวกันริมเจ้าพระยา",
      address: "Soi Kudi Chin, Wat Kalaya, Thonburi",
    },
  ],
  "talad-noi": [
    {
      name: "Mother Roaster",
      thai: "มาเธอ โรสเตอร์",
      theme: "eat",
      note: "Climb the narrow staircase above a working mechanic's junkyard and you land in a proper hand-drip coffee bar — a grandmother roasting and pouring herself, not a themed cafe.",
      noteTh: "เดินขึ้นบันไดแคบเหนือโรงเก็บของเก่าที่ยังใช้งานจริง จะเจอร้านกาแฟดริปมือฝีมือคุณยาย ไม่ใช่คาเฟ่ตกแต่งตามธีม",
      address: "1172 Soi Charoen Krung 22, Talad Noi",
    },
    {
      name: "Chow Sue Kong Shrine",
      thai: "ศาลเจ้าโจวซือกง",
      theme: "mindful",
      note: "A Hokkien shrine from 1804, still facing the river the way it did when boats were the only way in. It has its own pier — sit on the steps on a quiet weekday afternoon.",
      noteTh: "ศาลเจ้าฮกเกี้ยนตั้งแต่ปี 1804 ยังคงหันหน้าออกแม่น้ำเช่นเดียวกับสมัยที่เรือคือทางเข้าออกทางเดียว มีท่าน้ำของตัวเอง นั่งบนขั้นบันไดในบ่ายวันธรรมดาเงียบ ๆ ได้เลย",
      address: "Off Soi Charoen Krung 22, Talad Noi, on the riverbank",
    },
    {
      name: "Talad Noi Street Art",
      thai: "ภาพศิลปะข้างถนน ตลาดน้อย",
      theme: "explore",
      note: "The mural cluster that grew out of the 2016 Bukruk Urban Arts Festival, scattered through the same alley as the junkyard and the coffee shop above it. Wander it slowly rather than photographing and leaving.",
      noteTh: "กลุ่มภาพวาดข้างถนนที่เกิดขึ้นหลังเทศกาล Bukruk Urban Arts ปี 2016 กระจายอยู่ในตรอกเดียวกับโรงเก็บของเก่าและร้านกาแฟชั้นบน เดินชมช้า ๆ ดีกว่าถ่ายรูปแล้วเดินจากไป",
      address: "Soi Charoen Krung 22, Talad Noi",
    },
    {
      name: "Charm-Learn Studio",
      thai: "ชาร์ม เลิร์น สตูดิโอ",
      theme: "create",
      note: "A short ferry hop across the river in Khlong San — a working ceramics studio run by three Silpakorn design graduates. A three-day hand-building course, or just a coffee in the studio's own cafe.",
      noteTh: "นั่งเรือข้ามฟากไปฝั่งคลองสานไม่ไกล เป็นสตูดิโอเซรามิกที่บัณฑิตศิลปากรสามคนเปิดเอง มีคอร์สปั้นมือสามวัน หรือแค่แวะจิบกาแฟในคาเฟ่ของสตูดิโอก็ได้",
      address: "647 Charoen Rat Road, Khlong San",
    },
    {
      name: "Blacksmith Cafe",
      thai: "แบล็คสมิธ คาเฟ่",
      theme: "connect",
      note: "Seven seats, run by the daughter of a mechanic who used to forge cart parts a few doors down. Small enough that talking to whoever's behind the counter isn't optional.",
      noteTh: "ที่นั่งเจ็ดตัว เปิดโดยลูกสาวของช่างที่เคยตีชิ้นส่วนรถเข็นอยู่ไม่กี่ห้องถัดไป เล็กจนแทบเลี่ยงไม่ได้ที่จะคุยกับคนที่อยู่หลังเคาน์เตอร์",
      address: "1226 Soi Wanit 2, Talad Noi",
    },
  ],
  songwad: [
    {
      name: "Lim Lao Sa Fish Ball Noodle",
      thai: "ลิ้มเล่าซา",
      theme: "eat",
      note: "An old-school pushcart noodle shop on Song Wat Road itself — flat egg noodles, handmade fish balls, vinegar-soy seasoning, fried garlic on top. No frills, decades of practice.",
      noteTh: "ร้านก๋วยเตี๋ยวเข็นแบบดั้งเดิมบนถนนทรงวาด บะหมี่แผ่น ลูกชิ้นปลาทำเอง ปรุงด้วยน้ำส้มสายชูโรยกระเทียมเจียว ไม่มีอะไรหวือหวา มีแค่ฝีมือหลายสิบปี",
      address: "Song Wat Road, Samphanthawong",
    },
    {
      name: "Lao Pun Tao Kong Shrine",
      thai: "ศาลเจ้าเล่าปุนเถ้ากง",
      theme: "mindful",
      note: "A Taoist shrine from around 1824, founded by the Teochew traders who first landed at the Song Wat pier. Quiet even when the street outside is busy.",
      noteTh: "ศาลเจ้าเต๋าตั้งแต่ราวปี 1824 ก่อตั้งโดยพ่อค้าแต้จิ๋วที่ขึ้นฝั่งที่ท่าเรือทรงวาดเป็นกลุ่มแรก เงียบสงบแม้ถนนด้านนอกจะพลุกพล่าน",
      address: "833 Song Wat Road, Samphanthawong",
    },
    {
      name: "PLAY Art House",
      thai: "เพลย์ อาร์ต เฮาส์",
      theme: "explore",
      note: "A free gallery inside a converted century-old warehouse, rotating shows by Thai and international artists. A real working exhibition space — check what's actually hanging before you go.",
      noteTh: "แกลเลอรีเข้าฟรีในโกดังเก่าอายุร้อยปีที่ปรับปรุงใหม่ หมุนเวียนงานศิลปินไทยและต่างชาติ เป็นพื้นที่จัดแสดงจริง ไม่ใช่แค่ฉากถ่ายรูป เช็คก่อนไปว่ากำลังโชว์งานอะไร",
      address: "993 Song Wat Road, Samphanthawong",
    },
    {
      name: "Clay Circle Songwat",
      thai: "เคลย์ เซอร์เคิล ทรงวาด",
      theme: "create",
      note: "A pottery studio and ceramics shop in a multi-storey historic building — wheel-throwing and hand-building classes for beginners, plus cups and bowls made on site to buy.",
      noteTh: "สตูดิโอปั้นเซรามิกในตึกเก่าหลายชั้น มีคลาสปั้นบนแป้นหมุนและปั้นมือสำหรับมือใหม่ พร้อมถ้วยชามที่ทำในสตูดิโอวางขายด้วย",
      address: "Song Wat Road, Samphanthawong",
    },
    {
      name: "Song Wat Coffee Roasters",
      thai: "ทรงวาด คอฟฟี่ โรสเตอร์",
      theme: "connect",
      note: "A small roastery in a renovated shophouse down a side lane — shared wooden tables, tight seating that puts you next to whoever else is there. Don't expect to linger solo.",
      noteTh: "โรงคั่วกาแฟเล็ก ๆ ในตึกแถวที่ปรับปรุงใหม่ในตรอกข้างถนน โต๊ะไม้ที่นั่งร่วมกัน ที่นั่งแคบจนต้องนั่งใกล้คนอื่น อย่าคาดหวังว่าจะได้นั่งคนเดียวเงียบ ๆ",
      address: "Rong Khom Lane, off Song Wat Road",
    },
  ],
  "yaowarat-sampheng": [
    {
      name: "Nai Ek Roll Noodle",
      thai: "ก๋วยจั๊บนายเอ็ก",
      theme: "eat",
      note: "Guay jub with crispy pork belly and offal, running since the 1960s and a Michelin Bib Gourmand since 2018. The peppery broth is the whole point — don't order it mild.",
      noteTh: "ก๋วยจั๊บใส่หมูกรอบและเครื่องใน เปิดมาตั้งแต่ทศวรรษ 1960 ได้ Bib Gourmand จากมิชลินตั้งแต่ปี 2018 น้ำซุปรสเผ็ดพริกไทยคือหัวใจของร้าน อย่าสั่งแบบอ่อนรส",
      address: "442 Yaowarat Road, next to Soi 9",
    },
    {
      name: "Leng Buai Ia Shrine",
      thai: "ศาลเจ้าเล่งบัวเอี๊ยะ",
      theme: "mindful",
      note: "The oldest Chinese shrine in Thailand, older than Bangkok itself. Tucked in a courtyard off a side soi — empty and quiet outside festival days, unlike the tour-bus crowds at Wat Traimit.",
      noteTh: "ศาลเจ้าจีนที่เก่าแก่ที่สุดในประเทศไทย เก่ากว่ากรุงเทพฯ เสียอีก ซ่อนอยู่ในลานด้านในซอย เงียบสงบนอกเทศกาล ต่างจากฝูงทัวร์ที่วัดไตรมิตร",
      address: "Off Yaowarat Soi 6, inside Talat Kao",
    },
    {
      name: "Talat Kao (Old Market)",
      thai: "ตลาดเก่า ซอยอิสรานุภาพ",
      theme: "explore",
      note: "A 200-year-old wet market running fresh meat, fish, and Chinese herbs since before Yaowarat Road existed. Grittier and more local than the fabric-and-button stalls. Shut by lunch, so go early.",
      noteTh: "ตลาดสดอายุ 200 ปี ขายเนื้อสด ปลา และสมุนไพรจีน มีมาก่อนถนนเยาวราชเสียอีก ดิบและเป็นของคนท้องถิ่นมากกว่าแผงผ้าและกระดุม ปิดตอนเที่ยง ควรไปแต่เช้า",
      address: "Soi Issaranuphap, Yaowarat",
    },
    {
      name: "Clay Circle BKK",
      thai: "เคลย์ เซอร์เคิล บีเคเค",
      theme: "create",
      note: "Wheel-throwing and hand-building pottery classes a few minutes from MRT Sam Yan — not in Chinatown proper, but close enough to fold into the same afternoon.",
      noteTh: "คลาสปั้นเซรามิกทั้งแบบแป้นหมุนและปั้นมือ อยู่ใกล้ MRT สามย่าน ไม่ได้อยู่ในย่านเยาวราชเป๊ะ ๆ แต่ใกล้พอจะไปต่อในบ่ายวันเดียวกันได้",
      address: "Soi Chula 7, Wang Mai, Pathum Wan",
    },
    {
      name: "Tang To Kang Gold Shop",
      thai: "ห้างทองตั้งโต๊ะกัง",
      theme: "connect",
      note: "Founded 1875 by a goldsmith from Fujian, still run by the same family five generations on. The only gold shop in Thailand granted the royal Garuda emblem — the family runs a small museum and talks history with anyone who asks.",
      noteTh: "ก่อตั้งปี 1875 โดยช่างทองจากมณฑลฝูเจี้ยน ยังคงบริหารโดยครอบครัวเดียวกันมาถึงรุ่นที่ห้า เป็นร้านทองแห่งเดียวในไทยที่ได้รับตราครุฑ ครอบครัวมีพิพิธภัณฑ์เล็ก ๆ และยินดีเล่าประวัติให้ใครก็ตามที่ถาม",
      address: "Soi Wanit 1, Yaowarat/Sampheng",
    },
  ],
  "sam-phraeng": [
    {
      name: "Chote Chitr",
      thai: "โชติจิตร",
      theme: "eat",
      note: "Family-run since the Rama V era, four generations in the same shophouse, a Michelin Bib Gourmand. Order the mussel pancake and miang kham — the menu hasn't needed updating in a century.",
      noteTh: "ร้านของครอบครัวตั้งแต่สมัยรัชกาลที่ 5 สืบทอดมาสี่รุ่นในตึกแถวเดิม ได้ Bib Gourmand จากมิชลิน สั่งหอยทอดกับเมี่ยงคำ เมนูไม่ต้องปรับมาร้อยปีแล้ว",
      address: "146 Trok Phraeng Phuthon, off Thanon Tanao",
    },
    {
      name: "Wat Ratchabophit",
      thai: "วัดราชบพิธสถิตมหาสีมาราม",
      theme: "mindful",
      note: "The least-visited of Bangkok's royal temples, so its circular ordination hall stays quiet even midmorning. Daily prayers run 9:00–9:30am and 5:30–6:00pm — the stained-glass interior throws its best light between 8 and 10am.",
      noteTh: "วัดหลวงที่มีคนมาเยือนน้อยที่สุดในกรุงเทพฯ ทำให้พระอุโบสถทรงกลมเงียบสงบแม้แต่สายๆ สวดมนต์ประจำวันเวลา 9:00–9:30 น. และ 17:30–18:00 น. แสงจากกระจกสีในโบสถ์สวยที่สุดช่วง 8-10 โมงเช้า",
      address: "Corner of Ratchabophit Road and Fueang Nakhon Road",
    },
    {
      name: "1905 Heritage Corner",
      thai: "1905 เฮอริเทจ คอร์เนอร์",
      theme: "explore",
      note: "A ThaiCraft fair-trade outlet and café inside one of the oldest restored shophouses in the old town. Walk in, look at the crafts, have a coffee — no obligation to buy.",
      noteTh: "ร้านสินค้าหัตถกรรมแฟร์เทรด ThaiCraft พร้อมคาเฟ่ ในตึกแถวเก่าแก่ที่บูรณะแล้วหลังหนึ่งในเมืองเก่า เดินเข้าไปดูงานฝีมือ นั่งจิบกาแฟ ไม่จำเป็นต้องซื้ออะไร",
      address: "Phraeng Phuthon Road, near Bamrung Mueang Road",
    },
    {
      name: "Ban Baat Monk's Bowl Village",
      thai: "ชุมชนบ้านบาตร",
      theme: "create",
      note: "A short trip from Sam Phraeng, not inside it — the last of Rama I's three original alms-bowl villages, still hand-forging bowls from eight steel strips. Buy one and the family will usually let you try a few hammer strikes.",
      noteTh: "อยู่ไม่ไกลจากสามแพร่งแต่ต้องเดินทางเพิ่มนิดหน่อย เป็นชุมชนตีบาตรพระที่เหลือรอดจากสามชุมชนดั้งเดิมสมัยรัชกาลที่ 1 ยังตีบาตรจากเหล็กแปดแผ่นด้วยมือ ซื้อบาตรแล้วครอบครัวมักให้ลองตีค้อนสักสองสามที",
      address: "Soi Ban Baat, off Boriphat Road",
    },
    {
      name: "Nattaporn Ice Cream",
      thai: "นัฐพร ไอศกรีมกะทิสด",
      theme: "connect",
      note: "A narrow coconut-ice-cream counter in a Sino-Portuguese shophouse, same family for over 80 years. A handful of stools means you end up talking to whoever's next to you while you wait.",
      noteTh: "ร้านไอศกรีมกะทิสดเคาน์เตอร์แคบ ๆ ในตึกแถวสไตล์ชิโน-โปรตุกีส ครอบครัวเดียวกันมากว่า 80 ปี ที่นั่งมีไม่กี่ตัวจนต้องคุยกับคนข้าง ๆ ระหว่างรอ",
      address: "Phraeng Phuthon Road, Phra Nakhon",
    },
  ],
  "nang-loeng": [
    {
      name: "Boonlert Egg Noodle",
      thai: "บุญเลิศ เกี๊ยวกุ้ง",
      theme: "eat",
      note: "Running since 1976, a Michelin Bib Gourmand — grilled pork wontons in a secret sauce, once offered to the King. Order the wonton noodles dry, not the soup, and mix your own seasoning.",
      noteTh: "เปิดมาตั้งแต่ปี 1976 ได้ Bib Gourmand จากมิชลิน เกี๊ยวหมูย่างในซอสสูตรลับที่เคยถวายในหลวง สั่งบะหมี่เกี๊ยวแห้ง ไม่ใช่แบบน้ำ แล้วปรุงรสเอง",
      address: "360 Soi Nakhon Sawan 8, Wat Sommanat",
    },
    {
      name: "Wat Sommanat Wihan",
      thai: "วัดโสมนัสวิหาร",
      theme: "mindful",
      note: "A royal temple built under Rama IV, on the bank of Khlong Phadung Krung Kasem. The east wall carries Khrua In Khong's murals — one of the first Thai artists to paint in Western perspective. Quiet, worth sitting with rather than photographing.",
      noteTh: "วัดหลวงสร้างในสมัยรัชกาลที่ 4 ริมคลองผดุงกรุงเกษม กำแพงด้านตะวันออกมีภาพจิตรกรรมฝีมือขรัวอินโข่ง หนึ่งในจิตรกรไทยคนแรกที่วาดแบบทัศนียภาพตะวันตก เงียบสงบ ควรนั่งดูมากกว่าถ่ายรูป",
      address: "Krung Kasem Road, Pom Prap Sattru Phai",
    },
    {
      name: "Sala Chaloem Thani",
      thai: "ศาลาเฉลิมธานี",
      theme: "explore",
      note: "Thailand's oldest surviving cinema, a two-storey wooden theatre from 1918, restored and reopened as a cultural space in 2019. The Thai Film Archive runs occasional classic-film screenings here — check ahead, it's not a daily walk-in.",
      noteTh: "โรงหนังที่เก่าแก่ที่สุดในไทยที่ยังหลงเหลืออยู่ อาคารไม้สองชั้นสร้างปี 1918 บูรณะและเปิดใหม่เป็นพื้นที่วัฒนธรรมในปี 2019 หอภาพยนตร์บางครั้งจัดฉายหนังคลาสสิกที่นี่ ควรเช็คก่อนไปเพราะไม่ได้เปิดทุกวัน",
      address: "Nakhon Sawan Road, next to Nang Loeng Market",
    },
    {
      name: "Ban Narasilp",
      thai: "บ้านนราศิลป์",
      theme: "create",
      note: "A khon and lakhon costume-making house dating to Rama VI's reign, now a Ministry of Culture learning centre. They still hand-embroider stage costumes and run workshops for young artisans.",
      noteTh: "บ้านทำเครื่องแต่งกายโขน-ละครตั้งแต่สมัยรัชกาลที่ 6 ปัจจุบันเป็นศูนย์การเรียนรู้ของกระทรวงวัฒนธรรม ยังปักเครื่องแต่งกายบนเวทีด้วยมือและเปิดอบรมให้ช่างฝีมือรุ่นใหม่",
      address: "Larn Luang Road, near Wat Suntorn Thammatarn",
    },
    {
      name: "Roong Rueang Hokkien Noodles",
      thai: "รุ่งเรือง บะหมี่ฮกเกี้ยน นางเลิ้ง",
      theme: "connect",
      note: "Family-run since 1944, three generations in. The red pork rice was once served to Queen Elizabeth II on her 1996 visit — ask whoever's behind the counter about it, it's a real story, not a plaque.",
      noteTh: "ร้านของครอบครัวเปิดตั้งแต่ปี 1944 สืบทอดมาสามรุ่น ข้าวหมูแดงเคยเสิร์ฟให้สมเด็จพระราชินีนาถเอลิซาเบธที่ 2 ในการเสด็จเยือนปี 1996 ลองถามคนที่เคาน์เตอร์ดู เป็นเรื่องจริง ไม่ใช่แค่ป้ายติดผนัง",
      address: "362/149 Soi Nakhon Sawan 8, Wat Sommanat",
    },
  ],
  "charoen-krung": [
    {
      name: "Home Cuisine Islamic Restaurant",
      thai: "โฮมคูซีน",
      theme: "eat",
      note: "A Muslim family-run kitchen in the Haroon Mosque quarter — Thai-style oxtail soup, mutton biryani, roti gaeng, mains around 100 baht.",
      noteTh: "ร้านอาหารมุสลิมของครอบครัวในย่านมัสยิดฮารูณ ซุปหางวัวสไตล์ไทย ข้าวหมกแพะ โรตีแกง ราคาจานละราวร้อยบาท",
      address: "Soi Charoenkrung 36, Bang Rak",
    },
    {
      name: "Assumption Cathedral",
      thai: "อาสนวิหารอัสสัมชัญ",
      theme: "mindful",
      note: "Rebuilt in red brick 1909–1918 behind the Oriental. Slip into a pew on a quiet weekday afternoon, away from the wedding-photo crowds that gather outside on weekends.",
      noteTh: "สร้างใหม่ด้วยอิฐแดงระหว่างปี 1909–1918 อยู่ด้านหลังโรงแรมโอเรียนเต็ล นั่งในม้านั่งช่วงบ่ายวันธรรมดาที่เงียบ ห่างจากฝูงคนถ่ายรูปแต่งงานที่มักมารวมตัวกันหน้าโบสถ์ช่วงสุดสัปดาห์",
      address: "Charoen Krung Soi 40, Bang Rak",
    },
    {
      name: "Balzac Bangkok",
      thai: "บัลซัค บางกอก",
      theme: "explore",
      note: "A French-run secondhand bookshop and café on Charoen Krung itself — dark wood shelves, vinyl, an actual reading-room feel, not a photo-op café. Closed Mondays.",
      noteTh: "ร้านหนังสือมือสองและคาเฟ่ที่คนฝรั่งเศสเปิดบนถนนเจริญกรุง ชั้นไม้เข้มสีพร้อมแผ่นเสียง บรรยากาศเหมือนห้องอ่านหนังสือจริง ไม่ใช่คาเฟ่ไว้ถ่ายรูป ปิดวันจันทร์",
      address: "357 Charoen Krung Road (Soi 43)",
    },
    {
      name: "Warehouse 30",
      thai: "โกดัง 30",
      theme: "create",
      note: "The restored WWII-era warehouse complex anchoring the Creative District — galleries, design shops, and craft pop-up markets where you sit down and actually make something, not just look.",
      noteTh: "โกดังยุคสงครามโลกครั้งที่สองที่บูรณะแล้ว เป็นหัวใจของย่านสร้างสรรค์ มีแกลเลอรี ร้านดีไซน์ และตลาดป๊อปอัพงานฝีมือที่นั่งลงแล้วลงมือทำได้จริง ไม่ใช่แค่เดินดู",
      address: "48 Charoen Krung Soi 30, Bang Rak",
    },
    {
      name: "Speedy Grandma",
      thai: "สปีดี้ แกรนด์มา",
      theme: "connect",
      note: "A small artist-run project space, a gallery by day and a bar by night, built deliberately for talks and open conversation around whatever show is up. Where strangers end up talking over a Chang beer.",
      noteTh: "พื้นที่โปรเจกต์ขนาดเล็กที่ศิลปินดูแลกันเอง กลางวันเป็นแกลเลอรี กลางคืนเป็นบาร์ ตั้งใจให้เป็นที่พูดคุยเปิดใจเกี่ยวกับงานที่จัดแสดงอยู่ เป็นที่ที่คนแปลกหน้ามักลงเอยด้วยการนั่งคุยกันพร้อมเบียร์ช้าง",
      address: "1048/3 Charoen Krung Road, Bang Rak",
    },
  ],
  "bang-krachao": [
    {
      name: "The Rabbit Coffee Shop",
      thai: "เดอะ แรบบิท",
      theme: "eat",
      note: "A two-storey wooden house under a big tamarind tree, a short walk from the Bang Nam Phueng market parking lot. Reasonably priced drinks and bakery items.",
      noteTh: "บ้านไม้สองชั้นใต้ร่มมะขามต้นใหญ่ เดินไม่ไกลจากลานจอดรถตลาดบางน้ำผึ้ง เครื่องดื่มและเบเกอรี่ราคาสมเหตุสมผล",
      address: "Bang Nam Phueng, Phra Pradaeng",
    },
    {
      name: "Bird Watching Tower",
      thai: "หอดูนก สวนศรีนครเขื่อนขันธ์",
      theme: "mindful",
      note: "A 7-metre observation tower rising above the tree line in the botanical garden, over 100 recorded bird species in the surrounding mangrove. Free entry.",
      noteTh: "หอสังเกตการณ์สูง 7 เมตรที่ยื่นพ้นแนวต้นไม้ในสวนพฤกษศาสตร์ พบนกกว่า 100 ชนิดในป่าชายเลนรอบข้าง เข้าชมฟรี",
      address: "Sri Nakhon Khuean Khan Park and Botanical Garden, Bang Krachao",
    },
    {
      name: "Cave Craft Art Studio",
      thai: "เคฟ คราฟต์ อาร์ต สตูดิโอ",
      theme: "create",
      note: "A DIY workshop tucked in greenery near the botanical garden — candle pouring, soap making, resin art, mug painting. Worth the detour off the bike loop.",
      noteTh: "เวิร์กช็อป DIY ท่ามกลางความเขียวขจีใกล้สวนพฤกษศาสตร์ หล่อเทียน ทำสบู่ งานเรซิน ระบายสีแก้วมัค คุ้มค่าที่จะแวะออกนอกเส้นทางปั่นจักรยาน",
      address: "Soi Wat Rat 12 Rangsan, Bang Krachao, Samut Prakan",
    },
    {
      name: "Pae-Jeab Bike Rental",
      thai: "ร้านแพเจี๊ยบ",
      theme: "explore",
      note: "Bikes for about 80 baht a day, water bottle and map included, right at Raft House Pier. Staff are known for being patient with wobbly first-timers.",
      noteTh: "ให้เช่าจักรยานราวๆ วันละ 80 บาท แถมน้ำดื่มและแผนที่ อยู่ตรงท่าเรือแพเรือนไทย พนักงานใจเย็นกับมือใหม่ที่ยังปั่นไม่มั่นคง",
      address: "Raft House Pier, Bang Krachao",
    },
  ],
};

export function questSpotsFor(areaSlug: string): QuestSpot[] {
  return QUEST_SPOTS[areaSlug] ?? [];
}
