"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ESSAY_META } from "../data/shophouse-essay";
import { STUDIO } from "../data/shophouse-studio";
import { PARTS, slugify } from "../data/shophouse-parts";
import { ShMasthead, ShFooter } from "./chrome";

// The essay itself lives in five parts at /shophouses/read/N; this page is the
// front door: lede, contents with reading times, the pressure map, the brief.

import { PressureMap } from "./PressureMap";
import { PRESSURE_DISTRICTS, QUADRANTS, PRESSURE_TOTAL } from "../data/shophouse-pressure";
import { CLUSTERS, SIGNATURE } from "../data/shophouse-gazetteer";

// Old links were /shophouses#section-slug and #note-N; send them to the part that holds them.
function legacyTarget(hash: string): string | null {
  const id = hash.replace(/^#/, "");
  for (const p of PARTS) {
    if (p.headings.some((h) => slugify(h) === id)) return `/shophouses/read/${p.n}#${id}`;
    const m = /^(?:note|ref)-(\d+)$/.exec(id);
    if (m && p.notes.some((f) => f.n === Number(m[1]))) return `/shophouses/read/${p.n}#${id}`;
  }
  return null;
}

export function EssayView() {
  const [showAbstract, setShowAbstract] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const t = legacyTarget(window.location.hash);
    if (t) router.replace(t);
  }, [router]);

  return (
    <div className="shophouse-essay">
      <ShMasthead />

      <article className="sh-lede sh-lede-split" id="essay">
        <div className="sh-lede-main">
        <p className="sh-eyebrow">
          {STUDIO.institution} · {STUDIO.sponsor}
        </p>
        <h1>{ESSAY_META.title}</h1>
        <p className="sh-subtitle">{ESSAY_META.subtitle}</p>
        <p className="sh-byline">
          {ESSAY_META.byline} — {ESSAY_META.context}
        </p>
        </div>
        <div className="sh-lede-aside">
        <p className="sh-companion">
          <strong>This is the companion, not the chapter.</strong> The essay is published as a
          printed chapter in <em>Shophouse Metropolis</em> (Harvard University Graduate School of
          Design). Read it below in five parts, each with its own notes, or start with the map and the
          ten-minute argument further down this page.
        </p>
        <p className="sh-dedication-line">{ESSAY_META.dedication}</p>

        <button
          type="button"
          className="sh-abstract-toggle"
          onClick={() => setShowAbstract((v) => !v)}
          aria-expanded={showAbstract}
        >
          {showAbstract ? "ซ่อนบทคัดย่อ" : "อ่านบทคัดย่อภาษาไทย"}
        </button>
        {showAbstract && (
          <p className="sh-abstract" lang="th">
            {ESSAY_META.abstractTh}
          </p>
        )}
        </div>
      </article>

      <nav className="sh-parts" aria-label="Contents" id="contents">
        <ol>
          {PARTS.map((p) => (
            <li key={p.n}>
              <Link href={`/shophouses/read/${p.n}`}>
                <span className="sh-part-n">{p.n}</span>
                <strong>{p.title}</strong>
                <span className="sh-part-dek">{p.dek}</span>
                <small>{p.minutes} min</small>
              </Link>
            </li>
          ))}
          <li>
            <a href="#atlas" className="is-atlas">
              <span className="sh-part-n">▲</span>
              <strong>The pressure map</strong>
              <span className="sh-part-dek">Every candidate footprint, laid over the Treasury appraisal.</span>
              <small>on this page</small>
            </a>
          </li>
        </ol>
      </nav>

        <section className="sh-atlas" id="atlas">
        <div className="sh-atlas-head">
          <p className="sh-eyebrow">The map this argument needed</p>
          <h2>Where they are, and what the ground beneath them is worth</h2>
          <p>
            Every candidate shophouse the screen could find in Bangkok — {PRESSURE_TOTAL.toLocaleString()}{" "}
            of them — laid over the Treasury appraisal that decides each one&apos;s fate. Two
            questions per building: is the ground under it worth more than the median, and is the
            plot shallow enough that a compliant rebuild would lose a serious share of its
            footprint to the setback?
          </p>
          <p>
            The four answers are the four colours. One of them is the whole essay.
          </p>
          <p className="sh-fig-note">
            The map has an address of its own for citation and email:{" "}
            <Link href="/shophouses/atlas">/shophouses/atlas</Link> — with the
            full per-district table the embed leaves out.
          </p>
        </div>
        <PressureMap />
        <ol className="sh-quadrants">
          {QUADRANTS.map((q) => (
            <li key={q.id}>
              <span className="sh-swatch" style={{ background: q.colour }} aria-hidden="true" />
              <div>
                <p className="sh-quadrant-label">
                  {q.label} <small>{q.count.toLocaleString()} footprints</small>
                </p>
                <p className="sh-quadrant-what">{q.what}</p>
                <p>{q.why}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="sh-brief" aria-labelledby="sh-brief-title">
        <div className="sh-brief-copy">
          <p className="sh-eyebrow">The ten-minute version</p>
          <h2 id="sh-brief-title">Bangkok has not run out of shophouses. It has run out of excuses for not counting them.</h2>
          <p>
            The map does not prove that every narrow building is historic. It proves something
            harder to dismiss: the city can find the places worth checking, name the pressure on
            them, and talk to an owner before demolition becomes the only conversation left.
          </p>
        </div>
        <dl className="sh-brief-numbers">
          <div><dt>On the record</dt><dd>{CLUSTERS.length}<small>documented clusters</small></dd></div>
          <div><dt>Visible to the screen</dt><dd>{PRESSURE_TOTAL.toLocaleString()}<small>candidate footprints</small></dd></div>
          <div><dt>Talk to the owner</dt><dd>{QUADRANTS[0].count}<small>shallow plots on valuable ground</small></dd></div>
          <div><dt>The ordinary module</dt><dd>{SIGNATURE.frontage.p50} × {SIGNATURE.depth.p50} m<small>median frontage × depth</small></dd></div>
        </dl>
        <p className="sh-brief-verdict">
          <strong>{PRESSURE_DISTRICTS[0].tellTheOwner + PRESSURE_DISTRICTS[1].tellTheOwner} of {QUADRANTS[0].count}</strong>{" "}
          buildings in the most self-defeating demolition quadrant sit in Phra Nakhon and
          Samphanthawong. The old city is where an owner conversation can do the most work first.
        </p>
        <div className="sh-brief-actions">
          <a href="https://bkk.nonarkara.org/rowhouses" target="_blank" rel="noreferrer">Open Bangkok&apos;s rowhouse register ↗</a>
          <Link href="/shophouses/why">Why shophouses are good for cities →</Link>
          <Link href="/shophouses/bible">Use the field Bible →</Link>
        </div>
      </section>

      <ShFooter />
    </div>
  );
}
