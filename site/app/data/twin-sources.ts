// Candidate data layers for the Bangkok digital twin.
//
// This is a researched shortlist, not a wish list: every entry names the twin
// capability it unlocks, what it costs to integrate, and the caveat that will
// bite later. It is deliberately written so another twin codebase can lift the
// file, swap the city-specific rows, and keep the structure — see
// docs/twin-data-sources.md.
//
// THREE FINDINGS SHAPED THE INTEGRATION AND ARE WORTH STATING UP FRONT.
//
// 1. Transport decides architecture, not preference. A feed is reachable from
//    a browser only if it is HTTPS *and* sends CORS headers. The BMA gauge
//    feed is neither, so it must be proxied; Open-Meteo is both, so it need
//    not be. We proxy it anyway — see `whyProxied` on that entry.
//
// 2. Terrain is the missing layer, not more overlays. Bangkok floods because
//    it is flat, low and sinking. Without elevation a flood twin can colour
//    districts but cannot answer "where does the water go", which is the only
//    question that matters.
//
// 3. A key in a repo is a leak. Every keyed source below reads its credential
//    from Worker env at request time. No key is imported, committed, or shipped
//    to the browser, and the proxy routes never echo one back.

export type TwinCategory =
  | "terrain"
  | "weather"
  | "air"
  | "population"
  | "places"
  | "mobility"
  | "hazard"
  | "imagery";

export type Integration =
  /** Live in this codebase now. */
  | "wired"
  /** Adapter written; needs a credential or a source URL to switch on. */
  | "ready"
  /** Researched and recommended; needs a build-time pipeline, not just a fetch. */
  | "researched";

export type TwinSource = {
  id: string;
  name: string;
  provider: string;
  category: TwinCategory;
  integration: Integration;
  /** The twin capability this unlocks — the reason it is on the list. */
  unlocks: string;
  licence: string;
  auth: "none" | "key" | "account";
  /** Can a browser call it directly? */
  browserReachable: boolean;
  /** Why we route it through the Worker even when the browser could reach it. */
  whyProxied?: string;
  /** The thing that will bite later. Written before integration, not after. */
  caveat: string;
  url: string;
  route?: string;
};

