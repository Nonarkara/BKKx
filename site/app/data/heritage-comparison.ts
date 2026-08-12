export type ComparisonSite = {
  slug: string;
  place: string;
  country: string;
  status: string;
  propertyScale: string;
  documentedFabric: string;
  urbanLogic: string;
  strongestClaim: string;
  pressureOrTradeoff: string;
  sourceUrl: string;
};

// Comparator facts use UNESCO's own Statements of Outstanding Universal
// Value. Bangkok is deliberately framed separately: it is an editorial
// proposition and research programme, not an invented UNESCO designation.
export const COMPARISON_SITES: ComparisonSite[] = [
  {
    slug: "bangkok",
    place: "Old Bangkok",
    country: "Thailand",
    status: "Not inscribed as an historic city",
    propertyScale: "No proposed boundary yet; this atlas begins with 15 dispersed clusters",
    documentedFabric: "618+ published rowhouse units across counted ensembles; citywide total not yet established",
    urbanLogic: "Royal capital + river trade + immigrant quarters + road, rail and canal markets",
    strongestClaim: "Exceptional diversity and continued metropolitan use—not frozen uniformity",
    pressureOrTradeoff: "Fragmented protection; ordinary shophouses outside protected zones remain vulnerable",
    sourceUrl: "https://icich.icomos.org/wp-content/uploads/2018/08/JSS_100_0k_TiamsoonAkagawa_CulturalRightsAndConservationOfOldBangkok.pdf",
  },
  {
    slug: "george-town",
    place: "George Town + Melaka",
    country: "Malaysia",
    status: "World Heritage, 2008 · criteria ii, iii, iv",
    propertyScale: "Serial property of two historic Straits trading cities",
    documentedFabric: "UNESCO identifies an exceptional range of shophouses and townhouses",
    urbanLogic: "Malay, Chinese and Indian trade shaped by three European colonial powers",
    strongestClaim: "Five centuries of multicultural exchange visible in townscape and living traditions",
    pressureOrTradeoff: "Conservation of shophouses requires continuing effort",
    sourceUrl: "https://whc.unesco.org/en/list/1223/",
  },
  {
    slug: "vigan",
    place: "Vigan",
    country: "Philippines",
    status: "World Heritage, 1999 · criteria ii, iv",
    propertyScale: "17.25 ha · grid of 25 streets",
    documentedFabric: "233 historic buildings",
    urbanLogic: "Spanish Renaissance grid tempered by Chinese, Ilocano and Filipino building culture",
    strongestClaim: "Asia's most intact planned Spanish colonial trading town",
    pressureOrTradeoff: "Post-war economic decline limited redevelopment; some altered or neglected houses",
    sourceUrl: "https://whc.unesco.org/en/list/502/",
  },
  {
    slug: "hoi-an",
    place: "Hoi An",
    country: "Viet Nam",
    status: "World Heritage, 1999 · criteria ii, v",
    propertyScale: "30 ha property · 280 ha buffer",
    documentedFabric: "1,107 timber-frame buildings",
    urbanLogic: "Small-scale international trading port with Vietnamese, Chinese, Japanese and European influence",
    strongestClaim: "Exceptionally well-preserved organic port-town tissue",
    pressureOrTradeoff: "Nineteenth-century decline limited replacement; now a major tourism destination",
    sourceUrl: "https://whc.unesco.org/en/list/948/",
  },
  {
    slug: "luang-prabang",
    place: "Luang Prabang",
    country: "Lao PDR",
    status: "World Heritage, 1995 · criteria ii, iv, v",
    propertyScale: "Peninsula town between Mekong and Nam Khan",
    documentedFabric: "Temples, vernacular houses and colonial buildings conserved as one townscape",
    urbanLogic: "Lao traditional urban structure fused with French colonial architecture",
    strongestClaim: "Architectural ensemble embedded in an exceptional river landscape",
    pressureOrTradeoff: "Tourism pressure is linked to changing uses, departing residents and illegal construction",
    sourceUrl: "https://whc.unesco.org/en/list/479/",
  },
  {
    slug: "galle",
    place: "Galle Fort",
    country: "Sri Lanka",
    status: "World Heritage, 1988 · criterion iv",
    propertyScale: "Compact fortified promontory",
    documentedFabric: "Rows of narrow-front houses inside a Dutch street grid",
    urbanLogic: "European fortified planning adapted to South Asian traditions",
    strongestClaim: "Best representation of a European-built fortified city in South Asia",
    pressureOrTradeoff: "Must provide modern living standards while managing demand for new uses",
    sourceUrl: "https://whc.unesco.org/en/list/451/",
  },
];
export const BANGKOK_CLAIMS = [
  {
    status: "proved" as const,
    title: "The heritage is polycentric.",
    body: "The mapped evidence already spans palace frontages, Chinese wholesale blocks, tenant-led conservation, Thonburi markets and a canal-facing timber settlement. Bangkok is not one picturesque core.",
    evidence: "15 sourced clusters · five rowhouse types",
  },
  {
    status: "proved" as const,
    title: "Ordinary buildings carry metropolitan history.",
    body: "Fine Arts records, academic inventories and conservation cases repeatedly identify shophouse rows—not only temples and palaces—as the structure connecting trade, dwelling and public space.",
    evidence: "618+ counted units · five register-linked clusters",
  },
  {
    status: "promising" as const,
    title: "The range may exceed compact comparator towns.",
    body: "Bangkok's documented typologies and infrastructures are unusually varied. Proving comparative exceptionality requires a citywide inventory and a consistently defined boundary, which do not yet exist.",
    evidence: "Comparative thesis; not yet a completed inventory",
  },
  {
    status: "not-yet" as const,
    title: "Integrity is not yet demonstrated.",
    body: "World Heritage requires boundaries, integrity, authenticity, protection and management—not simply many old buildings. Fragmented controls and redevelopment pressure are currently weaknesses in Bangkok's case.",
    evidence: "Research and governance gap",
  },
];
