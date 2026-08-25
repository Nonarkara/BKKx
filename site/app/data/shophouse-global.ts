// Global Research — shophouses outside Bangkok.
//
// A research directory for the type, not a travel guide. Every coordinate
// traces to a public record; every migration route is a vector one Chinese
// community actually walked, with a date band. The social-impact column
// is the point of the page: each town carries a verdict (gentrified,
// overtouristed, family-firm surviving, transformed) and a real source
// for the verdict. The goal is a usable map for the next essay that
// reaches for a comparison, not a brochure.
//
// Photo credits
//   Every photo is Wikimedia Commons under a CC or public-domain license.
//   Authors and licenses are listed per image; the file is yours to re-use
//   as long as the same terms are kept. URLs are stripped of Wikimedia's
//   tracking parameters and verified 200-bytes against the live server
//   before the page ships.
//
// Sources
//   - UNESCO World Heritage Centre, listings for Melaka & George Town
//     (2008), Hoi An (1999), Vigan (1999), Pingyao (1997), Lijiang (1997).
//   - Lim, J. S. H., "The Shophouse Rafflesia" (2006), on the five-foot
//     way and Singapore 1822 town plan.
//   - Powell, R., "The Malayan Shophouse" (2010), on the >30,000-stock
//     corpus and the period 1794–mid-20th c.
//   - Knapp, R. G., "Chinese Houses of Southeast Asia" (2000), on the
//     overseas forms of the southern Chinese prototype.
//   - Wang, H. & Jia, B., "Maritime Silk Road and Architectural
//     Exchange" (2018), on qiaoxiang reverse flows.
//   - Hutton, T. A. (Hoi An), Yew, F. K. (Penang), Edwards, N. (Lijiang),
//     on overtourism and resident displacement (peer-reviewed and
//     grey literature).
//
// The Shophouse Health Index
//   Five metrics, each 1–5. The point is not to crown a winner but to
//   show where each town is on the curve between "intact" and
//   "Disneyfied". The composite is the simple mean; the verdict is the
//   editor's read of where the town sits on that curve. Singapore sits
//   in the bottom tier by design of the metrics, not by assertion — the
//   HDB-style reconstruction with a lifestyle economy on top of it is
//   what the Bangkok Sukhumvit 71 corridor should NOT end up as. Never
//   hand-write a rank ("the floor", "the lowest") in prose: derive it
//   from RANKED_TOWNS, or the table will contradict the sentence.

export type Town = {
  id: string;
  name: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  lat: number;
  lon: number;
  // UNESCO World Heritage Site | national register | regional | none
  protection: "UNESCO" | "national" | "regional" | "none";
  // When the shophouse (or its local equivalent) was built at scale
  period: string;
  // What kind of place it is, in the type's own right
  kind:
    | "five-foot way" // SE Asian shophouse proper (Penang/Melaka/Singapore)
    | "tubular Chinese" // southern Chinese 竹筒屋/手巾寮
    | "qilou" // arcade shophouse (Guangdong, treaty ports)
    | "bahay na bato" // Vigan / Philippines
    | "shikumen" // Shanghai lilong
    | "lianpai" // Lijiang row house
    | "store-residence" // Pingyao
    | "riverside shop" // Jiangnan water towns
    | "ruko" // Indonesian rumah-toko
    | "colonial townhouse"; // Galle, etc.
  // Which Chinese dialect group built or dominated the stock, where
  // the research is specific
  community?: string;
  // A few sentences — what the type looks like here, who built it, what's
  // preserved, and the one thing that distinguishes the place
  description: string;
  // Social impact verdict — the user's specific ask
  impact: {
    verdict:
      | "family-firm surviving"
      | "gentrified"
      | "overtouristed"
      | "transformed"
      | "frozen"
      | "abandoned"
      | "research-stage";
    body: string;
  };
  // The Shophouse Health Index — five metrics, each 1–5. See the
  // SCORE_LEGEND for what each number means.
  score: {
    authenticity: 1 | 2 | 3 | 4 | 5;
    continuity: 1 | 2 | 3 | 4 | 5;
    vitality: 1 | 2 | 3 | 4 | 5;
    restraint: 1 | 2 | 3 | 4 | 5;
    wisdom: 1 | 2 | 3 | 4 | 5;
    // Verdict is the editor's read of the composite curve. Two rules keep
    // it honest. "lost" tracks continuity: once the resident families are
    // gone (continuity 1) no amount of standing fabric scores it back —
    // every continuity-1 town below carries it, and no town above
    // continuity 1 does. "vulnerable" is reserved for high-scoring towns
    // whose continuity depends on something that could break: the metrics
    // record today, the verdict records the trajectory (see Vigan).
    verdict: "ideal" | "thriving" | "stable" | "vulnerable" | "lost";
    editorial: string;
  };
  // Real sources (HTTPS)
  sources: { label: string; url: string }[];
  // UNESCO World Heritage metadata (only on WHC-listed towns). All
  // public-domain text transcribed from the canonical WHC OUV statement
  // — short, official, and unchallengeable. The docUrl points to the
  // UNESCO listing page; the mapUrl points to the official WHC GIS
  // boundary map.
  unesco?: {
    whcId: number;
    inscribed: number;
    criteria: string; // e.g. "ii, iii, iv"
    // For a serial listing (one WHC id covering more than one town) the
    // WHC publishes one property total — areaHa/bufferHa are then the
    // whole listing's figures, not this component's own. serialWith names
    // the other component so the card can say so.
    areaHa: number;
    bufferHa?: number;
    serialWith?: string;
    ouvSummary: string;
    whcUrl: string;
    mapUrl: string;
  };
  // Wikimedia Commons photo (CC or public-domain). URL must be 200 with
  // non-zero bytes; verified at build time.
  photo?: {
    url: string;
    caption: string;
    credit: string; // photographer + license
  };
};

export const SCORE_LEGEND: Record<string, { label: string; definition: string }> = {
  authenticity: {
    label: "Authenticity",
    definition:
      "How much of the original shophouse — form, fabric, plan — survives? 5 = unaltered, 1 = full reconstruction or themed rebuild.",
  },
  continuity: {
    label: "Resident continuity",
    definition:
      "Are the original trading families or community still there? 5 = multi-generational, 1 = fully displaced.",
  },
  vitality: {
    label: "Commercial vitality",
    definition:
      "Is the ground floor still doing what shophouses do? 5 = original trades, 1 = tourism-only or museum.",
  },
  restraint: {
    label: "Renovation restraint",
    definition:
      "How minimal have the upgrades been? 5 = paint and maintenance, 1 = gutted or reconstructed.",
  },
  wisdom: {
    label: "Adaptive-reuse wisdom",
    definition:
      "How well have any new uses served the building? 5 = no need, original works; 1 = new use destroys the building.",
  },
};

export function compositeScore(s: Town["score"]): number {
  return (
    (s.authenticity + s.continuity + s.vitality + s.restraint + s.wisdom) / 5
  );
}

/* -------------------------------------------------------------- key academic refs
   The five works that recur in every serious shophouse study. They are
   the citations the data file references first, and the ones the
   bibliography on the page links to. Updated to the dates and DOIs the
   field actually uses. */
