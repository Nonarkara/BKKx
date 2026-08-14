// The side rail — what runs alongside each section of the essay.
//
// On a wide screen the essay is a 60/40 split: argument left, evidence right.
// On a phone the rail items fall inline between sections, which is why each
// one is written to stand alone rather than to be read "beside" anything.
//
// Photographs are the author's own unless noted. The diagram set was
// generated from this essay's own text as an illustration of its argument —
// labelled as such, because a generated drawing sitting unmarked next to a
// sourced dimensions table is exactly the kind of thing that discredits a
// research document. One of them carries a wrong figure; see DIAGRAM_NOTE.

export type RailItem =
  | { kind: "photo"; file: string; caption: string; credit?: string }
  | { kind: "diagram"; file: string; title: string; caption: string }
  | { kind: "project"; slug: string }
  | { kind: "fact"; text: string; source: string }
  | { kind: "figure"; id: string };

export const DIAGRAM_NOTE =
  "Generated from this essay's text as an illustration of its argument, not a measured drawing. Sheet 01 states a shophouse depth of 20–30 m, which no source in this bibliography supports — the measured range is 10–16 m and Ministerial Regulation No. 55 caps it at 24 m. The dimensions table in the Bible is the authority; the sheet is kept for its diagram of the argument, with the error recorded here rather than quietly cropped out.";

