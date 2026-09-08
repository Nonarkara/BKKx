"use client";

import Link from "next/link";
import { useLocale } from "../i18n/LocaleContext";
import { AREA_MS, AREA_ZH } from "../data/heritage-translations";
import { walkDistance, type Area, type Walk } from "../data/heritage-content";

function areaTag(locale: string, slug: string, fallback: string): string {
  if (locale === "ms") return AREA_MS[slug]?.tagline ?? fallback;
  if (locale === "zh") return AREA_ZH[slug]?.tagline ?? fallback;
  return fallback;
}

export function QuartersIndex({ areas }: { areas: Area[] }) {
  const { t, locale } = useLocale();
  return (
    <section className="register-quarters" id="quarters" aria-label="Heritage quarters">
      <h2 className="register-section-title">{t("section_quarters_title")}</h2>
      <p className="register-section-lede">{t("quarters_index_lede")}</p>
      <ul className="quarters-index">
        {areas.map((area) => (
          <li key={area.slug}>
            <Link href={`/areas/${area.slug}`}>
              <span className="quarters-name">
                {area.name} <small lang={locale === "zh" ? "zh" : "ms"}>{area.thai}</small>
              </span>
              <span className="quarters-tag" lang={locale === "en" ? undefined : locale}>
                {areaTag(locale, area.slug, area.tagline)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WalksIndex({ walks }: { walks: Walk[] }) {
  const { t } = useLocale();
  return (
    <section className="register-walks-index" id="walks" aria-label="Heritage walks">
      <h2 className="register-section-title">{t("section_walks_title")}</h2>
      <p className="register-section-lede">{t("walks_index_lede")}</p>
      <ol className="walks-index">
        {walks.map((walk) => (
          <li key={walk.slug}>
            <Link href={`/walks/${walk.slug}`}>
              <span className="walks-pattern">{walk.pattern}</span>
              <span className="walks-name">{walk.name}</span>
              <span className="walks-meta">
                {walk.stops.length} {t("walk_stops_lower")}
                {walkDistance(walk) ? ` · ${walkDistance(walk)}` : ""}
                {walk.mode === "bike" ? ` · ${t("by_bicycle")}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function RegisterMappedHeading() {
  const { t } = useLocale();
  return (
    <div className="register-lede register-section-head">
      <h2 className="register-section-title">{t("section_register_title")}</h2>
      <p className="register-section-lede">{t("register_mapped_lede")}</p>
    </div>
  );
}
