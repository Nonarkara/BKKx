// THE SHOPHOUSE BIBLE
//
// A reference document for the Bangkok shophouse (ตึกแถว), assembled from
// every source read for the Shophouse Metropolis studio essay. The problem
// it exists to solve: this research has been done, repeatedly, for forty
// years — and every new thesis re-derives the same measurements because the
// previous ones are unfindable. Everything here carries its source, its
// sample size and its disagreements.
//
// Where sources conflict, BOTH numbers are shown. A reference that hides
// disagreement to look authoritative is worse than no reference at all,
// because the next person cites the tidy version and the error propagates.
//
// Dedicated to Chamnarn Tirapas, whose eight-element spatial taxonomy is the
// analytical spine of this document.

export const DEDICATION = {
  name: "Chamnarn Tirapas",
  nameTh: "ชำนาญ ถิรพาส",
  affiliation: "School of Architecture and Design, King Mongkut's University of Technology Thonburi",
  text:
    "This work is dedicated to the late Dr Chamnarn Tirapas of the School of Architecture and Design, King Mongkut's University of Technology Thonburi — a leading expert on the Bangkok shophouse, whom I came to know during my first year as senior expert at depa, when we found ourselves working on the same smart-city problem from opposite ends. He was energetic, down to earth, funny and deeply caring. None of us knew how little time there would be. This is for him.",
  why:
    "The anatomy in this document is his. Tirapas surveyed 100 shophouses across high- and mid-density Bangkok and, applying John Habraken's method of 'looking type', resolved the building into eight spatial elements and three levels of physical control. Everything downstream — which parts of a shophouse can change, which cannot, and why the stair decides the building's fate — follows from that framework. He also proposed the fix, in print, years before anyone else in this bibliography: put the stair in the middle.",
  bio: "B.Arch (1999) SoAD, KMUTT; M.Arch (2004) College of Architecture and Planning, Ball State University. Lecturer, Architecture Programme, SoAD, KMUTT. Interests: collective housing, residential design, contemporary living in the urban context.",
  paper: {
    title: "Bangkok Shophouse: An Approach for Quality Design Solutions",
    venue: "School of Architecture and Design, KMUTT",
    url: "https://soad.kmutt.ac.th/wp-content/uploads/2018/10/2011IntC2.pdf",
  },
} as const;

/* ---------------------------------------------------------------- anatomy */

export type SpatialElement = {
  code: string;
  name: string;
  definition: string;
  behaviour: string;
};

/** Tirapas's eight spatial elements, from a survey of 100 shophouses. */
export const ELEMENTS: SpatialElement[] = [
  {
    code: "F",
    name: "Front entrance",
    definition:
      "The space at the front, connecting to the street or public space. One of the least defined — it conflicts either public or private space.",
    behaviour:
      "Claimed by inhabitants with overhang, furniture, plants or a change of paving. Often rented out to a vendor or a small booth.",
  },
  {
    code: "T",
    name: "Terrace",
    definition:
      "Roughly one metre on the front façade, connecting private to public for recreation.",
    behaviour:
      "A controversial space. Nominally private but expressing the private to the public — and in practice colonised for service: drying clothes, air-conditioning plant, potted plants. Its original essence has been lost.",
  },
  {
    code: "H",
    name: "Hall",
    definition:
      "Immediately inside the front entrance. Multipurpose — living, commercial, or both. Normally double height with small windows on the front façade for light and air.",
    behaviour:
      "Varies in size but always at the front. Its volume and double-storey height create a sense of welcome and the opportunity for commercial space. Can be subdivided into Rooms.",
  },
  {
    code: "RM",
    name: "Room",
    definition:
      "An enclosed space defined by internal wall, or an unenclosed one defined by furniture or equipment, on any floor — ground, mezzanine or typical.",
    behaviour:
      "Any function except those belonging to Service. On upper floors the priority room sits next to the front and back façades; the second-priority room goes to the inner area next to the major one.",
  },
  {
    code: "S",
    name: "Service area",
    definition:
      "Kitchen, bathroom, washing area, drying area. NOT provided in the original shophouse.",
    behaviour:
      "Added by inhabitants — in the middle, extended to the back, or placed on the roof deck. On upper floors it goes in the middle or at the back, which Tirapas reads as a Thai cultural rule: private and service spaces are kept away from the public.",
  },
  {
    code: "B",
    name: "Back area",
    definition:
      "The space from the property line to the shophouse. Regulation requires at least 3 m as building setback.",
    behaviour: "Very frequently built over anyway, and used as service area.",
  },
  {
    code: "R",
    name: "Roof deck",
    definition:
      "The space on top, which exists only on the flat-roof type — a vertical extension of the shophouse.",
    behaviour: "Built out for bedrooms or service. The flat roof is the more popular of the two roof types precisely because it allows this.",
  },
  {
    code: "C",
    name: "Circulation",
    definition:
      "What connects the elements. Physically the stair — normally L-shaped, attached to one of the party walls at the back.",
    behaviour:
      "Not only a path but an unclear functional space; on upper floors it is a multi-purpose area, public or private. Its position at the back frees the front for commerce on the ground floor — and starves the middle of the upper floors of light.",
  },
];

