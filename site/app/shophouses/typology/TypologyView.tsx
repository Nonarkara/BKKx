"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLIMATE_POST,
  CREATOR,
  JACOBS_POST,
  SHOPHOUSE_TYPES,
  TYPOLOGY_CREDITS,
  TYPOLOGY_RECORD,
  TYPOLOGY_STANCE,
  typologyPoints,
  type ConfirmPart,
  type Lang,
  type ShophouseTypeEntry,
} from "../../data/shophouse-typology";
import { TypeElevation } from "./elevations";
import { InstagramEmbed } from "./InstagramEmbed";

// Raster tiles, drawn by Leaflet. The OpenFreeMap vector style throws when a
// numeric field is null, which blanked this map. CARTO's raster host now
// returns an API-key watermark. OpenStreetMap's standard tiles still draw
// the city; the page attributes them.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const SEAL = "#a83332";
const INK = "#15140f";

type LeafletMap = {
  setView: (latlng: [number, number], zoom: number) => void;
  flyTo: (latlng: [number, number], zoom: number, options?: { duration: number }) => void;
  remove: () => void;
  invalidateSize: () => void;
};

type LeafletNs = {
  map: (el: HTMLElement, options: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options: Record<string, unknown>) => { addTo: (map: LeafletMap) => void };
  circleMarker: (
    latlng: [number, number],
    options: Record<string, unknown>,
  ) => { addTo: (map: LeafletMap) => { on: (event: string, fn: () => void) => void } };
  control: { zoom: (options: { position: string }) => { addTo: (map: LeafletMap) => void } };
};

declare global {
  interface Window {
    L?: LeafletNs;
  }
}

function loadLeaflet(): Promise<LeafletNs> {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    if (!document.getElementById("typology-leaflet-css")) {
      const link = document.createElement("link");
      link.id = "typology-leaflet-css";
      link.rel = "stylesheet";
      link.href = "/drainage/vendor/leaflet.css";
      document.head.appendChild(link);
    }
    const existing = document.querySelector<HTMLScriptElement>("script[data-typology-leaflet]");
    const finish = () => (window.L ? resolve(window.L) : reject(new Error("Leaflet missing")));
    if (existing) {
      if (window.L) finish();
      else existing.addEventListener("load", finish, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "/drainage/vendor/leaflet.js";
    script.dataset.typologyLeaflet = "1";
    script.onload = finish;
    script.onerror = () => reject(new Error("Leaflet failed to load"));
    document.body.appendChild(script);
  });
}

const CHROME: Record<
  Lang,
  {
    title: string;
    essay: string;
    language: string;
    types: string;
    noPin: string;
    pinned: string;
    open: string;
    sources: string;
    credit: string;
    era: string;
    features: string;
    drawing: string;
    parts: Record<ConfirmPart, string>;
  }
> = {
  en: {
    title: "Typology",
    essay: "Essay",
    language: "Language",
    types: "types",
    noPin: "No pin yet — a point needs a confirmed latitude and longitude",
    pinned: "pinned",
    open: "Still open",
    sources: "Sources",
    credit: "Urban Creature, 5 Oct 2026",
    era: "Era",
    features: "Facade",
    drawing: "Drawing",
    parts: {
      era: "era",
      street: "street",
      district: "district",
      facade: "facade",
      point: "map point",
    },
  },
  th: {
    title: "ประเภทตึก",
    essay: "เรียงความ",
    language: "ภาษา",
    types: "แบบ",
    noPin: "ยังไม่ปักหมุด — จะปักเมื่อมีละติจูดและลองจิจูดที่ยืนยันแล้ว",
    pinned: "จุด",
    open: "ยังเปิดไว้",
    sources: "แหล่งที่มา",
    credit: "Urban Creature, 5 ต.ค. 2026",
    era: "ยุค",
    features: "หน้าอาคาร",
    drawing: "รูปด้าน",
    parts: {
      era: "ยุค",
      street: "ถนน",
      district: "เขต",
      facade: "หน้าอาคาร",
      point: "จุดบนแผนที่",
    },
  },
  zh: {
    title: "店屋类型",
    essay: "文章",
    language: "语言",
    types: "种",
    noPin: "还没有点 — 纬度和经度都确认了才标",
    pinned: "个点",
    open: "先空着",
    sources: "来源",
    credit: "Urban Creature，2026年10月5日",
    era: "年代",
    features: "立面",
    drawing: "立面图",
    parts: {
      era: "年代",
      street: "街道",
      district: "区",
      facade: "立面",
      point: "地图上的点",
    },
  },
};

const LANGS: Array<{ id: Lang; label: string }> = [
  { id: "en", label: "EN" },
  { id: "th", label: "ไทย" },
  { id: "zh", label: "中文" },
];

function htmlLang(lang: Lang): string {
  if (lang === "zh") return "zh-Hans";
  return lang;
}

