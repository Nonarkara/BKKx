"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Stop, World } from "../../walkthrough-data";
import {
  FINEARTS_HERITAGE_SITES,
  FINEARTS_HERITAGE_SOURCE,
  type HeritageSite,
} from "../../data/heritage-finearts";
import {
  BKK_URBAN_ZONING_GEOJSON,
  BKK_URBAN_ZONING_NOTE,
} from "../../data/zoning-planning";
import { WALKS, photoFor } from "../../data/heritage-content";
import { OLDTOWN_SPOTS } from "../../data/oldtown-spots";
import {
  HERITAGE_MOBILITY_NOTE,
  HERITAGE_MOBILITY_ROUTE_GEOJSON,
  HERITAGE_MOBILITY_SERVICES,
  HERITAGE_MOBILITY_STOP_GEOJSON,
  HERITAGE_MOBILITY_STOPS,
} from "../../data/heritage-mobility";
import ROWHOUSE_CANDIDATE_SUMMARY from "../../data/rowhouse-footprint-summary.json";

// The walks that geographically belong to Historic Core — everything except
// bang-krachao-loop, a disconnected bike loop far south of the old town.
const HISTORIC_CORE_WALK_SLUGS = [
  "six-faiths",
  "talad-noi-songwad",
  "royal-axis",
  "sam-phraeng-lanes",
  "charoen-krung-creative",
  "nang-loeng-market",
];

type Props = {
  world: World;
  embedded?: boolean;
  initialView?: { center: LngLat; zoom: number };
};

type LngLat = [number, number];

const OPENFREEMAP_DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

const BUILDING_SOURCE_CANDIDATES = ["openfreemap", "openmaptiles"];

// Real Bangkok over the OpenFreeMap dark base. Esri World Imagery is free
// for non-commercial use; attribution is wired in below.
const ESRI_IMAGERY_TILES = [
  "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
];
const ESRI_IMAGERY_ATTRIBUTION =
  "Imagery © Esri, Maxar, Earthstar Geographics, and the GIS User Community";

const NASA_AEROSOL_LAYER = "MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth";
const NASA_AEROSOL_SOURCE =
  "https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/MODIS_Combined_MAIAC_L2G_AerosolOpticalDepth.json";

const HERITAGE_DETAIL_COUNT = 9_275;
const HERITAGE_LANDMARK_PART_COUNT = 73;
const HERO_MONUMENT_PART_COUNT = 67;
const HERITAGE_DETAIL_NOTE =
  "Full-resolution OpenStreetMap footprints with curated typology heights. Hero monuments use official records and OSM footprints; tiering remains evidence-labelled schematic, not measured conservation documentation.";

const HERITAGE_DETAIL_HEIGHT: maplibregl.ExpressionSpecification = [
  "case",
  ["!=", ["coalesce", ["get", "render_height"], ["get", "height"], 9], 9],
  ["coalesce", ["get", "render_height"], ["get", "height"], 9],
  [
    "match",
    ["coalesce", ["get", "building"], ["get", "building_type"], ""],
    "temple", 18,
    "pagoda", 36,
    "shrine", 14,
    "chapel", 14,
    "monastery", 16,
    "commercial", 12,
    "retail", 12,
    "terrace", 12,
    "house", 10,
    "residential", 10,
    9,
  ],
];

const HERITAGE_DETAIL_COLOR: maplibregl.ExpressionSpecification = [
  "match",
  ["coalesce", ["get", "building"], ["get", "building_type"], ""],
  "temple", "#efb739",
  "pagoda", "#f0c24a",
  "shrine", "#d6a13a",
  "chapel", "#c99b55",
  "monastery", "#bd9346",
  "commercial", "#d8b072",
  "retail", "#d8b072",
  "terrace", "#c99a5d",
  "house", "#ad8a62",
  "residential", "#ad8a62",
  "#92785d",
];

const HERITAGE_LANDMARK_COLOR: maplibregl.ExpressionSpecification = [
  "match",
  ["get", "kind"],
  "monument", "#eee1bd",
  "chedi", "#ffd04d",
  "golden_mount", "#f0c24a",
  "prasat", "#f6c84f",
  "mondop", "#f6c84f",
  "throne", "#dca52d",
  "ubosot", "#f7bb2f",
  "viharn", "#dca52d",
  "heritage", "#efb739",
  "#efb739",
];

function nasaObservationDate() {
  // The combined Terra/Aqua NRT composite generally trails Bangkok by two
  // calendar days. A fixed lag avoids asking GIBS for a tile that does not yet
  // exist while keeping the date explicit in the interface.
  return new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
}

const BKKX_BUILDING_PAINT: maplibregl.FillExtrusionLayerSpecification["paint"] = {
  "fill-extrusion-color": "#c9ff38",
  "fill-extrusion-height": [
    "coalesce",
    ["get", "render_height"],
    ["get", "height"],
    0,
  ] as unknown as number,
  "fill-extrusion-base": [
    "coalesce",
    ["get", "render_min_height"],
    ["get", "min_height"],
    0,
  ] as unknown as number,
  // Slightly translucent so the satellite imagery shows through walls and
  // gaps. The BKKx signature stays in the building silhouettes.
  "fill-extrusion-opacity": 0.7,
  "fill-extrusion-vertical-gradient": true,
};

const ROAD_TIER_FILTERS: Record<string, maplibregl.ExpressionSpecification> = {
  motorway: ["==", "class", "motorway"],
  major: ["in", "class", "trunk", "primary", "secondary"] as unknown as maplibregl.ExpressionSpecification,
  minor: ["in", "class", "tertiary", "minor", "service"] as unknown as maplibregl.ExpressionSpecification,
};

function roadLineWidth(base: number, top: number): maplibregl.ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    10,
    base,
    18,
    top,
  ];
}

function parseCoordinates(value: string): LngLat | null {
  const match = value.match(
    /(-?\d+(?:\.\d+)?)\s*°\s*([NS])\s*·\s*(-?\d+(?:\.\d+)?)\s*°\s*([EW])/i,
  );
  if (!match) return null;
  const [, latRaw, latHemi, lngRaw, lngHemi] = match;
  const lat = Number(latRaw) * (latHemi.toUpperCase() === "S" ? -1 : 1);
  const lng = Number(lngRaw) * (lngHemi.toUpperCase() === "W" ? -1 : 1);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lng, lat];
}

function districtCenter(stops: Stop[]): LngLat {
  const coords = stops
    .map((stop) => parseCoordinates(stop.coordinates))
    .filter((value): value is LngLat => value !== null);
  if (coords.length === 0) return [100.5018, 13.7567];
  const lng = coords.reduce((sum, [x]) => sum + x, 0) / coords.length;
  const lat = coords.reduce((sum, [, y]) => sum + y, 0) / coords.length;
  return [lng, lat];
}

const PROJECTIONS: Record<string, {
  minMcX: number; maxMcX: number;
  minMcZ: number; maxMcZ: number;
  minGeoLat: number; maxGeoLat: number;
  minGeoLon: number; maxGeoLon: number;
}> = {
  "ratchathewi": {
    minMcX: 0, maxMcX: 4955,
    minMcZ: 0, maxMcZ: 2944,
    minGeoLat: 13.7478553, maxGeoLat: 13.7743399,
    minGeoLon: 100.5190372, maxGeoLon: 100.5649221
  },
  "historic-core": {
    minMcX: 0, maxMcX: 3383,
    minMcZ: 0, maxMcZ: 3216,
    minGeoLat: 13.737134, maxGeoLat: 13.766063,
    minGeoLon: 100.478897, maxGeoLon: 100.510225
  }
};

function getAmbientLight(timeMode: string) {
  switch (timeMode) {
    case "sunrise":
      return { color: "#ffd8b3", intensity: 0.8, position: [1.5, 45, 30] };
    case "noon":
      return { color: "#ffffff", intensity: 0.6, position: [1.1, 90, 80] };
    case "sunset":
      return { color: "#ffb3cc", intensity: 0.8, position: [1.5, 225, 25] };
    case "night":
      return { color: "#4a5bb3", intensity: 0.2, position: [1.5, 180, 85] };
    case "realtime":
default: {
      const hour = new Date().getHours();
      if (hour >= 6 && hour < 8) return { color: "#ffd8b3", intensity: 0.8, position: [1.5, 45, 30] };
      if (hour >= 8 && hour < 16) return { color: "#ffffff", intensity: 0.6, position: [1.1, 90, 80] };
      if (hour >= 16 && hour < 19) return { color: "#ffb3cc", intensity: 0.8, position: [1.5, 225, 25] };
      return { color: "#4a5bb3", intensity: 0.2, position: [1.5, 180, 85] };
    }
  }
}

function getStylesForConfig(timeMode: string, weatherMode: string) {
  let effTime = timeMode;
  if (timeMode === "realtime") {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 8) effTime = "sunrise";
    else if (hour >= 8 && hour < 16) effTime = "noon";
    else if (hour >= 16 && hour < 19) effTime = "sunset";
    else effTime = "night";
  }

  let satOpacity = 0.78;
  let satBrightness = 0.96;
  let satSaturation = -0.45;
  let satContrast = 0.08;

  let buildingColor = "#c9ff38";
  let buildingOpacity = 0.7;

  let motorwayColor = "#c9ff38";
  let majorRoadColor = "#5e6157";
  let minorRoadColor = "#2c2d28";

  if (effTime === "sunrise") {
    satOpacity = 0.65;
    satBrightness = 0.85;
    satSaturation = -0.2;
    satContrast = 0.15;
    buildingColor = "#ff9d42";
    motorwayColor = "#ff7e3b";
  } else if (effTime === "sunset") {
    satOpacity = 0.55;
    satBrightness = 0.75;
    satSaturation = -0.1;
    satContrast = 0.2;
    buildingColor = "#ff4b72";
    motorwayColor = "#ff386c";
  } else if (effTime === "night") {
    satOpacity = 0.22;
    satBrightness = 0.38;
    satSaturation = -0.75;
    satContrast = 0.3;
    buildingColor = "#00ffd8";
    buildingOpacity = 0.85;
    motorwayColor = "#e1ff00";
    majorRoadColor = "#2a2d36";
    minorRoadColor = "#121317";
  }

  if (weatherMode === "rainy") {
    satOpacity = Math.max(0.15, satOpacity * 0.7);
    satBrightness = Math.max(0.2, satBrightness * 0.65);
    satSaturation = Math.min(-0.8, satSaturation - 0.2);
    if (effTime !== "night") {
      buildingColor = "#8ca391";
    }
  } else if (weatherMode === "hazepm25") {
    satOpacity = Math.max(0.2, satOpacity * 0.8);
    satBrightness = Math.max(0.3, satBrightness * 0.85);
    satSaturation = -0.9;
  }

  return {
    satOpacity,
    satBrightness,
    satSaturation,
    satContrast,
    buildingColor,
    buildingOpacity,
    motorwayColor,
    majorRoadColor,
    minorRoadColor
  };
}

interface OpenMeteoAQIResponse {
  current?: {
    pm2_5?: number;
  };
}

interface OpenMeteoWeatherResponse {
  current?: {
    weather_code?: number;
    precipitation?: number;
  };
}