/** Habraken's hierarchical control levels, as Tirapas applies them. */
export const CONTROL_LEVELS = [
  {
    level: "Dominant",
    parts: "Columns, beams, floor, roof floor",
    note: "The structure. Restricts everything below it; effectively unchangeable by an occupant.",
  },
  {
    level: "Lower",
    parts: "Floor finishing, party wall, internal and external walls, stairs",
    note: "Moved or changed according to the restrictions the dominant level sets. This is where adaptation actually happens — and where the law intervenes.",
  },
  {
    level: "Lowest",
    parts: "Furniture and household equipment",
    note: "Outside Tirapas's study, but the level at which most inhabitants actually redesign their shophouse.",
  },
] as const;

/* ------------------------------------------------------------- dimensions */

export type DimensionRow = {
  metric: string;
  value: string;
  source: string;
  sample: string;
  year: number;
};

/**
 * The measured record, consolidated. Note the disagreements — they are the
 * most useful thing in this table. There is no single canonical shophouse
 * dimension, and any thesis that states one without a sample size is
 * repeating somebody else's.
 */
export const DIMENSIONS: DimensionRow[] = [
  {
    metric: "Structural module",
    value: "4.0 × 4.0 m",
    source: "Tirapas, Bangkok Shophouse: An Approach for Quality Design Solutions",
    sample: "survey of 100 shophouses, high- and mid-density Bangkok",
    year: 2011,
  },
  {
    metric: "Column",
    value: "20 × 20 cm reinforced concrete",
    source: "Tirapas",
    sample: "same survey",
    year: 2011,
  },
  {
    metric: "Frontage : depth ratio",
    value: "1:1 up to 1:6 toward the back",
    source: "Tirapas",
    sample: "same survey",
    year: 2011,
  },
  {
    metric: "Frontage",
    value: "3.51–4.00 m in 47.4% of units",
    source: "Chantawarang, cited in Luangamornlert",
    sample: "n = 156",
    year: 1985,
  },
  {
    metric: "Depth",
    value: "10.01–12.00 m in 36.5% of units",
    source: "Chantawarang, cited in Luangamornlert",
    sample: "n = 156",
    year: 1985,
  },
  {
    metric: "Typical unit",
    value: "4.00 m × 12.00 m, 4–6 storeys",
    source: "Luangamornlert, Adaptive Reuse of Old Shophouses in Bangkok",
    sample: "5 units surveyed, Siam Square; dimensions from Chantawarang",
    year: 2015,
  },
  {
    metric: "Unit range (1960s–70s row)",
    value: "3.5–4 m wide × 12–16 m deep, 2–5 storeys",
    source: "Fusinpaiboon, Journal of Asian Architecture and Building Engineering 21(5)",
    sample: "typological description",
    year: 2022,
  },
  {
    metric: "Storey heights",
    value: "ground ~3.5 m, upper ~3 m, ~1 m cantilevered eaves",
    source: "Fusinpaiboon",
    sample: "typological description",
    year: 2022,
  },
  {
    metric: "Tha Tien types 1–9",
    value: "width 2.80–3.60 m, depth 9.00–14.00 m, 1–4 storeys",
    source: "Lin Sheng-Man, Regeneration of Chinese Urban Heritage: Tha Tien",
    sample: "~332 shophouses surveyed; drawings are typological composites, not as-builts",
    year: 2014,
  },
  {
    metric: "Alley width, Tha Tien",
    value: "3.0–3.6 m",
    source: "Lin Sheng-Man",
    sample: "field survey; named as a factor in commercial devaluation",
    year: 2014,
  },
  {
    metric: "Stair width",
    value: "1.00–1.20 m",
    source: "Luangamornlert",
    sample: "measured",
    year: 2015,
  },
  {
    metric: "Rear service strip",
    value: "3 m — set by the regulation, not by design",
    source: "Ministerial Regulation No. 55 B.E. 2543, ข้อ 34",
    sample: "statutory minimum",
    year: 2000,
  },
  {
    metric: "Median candidate, Sukhumvit 71",
    value: "4.5 m frontage × 12.6 m depth",
    source: "This study — OSM footprint morphology screen",
    sample: "683 candidates within 120 m of the road spine; unverified, geometry only",
    year: 2026,
  },
];

