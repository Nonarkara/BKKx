// The Harvard GSD "Shophouse Metropolis" studio — option studio led by
// Chatpong Chuenrudeemol (CHAT Architects) with Grace La as GSD chair,
// sponsored by AECOM. Site: Sukhumvit 71 Road (Pridi Banomyong), Bangkok.
//
// Everything here is transcribed from the studio's own documentation in
// `public/studio references/` — Chatpong's two essays and the three
// student-project PDFs. Where the documentation is a working draft with
// placeholder text, that is recorded rather than filled in: the drafts
// carry lorem-ipsum in several caption blocks and one precedent page, and
// inventing the missing content would put words in a student's mouth.
//
// Project locations are approximate anchors on the studio corridor, NOT
// surveyed sites — the drafts show generic block plans without street
// numbers. `location_confidence` records this per project.

export type StudioProject = {
  slug: string;
  title: string;
  student: string;
  /** The informal or overlooked Bangkok system the project legitimises. */
  system: string;
  systemShort: string;
  /** Precedent from the student's own city — the studio's first move. */
  homePrecedent: string;
  /** The Bangkok precedent they documented second. */
  bangkokPrecedent: string;
  /** What they actually do to the shophouse. */
  move: string;
  /** Hard figures the documentation states. Empty when it states none. */
  figures: { label: string; value: string }[];
  /** Anchor on the corridor: [lng, lat]. */
  at: [number, number];
  locationConfidence: "stated" | "inferred from drawings" | "not documented";
  locationNote: string;
};

export const STUDIO = {
  name: "Shophouse Metropolis",
  institution: "Harvard University Graduate School of Design",
  critic: "Chatpong Chuenrudeemol, CHAT Architects",
  chair: "Grace La",
  sponsor: "AECOM",
  site: "Sukhumvit 71 Road (Pridi Banomyong), Watthana / Suan Luang, Bangkok",
  premise:
    "Bangkok's abundant, neglected shophouse stock as the foundation of a new bottom-up urbanism — dismissing the developer perception of 'shophouse as urban trash' and reimagining the typology as affordable housing for the city's invisible working class and as new nodes of operation for its street infrastructures.",
  sourceNote:
    "Transcribed from the studio's own documentation. The student PDFs are preliminary drafts; several caption blocks and one precedent page carry placeholder text, recorded here as gaps rather than filled in.",
} as const;

// Five projects are documented across the three PDFs. The files overlap —
// Yuhui Guo and Xiaomeng Yang each appear in two of them — so this is five
// distinct projects, not nine. The studio ran nine; four are not in the
// drafts supplied.
export const DOCUMENTED_OF_TOTAL = { documented: 5, total: 9 } as const;

