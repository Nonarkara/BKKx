"use client";

import { useLocale } from "./LocaleContext";

export function LangToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="lang-toggle" role="group" aria-label={t("lang_toggle_label")}>
      <button
        type="button"
        aria-pressed={locale === "en"}
        className={locale === "en" ? "is-active" : undefined}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        type="button"
        aria-pressed={locale === "ms"}
        className={locale === "ms" ? "is-active" : undefined}
        onClick={() => setLocale("ms")}
      >
        BM
      </button>
      <button
        type="button"
        lang="zh"
        aria-pressed={locale === "zh"}
        className={locale === "zh" ? "is-active" : undefined}
        onClick={() => setLocale("zh")}
      >
        中文
      </button>
    </div>
  );
}
