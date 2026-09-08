"use client";

import Link from "next/link";
import { AboutEssay } from "./AboutEssay";

type Stat = {
  value: string;
  unit?: string;
  label: string;
  source: string;
  sourceUrl?: string;
  year?: string;
};

type Section = {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  stats: Stat[];
};

const SECTIONS: Section[] = [
  {
    id: "people",
    eyebrow: "01 · People",
    title: "A federal territory of two million",
    lede: "Wilayah Persekutuan Kuala Lumpur is 243 km². The city proper is what the federal-territory boundary says it is; the Klang Valley around it is larger and is not this atlas.",
    stats: [
      { value: "1,982,112", label: "WP Kuala Lumpur population, MyCensus 2020", source: "DOSM MyCensus 2020", year: "2020", sourceUrl: "https://www.dosm.gov.my/" },
      { value: "243", unit: "km²", label: "Federal Territory area", source: "DBKL / official WP KL gazetteer" },
      { value: "≈ 8,200", unit: "/km²", label: "Population density, city proper (2020 / 243 km²)", source: "Derived from DOSM 2020 and the official area" },
      { value: "1857", label: "Year the settlement at the two-river confluence is conventionally dated", source: "Standard KL founding narrative; the padang is later" },
    ],
  },
  {
    id: "skyline",
    eyebrow: "02 · Skyline",
    title: "Towers the world already knows how to read",
    lede: "Heights below are published envelopes — CTBUH architectural height, Menara KL's own antenna figure — not a survey of this twin. Intermediate tapers on the map are labelled interpretive.",
    stats: [
      { value: "678.9", unit: "m", label: "Merdeka 118 architectural height", source: "CTBUH", sourceUrl: "https://www.skyscrapercenter.com/" },
      { value: "453.6", unit: "m", label: "Exchange 106 architectural height", source: "CTBUH" },
      { value: "451.9", unit: "m", label: "Petronas Twin Towers architectural height", source: "CTBUH" },
      { value: "421", unit: "m", label: "Menara KL antenna height", source: "Menara KL" },
      { value: "58.4", unit: "m", label: "Petronas skybridge length, at 170 m AGL", source: "CTBUH / Petronas Twin Towers" },
      { value: "73", unit: "m", label: "Masjid Negara minaret", source: "Tourism Malaysia" },
    ],
  },
  {
    id: "heritage",
    eyebrow: "03 · Heritage",
    title: "A short register, mapped honestly",
    lede: "This twin holds the 2007, 2009 and 2012 National Heritage entries that can be placed in WP Kuala Lumpur, plus named OSM landmarks. It is not a copy of another city's 571-row file.",
    stats: [
      { value: "20", label: "Register entries on this twin", source: "KLX / Jabatan Warisan Negara lists" },
      { value: "14", label: "Gazetted National Heritage on those lists", source: "JWN 2007 / 2009 / 2012" },
      { value: "16", label: "Pinned to a building or OSM feature", source: "OSM name-match" },
      { value: "9", label: "Heritage quarters in this atlas", source: "KLX" },
      { value: "3", label: "Documented walking routes", source: "KLX · 1.25 × great-circle" },
      { value: "45", label: "Stacked 3D parts across 12 complexes", source: "klx-hero-monuments.geojson" },
      { value: "0", label: "Minecraft worlds generated for Kuala Lumpur", source: "This branch. Atlas only." },
    ],
  },
  {
    id: "water",
    eyebrow: "04 · Water",
    title: "The two rivers, and what we do not invent",
    lede: "Kuala Lumpur is named for the muddy confluence. JPS InfoBanjir (state code WLH) is the live portal. It has no documented public JSON API, so this twin does not scrape unofficial mirrors.",
    stats: [
      { value: "WLH", label: "JPS InfoBanjir state code for WP Kuala Lumpur", source: "publicinfobanjir.water.gov.my" },
      { value: "90", unit: "m", label: "Interpretive corridor around OSM rivers — not zon banjir", source: "KLX · labelled interpretation" },
      { value: "2002 / 2003", label: "MyGDI drainage and flood-area catalogue years, awaiting ingest", source: "MyGDI / JPS" },
      { value: "1", label: "Water dataset ingested (OSM rivers as geometry)", source: "klx-rivers.geojson" },
    ],
  },
  {
    id: "land",
    eyebrow: "05 · Land",
    title: "Listing bands, not parcels",
    lede: "NAPIC appraisal PDFs exist and are catalogued. They are not in this repo. The atlas draws district boxes from published listing and media PSF bands, converted to RM/m².",
    stats: [
      { value: "÷ 0.092903", label: "Conversion used: RM/m² = RM/psf ÷ 0.092903", source: "1 square foot = 0.092903 m²" },
      { value: "KLCC", label: "Among the highest listing bands drawn here (~RM 1,500–3,000 psf in cited media)", source: "Cited listing/media bands on each feature" },
      { value: "5", label: "District boxes on the land layer", source: "klx-land-price.geojson" },
    ],
  },
  {
    id: "cameras",
    eyebrow: "06 · Cameras",
    title: "Public streams, no invented DBKL URLs",
    lede: "KLCCC has a public portal. Individual camera endpoints are not a documented JSON API. YouTube skyline streams are linked; video ids go stale when the channel restarts.",
    stats: [
      { value: "5", label: "Curated camera tiles in the war-room rail", source: "cctv-cameras.ts" },
      { value: "0", label: "Confirmed mounts on the atlas map", source: "placeholder pins share one nominal coordinate and stay off the map" },
      { value: "KLCCC", label: "DBKL Command & Control Centre public portal, linked not scraped", source: "klccc.dbkl.gov.my" },
    ],
  },
];

