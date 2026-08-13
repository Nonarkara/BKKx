"use client";

import { useState } from "react";
import { useLocale } from "../i18n/LocaleContext";
import { OLDTOWN_SPOTS, OLDTOWN_KIND_LABEL, type OldtownSpot } from "../data/oldtown-spots";

// A compact card strip for the front-door left column. Each card carries
// the existing quarter photo (CC-licensed Wikimedia Commons, served from
// /heritage/photos/) plus a MITF-style note in Dr Non's voice. Clicking
// a card posts a fly-to command to the embedded atlas iframe so the map
// drops onto the spot — no full-page navigation.
//
// Schema (see oldtown-spots.ts): each spot has period, evidence tier
// (registered | published inventory | mapped corridor), typology, and
// a "fabric" polyline. We surface the explorerTip + evidence + units in
// the card meta so the user knows what kind of place they're about to fly
// the map to.

type Props = {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
};

export function OldTownPicks({ iframeRef }: Props) {
  const { t, locale } = useLocale();
  const th = locale === "th";
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  function flyTo(spot: OldtownSpot) {
    setActiveSlug(spot.slug);
    const iframe = iframeRef.current;
    if (!iframe) return;
    const [lng, lat] = spot.center;
    const url = `/atlas/historic-core?embed=1&at=${lng},${lat},${spot.zoom}&poi=${spot.slug}`;
    // Use src + replace so the user can hit Back without re-firing the fly-to.
    iframe.src = url;
  }

  return (
    <section className="atlas-shell-oldtown" aria-label="Bangkok rowhouse atlas">
      <p className="register-eyebrow">BKKx · Bangkok rowhouse atlas</p>
      <h2 className="register-section-title atlas-shell-oldtown-title">Bangkok rowhouse atlas</h2>
      <p className="atlas-shell-oldtown-lede">
        {th
          ? "แผนที่วัฒนธรรมของผืนผ้าตึกแถวกรุงเทพฯ — คัดสรรโดยมือ ทุกจุดมีที่มา"
          : "A sourced cultural map of Bangkok's continuous shophouse fabric — 29 hand-curated clusters with typology, evidence status and explorer notes."}
      </p>
      <ol className="atlas-shell-oldtown-cards">
        {OLDTOWN_SPOTS.map((spot) => {
          const isActive = spot.slug === activeSlug;
          const note = th ? spot.noteTh : spot.note;
          const callout = th ? spot.calloutTh : spot.callout;
          const kind = OLDTOWN_KIND_LABEL[spot.kind];
          return (
            <li key={spot.slug}>
              <button
                type="button"
                className={isActive ? "is-active" : ""}
                onClick={() => flyTo(spot)}
                aria-pressed={isActive}
              >
                {spot.photo ? (
                  <span
                    className="atlas-shell-oldtown-photo"
                    aria-hidden="true"
                    style={{ backgroundImage: `url(/heritage/photos/${spot.photo}.jpg)` }}
                  />
                ) : (
                  <span className="atlas-shell-oldtown-photo atlas-shell-oldtown-photo-empty" aria-hidden="true">
                    {kind.icon}
                  </span>
                )}
                <span className="atlas-shell-oldtown-body">
                  <span className="atlas-shell-oldtown-name">
                    {spot.name}
                    <small lang="th"> {spot.thai}</small>
                  </span>
                  <span className="atlas-shell-oldtown-callout">
                    <em>{t("oldtown_callout_label")}</em> — {callout}
                  </span>
                  <span className="atlas-shell-oldtown-note">{note}</span>
                  <span className="atlas-shell-oldtown-kind">
                    {kind.icon} {th ? kind.th : kind.en}
                    {spot.units ? <> · <span lang="en">{spot.units} units</span></> : null}
                    {spot.period ? <> · <span lang="en">{spot.period}</span></> : null}
                    {" · "}
                    <a
                      href={spot.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {spot.source}
                    </a>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
