import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { PlaceMasthead } from "../PlaceMasthead";
import {
  OLDTOWN_EVIDENCE_LABEL,
  OLDTOWN_KIND_LABEL,
  OLDTOWN_SPOTS,
} from "../data/oldtown-spots";
import {
  ONEP_MAPPING_QUEUE,
  ONEP_MAPPED_RECORDS,
  ONEP_ROWHOUSE_RECORDS,
  ONEP_ROWHOUSE_SURVEY,
  onepRecordsForSlug,
  type OnepSurveyZone,
} from "../data/onep-rowhouse-register";
import footprintSummary from "../data/rowhouse-footprint-summary.json";
import { photoFor } from "../data/heritage-content";
import {
  HERITAGE_MOBILITY_NOTE,
  HERITAGE_MOBILITY_SERVICES,
  nearestHeritageMobilityStops,
} from "../data/heritage-mobility";

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
  variableMeasured: ["location", "period", "typology", "evidence status", "documented unit count", "public transport access"],
  distribution: [
    { "@type": "DataDownload", encodingFormat: "application/geo+json", contentUrl: "https://bkk.nonarkara.org/data/bangkok-rowhouse-atlas.geojson" },
    { "@type": "DataDownload", encodingFormat: "application/geo+json", contentUrl: "https://bkk.nonarkara.org/data/bangkok-rowhouse-footprint-candidates.geojson" },
  ],
};

const EXPLORER_START_SLUGS = [
  "tha-tien",
  "sam-phraeng",
  "luenrit",
  "charoen-chai",
  "song-wat",
  "talad-noi",
  "nang-loeng",
  "hua-takhe",
] as const;