/* ------------------------------------------------------------- regulation */

export type Rule = {
  clause: string;
  rule: string;
  consequence: string;
};

/** The legal cage. This is what makes the shophouse the shape it is. */
export const REGULATION: Rule[] = [
  {
    clause: "Ministerial Reg. No. 55 B.E. 2543, ข้อ 1",
    rule:
      "ตึกแถว is a building built continuously in a row of two or more คูหา, divided by party walls, predominantly of fire-resistant material. ห้องแถว is the same in non-fire-resistant material.",
    consequence:
      "The distinction that separates the concrete shophouse from its timber predecessor is legal, not architectural.",
  },
  {
    clause: "ข้อ 2",
    rule:
      "Each คูหา: width ≥ 4 m (column centreline to centreline); depth ≥ 4 m and ≤ 24 m; ground-floor area ≥ 30 m². If depth exceeds 16 m, an uncovered void of ≥ 10% of ground-floor area between 12 and 16 m depth.",
    consequence:
      "The 4 m module is a floor set by law. Tirapas's surveyed 4 m module is the regulation made visible.",
  },
  {
    clause: "ข้อ 4",
    rule: "Continuous construction ≤ 10 คูหา and total row length ≤ 40 m, regardless of ownership.",
    consequence:
      "Why long shophouse streets break into readable blocks with gaps. The rhythm you see from the pavement is a fire rule.",
  },
  {
    clause: "ข้อ 17",
    rule:
      "A firewall every ≤ 5 คูหา, continuous floor to roof deck; rising ≥ 30 cm above a non-fire-resistant roof.",
    consequence: "The second rhythm, at half the interval of the first.",
  },
  {
    clause: "ข้อ 22(4)",
    rule: "Ground floor ≥ 3.50 m; second floor and above ≥ 3.00 m.",
    consequence:
      "The high ceilings that make these buildings survivable without air conditioning are statutory minima, not a design gift.",
  },
  {
    clause: "ข้อ 34",
    rule:
      "Rear open space ≥ 3 m, continuous between units, no encroachment except an external fire stair projecting ≤ 1.40 m.",
    consequence:
      "The back strip that every inhabitant builds over. Tirapas's Back area (B) is this rule, plus the near-universal breach of it.",
  },
  {
    clause: "ข้อ 41",
    rule:
      "Setback from public road centreline: 3 m; 6 m where the road is under 10 m wide, for buildings over 2 storeys or 8 m — including ตึกแถว.",
    consequence:
      "THE decisive clause. An old shophouse occupies its whole plot because it predates this. Demolish it and the replacement must step back onto ground that, on a 12 m plot, is most of the site — so on many plots you cannot lawfully rebuild what you tear down.",
  },
  {
    clause: "Ministerial Reg. No. 11 B.E. 2528, ข้อ 2",
    rule:
      "Removing a reinforced-concrete awning, structural or RC wall, RC stair, or RC floor from the second storey up counts as DEMOLITION, not modification.",
    consequence:
      "The single change that would unlock a shophouse's upper floors — moving the stair — is legally a demolition, triggering full compliance with a code the building cannot meet.",
  },
  {
    clause: "Building Control Act B.E. 2522, s.21 / s.39 ทวิ",
    rule:
      "Permit required to construct, modify or relocate; or notification with licensed architect and engineer certifying compliance with all current regulations, including accessibility.",
    consequence: "There is no light-touch route for a small owner. The compliance floor is the same as for a tower.",
  },
  {
    clause: "กฎกระทรวง โรงแรม พ.ศ. 2559, ข้อ 6",
    rule:
      "For an existing building converting to a small hotel: building line, clearances, distances and PARKING judged by the rules in force when the building was first permitted — not current code. Stairs and corridors converted from ห้องแถว/ตึกแถว need only 200 kg/m² live load.",
    consequence:
      "Proof that the exception can be written. It worked, was extended three times, and reportedly ran to August 2024. Status since then unverified — check before relying on it.",
  },
];

