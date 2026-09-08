"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useLocale } from "../i18n/LocaleContext";
import { LangToggle } from "../i18n/LangToggle";
import { AREA_MS, AREA_ZH } from "../data/heritage-translations";

type Quarter = {
  slug: string;
  name: string;
  thai?: string;
  center: [number, number];
  zoom: number;
  tagline?: string;
  photo?: string;
};

type Props = {
  quarters: Quarter[];
  initialQuarter?: string;
};

const HERITAGE_MAP_BASE = "/atlas/klcc?embed=1";

function heritageMapUrlFor(q: Quarter | null): string {
  if (!q) return HERITAGE_MAP_BASE;
  return `${HERITAGE_MAP_BASE}&at=${q.center[0]},${q.center[1]},${q.zoom}`;
}

function areaTag(locale: string, slug: string, fallback?: string): string | undefined {
  if (locale === "ms") return AREA_MS[slug]?.tagline ?? fallback;
  if (locale === "zh") return AREA_ZH[slug]?.tagline ?? fallback;
  return fallback;
}

export function HomepageClient({ quarters, initialQuarter }: Props) {
  const { t, locale } = useLocale();
  const [activeSlug, setActiveSlug] = useState<string | null>(initialQuarter ?? null);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const activeQuarter = activeSlug ? quarters.find((q) => q.slug === activeSlug) : null;
  const initialSrc = heritageMapUrlFor(activeQuarter ?? null);

  function pickQuarter(q: Quarter) {
    if (q.slug === activeSlug) return;
    setActiveSlug(q.slug);
    setIframeKey((k) => k + 1);
  }

  return (
    <div className="atlas-shell">
      <header className="atlas-shell-masthead" aria-label="KLX primary">
        <Link className="register-wordmark" href="/" aria-label="KLXxC(ulture) home">
          <span>KL</span>
          <b>x</b>
          <em>C(ulture)</em>
        </Link>
        <div className="atlas-shell-masthead-meta">
          <span className="register-eyebrow">
            <span lang="ms">Wilayah Persekutuan Kuala Lumpur</span>
          </span>
          <strong>Kuala Lumpur&apos;s heritage, monument by monument.</strong>
          <small>{t("front_door_tagline")}</small>
        </div>
        <nav className="atlas-shell-nav" aria-label="Heritage navigation">
          <Link href="/heritage#register">{t("nav_register")}</Link>
          <Link href="/heritage#walks">{t("nav_walks")}</Link>
          <Link href="/about">{t("nav_about")}</Link>
          <LangToggle />
        </nav>
      </header>

      <div className="atlas-shell-body">
        <aside className="atlas-shell-quarters" aria-label="Heritage quarters">
          <section className="atlas-shell-quarter-view">
            <header className="atlas-shell-quarter-view-head">
              <p className="register-eyebrow">Heritage · Kuala Lumpur</p>
              <h2 className="register-section-title atlas-shell-quarters-title">
                {t("home_quarters_heading")}
              </h2>
              <p className="atlas-shell-quarters-lede">{t("quarters_lede")}</p>
            </header>
            <ol className="atlas-shell-quarter-chips">
            {quarters.map((q) => {
              const isActive = q.slug === activeSlug;
              const tag = areaTag(locale, q.slug, q.tagline);
              return (
                <li key={q.slug}>
                  <button
                    type="button"
                    className={isActive ? "is-active" : ""}
                    onClick={() => pickQuarter(q)}
                    aria-pressed={isActive}
                    title={tag ? `${q.name} — ${tag}` : q.name}
                  >
                    {q.photo ? (
                      <span
                        className="atlas-shell-quarter-thumb"
                        aria-hidden="true"
                        style={{ backgroundImage: `url(${q.photo})` }}
                      />
                    ) : (
                      <span
                        className="atlas-shell-quarter-thumb atlas-shell-quarter-thumb-empty"
                        aria-hidden="true"
                      >
                        {q.name.slice(0, 2)}
                      </span>
                    )}
                    <span className="atlas-shell-quarter-body">
                      <span className="atlas-shell-quarter-name">{q.name}</span>
                      {q.thai ? (
                        <span className="atlas-shell-quarter-thai" lang={locale === "zh" ? "zh" : "ms"}>
                          {q.thai}
                        </span>
                      ) : null}
                      {tag ? (
                        <span className="atlas-shell-quarter-tag" lang={locale === "en" ? undefined : locale}>
                          {tag}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
            </ol>
          </section>

          <p className="register-eyebrow atlas-shell-quarters-after">{t("home_source_label")}</p>
          <p className="atlas-shell-side">
            <a href="https://github.com/Nonarkara/BKKx" target="_blank" rel="noreferrer">
              {t("home_source_github")}
            </a>
          </p>

          <p className="atlas-shell-footnote">
            This is the Kuala Lumpur twin — stacked iconic monuments, the National Heritage
            lists pulled from Jabatan Warisan Negara, OSM rivers, an interpretive flood
            corridor, and listing-based land bands. JPS zon banjir and NAPIC parcels are
            catalogued, not ingested. See{" "}
            <Link href="/heritage#register">the register</Link> for source notes.
          </p>
        </aside>

        <div className="atlas-shell-map">
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={initialSrc}
            title="Kuala Lumpur 3D atlas — heritage view"
            loading="eager"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}
