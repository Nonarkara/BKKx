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
// 5 data.go.th POI layers — see site/public/pois/<kind>.geojson
// ---------------------------------------------------------------------------

type PoiKind = "temple" | "royal-temple" | "national-museum" | "national-library" | "national-archive";

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

type PoiLayerSpec = {
  kind: PoiKind;
  file: string;
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
    defaultOn: true,
  },
  {
    kind: "national-museum",
    file: "/pois/national-museums.geojson",
    label: "National Museums",
    labelTh: "พิพิธภัณฑสถานแห่งชาติ",
    icon: "🏛️",
    color: "#3a3a3a",
    defaultOn: true,
  },
  {
    kind: "national-archive",
    file: "/pois/national-archives.geojson",
    label: "National Archives",
    labelTh: "หอจดหมายเหตุแห่งชาติ",
    icon: "📜",
    color: "#5f8a26",
    defaultOn: true,
  },
  {
    kind: "national-library",
    file: "/pois/national-libraries.geojson",
    label: "National Libraries",
    labelTh: "หอสมุดแห่งชาติ",
    icon: "📚",
    color: "#2c5f7c",
    defaultOn: true,
  },
];

export function AtlasView({ world, embedded = false, initialView }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
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
  const [showZoning, setShowZoning] = useState(true);
  const [selectedHeritage, setSelectedHeritage] = useState<HeritageSite | null>(null);
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
    for (const l of POI_LAYERS) init[l.kind] = null;
    return init;
  });
  const [poiCounts, setPoiCounts] = useState<Record<PoiKind, number>>(() => {
    const init = {} as Record<PoiKind, number>;
    for (const l of POI_LAYERS) init[l.kind] = 0;
    return init;
  });
  const [selectedPoi, setSelectedPoi] = useState<PoiFeature | null>(null);
  const poiMarkerRefs = useRef<Record<PoiKind, maplibregl.Marker[]>>({
    temple: [],
    "royal-temple": [],
    "national-museum": [],
    "national-archive": [],
    "national-library": [],
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
    };

    import("maplibre-gl").then((MapLibreModule) => {
      if (!active) return;
      const maplibregl = MapLibreModule.default;

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
  }, [world, hasHistoricContext, initialView]);

  // Mount / unmount POI markers whenever (a) the map is ready,
  // (b) data is loaded, or (c) the user toggles a layer.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
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
        el.setAttribute("aria-label", `${layer.label}: ${feat.properties.name_th}`);
        el.title = feat.properties.name_th;
        el.innerHTML = `<span class="poi-icon" aria-hidden="true">${layer.icon}</span><span class="poi-label">${layer.label.split(" ")[0]}</span>`;
        el.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelectedPoi(feat);
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

        {/* Floating Atmosphere & Tour control deck */}
        <div className="atlas-control-overlay">
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

            {hasHistoricContext && (
              <div className="control-row">
                <small className="control-label">GIS Layers</small>
                <div className="btn-group-layers" role="group" aria-label="GIS Data Layers">
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
                    aria-label="Toggle illustrative historic context overlay"
                  >
                    📐 Historic context
                  </button>
                </div>
                <small className="control-source-note">{BKK_URBAN_ZONING_NOTE}</small>
              </div>
            )}

            {hasHistoricContext && (
              <div className="control-row">
                <small className="control-label">Data.go.th POI Layers</small>
                <div className="btn-group-layers" role="group" aria-label="Data.go.th POI Layers">
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
                  From data.go.th &amp; data.bangkok.go.th open-data registries. BKK
                  bbox only (lng 100.2–101.0, lat 13.4–14.2).{" "}
                  <a href="https://data.go.th" target="_blank" rel="noreferrer">data.go.th</a>
                </small>
              </div>
            )}

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
        </div>

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
              <h4 lang="th">{p.name_th}</h4>
              {p.address ? <p className="heritage-thai" lang="th">{p.address}</p> : null}
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
