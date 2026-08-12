"use client";

import { useState } from "react";
import { useLocale } from "../i18n/LocaleContext";
import {
  OLDTOWN_SPOTS,
  OLDTOWN_EVIDENCE_LABEL,
  OLDTOWN_KIND_LABEL,
  type OldtownSpot,
} from "../data/oldtown-spots";

// A compact 5-card strip for the front-door left column. Each card carries
// the existing quarter photo (CC-licensed Wikimedia Commons, served from
// /heritage/photos/) plus a MITF-style note in Dr Non's voice. Clicking
// a card posts a fly-to command to the embedded atlas iframe so the map
// drops onto the spot — no full-page navigation.

type Props = {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
};

export function OldTownPicks({ iframeRef }: Props) {
  const { locale } = useLocale();
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
      <div className="atlas-shell-oldtown-heading">
        <div>
          <p className="register-eyebrow">BKKx field atlas · v1</p>
          <h2 className="register-section-title atlas-shell-oldtown-title">
            {th ? "แผนที่ตึกแถวกรุงเทพฯ" : "Bangkok rowhouse atlas"}
          </h2>
        </div>
        <strong>{OLDTOWN_SPOTS.length}</strong>
      </div>
      <p className="atlas-shell-oldtown-lede">
        {th
          ? "กลุ่มตึกแถวที่มีหลักฐาน ตั้งแต่แนวหน้าวังถึงตลาดริมคลอง กดเพื่อพาแผนที่ไปยังเนื้อเมืองจริง"
          : "Documented clusters from palace frontages to canal markets. Pick one to read the city fabric in 3D."}
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
                <span
                  className="atlas-shell-oldtown-photo"
                  aria-hidden="true"
                  style={{ backgroundImage: `url(/heritage/photos/${spot.photo}.jpg)` }}
                />
                <span className="atlas-shell-oldtown-body">
                  <span className="atlas-shell-oldtown-name">
                    {spot.name}
                    <small lang="th"> {spot.thai}</small>
                  </span>
                  <span className="atlas-shell-oldtown-callout">
                    {callout}
                  </span>
                  <span className="atlas-shell-oldtown-note">{note}</span>
                  <span className="atlas-shell-oldtown-kind">
                    {kind.icon} {th ? kind.th : kind.en} · {spot.period}
                  </span>
                  <span className={`atlas-shell-oldtown-evidence evidence-${spot.evidence.replaceAll(" ", "-")}`}>
                    {OLDTOWN_EVIDENCE_LABEL[spot.evidence]}
                    {spot.units ? ` · ${spot.units} units` : ""}
                  </span>
                  <span className="atlas-shell-oldtown-source">
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