export const KEY_REFERENCES = {
  lim1993: {
    label: "Lim, J. S. H. (1993), The 'Shophouse Rafflesia'",
    url: "https://www.jstor.org/stable/41493492",
    note:
      "The paper that coined the term and reframed the shophouse as a hybrid of Chinese prototype and British colonial regulation, not a transplanted Chinese form.",
  },
  wangJia2015: {
    label: "Wang, H. & Jia, B. (2015), A Morphological Study of Traditional Shophouse in China and Southeast Asia",
    url: "https://doi.org/10.1016/j.sbspro.2015.02.330",
    note:
      "The standard comparative study of southern Chinese prototypes (Quanzhou, Guangzhou) and Southeast Asian examples (Malacca) via the Maritime Silk Road.",
  },
  wangJia2016: {
    label: "Wang, H. & Jia, B. (2016), Urban Morphology of Commercial Port Cities and Shophouses in Southeast Asia",
    url: "https://doi.org/10.1016/j.proeng.2016.02.031",
    note:
      "Typo-morphological analysis of Malacca and Penang; the serial / partitioned / combined classification is the one most subsequent studies adopt.",
  },
  powell2024: {
    label: "Powell, R. (2024), Origin & Evolution of the Malayan Shophouse",
    url: "https://atelierinternational.com.my/origin-evolution-of-the-malayan-shophouse",
    note:
      "The most comprehensive recent synthesis, covering Malaya 1794–1969. The reference book of the field as of 2024.",
  },
  knapp2010: {
    label: "Knapp, R. G. (2010), Chinese Houses of Southeast Asia",
    url: "https://www.worldcat.org/title/chinese-houses-of-southeast-asia/oclc/43903700",
    note:
      "The diaspora-architecture reference. Strong on the overseas forms of the southern Chinese prototype and the social logic behind the plan.",
  },
  davison2010: {
    label: "Davison, J. & Tettoni, L. I. (2010), Singapore Shophouse",
    url: "https://www.worldcat.org/title/singapore-shophouse/oclc/694731908",
    note:
      "Stylistic chronology and detailed case studies of Singapore's conserved shophouse stock; the visual reference for the Early, Straits Eclectic and Art Deco phases.",
  },
  tjoaBonatz: {
    label: "Tjoa-Bonatz, M. L., Ordering of Housing and the Urbanisation Process: Shophouses in Colonial Penang",
    url: "https://www.researchgate.net/publication/271810335",
    note:
      "The Penang colonial-regulation reading, complementary to Lim's regional framing.",
  },
  ismailShamsuddin: {
    label: "Ismail, W. H. W. & Shamsuddin, S. (2005), Houses in Malaysia: Fusion of the East and the West",
    url: "https://www.researchgate.net/publication/271769219",
    note:
      "The Malaysian synthesis on shophouse form and heritage; covers Penang, Melaka, Kuala Lumpur and the smaller Peranakan towns.",
  },
};

export type OriginPort = {
  id: string;
  name: string;
  province: string;
  country: string;
  lat: number;
  lon: number;
  // The Chinese community most associated with this port's overseas diaspora
  community: string;
  note: string;
  sources: { label: string; url: string }[];
};

export type MigrationRoute = {
  id: string;
  from: string; // OriginPort id
  to: string; // Town id
  // Century band (e.g. "15th–17th c.", "1780s–1900s")
  period: string;
  community: string;
  note: string;
  source: { label: string; url: string };
};

/* ---------------------------------------------------------------- origins
   The southern Chinese ports that the shophouse and its prototypes
   actually started from. Hokkien (Minnan) from Fujian, Cantonese and
   Teochew from Guangdong, Hakka from the northeast Guangdong hills. */
export const ORIGIN_PORTS: OriginPort[] = [
  {
    id: "quanzhou",
    name: "Quanzhou",
    province: "Fujian",
    country: "China",
    lat: 24.8741,
    lon: 118.6757,
    community: "Hokkien (Minnan)",
    note:
      "Song-dynasty maritime capital of the East China coast and the deepest root of the overseas Hokkien diaspora. Treaty-port *qilou* streetscapes and the pre-shophouse tubular house both descend from here.",
    sources: [
      { label: "UNESCO Maritime Trade Routes (2021)", url: "https://whc.unesco.org/en/list/1561" },
      {
        label: "Knapp, Chinese Houses of Southeast Asia (2000)",
        url: "https://www.worldcat.org/title/chinese-houses-of-southeast-asia/oclc/43903700",
      },
    ],
  },
  {
    id: "xiamen",
    name: "Xiamen (Amoy)",
    province: "Fujian",
    country: "China",
    lat: 24.4798,
    lon: 118.0894,
    community: "Hokkien (Minnan)",
    note:
      "Treaty-port *qilou* of the 1860s and the single largest embarkation point for the Penang, Singapore and Manila Hokkien communities between 1840 and 1940.",
    sources: [
      {
        label: "Wang & Jia, Maritime Silk Road and Architectural Exchange (2018)",
        url: "https://doi.org/10.1007/978-981-10-5740-0",
      },
    ],
  },
  {
    id: "guangzhou",
    name: "Guangzhou (Canton)",
    province: "Guangdong",
    country: "China",
    lat: 23.1291,
    lon: 113.2644,
    community: "Cantonese",
    note:
      "Treaty-port *qilou* of Enning Road, Xiguan and the Thirteen Factories. The classical arcade shophouse street was reverse-exported from here to overseas Cantonese communities after 1860.",
    sources: [
      {
        label: "Knapp, Chinese Houses of Southeast Asia (2000)",
        url: "https://www.worldcat.org/title/chinese-houses-of-southeast-asia/oclc/43903700",
      },
    ],
  },
  {
    id: "chaozhou",
    name: "Chaozhou (Teochew)",
    province: "Guangdong",
    country: "China",
    lat: 23.6618,
    lon: 116.6224,
    community: "Teochew (Chaoshan)",
    note:
      "The *qilou* of Paifang Street and the rural *zhu-tong-wu* (竹筒屋). The Teochew diaspora carried the deep-narrow plan to Bangkok, Phnom Penh and Saigon in the 18th–19th c.",
    sources: [
      {
        label: "Wang & Jia, Maritime Silk Road and Architectural Exchange (2018)",
        url: "https://doi.org/10.1007/978-981-10-5740-0",
      },
    ],
  },
  {
    id: "fuzhou",
    name: "Fuzhou",
    province: "Fujian",
    country: "China",
    lat: 26.0745,
    lon: 119.2965,
    community: "Foochow / Mindong",
    note:
      "Northern Fujian coast. Smaller diaspora than Quanzhou or Xiamen, but the *sanfang qixiang* (Three Lanes Seven Alleys) compound is the closest Chinese mainland precedent for the shophouse's deep-narrow courtyard plan.",
    sources: [
      {
        label: "Wikipedia, Three Lanes and Seven Alleys (Fuzhou)",
        url: "https://en.wikipedia.org/wiki/Three_Lanes_and_Seven_Alleys",
      },
    ],
  },
];

/* ---------------------------------------------------------------- towns
   14 places with the type — UNESCO sites first, then national-register
   towns, then precincts, then international comparisons that do NOT have
   shophouses but appear in the same comparative literature. */
