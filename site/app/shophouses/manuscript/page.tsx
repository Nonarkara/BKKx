import type { Metadata } from "next";
import Link from "next/link";
import { ESSAY, ESSAY_META } from "../../data/shophouse-essay";
import { STUDIO } from "../../data/shophouse-studio";

// The book version. Same source as /shophouses, rendered as continuous prose
// with the figures reduced to numbered placeholders an editor can place —
// a print page cannot carry an interactive carbon model, and pretending
// otherwise makes the manuscript useless to whoever lays out the book.

export const metadata: Metadata = {
  title: "Manuscript · Shophouse Metropolis",
  description:
    "Print manuscript of the essay for the Shophouse Metropolis studio book — continuous prose, figure placeholders, word count.",
  alternates: { canonical: "/shophouses/manuscript" },
  robots: { index: false },
};

const FIGURE_TITLES: Record<string, string> = {
  stock: "Bangkok's shophouse stock, 1970s peak against today",
  "sukhumvit-pattern": "Four Sukhumvit cross-roads and what replaced their shophouses",
  carbon: "Demolish-and-rebuild against retrofit, per shophouse unit",
  corridor: "The Sukhumvit 71 corridor, screened for shophouse morphology",
  projects: "Five studio projects and the systems they legitimise",
  tenure: "The tenure schema, with every commercial field empty",
};

export default function ManuscriptPage() {
  const words = ESSAY.reduce(
    (n, b) => (b.kind === "p" || b.kind === "pull" ? n + b.text.split(/\s+/).length : n),
    0,
  );
  // Figure numbers resolved up front — counting during render mutates across
  // renders and the linter is right to refuse it.
  const figureNumber = new Map<number, number>();
  ESSAY.forEach((b, i) => {
    if (b.kind === "figure") figureNumber.set(i, figureNumber.size + 1);
  });

  return (
    <div className="shophouse-essay sh-manuscript">
      <header className="sh-masthead">
        <Link href="/shophouses" className="sh-wordmark">
          Shophouse<em>Metropolis</em>
        </Link>
        <nav aria-label="Manuscript">
          <Link href="/shophouses">Back to the essay</Link>
        </nav>
      </header>

      <div className="sh-ms-head">
        <p className="sh-eyebrow">Manuscript for typesetting</p>
        <h1>{ESSAY_META.title}</h1>
        <p className="sh-subtitle">{ESSAY_META.subtitle}</p>
        <dl className="sh-ms-meta">
          <div>
            <dt>Author</dt>
            <dd>{ESSAY_META.byline}</dd>
          </div>
          <div>
            <dt>For</dt>
            <dd>{STUDIO.name}, {STUDIO.institution}</dd>
          </div>
          <div>
            <dt>Body words</dt>
            <dd>≈ {words.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Figures</dt>
            <dd>{ESSAY.filter((b) => b.kind === "figure").length}</dd>
          </div>
          <div>
            <dt>Revised</dt>
            <dd>{ESSAY_META.updated}</dd>
          </div>
        </dl>
        <p className="sh-note">
          Continuous prose for print. Figures appear as numbered placeholders with their captions —
          the live versions are on{" "}
          <Link href="/shophouses">the essay page</Link>, and each one can be exported as a static
          image at the size the layout needs. A Thai abstract follows the text.
        </p>
      </div>

      <div className="sh-ms-body">
        {ESSAY.map((block, i) => {
          switch (block.kind) {
            case "h2":
              return <h2 key={i}>{block.text}</h2>;
            case "p":
              return <p key={i}>{block.text}</p>;
            case "pull":
              return (
                <p key={i} className="sh-ms-pull">
                  [PULL QUOTE] {block.text}
                </p>
              );
            case "note":
              return <p key={i}>{block.text}</p>;
            case "figure": {
              return (
                <p key={i} className="sh-ms-figure">
                  [FIGURE {figureNumber.get(i)} — {FIGURE_TITLES[block.id] ?? block.id}]
                  <br />
                  <span>Caption: {block.caption}</span>
                </p>
              );
            }
            default:
              return null;
          }
        })}

        <h2>บทคัดย่อ</h2>
        <p lang="th">{ESSAY_META.abstractTh}</p>
      </div>
    </div>
  );
}
