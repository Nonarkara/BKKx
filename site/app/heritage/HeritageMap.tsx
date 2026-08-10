"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const OPENFREEMAP_DARK_STYLE = "https://tiles.openfreemap.org/styles/dark";

// Bangkok only. Below this the base tiles start repeating the world, which
// reads as broken rather than zoomed out.
const MIN_ZOOM = 9;

const REGISTER_URL = "/heritage-register.json";

type Block = { x: number; z: number };

type Site = {
  id: string;
  name: string;
  district: string;
  subDistrict: string;
  road: string;
  registered: boolean;
  registerStatus: string;
  precision: "building" | "district";
  locatedBy: string;
  lat?: number;
  lon?: number;
  world?: string;
  block?: Block;
  gazette?: { volume: string; part: string; date: string; topic: string } | null;
  history?: string;
  artCulture?: string;
  present?: string;
  blurb?: string;
  blurbTruncated?: boolean;
};

type World = {
  title: string;
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  blocks: { maxX: number; maxZ: number };
  spawnY: number | null;
  siteCount: number;
};

type Register = {
  source: {
    name: string;
    nameEn: string;
    dataset: string;
    licence: string;
    coordinateNote: string;
    osmAttribution: string;
  };
  worlds: Record<string, World>;
  counts: {
    total: number;
    registered: number;
    awaiting: number;
    buildingPrecision: number;
    districtPrecision: number;
    walkable: number;
    byWorld: Record<string, number>;
  };
  sites: Site[];
};

type Filter = "walkable" | "registered" | "all";

const FILTERS: { id: Filter; label: string; hint: string }[] = [
  { id: "walkable", label: "In a world", hint: "Monuments you can walk to in Minecraft" },
  { id: "registered", label: "Registered", hint: "Gazetted ancient monuments" },
  { id: "all", label: "All located", hint: "Everything with a building-precision position" },
];

const SIGNAL = "#c9ff38";
const ORANGE = "#ff6b35";

function matches(site: Site, filter: Filter): boolean {
  if (filter === "walkable") return Boolean(site.block);
  if (filter === "registered") return site.registered;
  return true;
}

function teleport(site: Site, world: World | undefined): string | null {
  if (!site.block) return null;
  const y = world?.spawnY ?? -50;
  return `/tp @s ${site.block.x} ${y} ${site.block.z}`;
}