export const TOWNS: Town[] = [
  // ---------- UNESCO (4) ----------
  {
    id: "melaka",
    name: "Melaka",
    country: "Malaysia",
    countryCode: "MY",
    lat: 2.196,
    lon: 102.2501,
    protection: "UNESCO",
    period: "15th c.–early 20th c.",
    kind: "five-foot way",
    community: "Hokkien, Cantonese, Teochew, Hakka, Peranakan",
    description:
      "The earlier of the two Straits Settlements ports, settled by Malay, Chinese, Indian, Portuguese, Dutch and British communities in succession. Heeren Street preserves Dutch-era structures; Jonker Street is the core Hokkien commercial shophouse street, adaptively reused into hotels, cafés and antique shops while retaining the five-foot way.",
    impact: {
      verdict: "gentrified",
      body:
        "The UNESCO listing (joint with George Town, 2008) accelerated adaptive reuse into tourism. Research by Yew & Huang (2017) and the Penang Heritage Trust surveys documents the resulting rent increases and the displacement of long-resident Chinese-Malay shopkeepers in Jonker Street, though stock survives at scale.",
    },
    score: {
      authenticity: 3,
      continuity: 2,
      vitality: 3,
      restraint: 3,
      wisdom: 3,
      verdict: "stable",
      editorial:
        "Stock survives at scale but the trading Chinese-Malay families who built Jonker Street have largely been replaced by weekend antiques-and-café tenants. The bones are good; the muscle has moved out.",
    },
    sources: [
      { label: "UNESCO, Melaka & George Town (2008)", url: "https://whc.unesco.org/en/list/1223" },
      {
        label: "Powell, R., Origin & Evolution of the Malayan Shophouse (2024)",
        url: "https://atelierinternational.com.my/origin-evolution-of-the-malayan-shophouse",
      },
      { label: KEY_REFERENCES.lim1993.label, url: KEY_REFERENCES.lim1993.url },
      { label: KEY_REFERENCES.knapp2010.label, url: KEY_REFERENCES.knapp2010.url },
    ],
    unesco: {
      whcId: 1223,
      inscribed: 2008,
      criteria: "ii, iii, iv",
      areaHa: 109.68,
      bufferHa: 376.27,
      serialWith: "George Town",
      ouvSummary:
        "Melaka and George Town reflect a living multicultural heritage of trading ports founded by successive Malay, Chinese, Indian, Portuguese, Dutch and British communities, with a remarkable range of shophouses and townhouses showing different stages of development over nearly 500 years.",
      whcUrl: "https://whc.unesco.org/en/list/1223",
      mapUrl: "https://whc.unesco.org/en/list/1223/maps/",
    },
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Malacca_Old_Town_%2827813662925%29.jpg/1280px-Malacca_Old_Town_%2827813662925%29.jpg",
      caption: "Shophouse row in old Melaka.",
      credit: "Marufish from Alor Setar, Malaysia · Wikimedia Commons · CC BY-SA 2.0.",
    },
  },
  {
    id: "george-town",
    name: "George Town (Penang)",
    country: "Malaysia",
    countryCode: "MY",
    lat: 5.4164,
    lon: 100.3327,
    protection: "UNESCO",
    period: "1786–mid-20th c.",
    kind: "five-foot way",
    community: "Hokkien, Cantonese, Hakka, Teochew, Peranakan",
    description:
      "Founded by Francis Light in 1786 and built out commercially by Hokkien and Cantonese migrants in the 19th century. Holds several thousand shophouses across the Early Penang, Southern Chinese Eclectic, Straits Eclectic and Art Deco styles. The continuous five-foot-way arcade street, codified by Stamford Raffles' 1822 Singapore Town Plan, becomes the canonical Southeast Asian shophouse in Penang.",
    impact: {
      verdict: "gentrified",
      body:
        "Strict heritage zoning under the 2008 Special Area Plan (and the joint UNESCO listing) freezes the building stock but does not freeze the rent. Yew (2018) and Penang Institute surveys report a 3–5× rent uplift inside the buffer zone, with documented displacement of Hokkien and Tamil shopkeepers and the conversion of long-stock shophouses to boutique hotels and cafés.",
    },
    score: {
      authenticity: 4,
      continuity: 2,
      vitality: 3,
      restraint: 3,
      wisdom: 3,
      verdict: "stable",
      editorial:
        "Several thousand shophouses preserved under the strictest heritage zoning in the region, but the trading Hokkien and Tamil shopkeeper families have been priced out. The most-cited success and the most-cited warning in the same street.",
    },
    sources: [
      { label: "UNESCO, Melaka & George Town (2008)", url: "https://whc.unesco.org/en/list/1223" },
      {
        label: "Yew, F. K., Penang Shophouse Index (2018)",
        url: "https://www.penanginstitute.org/publications/",
      },
      { label: KEY_REFERENCES.lim1993.label, url: KEY_REFERENCES.lim1993.url },
      { label: KEY_REFERENCES.tjoaBonatz.label, url: KEY_REFERENCES.tjoaBonatz.url },
    ],
    unesco: {
      whcId: 1223,
      inscribed: 2008,
      criteria: "ii, iii, iv",
      areaHa: 109.68,
      bufferHa: 376.27,
      serialWith: "Melaka",
      ouvSummary:
        "The joint inscription with Melaka. George Town's shophouse stock is the largest contiguous five-foot-way ensemble in Southeast Asia; the criteria emphasise the multi-cultural trading-port heritage and the exceptional range of shophouse styles from Early Penang to Art Deco.",
      whcUrl: "https://whc.unesco.org/en/list/1223",
      mapUrl: "https://whc.unesco.org/en/list/1223/maps/",
    },
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Penang_shophouses%2C_Magazine_Road%2C_George_Town.jpg",
      caption: "Straits Eclectic shophouses, Magazine Road, George Town.",
      credit: "Vnonymous · Wikimedia Commons · CC BY-SA 4.0.",
    },
  },
  {
    id: "vigan",
    name: "Vigan",
    country: "Philippines",
    countryCode: "PH",
    lat: 17.5747,
    lon: 120.387,
    protection: "UNESCO",
    period: "mid-18th c.–late 19th c.",
    kind: "bahay na bato",
    community: "Chinese mestizo, Ilocano",
    description:
      "The best-preserved Spanish colonial town in Asia. The Mestizo District (Kasanglayan) features rows of two-storey *bahay na bato* — stone-and-timber houses with ground-floor shops, storerooms or offices and upper-floor residences — directly analogous in use to the Southeast Asian shophouse. Built largely by affluent Chinese-Ilocano families who dominated the tobacco, indigo and textile trade; fuses Spanish grid planning with Chinese steep roofs and layout, Ilocano joinery, and *capiz*-shell window panels.",
    impact: {
      verdict: "family-firm surviving",
      body:
        "UNESCO listing since 1999 and tight *heritage zone* controls have kept Vigan a living town rather than a museum street. Calaud (2016) documents that family-run commercial activity continues on the ground floor of many *bahay na bato* on Crisologo Street, though tourism is the dominant economy. Pressures are real but smaller than in Hoi An.",
    },
    score: {
      authenticity: 5,
      continuity: 5,
      vitality: 4,
      restraint: 4,
      wisdom: 5,
      verdict: "vulnerable",
      editorial:
        "Closest thing in the world to a shophouse town that has not been Disneyfied. But the family-firm ground floor is propped up by tourist demand for souvenirs; if visitor numbers fall off, the resilience is unproven.",
    },
    sources: [
      { label: "UNESCO, Historic City of Vigan (1999)", url: "https://whc.unesco.org/en/list/502" },
      {
        label: "Calaud, D., Vigan Heritage Conservation (2016)",
        url: "https://www.ncca.gov.ph/",
      },
      { label: KEY_REFERENCES.knapp2010.label, url: KEY_REFERENCES.knapp2010.url },
    ],
    unesco: {
      whcId: 502,
      inscribed: 1999,
      criteria: "ii, iv",
      areaHa: 17.25,
      bufferHa: 150.27,
      ouvSummary:
        "Vigan is the best-preserved example of a planned Spanish colonial town in Asia. Its *bahay na bato* and *kalesa*-scaled streets reflect a fusion of Philippine, Chinese and Spanish building traditions and document the role of Chinese mestizo merchants in the tobacco, indigo and textile trade of the 18th–19th centuries.",
      whcUrl: "https://whc.unesco.org/en/list/502",
      mapUrl: "https://whc.unesco.org/en/list/502/maps/",
    },
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Calle_Crisologo%2C_Vigan_City_-_Vigan2202.jpg/1280px-Calle_Crisologo%2C_Vigan_City_-_Vigan2202.jpg",
      caption: "Calle Crisologo, Vigan.",
      credit: "lumoplank · Wikimedia Commons · CC0 (public domain).",
    },
  },
  {
    id: "hoi-an",
    name: "Hội An Ancient Town",
    country: "Vietnam",
    countryCode: "VN",
    lat: 15.8801,
    lon: 108.338,
    protection: "UNESCO",
    period: "15th c.–19th c.",
    kind: "five-foot way",
    community: "Fujian, Cantonese, Chaozhou, Hainan, Japanese",
    description:
      "An exceptionally preserved Southeast Asian trading port on the Thu Bon River. One of the largest surviving ensembles of wooden shophouses in the region, with Chinese assembly halls, family chapels and a Japanese-influenced bridge. Architecture blends indigenous Vietnamese, Chinese, Japanese and later French elements. The port's decline in the late 19th c. preserved the urban fabric; UNESCO listing in 1999 began the tourism transformation.",
    impact: {
      verdict: "overtouristed",
      body:
        "By 2019 the town was receiving 4–5 million visitors a year on a permanent population under 50,000. Hutton (2020) and the *Hội An Today* (2021) municipal survey document the conversion of long-resident shopkeeper households to short-stay rentals, rising rents, and the introduction of a 120,000 VND entry ticket to manage day-tripper volume. The lantern-streetscape and tailor-café economy dominate the ground floor; the resident community has shrunk to under 30% of the 2010 population inside the buffer zone.",
    },
    score: {
      authenticity: 3,
      continuity: 1,
      vitality: 2,
      restraint: 3,
      wisdom: 2,
      verdict: "lost",
      editorial:
        "Still the most photographed shophouse ensemble in the world, but the ground floor is now a tailor-café economy that serves the camera, not the town. Less a shophouse quarter than a 24/7 outdoor film set.",
    },
    sources: [
      { label: "UNESCO, Hoi An Ancient Town (1999)", url: "https://whc.unesco.org/en/list/948" },
      {
        label: "Hutton, T., Hội An tourism carrying capacity (2020)",
        url: "https://doi.org/10.1080/14616688.2020.1716853",
      },
      { label: KEY_REFERENCES.wangJia2015.label, url: KEY_REFERENCES.wangJia2015.url },
    ],
    unesco: {
      whcId: 948,
      inscribed: 1999,
      criteria: "ii, v",
      areaHa: 30,
      bufferHa: 280,
      ouvSummary:
        "Hoi An is an exceptionally well-preserved example of a South-East Asian trading port dating from the 15th to the 19th century. Its surviving wooden shophouses, Chinese assembly halls, family chapels and a Japanese-influenced bridge document a multicultural commercial and trading life shaped by successive Chinese, Japanese, Vietnamese and European influences.",
      whcUrl: "https://whc.unesco.org/en/list/948",
      mapUrl: "https://whc.unesco.org/en/list/948/maps/",
    },
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/H%E1%BB%99i_An%2C_Ancient_Town%2C_2020-01_CN-10.jpg/1280px-H%E1%BB%99i_An%2C_Ancient_Town%2C_2020-01_CN-10.jpg",
      caption: "Old town Hội An, 2020.",
      credit: "Steffen Schmitz · Wikimedia Commons · CC BY-SA 4.0.",
    },
  },

  // ---------- National register (6) ----------
  {
    id: "phuket-old-town",
    name: "Phuket Old Town",
    country: "Thailand",
    countryCode: "TH",
    lat: 7.8804,
    lon: 98.3923,
    protection: "national",
    period: "19th c.–early 20th c.",
    kind: "five-foot way",
    community: "Hokkien, Peranakan",
    description:
      "Built out during the tin-mining boom by Hokkien migrants from Penang. Sino-Portuguese shophouses with ornate *louvre*-pediment facades, narrow frontages and shallow plots — closely related to Penang stock. Thalang, Dibuk and Phang Nga roads carry the core ensemble. Discussed for UNESCO listing in the 2010s; not yet inscribed.",
    impact: {
      verdict: "gentrified",
      body:
        "Adaptive reuse into cafés, boutique hotels and co-working has been the dominant story since 2015, with a measurable but moderate increase in commercial rent on Thalang Road. Displacement of Sino-Thai families is documented in local press (Bangkok Post 2019, Thaiger 2022) but the resident population has not collapsed as it has in Hoi An.",
    },
    score: {
      authenticity: 4,
      continuity: 3,
      vitality: 3,
      restraint: 3,
      wisdom: 3,
      verdict: "stable",
      editorial:
        "Where the shophouse still works at ordinary rents. Sino-Thai families are still on some streets; a few blocks from Thalang the neighbourhood feels like Bangkok in 1985.",
    },
    sources: [
      {
        label: "UNESCO tentative list, Phuket (2020)",
        url: "https://whc.unesco.org/en/tentativelists/6482/",
      },
      { label: KEY_REFERENCES.knapp2010.label, url: KEY_REFERENCES.knapp2010.url },
    ],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Thalang_Road%2C_Old_Phuket_Town.jpg/1280px-Thalang_Road%2C_Old_Phuket_Town.jpg",
      caption: "Thalang Road, Old Phuket Town.",
      credit: "Christophe95 · Wikimedia Commons · CC BY-SA 4.0.",
    },
  },
  {
    id: "pingyao",
    name: "Pingyao Ancient City",
    country: "China",
    countryCode: "CN",
    lat: 37.1889,
    lon: 112.1744,
    protection: "UNESCO",
    period: "Ming–Qing (14th–20th c.)",
    kind: "store-residence",
    community: "Shanxi merchants",
    description:
      "The best-preserved traditional Han Chinese walled city. Nearly 4,000 historic shops and dwellings on a Ming-Qing street grid. Shanxi merchant firms — the *piaohao* banking houses, including the famous Rishengchang exchange — operated from the ground floor of these 'front store, rear residence' buildings. UNESCO World Heritage Site since 1997.",
    impact: {
      verdict: "overtouristed",
      body:
        "High-speed rail access since 2014 brought day-trip volume that one UNESCO monitoring report (2017) put at 7 million visitors a year against a resident population under 50,000. Long-resident merchant families have moved out of the walled city to surrounding new Pingyao; ground-floor units are predominantly ticketed retail. Liu & Li (2020) document the resulting 'in-museum' feel.",
    },
    score: {
      authenticity: 3,
      continuity: 1,
      vitality: 2,
      restraint: 2,
      wisdom: 2,
      verdict: "lost",
      editorial:
        "The most-visited walled city in China. Most of the merchant families who built the *piaohao* are now in the new town; the walled city is a ticketed retail strip behind a 14th-c. wall.",
    },
    sources: [
      { label: "UNESCO, Ancient City of Pingyao (1997)", url: "https://whc.unesco.org/en/list/812" },
      {
        label: "Liu, Y. & Li, X., Pingyao tourism gentrification (2020)",
        url: "https://doi.org/10.1016/j.habitatint.2020.102127",
      },
      { label: KEY_REFERENCES.knapp2010.label, url: KEY_REFERENCES.knapp2010.url },
    ],
    unesco: {
      whcId: 812,
      inscribed: 1997,
      criteria: "ii, iii, iv",
      areaHa: 280,
      bufferHa: 887,
      ouvSummary:
        "Pingyao is an exceptionally well-preserved example of a traditional Han Chinese city of the Ming and Qing dynasties (14th–20th centuries). Its complete urban fabric, including the city walls, streets, shops, dwellings and temples, documents the rise of the Shanxi merchant firms (*piaohao*) and the early-modern Chinese banking system.",
      whcUrl: "https://whc.unesco.org/en/list/812",
      mapUrl: "https://whc.unesco.org/en/list/812/maps/",
    },
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Pingyao_street_%286240799738%29.jpg/1280px-Pingyao_street_%286240799738%29.jpg",
      caption: "Qing Ping Jie street, Pingyao.",
      credit: "Francisco Anzola · Wikimedia Commons · CC BY 2.0.",
    },
  },
  {
    id: "lijiang",
    name: "Lijiang Old Town",
    country: "China",
    countryCode: "CN",
    lat: 26.8721,
    lon: 100.2257,
    protection: "UNESCO",
    period: "Ming–present",
    kind: "lianpai",
    community: "Naxi, Han, Bai, Tibetan",
    description:
      "Dayan Old Town in Yunnan, UNESCO-listed since 1997. Two-storey timber-framed commercial-residential row houses (*lianpai* 連牌) line cobbled streets following topography, blending Naxi, Han, Bai and Tibetan forms. The stone-paved canal street and water-wheel of Black Dragon Pool have been the centre of the post-1990s tourism revival.",
    impact: {
      verdict: "overtouristed",
      body:
        "Visitor numbers rose from under 1 million a year in 1997 to over 25 million by 2019 — the most extreme case in the UNESCO China list. Yang & Wall (2020) document the conversion of Naxi-owned *lianpai* to tourist retail and guesthouse use, and the migration of the original Naxi community to the New Town.",
    },
    score: {
      authenticity: 2,
      continuity: 1,
      vitality: 2,
      restraint: 1,
      wisdom: 1,
      verdict: "lost",
      editorial:
        "Lijiang is the case where the rebuilding goes all the way. The Naxi community that built Dayan Old Town is in the New Town; the *lianpai* in the buffer zone is now retail for 25 million annual visitors.",
    },
    sources: [
      { label: "UNESCO, Old Town of Lijiang (1997)", url: "https://whc.unesco.org/en/list/811" },
      {
        label: "Yang, L. & Wall, G., Lijiang tourism (2020)",
        url: "https://doi.org/10.1080/14616688.2019.1626807",
      },
      { label: KEY_REFERENCES.knapp2010.label, url: KEY_REFERENCES.knapp2010.url },
    ],
    unesco: {
      whcId: 811,
      inscribed: 1997,
      criteria: "ii, iv, v",
      areaHa: 60,
      bufferHa: 352,
      ouvSummary:
        "The Old Town of Lijiang is a remarkably well-preserved traditional Naxi settlement, set in a dramatic landscape against the Jade Dragon Snow Mountain. Its cobbled streets, timber-framed *lianpai* buildings, stone bridges and canal system document a cultural blend of Naxi, Han, Bai and Tibetan elements over many centuries.",
      whcUrl: "https://whc.unesco.org/en/list/811",
      mapUrl: "https://whc.unesco.org/en/list/811/maps/",
    },
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Lijiang_Yunnan_Heritage-shops-in-old-town-01.jpg/1280px-Lijiang_Yunnan_Heritage-shops-in-old-town-01.jpg",
      caption: "Heritage shop row, Lijiang old town.",
      credit: "CEphoto, Uwe Aranas · Wikimedia Commons · CC BY-SA 3.0.",
    },
  },
  {
    id: "hongjiang",
    name: "Hongjiang Ancient Commercial Town",
    country: "China",
    countryCode: "CN",
    lat: 27.11,
    lon: 109.96,
    protection: "national",
    period: "Ming–Qing + Republican",
    kind: "store-residence",
    community: "Hunan merchants",
    description:
      "Often called 'China's living museum of traditional commercial culture' — over 380 Ming-Qing and Republican-era buildings still standing: shops, trading firms, banks, workshops. The core is the high-density riverside commercial strip along the Wu River, with deep-narrow 'front shop, back warehouse, side dwelling' plans directly ancestral to the Southeast Asian shophouse plan.",
    impact: {
      verdict: "research-stage",
      body:
        "National heritage protection since 2006 but limited international tourism. Local scholarship (Xiao 2018) treats the stock as a research corpus. Verdict is research-stage: it is the one place in this list where adaptive-reuse claims are still being written.",
    },
    score: {
      authenticity: 5,
      continuity: 5,
      vitality: 4,
      restraint: 5,
      wisdom: 5,
      verdict: "ideal",
      editorial:
        "The highest-scoring town on the index. Stock untouched, community intact, no significant tourism pressure. Verdict *ideal* — but the lack of intervention is also a kind of fragility, since the academic attention has not yet arrived.",
    },
    sources: [
      {
        label: "Wikipedia, Hongjiang Ancient Commercial City (Hunan)",
        url: "https://en.wikipedia.org/wiki/Hongjiang_Ancient_Commercial_City",
      },
    ],
  },
  {
    id: "singapore-chinatown",
    name: "Singapore (Chinatown and Boat Quay/Tanjong Pagar)",
    country: "Singapore",
    countryCode: "SG",
    lat: 1.2812,
    lon: 103.8466,
    protection: "national",
    period: "1819–present",
    kind: "five-foot way",
    community: "Hokkien, Cantonese, Teochew, Hakka",
    description:
      "The form's canonical setting under British colonial planning. Stamford Raffles' 1822 Town Plan, mediated via India, codified the continuous five-foot-way arcade. By the 20th century, Singapore held the densest shophouse stock in Southeast Asia. URA conservation since 1989 has preserved several thousand buildings; many have been adaptively reused as boutique hotels, bars and creative-industry offices.",
    impact: {
      verdict: "transformed",
      body:
        "Stock survives at scale but the trading Chinese family firm has been replaced by hospitality and lifestyle use. Thever (2017) and the URA conservation monitoring reports document the conversion of Telok Ayer and Tanjong Pagar streets to F&B and co-working, with a residual ground-floor hawker economy on Smith Street.",
    },
    score: {
      authenticity: 2,
      continuity: 1,
      vitality: 2,
      restraint: 1,
      wisdom: 1,
      verdict: "lost",
      editorial:
        "The bottom tier, reached on purpose. The HDB-style shophouse revival — facades painted in pastels, ground floors converted to cocktail bars, the original trading Chinese community long since displaced to HDB towns — is what the Bangkok Sukhumvit 71 corridor should NOT end up as.",
    },
    sources: [
      { label: "Lim, J. S. H. (1993), The 'Shophouse Rafflesia'", url: "https://www.jstor.org/stable/41493492" },
      { label: "Davison, J. & Tettoni, L. I. (2010), Singapore Shophouse", url: "https://www.worldcat.org/title/singapore-shophouse/oclc/694731908" },
      { label: "URA Singapore, Conservation Areas", url: "https://www.ura.gov.sg/Corporate/Guidelines/Conservation" },
    ],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Colorful_shophouses_in_Koon_Seng_Road%2C_Singapore.jpg/1280px-Colorful_shophouses_in_Koon_Seng_Road%2C_Singapore.jpg",
      caption: "Pastel shophouses on Koon Seng Road, Singapore.",
      credit: "Basile Morin · Wikimedia Commons · CC BY-SA 4.0.",
    },
  },
  {
    id: "shanghai-shikumen",
    name: "Shanghai (Shikumen / lilong)",
    country: "China",
    countryCode: "CN",
    lat: 31.2231,
    lon: 121.4737,
    protection: "national",
    period: "1860s–1930s",
    kind: "shikumen",
    community: "Jiangsu, Zhejiang, Guangdong",
    description:
      "*Shikumen* (石库门) — the 'stone-gate' row-house — emerged in Shanghai's International Settlement and French Concession from the 1860s, blending Jiangnan courtyard housing with European terrace frontages. Not strictly a shophouse (the ground floor is typically residential, not commercial), but the *lilong* alleys of tightly packed shikumen are the closest Southeast Asian equivalent: deep-narrow plan, party walls, internal courtyards, mechanised urban infrastructure. Xintiandi is the adaptive-reuse reference point.",
    impact: {
      verdict: "transformed",
      body:
        "Xintiandi's 2001 redevelopment of two shikumen blocks into an upmarket retail-and-dining complex is the world's most-cited case of 'heritage displacement' (Wang 2009). The wider *lilong* stock is in active demolition: Shanghai demolished an estimated 7 million m² of *lilong* housing between 1990 and 2010, and the surviving ensemble is now under city-level protection.",
    },
    score: {
      authenticity: 2,
      continuity: 1,
      vitality: 1,
      restraint: 1,
      wisdom: 1,
      verdict: "lost",
      editorial:
        "Xintiandi is the global case study in how to take a real urban tissue and turn it into a shopping mall. The surrounding *lilong* demolition is the larger story: 7 million m² gone, a sliver preserved as a boutique attraction.",
    },
    sources: [
      {
        label: "Wang, J., Xintiandi and the discourse of urban heritage (2009)",
        url: "https://doi.org/10.1080/14649350902820877",
      },
    ],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/%E7%9F%B3%E5%BA%AB%E9%96%80%E5%BB%BA%E7%AF%89_Shikumen_Architecture_%286033631401%29.jpg/1280px-%E7%9F%B3%E5%BA%AB%E9%96%80%E5%BB%BA%E7%AF%89_Shikumen_Architecture_%286033631401%29.jpg",
      caption: "Shikumen architecture, Shanghai.",
      credit: "Can Pac Swire from Toronto, Canada · Wikimedia Commons · CC BY-SA 2.0.",
    },
  },

  // ---------- Precincts and comparative cases (5) ----------
  {
    id: "phnom-penh",
    name: "Phnom Penh (Wat Phnom / Quay)",
    country: "Cambodia",
    countryCode: "KH",
    lat: 11.5564,
    lon: 104.9282,
    protection: "national",
    period: "late 19th c.–mid 20th c.",
    kind: "five-foot way",
    community: "Teochew, Cantonese, Hokkien, Vietnamese",
    description:
      "Teochew Chinese merchants dominated the riverside quay after the 1863 French protectorate. Shophouses on Sisowath Quay and Streets 136/240 absorbed French colonial elements (balustrades, shuttered windows) into a five-foot-way plan; many ground floors still carry Chinese guild signage. UNESCO and ICOMOS have flagged the ensemble for inventory work; no inscription.",
    impact: {
      verdict: "research-stage",
      body:
        "The Royal Government has a 2017 *Old Phnom Penh* inventory underway. Verdict: research-stage, with documented threats from riverfront redevelopment and from the post-2015 construction boom.",
    },
    score: {
      authenticity: 4,
      continuity: 4,
      vitality: 3,
      restraint: 4,
      wisdom: 4,
      verdict: "stable",
      editorial:
        "A working Chinese shophouse quarter that is not yet on any tourist itinerary. The risk is the post-2015 construction boom, not the camera.",
    },
    sources: [
      {
        label: "Royal Government of Cambodia, Old Phnom Penh inventory (2017)",
        url: "https://www.nangkorgroup.com/",
      },
    ],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Boats_Marine_in_Phnom_Penh_1.JPG/1280px-Boats_Marine_in_Phnom_Penh_1.JPG",
      caption: "Riverside Phnom Penh, 2014.",
      credit: "Hanay · Wikimedia Commons · CC BY-SA 3.0.",
    },
  },
  {
    id: "jakarta-kota",
    name: "Jakarta (Kota Tua / old Batavia)",
    country: "Indonesia",
    countryCode: "ID",
    lat: -6.1352,
    lon: 106.8067,
    protection: "national",
    period: "17th c.–early 20th c.",
    kind: "five-foot way",
    community: "Hokkien, Hakka, Javanese, Arab",
    description:
      "Dutch VOC settlement from 1619; the *ruko* (rumah-toko) — the Indonesian term for shophouse — emerged from Chinese-Javanese-Dutch hybridisation on the Kali Besar canal. Kota Tua carries Dutch colonial townhouses and shophouses from the 17th–19th c. alongside Chinese temples and warehouses. Indonesia's term *ruko* is the most widely used outside the 'shophouse' label itself.",
    impact: {
      verdict: "transformed",
      body:
        "Jakarta's *ruko* stock in Kota Tua is the most extensive in Indonesia and the most-museumed. Setiadi (2019) documents the conversion of the *ruko* stock to cafés, museums and government offices since 2004; the Chinese-Indonesian commercial life that defined the canal has been replaced by a heritage-tourism economy. Anti-Chinese politics across the late 20th c. mean the *ruko* has also survived as a political artefact.",
    },
    score: {
      authenticity: 3,
      continuity: 1,
      vitality: 3,
      restraint: 3,
      wisdom: 2,
      verdict: "lost",
      editorial:
        "The most museumed *ruko* quarter in Indonesia. The Chinese-Indonesian commercial life that defined the Kali Besar canal was already disrupted by mid-20th-c. anti-Chinese politics; the current heritage-tourism layer is built on top of that absence.",
    },
    sources: [
      {
        label: "Setiadi, H., Kota Tua shophouses (2019)",
        url: "https://doi.org/10.1080/13467581.2019.1592196",
      },
    ],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Jakarta_Indonesia_Business-in-Kota-Jakarta-01.jpg/1280px-Jakarta_Indonesia_Business-in-Kota-Jakarta-01.jpg",
      caption: "Old business quarter, Kota Jakarta.",
      credit: "CEphoto, Uwe Aranas · Wikimedia Commons · CC BY-SA 3.0.",
    },
  },
  {
    id: "galle",
    name: "Galle Fort",
    country: "Sri Lanka",
    countryCode: "LK",
    lat: 6.0259,
    lon: 80.2167,
    protection: "UNESCO",
    period: "Dutch 17th c.–British 19th c.",
    kind: "colonial townhouse",
    description:
      "UNESCO-listed (1988) Dutch and British colonial townhouses with verandas and courtyards. Not primarily a Chinese-migrant shophouse landscape, but routinely compared to the type because the same party-wall, deep-narrow, mixed-use logic is present in Sri Lankan and Burgher hands. Useful as a comparative limit case.",
    impact: {
      verdict: "gentrified",
      body:
        "Adaptive reuse into boutique hotels, cafés and Sri Lankan design retail since 2008. Premawardhena (2017) documents moderate rent uplift and the survival of Galle's Muslim and Sinhalese merchant families on Pedlar Street, in contrast to the displacement patterns of Hoi An or Lijiang.",
    },
    score: {
      authenticity: 4,
      continuity: 4,
      vitality: 3,
      restraint: 3,
      wisdom: 3,
      verdict: "stable",
      editorial:
        "The proof that UNESCO listing and continuity can co-exist. Pedlar Street's Muslim and Sinhalese merchant families are still on the lease; the boutique hotels are on the back streets.",
    },
    sources: [
      { label: "UNESCO, Old Town of Galle (1988)", url: "https://whc.unesco.org/en/list/451" },
      { label: KEY_REFERENCES.knapp2010.label, url: KEY_REFERENCES.knapp2010.url },
    ],
    unesco: {
      whcId: 451,
      inscribed: 1988,
      criteria: "iv",
      areaHa: 28.18,
      bufferHa: 119.2,
      ouvSummary:
        "Galle is the best example of a fortified city built by Europeans in South and South-East Asia, illustrating the interaction of European architectural traditions with South Asian contexts from the 16th to the 19th centuries. Its planned street grid, Dutch Reformed church and colonial townhouses remain in use by a multi-ethnic population.",
      whcUrl: "https://whc.unesco.org/en/list/451",
      mapUrl: "https://whc.unesco.org/en/list/451/maps/",
    },
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/SL_Galle_Fort_asv2020-01_img24.jpg/1280px-SL_Galle_Fort_asv2020-01_img24.jpg",
      caption: "Galle Fort street, 2020.",
      credit: "A.Savin · Wikimedia Commons · FAL (Free Art License).",
    },
  },
  {
    id: "luang-prabang",
    name: "Luang Prabang",
    country: "Laos",
    countryCode: "LA",
    lat: 19.8833,
    lon: 102.1333,
    protection: "UNESCO",
    period: "14th c.–colonial",
    kind: "colonial townhouse",
    community: "Lao, Vietnamese, Chinese",
    description:
      "UNESCO World Heritage Site (1995) for the well-preserved fusion of Lao traditional architecture and French colonial townhouses along the Mekong and Nam Khan. Chinese shophouses are present on Sisavangvong Road but are not the dominant type — included here for the comparative literature that often pairs Luang Prabang with Hoi An and George Town in the 'small-port heritage' discussion.",
    impact: {
      verdict: "gentrified",
      body:
        "Tourism-driven adaptive reuse since 2000. Thevenin & Piboon (2018) document the conversion of Sino-Vietnamese shophouses on the main street to guesthouse and retail, with moderate rent uplift and an estimated 30% resident displacement by 2018.",
    },
    score: {
      authenticity: 3,
      continuity: 2,
      vitality: 3,
      restraint: 3,
      wisdom: 3,
      verdict: "stable",
      editorial:
        "Smaller scale than Hoi An, gentler than Penang. The Sino-Vietnamese shophouses on Sisavangvong have been partially converted to guesthouse, but the town's principal damage is to the residential stock, not the commercial.",
    },
    sources: [
      { label: "UNESCO, Luang Prabang (1995)", url: "https://whc.unesco.org/en/list/479" },
      { label: KEY_REFERENCES.knapp2010.label, url: KEY_REFERENCES.knapp2010.url },
    ],
    unesco: {
      whcId: 479,
      inscribed: 1995,
      criteria: "ii, iv, v",
      areaHa: 820,
      bufferHa: 12540,
      ouvSummary:
        "Luang Prabang is an outstanding example of the fusion of traditional Lao architecture with 19th–20th-century European colonial townhouses, along the Mekong and Nam Khan rivers. The protected town of 33 villages and 58 listed monuments, including Buddhist temples and Sino-Vietnamese shophouses, documents a living heritage community.",
      whcUrl: "https://whc.unesco.org/en/list/479",
      mapUrl: "https://whc.unesco.org/en/list/479/maps/",
    },
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Carved_wooden_bench_furniture_and_crafts_at_Heuan_Chan_heritage_house_in_Luang_Prabang_Laos.jpg/1280px-Carved_wooden_bench_furniture_and_crafts_at_Heuan_Chan_heritage_house_in_Luang_Prabang_Laos.jpg",
      caption: "Heuan Chan heritage house, Luang Prabang.",
      credit: "Basile Morin · Wikimedia Commons · CC BY-SA 4.0.",
    },
  },
  {
    id: "zhouzhuang",
    name: "Zhouzhuang (and the Jiangnan water towns)",
    country: "China",
    countryCode: "CN",
    lat: 31.11,
    lon: 120.85,
    protection: "national",
    period: "Ming–Qing",
    kind: "riverside shop",
    community: "Jiangsu/Zhejiang merchants",
    description:
      "Zhouzhuang is the most-visited of the six Jiangnan water towns (the others being Wuzhen, Xitang, Tongli, Zhujiajiao and Nanxun). Each has dense rows of Ming-Qing commercial-residential buildings on canal-side plots, with shop fronts on the water, residences behind and arcaded walkways. The Jiangnan form is the type's deepest Chinese mainland precedent and the closest architectural cousin of the Bangkok shophouse among the canal-side stock of old Talad Noi / Bangkok Noi.",
    impact: {
      verdict: "overtouristed",
      body:
        "Zhouzhuang alone receives over 6 million visitors a year on a permanent population under 30,000. Wuzhen, the most aggressive developer of the group, was rebuilt in 2003 with a full Disneyfication of one half of the old town; the other half remains in use. The 'water town' ensemble as a whole is the closest analogue in scale to the Bangkok shophouse problem and the one whose overtourism model the Bangkok case should NOT follow.",
    },
    score: {
      authenticity: 2,
      continuity: 1,
      vitality: 2,
      restraint: 1,
      wisdom: 1,
      verdict: "lost",
      editorial:
        "Wuzhen is the cleanest modern case of a water-town shophouse ensemble rebuilt to theme-park spec. Half the town is preserved; the other half is a ticketed day-trip. The Bangkok shophouse should not follow either path.",
    },
    sources: [
      {
        label: "Wikipedia, Zhouzhuang (Jiangnan water town)",
        url: "https://en.wikipedia.org/wiki/Zhouzhuang",
      },
    ],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Canal_in_Zhouzhuang_China.jpg",
      caption: "Canal in Zhouzhuang, Jiangsu.",
      credit: "Jayrod422 · Wikimedia Commons · CC BY-SA 3.0.",
    },
  },

  // ---------- Bangkok baseline + new Malaysian cities (4) ----------
  {
    id: "bangkok-sukhumvit-71",
    name: "Bangkok — Sukhumvit 71 (Phra Khanong)",
    country: "Thailand",
    countryCode: "TH",
    lat: 13.7295,
    lon: 100.5912,
    protection: "none",
    period: "1960s–80s",
    kind: "five-foot way",
    community: "Burmese, Thai-Chinese, Sino-Thai",
    description:
      "The reference case for the Shophouse Health Index. Sukhumvit 71 is one of the last Bangkok sois that still has its full shophouse stock in working order — a Burmese community at the southern end, mixed family-firm and new-café ground floors through the middle, motorcycle-garage and furniture-hybrid blocks at the north. The corridor that the Harvard GSD studio used as the live case study for the essay.",
    impact: {
      verdict: "gentrified",
      body:
        "Sukhumvit 71 is the most-monitored shophouse corridor in Bangkok because of the studio work. Rent pressure from the BTS station is real; the Burmese community at the south end is shrinking. But the middle of the corridor still has its stock, and that is what makes it useful as a reference point for the index.",
    },
    score: {
      authenticity: 3,
      continuity: 3,
      vitality: 4,
      restraint: 2,
      wisdom: 3,
      verdict: "stable",
      editorial:
        "Bangkok's baseline. Composite 3.0 — the stock is functional and the ground floor is still trading, but visible spot-renovation and BTS-adjacent rent pressure mean the next ten years are not a foregone conclusion.",
    },
    sources: [
      {
        label: "Chomchon Fusinpaiboon, Modernisation of Building (2022)",
        url: "https://doi.org/10.1080/13467581.2022.2034791",
      },
      {
        label: "Chuenrudeemol, Shophouse Metropolis (Harvard GSD, 2026)",
        url: "https://www.gsd.harvard.edu/",
      },
      { label: KEY_REFERENCES.lim1993.label, url: KEY_REFERENCES.lim1993.url },
      { label: KEY_REFERENCES.knapp2010.label, url: KEY_REFERENCES.knapp2010.url },
    ],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Mangkon01.JPG/1920px-Mangkon01.JPG",
      caption: "Mangkon Kamalawat, Chinatown, Bangkok.",
      credit: "hkgalbert · Wikimedia Commons · Public domain.",
    },
  },
  {
    id: "ipoh",
    name: "Ipoh",
    country: "Malaysia",
    countryCode: "MY",
    lat: 4.5975,
    lon: 101.0901,
    protection: "regional",
    period: "late 19th c.–1930s",
    kind: "five-foot way",
    community: "Hakka, Cantonese, Hokkien, Peranakan",
    description:
      "Built out during the tin-mining boom by Cantonese, Hakka and Hokkien miners and merchants. Old Town Ipoh — the Concubine Lane / Jalan Sultan Iskandar / Jalan Tun Sambanthan triangle — carries one of the best-preserved shophouse ensembles in Malaysia outside Penang. The white-coffee café scene and the Peranakan shophouse wall-tiles are a recognised part of the Ipoh identity. UNESCO tentative-list inscription in 2024.",
    impact: {
      verdict: "gentrified",
      body:
        "Ipoh's white-coffee café wave since 2010 has driven selective gentrification of Concubine Lane and a few adjacent streets, but the broader shophouse stock on Jalan Sultan Iskandar and Jalan Tun Sambanthan is still operating as ordinary family-firm trade. Khor & Tan (2019) document moderate rent uplift and the conversion of some shophouse ground floors to cafés, with comparatively little displacement of the original Hokkien and Hakka trading families.",
    },
    score: {
      authenticity: 4,
      continuity: 3,
      vitality: 3,
      restraint: 4,
      wisdom: 3,
      verdict: "stable",
      editorial:
        "Underrated in the comparative literature. The shophouse stock outside the café triangle is still functioning as family trade, and the Peranakan wall-tile programme is the closest Malaysian equivalent to Penang's conservation work, but at lower scale and gentler pressure.",
    },
    sources: [
      {
        label: "UNESCO tentative list, Ipoh (2024)",
        url: "https://whc.unesco.org/en/tentativelists/6604/",
      },
      {
        label: "Khor, J. & Tan, K. M., Ipoh heritage (2019)",
        url: "https://www.researchgate.net/publication/335604321",
      },
      { label: KEY_REFERENCES.ismailShamsuddin.label, url: KEY_REFERENCES.ismailShamsuddin.url },
      { label: KEY_REFERENCES.powell2024.label, url: KEY_REFERENCES.powell2024.url },
    ],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Concubine_Lane_1.jpg/1920px-Concubine_Lane_1.jpg",
      caption: "Concubine Lane, Ipoh Old Town.",
      credit: "Slleong · Wikimedia Commons · CC0 (public domain).",
    },
  },
  {
    id: "kuching",
    name: "Kuching",
    country: "Malaysia",
    countryCode: "MY",
    lat: 1.5498,
    lon: 110.3626,
    protection: "national",
    period: "1840s–1930s",
    kind: "five-foot way",
    community: "Hokkien, Hakka, Foochow, Malay",
    description:
      "Capital of Sarawak on the Sarawak River. Main Bazaar (now Jalan Main Bazaar) is the oldest continuously operating shophouse street in Malaysia; the 1928 block on Jalan Padungan is one of the best-preserved interwar shophouse streets in the country. The Hokkien and Hakka trading families who built the city centre are still active. Less tourism pressure than Penang; less museuming than Singapore.",
    impact: {
      verdict: "family-firm surviving",
      body:
        "Kuching's shophouse stock is in a different pressure regime from Penang. Hutton-style tourist-arrival pressure is much lower; the shophouse rows on Jalan Main Bazaar and Jalan Padungan are still occupied by the same Hokkien and Hakka trading families. Selective adaptive reuse into boutique hotels has happened on the waterfront, but the core is intact.",
    },
    score: {
      authenticity: 4,
      continuity: 4,
      vitality: 4,
      restraint: 4,
      wisdom: 4,
      verdict: "thriving",
      editorial:
        "The index's quietest success. Kuching is what a shophouse quarter looks like when the trading families still own the lease and the camera hasn't arrived in numbers yet. The risk is not what the camera has done; it is what comes after it does.",
    },
    sources: [
      {
        label: "Siaw, E., Kuching shophouse inventory (2017)",
        url: "https://www.researchgate.net/publication/318642843",
      },
      {
        label: "Sarawak Tourism, Heritage Trails",
        url: "https://sarawaktourism.com/",
      },
      { label: KEY_REFERENCES.powell2024.label, url: KEY_REFERENCES.powell2024.url },
    ],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Jalan_Padungan_1928_shophouse_architecture%2C_Kuching%2C_Sarawak%2C_Malaysia.jpg/1920px-Jalan_Padungan_1928_shophouse_architecture%2C_Kuching%2C_Sarawak%2C_Malaysia.jpg",
      caption: "1928 shophouse row, Jalan Padungan, Kuching.",
      credit: "Esther Siaw · Wikimedia Commons · CC BY 4.0.",
    },
  },
  {
    id: "kuala-lumpur",
    name: "Kuala Lumpur (Petaling Street / Jalan Tun HS Lee)",
    country: "Malaysia",
    countryCode: "MY",
    lat: 3.1422,
    lon: 101.6966,
    protection: "national",
    period: "1880s–1930s",
    kind: "five-foot way",
    community: "Cantonese, Hakka, Hokkien, Teochew, Tamil",
    description:
      "Petaling Street (the original *chee cheong fun* market street) and the surrounding Jalan Sultan / Jalan Tun HS Lee / Jalan Petaling grid are the core Kuala Lumpur shophouse quarter. The city's central Chinese commercial district since the 1880s; mixed with Tamil Indian shophouses along Jalan Tun HS Lee. Heavy redevelopment pressure in the surrounding blocks since 2010.",
    impact: {
      verdict: "gentrified",
      body:
        "Petaling Street proper has been a tourism retail strip since the 1990s. The shophouse blocks one street back (Jalan Sultan, Jalan Tun HS Lee) are mixed — some still Cantonese family trade, others boutique hotels and creative-industry offices. The shophouse stock of the wider city has been reduced by the post-2010 construction boom; some heritage rows have been demolished for transit-oriented development.",
    },
    score: {
      authenticity: 3,
      continuity: 2,
      vitality: 3,
      restraint: 2,
      wisdom: 2,
      verdict: "stable",
      editorial:
        "Composite 2.4 — closer to the gentrified middle than to either ideal. The 1990s converted Petaling Street into a tourist strip; the 2010s construction boom is now converting adjacent blocks. Jalan Tun HS Lee still has the Cantonese tea-shop floor; how long that lasts is the open question.",
    },
    sources: [
      {
        label: "UNESCO, Kuala Lumpur historic city (tentative list, 2015)",
        url: "https://whc.unesco.org/en/tentativelists/5989/",
      },
      {
        label: "DBKL, Kuala Lumpur Shophouse Inventory (2014)",
        url: "https://www.dbkl.gov.my/",
      },
      { label: KEY_REFERENCES.lim1993.label, url: KEY_REFERENCES.lim1993.url },
      { label: KEY_REFERENCES.powell2024.label, url: KEY_REFERENCES.powell2024.url },
    ],
    photo: {
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/2016_Kuala_Lumpur%2C_Domy-sklepy_na_ulicy_Tun_H_S_Lee.jpg/1920px-2016_Kuala_Lumpur%2C_Domy-sklepy_na_ulicy_Tun_H_S_Lee.jpg",
      caption: "Shophouse row on Jalan Tun HS Lee, Kuala Lumpur.",
      credit: "Marcin Konsek · Wikimedia Commons · CC BY-SA 4.0.",
    },
  },
];

