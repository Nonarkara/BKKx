"use client";

import { useLocale } from "../i18n/LocaleContext";
import { questSpotsFor, QUEST_THEME_LABEL, type QuestTheme } from "../data/quest-spots";

const THEME_ORDER: QuestTheme[] = ["eat", "mindful", "explore", "create", "connect"];

export function QuestSpots({ areaSlug }: { areaSlug: string }) {
  const { locale, t } = useLocale();
  const spots = questSpotsFor(areaSlug);
  if (!spots.length) return null;

  const byTheme = THEME_ORDER.map((theme) => ({
    theme,
    entries: spots.filter((s) => s.theme === theme),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="place-quests">
      <h2>{t("quests_heading")}</h2>
      <p className="place-quests-lede">{t("quests_lede")}</p>
      {byTheme.map(({ theme, entries }) => (
        <div className="place-quests-group" key={theme}>
          <p className="place-quests-theme">
            <span aria-hidden="true">{QUEST_THEME_LABEL[theme].icon}</span>
            {locale === "th" ? QUEST_THEME_LABEL[theme].th : QUEST_THEME_LABEL[theme].en}
          </p>
          <ul>
            {entries.map((spot) => (
              <li key={spot.name}>
                <strong>{spot.name}</strong>
                {spot.thai ? (
                  <span className="place-quests-thai" lang="th">
                    {spot.thai}
                  </span>
                ) : null}
                <p lang={locale === "th" ? "th" : undefined}>
                  {locale === "th" ? spot.noteTh : spot.note}
                </p>
                <small>
                  {t("quests_address_label")}: {spot.address}
                  {" · "}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${spot.name} ${spot.address} Bangkok`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("quests_map_link")}
                  </a>
                </small>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
