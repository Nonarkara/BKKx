// Bangkok water, flood and drainage — the source register.
//
// WHAT THIS FILE IS, AND WHAT IT IS NOT. This is the studied catalogue of the
// twelve data.go.th datasets nominated for the war room, plus the two live
// endpoints the BMA actually serves. It is a *plan of record*, not data: the
// figures behind each dataset are not in this repo yet, because data.go.th is
// unreachable from the environment this file was written in (the egress proxy
// answers 403 CONNECT on data.go.th and gdcatalog.go.th alike).
//
// So each entry below records what the dataset is *expected* to be, at a stated
// confidence, and `scripts/ingest-bkk-water.py` is the instrument that resolves
// it. That script does NOT assume the schema — it asks CKAN what resources
// exist, reads the real column names, and writes them back into
// app/data/water-manifest.json. Where this file and the manifest disagree, the
// manifest is right and this file is stale.
//
// The discipline is the same one the rest of the project runs on: a number
// nobody has fetched is not a number. Nothing in the war room renders a water
// figure until the ingest has produced one; the panels show what is missing
// rather than a plausible placeholder.

export type WaterLayer =
  /** Built drainage assets — gates, pumps, canals. The machine itself. */
  | "asset"
  /** Where water goes wrong — risk zones, historical inundation. */
  | "hazard"
  /** Measurements over time — rainfall, water level, quality. */
  | "observation"
  /** Who is exposed — communities, population. */
  | "exposure";

export type IngestStatus =
  /** Catalogued here, not yet fetched. */
  | "awaiting-ingest"
  /** Fetched, parsed, written to public/data/water/. */
  | "ingested"
  /** Fetched and rejected — reason recorded in the manifest. */
  | "rejected";

export type Confidence =
  /** Title/agency corroborated by a second source. */
  | "corroborated"
  /** Inferred from the dataset slug and the catalogue's naming conventions. */
  | "inferred";

export type WaterSource = {
  /** CKAN dataset id — the slug in the data.go.th URL. */
  id: string;
  url: string;
  /** Expected Thai title. Confirmed at ingest. */
  titleTh: string;
  titleEn: string;
  layer: WaterLayer;
  confidence: Confidence;
  status: IngestStatus;
  /** What this dataset is *for* in the war room. The reason it is on the list. */
  role: string;
  /** What it cannot tell you. Written before ingest so the limit is not
      discovered after the chart is built. */
  limit: string;
};

/* ------------------------------------------------------------------ *
 * The twelve nominated datasets.
 *
 * Ordered by how load-bearing they are for a drainage war room, not by the
 * order they were sent: the assets and the hazard surface first, because they
 * are the standing picture; observations next, because they are the live
 * needle; exposure last, because it is what converts a reading into a
 * priority.
 * ------------------------------------------------------------------ */
