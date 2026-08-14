// What the theses actually say.
//
// Dr Non's point in commissioning this: a great deal of research on the
// Bangkok shophouse has already been done — at Chulalongkorn, Silpakorn,
// Thammasat, KMUTT, and abroad — and almost none of it has reached the
// people making demolition decisions. Four of the open-access documents
// were read in full for this page; the rest are catalogued so the next
// person does not start from nothing.
//
// Every claim below carries the document it came from. Where a source is
// internally inconsistent, or where a widely-repeated "fact" could not be
// traced to a primary source, that is recorded rather than smoothed over.

export type Finding = {
  id: string;
  claim: string;
  detail: string;
  source: string;
  year: number;
  url?: string;
  caveat?: string;
};

/** Read in full for this essay. */
export const READ_IN_FULL = [
  {
    title: "Vacant Shophouse Buildings in Bangkok: The Root Causes and Strategic Options",
    author: "Nabila Imam",
    degree: "MSc Urban Strategies",
    university: "Chulalongkorn University",
    year: 2021,
    url: "https://digital.car.chula.ac.th/chulaetd/4934/",
    read: "Abstract, ch.1, ch.4–7, appendices (114 pp.)",
  },
  {
    title: "Adaptive Reuse of Old Shophouses in Bangkok",
    author: "Attachai Luangamornlert",
    degree: "M.Arch",
    university: "Chulalongkorn University",
    year: 2015,
    url: "https://digiverse.chula.ac.th/Info/item/dc:53984",
    read: "Full document (116 pp.)",
  },
  {
    title: "Shophouses of the Chinese in Bangkok's Chinatown 1960–2000",
    author: "Siriyanee Siriyananthorn",
    degree: "MA Southeast Asian Studies",
    university: "Chulalongkorn University",
    year: 2005,
    url: "https://digiverse.chula.ac.th/Info/item/dc:81338",
    read: "Chapter 3 and full English abstract",
  },
  {
    title:
      "A Study of Shophouses During the Period of King Rama V Based on a 1907 Bangkok Map: Samphanthawong District",
    author: "Quin Limp",
    degree: "M.Arch",
    university: "Chulalongkorn University",
    year: 2010,
    url: "https://digital.car.chula.ac.th/chulaetd/71683/",
    read: "Abstract and published summary only — full text not retrievable",
  },
] as const;