// WMO weather codes 51-99 cover drizzle through thunderstorm — anything in
// that range means it's actually raining in Bangkok right now.
function isLiveRain(weatherCode: number | null, precipitation: number | null): boolean {
  if (typeof precipitation === "number" && precipitation > 0) return true;
  return typeof weatherCode === "number" && weatherCode >= 51 && weatherCode <= 99;
}

// ---------------------------------------------------------------------------
// 6 POI layers — 5 from data.go.th, 1 sourced BKKx rowhouse atlas.
// ---------------------------------------------------------------------------

type PoiKind = "temple" | "royal-temple" | "national-museum" | "national-library" | "national-archive" | "oldtown";

type PoiFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    id: string;
    kind: PoiKind;
    name_th: string;
    name_en?: string | null;
    address?: string | null;
    sub_district?: string | null;
    district?: string | null;
    province?: string | null;
    postal_code?: string | null;
    // kind-specific
    temple_class?: string | null;
    sect?: string | null;
    established_be?: string | null;
    kathin_type?: string | null;
    museum_type?: string | null;
    museum_branch?: string | null;
    is_ancient_site?: string | null;
    // oldtown (BKKx hand-curated)
    callout?: string | null;
    calloutTh?: string | null;
    note?: string | null;
    noteTh?: string | null;
    photo?: string | null;
    period?: string | null;
    typology?: string | null;
    evidence?: string | null;
    explorer_tip?: string | null;
    register_id?: string | null;
    units?: number | null;
    geometry_method?: string | null;
    geometry_confidence?: string | null;
    source: string;
    source_url: string;
  };
};

type PoiFeatureCollection = {
  type: "FeatureCollection";
  kind: PoiKind;
  label_th: string;
  label_en: string;
  source: string;
  source_url: string;
  features: PoiFeature[];
};

type RowhouseCandidate = {
  overture_id: string;
  overture_release: string;
  cluster_slug: string;
  cluster_name: string;
  candidate_strength: string;
  morphology_score: number;
  area_m2: number;
  shape_ratio: number;
  aligned_neighbours_32m: number;
  corridor_distance_m: number;
  review_status: string;
};

type ArchitecturalDetail = {
  id: string;
  name?: string;
  name_en?: string;
  kind?: string;
  building_type?: string;
  height?: number;
  source?: string;
  source_url?: string;
  source_note?: string;
  model_status?: string;
  part_label?: string;
  height_source?: string;
  height_confidence?: string;
  not_measured_survey?: boolean;
  osm_id?: string | number;
};

type PoiLayerSpec = {
  kind: PoiKind;
  file?: string;
  label: string;
  labelTh: string;
  icon: string;
  // Muted palette — distinct from each other and from the signal yellow / alarm
  // red / amber layers. Inspired by the heritage fine-arts reg markers, but
  // quieter so 4 layers can coexist without screaming.
  color: string;
  defaultOn: boolean;
};

const POI_LAYERS: PoiLayerSpec[] = [
  {
    kind: "temple",
    file: "/pois/temples.geojson",
    label: "Temples",
    labelTh: "วัด",
    icon: "🛕",
    color: "#9c4a2b",
    defaultOn: false, // 460 pins — opt-in to keep the map clean
  },
  {
    kind: "royal-temple",
    file: "/pois/royal-temples.geojson",
    label: "Royal Temples",
    labelTh: "พระอารามหลวง",
    icon: "👑",
    color: "#6b4f8c",
    defaultOn: false,
  },
  {
    kind: "national-museum",
    file: "/pois/national-museums.geojson",
    label: "National Museums",
    labelTh: "พิพิธภัณฑสถานแห่งชาติ",
    icon: "🏛️",
    color: "#3a3a3a",
    defaultOn: false,
  },
  {
    kind: "national-archive",
    file: "/pois/national-archives.geojson",
    label: "National Archives",
    labelTh: "หอจดหมายเหตุแห่งชาติ",
    icon: "📜",
    color: "#5f8a26",
    defaultOn: false,
  },
  {
    kind: "national-library",
    file: "/pois/national-libraries.geojson",
    label: "National Libraries",
    labelTh: "หอสมุดแห่งชาติ",
    icon: "📚",
    color: "#2c5f7c",
    defaultOn: false,
  },
  {
    kind: "oldtown",
    label: "Rowhouse fabric",
    labelTh: "แผนที่ตึกแถว",
    icon: "▥",
    color: "#e0a23a",
    defaultOn: true,
  },
];

const OLDTOWN_POI_FEATURES: PoiFeature[] = OLDTOWN_SPOTS.map((spot) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: spot.center },
  properties: {
    id: spot.slug,
    kind: "oldtown",
    name_th: spot.thai,
    name_en: spot.name,
    callout: spot.callout,
    calloutTh: spot.calloutTh,
    note: spot.note,
    noteTh: spot.noteTh,
    photo: spot.photo,
    period: spot.period,
    typology: spot.typology,
    evidence: spot.evidence,
    explorer_tip: spot.explorerTip,
    register_id: spot.registerId ?? null,
    units: spot.units ?? null,
    geometry_method: spot.fabric.method,
    geometry_confidence: spot.fabric.geometryConfidence,
    source: spot.source,
    source_url: spot.sourceUrl,
  },
}));

const ROWHOUSE_FABRIC_GEOJSON = {
  type: "FeatureCollection" as const,
  features: OLDTOWN_SPOTS.map((spot) => ({
    type: "Feature" as const,
    properties: {
      slug: spot.slug,
      name: spot.name,
      thai: spot.thai,
      evidence: spot.evidence,
      geometry_method: spot.fabric.method,
      geometry_confidence: spot.fabric.geometryConfidence,
    },
    geometry: { type: "LineString" as const, coordinates: spot.fabric.coordinates },
  })),
};