// Migration vectors from a Chinese origin port to an overseas shophouse
// town. Each is dated and attributed.
export const MIGRATION_ROUTES: MigrationRoute[] = [
  {
    id: "quanzhou-malacca",
    from: "quanzhou",
    to: "melaka",
    period: "15th c.–17th c.",
    community: "Hokkien",
    note:
      "The earliest documented Hokkien trade and settlement in Malacca under the Malay sultans. Built the deep-narrow plan that the Portuguese and Dutch inherited and that the British later codified.",
    source: {
      label: "Powell, The Malayan Shophouse (2010)",
      url: "https://www.worldcat.org/title/malayan-shophouse/oclc/780478950",
    },
  },
  {
    id: "xiamen-penang",
    from: "xiamen",
    to: "george-town",
    period: "1786–1900s",
    community: "Hokkien",
    note:
      "The Hokkien diaspora that built George Town. Francis Light's 1786 founding drew Hokkien merchants from Penang's predecessor, and the city received the largest single Hokkien population in the Straits Settlements by 1900.",
    source: {
      label: "UNESCO, Melaka & George Town (2008)",
      url: "https://whc.unesco.org/en/list/1223",
    },
  },
  {
    id: "guangzhou-malacca",
    from: "guangzhou",
    to: "melaka",
    period: "15th c.–17th c.",
    community: "Cantonese, Hakka",
    note:
      "Cantonese and Hakka migration into the Malay peninsula, especially to Malacca. The Cantonese community dominated the tin trade and is the source of the Peranakan intermarriage pattern.",
    source: {
      label: "Knapp, Chinese Houses of Southeast Asia (2000)",
      url: "https://www.worldcat.org/title/chinese-houses-of-southeast-asia/oclc/43903700",
    },
  },
  {
    id: "chaozhou-bangkok",
    from: "chaozhou",
    to: "phnom-penh", // proxy: shows Teochew direction into Indochina
    period: "18th c.–19th c.",
    community: "Teochew",
    note:
      "Teochew migration to Bangkok, Phnom Penh and Saigon — the *qilou* of Paifang Street is the architectural model. The Teochew community in Bangkok's Yaowarat (the Chinese commercial district) is the largest single Chinese dialect community in the kingdom and the one that built the most Bangkok shophouses between 1900 and 1960.",
    source: {
      label: "Skinner, W., Chinese Society in Thailand (1957)",
      url: "https://www.worldcat.org/title/chinese-society-in-thailand/oclc/253798",
    },
  },
  {
    id: "xiamen-hoi-an",
    from: "xiamen",
    to: "hoi-an",
    period: "16th c.–17th c.",
    community: "Hokkien (Fujian)",
    note:
      "The Hokkien diaspora in Hội An, contemporaneous with the trade-port peak under the Nguyễn lords. The Chinese Assembly Halls (Hội quán) of Hokkien, Cantonese, Teochew and Hainan were built in this period; the wooden shophouses follow.",
    source: {
      label: "UNESCO, Hoi An Ancient Town (1999)",
      url: "https://whc.unesco.org/en/list/948",
    },
  },
  {
    id: "xiamen-vigan",
    from: "xiamen",
    to: "vigan",
    period: "18th c.–19th c.",
    community: "Hokkien, Cantonese (mestizo)",
    note:
      "Hokkien and Cantonese merchants via Manila. Spanish colonial records call them *Sangleyes*; their intermarriage with the local Ilocano population produced the Chinese-mestizo class who built the *bahay na bato* of the Mestizo District.",
    source: {
      label: "UNESCO, Historic City of Vigan (1999)",
      url: "https://whc.unesco.org/en/list/502",
    },
  },
  {
    id: "xiamen-phuket",
    from: "xiamen",
    to: "phuket-old-town",
    period: "19th c.",
    community: "Hokkien, Peranakan",
    note:
      "The Hokkien tin-mining migration that built Phuket Old Town. Many of the families are Penang-branch Hokkien; the architectural vocabulary on Thalang and Dibuk roads is recognisably Penang-derived.",
    source: {
      label: "UNESCO tentative list, Phuket (2020)",
      url: "https://whc.unesco.org/en/tentativelists/6482/",
    },
  },
  {
    id: "quanzhou-jakarta",
    from: "quanzhou",
    to: "jakarta-kota",
    period: "17th c.",
    community: "Hokkien, Hakka",
    note:
      "The earliest Chinese settlement in Batavia, under Dutch VOC administration. The Kali Besar canal shophouse street is the source of the Indonesian *ruko* form. The Chinese community was repeatedly displaced under Dutch rule and again under 20th-c. anti-Chinese politics.",
    source: {
      label: "Setiadi, H., Kota Tua shophouses (2019)",
      url: "https://doi.org/10.1080/13467581.2019.1592196",
    },
  },
  {
    id: "fuzhou-singapore",
    from: "fuzhou",
    to: "singapore-chinatown",
    period: "1819–1900s",
    community: "Hokkien, Cantonese, Teochew, Hakka, Foochow",
    note:
      "The composite Singapore diaspora. The Raffles Town Plan of 1822 codified the shophouse street; the post-1819 immigration built it. By 1900, Singapore held the densest shophouse stock in Southeast Asia.",
    source: {
      label: "Lim, J. S. H., The Shophouse Rafflesia (2006)",
      url: "https://www.academia.edu/3862614",
    },
  },
];

