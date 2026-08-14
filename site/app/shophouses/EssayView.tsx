"use client";

import Link from "next/link";
import { useState } from "react";
import { ESSAY, ESSAY_META } from "../data/shophouse-essay";
import { STUDIO } from "../data/shophouse-studio";
import { Figure } from "./figures";

export function EssayView() {
  const [showAbstract, setShowAbstract] = useState(false);

  // Section headings, for the running contents rail.
  const headings = ESSAY.flatMap((b) => (b.kind === "h2" ? [b.text] : []));

  return (
    <div className="shophouse-essay">
      <header className="sh-masthead">
        <Link href="/shophouses" className="sh-wordmark">
          Shophouse<em>Metropolis</em>
        </Link>
        <nav aria-label="Essay">
          <a href="#essay">Essay</a>
          <a href="#figures-corridor">The corridor</a>
          <Link href="/shophouses/manuscript">Manuscript</Link>
          <a href="https://bkk.nonarkara.org" target="_blank" rel="noreferrer">
            BKKx
          </a>
        </nav>
      </header>

      <article className="sh-lede" id="essay">
        <p className="sh-eyebrow">{STUDIO.institution} · {STUDIO.sponsor}</p>
        <h1>{ESSAY_META.title}</h1>
        <p className="sh-subtitle">{ESSAY_META.subtitle}</p>
        <p className="sh-byline">
          {ESSAY_META.byline} — {ESSAY_META.context}
        </p>

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

      <div className="sh-body">
        <aside className="sh-contents" aria-label="Contents">
          <p className="sh-eyebrow">Contents</p>
          <ol>
            {headings.map((h) => (
              <li key={h}>
                <a href={`#${slug(h)}`}>{h}</a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="sh-prose">
          {ESSAY.map((block, i) => {
            switch (block.kind) {
              case "h2":
                return (
                  <h2 key={i} id={slug(block.text)}>
                    {block.text}
                  </h2>
                );
              case "p":
                return <p key={i}>{block.text}</p>;
              case "pull":
                return (
                  <blockquote key={i} className="sh-pull">
                    {block.text}
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
      </div>

      <footer className="sh-footer">
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

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