export const PROJECTS: StudioProject[] = [
  {
    slug: "bangkok-on-wheels",
    title: "Bangkok on Wheels",
    student: "Betty Chen",
    system:
      "The mobile vending and motorcycle-taxi ecosystem — win motorcycles, vendor carts, tuk-tuks, hand-pushed carts and modified pickups, treated as transit, kitchen, workshop and domestic infrastructure rather than as obstruction.",
    systemShort: "Win motorcycle taxis & vendor carts",
    homePrecedent:
      "Hexiajie Mixed-Use Complex, Fuzhou — a residential-market hybrid where ramps carrying pedestrians, bicycles, e-motorcycles, carts and trucks generate the building's whole spatial order.",
    bangkokPrecedent:
      "Two vendor case studies documented by interview: a fresh-produce cart and Auntie Nah's fried-banana cart, each a self-modified vehicle combining transport, display, storage and workspace.",
    move:
      "A ramp system doing four jobs at once — circulation, service, public threshold and domestic extension. Vendor housing sits on a repeated bay module with centre bays removed for a light well and stack ventilation, and the ramps bring vehicles up to the units themselves, so a cart or motorcycle plugs into the home as garage, balcony, service yard and loading dock.",
    figures: [
      { label: "Housing module", value: "4 × 4 bays, each 3.5 × 3.5 m" },
    ],
    at: [100.5966, 13.7148],
    locationConfidence: "stated",
    locationNote:
      "Documentation places it at the southern corner where Sukhumvit 71 meets Sukhumvit Road, by the BTS station — already a transfer point.",
  },
  {
    slug: "living-market",
    title: "Living Market",
    student: "Yuhui Guo",
    system:
      "The vendor-run fresh market — bottom-up market economies serving lower-income residents, of the kind that franchise convenience stores and chain supermarkets have been steadily replacing.",
    systemShort: "Fresh markets & vendor economies",
    homePrecedent:
      "Beicun Fresh Market, Qingdao — vendors along four pedestrian streets, with vans and trucks doubling as both transport and part of the stall, on a minimal flexible steel frame.",
    bangkokPrecedent:
      "Khlong Toei Market — a roofed structure running continuously across day and night shifts, with trucks at the perimeter and delivery workers feeding individual stalls.",
    move:
      "The ground floor opens into a continuous market for fixed stalls and mobile tuk-tuk shops; upper floors become housing with independent rear access. A flexible façade with front kitchens and operable windows buffers noise and smell between the two, and a triple-height volume drives stack ventilation through market and housing alike.",
    figures: [
      { label: "Ground-floor market", value: "designed for 300+ stalls" },
      { label: "Shared structural module", value: "≈ 4 × 4 m — shophouse grid and market grid coincide" },
    ],
    at: [100.5942, 13.7238],
    locationConfidence: "not documented",
    locationNote:
      "Drawings show a generic shophouse block without street numbers. Anchored mid-corridor for reference only.",
  },
  {
    slug: "day-nightlife-hub",
    title: "Day / Nightlife Hub",
    student: "Xiaomeng Yang",
    system:
      "The nightlife strip — the movable furniture, foldable floor extensions, façade attachments and projecting signage that let a bar street compress and come alive at night, and the resulting problem that the same street is a ghost town by day.",
    systemShort: "Nightlife & the day-empty street",
    homePrecedent:
      "Heming Teahouse, People's Park, Chengdu — a public room defined not by architecture but by the placement of tables and chairs and the negotiated distance between strangers. Intimacy without familiarity.",
    bangkokPrecedent:
      "Soi Cowboy as a dual-state street, measured against Silom 6 (too wide, activity stays indoors), Patpong (programmed by temporary stalls) and Silom 4 (most compact and engaging — and almost dead by day).",
    move:
      "A shallow buffer zone is added along the shophouse façades: by day it holds massage, hair, tailoring, nails and food; by night the same strip converts to storefront and seating so activity expands outward instead of vanishing. Second-floor awnings become accessible balconies, and the logic carries into the block's abandoned theatre, where rotated stairs and embedded anchor-store boxes make places to enter, pause and gather, their roofs doubling as raised stages.",
    figures: [],
    at: [100.5954, 13.7196],
    locationConfidence: "inferred from drawings",
    locationNote:
      "Site plan centres on an abandoned theatre within a shophouse block on Sukhumvit 71; no street number given.",
  },
  {
    slug: "street-dining",
    title: "Street Dining",
    student: "Jiaxin Yan",
    system:
      "Street food — cooking and eating that spill from the shopfront onto the pavement and into the building alley, layered from folding stool to awning to alley food court.",
    systemShort: "Street food & the shared table",
    homePrecedent:
      "The Chinese village banquet — an informal, uninvited, flexible feast of folding tables and mobile kitchen equipment delivered by truck and assembled on site, set explicitly against the scripted hotel banquet.",
    bangkokPrecedent:
      "'Food on the façade' — Bangkok's street-furniture-to-shopfront-to-alley gradient, documented photographically.",
    move:
      "A modular food wall carries water, drainage and power as one bookable system, so a vendor can plug a different cooking and serving configuration into the same bay. Interior walls come out so residents' kitchens extend across the floor plate, and vendors book slots through a mobile platform — the building run as a village banquet rather than a hotel banquet. Ground level is a delivery-pickup food court by day and a night market after dark.",
    figures: [],
    at: [100.5930, 13.7285],
    locationConfidence: "not documented",
    locationNote:
      "Shown as a generic shophouse row; one rendering includes an elevated rail structure. Anchored on the corridor for reference only.",
  },
  {
    slug: "ghosts-and-gods",
    title: "Bangkok: Ghosts and Gods",
    student: "Olivia Xu",
    system:
      "Ritual and temporary civic space — the unlicensed use of leftover shophouse pockets for everyday rites and seasonal festivals, combined with the neighbourhood's shortage of usable green space.",
    systemShort: "Ritual, festival & green space",
    homePrecedent:
      "Chaoshan ritual opera — bamboo-and-fabric stages raised in front of temples and along streets, where performance, worship and daily life overlap and space expands and contracts with the ritual calendar.",
    bangkokPrecedent:
      "The Thai spirit house and shophouse-temple, and Thawan Duchanee's Black House: a collection of pavilions working through atmosphere rather than one formal religious building — mapped onto a calendar of Songkran, Buddhist rites, rites of malevolent spirits and the cult of garden spirits.",
    move:
      "Selected units are removed to open a network of connected voids — gardens, productive landscape, shared ground — around a derelict department-store hall, which is re-roofed as a loose urban canopy for markets, gatherings, performance and seasonal ritual. Lightweight elevated follies hold specific programmes inside it while keeping the space open, and planting follows the ritual and agricultural calendar so the landscape itself registers the season.",
    figures: [],
    at: [100.5921, 13.7325],
    locationConfidence: "inferred from drawings",
    locationNote:
      "Centres on an abandoned department-store hall within a shophouse block; no street address documented.",
  },
];

// Chatpong's own figures, from "Shophouse Metropolis". Kept separate from
// the student work because they carry the essay's central quantities.
export const SHOPHOUSE_STOCK = {
  currentUnits: 400_000,
  currentUnitsAlt: 450_000,
  peakUnits: 750_000,
  peakEra: "1960s–70s post-war boom",
  frontageM: [3.5, 5] as const,
  depthM: [10, 12] as const,
  storeys: [2, 4] as const,
  source: "Chuenrudeemol, C., 'Shophouse Metropolis' (Harvard GSD studio book, 2026)",
  note:
    "The essay gives both 450,000 and 400,000 for the current stock in different passages, and 750,000 at the 1960s–70s peak. Both current figures are reproduced here rather than silently picking one; the direction — a large stock, falling — is what the argument rests on.",
} as const;

// The Sukhumvit pattern Chatpong sets out: each cross-street that got
// redeveloped lost its shophouses first.
export const SUKHUMVIT_PATTERN = [
  { road: "Sukhumvit 26", became: "Phrom Phong — high-end shopping", shophouses: "mostly demolished" },
  { road: "Sukhumvit 55", became: "Thonglor — gentrified", shophouses: "mostly demolished" },
  { road: "Sukhumvit 63", became: "Ekkamai — nightlife, high-end pubs", shophouses: "mostly demolished" },
  { road: "Sukhumvit 71", became: "Pridi Banomyong — still hybrid, still occupied", shophouses: "largely intact — the studio site" },
] as const;
