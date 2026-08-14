"use client";

import { useEffect, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PROJECTS } from "../data/shophouse-studio";

// Sukhumvit 71 corridor map. Editorial register: light ground, one accent
// (the oxide seal), no decorative colour. The candidate footprints carry the
// weight; the road is a hairline; the studio projects are numbered pins.
//
// minZoom is set per §11.9 — below this the world repeats and the map reads
// as broken rather than zoomed out.

const STYLE = "https://tiles.openfreemap.org/styles/positron";
const DATA = "/data/sukhumvit71-corridor.geojson";
const SEAL = "#8c2f23";
const INK = "#14140f";
const PAPER = "#f4f2ec";
const MAP_FONT = ["Noto Sans Regular"];

type Meta = { candidate_count?: number; candidates_on_spine?: number; measured_count?: number };

export function CorridorMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [spineOnly, setSpineOnly] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    let disposed = false;
    let observer: ResizeObserver | null = null;

    void (async () => {
      const maplibre = (await import("maplibre-gl")).default;
      if (disposed || !containerRef.current) return;

      const map = new maplibre.Map({
        container: containerRef.current,
        style: STYLE,
        center: [100.5944, 13.7235],
        zoom: 14.1,
        minZoom: 11,
        renderWorldCopies: false,
        attributionControl: false,
        antialias: true,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", async () => {
        if (disposed) return;
        try {
          const res = await fetch(DATA);
          const fc = (await res.json()) as GeoJSON.FeatureCollection & { properties?: Meta };
          setMeta(fc.properties ?? null);

          map.addSource("corridor", { type: "geojson", data: fc });

          map.addLayer({
            id: "sh-candidates",
            type: "fill",
            source: "corridor",
            filter: ["==", ["get", "layer"], "candidate"],
            paint: { "fill-color": SEAL, "fill-opacity": 0.45 },
          });
          map.addLayer({
            id: "sh-candidates-line",
            type: "line",
            source: "corridor",
            filter: ["==", ["get", "layer"], "candidate"],
            paint: { "line-color": SEAL, "line-width": 0.4, "line-opacity": 0.7 },
          });
          map.addLayer({
            id: "sh-soi",
            type: "line",
            source: "corridor",
            filter: ["==", ["get", "layer"], "soi"],
            paint: { "line-color": INK, "line-width": 0.6, "line-opacity": 0.25 },
          });
          map.addLayer({
            id: "sh-spine",
            type: "line",
            source: "corridor",
            filter: ["==", ["get", "layer"], "corridor"],
            paint: { "line-color": INK, "line-width": 2, "line-opacity": 0.8 },
          });

          // Studio project anchors
          map.addSource("sh-projects", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: PROJECTS.map((p, i) => ({
                type: "Feature",
                geometry: { type: "Point", coordinates: p.at },
                properties: { n: i + 1, title: p.title, student: p.student },
              })),
            },
          });
          map.addLayer({
            id: "sh-project-dot",
            type: "circle",
            source: "sh-projects",
            paint: {
              "circle-radius": 11,
              "circle-color": INK,
              "circle-stroke-width": 2,
              "circle-stroke-color": PAPER,
            },
          });
          map.addLayer({
            id: "sh-project-num",
            type: "symbol",
            source: "sh-projects",
            layout: {
              "text-field": ["to-string", ["get", "n"]],
              "text-font": MAP_FONT,
              "text-size": 11,
              "text-allow-overlap": true,
            },
            paint: { "text-color": PAPER },
          });
          map.addLayer({
            id: "sh-project-label",
            type: "symbol",
            source: "sh-projects",
            minzoom: 14.4,
            layout: {
              "text-field": ["get", "title"],
              "text-font": MAP_FONT,
              "text-size": 11,
              "text-offset": [0, 1.3],
              "text-anchor": "top",
              "text-max-width": 10,
            },
            paint: { "text-color": INK, "text-halo-color": PAPER, "text-halo-width": 1.6 },
          });

          setReady(true);
        } catch (err) {
          console.warn("bkkx: corridor data failed", err);
        }
      });

      observer = new ResizeObserver(() => map.resize());
      observer.observe(containerRef.current);
    })();

    return () => {
      disposed = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Spine filter — the studio's actual site is the 120 m band along the road.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const filter = spineOnly
      ? (["all", ["==", ["get", "layer"], "candidate"], ["==", ["get", "on_spine"], true]] as const)
      : (["==", ["get", "layer"], "candidate"] as const);
    for (const id of ["sh-candidates", "sh-candidates-line"]) {
      if (map.getLayer(id)) {
        map.setFilter(id, filter as never);
      }
    }
  }, [spineOnly, ready]);

  return (
    <div className="sh-fig sh-map">
      <div className="sh-map-canvas" ref={containerRef} />
      <div className="sh-map-controls">
        <button
          type="button"
          onClick={() => setSpineOnly((v) => !v)}
          aria-pressed={spineOnly}
          className={spineOnly ? "is-active" : ""}
        >
          {spineOnly ? "Showing the road band" : "Showing the whole study area"}
        </button>
        {meta && (
          <span className="sh-map-count">
            {spineOnly
              ? `${meta.candidates_on_spine?.toLocaleString()} candidates within 120 m of the road`
              : `${meta.candidate_count?.toLocaleString()} candidates from ${meta.measured_count?.toLocaleString()} buildings measured`}
          </span>
        )}
      </div>
      <p className="sh-fig-note">
        Candidate footprints screened by geometry alone — a narrow frontage, a deep plan, and aligned
        neighbours repeating along a street. This does <strong>not</strong> confirm that any building
        is a shophouse, its age, its condition or any heritage status; it is a set for field review.
        Numbered pins are studio projects, anchored on the corridor — most drafts show generic block
        plans without street numbers, so only one anchor is a documented site. Buildings ©
        OpenStreetMap contributors (ODbL).{" "}
        <a href="/data/sukhumvit71-corridor.geojson" download>
          Download the GeoJSON
        </a>
        .
      </p>
    </div>
  );
}