export const WATER_SOURCES: WaterSource[] = [
  {
    id: "floodgate",
    url: "https://data.go.th/dataset/floodgate",
    titleTh: "ที่ตั้งประตูระบายน้ำในพื้นที่กรุงเทพมหานคร",
    titleEn: "Floodgate locations, Bangkok",
    layer: "asset",
    confidence: "corroborated",
    role: "The gate inventory — the count and position of every drainage gate the city can actually operate. This is the denominator for every 'how much of the network is under control' question, and the join key for gate-level status if an operational feed is ever opened.",
    limit: "A location register, not a state feed: it says where a gate is, never whether it is open, closed, or working.",
    status: "awaiting-ingest",
  },
  {
    id: "floodgate1",
    url: "https://data.go.th/dataset/floodgate1",
    titleTh: "ประตูระบายน้ำ (ชุดที่สอง)",
    titleEn: "Floodgates (second series)",
    layer: "asset",
    confidence: "inferred",
    role: "A second gate series, published separately from `floodgate`. Ingest must establish whether it is a newer vintage, a different agency's cut, or a different asset class entirely — and then whether the two sets are duplicates, complements, or contradictions. A disagreement between two official gate registers is itself a finding worth publishing.",
    limit: "Relationship to `floodgate` unknown until both are fetched and compared by position and name.",
    status: "awaiting-ingest",
  },
  {
    id: "canal1",
    url: "https://data.go.th/dataset/canal1",
    titleTh: "คลองในพื้นที่กรุงเทพมหานคร",
    titleEn: "Canals, Bangkok",
    layer: "asset",
    confidence: "inferred",
    role: "The khlong network — the drainage system's actual geometry, and the historical armature of the city this project documents. Total channel length by district is a real war-room statistic, and the canal layer is the one water dataset that also belongs to the heritage argument.",
    limit: "Centrelines, almost certainly without cross-section, invert level or current capacity — so it describes the network's shape, never its throughput.",
    status: "awaiting-ingest",
  },
  {
    id: "igd-19",
    url: "https://data.go.th/dataset/igd-19",
    titleTh: "(รอยืนยันจากการดึงข้อมูล)",
    titleEn: "Unresolved — agency series code igd-19",
    layer: "asset",
    confidence: "inferred",
    role: "Nominated but unidentified. The slug is an internal series code, not a descriptive name, so its subject cannot be honestly guessed from the URL. Ingest resolves the title, agency and schema; it is catalogued here so that it cannot be quietly dropped.",
    limit: "Everything, until fetched. Listed as unknown rather than described speculatively.",
    status: "awaiting-ingest",
  },
  {
    id: "risk-flood-bangkok-area",
    url: "https://data.go.th/dataset/risk-flood-bangkok-area",
    titleTh: "พื้นที่เสี่ยงน้ำท่วมในเขตกรุงเทพมหานคร",
    titleEn: "Flood risk areas, Bangkok",
    layer: "hazard",
    confidence: "corroborated",
    role: "The standing hazard surface, and the highest-value join in the whole list: intersect it with the heritage register and the 2,311 screened shophouse footprints and the war room can state how much of the protected and at-risk building stock sits inside a designated flood-risk zone — a number nobody currently publishes.",
    limit: "A designated zone is an administrative judgement with a vintage, not a hydraulic model output. It will not say how deep, how long, or how often.",
    status: "awaiting-ingest",
  },
  {
    id: "flood",
    url: "https://data.go.th/dataset/flood",
    titleTh: "ข้อมูลน้ำท่วม",
    titleEn: "Flood records",
    layer: "hazard",
    confidence: "inferred",
    role: "Observed inundation, as distinct from designated risk. Where this disagrees with the risk-area layer — places that flood but are not zoned, places zoned but dry — is the most interesting map either dataset can make.",
    limit: "Granularity unknown: could be event polygons, point reports, or a district tally. Determines whether it can be charted as a time series at all.",
    status: "awaiting-ingest",
  },
  {
    id: "69-05-disaster",
    url: "https://data.go.th/dataset/69-05-disaster",
    titleTh: "สถิติสาธารณภัย (ชุด 69-05)",
    titleEn: "Disaster statistics, series 69-05",
    layer: "hazard",
    confidence: "inferred",
    role: "Disaster incidence over time — the multi-year backdrop that stops a single wet week reading as a trend. The leading `69` is very likely Buddhist-era 2569 (2026 CE), which would make this the current year's series.",
    limit: "Almost certainly all-hazard, not flood-specific; needs filtering to water events before any chart is honest.",
    status: "awaiting-ingest",
  },
  {
    id: "rainfall1",
    url: "https://data.go.th/dataset/rainfall1",
    titleTh: "ปริมาณน้ำฝน",
    titleEn: "Rainfall",
    layer: "observation",
    confidence: "inferred",
    role: "The historical rainfall series that gives today's live reading a scale. A millimetre figure means nothing on its own; against a distribution it becomes 'this is the wettest morning since March'.",
    limit: "Station coverage and interval unknown — daily totals and 15-minute intensities support very different claims about drainage stress.",
    status: "awaiting-ingest",
  },
  {
    id: "rainlocal",
    url: "https://data.go.th/dataset/rainlocal",
    titleTh: "ปริมาณน้ำฝนรายพื้นที่",
    titleEn: "Local/area rainfall",
    layer: "observation",
    confidence: "inferred",
    role: "Rainfall resolved to locality — the spatial half of the same question. Bangkok floods unevenly because it rains unevenly; a citywide average hides exactly the district that is drowning.",
    limit: "Overlap with `rainfall1` unresolved; one may supersede the other.",
    status: "awaiting-ingest",
  },
  {
    id: "62-64",
    url: "https://data.go.th/dataset/62-64",
    titleTh: "(ชุดข้อมูลช่วงปี 2562–2564 — รอยืนยัน)",
    titleEn: "Series 2562–2564 (2019–2021) — subject unresolved",
    layer: "observation",
    confidence: "inferred",
    role: "A three-year series by its slug (BE 2562–2564 = 2019–2021 CE). The window spans the pandemic years, which makes it useful for separating changes in the city from changes in the weather — but only once ingest establishes what is actually being measured.",
    limit: "Subject unknown; a date range is not a topic. Do not chart until resolved.",
    status: "awaiting-ingest",
  },
  {
    id: "wqi-2561-2563",
    url: "https://data.go.th/dataset/wqi-2561-2563",
    titleTh: "ดัชนีคุณภาพน้ำ 2561–2563",
    titleEn: "Water Quality Index 2018–2020",
    layer: "observation",
    confidence: "corroborated",
    role: "Canal water quality across three years — the slow variable. Drainage discourse is dominated by flood events; WQI is the measure of what the same channels are doing on the other 360 days, and it is the one water metric that speaks directly to canalside living conditions.",
    limit: "Closes in 2563 (2020). Five years stale on publication of this war room — it is history, and must be labelled as history, never as current condition.",
    status: "awaiting-ingest",
  },
  {
    id: "community",
    url: "https://data.go.th/dataset/community",
    titleTh: "ข้อมูลชุมชนในพื้นที่กรุงเทพมหานคร",
    titleEn: "Registered communities, Bangkok",
    layer: "exposure",
    confidence: "inferred",
    role: "The exposure denominator, and the answer to 'population growth' as a war-room panel: registered communities carry household and population counts by district. Crossed with the flood-risk surface it converts a hazard zone into a number of people — which is the only form in which a hazard becomes a priority.",
    limit: "Registered communities are an administrative category, not a census. They undercount informal settlement, which is precisely the population most exposed to canal flooding.",
    status: "awaiting-ingest",
  },
];

