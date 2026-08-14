import type { Metadata } from "next";
import Link from "next/link";
import { THESES } from "../../data/shophouse-theses";
import { DID_YOU_KNOW, READ_IN_FULL, FINDINGS, MAP_1907 } from "../../data/shophouse-research";

export const metadata: Metadata = {
  title: "The research already exists · Shophouse Metropolis",
  description:
    "Fifty-seven graduate theses on Bangkok shophouses and historic conservation districts, catalogued with working links — plus what four of them actually say.",
  alternates: { canonical: "/shophouses/research" },
  openGraph: {
    title: "The research already exists — 57 theses on the Bangkok shophouse",
    description:
      "Forty years of Thai graduate research on the shophouse, none of which reaches the room where a demolition is decided.",
    url: "/shophouses/research",
  },
};

const SECTION_TITLES: Record<string, string> = {
  A: "Directly about shophouses (ตึกแถว)",
  B: "Commercial buildings and old commercial areas",
  C: "Historic conservation areas and old-town districts",
  D: "Overseas universities",
  E: "Open-access papers and presentations",
};

export default function ResearchPage() {
  const sections = ["A", "B", "C", "D", "E"] as const;

  return (
    <div className="shophouse-essay">
      <header className="sh-masthead">
        <Link href="/shophouses" className="sh-wordmark">
          Shophouse<em>Metropolis</em>
        </Link>
        <nav aria-label="Research">
          <Link href="/shophouses">The essay</Link>
          <Link href="/shophouses/bible">The Bible</Link>
          <a href="#facts">Did you know</a>
          <a href="#bibliography">Bibliography</a>
        </nav>
      </header>

      <article className="sh-lede">
        <p className="sh-eyebrow">Sources</p>
        <h1>The research already exists</h1>
        <p className="sh-subtitle">
          Fifty-seven graduate theses on the Bangkok shophouse and its districts. Almost none of it
          reaches the room where a demolition is decided.
        </p>
        <p className="sh-byline">
          Compiled from Thai and overseas open repositories — Chulalongkorn (CUIR / DigiVerse),
          Thammasat, Silpakorn (SURE), KMUTT, NRCT, UCL Discovery, VTechWorks, MIT DSpace, Texas
          Tech, UTokyo and U Hawai&apos;i. Where only a landing page could be confirmed, it is
          labelled as such rather than as a direct file. Institutional access may be required.
        </p>
      </article>

      <div className="sh-body sh-research-page">
        <div className="sh-prose">
          <h2 id="read">Read in full for the essay</h2>
          <p>
            Four documents were read properly rather than cited from an abstract. Each one contained
            something that would otherwise have been a guess.
          </p>
          <ul className="sh-read-list">
            {READ_IN_FULL.map((r) => (
              <li key={r.title}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.title}
                </a>
                <small>
                  {r.author} · {r.degree}, {r.university}, {r.year} · <em>{r.read}</em>
                </small>
              </li>
            ))}
          </ul>

          <h2 id="findings">What they say</h2>
          <ol className="sh-findings is-static">
            {FINDINGS.map((f) => (
              <li key={f.id}>
                <p className="sh-finding-claim">{f.claim}</p>
                <p>{f.detail}</p>
                {f.caveat && <p className="sh-finding-caveat">Caveat — {f.caveat}</p>}
                <p className="sh-fig-note">
                  {f.url ? (
                    <a href={f.url} target="_blank" rel="noreferrer">
                      {f.source}
                    </a>
                  ) : (
                    f.source
                  )}
                </p>
              </li>
            ))}
          </ol>

          <h2 id="facts">Did you know</h2>
          <ul className="sh-facts">
            {DID_YOU_KNOW.map((d) => (
              <li key={d.fact}>
                <span>{d.fact}</span>
                <small>{d.source}</small>
              </li>
            ))}
          </ul>

          <h2 id="map1907">The map that makes it countable</h2>
          <p>{MAP_1907.what}</p>
          <p>{MAP_1907.compiledBy}</p>
          <p className="sh-finding-caveat">{MAP_1907.digitisedNote}</p>
          <p className="sh-fig-note">
            <a href={MAP_1907.url} target="_blank" rel="noreferrer">
              Repository record for the compilation study
            </a>
          </p>

          <h2 id="bibliography">The bibliography</h2>
          <p>
            {THESES.length} entries. Every link was the best available at the time of compiling;
            Chulalongkorn migrated CUIR to DigiVerse during this work, so some older direct-file
            links now resolve to a landing page or fail — the DOI is the durable identifier where
            one exists.
          </p>

          {sections.map((s) => {
            const items = THESES.filter((t) => t.section === s);
            if (!items.length) return null;
            return (
              <section key={s} className="sh-biblio-section">
                <h3>
                  {s}. {SECTION_TITLES[s]} <small>{items.length}</small>
                </h3>
                <ol className="sh-biblio">
                  {items.map((t) => (
                    <li key={t.n} value={t.n}>
                      <p className="sh-biblio-title">{t.titleEn}</p>
                      {t.titleTh && (
                        <p className="sh-biblio-th" lang="th">
                          {t.titleTh}
                        </p>
                      )}
                      <p className="sh-biblio-meta">
                        {[t.author, t.degree, t.university, t.year].filter(Boolean).join(" · ")}
                        {t.language ? ` · ${t.language}` : ""}
                      </p>
                      <p className="sh-biblio-links">
                        {t.doi && (
                          <a
                            href={`https://doi.org/${t.doi}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            DOI {t.doi}
                          </a>
                        )}
                        {t.links.map((l) => (
                          <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
                            {l.label}
                          </a>
                        ))}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      </div>

      <footer className="sh-footer">
        <p>
          Bibliography compiled by Non Arkara for <strong>Shophouse Metropolis</strong>, Harvard
          Graduate School of Design. Corrections and additions are welcome — a missing thesis is a
          worse outcome than a duplicated one.
        </p>
        <p>
          <Link href="/shophouses">← Back to the essay</Link>
        </p>
      </footer>
    </div>
  );
}