export function AtlasView({ world, embedded = false, initialView }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // The type-only top-level `maplibregl` import has no runtime value —
  // effects outside the map-init closure that need to construct a Marker
  // (the POI effect below) read the real module through this ref instead.
  const maplibreModuleRef = useRef<typeof maplibregl | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const hasHistoricContext = world.id === "historic-core";
  const [activeStopId, setActiveStopId] = useState<string>(world.stops[0].id);
  const [mapReady, setMapReady] = useState(false);

  // Atmosphere Engine States
  const [timeMode, setTimeMode] = useState<"realtime" | "sunrise" | "noon" | "sunset" | "night">("realtime");
  const [weatherMode, setWeatherMode] = useState<"clear" | "rainy" | "hazepm25">("clear");
  const [pm25, setPm25] = useState<number | null>(null);
  // Flips true the moment the user picks a weather mode themselves, so the
  // live-conditions default below only ever applies once, before that.
  const weatherTouchedRef = useRef(false);

  // Cinematic Tour States
  const [isTourPlaying, setIsTourPlaying] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const tourTimerRef = useRef<NodeJS.Timeout | null>(null);

  // GIS Layer & Heritage Inspection States
  const [showHeritage, setShowHeritage] = useState(true);
  const [showZoning, setShowZoning] = useState(false);
  const [showMobility, setShowMobility] = useState(true);
  const [showAerosol, setShowAerosol] = useState(false);
  const [aerosolDate] = useState(nasaObservationDate);
  const [showArchitecturalDetail, setShowArchitecturalDetail] = useState(true);
  const [showRowhouseCandidates, setShowRowhouseCandidates] = useState(false);
  const [selectedHeritage, setSelectedHeritage] = useState<HeritageSite | null>(null);
  const [selectedArchitecture, setSelectedArchitecture] = useState<ArchitecturalDetail | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RowhouseCandidate | null>(null);
  const [selectedMobility, setSelectedMobility] = useState<{ kind: "service" | "stop"; id: string } | null>(null);
  const heritageMarkerRefs = useRef<maplibregl.Marker[]>([]);
  const [selectedWalkSlug, setSelectedWalkSlug] = useState<string | null>(null);
  const [walkGeometry, setWalkGeometry] = useState<Record<string, { line: LngLat[] }> | null>(null);

  // 5 data.go.th POI layers — each is a static GeoJSON of <500 KB
  // served from /pois/. The 4 smaller layers are on by default; the 460-pin
  // temples layer is opt-in.
  const [showPoi, setShowPoi] = useState<Record<PoiKind, boolean>>(() => {
    const init = {} as Record<PoiKind, boolean>;
    for (const l of POI_LAYERS) init[l.kind] = l.defaultOn;
    return init;
  });
  const [poiData, setPoiData] = useState<Record<PoiKind, PoiFeature[] | null>>(() => {
    const init = {} as Record<PoiKind, PoiFeature[] | null>;
    for (const l of POI_LAYERS) init[l.kind] = l.kind === "oldtown" ? OLDTOWN_POI_FEATURES : null;
    return init;
  });
  const [poiCounts, setPoiCounts] = useState<Record<PoiKind, number>>(() => {
    const init = {} as Record<PoiKind, number>;
    for (const l of POI_LAYERS) init[l.kind] = l.kind === "oldtown" ? OLDTOWN_POI_FEATURES.length : 0;
    return init;
  });
  const [selectedPoi, setSelectedPoi] = useState<PoiFeature | null>(null);

  function toggleRowhouseCandidates() {
    if (showRowhouseCandidates) setSelectedCandidate(null);
    setShowRowhouseCandidates((visible) => !visible);
  }

  function toggleArchitecturalDetail() {
    if (showArchitecturalDetail) setSelectedArchitecture(null);
    setShowArchitecturalDetail((visible) => !visible);
  }
  const poiMarkerRefs = useRef<Record<PoiKind, maplibregl.Marker[]>>({
    temple: [],
    "royal-temple": [],
    "national-museum": [],
    "national-archive": [],
    "national-library": [],
    oldtown: [],
  });

  // Command Copy State
  const [copied, setCopied] = useState(false);

  // Derived state to avoid synchronous state update in effect body
  const activeStopIdToUse = isTourPlaying ? (world.stops[tourIndex]?.id ?? activeStopId) : activeStopId;

  const activeStop = useMemo(
    () => world.stops.find((stop) => stop.id === activeStopIdToUse) ?? world.stops[0],
    [activeStopIdToUse, world.stops],
  );

  // Refs to store latest tour state for persistent event listeners
  const tourIndexRef = useRef(tourIndex);
  const isTourPlayingRef = useRef(isTourPlaying);

  useEffect(() => {
    tourIndexRef.current = tourIndex;
    isTourPlayingRef.current = isTourPlaying;
  }, [tourIndex, isTourPlaying]);

  // Refs mirror the latest fetched values so either fetch's callback can
  // apply the live-conditions default using both, whichever resolves last.
  const pm25Ref = useRef<number | null>(null);
  const liveWeatherRef = useRef<{ code: number | null; precipitation: number | null }>({
    code: null,
    precipitation: null,
  });

  // The Atmosphere Engine defaults to what Bangkok is actually doing right
  // now — live rain wins, then unhealthy live PM2.5, else it stays clear.
  // Only applies once, and never after the user has picked a mode themselves.
  const applyLiveWeatherDefault = () => {
    if (weatherTouchedRef.current) return;
    if (isLiveRain(liveWeatherRef.current.code, liveWeatherRef.current.precipitation)) {
      setWeatherMode("rainy");
    } else if (pm25Ref.current !== null && pm25Ref.current > 55) {
      setWeatherMode("hazepm25");
    }
  };

  // Live AQI Fetch
  useEffect(() => {
    fetch("https://air-quality-api.open-meteo.com/v1/air-quality?latitude=13.7563&longitude=100.5018&current=pm2_5")
      .then((res) => (res.ok ? (res.json() as Promise<OpenMeteoAQIResponse>) : null))
      .then((data) => {
        const val = data?.current?.pm2_5;
        if (typeof val === "number") {
          const rounded = Math.round(val);
          setPm25(rounded);
          pm25Ref.current = rounded;
          applyLiveWeatherDefault();
        }
      })
      .catch((err) => console.warn("bkkx: pm25 fetch failed", err));
  }, []);

  const pm25Status = useMemo(() => {
    if (pm25 === null) return { text: "fetching...", color: "#a4a69b" };
    if (pm25 <= 12) return { text: `${pm25} µg/m³ (Good)`, color: "#3bfd00" };
    if (pm25 <= 35) return { text: `${pm25} µg/m³ (Moderate)`, color: "#fdf800" };
    if (pm25 <= 55) return { text: `${pm25} µg/m³ (Sensitive-Unhealthy)`, color: "#fd9f00" };
    return { text: `${pm25} µg/m³ (Unhealthy)`, color: "#fd3300" };
  }, [pm25]);

  // Live weather fetch — same Bangkok coordinate as the PM2.5 call above.
  useEffect(() => {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&current=weather_code,precipitation")
      .then((res) => (res.ok ? (res.json() as Promise<OpenMeteoWeatherResponse>) : null))
      .then((data) => {
        const code = data?.current?.weather_code;
        const precipitation = data?.current?.precipitation;
        const resolved = {
          code: typeof code === "number" ? code : null,
          precipitation: typeof precipitation === "number" ? precipitation : null,
        };
        liveWeatherRef.current = resolved;
        applyLiveWeatherDefault();
      })
      .catch((err) => console.warn("bkkx: weather fetch failed", err));
  }, []);

  // Walk route geometry — same file /walks/:slug pages already draw
  // (PlaceMap.tsx), fetched once so any walk can be picked from the panel.
  useEffect(() => {
    if (!hasHistoricContext) return;
    fetch("/heritage-walk-geometry.json")
      .then((res) => (res.ok ? (res.json() as Promise<Record<string, { line: LngLat[] }>>) : null))
      .then((data) => {
        if (data) setWalkGeometry(data);
      })
      .catch((err) => console.warn("bkkx: walk geometry fetch failed", err));
  }, [hasHistoricContext]);

  // 5 data.go.th POI layers — fetched once, only the visible ones get markers.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const layer of POI_LAYERS) {
        if (!layer.file) continue;
        try {
          const res = await fetch(layer.file);
          if (!res.ok) {
            console.warn(`bkkx: ${layer.file} returned ${res.status}`);
            continue;
          }
          const data = (await res.json()) as PoiFeatureCollection;
          if (cancelled) return;
          setPoiData((prev) => ({ ...prev, [layer.kind]: data.features }));
          setPoiCounts((prev) => ({ ...prev, [layer.kind]: data.features.length }));
        } catch (err) {
          console.warn(`bkkx: ${layer.file} fetch failed`, err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const historicCoreWalks = useMemo(
    () => WALKS.filter((walk) => HISTORIC_CORE_WALK_SLUGS.includes(walk.slug)),
    [],
  );

  // Compute Minecraft TP coordinates
  const mcCoords = useMemo(() => {
    const proj = PROJECTIONS[world.id];
    if (!proj) return null;
    const coord = parseCoordinates(activeStop.coordinates);
    if (!coord) return null;
    const [lng, lat] = coord;
    const mcX = Math.round(((lng - proj.minGeoLon) / (proj.maxGeoLon - proj.minGeoLon)) * (proj.maxMcX - proj.minMcX) + proj.minMcX);
    const mcZ = Math.round(((proj.maxGeoLat - lat) / (proj.maxGeoLat - proj.minGeoLat)) * (proj.maxMcZ - proj.minMcZ) + proj.minMcZ);
    return { x: mcX, z: mcZ };
  }, [activeStop, world.id]);

  const copyTpCommand = () => {
    if (!mcCoords) return;
    const cmd = `/tp ${mcCoords.x} 72 ${mcCoords.z}`;
    navigator.clipboard.writeText(cmd)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error("Could not copy command", err));
  };

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    let active = true;
    let mapInstance: maplibregl.Map | null = null;
    let resizeObserverInstance: ResizeObserver | null = null;
    // Snapshot the POI marker ref at effect-time so the cleanup can iterate
    // a stable object even if React re-renders between effect and teardown.
    const poiMarkerSnapshot: Record<PoiKind, maplibregl.Marker[]> = {
      temple: [...poiMarkerRefs.current.temple],
      "royal-temple": [...poiMarkerRefs.current["royal-temple"]],
      "national-museum": [...poiMarkerRefs.current["national-museum"]],
      "national-archive": [...poiMarkerRefs.current["national-archive"]],
      "national-library": [...poiMarkerRefs.current["national-library"]],
      oldtown: [...poiMarkerRefs.current.oldtown],
    };

    import("maplibre-gl").then((MapLibreModule) => {
      if (!active) return;
      const maplibregl = MapLibreModule.default;
      maplibreModuleRef.current = maplibregl;

      const map = new maplibregl.Map({
        container: containerRef.current!,
        style: OPENFREEMAP_DARK_STYLE,
        center: initialView?.center ?? districtCenter(world.stops),
        zoom: initialView?.zoom ?? 15.4,
        pitch: 60,
        bearing: -20,
        maxPitch: 75,
        minZoom: 11,
        maxZoom: 19,
        hash: false,
        attributionControl: { compact: true },
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
        "top-right",
      );
      map.addControl(
        new maplibregl.ScaleControl({ unit: "metric", maxWidth: 120 }),
        "bottom-left",
      );

      // Pause tour on map manipulation
      const handleMapInteract = () => {
        if (isTourPlayingRef.current) {
          setIsTourPlaying(false);
          setActiveStopId(world.stops[tourIndexRef.current]?.id ?? world.stops[0].id);
        }
      };

      map.on("dragstart", handleMapInteract);
      map.on("zoomstart", handleMapInteract);
      map.on("pitchstart", handleMapInteract);
      map.on("rotatestart", handleMapInteract);

      map.on("load", () => {
        if (!active) return;
        const style = map.getStyle();
        const source = style.sources
          ? Object.entries(style.sources).find(([name]) =>
              BUILDING_SOURCE_CANDIDATES.includes(name),
            )?.[0]
          : undefined;

        if (!map.getSource("bkkx-esri-imagery")) {
          try {
            map.addSource("bkkx-esri-imagery", {
              type: "raster",
              tiles: ESRI_IMAGERY_TILES,
              tileSize: 256,
              attribution: ESRI_IMAGERY_ATTRIBUTION,
              maxzoom: 19,
            });
            map.addLayer({
              id: "bkkx-satellite",
              type: "raster",
              source: "bkkx-esri-imagery",
              paint: {
                "raster-opacity": 0.78,
                "raster-saturation": -0.45,
                "raster-contrast": 0.08,
                "raster-brightness-min": 0.04,
                "raster-brightness-max": 0.96,
              },
            });
          } catch (err) {
            console.warn("bkkx: satellite layer failed", err);
          }
        }

        if (hasHistoricContext && !map.getSource("bkkx-nasa-aerosol")) {
          try {
            map.addSource("bkkx-nasa-aerosol", {
              type: "raster",
              tiles: [
                `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${NASA_AEROSOL_LAYER}/default/${aerosolDate}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`,
              ],
              tileSize: 256,
              minzoom: 0,
              maxzoom: 7,
              attribution: "NASA EOSDIS GIBS · Terra + Aqua MODIS MAIAC",
            });
            map.addLayer({
              id: "bkkx-aerosol",
              type: "raster",
              source: "bkkx-nasa-aerosol",
              layout: { visibility: "none" },
              paint: {
                "raster-opacity": 0.68,
                "raster-resampling": "linear",
                "raster-fade-duration": 180,
              },
            });
          } catch (err) {
            console.warn("bkkx: NASA aerosol layer failed", err);
          }
        }

        if (source && !map.getLayer("bkkx-roads-minor")) {
          const addLine = (
            id: string,
            filter: maplibregl.ExpressionSpecification,
            color: string,
            width: maplibregl.ExpressionSpecification,
            opacity = 0.85,
          ) => {
            try {
              map.addLayer({
                id,
                type: "line",
                source,
                "source-layer": "transportation",
                filter,
                layout: { "line-join": "round", "line-cap": "round" },
                paint: {
                  "line-color": color,
                  "line-width": width,
                  "line-opacity": opacity,
                },
              });
            } catch (err) {
              console.warn(`bkkx: road layer ${id} failed`, err);
            }
          };

          addLine("bkkx-roads-minor", ROAD_TIER_FILTERS.minor, "#2c2d28", roadLineWidth(0.3, 2.4), 0.7);
          addLine("bkkx-roads-major", ROAD_TIER_FILTERS.major, "#5e6157", roadLineWidth(0.4, 3.6), 0.9);
          addLine("bkkx-roads-motorway", ROAD_TIER_FILTERS.motorway, "#c9ff38", roadLineWidth(0.6, 5.2), 1.0);
        }

        if (source && !map.getLayer("bkkx-3d-buildings")) {
          try {
            map.addLayer({
              id: "bkkx-3d-buildings",
              type: "fill-extrusion",
              source,
              "source-layer": "building",
              minzoom: 13,
              paint: BKKX_BUILDING_PAINT,
            });
          } catch (err) {
            console.warn("bkkx: 3d buildings layer failed", err);
          }
        }

        // A heritage atlas needs more than the city's generic extrusion tile.
        // This first architectural-detail tier keeps full Old Town footprints,
        // restores culturally meaningful height defaults and adds separately
        // inspectable landmark parts. It is interpretive massing, never a BIM
        // model or a substitute for a measured conservation survey.
        if (hasHistoricContext && !map.getSource("bkkx-heritage-detail-src")) {
          try {
            map.addSource("bkkx-heritage-detail-src", {
              type: "geojson",
              data: "/data/bkk-heritage-detail.geojson",
              attribution: "© OpenStreetMap contributors (ODbL-1.0) · BKKx heritage detail",
            });
            map.addSource("bkkx-heritage-landmarks-src", {
              type: "geojson",
              data: "/data/bkk-landmarks.geojson",
              attribution: "BKKx interpretive landmark massing",
            });
            map.addSource("bkkx-hero-monuments-src", {
              type: "geojson",
              data: "/data/bkk-hero-monuments.geojson",
              attribution: "Fine Arts Department envelope · © OpenStreetMap contributors · BKKx schematic tiering",
            });
            map.addLayer({
              id: "bkkx-heritage-detail",
              type: "fill-extrusion",
              source: "bkkx-heritage-detail-src",
              minzoom: 13.5,
              filter: ["all", ["!=", ["get", "hide_3d"], true], [">", HERITAGE_DETAIL_HEIGHT, 0]],
              paint: {
                "fill-extrusion-color": HERITAGE_DETAIL_COLOR,
                "fill-extrusion-height": HERITAGE_DETAIL_HEIGHT,
                "fill-extrusion-base": [
                  "case",
                  [
                    ">=",
                    ["coalesce", ["get", "render_min_height"], ["get", "min_height"], ["get", "base_height"], 0],
                    HERITAGE_DETAIL_HEIGHT,
                  ],
                  0,
                  ["coalesce", ["get", "render_min_height"], ["get", "min_height"], ["get", "base_height"], 0],
                ],
                "fill-extrusion-opacity": 1,
                "fill-extrusion-vertical-gradient": true,
              },
            });
            map.addLayer({
              id: "bkkx-heritage-landmarks",
              type: "fill-extrusion",
              source: "bkkx-heritage-landmarks-src",
              minzoom: 13,
              paint: {
                "fill-extrusion-color": HERITAGE_LANDMARK_COLOR,
                "fill-extrusion-height": ["coalesce", ["get", "height"], 12],
                "fill-extrusion-base": ["coalesce", ["get", "base_height"], 0],
                "fill-extrusion-opacity": 1,
                "fill-extrusion-vertical-gradient": true,
              },
            });
            map.addLayer({
              id: "bkkx-hero-monuments",
              type: "fill-extrusion",
              source: "bkkx-hero-monuments-src",
              minzoom: 12.8,
              paint: {
                "fill-extrusion-color": ["coalesce", ["get", "material_color"], "#f1c75b"],
                "fill-extrusion-height": ["coalesce", ["get", "height"], 12],
                "fill-extrusion-base": ["coalesce", ["get", "base_height"], 0],
                "fill-extrusion-opacity": 1,
                "fill-extrusion-vertical-gradient": true,
              },
            });
            map.addLayer({
              id: "bkkx-heritage-landmark-labels",
              type: "symbol",
              source: "bkkx-heritage-landmarks-src",
              minzoom: 15.8,
              filter: ["has", "name"],
              layout: {
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-size": 10,
                "text-offset": [0, 1],
                "text-anchor": "top",
                "text-allow-overlap": false,
              },
              paint: {
                "text-color": "#ffe3a0",
                "text-halo-color": "#17120c",
                "text-halo-width": 1.5,
              },
            });
            map.addLayer({
              id: "bkkx-hero-monument-labels",
              type: "symbol",
              source: "bkkx-hero-monuments-src",
              minzoom: 14.2,
              filter: [
                "in",
                ["get", "id"],
                [
                  "literal",
                  [
                    "wat-arun-central-base",
                    "grand-palace-siratana-chedi-base",
                    "grand-palace-phra-mondop-body",
                    "grand-palace-thepbidorn-body",
                  ],
                ],
              ],
              layout: {
                "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
                "text-size": 11,
                "text-offset": [0, 1.4],
                "text-anchor": "top",
                "text-allow-overlap": false,
              },
              paint: {
                "text-color": "#fff0c2",
                "text-halo-color": "#17120c",
                "text-halo-width": 1.6,
              },
            });

            const inspectArchitecture = (event: maplibregl.MapLayerMouseEvent) => {
              const properties = event.features?.[0]?.properties;
              if (!properties) return;
              setSelectedArchitecture(properties as unknown as ArchitecturalDetail);
              setSelectedHeritage(null);
              setSelectedPoi(null);
              setSelectedCandidate(null);
              setSelectedMobility(null);
            };
            for (const layerId of ["bkkx-heritage-landmarks", "bkkx-hero-monuments"]) {
              map.on("click", layerId, inspectArchitecture);
              map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
              map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
            }
          } catch (err) {
            console.warn("bkkx: architectural detail layer failed", err);
          }
        }

        // Add BMA Urban Planning & Cultural Conservation Zoning GeoJSON
        if (hasHistoricContext && !map.getSource("bkkx-zoning-src")) {
          try {
            map.addSource("bkkx-zoning-src", {
              type: "geojson",
              data: BKK_URBAN_ZONING_GEOJSON as unknown as maplibregl.GeoJSONSourceSpecification["data"],
            });

            map.addLayer({
              id: "bkkx-zoning-fill",
              type: "fill",
              source: "bkkx-zoning-src",
              filter: ["==", "$type", "Polygon"],
              paint: {
                "fill-color": ["get", "fillColor"],
                "fill-opacity": ["get", "opacity"],
              },
            });

            map.addLayer({
              id: "bkkx-zoning-line",
              type: "line",
              source: "bkkx-zoning-src",
              paint: {
                "line-color": ["get", "strokeColor"],
                "line-width": [
                  "case",
                  ["==", ["get", "category"], "Canal"],
                  3.5,
                  ["==", ["get", "category"], "Boulevard"],
                  3.0,
                  2.0,
                ],
                "line-dasharray": [
                  "case",
                  ["==", ["get", "category"], "Conservation"],
                  ["literal", [2, 2]],
                  ["literal", [1, 0]],
                ],
                "line-opacity": 0.9,
              },
            });
          } catch (err) {
            console.warn("bkkx: zoning layer failed", err);
          }
        }

        // Heritage mobility: rail is solid; scheduled water transport is dotted.
        // The geometry is intentionally schematic and every inspector links back
        // to the operator, so orientation never masquerades as live operations.
        if (hasHistoricContext && !map.getSource("bkkx-mobility-routes-src")) {
          try {
            map.addSource("bkkx-mobility-routes-src", {
              type: "geojson",
              data: HERITAGE_MOBILITY_ROUTE_GEOJSON as unknown as maplibregl.GeoJSONSourceSpecification["data"],
            });
            map.addSource("bkkx-mobility-stops-src", {
              type: "geojson",
              data: HERITAGE_MOBILITY_STOP_GEOJSON as unknown as maplibregl.GeoJSONSourceSpecification["data"],
            });
            map.addLayer({
              id: "bkkx-mobility-rail-casing",
              type: "line",
              source: "bkkx-mobility-routes-src",
              filter: ["==", ["get", "family"], "rail"],
              paint: { "line-color": "#0d1519", "line-width": 6, "line-opacity": 0.82 },
            });
            map.addLayer({
              id: "bkkx-mobility-rail",
              type: "line",
              source: "bkkx-mobility-routes-src",
              filter: ["==", ["get", "family"], "rail"],
              layout: { "line-cap": "round", "line-join": "round" },
              paint: { "line-color": ["get", "color"], "line-width": 3.1, "line-opacity": 0.95 },
            });
            map.addLayer({
              id: "bkkx-mobility-water-casing",
              type: "line",
              source: "bkkx-mobility-routes-src",
              filter: ["in", ["get", "family"], ["literal", ["boat", "ferry"]]],
              paint: { "line-color": "#0d1519", "line-width": 5.5, "line-opacity": 0.76 },
            });
            map.addLayer({
              id: "bkkx-mobility-boat",
              type: "line",
              source: "bkkx-mobility-routes-src",
              filter: ["==", ["get", "family"], "boat"],
              layout: { "line-cap": "round", "line-join": "round" },
              paint: {
                "line-color": ["get", "color"],
                "line-width": 3,
                "line-opacity": 0.96,
                "line-dasharray": [0.8, 1.6],
              },
            });
            map.addLayer({
              id: "bkkx-mobility-ferry",
              type: "line",
              source: "bkkx-mobility-routes-src",
              filter: ["==", ["get", "family"], "ferry"],
              layout: { "line-cap": "round" },
              paint: {
                "line-color": ["get", "color"],
                "line-width": 2.6,
                "line-opacity": 0.96,
                "line-dasharray": [0.35, 1.15],
              },
            });
            map.addLayer({
              id: "bkkx-mobility-stops",
              type: "circle",
              source: "bkkx-mobility-stops-src",
              minzoom: 12.5,
              paint: {
                "circle-color": "#f5f0e6",
                "circle-radius": ["interpolate", ["linear"], ["zoom"], 12.5, 2.8, 16, 5],
                "circle-stroke-color": "#12202a",
                "circle-stroke-width": 1.5,
              },
            });
            map.addLayer({
              id: "bkkx-mobility-stop-labels",
              type: "symbol",
              source: "bkkx-mobility-stops-src",
              minzoom: 14.2,
              layout: {
                "text-field": ["get", "name"],
                "text-size": 10,
                "text-offset": [0, 1.15],
                "text-anchor": "top",
                "text-allow-overlap": false,
              },
              paint: {
                "text-color": "#f7f2e9",
                "text-halo-color": "#11120f",
                "text-halo-width": 1.4,
              },
            });

            const inspectMobilityService = (event: maplibregl.MapLayerMouseEvent) => {
              const id = event.features?.[0]?.properties?.id as string | undefined;
              if (!id) return;
              setSelectedMobility({ kind: "service", id });
              setSelectedPoi(null);
              setSelectedHeritage(null);
              setSelectedCandidate(null);
              setSelectedArchitecture(null);
            };
            const inspectMobilityStop = (event: maplibregl.MapLayerMouseEvent) => {
              const id = event.features?.[0]?.properties?.id as string | undefined;
              if (!id) return;
              setSelectedMobility({ kind: "stop", id });
              setSelectedPoi(null);
              setSelectedHeritage(null);
              setSelectedCandidate(null);
              setSelectedArchitecture(null);
            };
            for (const layerId of ["bkkx-mobility-rail", "bkkx-mobility-boat", "bkkx-mobility-ferry"]) {
              map.on("click", layerId, inspectMobilityService);
              map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
              map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
            }
            map.on("click", "bkkx-mobility-stops", inspectMobilityStop);
            map.on("mouseenter", "bkkx-mobility-stops", () => { map.getCanvas().style.cursor = "pointer"; });
            map.on("mouseleave", "bkkx-mobility-stops", () => { map.getCanvas().style.cursor = ""; });
          } catch (err) {
            console.warn("bkkx: heritage mobility layer failed", err);
          }
        }

        // Walk-route line, empty until a walk is picked from the GIS Layers
        // panel — real street-following geometry, filled in by the sync
        // effect below, same as /heritage-walk-geometry.json already draws
        // on the individual /walks/:slug pages (see PlaceMap.tsx).
        if (hasHistoricContext && !map.getSource("bkkx-route-src")) {
          try {
            map.addSource("bkkx-route-src", {
              type: "geojson",
              data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
            });
            map.addLayer({
              id: "bkkx-route-casing",
              type: "line",
              source: "bkkx-route-src",
              layout: { visibility: "none" },
              paint: { "line-color": "#14140f", "line-width": 6, "line-opacity": 0.8 },
            });
            map.addLayer({
              id: "bkkx-route-line",
              type: "line",
              source: "bkkx-route-src",
              layout: { visibility: "none" },
              paint: { "line-color": "#c9ff38", "line-width": 2.5 },
            });
          } catch (err) {
            console.warn("bkkx: route layer failed", err);
          }
        }

        // Cultural-fabric corridors: documented street/block axes, not legal
        // parcel boundaries. High-confidence records render solid; interpretive
        // connections render dashed so the map never disguises inference as fact.
        if (hasHistoricContext && !map.getSource("bkkx-rowhouse-fabric-src")) {
          try {
            map.addSource("bkkx-rowhouse-fabric-src", {
              type: "geojson",
              data: ROWHOUSE_FABRIC_GEOJSON,
            });
            map.addLayer({
              id: "bkkx-rowhouse-fabric-casing",
              type: "line",
              source: "bkkx-rowhouse-fabric-src",
              paint: { "line-color": "#15110b", "line-width": 5.5, "line-opacity": 0.78 },
            });
            map.addLayer({
              id: "bkkx-rowhouse-fabric-solid",
              type: "line",
              source: "bkkx-rowhouse-fabric-src",
              filter: ["==", ["get", "geometry_confidence"], "high"],
              paint: { "line-color": "#e0a23a", "line-width": 2.7, "line-opacity": 0.95 },
            });
            map.addLayer({
              id: "bkkx-rowhouse-fabric-inferred",
              type: "line",
              source: "bkkx-rowhouse-fabric-src",
              filter: ["!=", ["get", "geometry_confidence"], "high"],
              paint: {
                "line-color": "#f4d492",
                "line-width": 2.3,
                "line-opacity": 0.9,
                "line-dasharray": [2, 2],
              },
            });
            map.addLayer({
              id: "bkkx-rowhouse-fabric-labels",
              type: "symbol",
              source: "bkkx-rowhouse-fabric-src",
              minzoom: 15.2,
              layout: {
                "symbol-placement": "line",
                "text-field": ["get", "name"],
                "text-size": 10,
                "text-letter-spacing": 0.03,
                "text-max-angle": 35,
                "text-allow-overlap": false,
              },
              paint: {
                "text-color": "#ffd792",
                "text-halo-color": "#17120c",
                "text-halo-width": 1.4,
              },
            });

            const inspectFabric = (event: maplibregl.MapLayerMouseEvent) => {
              const slug = event.features?.[0]?.properties?.slug as string | undefined;
              const feature = OLDTOWN_POI_FEATURES.find((candidate) => candidate.properties.id === slug);
              if (!feature) return;
              setSelectedPoi(feature);
              setSelectedMobility(null);
              setSelectedArchitecture(null);
              map.flyTo({ center: feature.geometry.coordinates, zoom: 16.7, pitch: 60, speed: 0.8, essential: true });
            };
            for (const layerId of ["bkkx-rowhouse-fabric-solid", "bkkx-rowhouse-fabric-inferred"]) {
              map.on("click", layerId, inspectFabric);
              map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
              map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
            }
          } catch (err) {
            console.warn("bkkx: rowhouse fabric layer failed", err);
          }
        }

        // Present-day Overture roofprints/footprints screened by morphology.
        // Deliberately opt-in: these are a field-review queue, not confirmed
        // rowhouses, age estimates or statutory heritage designations.
        if (hasHistoricContext && !map.getSource("bkkx-rowhouse-candidates-src")) {
          try {
            map.addSource("bkkx-rowhouse-candidates-src", {
              type: "geojson",
              data: "/data/bangkok-rowhouse-footprint-candidates.geojson",
            });
            map.addLayer({
              id: "bkkx-rowhouse-candidates-possible",
              type: "fill",
              source: "bkkx-rowhouse-candidates-src",
              minzoom: 13.5,
              filter: ["==", ["get", "candidate_strength"], "possible morphology"],
              layout: { visibility: "none" },
              paint: { "fill-color": "#f4d492", "fill-opacity": 0.24 },
            });
            map.addLayer({
              id: "bkkx-rowhouse-candidates-strong",
              type: "fill",
              source: "bkkx-rowhouse-candidates-src",
              minzoom: 13.5,
              filter: ["==", ["get", "candidate_strength"], "strong morphology"],
              layout: { visibility: "none" },
              paint: { "fill-color": "#ffb52b", "fill-opacity": 0.48 },
            });
            map.addLayer({
              id: "bkkx-rowhouse-candidates-outline",
              type: "line",
              source: "bkkx-rowhouse-candidates-src",
              minzoom: 13.5,
              layout: { visibility: "none" },
              paint: { "line-color": "#fff0c7", "line-width": 1, "line-opacity": 0.72 },
            });

            const inspectCandidate = (event: maplibregl.MapLayerMouseEvent) => {
              const properties = event.features?.[0]?.properties;
              if (!properties) return;
              setSelectedCandidate(properties as unknown as RowhouseCandidate);
              setSelectedPoi(null);
              setSelectedHeritage(null);
              setSelectedMobility(null);
              setSelectedArchitecture(null);
            };
            for (const layerId of ["bkkx-rowhouse-candidates-possible", "bkkx-rowhouse-candidates-strong"]) {
              map.on("click", layerId, inspectCandidate);
              map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
              map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
            }
          } catch (err) {
            console.warn("bkkx: rowhouse candidate layer failed", err);
          }
        }

        setMapReady(true);
      });

      // Add Walkthrough Chapter Markers
      world.stops.forEach((stop, index) => {
        const coord = parseCoordinates(stop.coordinates);
        if (!coord) return;
        const el = document.createElement("button");
        el.type = "button";
        el.className = "bkkx-marker";
        el.setAttribute("aria-label", `Open chapter ${index + 1}: ${stop.name}`);
        const label = document.createElement("span");
        label.textContent = String(index + 1).padStart(2, "0");
        el.appendChild(label);
        el.addEventListener("click", (event) => {
          event.preventDefault();
          setIsTourPlaying(false);
          setActiveStopId(stop.id);
          setTourIndex(index);
          map.flyTo({ center: coord, zoom: 16.6, pitch: 64, speed: 0.9, essential: true });
        });
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(coord)
          .addTo(map);
        markerRefs.current.push(marker);
      });

      // Add Fine Arts Heritage Markers
      if (hasHistoricContext) {
        FINEARTS_HERITAGE_SITES.forEach((site) => {
          const el = document.createElement("button");
          el.type = "button";
          el.className = "bkkx-heritage-marker";
          el.setAttribute("aria-label", `Heritage site: ${site.name} (${site.thai})`);
          el.title = `${site.name} · ${site.thai}`;
          el.innerHTML = `<span class="fa-icon">🏛️</span><span class="fa-label">${site.name.split(" ")[0]}</span>`;
          el.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            setSelectedHeritage(site);
            setSelectedMobility(null);
            setSelectedPoi(null);
            setSelectedCandidate(null);
            setSelectedArchitecture(null);
            map.flyTo({
              center: site.coordinates,
              zoom: 17.2,
              pitch: 65,
              speed: 0.8,
              essential: true,
            });
          });
          const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
            .setLngLat(site.coordinates)
            .addTo(map);
          heritageMarkerRefs.current.push(marker);
        });
      }

      mapRef.current = map;
      mapInstance = map;

      resizeObserverInstance = new ResizeObserver(() => map.resize());
      resizeObserverInstance.observe(map.getContainer());
    });

    return () => {
      active = false;
      if (resizeObserverInstance) {
        resizeObserverInstance.disconnect();
      }
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      heritageMarkerRefs.current.forEach((marker) => marker.remove());
      heritageMarkerRefs.current = [];
      // Clean up POI markers on map teardown
      for (const kind of Object.keys(poiMarkerSnapshot) as PoiKind[]) {
        poiMarkerSnapshot[kind].forEach((m) => m.remove());
      }
      if (mapInstance) {
        mapInstance.remove();
      }
      mapRef.current = null;
    };
  }, [world, hasHistoricContext, initialView, aerosolDate]);

  // Mount / unmount POI markers whenever (a) the map is ready,
  // (b) data is loaded, or (c) the user toggles a layer.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreModuleRef.current;
    if (!map || !maplibregl || !mapReady) return;
    for (const layer of POI_LAYERS) {
      const wantVisible = showPoi[layer.kind];
      const features = poiData[layer.kind];
      const existing = poiMarkerRefs.current[layer.kind];

      // Always tear down existing markers for this kind first; we'll
      // re-add only the ones for the current toggle state. This is O(n)
      // per toggle but the kinds are small (≤460), and it's simpler
      // than tracking per-marker diffs.
      existing.forEach((m) => m.remove());
      poiMarkerRefs.current[layer.kind] = [];

      if (!wantVisible || !features) continue;

      for (const feat of features) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = `bkkx-poi-marker bkkx-poi-${layer.kind}`;
        el.style.setProperty("--poi-color", layer.color);
        el.setAttribute("aria-label", `${layer.label}: ${feat.properties.name_th}`);
        el.title = feat.properties.name_th;
        el.innerHTML = `<span class="poi-icon" aria-hidden="true">${layer.icon}</span><span class="poi-label">${layer.label.split(" ")[0]}</span>`;
        el.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelectedPoi(feat);
          setSelectedMobility(null);
          setSelectedArchitecture(null);
          map.flyTo({
            center: feat.geometry.coordinates as [number, number],
            zoom: 16.4,
            pitch: 60,
            speed: 0.8,
            essential: true,
          });
        });
        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat(feat.geometry.coordinates as [number, number])
          .addTo(map);
        poiMarkerRefs.current[layer.kind].push(marker);
      }
    }
  }, [showPoi, poiData, mapReady]);

  // Keep the corridor geometry and its point markers under one toggle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const visibility = showPoi.oldtown ? "visible" : "none";
    for (const layerId of [
      "bkkx-rowhouse-fabric-casing",
      "bkkx-rowhouse-fabric-solid",
      "bkkx-rowhouse-fabric-inferred",
      "bkkx-rowhouse-fabric-labels",
    ]) {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visibility);
    }
  }, [showPoi.oldtown, mapReady]);

  // Mobility is a separate orientation system: rail stays solid, boats use
  // dotted strokes, and stop names only appear once the map is close enough.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const visibility = showMobility ? "visible" : "none";
    for (const layerId of [
      "bkkx-mobility-rail-casing",
      "bkkx-mobility-rail",
      "bkkx-mobility-water-casing",
      "bkkx-mobility-boat",
      "bkkx-mobility-ferry",
      "bkkx-mobility-stops",
      "bkkx-mobility-stop-labels",
    ]) {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visibility);
    }
  }, [showMobility, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("bkkx-aerosol")) return;
    map.setLayoutProperty("bkkx-aerosol", "visibility", showAerosol ? "visible" : "none");
  }, [showAerosol, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const visibility = showArchitecturalDetail ? "visible" : "none";
    for (const layerId of [
      "bkkx-heritage-detail",
      "bkkx-heritage-landmarks",
      "bkkx-heritage-landmark-labels",
      "bkkx-hero-monuments",
      "bkkx-hero-monument-labels",
    ]) {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visibility);
    }
  }, [showArchitecturalDetail, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const visibility = showRowhouseCandidates ? "visible" : "none";
    for (const layerId of [
      "bkkx-rowhouse-candidates-possible",
      "bkkx-rowhouse-candidates-strong",
      "bkkx-rowhouse-candidates-outline",
    ]) {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visibility);
    }
  }, [showRowhouseCandidates, mapReady]);

  // Synchronize Zoning Layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer("bkkx-zoning-fill")) {
      map.setLayoutProperty("bkkx-zoning-fill", "visibility", showZoning ? "visible" : "none");
    }
    if (map.getLayer("bkkx-zoning-line")) {
      map.setLayoutProperty("bkkx-zoning-line", "visibility", showZoning ? "visible" : "none");
    }
  }, [showZoning, mapReady]);

  // Synchronize the walk-route line: draw the selected walk's real geometry
  // and fit the map to it, or hide the layer when nothing is selected.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const source = map.getSource("bkkx-route-src") as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const line = selectedWalkSlug ? walkGeometry?.[selectedWalkSlug]?.line : null;
    const visible = Boolean(line && line.length > 1);

    source.setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: line ?? [] },
    });
    for (const id of ["bkkx-route-casing", "bkkx-route-line"]) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    }
    if (visible && line) {
      const lons = line.map(([lon]) => lon);
      const lats = line.map(([, lat]) => lat);
      map.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        { padding: 72, duration: 600, maxZoom: 17 },
      );
    }
  }, [selectedWalkSlug, walkGeometry, mapReady]);

  // Synchronize Heritage Markers visibility
  useEffect(() => {
    heritageMarkerRefs.current.forEach((marker) => {
      const el = marker.getElement();
      if (el) {
        el.style.display = showHeritage ? "inline-flex" : "none";
      }
    });
  }, [showHeritage]);

  // Handle atmosphere paint updates dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const styles = getStylesForConfig(timeMode, weatherMode);
    const light = getAmbientLight(timeMode);

    map.setLight({
      anchor: "viewport",
      color: light.color,
      intensity: light.intensity,
      position: light.position as [number, number, number],
    });

    if (map.getLayer("bkkx-satellite")) {
      map.setPaintProperty("bkkx-satellite", "raster-opacity", styles.satOpacity);
      map.setPaintProperty("bkkx-satellite", "raster-saturation", styles.satSaturation);
      map.setPaintProperty("bkkx-satellite", "raster-brightness-max", styles.satBrightness);
      map.setPaintProperty("bkkx-satellite", "raster-contrast", styles.satContrast);
    }

    if (map.getLayer("bkkx-3d-buildings")) {
      map.setPaintProperty("bkkx-3d-buildings", "fill-extrusion-color", styles.buildingColor);
      map.setPaintProperty("bkkx-3d-buildings", "fill-extrusion-opacity", styles.buildingOpacity);
    }

    if (map.getLayer("bkkx-roads-motorway")) {
      map.setPaintProperty("bkkx-roads-motorway", "line-color", styles.motorwayColor);
    }
    if (map.getLayer("bkkx-roads-major")) {
      map.setPaintProperty("bkkx-roads-major", "line-color", styles.majorRoadColor);
    }
    if (map.getLayer("bkkx-roads-minor")) {
      map.setPaintProperty("bkkx-roads-minor", "line-color", styles.minorRoadColor);
    }
  }, [timeMode, weatherMode, mapReady]);

  // Handle stop switching when user is NOT in tour mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || isTourPlaying || initialView) return;
    const stop = world.stops.find((item) => item.id === activeStopId);
    if (!stop) return;
    const coord = parseCoordinates(stop.coordinates);
    if (!coord) return;
    map.flyTo({ center: coord, zoom: 16.6, pitch: 64, speed: 0.7, essential: true });
  }, [activeStopId, mapReady, world.stops, isTourPlaying, initialView]);

  // Cinematic Tour Orchestrator
  useEffect(() => {
    if (!isTourPlaying) {
      if (tourTimerRef.current) {
        clearTimeout(tourTimerRef.current);
        tourTimerRef.current = null;
      }
      return;
    }

    const map = mapRef.current;
    if (!map || !mapReady) return;

    const stop = world.stops[tourIndex];
    if (!stop) return;

    const coord = parseCoordinates(stop.coordinates);
    if (!coord) return;

    map.flyTo({
      center: coord,
      zoom: 16.8,
      pitch: 65,
      bearing: -30 + (tourIndex * 40) % 360,
      speed: 0.3,
      curve: 1.4,
      essential: true
    });

    tourTimerRef.current = setTimeout(() => {
      setTourIndex((prev) => (prev + 1) % world.stops.length);
    }, 10000);

    return () => {
      if (tourTimerRef.current) {
        clearTimeout(tourTimerRef.current);
      }
    };
  }, [isTourPlaying, tourIndex, mapReady, world.stops]);

  // Calculate dynamic haze opacity
  const hazeOpacity = useMemo(() => {
    if (weatherMode !== "hazepm25") return 0;
    if (pm25 === null) return 0.35;
    return Math.min(0.85, Math.max(0.2, (pm25 / 150) * 0.7 + 0.15));
  }, [weatherMode, pm25]);

  return (
    <main className={`atlas-page${embedded ? " is-embedded" : ""}`}>
      {!embedded && <header className="atlas-header">
        <Link className="wordmark" href="/" aria-label="BKKxC(ulture) home">
          <span>BKK</span>
          <b>x</b>
          <em>C(ulture)</em>
        </Link>
        <div className="atlas-header-meta">
          <span className="atlas-eyebrow">
            World {world.number} · 3D Atlas
          </span>
          <strong>{world.name}</strong>
          <small><span lang="th">{world.thai}</span> · {world.distance}</small>
        </div>
        <nav className="atlas-header-nav" aria-label="Atlas navigation">
          <Link href="/">Heritage register</Link>
          <Link href="/worlds#atlas">The worlds</Link>
          <a className="atlas-download" href={world.download} target="_blank" rel="noreferrer">
            Download world <span aria-hidden="true">↓</span>
          </a>
        </nav>
      </header>}

      <div className="atlas-map" aria-label={`3D map of ${world.name}, Bangkok`}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

        {/* Weather FX Overlays */}
        {weatherMode === "rainy" && (
          <div className="weather-rain-overlay" />
        )}
        {weatherMode === "hazepm25" && (
          <div className="weather-haze-overlay" style={{ opacity: hazeOpacity }} />
        )}

        {embedded && hasHistoricContext && (
          <div className="atlas-embed-tools" aria-label="Map layers">
            <span className="atlas-embed-tools-label">Explore</span>
            <button
              type="button"
              className={showPoi.oldtown ? "active" : ""}
              onClick={() => setShowPoi((prev) => ({ ...prev, oldtown: !prev.oldtown }))}
              aria-pressed={showPoi.oldtown}
              title="Solid lines: high-confidence documented axes. Dashed lines: curated connections."
            >
              ▥ Rowhouses {poiCounts.oldtown}
            </button>
            <button
              type="button"
              className={showArchitecturalDetail ? "active detail-active" : ""}
              onClick={toggleArchitecturalDetail}
              aria-pressed={showArchitecturalDetail}
              title={HERITAGE_DETAIL_NOTE}
            >
              ◩ Old Town 3D
            </button>
            <button
              type="button"
              className={showMobility ? "active mobility-active" : ""}
              onClick={() => {
                if (showMobility) setSelectedMobility(null);
                setShowMobility((prev) => !prev);
              }}
              aria-pressed={showMobility}
              title="Solid lines are rail; dotted lines are scheduled boat and ferry services."
            >
              ⛴ Transit
            </button>
            <button
              type="button"
              className={showHeritage ? "active" : ""}
              onClick={() => setShowHeritage((prev) => !prev)}
              aria-pressed={showHeritage}
            >
              🏛 Register {FINEARTS_HERITAGE_SITES.length}
            </button>
            <details className="atlas-embed-more">
              <summary>More layers +</summary>
              <div>
                <button
                  type="button"
                  className={showRowhouseCandidates ? "active" : ""}
                  onClick={toggleRowhouseCandidates}
                  aria-pressed={showRowhouseCandidates}
                  title="Machine-screened present-day footprints for field review; not heritage designations."
                >
                  ◫ Candidate screen · {ROWHOUSE_CANDIDATE_SUMMARY.candidate_count.toLocaleString()}
                </button>
                <button
                  type="button"
                  className={showZoning ? "active" : ""}
                  onClick={() => setShowZoning((prev) => !prev)}
                  aria-pressed={showZoning}
                >
                  ▧ Conservation context
                </button>
                <button
                  type="button"
                  className={showAerosol ? "active aerosol-active" : ""}
                  onClick={() => setShowAerosol((prev) => !prev)}
                  aria-pressed={showAerosol}
                  title="NASA Terra + Aqua satellite aerosol optical depth; regional composite, not a street sensor."
                >
                  ◉ Satellite aerosol · {aerosolDate}
                </button>
                <Link href="/atlas/historic-core" target="_top">Full controls ↗</Link>
              </div>
            </details>
          </div>
        )}

        {hasHistoricContext && (
          <details className="atlas-map-key" open>
            <summary>Map key</summary>
            <div>
              {showArchitecturalDetail ? <span><i className="key-building key-fabric" />Old Town full footprints</span> : null}
              {showArchitecturalDetail ? <span><i className="key-building key-landmark" />Curated landmark massing</span> : null}
              {showArchitecturalDetail ? <span><i className="key-building key-hero" />Evidence-labelled hero model</span> : null}
              {showPoi.oldtown ? <span><i className="key-line key-rowhouse" />Documented rowhouse</span> : null}
              {showPoi.oldtown ? <span><i className="key-line key-rowhouse key-dashed" />Interpretive corridor</span> : null}
              {showMobility ? <span><i className="key-line key-rail" />MRT / BTS</span> : null}
              {showMobility ? <span><i className="key-line key-boat key-dotted" />Boat / ferry</span> : null}
              {showAerosol ? <span><i className="key-aerosol" />Satellite aerosol depth</span> : null}
              {selectedWalkSlug ? <span><i className="key-line key-walk" />Selected walk</span> : null}
              {showZoning ? <span><i className="key-area" />Illustrative conservation context</span> : null}
            </div>
          </details>
        )}

        {hasHistoricContext && showAerosol && (
          <div className="atlas-aerosol-note" role="status">
            <strong>Air from space · {aerosolDate}</strong>
            <span>Terra + Aqua MODIS MAIAC · regional aerosol optical depth, not street-level PM2.5.</span>
            <a href={NASA_AEROSOL_SOURCE} target="_blank" rel="noreferrer">NASA layer record ↗</a>
          </div>
        )}

        {/* Full Atmosphere & Tour deck belongs to the standalone atlas. */}
        {!embedded && <div className="atlas-control-overlay">
          <div className="control-section">
            <div className="control-header">
              <span>ATMOSPHERE ENGINE</span>
              {isTourPlaying && <span className="tour-live-badge">TOUR ACTIVE</span>}
            </div>

            <button
              onClick={() => {
                if (isTourPlaying) {
                  setIsTourPlaying(false);
                  setActiveStopId(world.stops[tourIndex]?.id ?? world.stops[0].id);
                } else {
                  const idx = world.stops.findIndex(s => s.id === activeStopId);
                  setTourIndex(idx >= 0 ? idx : 0);
                  setIsTourPlaying(true);
                }
              }}
              className={`tour-play-btn ${isTourPlaying ? "is-playing" : ""}`}
            >
              {isTourPlaying ? "⏸ Pause Cinematic Tour" : "▶ Start Cinematic Tour"}
            </button>

            <div className="control-row">
              <small className="control-label">Time of Day</small>
              <div className="btn-group-time" role="group" aria-label="Time of Day Select">
                {(["realtime", "sunrise", "noon", "sunset", "night"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      if (isTourPlaying) {
                        setIsTourPlaying(false);
                        setActiveStopId(world.stops[tourIndex]?.id ?? world.stops[0].id);
                      }
                      setTimeMode(t);
                    }}
                    className={timeMode === t ? "active" : ""}
                    title={t === "realtime" ? "Live Bangkok Time" : t}
                    aria-label={t === "realtime" ? "Switch to live local time" : `Switch to ${t} lighting`}
                  >
                    {t === "realtime" ? "🕒" : t === "sunrise" ? "🌅" : t === "noon" ? "☀️" : t === "sunset" ? "🌇" : "🌙"}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-section-divider" />

            <div className="control-row">
              <small className="control-label">Weather Mode</small>
              <div className="btn-group-weather" role="group" aria-label="Weather Mode Select">
                {(["clear", "rainy", "hazepm25"] as const).map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      weatherTouchedRef.current = true;
                      if (isTourPlaying) {
                        setIsTourPlaying(false);
                        setActiveStopId(world.stops[tourIndex]?.id ?? world.stops[0].id);
                      }
                      setWeatherMode(w);
                    }}
                    className={weatherMode === w ? "active" : ""}
                    aria-label={w === "clear" ? "Switch to clear sky" : w === "rainy" ? "Switch to rain overlay" : "Switch to PM2.5 smog haze"}
                  >
                    {w === "clear" ? "☀️ Clear" : w === "rainy" ? "🌧️ Rain" : "🌫️ Smog"}
                  </button>
                ))}
              </div>
            </div>

            {weatherMode === "hazepm25" && (
              <div className="pm25-readout">
                <span className="status-dot" style={{ backgroundColor: pm25Status.color }} />
                <span>Bangkok PM2.5: {pm25Status.text}</span>
              </div>
            )}

            <div className="control-section-divider" />

            {hasHistoricContext && (
              <div className="control-row">
                <small className="control-label">GIS Layers</small>
                <div className="btn-group-layers" role="group" aria-label="GIS Data Layers">
                  <button
                    type="button"
                    onClick={toggleArchitecturalDetail}
                    className={`layer-toggle-btn detail-toggle ${showArchitecturalDetail ? "active" : ""}`}
                    aria-pressed={showArchitecturalDetail}
                    aria-label="Toggle detailed Old Town building footprints and landmark massing"
                    title={HERITAGE_DETAIL_NOTE}
                  >
                    ◩ Old Town 3D
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHeritage((prev) => !prev)}
                    className={`layer-toggle-btn ${showHeritage ? "active" : ""}`}
                    aria-pressed={showHeritage}
                    aria-label="Toggle Fine Arts Department Heritage Sites"
                  >
                    🏛️ Heritage ({FINEARTS_HERITAGE_SITES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowZoning((prev) => !prev)}
                    className={`layer-toggle-btn ${showZoning ? "active" : ""}`}
                    aria-pressed={showZoning}
                    aria-label="Toggle illustrative conservation and planning overlay"
                  >
                    ▧ Conservation zones
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (showMobility) setSelectedMobility(null);
                      setShowMobility((prev) => !prev);
                    }}
                    className={`layer-toggle-btn mobility-toggle ${showMobility ? "active" : ""}`}
                    aria-pressed={showMobility}
                    aria-label="Toggle public transport for heritage exploration"
                  >
                    ⛴ Public transport
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAerosol((prev) => !prev)}
                    className={`layer-toggle-btn aerosol-toggle ${showAerosol ? "active" : ""}`}
                    aria-pressed={showAerosol}
                    aria-label="Toggle NASA satellite aerosol optical depth"
                    title="Regional Terra + Aqua composite; not a street-level pollution sensor."
                  >
                    ◉ Satellite aerosol · {aerosolDate}
                  </button>
                  <button
                    type="button"
                    onClick={toggleRowhouseCandidates}
                    className={`layer-toggle-btn ${showRowhouseCandidates ? "active" : ""}`}
                    aria-pressed={showRowhouseCandidates}
                    aria-label="Toggle machine-screened rowhouse footprint candidates"
                    title="Present-day Overture geometry screened for field review; not a heritage designation."
                  >
                    ◫ Candidates ({ROWHOUSE_CANDIDATE_SUMMARY.candidate_count.toLocaleString()})
                  </button>
                </div>
                <small className="control-source-note">
                  Old Town 3D: {HERITAGE_DETAIL_COUNT.toLocaleString()} full-resolution OSM footprints + {HERITAGE_LANDMARK_PART_COUNT} curated landmark parts + {HERO_MONUMENT_PART_COUNT} hero parts across Wat Arun, Wat Phra Kaew and Wat Pho.
                  {" "}{HERITAGE_DETAIL_NOTE}{" "}
                  Conservation geometry is off by default and illustrative. {BKK_URBAN_ZONING_NOTE}
                  {" "}{HERITAGE_MOBILITY_NOTE} NASA aerosol is a dated regional optical-depth
                  composite, not street-level PM2.5. Candidate footprints are opt-in and unverified.
                </small>
              </div>
            )}

            <div className="control-section-divider" />

            {hasHistoricContext && (
              <div className="control-row">
                <small className="control-label">Cultural &amp; Open-data Layers</small>
                <div className="btn-group-layers" role="group" aria-label="Cultural and open-data layers">
                  {POI_LAYERS.map((layer) => (
                    <button
                      key={layer.kind}
                      type="button"
                      onClick={() =>
                        setShowPoi((prev) => ({ ...prev, [layer.kind]: !prev[layer.kind] }))
                      }
                      className={`layer-toggle-btn bkkx-poi-chip ${showPoi[layer.kind] ? "active" : ""}`}
                      aria-pressed={showPoi[layer.kind]}
                      aria-label={`Toggle ${layer.label} layer (${poiCounts[layer.kind]} pins)`}
                      title={layer.kind === "oldtown"
                        ? "Solid lines: high-confidence documented axes. Dashed lines: curated connections."
                        : undefined}
                      style={
                        {
                          ["--poi-color" as string]: layer.color,
                        } as React.CSSProperties
                      }
                    >
                      <span className="poi-chip-dot" aria-hidden="true" />
                      {layer.icon} {layer.label} ({poiCounts[layer.kind]})
                    </button>
                  ))}
                </div>
                <small className="control-source-note">
                  Rowhouse fabric: BKKx field research with confidence-labelled
                  street axes. Institutional POIs: data.go.th &amp; data.bangkok.go.th. {" "}
                  <a href="https://data.go.th" target="_blank" rel="noreferrer">data.go.th</a>
                </small>
              </div>
            )}

            <div className="control-section-divider" />

            {hasHistoricContext && (
              <div className="control-row">
                <small className="control-label">Walks</small>
                <div className="btn-group-walks" role="group" aria-label="Show a walk's route">
                  {historicCoreWalks.map((walk) => (
                    <button
                      key={walk.slug}
                      type="button"
                      onClick={() =>
                        setSelectedWalkSlug((prev) => (prev === walk.slug ? null : walk.slug))
                      }
                      className={`layer-toggle-btn ${selectedWalkSlug === walk.slug ? "active" : ""}`}
                      aria-pressed={selectedWalkSlug === walk.slug}
                    >
                      {walk.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>}

        {hasHistoricContext && selectedMobility && (() => {
          const service = selectedMobility.kind === "service"
            ? HERITAGE_MOBILITY_SERVICES.find((item) => item.id === selectedMobility.id)
            : undefined;
          const stop = selectedMobility.kind === "stop"
            ? HERITAGE_MOBILITY_STOPS.find((item) => item.id === selectedMobility.id)
            : undefined;
          const stopServices = stop
            ? HERITAGE_MOBILITY_SERVICES.filter((item) => stop.serviceIds.includes(item.id))
            : [];
          const primary = service ?? stopServices[0];
          if (!primary) return null;
          return (
            <div
              className="heritage-inspector-card mobility-inspector-card"
              role="dialog"
              aria-modal="false"
              aria-label={`Public transport: ${service?.name ?? stop?.name}`}
              style={{ ["--mobility-color" as string]: primary.color } as React.CSSProperties}
            >
              <div className="heritage-card-header">
                <div className="heritage-badge-group">
                  <span className="heritage-reg-badge">{primary.mode.includes("boat") || primary.mode.includes("ferry") ? "⛴" : "●"} Public transport</span>
                  <span className="heritage-era-badge">{primary.shortName}</span>
                </div>
                <button type="button" className="heritage-close-btn" onClick={() => setSelectedMobility(null)} aria-label="Close transport details">✕</button>
              </div>
              <h4>{service?.name ?? stop?.name}</h4>
              <p className="heritage-thai" lang="th">{service?.thai ?? stop?.thai}</p>
              {service ? <p className="heritage-desc">{service.serviceNote}</p> : null}
              {stop ? (
                <div className="heritage-meta-grid">
                  <div><span>Services</span><strong>{stopServices.map((item) => item.shortName).join(" · ")}</strong></div>
                  <div><span>Heritage nearby</span><strong>{stop.nearby.join(" · ")}</strong></div>
                </div>
              ) : (
                <div className="heritage-meta-grid">
                  <div><span>Operator</span><strong>{service?.operator}</strong></div>
                  <div><span>Map language</span><strong>{service?.mode === "mrt" || service?.mode === "bts" ? "Solid rail line" : "Dotted water route"}</strong></div>
                </div>
              )}
              <p className="heritage-source-note">
                {HERITAGE_MOBILITY_NOTE}<br />
                <a href={primary.sourceUrl} target="_blank" rel="noreferrer">Check official service information ↗</a>
              </p>
            </div>
          );
        })()}

        {hasHistoricContext && selectedArchitecture && (
          <div className="heritage-inspector-card architecture-inspector-card" role="dialog" aria-modal="false" aria-label={`Architectural detail: ${selectedArchitecture.name_en ?? selectedArchitecture.name ?? "Old Town landmark"}`}>
            <div className="heritage-card-header">
              <div className="heritage-badge-group">
                <span className="heritage-reg-badge">◩ {selectedArchitecture.model_status ?? "Interpretive 3D"}</span>
                {selectedArchitecture.height ? (
                  <span className="heritage-era-badge">to {Number(selectedArchitecture.height)} m</span>
                ) : null}
              </div>
              <button type="button" className="heritage-close-btn" onClick={() => setSelectedArchitecture(null)} aria-label="Close architectural details">✕</button>
            </div>
            <h4>{selectedArchitecture.name_en ?? selectedArchitecture.name ?? "Old Town landmark part"}</h4>
            {selectedArchitecture.name_en && selectedArchitecture.name ? (
              <p className="heritage-thai" lang="th">{selectedArchitecture.name}</p>
            ) : null}
            {selectedArchitecture.part_label ? <p className="architecture-part-label">{selectedArchitecture.part_label}</p> : null}
            <p className="heritage-desc">
              A map-scale part of Bangkok&apos;s heritage silhouette. The footprint and published overall envelope are spatial evidence;
              proportional tiering is an interpretation and must not be read as a measured conservation model.
            </p>
            <div className="heritage-meta-grid">
              <div><span>Character</span><strong>{selectedArchitecture.kind ?? selectedArchitecture.building_type ?? "heritage fabric"}</strong></div>
              <div><span>Evidence</span><strong>{selectedArchitecture.height_confidence ?? "curated massing"}</strong></div>
            </div>
            <p className="heritage-source-note">
              {selectedArchitecture.source ?? "OpenStreetMap footprint · BKKx typology-height model"}<br />
              {selectedArchitecture.height_source ? <>{selectedArchitecture.height_source}<br /></> : null}
              {selectedArchitecture.source_note ? <>{selectedArchitecture.source_note}<br /></> : null}
              {selectedArchitecture.osm_id ? <>OSM ID {selectedArchitecture.osm_id} · </> : null}
              {selectedArchitecture.source_url ? <><a href={selectedArchitecture.source_url} target="_blank" rel="noreferrer">Official source ↗</a> · </> : null}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OSM attribution ↗</a>
            </p>
          </div>
        )}

        {/* Machine-review inspector; visually related to the heritage card but
            explicit that this evidence has not crossed the heritage threshold. */}
        {hasHistoricContext && selectedCandidate && (
          <div className="heritage-inspector-card rowhouse-candidate-card" role="dialog" aria-modal="false" aria-label={`Rowhouse candidate: ${selectedCandidate.cluster_name}`}>
            <div className="heritage-card-header">
              <div className="heritage-badge-group">
                <span className="heritage-reg-badge">◫ {selectedCandidate.candidate_strength}</span>
                <span className="heritage-era-badge">score {Number(selectedCandidate.morphology_score).toFixed(3)}</span>
              </div>
              <button type="button" className="heritage-close-btn" onClick={() => setSelectedCandidate(null)} aria-label="Close candidate details">✕</button>
            </div>
            <h4>{selectedCandidate.cluster_name}</h4>
            <p className="heritage-desc">
              A present-day building shape queued for human review near a documented cultural corridor.
              It is not a confirmed rowhouse, an age estimate or a heritage designation.
            </p>
            <div className="heritage-meta-grid">
              <div><span>Footprint area</span><strong>{selectedCandidate.area_m2} m²</strong></div>
              <div><span>Depth / width</span><strong>{selectedCandidate.shape_ratio}</strong></div>
              <div><span>Aligned neighbours</span><strong>{selectedCandidate.aligned_neighbours_32m}</strong></div>
              <div><span>From corridor</span><strong>{selectedCandidate.corridor_distance_m} m</strong></div>
            </div>
            <p className="heritage-source-note">
              Overture Maps buildings {selectedCandidate.overture_release} · ID {selectedCandidate.overture_id}<br />
              <a href="/rowhouses#candidate-method">Read the method and caveat</a>
            </p>
          </div>
        )}

        {/* Heritage Inspector Card Popup */}
        {hasHistoricContext && selectedHeritage && (
          <div className="heritage-inspector-card" role="dialog" aria-modal="false" aria-label={`Heritage Site: ${selectedHeritage.name}`}>
            {selectedHeritage.photo && photoFor(selectedHeritage.photo) && (
              <figure className="heritage-card-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoFor(selectedHeritage.photo)!.file} alt={selectedHeritage.name} loading="lazy" />
                <figcaption>
                  Photo: {photoFor(selectedHeritage.photo)!.artist} ·{" "}
                  <a href={photoFor(selectedHeritage.photo)!.descriptionUrl} target="_blank" rel="noreferrer">
                    Wikimedia Commons
                  </a>{" "}
                  · {photoFor(selectedHeritage.photo)!.licence}
                </figcaption>
              </figure>
            )}
            <div className="heritage-card-header">
              <div className="heritage-badge-group">
                <span className="heritage-reg-badge">🏛️ {selectedHeritage.regId}</span>
                <span className="heritage-era-badge">{selectedHeritage.era}</span>
              </div>
              <button
                type="button"
                className="heritage-close-btn"
                onClick={() => setSelectedHeritage(null)}
                aria-label="Close heritage details"
              >
                ✕
              </button>
            </div>
            <h4>{selectedHeritage.name}</h4>
            <p className="heritage-thai" lang="th">{selectedHeritage.thai}</p>
            <p className="heritage-desc">{selectedHeritage.description}</p>
            <div className="heritage-meta-grid">
              <div>
                <span>Typology</span>
                <strong>{selectedHeritage.category}</strong>
              </div>
              <div>
                <span>Founded</span>
                <strong>{selectedHeritage.year}</strong>
              </div>
              <div>
                <span>Historical note</span>
                <small>{selectedHeritage.gazette}</small>
              </div>
            </div>
            <p className="heritage-source-note">
              <a href={FINEARTS_HERITAGE_SOURCE.url} target="_blank" rel="noreferrer">
                {FINEARTS_HERITAGE_SOURCE.name}
              </a>
              {" · "}{FINEARTS_HERITAGE_SOURCE.attribution}
            </p>
          </div>
        )}

        {/* Data.go.th POI Inspector Card */}
        {hasHistoricContext && selectedPoi && (() => {
          const p = selectedPoi.properties;
          const layer = POI_LAYERS.find((l) => l.kind === p.kind);
          // Build a kind-aware meta grid.  Empty fields are simply omitted.
          const meta: Array<[string, string | null | undefined]> = [];
          if (p.district) meta.push(["District / เขต", p.district]);
          if (p.sub_district) meta.push(["Sub-district / แขวง", p.sub_district]);
          if (p.province) meta.push(["Province / จังหวัด", p.province]);
          if (p.postal_code) meta.push(["Postal code", p.postal_code]);
          if (p.sect) meta.push(["Sect", p.sect]);
          if (p.temple_class) meta.push(["Class", p.temple_class]);
          if (p.established_be) meta.push(["Established (B.E.)", p.established_be]);
          if (p.kathin_type) meta.push(["Royal kathin", p.kathin_type]);
          if (p.museum_type) meta.push(["Type", p.museum_type]);
          if (p.museum_branch) meta.push(["Branch", p.museum_branch]);
          if (p.is_ancient_site && p.is_ancient_site !== "-")
            meta.push(["Is ancient site", p.is_ancient_site]);
          if (p.kind === "oldtown") {
            if (p.period) meta.push(["Period", p.period]);
            if (p.typology) meta.push(["Typology", p.typology]);
            if (p.evidence) meta.push(["Evidence", p.evidence]);
            if (p.units) meta.push(["Documented units", String(p.units)]);
            if (p.register_id) meta.push(["Register / award", p.register_id]);
            if (p.geometry_method) meta.push(["Map geometry", p.geometry_method]);
            if (p.geometry_confidence) meta.push(["Geometry confidence", p.geometry_confidence]);
          }
          return (
            <div
              className={`heritage-inspector-card bkkx-poi-card bkkx-poi-card-${p.kind}`}
              role="dialog"
              aria-modal="false"
              aria-label={`${layer?.label}: ${p.name_th}`}
            >
              <div className="heritage-card-header">
                <div className="heritage-badge-group">
                  <span className="heritage-reg-badge" lang="th">{layer?.icon} {layer?.labelTh}</span>
                  {p.id ? <span className="heritage-era-badge">{p.id}</span> : null}
                </div>
                <button
                  type="button"
                  className="heritage-close-btn"
                  onClick={() => setSelectedPoi(null)}
                  aria-label="Close POI details"
                >
                  ✕
                </button>
              </div>
              {p.kind === "oldtown" && p.photo ? (
                <figure className="heritage-card-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/heritage/photos/${p.photo}.jpg`} alt={p.name_th} loading="lazy" />
                  {photoFor(p.photo) ? (
                    <figcaption>
                      Photo: {photoFor(p.photo)!.artist} ·{" "}
                      <a href={photoFor(p.photo)!.descriptionUrl} target="_blank" rel="noreferrer">
                        Wikimedia Commons
                      </a>{" "}
                      · {photoFor(p.photo)!.licence}
                    </figcaption>
                  ) : null}
                </figure>
              ) : null}
              <h4>{p.name_en ?? p.name_th}</h4>
              {p.name_en ? <p className="heritage-thai" lang="th">{p.name_th}</p> : null}
              {p.kind === "oldtown" && p.callout ? (
                <p className="heritage-thai">
                  <strong lang="th">{p.calloutTh ?? p.callout}</strong>
                </p>
              ) : null}
              {p.address ? <p className="heritage-thai" lang="th">{p.address}</p> : null}
              {p.kind === "oldtown" && p.note ? (
                <p className="heritage-desc">{p.note}</p>
              ) : null}
              {p.kind === "oldtown" && p.explorer_tip ? (
                <p className="bkkx-explorer-tip"><strong>Explorer note</strong>{p.explorer_tip}</p>
              ) : null}
              {meta.length > 0 && (
                <div className="heritage-meta-grid">
                  {meta.map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong lang={/[\u0E00-\u0E7F]/.test(value ?? "") ? "th" : undefined}>{value}</strong>
                    </div>
                  ))}
                </div>
              )}
              <p className="heritage-source-note">
                <a href={p.source_url} target="_blank" rel="noreferrer">{p.source}</a>
                {" · "}BKK-bbox subset
                {p.kind === "royal-temple" ? " · Geocoded via OpenStreetMap Nominatim, ODbL" : null}
                {p.kind === "oldtown" ? " · BKKx hand-curated · Photo: Wikimedia Commons, ODbL" : null}
              </p>
            </div>
          );
        })()}
      </div>

      {!embedded && <aside className="atlas-panel" aria-live="polite">
        <p className="atlas-panel-eyebrow">{activeStop.chapter}</p>
        <h2>{activeStop.name}</h2>
        <p className="atlas-panel-thai" lang="th">{activeStop.thai}</p>
        <p className="atlas-panel-desc">{activeStop.description}</p>

        <div className="atlas-field-note">
          <span>Field note</span>
          <p>{activeStop.signal}</p>
        </div>

        <p className="atlas-coordinates">{activeStop.coordinates}</p>

        {/* Minecraft Teleport Box */}
        {mcCoords && (
          <div className="minecraft-tp">
            <div className="minecraft-tp-header">
              <span>Minecraft Teleport</span>
              <span className="edition-tag">Java 1.21.4+</span>
            </div>
            <div className="minecraft-tp-body">
              <code>/tp {mcCoords.x} 72 {mcCoords.z}</code>
              <button onClick={copyTpCommand} className="copy-btn">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        <ol className="atlas-chapters" aria-label="Chapters">
          {world.stops.map((stop, index) => (
            <li key={stop.id}>
              <button
                type="button"
                className={stop.id === activeStopId ? "is-active" : ""}
                aria-pressed={stop.id === activeStopId}
                onClick={() => {
                  setIsTourPlaying(false);
                  setActiveStopId(stop.id);
                  setTourIndex(index);
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{stop.name}</strong>
                <small lang="th">{stop.thai}</small>
              </button>
            </li>
          ))}
        </ol>
        <Link className="atlas-back" href="/worlds#atlas">← Back to walkthrough</Link>
      </aside>}
    </main>
  );
}