/* ------------------------------------------------------------------ *
 * Live endpoints.
 *
 * The BMA's drainage department publishes current readings over plain HTTP.
 * That matters architecturally: a browser on an HTTPS page cannot fetch an
 * HTTP endpoint (mixed content), and the endpoint sends no CORS headers
 * anyway. Both problems have the same solution — the Worker fetches it
 * server-side and re-serves it same-origin. See site/worker/live.ts.
 * ------------------------------------------------------------------ */
export type LiveEndpoint = {
  id: string;
  label: string;
  /** The upstream the Worker proxies. */
  upstream: string;
  /** Same-origin path the browser actually calls. */
  route: string;
  agency: string;
  /** Seconds the edge may serve a cached copy. */
  ttlSeconds: number;
  note: string;
};

export const LIVE_ENDPOINTS: LiveEndpoint[] = [
  {
    id: "rain",
    label: "Rainfall, last reading",
    upstream: "http://weather.bangkok.go.th/dds_webservices/api/rain/lastdata",
    route: "/api/live/rain",
    agency: "สำนักการระบายน้ำ กทม. — BMA Department of Drainage and Sewerage",
    ttlSeconds: 300,
    note: "Gauge network last-reading feed. Unverified from the authoring environment (egress-blocked); the Worker validates the response shape at runtime and the panel reports upstream failure rather than rendering a zero.",
  },
];

/** Counts for the catalogue header — derived, never typed by hand. */
export const WATER_TALLY = {
  total: WATER_SOURCES.length,
  ingested: WATER_SOURCES.filter((s) => s.status === "ingested").length,
  awaiting: WATER_SOURCES.filter((s) => s.status === "awaiting-ingest").length,
  byLayer: WATER_SOURCES.reduce<Record<WaterLayer, number>>(
    (acc, s) => {
      acc[s.layer] = (acc[s.layer] ?? 0) + 1;
      return acc;
    },
    { asset: 0, hazard: 0, observation: 0, exposure: 0 },
  ),
  corroborated: WATER_SOURCES.filter((s) => s.confidence === "corroborated").length,
};

export const LAYER_LABEL: Record<WaterLayer, string> = {
  asset: "Drainage asset",
  hazard: "Hazard surface",
  observation: "Observation series",
  exposure: "Exposure",
};