export function TypologyView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [selectedId, setSelectedId] = useState(SHOPHOUSE_TYPES[0]?.id ?? "");
  const chrome = CHROME[lang];
  const selected = SHOPHOUSE_TYPES.find((t) => t.id === selectedId) ?? SHOPHOUSE_TYPES[0];
  const points = useMemo(() => typologyPoints(), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    let disposed = false;

    void (async () => {
      let L: LeafletNs;
      try {
        L = await loadLeaflet();
      } catch {
        return;
      }
      if (disposed || !containerRef.current) return;
      const map = L.map(containerRef.current, {
        zoomControl: false,
        minZoom: 9,
        maxZoom: 17,
        attributionControl: true,
      });
      map.setView([13.756, 100.55], 11);
      mapRef.current = map;
      L.tileLayer(TILES, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 20,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      for (const entry of SHOPHOUSE_TYPES) {
        if (entry.lat == null || entry.lng == null) continue;
        const marker = L.circleMarker([entry.lat, entry.lng], {
          radius: 7,
          color: INK,
          weight: 1.5,
          fillColor: SEAL,
          fillOpacity: 1,
        }).addTo(map);
        marker.on("click", () => setSelectedId(entry.id));
      }
      window.setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selected || selected.lat == null || selected.lng == null) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const center: [number, number] = [selected.lat, selected.lng];
    if (reduced) map.setView(center, 15);
    else map.flyTo(center, 15, { duration: 0.6 });
  }, [selected]);

  return (
    <div className="typo-shell">
      <header className="typo-top">
        <Link href="/shophouses" className="typo-mark">
          Shophouse
        </Link>
        <h1 lang={htmlLang(lang)}>{chrome.title}</h1>
        <nav aria-label={chrome.title}>
          <Link href="/shophouses">{chrome.essay}</Link>
          <div className="typo-lang" role="group" aria-label={chrome.language}>
            {LANGS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={lang === item.id}
                onClick={() => setLang(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <div className="typo-stage">
        <div ref={containerRef} id="typology-map" className="typo-map" />
        <div className="typo-rail">
          <aside className="typo-intro" lang={htmlLang(lang)}>
            {TYPOLOGY_STANCE.intro[lang].split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <ul>
              {TYPOLOGY_STANCE.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url}>{source.title}</a>
                </li>
              ))}
            </ul>
            <InstagramEmbed
              embed={TYPOLOGY_STANCE.embed}
              name={JACOBS_POST.name}
              handle={JACOBS_POST.handle}
            />
          </aside>
          <ul className="typo-switch">
            {SHOPHOUSE_TYPES.map((entry) => (
              <li key={entry.id}>
                <TypeButton
                  entry={entry}
                  lang={lang}
                  pressed={entry.id === selected?.id}
                  onSelect={setSelectedId}
                />
              </li>
            ))}
          </ul>
          {selected ? <Detail entry={selected} lang={lang} /> : null}
          <section className="typo-record" lang={htmlLang(lang)}>
            <h2>{chrome.sources}</h2>
            {TYPOLOGY_RECORD[lang].split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
            <InstagramEmbed
              embed={{ postUrl: CLIMATE_POST.post, imageIndex: CLIMATE_POST.imageIndex }}
              name={CLIMATE_POST.name}
              handle={CLIMATE_POST.handle}
            />
            <ul>
              {[...TYPOLOGY_CREDITS, ...TYPOLOGY_STANCE.sources].map((source) => (
                <li key={source.url}>
                  <a href={source.url}>{source.title}</a>
                  {" — "}
                  {source.credit}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <footer className="typo-bottom">
        <p lang={htmlLang(lang)}>
          {SHOPHOUSE_TYPES.length} {chrome.types}
          {" · "}
          {points.features.length === 0
            ? chrome.noPin
            : `${points.features.length} ${chrome.pinned}`}
        </p>
        <a href="https://urbancreature.co/shophouse-supply/">{chrome.credit}</a>
      </footer>
    </div>
  );
}

function TypeButton({
  entry,
  lang,
  pressed,
  onSelect,
}: {
  entry: ShophouseTypeEntry;
  lang: Lang;
  pressed: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={entry.featured ? "typo-card is-featured" : "typo-card"}
      aria-pressed={pressed}
      onClick={() => onSelect(entry.id)}
    >
      <TypeElevation id={entry.elevation} title={entry.name[lang]} caption={entry.era[lang]} />
      <span className="typo-card-text" lang={htmlLang(lang)}>
        {entry.featured ? <em className="typo-kicker">{entry.featured[lang]}</em> : null}
        <span className="typo-name">{entry.name[lang]}</span>
        <span className="typo-place">
          {entry.street[lang]}
          {" · "}
          {entry.district[lang]}
        </span>
      </span>
    </button>
  );
}

function Detail({ entry, lang }: { entry: ShophouseTypeEntry; lang: Lang }) {
  const chrome = CHROME[lang];
  const open = entry.toConfirm.map((part) => chrome.parts[part]).join(", ");
  return (
    <article
      className={entry.featured ? "typo-detail is-featured" : "typo-detail"}
      lang={htmlLang(lang)}
      aria-live="polite"
    >
      <div className="typo-pair">
        <TypeElevation id={entry.elevation} title={entry.name[lang]} caption={entry.era[lang]} />
        {entry.embed ? (
          <InstagramEmbed
            embed={entry.embed}
            name={`${CREATOR.name} (${CREATOR.nameTh})`}
            handle={CREATOR.handle}
            article={CREATOR.article}
          />
        ) : null}
      </div>
      {entry.featured ? <p className="typo-kicker">{entry.featured[lang]}</p> : null}
      <h2>{entry.name[lang]}</h2>
      <p>{entry.description[lang]}</p>
      <p>
        <strong>{chrome.era}. </strong>
        {entry.era[lang]}
      </p>
      <p>
        <strong>{chrome.features}. </strong>
      </p>
      <ul className="typo-features">
        {entry.facade.map((feature) => (
          <li key={feature.en}>{feature[lang]}</li>
        ))}
      </ul>
      {open ? (
        <p className="typo-open">
          {chrome.open}: {open}
        </p>
      ) : null}
      <p>
        <strong>{chrome.drawing}. </strong>
        {entry.drawingRef[lang]}
      </p>
      <details className="typo-sources">
        <summary>{chrome.sources}</summary>
        <ul>
          {entry.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url}>{source.title}</a>
              {" — "}
              {source.credit}
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}