/* ---------------------------------------------------------------- corpus */

export const STOCK_RECORD = [
  { year: "1907", figure: "2,430 shophouses in Samphanthawong district alone", source: "Quin Limp (2010), from the 1907 cadastral survey" },
  { year: "1960s", figure: "More than 50% of all urban building construction in Thailand was shophouses", source: "Fusinpaiboon (2022)" },
  { year: "mid-1970s", figure: "~70% of Bangkok's 2.8 million people lived in one — about 400,000 units", source: "Fusinpaiboon (2022)" },
  { year: "1960s–70s peak", figure: "~750,000 units", source: "Chuenrudeemol, Shophouse Metropolis (2026)" },
  { year: "2010", figure: "~310 of the 1907 Samphanthawong stock surviving — roughly 87% lost", source: "Quin Limp (2010)" },
  { year: "2014", figure: "~332 shophouses surveyed at Tha Tien; 103 under renovation; 7 hotels in reused units", source: "Lin Sheng-Man (2014)" },
  { year: "2021", figure: "525,889 vacant residential and commercial units across the Bangkok Metropolitan Region — ALL typologies, not shophouses alone", source: "Pornchokchai (2019), cited in Imam (2021)" },
  { year: "2026", figure: "~400,000 units remaining, falling", source: "Chuenrudeemol (2026)" },
] as const;

