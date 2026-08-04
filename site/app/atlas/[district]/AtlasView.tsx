"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Stop, World } from "../../walkthrough-data";

type Props = { world: World };

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

export function AtlasView({ world }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);
  const [activeStopId, setActiveStopId] = useState<string>(world.stops[0].id);
  const [mapReady, setMapReady] = useState(false);

  const activeStop = useMemo(
    () => world.stops.find((stop) => stop.id === activeStopId) ?? world.stops[0],
    [activeStopId, world.stops],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_DARK_STYLE,
      center: districtCenter(world.stops),
      zoom: 15.4,
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

    map.on("load", () => {
      const style = map.getStyle();
      const source = style.sources
        ? Object.entries(style.sources).find(([name]) =>
            BUILDING_SOURCE_CANDIDATES.includes(name),
          )?.[0]
        : undefined;

      // 1. Satellite base (Esri World Imagery). Sits below everything we add.
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
              // Desaturate slightly so the signal yellow on buildings
              // and expressways pops instead of fighting Esri's true-color
              // satellite palette.
              "raster-opacity": 0.78,
              "raster-saturation": -0.45,
              "raster-contrast": 0.08,
              "raster-brightness-min": 0.04,
              "raster-brightness-max": 0.96,
            },
          });
        } catch (err) {
          // If the source can't be created, fall back to the dark style as-is.
          console.warn("bkkx: satellite layer failed", err);
        }
      }

      // 2. Roads in three tiers, drawn from the OpenFreeMap transportation
      //    source-layer (no extra fetch). Motorways (Bangkok's expressways)
      //    glow signal yellow; major roads are paper-gray; minor roads
      //    stay dark so they don't crowd the panel.
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
            // Style schema may omit transportation on some maps; degrade
            // gracefully rather than blocking the buildings layer.
            console.warn(`bkkx: road layer ${id} failed`, err);
          }
        };

        addLine("bkkx-roads-minor", ROAD_TIER_FILTERS.minor, "#2c2d28", roadLineWidth(0.3, 2.4), 0.7);
        addLine("bkkx-roads-major", ROAD_TIER_FILTERS.major, "#5e6157", roadLineWidth(0.4, 3.6), 0.9);
        addLine("bkkx-roads-motorway", ROAD_TIER_FILTERS.motorway, "#c9ff38", roadLineWidth(0.6, 5.2), 1.0);
      }

      // 3. 3D buildings on top, in BKKx signal yellow with a faint vertical
      //    gradient so the silhouette reads as architecture, not paint.
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
          // Some style schemas omit render_height; degrade gracefully.
          console.warn("bkkx: 3d buildings layer failed", err);
        }
      }
      setMapReady(true);
    });

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
        setActiveStopId(stop.id);
        map.flyTo({ center: coord, zoom: 16.6, pitch: 64, speed: 0.9, essential: true });
      });
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(coord)
        .addTo(map);
      markerRefs.current.push(marker);
    });

    mapRef.current = map;
    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [world]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const stop = world.stops.find((item) => item.id === activeStopId);
    if (!stop) return;
    const coord = parseCoordinates(stop.coordinates);
    if (!coord) return;
    map.flyTo({ center: coord, zoom: 16.6, pitch: 64, speed: 0.7, essential: true });
  }, [activeStopId, mapReady, world.stops]);

  return (
    <main className="atlas-page">
      <header className="atlas-header">
        <Link className="wordmark" href="/" aria-label="BKKx home">
          <span>BKK</span>
          <b>x</b>
        </Link>
        <div className="atlas-header-meta">
          <span className="atlas-eyebrow">
            World {world.number} · 3D Atlas
          </span>
          <strong>{world.name}</strong>
          <small>{world.thai} · {world.distance}</small>
        </div>
        <nav className="atlas-header-nav" aria-label="Atlas navigation">
          <Link href="/#atlas">Walkthrough</Link>
          <a className="atlas-download" href={world.download} target="_blank" rel="noreferrer">
            Download world <span aria-hidden="true">↓</span>
          </a>
        </nav>
      </header>

      <div className="atlas-map" ref={containerRef} aria-label={`3D map of ${world.name}, Bangkok`} />

      <aside className="atlas-panel" aria-live="polite">
        <p className="atlas-panel-eyebrow">{activeStop.chapter}</p>
        <h2>{activeStop.name}</h2>
        <p className="atlas-panel-thai">{activeStop.thai}</p>
        <p className="atlas-panel-desc">{activeStop.description}</p>
        <div className="atlas-field-note">
          <span>Field note</span>
          <p>{activeStop.signal}</p>
        </div>
        <p className="atlas-coordinates">{activeStop.coordinates}</p>
        <ol className="atlas-chapters" aria-label="Chapters">
          {world.stops.map((stop, index) => (
            <li key={stop.id}>
              <button
                type="button"
                className={stop.id === activeStopId ? "is-active" : ""}
                aria-pressed={stop.id === activeStopId}
                onClick={() => setActiveStopId(stop.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{stop.name}</strong>
                <small>{stop.thai}</small>
              </button>
            </li>
          ))}
        </ol>
        <Link className="atlas-back" href="/#atlas">← Back to walkthrough</Link>
      </aside>
    </main>
  );
}
