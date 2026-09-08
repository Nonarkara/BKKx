"use client";

import { useLocale } from "../i18n/LocaleContext";
import { AREA_MS, AREA_ZH } from "../data/heritage-translations";
import type { Area } from "../data/heritage-content";

function overlay(locale: string, slug: string) {
  if (locale === "ms") return AREA_MS[slug];
  if (locale === "zh") return AREA_ZH[slug];
  return undefined;
}

export function AreaTagline({ area }: { area: Area }) {
  const { locale } = useLocale();
  const t = overlay(locale, area.slug);
  return <p className="place-tagline">{t?.tagline ?? area.tagline}</p>;
}

export function AreaProse({ area }: { area: Area }) {
  const { locale } = useLocale();
  const t = overlay(locale, area.slug);
  const prose = t?.prose ?? area.prose;
  return (
    <div className="register-intro">
      {prose.map((p) => (
        <p key={p.slice(0, 24)} lang={t ? locale : undefined}>
          {p}
        </p>
      ))}
    </div>
  );
}
