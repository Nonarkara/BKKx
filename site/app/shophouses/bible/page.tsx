import type { Metadata } from "next";
import Link from "next/link";
import { ShophouseSection } from "./ShophouseSection";
import {
  DEDICATION,
  ELEMENTS,
  CONTROL_LEVELS,
  DIMENSIONS,
  REGULATION,
  STOCK_RECORD,
  CONSENSUS,
  CONFLICTS,
  CULTURE,
  OPEN_QUESTIONS,
} from "../../data/shophouse-bible";
import { THESES } from "../../data/shophouse-theses";
import { DimensionalSignature, QuickReference, Gazetteer } from "./BibleArtifacts";
import { CLUSTERS } from "../../data/shophouse-gazetteer";
import { PRESSURE_TOTAL } from "../../data/shophouse-pressure";

export const metadata: Metadata = {
  title: "The Shophouse Bible · Shophouse Metropolis",
  description:
    "A reference for the Bangkok shophouse — anatomy, measured dimensions, the legal cage, the stock record, and where the sources disagree. Assembled from 57 theses and papers so the next study does not start from nothing.",
  alternates: { canonical: "/shophouses/bible" },
  openGraph: {
    title: "The Shophouse Bible — anatomy, dimensions, regulation, sources",
    description:
      "Forty years of Thai research on the ตึกแถว, consolidated and cited. Including where the sources contradict each other.",
    url: "/shophouses/bible",
  },
};