export const FINDINGS: Finding[] = [
  {
    id: "samphanthawong-loss",
    claim: "In one district, 2,430 shophouses in 1907. Around 310 survive.",
    detail:
      "Quin Limp mapped every shophouse in Samphanthawong from the 1907 cadastral survey and reconstructed sixteen original design types, including a run of 63 identical units across Songsawat, Charoen Krung and Yaowarat. Roughly 310 of the 2,430 are still standing — a loss of about 87% in one district over a century.",
    source: "Quin Limp, M.Arch thesis, Chulalongkorn University",
    year: 2010,
    url: "https://digital.car.chula.ac.th/chulaetd/71683/",
  },
  {
    id: "stairs",
    claim: "The stair is a documented cause of vacancy, not an architect's complaint.",
    detail:
      "Imam's root-cause analysis lists 'inconvenient placement of stairs' among the architectural causes of upper-floor vacancy. Tenants object because the stair runs through the interior, so letting the upper floors means surrendering privacy; one survey response gives the reason for unlettable upper floors simply as 'no stairs outside'. Attachai independently identifies the staircase as the fixed element that governs what a shophouse can become.",
    source: "Imam (2021) pp. 59, 94; Luangamornlert (2015)",
    year: 2021,
    url: "https://digital.car.chula.ac.th/chulaetd/4934/",
  },
  {
    id: "rather-empty",
    claim: "Owners would rather hold a shophouse empty than let it cheaply.",
    detail:
      "Every owner in Imam's 40-property survey said so directly. Thailand had no vacant-property tax at the time of the study, so an empty building costs its owner almost nothing to keep empty, and the vacancy is a rational decision rather than neglect.",
    source: "Imam (2021) p. 62",
    year: 2021,
    url: "https://digital.car.chula.ac.th/chulaetd/4934/",
    caveat:
      "A 40-owner qualitative study in one sub-district (Punnawithi). The taxonomy travels; the percentages describe those 40 buildings.",
  },
  {
    id: "cannot-rebuild",
    claim: "On many plots you are not permitted to rebuild what you demolish.",
    detail:
      "Setback rules under Ministerial Regulation No. 55 require a building over two storeys to sit 6 m back from the centreline of a road under 10 m wide. An old shophouse already occupies its full plot, so demolishing it and rebuilding on the same footprint is not lawful. Reuse is not the sentimental option on these plots — it is the only legal one.",
    source: "Luangamornlert (2015), citing Ministerial Regulation No. 55, Building Control Act B.E. 2522",
    year: 2015,
    url: "https://digiverse.chula.ac.th/Info/item/dc:53984",
  },
  {
    id: "permit-threshold",
    claim: "Touch the concrete stair and the law calls it a demolition.",
    detail:
      "Ministerial Regulation No. 11 (B.E. 2528) defines removing a reinforced-concrete stair, wall or upper floor slab as demolition rather than modification, and modification is only exempt from permit within 10% of building weight or 5 m². The single change that would unlock a shophouse's upper floors is therefore the change that triggers full modern-code compliance.",
    source: "Ministerial Regulation No. 11 B.E. 2528; Luangamornlert (2015)",
    year: 1985,
    url: "https://download.asa.or.th/03media/04law/cba/mr/mr28-11-upd65.pdf",
  },
  {
    id: "hotel-relief",
    claim: "Thailand already wrote the fix once — for hotels, with a five-year clock.",
    detail:
      "A 2016 ministerial regulation let existing buildings convert to small hotels under relaxed standards, and crucially grandfathered setbacks, building line and parking to the rules in force when the building was first permitted. Stairs and corridors converted from shophouses needed only a 200 kg/m² live load. It was extended three times and reported to run to August 2024.",
    source: "กฎกระทรวงกำหนดลักษณะอาคารประเภทอื่นที่ใช้ประกอบธุรกิจโรงแรม พ.ศ. 2559",
    year: 2016,
    url: "https://download.asa.or.th/03media/04law/cba/mr/mr59-66a.pdf",
    caveat: "Current expiry or renewal status not verified. Check before relying on it.",
  },
  {
    id: "flexible-not-adaptable",
    claim: "The shophouse is flexible but not adaptable — and the difference is the whole problem.",
    detail:
      "Attachai's central finding: the shophouse is an empty shell that was never designed for a specific programme, which makes it spatially flexible. But its structure, slab, rear plumbing and stair are rigid, so the fabric cannot absorb what the space invites. Facades get modified most and worst — advertising panels block the ventilation and daylight the type depends on.",
    source: "Luangamornlert (2015)",
    year: 2015,
    url: "https://digiverse.chula.ac.th/Info/item/dc:53984",
  },
  {
    id: "still-liked",
    claim: "The people who live in shophouses mostly like them.",
    detail:
      "In Siriyanee's Chinatown survey of 60 households, 68% were satisfied with the shophouse as a place to live and 77% as a place to work; 76% ran their business in the same building. Dissatisfaction concentrates in the younger generation, who leave. The building type is not failing its occupants so much as failing to hold the next ones.",
    source: "Siriyananthorn (2005)",
    year: 2005,
    url: "https://digiverse.chula.ac.th/Info/item/dc:81338",
  },
  {
    id: "half-the-city",
    claim: "In the 1960s, more than half of everything built in Thai cities was shophouses.",
    detail:
      "By the mid-1970s roughly 70% of Bangkok's 2.8 million people lived in one — about 400,000 units. This is not a minor typology that happens to be old. It is what the modern city was built out of.",
    source: "Fusinpaiboon (2022), Journal of Asian Architecture and Building Engineering 21(5)",
    year: 2022,
    url: "https://www.tandfonline.com/doi/full/10.1080/13467581.2021.1942880",
    caveat:
      "Both percentages are Fusinpaiboon's citations of an upstream source that could not be identified. Verify page numbers against the published PDF before print.",
  },
  {
    id: "module",
    claim: "The structural grid is 4 × 4 metres, and a market stall grid is the same.",
    detail:
      "Attachai reports the shophouse module as 4.00 × 4.00 m with shared 20 cm columns, a 1.00–1.20 m stair, and a 3 m rear service strip forced by the setback. A 1985 survey of 156 units found 47% with a frontage between 3.51 and 4.00 m. Yuhui Guo's studio project arrives at the same 4 m grid from the other direction, by measuring a fresh market.",
    source: "Luangamornlert (2015), citing Chantawarang (1985), n=156",
    year: 2015,
    url: "https://digiverse.chula.ac.th/Info/item/dc:53984",
  },
];