/** Rail content keyed by essay section slug. "" is the opening, before the first heading. */
export const RAIL: Record<string, RailItem[]> = {
  "": [
    {
      kind: "photo",
      file: "/shophouses/photos/non-1982-shophouse.jpg",
      caption:
        "The author with his father, 1982, on the timber floor of the family shophouse in the old town. Four of us and the woman who raised me lived three floors above the shop until the early 1980s, when the arithmetic said suburbs.",
      credit: "Author's family photograph",
    },
  ],

  "the-arithmetic-that-eats-a-street": [
    {
      kind: "photo",
      file: "/shophouses/photos/shophouses-in-the-inner-old-town.jpg",
      caption: "Shophouses in the inner old town — the fabric the arithmetic is eating.",
    },
    {
      kind: "diagram",
      file: "/shophouses/diagrams/diagram-1.jpg",
      title: "The smart city we already have",
      caption:
        "The argument on one sheet: an infrastructure-rich building type that already carries transit, food and market systems.",
    },
    {
      kind: "fact",
      text: "Samphanthawong had 2,430 shophouses in 1907. About 310 are left.",
      source: "Quin Limp, Chulalongkorn, 2010",
    },
    {
      kind: "photo",
      file: "/shophouses/photos/shophouses-on-chareon-krung-road.jpg",
      caption:
        "Charoen Krung — Siam's first paved road, cut 1862–64 because the foreign consuls petitioned that they had nowhere to ride. The masonry rows followed it.",
    },
  ],

  "the-concession-i-have-to-make-first": [
    {
      kind: "fact",
      text: "A row may legally run no more than 10 units and 40 metres before it must stop and leave a 4 m gap. A firewall is required every five units.",
      source: "Ministerial Regulation No. 55 B.E. 2543, ข้อ 4 and ข้อ 17",
    },
  ],

  "so-the-ones-that-are-fine": [
    {
      kind: "diagram",
      file: "/shophouses/diagrams/diagram-4.jpg",
      title: "Reuse beats demolition",
      caption:
        "Not for nostalgia — for law, carbon and ordinary arithmetic. The setback rule, the 55% of embodied carbon already standing in the frame, and the payback window that runs past 2050.",
    },
    {
      kind: "fact",
      text: "Removing a reinforced-concrete stair is legally a demolition, not a modification.",
      source: "Ministerial Regulation No. 11 B.E. 2528",
    },
  ],

  "the-research-is-already-done": [
    {
      kind: "fact",
      text: "Every owner in a 2021 survey of forty said they would keep a shophouse empty rather than let it cheaply. Thailand had no vacant-property tax.",
      source: "Nabila Imam, Chulalongkorn, 2021",
    },
    {
      kind: "photo",
      file: "/shophouses/photos/art-deco-shophouses-in-the-city.jpg",
      caption: "Art Deco shophouses — the 1930s–40s layer of the same continuous type.",
    },
  ],

  "four-things-shanghai-taught-me": [
    {
      kind: "photo",
      file: "/shophouses/photos/diversity-on-the-ground.jpg",
      caption:
        "Diversity on the ground floor. Affordability is a by-product of diversity, and you cannot protect it by freezing a place.",
    },
  ],

  "the-elephant": [
    {
      kind: "photo",
      file: "/shophouses/photos/yaowaraj-and-its-worldclass-shophouses.jpg",
      caption:
        "Yaowarat. World-class shophouse fabric that nobody had to curate into a destination first.",
    },
    {
      kind: "photo",
      file: "/shophouses/photos/img-20251214-180905405.jpg",
      caption:
        "A scrap-metal Transformer on a traffic island in front of an Art Deco corner shophouse, at dusk. Bangkok does not need permission to be interesting.",
    },
  ],

  "what-the-students-found": [
    { kind: "project", slug: "bangkok-on-wheels" },
    { kind: "project", slug: "living-market" },
    { kind: "project", slug: "day-nightlife-hub" },
    { kind: "project", slug: "street-dining" },
    { kind: "project", slug: "ghosts-and-gods" },
  ],

  "the-smart-city-we-already-have": [
    {
      kind: "photo",
      file: "/shophouses/photos/micro-mobility-in-bangkok.jpg",
      caption:
        "Micro-mobility. A demand-responsive last-mile transit network with community-negotiated pricing, which nobody designed and nobody has legitimised.",
    },
    {
      kind: "diagram",
      file: "/shophouses/diagrams/diagram-2.jpg",
      title: "The systems already running",
      caption: "Street food, win motorcycles, fresh markets — infrastructure without an address.",
    },
    {
      kind: "photo",
      file: "/shophouses/photos/streetfood-scenes-on-the-first-floor-of-the-shophouse.jpg",
      caption:
        "Street food on the ground floor of the shophouse. A distributed food-security system that began on boats and moved onto the pavement when the canals were filled in.",
    },
  ],

  "what-that-looks-like-when-you-build-it": [
    {
      kind: "photo",
      file: "/shophouses/photos/img-20251215-210649955.jpg",
      caption:
        "North Sathorn at night — tuk-tuk underlighting, a lit historic corner, overhead cable, a tower behind. The city is already running the systems; it just has not written them down.",
    },
  ],

  "three-systems-i-would-build-for-the-shophouse": [
    {
      kind: "diagram",
      file: "/shophouses/diagrams/diagram-3.jpg",
      title: "What is missing",
      caption: "A register, a tenure layer, and a way through the building that is not the shop's stair.",
    },
    {
      kind: "fact",
      text: "The stair is a measured cause of upper-floor vacancy, not an architect's complaint. One owner's recorded reason: 'no stairs outside'.",
      source: "Imam (2021) p. 94; Tirapas (2011); Luangamornlert (2015)",
    },
  ],

  "reuse-for-what-exactly": [
    {
      kind: "photo",
      file: "/shophouses/photos/24-7-liveliness.jpg",
      caption:
        "Around the clock. Sensory richness is an input to the work, not a lifestyle preference — and it is the one thing a new building cannot be given.",
    },
    {
      kind: "diagram",
      file: "/shophouses/diagrams/diagram-5.jpg",
      title: "Programmes the type will take",
      caption: "The question a preservation case never answers.",
    },
  ],

  "why-this-is-a-business-not-a-charity": [
    {
      kind: "photo",
      file: "/shophouses/photos/chao-phaya-river.jpg",
      caption:
        "The Chao Phraya. Southeast Asia is where the interesting urban problems are, and this is the best laboratory in it.",
    },
    {
      kind: "diagram",
      file: "/shophouses/diagrams/diagram-6.jpg",
      title: "The commercial case",
      caption: "400,000 units of infrastructure-rich floor area priced at the value of the dirt beneath it.",
    },
  ],

  "what-i-still-walk-to": [
    {
      kind: "photo",
      file: "/shophouses/photos/img-20251214-180905405.jpg",
      caption: "The old town, most weeks. Less research than habit.",
    },
  ],
};

export const SUPPORT = {
  intro:
    "The author's role in this project is supported by the Digital Economy Promotion Agency (depa) and Thailand's Smart City Office.",
  logos: [
    {
      file: "/shophouses/logos/depa.jpg",
      name: "Digital Economy Promotion Agency (depa)",
      url: "https://www.depa.or.th",
    },
    {
      file: "/shophouses/logos/smart-city-thailand.jpg",
      name: "Thailand Smart City Office",
      url: "https://www.depa.or.th/th/smart-city-plan",
    },
  ],
} as const;
