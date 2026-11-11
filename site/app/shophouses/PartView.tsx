import Link from "next/link";
import { ESSAY_META } from "../data/shophouse-essay";
import { PARTS, type Part } from "../data/shophouse-parts";
import { Figure } from "./figures";
import { FoldedFigure } from "./FoldedFigure";
import { Rail } from "./Rail";
import { withNotes } from "./footnotes";
import { ShMasthead, ShFooter } from "./chrome";
import { slugify } from "../data/shophouse-parts";
import type { Block } from "../data/shophouse-essay";

type Section = { slug: string; heading: string | null; blocks: Block[] };

function toSections(blocks: Block[]): Section[] {
  const out: Section[] = [{ slug: "", heading: null, blocks: [] }];
  for (const b of blocks) {
    if (b.kind === "h2") out.push({ slug: slugify(b.text), heading: b.text, blocks: [] });
    else out[out.length - 1].blocks.push(b);
  }
  return out.filter((s) => s.blocks.length || s.heading);
}

export function PartView({ part }: { part: Part }) {
  const prev = PARTS[part.n - 2];
  const next = PARTS[part.n];
  const sections = toSections(part.blocks);
  return (
    <div className="shophouse-essay">
      <ShMasthead />
      <header className="sh-part-head">
        <p className="sh-eyebrow">
          <Link href="/shophouses#essay">{ESSAY_META.title}</Link> · Part {part.n} of {PARTS.length} · {part.minutes} min
        </p>
        <h1>{part.title}</h1>
      </header>

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
                        <FoldedFigure id={block.id}>
                          <Figure id={block.id} />
                        </FoldedFigure>
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

      {part.notes.length > 0 && (
        <section className="sh-sections sh-notes-wrap">
          <div className="sh-notes">
            <h2 id="notes">Notes</h2>
            <ol>
              {part.notes.map((f) => (
                <li key={f.n} id={`note-${f.n}`} value={f.n}>
                  {f.text} <a href={`#ref-${f.n}`} aria-label={`Back to note ${f.n}`}>↩</a>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <nav className="sh-part-nav" aria-label="Parts">
        {prev ? (
          <Link href={`/shophouses/read/${prev.n}`} rel="prev">
            ← {prev.n}. {prev.title}
          </Link>
        ) : (
          <Link href="/shophouses#essay">← Contents</Link>
        )}
        {next ? (
          <Link href={`/shophouses/read/${next.n}`} rel="next" className="is-next">
            {next.n}. {next.title} →
          </Link>
        ) : (
          <Link href="/shophouses#atlas" className="is-next">
            The pressure map →
          </Link>
        )}
      </nav>
      <ShFooter />
    </div>
  );
}
