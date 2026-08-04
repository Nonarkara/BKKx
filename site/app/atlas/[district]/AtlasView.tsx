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
      if (source && !map.getLayer("bkkx-3d-buildings")) {
        try {
          map.addLayer({
            id: "bkkx-3d-buildings",
            type: "fill-extrusion",
            source,
            "source-layer": "building",
            minzoom: 13,
            paint: {
              "fill-extrusion-color": "#c9ff38",
              "fill-extrusion-height": [
                "coalesce",
                ["get", "render_height"],
                ["get", "height"],
                0,
              ],
              "fill-extrusion-base": [
                "coalesce",
                ["get", "render_min_height"],
                ["get", "min_height"],
                0,
              ],
              "fill-extrusion-opacity": 0.72,
            },
          });
        } catch {
          // Some style schemas omit render_height; degrade silently.
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
