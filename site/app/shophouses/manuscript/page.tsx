import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { SHORT, SHORT_META, SHORT_FOOTNOTES } from "../../data/shophouse-essay-short";
import { STUDIO } from "../../data/shophouse-studio";

// The book version. Set to the SHORT text — the length a printed studio-book
// chapter can actually carry — rather than the full site essay, which runs
// to twice this and belongs on the web where a reader can stop when they
// want to. Photos are placed inline as real images an editor can see, with
// the source file named underneath so it can be pulled straight into layout.

export const metadata: Metadata = {
  title: "Manuscript · Shophouse Metropolis",
  description:
    "Print manuscript of the essay for the Shophouse Metropolis studio book — continuous prose, placed photographs, word count.",
  alternates: { canonical: "/shophouses/manuscript" },
  robots: { index: false },
};

// Placed after the h2 whose text matches. One photo per section at most —
// the point is to break up the page, not to compete with the prose.
const PHOTO_AFTER: Record<string, { file: string; caption: string; credit: string }> = {
  "The arithmetic that eats a street": {
    file: "/shophouses/photos/shophouses-on-chareon-krung-road.jpg",
    caption: "Charoen Krung — cut in 1862, lined with the rows this essay is about.",
    credit: "Author's photograph",
  },
  "The elephant": {
    file: "/shophouses/photos/yaowaraj-and-its-worldclass-shophouses.jpg",
    caption: "Yaowarat: still working, never curated, never given a heritage listing.",
    credit: "Author's photograph",
  },
  "The smart city we already have": {
    file: "/shophouses/photos/micro-mobility-in-bangkok.jpg",
    caption: "Micro-mobility in Bangkok — the network nobody designed and everybody uses.",
    credit: "Author's photograph",
  },
  "What the students found": {
    file: "/shophouses/photos/streetfood-scenes-on-the-first-floor-of-the-shophouse.jpg",
    caption: "Street food on the ground floor a shophouse was built to carry.",
    credit: "Author's photograph",
  },
  "What I still walk to": {
    file: "/shophouses/photos/chao-phaya-river.jpg",
    caption: "The river the old town still faces.",
    credit: "Author's photograph",
  },
};

const OPENING_PHOTO = {
  file: "/shophouses/photos/non-1982-shophouse.jpg",
  caption:
    "The author with his father, 1982, on the timber floor of the family shophouse in the old town.",
  credit: "Author's family photograph",
};

export default function ManuscriptPage() {
  const words = SHORT.reduce(
    (n, b) => (b.kind === "p" || b.kind === "pull" ? n + b.text.replace(/\[\[\d+\]\]/g, "").split(/\s+/).length : n),
    0,
  );
  const photoCount = 1 + Object.keys(PHOTO_AFTER).length;

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
        <h1>{SHORT_META.title}</h1>
        <p className="sh-subtitle">{SHORT_META.subtitle}</p>
        <dl className="sh-ms-meta">
          <div>
            <dt>Author</dt>
            <dd>{SHORT_META.byline}</dd>
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
            <dt>Photographs</dt>
            <dd>{photoCount}</dd>
          </div>
          <div>
            <dt>Revised</dt>
            <dd>{SHORT_META.updated}</dd>
          </div>
        </dl>
        <p className="sh-note">
          Book-length text — the version cut for a printed chapter, not the full site essay. Photos
          are placed at print resolution with their source filename underneath; the interactive
          figures (carbon model, corridor screen, tenure schema) stay on{" "}
          <Link href="/shophouses">the essay page</Link> and export as static images at whatever
          size the layout needs. A Thai abstract follows the text.
        </p>
      </div>

      <div className="sh-ms-body">
        <figure className="sh-ms-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={OPENING_PHOTO.file} alt={OPENING_PHOTO.caption} />
          <figcaption>
            {OPENING_PHOTO.caption} <em>{OPENING_PHOTO.credit}.</em>
            <span className="sh-ms-photo-file">{OPENING_PHOTO.file}</span>
          </figcaption>
        </figure>

        {SHORT.map((block, i) => {
          switch (block.kind) {
            case "h2": {
              const photo = PHOTO_AFTER[block.text];
              return (
                <Fragment key={i}>
                  <h2>{block.text}</h2>
                  {photo && (
                    <figure className="sh-ms-photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.file} alt={photo.caption} />
                      <figcaption>
                        {photo.caption} <em>{photo.credit}.</em>
                        <span className="sh-ms-photo-file">{photo.file}</span>
                      </figcaption>
                    </figure>
                  )}
                </Fragment>
              );
            }
            case "p":
              return <p key={i}>{block.text}</p>;
            case "pull":
              return (
                <p key={i} className="sh-ms-pull">
                  [PULL QUOTE] {block.text}
                </p>
              );
            default:
              return null;
          }
        })}

        <h2>Notes</h2>
        <ol className="sh-ms-notes">
          {SHORT_FOOTNOTES.map((f) => (
            <li key={f.n} value={f.n}>
              {f.text}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