const CORE_SECTION_IDS = new Set(["people", "skyline", "heritage", "water"]);
const CORE_SECTIONS = SECTIONS.filter((section) => CORE_SECTION_IDS.has(section.id));
const LEDGER_SECTIONS = SECTIONS.filter((section) => !CORE_SECTION_IDS.has(section.id));

function NumbersSection({ section, rule = true }: { section: Section; rule?: boolean }) {
  return (
    <section
      id={section.id}
      className="numbers-section"
      aria-labelledby={`${section.id}-title`}
    >
      <div className="numbers-section-head">
        <p className="numbers-section-eyebrow">{section.eyebrow}</p>
        <h2 id={`${section.id}-title`} className="numbers-section-title">
          {section.title}
        </h2>
        <p className="numbers-section-lede">{section.lede}</p>
      </div>

      <ul className="numbers-stat-grid">
        {section.stats.map((stat, statIdx) => (
          <li key={`${section.id}-${statIdx}`} className="numbers-stat">
            <p className="numbers-stat-value">
              <span>{stat.value}</span>
              {stat.unit ? <small>{stat.unit}</small> : null}
            </p>
            <p className="numbers-stat-label">{stat.label}</p>
            <p className="numbers-stat-source">
              {stat.sourceUrl ? (
                <a href={stat.sourceUrl} target="_blank" rel="noreferrer">
                  {stat.source}
                </a>
              ) : (
                <span>{stat.source}</span>
              )}
              {stat.year ? <span className="numbers-stat-year"> · {stat.year}</span> : null}
            </p>
          </li>
        ))}
      </ul>

      {rule ? <hr className="numbers-section-rule" aria-hidden="true" /> : null}
    </section>
  );
}

export function AboutClient() {
  return (
    <div className="numbers-page">
      <header className="numbers-masthead">
        <div className="numbers-masthead-meta">
          <span className="register-eyebrow">
            <span lang="ms">Kuala Lumpur dalam nombor</span>
          </span>
          <h1>
            Kuala Lumpur by the numbers.
            <br />
            <em>Then read the city.</em>
          </h1>
          <p className="numbers-masthead-lede">
            Start with four things a mayor can check: who is here, how tall the
            towers actually are, what the National Heritage lists cover, and what
            this twin refuses to invent about flood water.
          </p>
        </div>
        <nav className="numbers-masthead-nav" aria-label="Sections">
          {CORE_SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.eyebrow}
            </a>
          ))}
          <a href="#full-ledger">Land and cameras</a>
          <a href="#essay">Why this exists</a>
        </nav>
      </header>

      <main className="numbers-body">
        {CORE_SECTIONS.map((section) => (
          <NumbersSection key={section.id} section={section} />
        ))}

        <details className="numbers-disclosure numbers-ledger" id="full-ledger">
          <summary>
            <span className="numbers-disclosure-copy">
              <small>05–06 · Full city ledger</small>
              <strong>Land bands and public cameras.</strong>
            </span>
            <span className="numbers-disclosure-action">
              Open more measures <b aria-hidden="true">+</b>
            </span>
          </summary>
          <div className="numbers-disclosure-body">
            {LEDGER_SECTIONS.map((section, index) => (
              <NumbersSection
                key={section.id}
                section={section}
                rule={index < LEDGER_SECTIONS.length - 1}
              />
            ))}
          </div>
        </details>

        <section className="numbers-endnote" aria-label="Reading order">
          <p className="numbers-endnote-eyebrow">After the numbers</p>
          <h2 className="numbers-endnote-title">Then read the city.</h2>
          <p>
            The register at <Link href="/heritage">/heritage</Link> holds the
            twenty entries by name and how each pin was located. The{" "}
            <Link href="/heritage#quarters">9 quarters</Link> are the lens. The{" "}
            <Link href="/walks/merdeka-civic">3 walks</Link> use 1.25 × great-circle
            distances; the public OSRM foot profile detours around Dataran Merdeka
            and is not used.
          </p>
          <p>
            The 3D map on the <Link href="/">home page</Link> opens on KLCC. Pick a
            quarter on the left and the map flies there. Iconic buildings are stacked
            parts so they read as themselves.
          </p>
          <p className="numbers-endnote-mute">
            Sources: DOSM MyCensus 2020, DBKL, CTBUH, Menara KL, Tourism Malaysia,
            Jabatan Warisan Negara, OpenStreetMap, JPS InfoBanjir. Values rounded;
            where the source itself rounds, we show the source&apos;s number.
          </p>
        </section>

        <details className="numbers-disclosure numbers-essay-disclosure" id="essay">
          <summary>
            <span className="numbers-disclosure-copy">
              <small>The human version</small>
              <strong>The city the mayors have to see.</strong>
            </span>
            <span className="numbers-disclosure-action">
              Read why this exists <b aria-hidden="true">+</b>
            </span>
          </summary>
          <div className="numbers-essay" aria-label="After the numbers: the essay">
            <AboutEssay />
          </div>
        </details>
      </main>
    </div>
  );
}
