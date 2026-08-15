import type { Metadata } from "next";
import { SHORT, SHORT_META, SHORT_FOOTNOTES } from "../../data/shophouse-essay-short";
import { withNotes, stripNotes } from "../footnotes";

// The PDF source. Rendered by headless Chrome at A4 via
// scripts/build-shophouse-pdf.sh — so this page is typeset for paper, not
// for a browser window: no navigation, no interaction, no dark ground, and
// nothing that depends on colour to be legible in greyscale.

export const metadata: Metadata = {
  title: `${SHORT_META.title} — print`,
  robots: { index: false },
  alternates: { canonical: "/shophouses/print" },
};

export default function PrintPage() {
  const words = SHORT.reduce(
    (n, b) => (b.kind === "p" ? n + stripNotes(b.text).split(/\s+/).length : n),
    0,
  );

  return (
    <div className="shophouse-essay sh-print">
      <header className="sh-print-cover">
        <p className="sh-print-series">Shophouse Metropolis</p>
        <h1>{SHORT_META.title}</h1>
        <p className="sh-print-sub">{SHORT_META.subtitle}</p>
        <p className="sh-print-by">{SHORT_META.byline}</p>
        <p className="sh-print-context">{SHORT_META.context}</p>
        <p className="sh-print-dedication">{SHORT_META.dedication}</p>
        <p className="sh-print-note">{SHORT_META.note}</p>
        <p className="sh-print-meta">
          ≈{words.toLocaleString()} words · revised {SHORT_META.updated}
        </p>
      </header>

      <div className="sh-print-body">
        {SHORT.map((b, i) => {
          switch (b.kind) {
            case "h2":
              return <h2 key={i}>{b.text}</h2>;
            case "figure":
              return (
                <p key={i} className="sh-print-figure">
                  [FIGURE — {b.id}] {b.caption}
                </p>
              );
            default:
              return <p key={i}>{withNotes(b.text)}</p>;
          }
        })}
        <div className="sh-notes">
          <h2 id="notes">Notes</h2>
          <ol>
            {SHORT_FOOTNOTES.map((f) => (
              <li key={f.n} id={`note-${f.n}`} value={f.n}>
                {f.text}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
