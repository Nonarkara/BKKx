"use client";

import { useEffect, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { QUADRANTS, PRESSURE_TOTAL, SPLITS } from "../data/shophouse-pressure";

// Every candidate shophouse in the screened set, laid over the Treasury land
// appraisal that decides its fate. The choropleth is the pressure; the dots
// are the buildings standing in it.
//
// The point of the overlay is not that expensive land is interesting. It is
// that one quadrant — high land value on a plot too shallow to rebuild after
// the setback — is where demolition is closest to self-defeating, and where
// the owner is least likely to have been told.
//
// minZoom per §11.9: below 9 the world repeats and the map reads as broken.

const STYLE = "https://tiles.openfreemap.org/styles/positron";
const POINTS = "/data/shophouse-pressure.geojson";
const DISTRICTS = "/data/bkk-land-price.geojson";
const INK = "#111014";

type Q = (typeof QUADRANTS)[number]["id"];

const COLOUR_MATCH = QUADRANTS.flatMap((q) => [q.id, q.colour]) as string[];

export function PressureMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [showPrice, setShowPrice] = useState(true);
  const [active, setActive] = useState<Q | "all">("all");
  const [hover, setHover] = useState<null | {
    q: string; d: number; f: number; v: number; dist: string; cl: string;
  }>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    let disposed = false;

    void (async () => {
      const maplibre = (await import("maplibre-gl")).default;
      if (disposed || !containerRef.current) return;

      const map = new maplibre.Map({
        container: containerRef.current,
        style: STYLE,
        center: [100.512, 13.742],
        zoom: 11.4,
        minZoom: 9,
        maxZoom: 17,
        renderWorldCopies: false,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", async () => {
        if (disposed) return;

        map.addSource("districts", { type: "geojson", data: DISTRICTS });
        map.addLayer({
          id: "price-fill",
          type: "fill",
          source: "districts",
          paint: {
            // Treasury peak appraisal per square wah, as a single-hue ramp.
            "fill-color": [
              "interpolate", ["linear"], ["coalesce", ["get", "peak"], 0],
              0, "#ffffff",
              100000, "#fdf0f7",
              250000, "#f9c9e2",
              500000, "#f28cc0",
              750000, "#e5007d",
            ],
            "fill-opacity": 0.55,
          },
        });
        map.addLayer({
          id: "price-line",
          type: "line",
          source: "districts",
          paint: { "line-color": INK, "line-width": 0.5, "line-opacity": 0.35 },
        });

        map.addSource("shophouses", { type: "geojson", data: POINTS });
        map.addLayer({
          id: "shophouse-dots",
          type: "circle",
          source: "shophouses",
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              10, 1.6, 13, 3, 15, 5, 17, 8,
            ],
            "circle-color": ["match", ["get", "q"], ...COLOUR_MATCH, "#888"] as unknown as maplibregl.ExpressionSpecification,
            "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 12, 0, 14, 0.7],
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.92,
          },
        });

        map.on("mousemove", "shophouse-dots", (e) => {
          const p = e.features?.[0]?.properties as Record<string, unknown> | undefined;
          if (!p) return;
          map.getCanvas().style.cursor = "pointer";
          setHover({
            q: String(p.q), d: Number(p.d), f: Number(p.f), v: Number(p.v),
            dist: String(p.dist), cl: String(p.cl ?? ""),
          });
        });
        map.on("mouseleave", "shophouse-dots", () => {
          map.getCanvas().style.cursor = "";
          setHover(null);
        });

        setReady(true);
      });
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Layer toggles live in effects because they mutate the map, not React state.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const v = showPrice ? "visible" : "none";
    map.setLayoutProperty("price-fill", "visibility", v);
    map.setLayoutProperty("price-line", "visibility", v);
  }, [showPrice, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setFilter("shophouse-dots", active === "all" ? null : ["==", ["get", "q"], active]);
  }, [active, ready]);

  const shown = active === "all"
    ? PRESSURE_TOTAL
    : QUADRANTS.find((q) => q.id === active)?.count ?? 0;

  return (
    <div className="sh-fig sh-pressure">
      <div className="sh-pressure-controls">
        <button
          type="button"
          className={showPrice ? "is-active" : ""}
          onClick={() => setShowPrice((v) => !v)}
          aria-pressed={showPrice}
        >
          {showPrice ? "Land price on" : "Land price off"}
        </button>
        <button
          type="button"
          className={active === "all" ? "is-active" : ""}
          onClick={() => setActive("all")}
          aria-pressed={active === "all"}
        >
          All {PRESSURE_TOTAL.toLocaleString()}
        </button>
        {QUADRANTS.map((q) => (
          <button
            key={q.id}
            type="button"
            className={active === q.id ? "is-active" : ""}
            onClick={() => setActive(active === q.id ? "all" : q.id)}
            aria-pressed={active === q.id}
          >
            <span className="sh-swatch" style={{ background: q.colour }} aria-hidden="true" />
            {q.label} <small>{q.count}</small>
          </button>
        ))}
      </div>

      <div className="sh-pressure-map">
        <div ref={containerRef} className="sh-map-canvas" />
        {hover && (
          <div className="sh-pressure-hover" role="status">
            <strong>{QUADRANTS.find((q) => q.id === hover.q)?.label ?? hover.q}</strong>
            <span>
              {hover.f} × {hover.d} m · {hover.dist}
              {hover.cl ? ` · ${hover.cl}` : ""}
            </span>
            <span>
              ฿{hover.v.toLocaleString()} of appraised ground beneath it
            </span>
          </div>
        )}
      </div>

      <p className="sh-fig-note">
        Showing {shown.toLocaleString()} of {PRESSURE_TOTAL.toLocaleString()} candidate footprints.
        Fill is the Treasury (กรมธนารักษ์) peak appraisal per district; dots are candidate
        shophouses, coloured by whether the ground under them is worth more than the median
        (฿{SPLITS.priceBaht.toLocaleString()}) and whether the plot is shallower than the median{" "}
        {SPLITS.depthM} m — on a {SPLITS.assumedRoadM} m road, a compliant rebuild steps back{" "}
        {SPLITS.lossM} m and a shallow plot loses the larger share of it. Morphology is not proof:
        none of these has been confirmed by survey. Appraised value sits below market, so every
        figure is a floor.
      </p>
    </div>
  );
}
