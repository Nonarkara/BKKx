import type { Metadata } from "next";
import Link from "next/link";
import { PlaceMasthead } from "../PlaceMasthead";
import { BANGKOK_CLAIMS, COMPARISON_SITES } from "../data/heritage-comparison";

export const metadata: Metadata = {
  title: "The case for Old Bangkok",
  description:
    "An evidence-led comparison of Old Bangkok's living rowhouse fabric with George Town, Vigan, Hoi An, Luang Prabang and Galle—and the research still needed.",
  alternates: { canonical: "/case-for-bangkok" },
  openGraph: {
    title: "Bangkok is not one old town · BKKxC(ulture)",
    description: "A case for Bangkok's polycentric, living urban heritage—with the weaknesses left visible.",
    url: "https://bkk.nonarkara.org/case-for-bangkok",
  },
};

export default function CaseForBangkokPage() {
  return (
    <div className="register bangkok-case">
      <PlaceMasthead />
      <header className="bangkok-case-hero">
        <p className="register-eyebrow">Comparative dossier 01 · working argument</p>
        <h1>Bangkok is not one old town.</h1>
        <p className="bangkok-case-th" lang="th">กรุงเทพฯ ไม่ใช่เมืองเก่าเพียงย่านเดียว</p>
        <p className="bangkok-case-standfirst">
          George Town has a canon. Vigan has an intact grid. Hoi An has a complete timber town.
          Bangkok has something harder to conserve—and potentially more important: many living old
          towns operating inside one metropolis. This is the case. The missing evidence stays visible.
        </p>
        <div className="bangkok-case-actions">
          <Link href="/rowhouses">Read the rowhouse evidence</Link>
          <a href="/data/bangkok-rowhouse-atlas.geojson" download>Download open GeoJSON ↓</a>
        </div>
      </header>

      <section className="bangkok-case-thesis" aria-labelledby="thesis-title">
        <div>
          <p className="register-eyebrow">The proposition</p>
          <h2 id="thesis-title">Better is the wrong first word. Richer is testable.</h2>
        </div>
        <p>
          A UNESCO inscription is not a beauty contest. It tests Outstanding Universal Value,
          integrity, authenticity, protection and management. Bangkok cannot honestly claim those
          conditions citywide yet. It can test a stronger proposition: nowhere else in the comparison
          combines this breadth of rowhouse types, infrastructures, communities and active metropolitan use.
        </p>
      </section>

      <section className="bangkok-claim-register" aria-labelledby="claims-title">
        <div className="bangkok-case-section-head">
          <p className="register-eyebrow">Claim register</p>
          <h2 id="claims-title">What the evidence can—and cannot—say.</h2>
        </div>
        <div className="bangkok-claim-grid">
          {BANGKOK_CLAIMS.map((claim) => (
            <article key={claim.title} className={`bangkok-claim is-${claim.status}`}>
              <span>{claim.status === "proved" ? "Proved now" : claim.status === "promising" ? "Promising" : "Not proved"}</span>
              <h3>{claim.title}</h3>
              <p>{claim.body}</p>
              <small>{claim.evidence}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="bangkok-comparison" aria-labelledby="comparison-title">
        <div className="bangkok-case-section-head">
          <p className="register-eyebrow">Asian historic-city comparators</p>
          <h2 id="comparison-title">Compare the urban system, not the postcard.</h2>
          <p>Official UNESCO statements for comparator sites; a critical research proposition for Bangkok.</p>
        </div>
        <div className="bangkok-comparison-table" role="table" aria-label="Asian historic city comparison">
          <div className="bangkok-comparison-row bangkok-comparison-header" role="row">
            <span role="columnheader">Place</span><span role="columnheader">Scale + fabric</span><span role="columnheader">Urban logic</span><span role="columnheader">Strength / tradeoff</span>
          </div>
          {COMPARISON_SITES.map((site) => (
            <article key={site.slug} className={`bangkok-comparison-row is-${site.slug}`} role="row">
              <div role="cell">
                <strong>{site.place}</strong><small>{site.country}</small><em>{site.status}</em>
              </div>
              <div role="cell"><p>{site.propertyScale}</p><p>{site.documentedFabric}</p></div>
              <div role="cell"><p>{site.urbanLogic}</p></div>
              <div role="cell">
                <p><strong>{site.strongestClaim}</strong></p><p>{site.pressureOrTradeoff}</p>
                <a href={site.sourceUrl} target="_blank" rel="noreferrer">Primary source ↗</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bangkok-case-roadmap" aria-labelledby="roadmap-title">
        <p className="register-eyebrow">From argument to nomination-grade evidence</p>
        <h2 id="roadmap-title">What must be measured next.</h2>
        <ol>
          <li><strong>Count the fabric.</strong><span>Building-by-building footprint, frontage, age band, condition and active use.</span></li>
          <li><strong>Draw a defensible boundary.</strong><span>Core clusters, connective corridors, setting and buffer—not a circle around monuments.</span></li>
          <li><strong>Record the living system.</strong><span>Tenure, trades, worship, foodways, repair knowledge, oral histories and displacement risk.</span></li>
          <li><strong>Test integrity.</strong><span>What survives, what has been severed, and whether the ensemble still explains Bangkok&apos;s history.</span></li>
          <li><strong>Build governance.</strong><span>Protection, incentives, design controls, community rights, monitoring and a funded management plan.</span></li>
        </ol>
      </section>

      <footer className="bangkok-case-footer">
        <p><strong>The position:</strong> Bangkok should not imitate a preserved colonial old town. It should prove that a living Asian metropolis can conserve complexity without evacuating life.</p>
        <Link href="/">Return to the 3D atlas →</Link>
      </footer>
    </div>
  );
}
