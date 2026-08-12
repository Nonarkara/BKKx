import type { Metadata } from "next";
import Link from "next/link";
import { PlaceMasthead } from "../PlaceMasthead";
import {
  OLDTOWN_EVIDENCE_LABEL,
  OLDTOWN_KIND_LABEL,
  OLDTOWN_SPOTS,
} from "../data/oldtown-spots";
import footprintSummary from "../data/rowhouse-footprint-summary.json";
import { photoFor } from "../data/heritage-content";

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
  distribution: [
    { "@type": "DataDownload", encodingFormat: "application/geo+json", contentUrl: "https://bkk.nonarkara.org/data/bangkok-rowhouse-atlas.geojson" },
    { "@type": "DataDownload", encodingFormat: "application/geo+json", contentUrl: "https://bkk.nonarkara.org/data/bangkok-rowhouse-footprint-candidates.geojson" },
  ],
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
            <div><strong>{OLDTOWN_SPOTS.length}</strong><span>mapped corridors</span></div>
            <div><strong>{registered}</strong><span>register-linked</span></div>
            <div><strong>{countedUnits}+</strong><span>published units</span></div>
            <div><strong>{footprintSummary.candidate_count.toLocaleString()}</strong><span>footprints to review</span></div>
          </div>
          <div className="rowhouse-directory-actions">
            <Link href="/?view=rowhouses">Open the 3D map</Link>
            <a href="#directory">Read the directory ↓</a>
            <a href="/data/bangkok-rowhouse-atlas.geojson" download>GeoJSON ↓</a>
            <a href="/data/bangkok-rowhouse-footprint-candidates.geojson" download>Candidate footprints ↓</a>
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
            <p><strong>Map geometry</strong> uses solid lines for high-confidence axes and dashed lines for interpretive connections.</p>
          </div>
        </section>

        <section id="candidate-method" className="rowhouse-candidate-method" aria-labelledby="candidate-method-title">
          <div>
            <p className="register-eyebrow">Machine review queue · Overture {footprintSummary.overture_release}</p>
            <h2 id="candidate-method-title">{footprintSummary.candidate_count.toLocaleString()} shapes worth looking at—not {footprintSummary.candidate_count.toLocaleString()} heritage claims.</h2>
            <p>
              We screened present-day Overture building roofprints and footprints near the {OLDTOWN_SPOTS.length} sourced corridors.
              The result is a transparent fieldwork queue: turn it on in the 3D map, click a building, and see why it surfaced.
            </p>
          </div>
          <div className="rowhouse-candidate-numbers" aria-label="Candidate review summary">
            <div><strong>{footprintSummary.strong_count.toLocaleString()}</strong><span>strong morphology</span></div>
            <div><strong>{footprintSummary.possible_count.toLocaleString()}</strong><span>possible morphology</span></div>
            <div><strong>{footprintSummary.calibration.sample_units.toLocaleString()}</strong><span>historic survey units used only to calibrate shape</span></div>
          </div>
          <div className="rowhouse-candidate-caveat">
            <strong>Hard boundary:</strong> {footprintSummary.caveat}
          </div>
          <p className="rowhouse-candidate-sources">
            Method calibration: <a href={footprintSummary.calibration.url} target="_blank" rel="noreferrer">1988 Bangkok shophouse composition study ↗</a>
            {" · "}Geometry: <a href={footprintSummary.source_url} target="_blank" rel="noreferrer">Overture Maps buildings guide ↗</a>
            {" · "}<a href="https://github.com/Nonarkara/BKKx/blob/main/docs/rowhouse-atlas-method.md" target="_blank" rel="noreferrer">Full reproducible method ↗</a>
          </p>
        </section>

        <main id="directory" className="rowhouse-directory-list">
          {OLDTOWN_SPOTS.map((spot, index) => {
            const kind = OLDTOWN_KIND_LABEL[spot.kind];
            const photo = spot.photo ? photoFor(spot.photo) : undefined;
            const [lng, lat] = spot.center;
            return (
              <article key={spot.slug} id={spot.slug} className="rowhouse-directory-card">
                <div className="rowhouse-directory-index">{String(index + 1).padStart(2, "0")}</div>
                <figure>
                  {photo ? <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.file} alt={spot.name} loading="lazy" />
                    <figcaption>
                      {photo.artist} · <a href={photo.descriptionUrl} target="_blank" rel="noreferrer">Wikimedia Commons</a> · {photo.licence}
                    </figcaption>
                  </> : <span className="rowhouse-photo-pending" aria-label="Field photograph needed">Field photo<br />needed</span>}
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
                    <div><dt>Shapes to review</dt><dd>{footprintSummary.by_cluster[spot.slug as keyof typeof footprintSummary.by_cluster] ?? 0} unverified candidates</dd></div>
                    <div><dt>Map geometry</dt><dd>{spot.fabric.method} · {spot.fabric.geometryConfidence} confidence</dd></div>
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
