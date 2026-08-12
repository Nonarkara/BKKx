import type { Metadata } from "next";
import Link from "next/link";
import { PlaceMasthead } from "../PlaceMasthead";
import {
  OLDTOWN_EVIDENCE_LABEL,
  OLDTOWN_KIND_LABEL,
  OLDTOWN_SPOTS,
} from "../data/oldtown-spots";

export const metadata: Metadata = {
  title: "Bangkok rowhouse atlas",
  description:
    "A sourced cultural map and field directory of Bangkok's historic rowhouse fabric—from royal frontages and Chinatown trade streets to Thonburi and canal markets.",
  alternates: { canonical: "/rowhouses" },
  openGraph: {
    title: "Bangkok rowhouse atlas · BKKxC(ulture)",
    description: `${OLDTOWN_SPOTS.length} documented clusters with typology, evidence status, explorer notes and a direct 3D map view.`,
    url: "https://bkk.nonarkara.org/rowhouses",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: "Bangkok rowhouse atlas",
  description: "A curated and sourced inventory of historic rowhouse clusters across Bangkok.",
  spatialCoverage: { "@type": "Place", name: "Bangkok, Thailand" },
  url: "https://bkk.nonarkara.org/rowhouses",
  creator: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
  variableMeasured: ["location", "period", "typology", "evidence status", "documented unit count"],
};

export default function RowhouseAtlasPage() {
  const registered = OLDTOWN_SPOTS.filter((spot) => spot.evidence === "registered").length;
  const countedUnits = OLDTOWN_SPOTS.reduce((sum, spot) => sum + (spot.units ?? 0), 0);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <div className="register rowhouse-directory">
        <PlaceMasthead />
        <header className="rowhouse-directory-hero">
          <p className="register-eyebrow">Field atlas 01 · Bangkok urban fabric</p>
          <h1>Bangkok is a city of rows.</h1>
          <p className="rowhouse-directory-th" lang="th">กรุงเทพฯ คือเมืองแห่งตึกแถว</p>
          <p className="rowhouse-directory-dek">
            Palaces draw the skyline. Rowhouses make the city. This directory follows the continuous
            fabric—from royal-frontage blocks and Chinatown trade streets to Thonburi markets and an
            eastern canal settlement—without confusing a curated corridor with a legal boundary.
          </p>
          <div className="rowhouse-directory-stats" aria-label="Rowhouse atlas summary">
            <div><strong>{OLDTOWN_SPOTS.length}</strong><span>mapped clusters</span></div>
            <div><strong>{registered}</strong><span>register-linked</span></div>
            <div><strong>{countedUnits}+</strong><span>published units</span></div>
            <div><strong>3</strong><span>evidence levels</span></div>
          </div>
          <div className="rowhouse-directory-actions">
            <Link href="/?view=rowhouses">Open the 3D map</Link>
            <a href="#directory">Read the directory ↓</a>
          </div>
        </header>

        <section className="rowhouse-method" aria-labelledby="method-title">
          <div>
            <p className="register-eyebrow">How to read the map</p>
            <h2 id="method-title">Evidence, not aesthetic guesswork.</h2>
          </div>
          <div className="rowhouse-method-grid">
            <p><strong>Fine Arts register</strong> links to a published monument record or conservation award.</p>
            <p><strong>Published count</strong> uses a scholarly or institutional inventory, including unit numbers where reported.</p>
            <p><strong>Curated corridor</strong> locates a documented community or street, but does not claim cadastral precision.</p>
          </div>
        </section>

        <main id="directory" className="rowhouse-directory-list">
          {OLDTOWN_SPOTS.map((spot, index) => {
            const kind = OLDTOWN_KIND_LABEL[spot.kind];
            const [lng, lat] = spot.center;
            return (
              <article key={spot.slug} id={spot.slug} className="rowhouse-directory-card">
                <div className="rowhouse-directory-index">{String(index + 1).padStart(2, "0")}</div>
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/heritage/photos/${spot.photo}.jpg`} alt="" loading="lazy" />
                </figure>
                <div className="rowhouse-directory-copy">
                  <div className="rowhouse-directory-kicker">
                    <span>{kind.icon} {kind.en}</span>
                    <span>{spot.period}</span>
                  </div>
                  <h2>{spot.name}</h2>
                  <p className="rowhouse-directory-th" lang="th">{spot.thai}</p>
                  <blockquote>{spot.callout}</blockquote>
                  <p>{spot.note}</p>
                  <dl>
                    <div><dt>Typology</dt><dd>{spot.typology}</dd></div>
                    <div><dt>Evidence</dt><dd>{OLDTOWN_EVIDENCE_LABEL[spot.evidence]}</dd></div>
                    {spot.units ? <div><dt>Published count</dt><dd>{spot.units} units</dd></div> : null}
                    {spot.registerId ? <div><dt>Register / award</dt><dd>{spot.registerId}</dd></div> : null}
                  </dl>
                  <p className="rowhouse-directory-tip"><strong>Explorer note</strong>{spot.explorerTip}</p>
                  <div className="rowhouse-directory-links">
                    <Link href={`/atlas/historic-core?at=${lng},${lat},${spot.zoom}`}>See in 3D ↗</Link>
                    <a href={spot.sourceUrl} target="_blank" rel="noreferrer">Evidence: {spot.source} ↗</a>
                  </div>
                </div>
              </article>
            );
          })}
        </main>

        <footer className="rowhouse-directory-foot">
          <strong>This is a foundation, not a finished canon.</strong>
          <p>Next: block-level geometry, façade surveys, oral histories, ownership risk and repeat photography.</p>
        </footer>
      </div>
    </>
  );
}
