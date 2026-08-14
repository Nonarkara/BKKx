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
          <Link href="/shophouses/bible">The Bible</Link>
          <Link href="/shophouses/research">Sources</Link>
          <Link href="/shophouses/manuscript">Manuscript</Link>
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