/** Findings that recur across independent studies — the load-bearing consensus. */
export const CONSENSUS = [
  {
    finding: "The stair decides everything.",
    who: "Tirapas (2011), Luangamornlert (2015), Imam (2021)",
    detail:
      "Tirapas: its rear position frees the shopfront but leaves the middle of the upper floors dark and inefficient. Luangamornlert: it is the fixed element governing what the building can become. Imam: its placement is a measured root cause of upper-floor vacancy, because tenants will not take floors reached through someone else's interior. Three studies, three methods, one conclusion.",
    fix: "Tirapas proposed the answer first — put the stair in the middle, so rooms can face both front and back and receive light and air from two sides.",
  },
  {
    finding: "The billboard is an environmental problem, not a visual one.",
    who: "Tirapas (2011), Luangamornlert (2015)",
    detail:
      "The front façade is the shophouse's only light and ventilation source besides the back. Commercial signage covering it removes both. Tirapas calls it the most problematic issue for natural lighting and ventilation; Luangamornlert finds the façade is simultaneously the most-modified element and the worst-modified one.",
  },
  {
    finding: "Service was never designed in.",
    who: "Tirapas (2011)",
    detail:
      "Kitchen, bathroom, washing and drying are absent from the original shophouse and added by inhabitants — in the middle, at the back, or on the roof. Nearly every pathology attributed to the type (damp interiors, leaking slabs from relocated bathrooms, blocked ventilation) traces back to this single omission.",
  },
  {
    finding: "It is flexible but not adaptable.",
    who: "Luangamornlert (2015), after Habraken",
    detail:
      "The shophouse is an empty shell never designed for a specific programme, so it is spatially flexible. Its structure, slab, rear plumbing and stair are rigid, so the fabric cannot absorb what the space invites. The gap between the two is where adaptive reuse fails.",
  },
  {
    finding: "The building type is a product of land law, not of Chinese architecture.",
    who: "Lin Sheng-Man (2014)",
    detail:
      "Chinese immigrants were restricted from owning land, so landowners built rows to lease. The result is a type that expands vertically — rooftop chambers — rather than laterally into courtyards, because a tenant cannot buy the plot next door. Bangkok's shophouse has no skywell, unlike its Fujian, Taiwanese and Singaporean relatives.",
  },
  {
    finding: "The residents mostly like living there.",
    who: "Siriyananthorn (2005)",
    detail:
      "68% satisfied as a place to live, 77% as a place to work, 76% running their business in the same building, n=60 in Chinatown. Dissatisfaction concentrates in the younger generation, who leave. The type is not failing its occupants; it is failing to hold the next ones.",
  },
  {
    finding: "Keeping the fabric does not keep the heritage.",
    who: "Lin Sheng-Man (2014), and the author's own Shanghai fieldwork",
    detail:
      "Lin's Phra Chan Road precedent: renovation produced souvenir shops and chain convenience stores — fabric kept, community lost. The same pattern the author documented in Shanghai, where preservation money went into façades while residents' living conditions stayed exactly as they were.",
  },
] as const;

/** Disagreements between sources, stated rather than resolved. */
export const CONFLICTS = [
  {
    topic: "When the first shophouses were built",
    positions: [
      "Luangamornlert (2015), after Puncharoenluck: early stage 1862–1896.",
      "Siriyananthorn (2005) §3.2.1: first shophouses under Rama IV, around Talat Noi.",
      "Siriyananthorn (2005) §3.5: 'the first row of shophouses in Thailand was built during the time of King Rama V' — contradicting her own §3.2.1.",
      "Tirapas (2011): 'derived from the Chinese shophouse introduced by King Rama V'.",
    ],
    verdict:
      "Unresolved. The Charoen Krung road works (1862–64) are securely dated; what was built along it, and when the timber row became the masonry row, is not. Treat 'first shophouses = Charoen Krung, 1864' as received wisdom rather than documented fact.",
  },
  {
    topic: "Current stock",
    positions: [
      "Chuenrudeemol (2026) gives 450,000 in one passage and 400,000 in another.",
      "Fusinpaiboon (2022) gives ~400,000 for the mid-1970s.",
    ],
    verdict:
      "If Fusinpaiboon's 400,000 describes the 1970s and Chuenrudeemol's describes today, then either the stock has been flat for fifty years or one figure is inherited from the other. The direction — large and falling — is not in doubt; the precision is.",
  },
  {
    topic: "Unit dimensions",
    positions: [
      "Tirapas (2011): 4 m module, from 100 surveyed units.",
      "Chantawarang (1985): 3.51–4.00 m frontage in 47% of 156 units.",
      "Lin (2014) at Tha Tien: 2.80–3.60 m — narrower than every other source.",
      "Regulation No. 55: ≥ 4 m minimum width.",
    ],
    verdict:
      "Tha Tien's units are narrower than the legal minimum because they predate it. The regulation describes what may be built now, not what stands. Any survey of existing stock will find units below 4 m and should expect to.",
  },
  {
    topic: "Whether reuse is cheaper",
    positions: [
      "Gensler (2023): conversion ~30% cheaper than new build, from 1,300+ assessments.",
      "CBRE (2024): conversion US$250–650/sq ft against ~US$320 for new office — often dearer.",
    ],
    verdict: "It depends on the building. Any source claiming otherwise is selling something.",
  },
] as const;
