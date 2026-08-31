import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CLUSTER_RECORDS,
  SPINE_MISSING,
  SPINE_TOTAL,
  SPINE_UNJOINED,
} from "../../../data/shophouse-spine-index";
import { SIGNATURE } from "../../../data/shophouse-gazetteer";
import { QUADRANTS, SPLITS, PRESSURE_TOTAL, PRESSURE_CAVEATS } from "../../../data/shophouse-pressure";
import { REGULATION } from "../../../data/shophouse-bible";

/* One page per documented cluster — the two halves of this project's
 * shophouse argument, finally joined.
 *
 * The Bible's gazetteer carries the editorial half: what somebody
 * documented, what evidence tier it sits in, who published the survey. The
 * spine index carries the computed half: how many footprints the screen
 * found there, their median frontage and depth, which Ministerial
 * Regulation clauses bind them, how the pressure quadrants split, what the
 * land under them is appraised at. Both were on the site. Neither could see
 * the other, so no page could say "this row, this many buildings, these
 * rules, this exposure" — which is the entire argument this surface
 * exists to make.
 *
 * Every figure below is read from CLUSTER_RECORDS, which
 * scripts/build-shophouse-spine.py writes from the footprint screen. None
 * is typed by hand, and each is shown next to the rule that produced it,
 * because a number a reader cannot audit is worth less here than a null
 * they can see.
 */

type Params = { slug: string };
type Props = { params: Promise<Params> };