/** Short facts for the marginal rail. Each one traces to a source above. */
export const DID_YOU_KNOW = [
  {
    fact: "Samphanthawong had 2,430 shophouses in 1907. About 310 are left.",
    source: "Quin Limp, Chulalongkorn, 2010",
  },
  {
    fact: "A row of shophouses may legally run no more than 10 units and 40 metres before it must stop and leave a 4 m gap.",
    source: "Ministerial Regulation No. 55 B.E. 2543, ข้อ 4",
  },
  {
    fact: "A firewall is required every five units — which is why long rows have rhythm you can read from the street.",
    source: "Ministerial Regulation No. 55 B.E. 2543, ข้อ 17",
  },
  {
    fact: "Bangkok's first paved road, Charoen Krung, was built in 1862–64 because foreign consuls petitioned that they had nowhere to ride.",
    source: "ประชุมประกาศรัชกาลที่ 4",
  },
  {
    fact: "King Rama V drew the line of Song Wat Road himself. It was cut in 1892 and runs 1,196 m.",
    source: "Royal Gazette records via th.wikipedia",
  },
  {
    fact: "Ratchadamnoen has almost no shophouses because Rama V forbade them there. Its Art Deco blocks are 1940s.",
    source: "Historical record, Ratchadamnoen Avenue",
  },
  {
    fact: "Removing a reinforced-concrete stair is legally a demolition, not a modification.",
    source: "Ministerial Regulation No. 11 B.E. 2528",
  },
  {
    fact: "Siam Cement was founded by royal decree in 1913; the Bang Sue plant began producing in 1915. Concrete shophouses follow.",
    source: "Siam Cement corporate history",
  },
  {
    fact: "Every owner in a 2021 survey said they would keep a shophouse empty rather than let it cheaply.",
    source: "Nabila Imam, Chulalongkorn, 2021",
  },
  {
    fact: "The 1907 map that makes this history countable is a cadastral survey at 1:1,000, made to issue land title deeds — 192 sheets.",
    source: "Chulasai, Tachakitkachorn & Povathong, TRF, 2006",
  },
] as const;

export type Era = {
  id: string;
  period: string;
  label: string;
  structure: string;
  storeys: string;
  what: string;
  source: string;
};

/**
 * Two periodisations exist in the literature and they do not reconcile.
 * Attachai's is material/structural with an unexplained 1896–1936 gap;
 * Siriyanee's is reign-based and contradicts itself on the founding reign.
 * Both are shown rather than blended into a false consensus.
 */