export default function BiblePage() {
  return (
    <div className="shophouse-essay">
      <header className="sh-masthead">
        <Link href="/shophouses" className="sh-wordmark">
          Shophouse<em>Metropolis</em>
        </Link>
        <nav aria-label="Bible">
          <a href="#anatomy">Anatomy</a>
          <a href="#dimensions">Dimensions</a>
          <a href="#law">The law</a>
          <a href="#culture">Culture</a>
          <a href="#gazetteer">Gazetteer</a>
          <a href="#open">Open questions</a>
          <Link href="/shophouses/research">Sources</Link>
        </nav>
      </header>

      <article className="sh-lede">
        <p className="sh-eyebrow">Reference</p>
        <h1>The Shophouse Bible</h1>
        <p className="sh-subtitle">
          Anatomy, dimensions, the legal cage, the stock record — and where the sources disagree.
        </p>
        <p className="sh-byline">
          Assembled from {THESES.length} catalogued theses and papers, of which six were read in
          full. The problem this exists to solve: the research has been done, repeatedly, for forty
          years, and every new study re-derives the same measurements because the previous ones are
          unfindable. Where sources conflict, both numbers are shown — a reference that hides
          disagreement to look authoritative is worse than none, because the next person cites the
          tidy version and the error propagates.
        </p>
      </article>

      <div className="sh-body sh-research-page">
        <div className="sh-prose">
          <QuickReference />
          {/* ---- dedication ---- */}
          <section className="sh-dedication">
            <p className="sh-eyebrow">In memoriam</p>
            <h2>{DEDICATION.name}</h2>
            <p className="sh-dedication-th" lang="th">
              {DEDICATION.nameTh}
            </p>
            <p className="sh-dedication-affil">{DEDICATION.affiliation}</p>
            <p>{DEDICATION.text}</p>
            <p>{DEDICATION.why}</p>
            <p className="sh-fig-note">
              {DEDICATION.bio}{" "}
              <a href={DEDICATION.paper.url} target="_blank" rel="noreferrer">
                {DEDICATION.paper.title}
              </a>
              , {DEDICATION.paper.venue}.
            </p>
          </section>

          {/* ---- anatomy ---- */}
          <h2 id="anatomy">1 · Anatomy</h2>
          <p>
            Tirapas surveyed 100 shophouses across high- and mid-density Bangkok and, applying John
            Habraken&apos;s method of looking at type, resolved the building into eight spatial
            elements. Everything else in this document depends on them.
          </p>

          <ShophouseSection />

          <dl className="sh-elements">
            {ELEMENTS.map((e) => (
              <div key={e.code}>
                <dt>
                  <span className="sh-el-code">{e.code}</span> {e.name}
                </dt>
                <dd>
                  <p>{e.definition}</p>
                  <p className="sh-el-behaviour">{e.behaviour}</p>
                </dd>
              </div>
            ))}
          </dl>

          <h3>Levels of control</h3>
          <p>
            Habraken&apos;s hierarchy, as Tirapas applies it. What an occupant may change, and what
            changes them.
          </p>
          <ol className="sh-levels">
            {CONTROL_LEVELS.map((l) => (
              <li key={l.level}>
                <strong>{l.level}</strong>
                <span className="sh-level-parts">{l.parts}</span>
                <span className="sh-level-note">{l.note}</span>
              </li>
            ))}
          </ol>

          {/* ---- dimensions ---- */}
          <h2 id="dimensions">2 · The measured record</h2>
          <p>
            Start with what the type actually measures, because almost every study re-derives this
            and the numbers drift each time. The two distributions below are not a survey — they
            are every candidate footprint open data could find, measured the same way.
          </p>
          <DimensionalSignature />
          <p>
            The table that follows is the published record, source by source. Where a study
            disagrees with the measured distribution, that is worth more than either figure alone.
          </p>
          <p>
            Every dimension anyone has published, with its sample size. Note the disagreements —
            they are the most useful thing in the table. There is no single canonical shophouse
            dimension, and a thesis that states one without a sample is repeating somebody
            else&apos;s.
          </p>
          <div className="sh-tablewrap">
          <table className="sh-dim-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
                <th>Source &amp; sample</th>
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map((d) => (
                <tr key={d.metric + d.source}>
                  <td>{d.metric}</td>
                  <td className="sh-dim-value">{d.value}</td>
                  <td>
                    {d.source} ({d.year})
                    <small>{d.sample}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* ---- law ---- */}
          <h2 id="law">3 · The legal cage</h2>
          <p>
            The shophouse is the shape it is because the law says so. Each clause below is paired
            with what it produces in the building — including the two that between them decide
            whether adaptive reuse is possible at all.
          </p>
          <ol className="sh-rules">
            {REGULATION.map((r) => (
              <li key={r.clause}>
                <p className="sh-rule-clause">{r.clause}</p>
                <p className="sh-rule-rule">{r.rule}</p>
                <p className="sh-rule-consequence">{r.consequence}</p>
              </li>
            ))}
          </ol>

          {/* ---- stock ---- */}
          <h2 id="stock">4 · The stock record</h2>
          <div className="sh-tablewrap">
          <table className="sh-dim-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Figure</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {STOCK_RECORD.map((s) => (
                <tr key={s.year + s.figure}>
                  <td className="sh-stock-year">{s.year}</td>
                  <td>{s.figure}</td>
                  <td>
                    <small>{s.source}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* ---- consensus ---- */}
          <h2 id="culture">5 · The shophouse as an institution</h2>
          <p>
            The architecture literature and the anthropology literature have studied this building
            separately for forty years, which is one reason neither reaches a developer. What
            follows is the social and economic account, without which the dimensions above are
            just a box.
          </p>
          <ol className="sh-consensus">
            {CULTURE.map((c) => (
              <li key={c.id}>
                <p className="sh-consensus-claim">{c.title}</p>
                <p>{c.detail}</p>
                <p className="sh-fig-note">{c.source}</p>
              </li>
            ))}
          </ol>

          <h2 id="consensus">6 · What the sources agree on</h2>
          <p>
            Findings that recur across independent studies, by different methods. This is the
            load-bearing consensus — the part you can build policy on.
          </p>
          <ol className="sh-consensus">
            {CONSENSUS.map((c) => (
              <li key={c.finding}>
                <p className="sh-consensus-claim">{c.finding}</p>
                <p className="sh-consensus-who">{c.who}</p>
                <p>{c.detail}</p>
                {"fix" in c && c.fix && <p className="sh-consensus-fix">{c.fix}</p>}
              </li>
            ))}
          </ol>

          {/* ---- conflicts ---- */}
          <h2 id="conflicts">7 · What the sources disagree on</h2>
          <p>
            Stated rather than resolved. Anyone citing a single figure for these should know they
            are picking a side.
          </p>
          <ol className="sh-conflicts">
            {CONFLICTS.map((c) => (
              <li key={c.topic}>
                <p className="sh-conflict-topic">{c.topic}</p>
                <ul>
                  {c.positions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <p className="sh-conflict-verdict">{c.verdict}</p>
              </li>
            ))}
          </ol>

          <h2 id="open">8 · What nobody has answered</h2>
          <p>
            The point of a springboard is to name where it ends. These are the studies that would
            change something, and the reason this document exists rather than another literature
            review.
          </p>
          <ol className="sh-conflicts">
            {OPEN_QUESTIONS.map((o) => (
              <li key={o.q}>
                <p className="sh-conflict-topic">{o.q}</p>
                <p className="sh-conflict-verdict">{o.why}</p>
              </li>
            ))}
          </ol>

          <h2 id="gazetteer">9 · The gazetteer</h2>
          <p>
            Twenty-nine rows and quarters that somebody has actually documented, grouped by what
            kind of place they are. The evidence tier on each is the important column: whether a
            cluster is <em>registered</em>, merely <em>counted</em>, or only <em>mapped</em> is the
            difference between a building that is protected and one that is simply known about.
          </p>
          <p>
            Set that against the {PRESSURE_TOTAL.toLocaleString()} candidates on{" "}
            <a href="/shophouses#atlas">the pressure map</a>: {CLUSTERS.length} documented clusters
            against several thousand buildings nobody has looked at is the size of the gap.
          </p>
          <Gazetteer />

          <h2 id="sources">10 · The corpus</h2>
          <p>
            {THESES.length} theses and papers, catalogued with every working link found.{" "}
            <Link href="/shophouses/research">The full bibliography →</Link>
          </p>
        </div>
      </div>

      <footer className="sh-footer">
        <p>
          <strong>The Shophouse Bible</strong> — compiled for Shophouse Metropolis, Harvard Graduate
          School of Design. Corrections welcome; a missing source is a worse outcome than a
          duplicated one.
        </p>
        <p>
          <Link href="/shophouses">← The essay</Link> ·{" "}
          <Link href="/shophouses/research">Bibliography</Link>
        </p>
      </footer>
    </div>
  );
}
