// Kuala Lumpur water, flood and drainage — the source register.
//
// WHAT THIS FILE IS. A studied catalogue, not ingested flood depths.
// MyGDI / JPS datasets for WP Kuala Lumpur exist (2002 drainage, 2003 flood
// area). They are not in this repo yet. OSM rivers ARE in the repo, as
// geometry, and are labelled as such. Interpretive 90 m corridors around
// those rivers are NOT official zon banjir.

export type WaterLayer =
  | "asset"
  | "hazard"
  | "observation"
  | "exposure";

export type IngestStatus =
  | "awaiting-ingest"
  | "ingested"
  | "rejected";

export type Confidence =
  | "corroborated"
  | "inferred";

export type WaterSource = {
  id: string;
  url: string;
  titleTh: string;
  titleEn: string;
  layer: WaterLayer;
  confidence: Confidence;
  status: IngestStatus;
  role: string;
  limit: string;
};

export const WATER_SOURCES: WaterSource[] = [
  {
    id: "jps-infobanjir",
    url: "https://publicinfobanjir.water.gov.my/",
    titleTh: "Public Infobanjir JPS (WP Kuala Lumpur = WLH)",
    titleEn: "JPS Public Info Banjir portal — WP Kuala Lumpur state code WLH",
    layer: "observation",
    confidence: "corroborated",
    status: "awaiting-ingest",
    role: "The live river and rainfall picture the mayor actually uses. Linked, never scraped.",
    limit:
      "No documented public JSON API. Unofficial Heroku mirrors are not a source. Until JPS publishes a machine feed, this twin shows the portal as a link and Open-Meteo precipitation as a forecast.",
  },
  {
    id: "mygdi-drainage-2002",
    url: "https://www.mygeoportal.gov.my/",
    titleTh: "DATA PENGAIRAN DAN SALIRAN WP KUALA LUMPUR 2002",
    titleEn: "WP Kuala Lumpur drainage and irrigation data, 2002 (MyGDI / JPS)",
    layer: "asset",
    confidence: "corroborated",
    status: "awaiting-ingest",
    role: "The standing picture of drains, zon banjir and the Sungai Klang basin as JPS mapped them.",
    limit:
      "Catalogue record, not a download. MyGDI often wants a login. A 2002 surface is not 2026 hydrology.",
  },
  {
    id: "mygdi-flood-2003",
    url: "https://www.mygeoportal.gov.my/",
    titleTh: "DATA BANJIR KAWASAN KUALA LUMPUR 2003",
    titleEn: "Kuala Lumpur flood-area data, 2003 (MyGDI / JPS)",
    layer: "hazard",
    confidence: "corroborated",
    status: "awaiting-ingest",
    role: "Historical inundation extent for WP KL — the check on any schematic corridor.",
    limit:
      "Not ingested. Until it is, the atlas draws an interpretive 90 m buffer around OSM rivers and labels it as such.",
  },
  {
    id: "wpkl-hydrography",
    url: "https://www.mygeoportal.gov.my/",
    titleTh: "Rangka kerja hidrografi WPKL",
    titleEn: "WPKL hydrography framework (MyGDI catalogue)",
    layer: "asset",
    confidence: "inferred",
    status: "awaiting-ingest",
    role: "The named drainage network the city is supposed to have on paper.",
    limit: "Catalogue only. Not a live pump or gate feed.",
  },
  {
    id: "osm-rivers",
    url: "https://www.openstreetmap.org/copyright",
    titleTh: "Sungai Klang, Sungai Gombak, Sungai Batu (OSM)",
    titleEn: "Klang, Gombak and Batu rivers — OpenStreetMap waterways",
    layer: "asset",
    confidence: "corroborated",
    status: "ingested",
    role: "Real centreline geometry in /data/klx-rivers.geojson. The only water geometry this twin actually ships.",
    limit:
      "A waterway line is not a floodplain. The companion /data/klx-flood-corridor.geojson is an interpretive 90 m buffer, not JPS zon banjir.",
  },
  {
    id: "openmeteo-precip",
    url: "https://open-meteo.com/",
    titleTh: "Open-Meteo hujan (ramalan)",
    titleEn: "Open-Meteo precipitation forecast for Kuala Lumpur",
    layer: "observation",
    confidence: "corroborated",
    status: "awaiting-ingest",
    role: "Forward rain, proxied at /api/live/weather. Model output, not a JPS gauge.",
    limit: "When it disagrees with InfoBanjir, InfoBanjir is what happened — once that feed is machine-readable.",
  },
  {
    id: "smart-tunnel",
    url: "https://www.smarttunnel.com.my/",
    titleTh: "Terowong SMART",
    titleEn: "SMART Tunnel — stormwater management and road tunnel",
    layer: "asset",
    confidence: "corroborated",
    status: "awaiting-ingest",
    role: "The one piece of KL drainage infrastructure every briefing mentions. Catalogued so it is not forgotten.",
    limit: "No public live 'open/closed to flood mode' API is used here. Do not invent a status light.",
  },
  {
    id: "fabdem-kl",
    url: "https://www.fathom.global/product/global-terrain-data-fabdem/",
    titleTh: "FABDEM (terrain)",
    titleEn: "FABDEM v1-2 — forest and buildings removed, for future flood routing",
    layer: "hazard",
    confidence: "corroborated",
    status: "awaiting-ingest",
    role: "The missing layer. Without elevation the flood twin can colour rivers but cannot say where the water goes.",
    limit: "30 m, NC-licensed, 2020s surface. Not street-level drainage.",
  },
];

export type LiveEndpoint = {
  id: string;
  label: string;
  upstream: string;
  route: string;
  agency: string;
  ttlSeconds: number;
  note: string;
};

export const LIVE_ENDPOINTS: LiveEndpoint[] = [
  {
    id: "rain",
    label: "Rainfall / flood portal",
    upstream: "https://publicinfobanjir.water.gov.my/",
    route: "/api/live/rain",
    agency: "Jabatan Pengairan dan Saliran — Public Info Banjir",
    ttlSeconds: 300,
    note: "No public JSON API. The Worker returns an honest unavailable envelope and points at the portal. Open-Meteo precipitation is on /api/live/weather.",
  },
];

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