export function generateStaticParams(): Params[] {
  return CLUSTER_RECORDS.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

function clusterBySlug(slug: string) {
  return CLUSTER_RECORDS.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = clusterBySlug(slug);
  if (!c) return { title: "Cluster not found" };
  const name = c.name ?? c.slug;
  return {
    title: `${name} · documented shophouse cluster`,
    description: `${c.n} screened footprints in ${c.district}. Median frontage ${c.medianFrontage} m, median depth ${c.medianDepth} m. Evidence tier: ${c.evidence ?? "unrecorded"}.`,
    alternates: { canonical: `/shophouses/cluster/${c.slug}` },
    openGraph: {
      title: `${name} — Shophouse Metropolis`,
      description: `${c.n} screened footprints, every figure computed from open data.`,
      url: `/shophouses/cluster/${c.slug}`,
    },
  };
}

/** What each evidence tier actually buys the buildings in it. */
const EVIDENCE_MEANING: Record<string, { label: string; note: string }> = {
  registered: {
    label: "Registered",
    note: "On the Fine Arts Department register. Protection is in force; demolition needs permission.",
  },
  "published inventory": {
    label: "Counted",
    note: "Units counted in a published survey. Somebody has been here with a clipboard — but nothing is legally protected.",
  },
  "mapped corridor": {
    label: "Mapped only",
    note: "Geometry recorded and nothing else. No survey, no count, no protection.",
  },
};

/** The Ministerial Regulation text behind a `MR55 ข้อ N` key. */
function ruleFor(key: string) {
  const clause = key.replace(/^MR55\s+/, "");
  return REGULATION.find((r) => r.clause === clause || r.clause.endsWith(`, ${clause}`)) ?? null;
}

const baht = (n: number) => `฿${n.toLocaleString("en-US")}`;

export default async function ClusterPage({ params }: Props) {
  const { slug } = await params;
  const c = clusterBySlug(slug);
  if (!c) notFound();

  const name = c.name ?? c.slug;
  const evidence = c.evidence ? EVIDENCE_MEANING[c.evidence] : null;

  // The pressure split, in the published quadrant order, plus the
  // unclassified remainder named rather than dropped.
  const quadrantRows = QUADRANTS.map((q) => ({ ...q, n: c.quadrants[q.id] ?? 0 })).filter(
    (q) => q.n > 0,
  );
  const unclassified = c.quadrants["null"] ?? 0;
  const classified = c.n - unclassified;

  const clauses = Object.entries(c.bindingClauses).sort((a, b) => b[1] - a[1]);
  const shareOfCorpus = ((c.n / SPINE_TOTAL) * 100).toFixed(1);
  const storeysUnknown = c.n - c.storeysKnown;

  const citation = `Arkara, N. (2026). ${name} — documented shophouse cluster (${c.n} screened footprints) [Data set]. Shophouse Metropolis, BKKx. https://bkk.nonarkara.org/shophouses/cluster/${c.slug}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${name} — screened shophouse footprints`,
    description: `${c.n} candidate shophouse footprints in ${c.district}, screened by morphology from open data and joined to land appraisal, regulation and pressure classification.`,
    creator: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
    license: "https://creativecommons.org/licenses/by/4.0/",
    url: `https://bkk.nonarkara.org/shophouses/cluster/${c.slug}`,
    ...(c.sourceUrl ? { isBasedOn: c.sourceUrl } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="shophouse-essay">
        <header className="sh-masthead">
          <Link href="/shophouses" className="sh-wordmark">
            Shophouse<em>Metropolis</em>
          </Link>
          <nav aria-label="Cluster">
            <Link href="/shophouses/bible#gazetteer">Gazetteer</Link>
            <Link href="/shophouses#atlas">Pressure map</Link>
            <Link href="/shophouses/research">Sources</Link>
            <Link href="/shophouses">Essay</Link>
          </nav>
        </header>

        <article className="sh-lede">
          <p className="sh-eyebrow">
            Documented cluster · <span lang="th">{c.district}</span>
          </p>
          <h1>{name}</h1>
          {c.nameTh ? (
            <p className="sh-subtitle" lang="th">
              {c.nameTh}
            </p>
          ) : null}
          <p className="sh-byline">
            {c.n.toLocaleString("en-US")} candidate footprints, {shareOfCorpus}% of the{" "}
            {SPINE_TOTAL.toLocaleString("en-US")}-building spine.{" "}
            {evidence ? (
              <>
                Evidence tier <b>{evidence.label.toLowerCase()}</b> — {evidence.note}
              </>
            ) : (
              "No evidence tier recorded for this cluster."
            )}
          </p>
        </article>

        <div className="sh-cluster">
          {/* ---- the signature ---- */}
          <section className="sh-cluster-block" aria-labelledby="cl-sig">
            <h2 id="cl-sig">The dimensions actually measured</h2>
            <dl className="sh-quickref-grid">
              <div>
                <dt>Footprints screened</dt>
                <dd>
                  {c.n.toLocaleString("en-US")}
                  <small>morphology only, never surveyed</small>
                </dd>
              </div>
              <div>
                <dt>Median frontage</dt>
                <dd>
                  {c.medianFrontage} m
                  <small>citywide {SIGNATURE.frontage.p50} m</small>
                </dd>
              </div>
              <div>
                <dt>Median depth</dt>
                <dd>
                  {c.medianDepth} m
                  <small>citywide {SIGNATURE.depth.p50} m</small>
                </dd>
              </div>
              <div>
                <dt>Deepest tenth</dt>
                <dd>
                  {c.p90Depth} m
                  <small>p90 · citywide {SIGNATURE.depth.p90} m</small>
                </dd>
              </div>
            </dl>
            <p className="sh-fig-note">
              Frontage and depth are the short and long sides of each footprint&apos;s minimum-area
              bounding rectangle, computed by <code>scripts/build-shophouse-spine.py</code> over the
              Overture/OSM screen. A footprint in this set has not been visited: the shape says
              shophouse, and nothing here says it is one.
            </p>
            {c.documentedUnits ? (
              <p className="sh-fig-note">
                Against those {c.n.toLocaleString("en-US")} screened shapes, a published survey
                counted <b>{c.documentedUnits} units</b> here. Where the two disagree, the counted
                figure is the one a human stood in front of.
              </p>
            ) : null}
          </section>

          {/* ---- the legal cage, per cluster ---- */}
          {clauses.length ? (
            <section className="sh-cluster-block" aria-labelledby="cl-law">
              <h2 id="cl-law">What binds these buildings</h2>
              <p>
                Computed per footprint from depth, plot and neighbours — not merely listed. A clause
                counts as binding when this building&apos;s own geometry triggers it.
              </p>
              <ul className="sh-cluster-clauses">
                {clauses.map(([key, n]) => {
                  const rule = ruleFor(key);
                  return (
                    <li key={key}>
                      <p className="sh-cluster-clause-head">
                        <span lang="th">{key}</span>
                        <b>
                          {n.toLocaleString("en-US")} of {c.n.toLocaleString("en-US")}
                        </b>
                      </p>
                      {rule ? (
                        <>
                          <p className="sh-cluster-rule">{rule.rule}</p>
                          <p className="sh-fig-note">{rule.consequence}</p>
                        </>
                      ) : (
                        <p className="sh-fig-note">
                          The spine records this clause as binding, but the Bible&apos;s regulation
                          table has no matching text — the clause list and the rule table have
                          drifted apart and one of them is wrong.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
              <dl className="sh-quickref-grid">
                <div>
                  <dt>Already over the depth cap</dt>
                  <dd>
                    {c.overDepthCap.toLocaleString("en-US")}
                    <small>deeper than the 24 m ข้อ 2 allows a new build</small>
                  </dd>
                </div>
                <div>
                  <dt>Median row length</dt>
                  <dd>
                    {c.medianRowUnits} units
                    <small>ข้อ 4 caps a continuous row at 10</small>
                  </dd>
                </div>
                <div>
                  <dt>Rows over that cap</dt>
                  <dd>
                    {c.overRowCap.toLocaleString("en-US")}
                    <small>lawful when built, unbuildable now</small>
                  </dd>
                </div>
              </dl>
              <p className="sh-fig-note">
                The interesting number is the third. Where a row exceeds today&apos;s cap, the
                building standing there could not be built again — which means demolition is not a
                reversible decision, whatever replaces it.
              </p>
            </section>
          ) : null}

          {/* ---- pressure ---- */}
          <section className="sh-cluster-block" aria-labelledby="cl-pressure">
            <h2 id="cl-pressure">Where the pressure sits</h2>
            <p>
              Each footprint is placed on two axes: the appraised land value underneath it, split at
              the citywide median of {baht(SPLITS.priceBaht)}, and its plot depth, split at{" "}
              {SPLITS.depthM} m — below which a {SPLITS.lossM} m setback takes a serious share of any
              compliant replacement.
            </p>
            <ul className="sh-cluster-quadrants">
              {quadrantRows.map((q) => (
                <li key={q.id}>
                  <span className="sh-cluster-swatch" style={{ background: q.colour }} aria-hidden="true" />
                  <p className="sh-cluster-q-head">
                    {q.label}
                    <b>{q.n.toLocaleString("en-US")}</b>
                  </p>
                  <p className="sh-cluster-q-what">{q.what}</p>
                  <p className="sh-fig-note">{q.why}</p>
                </li>
              ))}
            </ul>
            {unclassified > 0 ? (
              <p className="sh-fig-note">
                {unclassified.toLocaleString("en-US")} of the {c.n.toLocaleString("en-US")}{" "}
                footprints here carry no quadrant, so the split above sums to{" "}
                {classified.toLocaleString("en-US")} rather than {c.n.toLocaleString("en-US")}. That
                is a join artefact, not a gap in the screen: the pressure layer classifies all{" "}
                {PRESSURE_TOTAL.toLocaleString("en-US")} footprints, but the spine joins the two
                sets by centroid rounded to five decimal places, and{" "}
                {SPINE_UNJOINED.toLocaleString("en-US")} of the{" "}
                {SPINE_TOTAL.toLocaleString("en-US")} miss that key by a metre or so. Those
                buildings have a quadrant; this page cannot currently name it.
              </p>
            ) : null}
            <dl className="sh-quickref-grid">
              <div>
                <dt>Land under one footprint</dt>
                <dd>
                  {baht(c.medianLandUnder)}
                  <small>median · citywide split {baht(SPLITS.priceBaht)}</small>
                </dd>
              </div>
              <div>
                <dt>District appraisal band</dt>
                <dd>
                  {baht(c.landFloorM2)}–{baht(c.landPeakM2)}
                  <small>per m², Treasury appraisal</small>
                </dd>
              </div>
            </dl>
            <p className="sh-fig-note">
              Appraised value is the base for transfer tax and sits below market, so every figure
              here is a floor, not an estimate.
            </p>
          </section>

          {/* ---- what is not known ---- */}
          <section className="sh-cluster-block" aria-labelledby="cl-missing">
            <h2 id="cl-missing">What this page cannot tell you</h2>
            <p>
              Storeys are known for {c.storeysKnown.toLocaleString("en-US")} of the{" "}
              {c.n.toLocaleString("en-US")} footprints here
              {storeysUnknown > 0 ? (
                <>
                  {" "}
                  — {storeysUnknown.toLocaleString("en-US")} carry none, and are left null rather
                  than filled with a plausible number
                </>
              ) : null}
              . Across the whole spine the same is true of {SPINE_MISSING.join(", ")}.
            </p>
            <ul className="sh-cluster-caveats">
              {PRESSURE_CAVEATS.map((caveat) => (
                <li key={caveat}>{caveat}</li>
              ))}
            </ul>
          </section>

          {/* ---- provenance ---- */}
          <section className="sh-cluster-block" aria-labelledby="cl-source">
            <h2 id="cl-source">Where this comes from</h2>
            {c.note ? <p>{c.note}</p> : null}
            {c.typology ? <p className="sh-fig-note">{c.typology}</p> : null}
            <dl className="sh-quickref-grid">
              {c.period ? (
                <div>
                  <dt>Period</dt>
                  <dd>{c.period}</dd>
                </div>
              ) : null}
              {c.kind ? (
                <div>
                  <dt>Kind</dt>
                  <dd>{c.kind}</dd>
                </div>
              ) : null}
              {c.registerId ? (
                <div>
                  <dt>Register id</dt>
                  <dd>{c.registerId}</dd>
                </div>
              ) : null}
              <div>
                <dt>District</dt>
                <dd lang="th">{c.district}</dd>
              </div>
            </dl>
            {c.source ? (
              <p className="sh-fig-note">
                Documentation:{" "}
                {c.sourceUrl ? (
                  <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                    {c.source} ↗
                  </a>
                ) : (
                  c.source
                )}
                . Every computed figure on this page comes from{" "}
                <code>scripts/build-shophouse-spine.py</code>, which states each rule in its header.
              </p>
            ) : null}
            <p className="sh-cluster-cite">
              <code>{citation}</code>
            </p>
            <p className="sh-fig-note">
              <Link href="/shophouses/bible#gazetteer">All {CLUSTER_RECORDS.length} clusters</Link> ·{" "}
              <Link href="/shophouses#atlas">the pressure map</Link> ·{" "}
              <Link href="/datasets">the datasets behind them</Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