export const TWIN_SOURCES: TwinSource[] = [
  /* ---------------------------------------------------------- terrain */
  {
    id: "fabdem",
    name: "FABDEM v1-2 (forest & buildings removed)",
    provider: "University of Bristol / Fathom",
    category: "terrain",
    integration: "researched",
    unlocks:
      "The floor of a real flood model. FABDEM strips forest and building bias out of Copernicus GLO-30, and in published accuracy assessments over this exact region it ranked first among free global DEMs — ~1.95 m RMSE for the Bangkok area, best-in-class in urban terrain. With it, the flood-risk polygons stop being administrative shading and start being drainage: catchments, flow direction, ponding depth, and which of the 2,311 screened footprints sit in a hollow.",
    licence:
      "Free for non-commercial and academic use (CC BY-NC-SA 4.0). NOT open for commercial redistribution — the licence, not the download, is the constraint.",
    auth: "account",
    browserReachable: false,
    caveat:
      "30 m raster: right for catchment and exposure screening, far too coarse for street-level drainage. And it is a 2020s surface — it cannot see subsidence since. Also NC-licensed, so a commercial fork of this codebase must swap it for Copernicus GLO-30.",
    url: "https://www.fathom.global/product/global-terrain-data-fabdem/",
  },
  {
    id: "copernicus-glo30",
    name: "Copernicus DEM GLO-30",
    provider: "ESA / European Commission",
    category: "terrain",
    integration: "researched",
    unlocks:
      "The permissively-licensed terrain fallback. Slightly less accurate than FABDEM over built-up ground (it is a surface model — it includes buildings and canopy), but usable by anyone for anything, which FABDEM is not.",
    licence: "Free and open, attribution required. Commercial use permitted.",
    auth: "none",
    browserReachable: false,
    caveat:
      "A digital *surface* model: rooftops and tree canopy are terrain as far as it is concerned. Flood routing on raw GLO-30 in a dense district produces confident nonsense.",
    url: "https://dataspace.copernicus.eu/",
  },
  {
    id: "openmeteo-elevation",
    name: "Open-Meteo elevation",
    provider: "Open-Meteo",
    category: "terrain",
    integration: "ready",
    unlocks:
      "Point elevation for any coordinate with no key and no pipeline — enough to stamp a height onto each of the 571 register entries and each screened footprint, which is the cheapest possible first step toward a flood-exposure figure.",
    licence: "Free for non-commercial use, attribution requested.",
    auth: "none",
    browserReachable: true,
    caveat:
      "Point sampling from a coarse global model. Fine for tagging a monument, useless for hydraulics — do not mistake it for a DEM.",
    url: "https://open-meteo.com/en/docs/elevation-api",
  },

  /* ---------------------------------------------------------- weather */
  {
    id: "openmeteo-forecast",
    name: "Open-Meteo forecast",
    provider: "Open-Meteo (ECMWF, DWD ICON, NOAA GFS)",
    category: "weather",
    integration: "wired",
    unlocks:
      "The twin's forward view. The BMA gauge network says what has already fallen; this says what is coming, which is the difference between a dashboard and an operations tool. Hourly precipitation, temperature, humidity and wind, 16 days out, plus 80 years of history for context.",
    licence: "Free for non-commercial use (CC BY 4.0), attribution required.",
    auth: "none",
    browserReachable: true,
    whyProxied:
      "It is keyless and sends `Access-Control-Allow-Origin: *`, so the browser could call it directly — but every visitor would then hand their IP to a third party. This project's own privacy rule forbids collecting that ourselves; routing it through the Worker keeps the same promise about who else gets it, and buys edge caching for free.",
    caveat:
      "Model output, not observation. It will disagree with the gauge network, and when it does the gauge is what happened.",
    url: "https://open-meteo.com/",
    route: "/api/live/weather",
  },

  /* -------------------------------------------------------------- air */
  {
    id: "openmeteo-air",
    name: "Open-Meteo air quality",
    provider: "Open-Meteo (CAMS)",
    category: "air",
    integration: "wired",
    unlocks:
      "PM2.5, PM10 and ozone as numbers rather than as the NASA aerosol raster already on the atlas. The existing satellite layer is a regional optical-depth composite and says so; this gives a street-relevant figure to put beside it.",
    licence: "Free for non-commercial use (CC BY 4.0), attribution required.",
    auth: "none",
    browserReachable: true,
    whyProxied: "Same call as the forecast — one route, one cache, no visitor IPs leaving the origin.",
    caveat:
      "Also model reanalysis, not a sensor on a pole. Air4Thai's station network is the ground truth for Thailand and should eventually sit beside this.",
    url: "https://open-meteo.com/en/docs/air-quality-api",
    route: "/api/live/weather",
  },

  /* ------------------------------------------------------- population */
  {
    id: "ghsl",
    name: "GHS-POP + GHS-BUILT, 1975–2030",
    provider: "European Commission JRC (Copernicus)",
    category: "population",
    integration: "researched",
    unlocks:
      "Population growth as an actual surface, in five-year steps from 1975 to 2030 — the layer that answers 'how did this city arrive here'. Paired with GHS-BUILT it shows fifty years of Bangkok's built expansion against the heritage register, which is the single most legible way to show what the register has been losing ground to. It is also the exposure denominator: population inside a flood-risk polygon is what turns a hazard into a priority.",
    licence: "Open and free, attribution required. Commercial use permitted.",
    auth: "none",
    browserReachable: false,
    caveat:
      "GHS-POP disaggregates census counts by built-up volume, so it is strongest exactly where Bangkok is dense and weakest in rural fringes — published comparisons find large negative bias in rural cells. For the Bangkok core that is the right trade; for the outer districts, state it.",
    url: "https://human-settlement.emergency.copernicus.eu/ghs_pop.php",
  },

  /* ------------------------------------------------------------ places */
  {
    id: "longdo-search",
    name: "Longdo Map search, suggest & geocoding",
    provider: "Longdo (MetaMedia Technology)",
    category: "places",
    integration: "ready",
    unlocks:
      "Thai-first place resolution. The register's hardest problem is that 260 of 571 monuments cannot be placed better than their district, and the current resolver tries the register coordinate, then an OpenStreetMap name match, then gives up. Longdo's Thai POI corpus and Thai-language geocoder is a third pass aimed squarely at the gap — and unlike OSM it is built for Thai naming conventions, honorifics and วัด/ตรอก/ซอย forms.",
    licence: "Longdo API terms; free tier by key, commercial tiers above it.",
    auth: "key",
    browserReachable: false,
    whyProxied:
      "The key must never reach the browser. The Worker holds it in env and the client calls a same-origin route that never echoes it.",
    caveat:
      "A third resolver is a third way to be confidently wrong. Any Longdo match must land in `locatedBy` as its own method with its own confidence — never silently merged into the OSM tier — so a future audit can tell which pass placed a monument.",
    url: "https://map.longdo.com/docs/rest",
    route: "/api/live/longdo/search",
  },
  {
    id: "longdo-cameras",
    name: "Longdo traffic cameras (iTIC)",
    provider: "Longdo / iTIC Foundation",
    category: "mobility",
    integration: "ready",
    unlocks:
      "The camera rail, filled. Longdo's map API exposes a camera overlay whose Bangkok feeds come from the iTIC Foundation, delivered as HLS streams — which is the real source the war room's rail was built for and left empty rather than faked.",
    licence: "Longdo API terms; camera imagery remains its originating agency's.",
    auth: "key",
    browserReachable: false,
    whyProxied: "Key protection, plus one cached camera list instead of every visitor hitting Longdo.",
    caveat:
      "HLS, not still images. Decoding twenty live streams at once would cost more than the rest of the page combined, so the rail shows stills and opens a stream on demand. Camera coverage and uptime belong to the operating agencies, not to Longdo or to us.",
    url: "https://api.longdo.com/map/doc/",
    route: "/api/live/longdo/cameras",
  },
  {
    id: "longdo-routing",
    name: "Longdo routing & traffic speed",
    provider: "Longdo (MetaMedia Technology)",
    category: "mobility",
    integration: "researched",
    unlocks:
      "Thai road-network routing with live traffic speed. The seven documented walks currently carry OSRM foot-profile geometry, which is right for walking; this is the vehicle-side equivalent and the input to any accessibility or evacuation question the twin is eventually asked.",
    licence: "Longdo API terms; free tier by key.",
    auth: "key",
    browserReachable: false,
    caveat:
      "Do not re-route the existing walks through it. OSRM foot geometry is already published and cited; swapping engines silently would change documented distances without a recorded reason.",
    url: "https://map.longdo.com/docs/javascript/routing/routing-api",
  },

  /* ------------------------------------------------------------ hazard */
  {
    id: "bma-gauges",
    name: "BMA rainfall gauge network",
    provider: "สำนักการระบายน้ำ กทม. — BMA Drainage & Sewerage",
    category: "hazard",
    integration: "wired",
    unlocks:
      "Observed rainfall, station by station — the ground truth the forecast is checked against.",
    licence: "Public agency feed; terms not formally published.",
    auth: "none",
    browserReachable: false,
    whyProxied:
      "Mandatory, not stylistic: the endpoint is plain HTTP and sends no CORS headers, so no HTTPS page can fetch it. Only a server can.",
    caveat: "Undocumented response shape; the Worker validates and reports failure rather than rendering a zero.",
    url: "http://weather.bangkok.go.th/dds_webservices/api/rain/lastdata",
    route: "/api/live/rain",
  },
  {
    id: "gistda-flood",
    name: "Daily flood extent from satellite imagery",
    provider: "GISTDA (via data.go.th)",
    category: "hazard",
    integration: "researched",
    unlocks:
      "Observed inundation, daily, from space — the only source on this list that shows where water actually stood rather than where a zone says it might. It is the check on the flood-risk polygons: places that flood but are not zoned are the finding.",
    licence: "Open Government Data of Thailand licence.",
    auth: "none",
    browserReachable: false,
    caveat:
      "Optical satellite flood mapping is defeated by exactly the cloud cover that accompanies the flood. Gaps in the series are weather, not dry days — never chart it as if absence meant no flooding.",
    url: "https://data.go.th/en/dataset/http-flood-gistda-or-th",
  },

  /* ----------------------------------------------------------- imagery */
  {
    id: "esa-worldcover",
    name: "ESA WorldCover 10 m land cover",
    provider: "European Space Agency",
    category: "imagery",
    integration: "researched",
    unlocks:
      "Surface permeability at 10 m — the difference between ground that absorbs rain and ground that sheds it into the drainage network. Already part of the Minecraft world generator's inputs, so the project has the dependency but has never used the layer analytically.",
    licence: "CC BY 4.0.",
    auth: "none",
    browserReachable: false,
    caveat: "Ten-metre classes over a city of shophouse plots will blur a courtyard into its roof.",
    url: "https://esa-worldcover.org/",
  },
];

export const TWIN_TALLY = {
  total: TWIN_SOURCES.length,
  wired: TWIN_SOURCES.filter((s) => s.integration === "wired").length,
  ready: TWIN_SOURCES.filter((s) => s.integration === "ready").length,
  researched: TWIN_SOURCES.filter((s) => s.integration === "researched").length,
  keyless: TWIN_SOURCES.filter((s) => s.auth === "none").length,
  byCategory: TWIN_SOURCES.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] ?? 0) + 1;
    return acc;
  }, {}),
};

export const CATEGORY_LABEL: Record<TwinCategory, string> = {
  terrain: "Terrain",
  weather: "Weather",
  air: "Air",
  population: "Population",
  places: "Places",
  mobility: "Mobility",
  hazard: "Hazard",
  imagery: "Land cover",
};

export const INTEGRATION_LABEL: Record<Integration, string> = {
  wired: "wired",
  ready: "ready",
  researched: "researched",
};