function DownIcon() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
      <path d="M6 1v9M2 6.5 6 10.5 10 6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function HeritageMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [register, setRegister] = useState<Register | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("walkable");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [styleReady, setStyleReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(REGISTER_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`register ${res.status}`);
        return res.json() as Promise<Register>;
      })
      .then((data) => {
        if (!cancelled) setRegister(data);
      })
      .catch((err: unknown) => {
        // A blank map with no explanation is the one outcome worth avoiding.
        if (!cancelled) setError(err instanceof Error ? err.message : "load failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const located = useMemo(
    () => (register ? register.sites.filter((s) => s.precision === "building") : []),
    [register],
  );

  const visible = useMemo(
    () => located.filter((s) => matches(s, filter)),
    [located, filter],
  );

  const selected = useMemo(
    () => (selectedId ? located.find((s) => s.id === selectedId) ?? null : null),
    [located, selectedId],
  );

  const selectedWorld = selected?.world ? register?.worlds[selected.world] : undefined;
  const tp = selected ? teleport(selected, selectedWorld) : null;

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: visible.map((s) => ({
        type: "Feature" as const,
        id: s.id,
        geometry: { type: "Point" as const, coordinates: [s.lon as number, s.lat as number] },
        properties: {
          id: s.id,
          name: s.name,
          registered: s.registered ? 1 : 0,
          walkable: s.block ? 1 : 0,
        },
      })),
    }),
    [visible],
  );

  // Map init. Runs once; the data layer is updated separately so changing a
  // filter never rebuilds the map.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    let disposed = false;
    let map: maplibregl.Map | null = null;
    let observer: ResizeObserver | null = null;

    void (async () => {
      const maplibre = (await import("maplibre-gl")).default;
      if (disposed || !containerRef.current) return;

      map = new maplibre.Map({
        container: containerRef.current,
        style: OPENFREEMAP_DARK_STYLE,
        center: [100.4977, 13.7546],
        zoom: 12.4,
        minZoom: MIN_ZOOM,
        renderWorldCopies: false,
        attributionControl: false,
antialias: true,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(
        new maplibre.AttributionControl({ compact: true }),
        "bottom-right",
      );

      map.on("load", () => {
        if (!map) return;
        map.addSource("heritage", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "heritage-halo",
          type: "circle",
          source: "heritage",
          filter: ["==", ["get", "walkable"], 1],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 7, 16, 18],
            "circle-color": SIGNAL,
            "circle-opacity": 0.14,
          },
        });

        map.addLayer({
          id: "heritage-dot",
          type: "circle",
          source: "heritage",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, 3.5, 16, 8],
            "circle-color": [
              "case",
              ["==", ["get", "registered"], 1], SIGNAL,
              ORANGE,
            ],
            "circle-stroke-width": 1,
            "circle-stroke-color": "#11120f",
          },
        });

        map.addLayer({
          id: "heritage-label",
          type: "symbol",
          source: "heritage",
          minzoom: 14,
          layout: {
            "text-field": ["get", "name"],
            // The only stack OpenFreeMap serves, and it carries the Thai
            // block. Leaving this unset makes MapLibre ask for its default
            // "Open Sans Regular, Arial Unicode MS Regular", which 404s —
            // so every monument label rendered blank.
            "text-font": ["Noto Sans Regular"],
            "text-size": 11,
            "text-offset": [0, 1.1],
            "text-anchor": "top",
            "text-max-width": 9,
            "text-allow-overlap": false,
          },
          paint: {
            "text-color": "#f1efe8",
            "text-halo-color": "#11120f",
            "text-halo-width": 1.4,
          },
        });

        const pick = (event: maplibregl.MapLayerMouseEvent) => {
          const id = event.features?.[0]?.properties?.id;
          if (typeof id === "string") {
            setSelectedId(id);
            setPanelOpen(true);
            setCopied(false);
          }
        };
        map.on("click", "heritage-dot", pick);
        map.on("mouseenter", "heritage-dot", () => {
          if (map) map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "heritage-dot", () => {
          if (map) map.getCanvas().style.cursor = "";
        });

        setStyleReady(true);
      });

      // The container is a flex child, so its real size lands after MapLibre
      // has already measured. Without this the canvas stays frozen at its
      // pre-layout size and the map renders into a sliver.
      observer = new ResizeObserver(() => map?.resize());
      observer.observe(containerRef.current);
    })();

    return () => {
      disposed = true;
      observer?.disconnect();
      map?.remove();
      mapRef.current = null;
      setStyleReady(false);
    };
  }, []);

  // Push the current selection into the map whenever it changes.
  //
  // Gated on `styleReady` rather than on map.once("load"): the register
  // usually arrives before the style finishes, and a `once("load")`
  // registered after load has already fired never runs — which left the
  // source empty and the map pinless.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const source = map.getSource("heritage") as maplibregl.GeoJSONSource | undefined;
    source?.setData(geojson);
  }, [geojson, styleReady]);

  const focus = useCallback((site: Site) => {
    setSelectedId(site.id);
    setPanelOpen(true);
    setCopied(false);
    const map = mapRef.current;
    if (map && site.lon !== undefined && site.lat !== undefined) {
      map.flyTo({ center: [site.lon, site.lat], zoom: Math.max(map.getZoom(), 15.5), duration: 900 });
    }
  }, []);

  const copyTeleport = useCallback(async () => {
    if (!tp) return;
    try {
      await navigator.clipboard.writeText(tp);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [tp]);

  const counts = register?.counts;

  return (
    <main className="heritage">
      <header className="site-header heritage-header">
        <Link className="wordmark" href="/" aria-label="BKKx home">
          <span>BKK</span>
          <b>x</b>
        </Link>
        <div className="heritage-title">
          <p className="eyebrow">Heritage register <span /> กรมศิลปากร</p>
          <h1>Bangkok, monument by monument</h1>
        </div>
        <nav className="heritage-nav" aria-label="Primary navigation">
          <Link href="/#atlas">Walkthrough</Link>
          <Link href="/atlas/historic-core">3D atlas</Link>
          <Link href="/#enter">Enter the world</Link>
        </nav>
      </header>

      <div className="heritage-body">
        <div className="heritage-map">
          <div ref={containerRef} className="heritage-canvas" />
          {error ? (
            <p className="heritage-error" role="alert">
              The register did not load ({error}). The map is empty for that reason, not
              because Bangkok has no monuments.
            </p>
          ) : null}
          {!register && !error ? <p className="heritage-loading">Reading the register…</p> : null}
        </div>

        <aside className={`heritage-panel${panelOpen ? " is-open" : ""}`}>
          <div className="heritage-filters" role="group" aria-label="Filter monuments">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                title={f.hint}
                aria-pressed={filter === f.id}
                className={filter === f.id ? "is-active" : undefined}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {counts ? (
            <p className="heritage-count">
              <strong>{visible.length}</strong> shown ·{" "}
              {counts.walkable} walkable in a world · {counts.districtPrecision} more in the
              register with no published position
            </p>
          ) : null}

          {selected ? (
            <article className="heritage-detail">
              <button
                type="button"
                className="heritage-close"
                onClick={() => setPanelOpen(false)}
                aria-label="Close details"
              >
                ×
              </button>
              <p className="eyebrow">
                {selected.district}
                {selected.subDistrict ? ` · ${selected.subDistrict}` : ""}
              </p>
              <h2 lang="th">{selected.name}</h2>

              <ul className="heritage-facts">
                <li>
                  <span>Status</span>
                  <b className={selected.registered ? "is-registered" : "is-awaiting"} lang="th">
                    {selected.registerStatus}
                  </b>
                </li>
                {selected.gazette ? (
                  <li>
                    <span>Royal Gazette</span>
                    <b>
                      Vol {selected.gazette.volume}
                      {selected.gazette.part ? `, part ${selected.gazette.part}` : ""}
                      {selected.gazette.date ? ` · ${selected.gazette.date}` : ""}
                    </b>
                  </li>
                ) : null}
                <li>
                  <span>Position</span>
                  <b>
                    {selected.lat?.toFixed(5)}, {selected.lon?.toFixed(5)}
                    <small>
                      {selected.locatedBy === "fine-arts"
                        ? " as published by the Fine Arts Department"
                        : ` located by name against OpenStreetMap (${selected.locatedBy.split(":").pop()})`}
                    </small>
                  </b>
                </li>
              </ul>

              {tp && selectedWorld ? (
                <div className="heritage-tp">
                  <p className="eyebrow">Walk here <span /> {selectedWorld.title}</p>
                  <code>{tp}</code>
                  <button type="button" onClick={copyTeleport}>
                    {copied ? "Copied" : "Copy command"}
                  </button>
                  <small>
                    Block {selected.block?.x}, {selected.block?.z} · 1 block = 1 metre.
                    Paste in chat with cheats on, or walk from spawn.
                  </small>
                </div>
              ) : (
                <p className="heritage-note">
                  Outside both generated worlds — mapped here, but there is no Minecraft
                  ground to stand on yet.
                </p>
              )}

              {selected.history ? (
                <section className="heritage-prose">
                  <h3>ประวัติ</h3>
                  <p lang="th">{selected.history}</p>
                </section>
              ) : null}
              {selected.artCulture ? (
                <section className="heritage-prose">
                  <h3>ลักษณะทางศิลปกรรม</h3>
                  <p lang="th">{selected.artCulture}</p>
                </section>
              ) : null}
              {selected.present ? (
                <section className="heritage-prose">
                  <h3>สภาพปัจจุบัน</h3>
                  <p lang="th">{selected.present}</p>
                </section>
              ) : null}
              {!selected.history && selected.blurb ? (
                <section className="heritage-prose">
                  <h3>ประวัติ</h3>
                  <p lang="th">
                    {selected.blurb}
                    {selected.blurbTruncated ? "…" : ""}
                  </p>
                  {selected.blurbTruncated && register ? (
                    <a href={register.source.dataset} target="_blank" rel="noreferrer">
                      Full entry in the Fine Arts register <DownIcon />
                    </a>
                  ) : null}
                </section>
              ) : null}
            </article>
          ) : (
            <ol className="heritage-list">
              {visible.slice(0, 200).map((site) => (
                <li key={site.id}>
                  <button type="button" onClick={() => focus(site)}>
                    <span className={site.registered ? "dot is-registered" : "dot is-awaiting"} />
                    <span className="heritage-list-name" lang="th">{site.name}</span>
                    <span className="heritage-list-meta">
                      {site.district}
                      {site.block ? ` · ${site.block.x}, ${site.block.z}` : ""}
                    </span>
                  </button>
                </li>
              ))}
              {visible.length > 200 ? (
                <li className="heritage-more">
                  Showing the first 200 of {visible.length}. Zoom the map to reach the rest.
                </li>
              ) : null}
            </ol>
          )}

          {register ? (
            <footer className="heritage-source">
              <p>
                <a href={register.source.dataset} target="_blank" rel="noreferrer">
                  {register.source.name}
                </a>{" "}
                · {register.source.licence}. {register.source.osmAttribution}.
              </p>
              <p className="heritage-caveat">{register.source.coordinateNote}</p>
            </footer>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