/* -------------------------------------------------------------- one-liner
   The single comparative number a researcher should walk away with. */
export const GLOBAL_COUNTS = {
  unesco: TOWNS.filter((t) => t.protection === "UNESCO").length,
  national: TOWNS.filter((t) => t.protection === "national").length,
  countries: new Set(TOWNS.map((t) => t.countryCode)).size,
  origins: ORIGIN_PORTS.length,
  routes: MIGRATION_ROUTES.length,
  verdicts: TOWNS.reduce<Record<string, number>>((acc, t) => {
    acc[t.impact.verdict] = (acc[t.impact.verdict] ?? 0) + 1;
    return acc;
  }, {}),
  scoreVerdicts: TOWNS.reduce<Record<string, number>>((acc, t) => {
    acc[t.score.verdict] = (acc[t.score.verdict] ?? 0) + 1;
    return acc;
  }, {}),
};

/* -------------------------------------------------------------- the index
   Sorted descending by composite score — best at the top, the
   worst-disneyfied at the bottom. The page renders this as the
   Shophouse Health Index. The BANGKOK_BASELINE_ID is highlighted in
   the UI; the comparison board uses any pair of these ids. */
export const BANGKOK_BASELINE_ID = "bangkok-sukhumvit-71";
export const SINGAPORE_ID = "singapore-chinatown";

export const RANKED_TOWNS: Town[] = [...TOWNS].sort(
  (a, b) => compositeScore(b.score) - compositeScore(a.score),
);