export default function RowhouseAtlasPage() {
  const countedUnits = OLDTOWN_SPOTS.reduce((sum, spot) => sum + (spot.units ?? 0), 0);
  const zoneLabels: Record<OnepSurveyZone, string> = {
    inner: "Inner Rattanakosin",
    intermediate: "Intermediate conservation area",
    outer: "Outer Rattanakosin",
  };

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
            <div><strong>{ONEP_MAPPED_RECORDS.length}/{ONEP_ROWHOUSE_RECORDS.length}</strong><span>ONEP records located</span></div>
            <div><strong>{countedUnits}+</strong><span>published units</span></div>
            <div><strong>{footprintSummary.candidate_count.toLocaleString()}</strong><span>footprints to review</span></div>
          </div>
          <div className="rowhouse-directory-actions">
            <Link href="/?view=rowhouses">Open the 3D map</Link>
            <a href="#start-here">Choose a street ↓</a>
            <a href="#directory">All {OLDTOWN_SPOTS.length} records ↓</a>
            <a href="/data/bangkok-rowhouse-atlas.geojson" download>GeoJSON ↓</a>
            <a href="/data/bangkok-rowhouse-footprint-candidates.geojson" download>Candidate footprints ↓</a>
          </div>
        </header>

        <section id="start-here" className="rowhouse-explorer-start" aria-labelledby="start-here-title">
          <div className="rowhouse-explorer-start-head">
            <div>
              <p className="register-eyebrow">Start with a street</p>
              <h2 id="start-here-title">Eight doors into the city.</h2>
            </div>
            <p>
              Not a ranking: a field-ready mix of royal frontage, Chinatown trades,
              neighbourhood markets and canal life. Each place has a photograph, a
              sourced record, a nearby public-transport gateway and a direct 3D view.
            </p>
          </div>
          <div className="rowhouse-explorer-start-grid">
            {EXPLORER_START_SLUGS.map((slug, index) => {
              const spot = OLDTOWN_SPOTS.find((candidate) => candidate.slug === slug);
              if (!spot) return null;
              const photo = spot.photo ? photoFor(spot.photo) : undefined;
              const nearest = nearestHeritageMobilityStops(spot.center, 1)[0];
              const [lng, lat] = spot.center;
              return (
                <article key={spot.slug}>
                  <a className="rowhouse-explorer-start-photo" href={`#${spot.slug}`}>
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.file} alt="" loading={index < 4 ? "eager" : "lazy"} />
                    ) : null}
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </a>
                  <div>
                    <p>{OLDTOWN_KIND_LABEL[spot.kind].en}</p>
                    <h3><a href={`#${spot.slug}`}>{spot.name}</a></h3>
                    <small lang="th">{spot.thai}</small>
                    <blockquote>{spot.callout}</blockquote>
                    {nearest ? <p className="rowhouse-explorer-arrival">From {nearest.name} · {Math.max(1, Math.round(nearest.distanceKm * 1000))} m</p> : null}
                    <div className="rowhouse-explorer-start-links">
                      <a href={`#${spot.slug}`}>Field record ↓</a>
                      <Link href={`/atlas/historic-core?at=${lng},${lat},${spot.zoom}`}>3D view ↗</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <details className="rowhouse-research-disclosure">
          <summary>
            <span><small>Evidence room 01</small><strong>How the map earns its claims.</strong></span>
            <span>Open method <b aria-hidden="true">+</b></span>
          </summary>
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
        </details>

        <section className="heritage-mobility-guide" aria-labelledby="mobility-guide-title">
          <div className="heritage-mobility-intro">
            <div>
              <p className="register-eyebrow">Arrive by public transport</p>
              <h2 id="mobility-guide-title">Old Bangkok without a car.</h2>
            </div>
            <p>
              The old city is not one destination; it is a chain of river, canal and rail gateways.
              Use the map to understand the network, then walk the last few blocks slowly. Boat routes
              are dotted; rail lines are solid. Every service links to its operator because Bangkok moves.
            </p>
          </div>
          <div className="heritage-mobility-grid">
            {HERITAGE_MOBILITY_SERVICES.filter((service) => [
              "mrt-blue-old-town",
              "chao-phraya-express-old-town",
              "chao-phraya-tourist",
              "saen-saep-west",
            ].includes(service.id)).map((service) => (
              <article key={service.id} style={{ ["--mobility-color" as string]: service.color } as CSSProperties}>
                <span className={`mobility-swatch ${service.mode === "mrt" ? "is-solid" : "is-dotted"}`} aria-hidden="true" />
                <p>{service.shortName}</p>
                <h3>{service.name}</h3>
                <small lang="th">{service.thai}</small>
                <p>{service.serviceNote}</p>
                <a href={service.sourceUrl} target="_blank" rel="noreferrer">Official service information ↗</a>
              </article>
            ))}
          </div>
          <div className="heritage-mobility-note">
            <strong>Read the map honestly.</strong> {HERITAGE_MOBILITY_NOTE}
            <Link href="/?view=rowhouses">Open the transport map ↗</Link>
          </div>
        </section>

        <details className="rowhouse-research-disclosure">
          <summary>
            <span><small>Evidence room 02</small><strong>The official 46-record baseline.</strong></span>
            <span>Open ONEP ledger <b aria-hidden="true">+</b></span>
          </summary>
          <section className="onep-coverage" aria-labelledby="onep-coverage-title">
          <div className="onep-coverage-intro">
            <div>
              <p className="register-eyebrow">Official coverage spine · 46 records</p>
              <h2 id="onep-coverage-title">A source register with its gaps left visible.</h2>
            </div>
            <div>
              <p>
                The official Rattanakosin survey&apos;s category E is the closest thing Bangkok has to a
                rowhouse-fabric baseline. It contains 41 rowhouse ensembles, four standalone commercial
                buildings and one related structure—not 46 interchangeable rows.
              </p>
              <a href={ONEP_ROWHOUSE_SURVEY.url} target="_blank" rel="noreferrer">Open the 388-page ONEP survey ↗</a>
            </div>
          </div>
          <div className="onep-coverage-stats" aria-label="ONEP source reconciliation status">
            <div><strong>{ONEP_MAPPED_RECORDS.length}</strong><span>records linked to a mapped corridor</span></div>
            <div><strong>{ONEP_MAPPING_QUEUE.length}</strong><span>records still in the mapping queue</span></div>
            <div><strong>41 + 4 + 1</strong><span>ensembles · buildings · related structure</span></div>
          </div>
          <div className="onep-ledger">
            {(["inner", "intermediate", "outer"] as OnepSurveyZone[]).map((zone) => {
              const records = ONEP_ROWHOUSE_RECORDS.filter((record) => record.zone === zone);
              const mapped = records.filter((record) => record.mappedSlugs.length > 0).length;
              return (
                <details key={zone} open={zone === "inner"}>
                  <summary><span>{zoneLabels[zone]}</span><small>{mapped}/{records.length} located</small></summary>
                  <div className="onep-ledger-table" role="table" aria-label={`${zoneLabels[zone]} official records`}>
                    {records.map((record) => (
                      <div className="onep-ledger-row" role="row" key={record.id}>
                        <code role="cell">{record.id}</code>
                        <div role="cell"><strong>{record.english}</strong><small lang="th">{record.thai}</small></div>
                        <span role="cell">{record.recordType}</span>
                        <span role="cell">P{record.priority} · {record.total}/15</span>
                        <div role="cell" className={record.mappedSlugs.length ? "is-mapped" : "is-queue"}>
                          {record.mappedSlugs.length ? record.mappedSlugs.map((slug) => {
                            const spot = OLDTOWN_SPOTS.find((candidate) => candidate.slug === slug);
                            return <a key={slug} href={`#${slug}`}>{spot?.name ?? slug}</a>;
                          }) : "Mapping queue"}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
          <p className="onep-coverage-note">
            “Located” means this atlas has linked the official record to a sourced explorer corridor. It does
            not mean a cadastral footprint, present condition or legal protection has been verified.
          </p>
          </section>
        </details>

        <details className="rowhouse-research-disclosure">
          <summary>
            <span><small>Evidence room 03</small><strong>Buildings awaiting field review.</strong></span>
            <span>Open machine queue <b aria-hidden="true">+</b></span>
          </summary>
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
        </details>

        <main id="directory" className="rowhouse-directory-list">
          {OLDTOWN_SPOTS.map((spot, index) => {
            const kind = OLDTOWN_KIND_LABEL[spot.kind];
            const photo = spot.photo ? photoFor(spot.photo) : undefined;
            const [lng, lat] = spot.center;
            const onepRecords = onepRecordsForSlug(spot.slug);
            const nearbyMobility = nearestHeritageMobilityStops(spot.center, 2);
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
                    {onepRecords.length ? <div><dt>ONEP survey</dt><dd>{onepRecords.map((record) => record.id).join(" · ")}</dd></div> : null}
                    <div>
                      <dt>Nearest public transport</dt>
                      <dd>{nearbyMobility.map((stop) => `${stop.name} · ${Math.max(1, Math.round(stop.distanceKm * 1000))} m`).join(" / ")}</dd>
                    </div>
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