export const ERAS: Era[] = [
  {
    id: "rama-iv",
    period: "1862–1896",
    label: "The first rows",
    structure: "Load-bearing masonry wall, timber floors, tiled gable or hipped roof",
    storeys: "1–2 storeys",
    what:
      "Charoen Krung is cut in 1862–64 and masonry rows follow along it and around Talat Noi, in a Sino-colonial manner that also appears in Phuket and Penang. Timber ห้องแถว rows in Sampheng predate them; the changeover from timber to masonry is exactly where the sources go vague.",
    source: "Luangamornlert (2015) after Puncharoenluck (2000); Siriyananthorn (2005) §3.2.1",
  },
  {
    id: "rama-v",
    period: "1892–1910",
    label: "The state becomes a developer",
    structure: "Skeleton structure appears from about 1890; brick and stucco",
    storeys: "2 storeys",
    what:
      "Rama V draws Song Wat himself (cut 1892) and orders Yaowarat (1891–1900). The Privy Purse builds and leases rows to Chinese merchant tenants — the shophouse becomes an instrument of royal property income. The 1907 cadastral survey catches 2,430 of them in Samphanthawong alone.",
    source: "Quin Limp (2010); Royal Gazette records",
  },
  {
    id: "gap",
    period: "1896–1936",
    label: "The gap in the literature",
    structure: "—",
    storeys: "—",
    what:
      "Attachai's periodisation runs from 1896 straight to 1936 without accounting for the interval, and no source found for this page fills it. Siam Cement is founded in 1913 and starts producing at Bang Sue in 1915, so the material shift to concrete begins somewhere inside this hole. It is a real gap in the scholarship, not an omission here.",
    source: "Gap identified across Luangamornlert (2015) and the sources on this page",
  },
  {
    id: "transitional",
    period: "1936–1980",
    label: "The type is standardised",
    structure: "Reinforced-concrete skeleton frame, flat slab roof replacing tile",
    storeys: "2–3 storeys",
    what:
      "The concrete frame with non-load-bearing brick infill becomes the norm. In the 1960s more than half of all urban building construction in Thailand is shophouses; by the mid-1970s about 70% of Bangkok lives in one. A Shophouse Manual (คู่มือตึกแถว) in 1979 codifies a prototype that is then duplicated across the city.",
    source: "Luangamornlert (2015); Fusinpaiboon (2022)",
  },
  {
    id: "modern",
    period: "1980–present",
    label: "Taller, thinner, and then unwanted",
    structure: "Prefabricated slabs, aluminium frames, frameless glazing",
    storeys: "3–7 storeys",
    what:
      "Units get taller and car parking becomes the governing problem. The Building Control Act B.E. 2522 (1979) and Ministerial Regulation No. 55 (2000) fix the type's dimensions in law — minimum 4 m frontage, maximum 24 m depth, no more than 10 units or 40 m in a continuous row. Then the stock begins to fall.",
    source: "Luangamornlert (2015); Ministerial Regulation No. 55 B.E. 2543",
  },
];

export const MAP_1907 = {
  title: "แผนที่กรุงเทพฯ ร.ศ. 126 (1907)",
  what:
    "A cadastral survey at 1:1,000, made by the Survey Department while it sat under the Ministry of Agriculture, for the purpose of issuing land title deeds. Because it is cadastral rather than topographic, it records individual plots and building footprints — which is what makes a shophouse census of 1907 possible at all.",
  sheets: 192,
  compiledBy:
    "Bandit Chulasai, Terdsak Tachakitkachorn and Pirasri Povathong assembled the 192 sheets from the Land Department, the Royal Thai Survey Department, the National Library and the National Archives (TRF, 2006), and published the georeferenced result as แผนที่กรุงเทพฯ พ.ศ. 2450–2550 (BMA, 2007).",
  digitised: false,
  digitisedNote:
    "No public scan of a 1907 sheet was found. The National Library of Australia holds digitised Bangkok maps for 1896 and 1932, and Wikimedia Commons has a high-resolution 1896 sheet, but the 1907 cadastral series appears to be reading-room only. Anyone citing an online 1907 scan should check what they are actually looking at.",
  url: "https://digital.library.tu.ac.th/tu_dc/frontend/Info/item/dc:79634",
} as const;
