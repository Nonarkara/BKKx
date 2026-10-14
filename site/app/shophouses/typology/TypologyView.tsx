"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  SHOPHOUSE_TYPES,
  typologyPoints,
  type ConfirmPart,
  type Lang,
  type ShophouseTypeEntry,
} from "../../data/shophouse-typology";
import { TypeElevation } from "./elevations";

const STYLE = "https://tiles.openfreemap.org/styles/positron";
const SEAL = "#a83332";
const INK = "#15140f";

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
  const mapRef = useRef<maplibregl.Map | null>(null);
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
      const maplibre = (await import("maplibre-gl")).default;
      if (disposed || !containerRef.current) return;
      const map = new maplibre.Map({
        container: containerRef.current,
        style: STYLE,
        center: [100.55, 13.756],
        zoom: 11,
        minZoom: 9,
        maxZoom: 17,
        renderWorldCopies: false,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");
      map.on("load", () => {
        if (disposed) return;
        map.addSource("typology", { type: "geojson", data: typologyPoints() });
        map.addLayer({
          id: "typology-pins",
          type: "circle",
          source: "typology",
          paint: {
            "circle-radius": 7,
            "circle-color": SEAL,
            "circle-stroke-width": 1.5,
            "circle-stroke-color": INK,
          },
        });
        map.on("click", "typology-pins", (event) => {
          const id = event.features?.[0]?.properties?.id;
          if (typeof id === "string") setSelectedId(id);
        });
        map.on("mouseenter", "typology-pins", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "typology-pins", () => {
          map.getCanvas().style.cursor = "";
        });
      });
    })();

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !selected || selected.lat == null || selected.lng == null) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const center: [number, number] = [selected.lng, selected.lat];
    if (reduced) map.jumpTo({ center, zoom: 15 });
    else map.flyTo({ center, zoom: 15 });
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
      <TypeElevation id={entry.elevation} title={entry.name[lang]} caption={entry.era[lang]} />
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
