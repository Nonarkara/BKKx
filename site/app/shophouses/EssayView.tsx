"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ESSAY, ESSAY_META, FOOTNOTES, type Block } from "../data/shophouse-essay";
import { STUDIO } from "../data/shophouse-studio";
import { SUPPORT } from "../data/shophouse-rail";
import { Figure } from "./figures";
import { Rail } from "./Rail";
import { withNotes } from "./footnotes";

// The essay is grouped into sections so each one can carry its own side
// rail. On a wide screen: argument in the left 60%, evidence in the right
// 40%, both scrolling together. On a phone the rail falls in after the
// section's prose — the essay still reads top to bottom either way.

import { PressureMap } from "./PressureMap";
import { PRESSURE_DISTRICTS, QUADRANTS, PRESSURE_TOTAL } from "../data/shophouse-pressure";
import { CLUSTERS, SIGNATURE } from "../data/shophouse-gazetteer";

type Section = { slug: string; heading: string | null; blocks: Block[] };

function toSections(blocks: Block[]): Section[] {
  const out: Section[] = [{ slug: "", heading: null, blocks: [] }];
  for (const b of blocks) {
    if (b.kind === "h2") {
      out.push({ slug: slugify(b.text), heading: b.text, blocks: [] });
    } else {
      out[out.length - 1].blocks.push(b);
    }
  }
  return out.filter((s) => s.blocks.length || s.heading);
}

export function EssayView() {
  const [showAbstract, setShowAbstract] = useState(false);
  const sections = useMemo(() => toSections(ESSAY), []);
  const headings = sections.filter((s) => s.heading).map((s) => s.heading!);

  return (
    <div className="shophouse-essay">
      <header className="sh-masthead">
        <Link href="/shophouses" className="sh-wordmark">
          Shophouse<em>Metropolis</em>
        </Link>
        <nav aria-label="Essay">
          <a href="#essay">Essay</a>
          <a href="#research">Long read</a>
          <Link href="/shophouses/bible">The Bible</Link>
          <Link href="/shophouses/global">Global</Link>
          <Link href="/shophouses/research">Sources</Link>
          <a href="https://bkk.nonarkara.org" target="_blank" rel="noreferrer">
            BKKx
          </a>
        </nav>
      </header>

      <article className="sh-lede" id="essay">
        <p className="sh-eyebrow">
          {STUDIO.institution} · {STUDIO.sponsor}
        </p>
        <h1>{ESSAY_META.title}</h1>
        <p className="sh-subtitle">{ESSAY_META.subtitle}</p>
        <p className="sh-byline">
          {ESSAY_META.byline} — {ESSAY_META.context}
        </p>
        <p className="sh-companion">
          <strong>This is the companion, not the chapter.</strong> The essay is published as a
          printed chapter in <em>Shophouse Metropolis</em> (Harvard University Graduate School of
          Design). Here you can read the map and the ten-minute argument first, then open the long
          version only when you need the survey, sourced models, anatomy and full bibliography.
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
      </article>

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
          <Link href="/shophouses/bible">Use the field Bible →</Link>
        </div>
      </section>

      <details className="sh-research-companion" id="research">
        <summary>
          <span>Full research companion</span>
          <strong>The argument, measured drawings, studio evidence and {FOOTNOTES.length} notes</strong>
          <small>Open the long read ↓</small>
        </summary>
        <nav className="sh-contents-strip" aria-label="Contents">
        <ol>
          {headings.map((h) => (
            <li key={h}>
              <a href={`#${slugify(h)}`}>{h}</a>
            </li>
          ))}
        </ol>
        </nav>

        <div className="sh-sections">
        {sections.map((s) => (
          <section className="sh-section" key={s.slug || "opening"} id={s.slug || undefined}>
            <div className="sh-section-prose">
              {s.heading && <h2>{s.heading}</h2>}
              {s.blocks.map((block, i) => {
                switch (block.kind) {
                  case "p":
                    return <p key={i}>{withNotes(block.text)}</p>;
                  case "pull":
                    return (
                      <blockquote key={i} className="sh-pull">
                        {withNotes(block.text)}
                      </blockquote>
                    );
                  case "note":
                    return (
                      <p key={i} className="sh-note">
                        {block.text}
                      </p>
                    );
                  case "figure":
                    return (
                      <figure key={i} className="sh-figure" id={`figures-${block.id}`}>
                        <Figure id={block.id} />
                        <figcaption>{block.caption}</figcaption>
                      </figure>
                    );
                  default:
                    return null;
                }
              })}
            </div>
            <Rail section={s.slug} />
          </section>
        ))}
        </div>

        <section className="sh-sections sh-notes-wrap">
        <div className="sh-notes">
          <h2 id="notes">Notes</h2>
          <ol>
            {FOOTNOTES.map((f) => (
              <li key={f.n} id={`note-${f.n}`} value={f.n}>
                {f.text} <a href={`#ref-${f.n}`} aria-label={`Back to note ${f.n}`}>↩</a>
              </li>
            ))}
          </ol>
        </div>
        </section>
      </details>

      <footer className="sh-footer">
        <div className="sh-support">
          <p className="sh-eyebrow">Supported by</p>
          <p>{SUPPORT.intro}</p>
          <div className="sh-support-logos">
            {SUPPORT.logos.map((l) => (
              <a key={l.file} href={l.url} target="_blank" rel="noreferrer" title={l.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.file} alt={l.name} loading="lazy" />
              </a>
            ))}
          </div>
        </div>
        <p>
          <strong>{STUDIO.name}</strong> — {STUDIO.critic}, with {STUDIO.institution}. Chair:{" "}
          {STUDIO.chair}. Sponsor: {STUDIO.sponsor}. Site: {STUDIO.site}.
        </p>
        <p className="sh-note">{STUDIO.sourceNote}</p>
        <p>
          Sibling systems:{" "}
          <a href="https://bkk.nonarkara.org" target="_blank" rel="noreferrer">
            bkk.nonarkara.org
          </a>{" "}
          — the heritage register, nine quarters and the rowhouse atlas this corridor screen was
          built from ·{" "}
          <a href="https://atlas.nonarkara.org" target="_blank" rel="noreferrer">
            atlas.nonarkara.org
          </a>{" "}
          — Bangkok&apos;s operational digital twin.
        </p>
      </footer>
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
