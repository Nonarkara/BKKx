"use client";

import { useState } from "react";
import { RAIL, DIAGRAM_NOTE, type RailItem } from "../data/shophouse-rail";
import { PROJECTS } from "../data/shophouse-studio";

// One rail block per essay section. On desktop it sits in the right-hand
// 40%; on a phone it falls inline after the section it belongs to. Either
// way each item reads on its own — nothing here says "left" or "above".

export function Rail({ section }: { section: string }) {
  const items = RAIL[section];
  if (!items?.length) return null;
  return (
    <aside className="sh-rail" aria-label="Alongside this section">
      {items.map((item, i) => (
        <RailCard key={i} item={item} />
      ))}
    </aside>
  );
}

function RailCard({ item }: { item: RailItem }) {
  switch (item.kind) {
    case "photo":
      return (
        <figure className="sh-rail-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.file} alt={item.caption} loading="lazy" />
          <figcaption>
            {item.caption}
            {item.credit ? <em> {item.credit}.</em> : null}
          </figcaption>
        </figure>
      );
    case "diagram":
      return <DiagramCard file={item.file} title={item.title} caption={item.caption} />;
    case "fact":
      return (
        <div className="sh-rail-fact">
          <p>{item.text}</p>
          <small>{item.source}</small>
        </div>
      );
    case "project":
      return <ProjectCard slug={item.slug} />;
    default:
      return null;
  }
}

function DiagramCard({ file, title, caption }: { file: string; title: string; caption: string }) {
  const [open, setOpen] = useState(false);
  return (
    <figure className="sh-rail-diagram">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file} alt={title} loading="lazy" />
        <span className="sh-rail-zoom">{open ? "Close" : "Enlarge"}</span>
      </button>
      <figcaption>
        <strong>{title}</strong> {caption}
        <em className="sh-rail-generated">Generated illustration — see note.</em>
      </figcaption>
      {open && (
        <div className="sh-lightbox" role="dialog" aria-label={title} onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file} alt={title} />
          <p>{DIAGRAM_NOTE}</p>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      )}
    </figure>
  );
}

function ProjectCard({ slug }: { slug: string }) {
  const p = PROJECTS.find((x) => x.slug === slug);
  const [open, setOpen] = useState(false);
  if (!p) return null;
  return (
    <article className={`sh-rail-project${open ? " is-open" : ""}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="sh-rail-project-system">{p.systemShort}</span>
        <span className="sh-rail-project-title">{p.title}</span>
        <span className="sh-rail-project-student">{p.student}</span>
      </button>
      {open && (
        <div className="sh-rail-project-body">
          <p>{p.move}</p>
          <p className="sh-rail-project-precedent">
            <strong>From home:</strong> {p.homePrecedent}
          </p>
          {p.figures.map((f) => (
            <p key={f.label} className="sh-rail-project-figure">
              {f.label} — {f.value}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}
