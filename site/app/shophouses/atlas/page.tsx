import type { Metadata } from "next";
import Link from "next/link";
import { PressureMap } from "../PressureMap";
import {
  PRESSURE_DISTRICTS,
  PRESSURE_TOTAL,
  PRESSURE_CAVEATS,
  QUADRANTS,
  SPLITS,
} from "../../data/shophouse-pressure";

// The pressure atlas, addressable. The map has lived inside the essay's
// sh-atlas section since 292d0e2; this page gives it a URL of its own so a
// researcher can paste shophouses.nonarkara.org/shophouses/atlas into an
// email — the deep link both prior audits asked for. Everything rendered
// here is computed by scripts/build-shophouse-pressure.py; the page adds
// the one thing the essay's embed omits, the full per-district table.

export const metadata: Metadata = {
  title: "The Pressure Atlas · Shophouse Metropolis",
  description: `Every candidate shophouse the screen could find in Bangkok — ${PRESSURE_TOTAL.toLocaleString("en-US")} footprints across ${PRESSURE_DISTRICTS.length} districts — laid over the Treasury land appraisal that decides each one's fate, split into four quadrants of pressure.`,
  alternates: { canonical: "/shophouses/atlas" },
  openGraph: {
    title: "The Pressure Atlas — every candidate shophouse in Bangkok",
    description: `${PRESSURE_TOTAL.toLocaleString("en-US")} footprints, two computed axes, four quadrants. One of them is the whole essay.`,
    url: "/shophouses/atlas",
  },
};

const BAHT = new Intl.NumberFormat("en-US");

export default function PressureAtlasPage() {
  const sums = PRESSURE_DISTRICTS.reduce(
    (a, d) => ({
      count: a.count + d.count,
      tell: a.tell + d.tellTheOwner,
      risk: a.risk + d.atRisk,
    }),
    { count: 0, tell: 0, risk: 0 },
  );

  return (
    <div className="shophouse-essay">
      <header className="sh-masthead">
        <Link href="/shophouses" className="sh-wordmark">
          Shophouse<em>Metropolis</em>
        </Link>
        <nav aria-label="Pressure atlas">
          <a href="#map">Map</a>
          <a href="#districts">Districts</a>
          <a href="#method">Method</a>
          <Link href="/shophouses">Essay</Link>
          <Link href="/shophouses/bible">Bible</Link>
          <Link href="/shophouses/global">Global</Link>
        </nav>
      </header>

      <article className="sh-lede">
        <p className="sh-eyebrow">The pressure atlas</p>
        <h1>
          {PRESSURE_TOTAL.toLocaleString("en-US")} buildings, two questions
          each
        </h1>
        <p className="sh-subtitle">
          Every candidate shophouse the screen could find in Bangkok, laid
          over the Treasury appraisal that decides each one&apos;s fate.
        </p>
        <p className="sh-byline">
          Two questions per building: is the ground under it worth more than
          the median (฿{BAHT.format(SPLITS.priceBaht)}), and is the plot
          shallow enough (under {SPLITS.depthM} m) that a compliant rebuild
          loses a serious share of its footprint to the setback? The four
          answers are the four colours — and one of them is the whole{" "}
          <Link href="/shophouses#atlas">essay</Link>. This page is the
          map&apos;s own address; every figure on it is computed by the build
          script, not asserted.
        </p>
      </article>

      <section className="sh-atlas is-standalone" id="map" aria-label="The pressure map">
        <PressureMap />
        <ol className="sh-quadrants">
          {QUADRANTS.map((q) => (
            <li key={q.id}>
              <span
                className="sh-swatch"
                style={{ background: q.colour }}
                aria-hidden="true"
              />
              <div>
                <p className="sh-quadrant-label">
                  {q.label}{" "}
                  <small>{q.count.toLocaleString("en-US")} footprints</small>
                </p>
                <p className="sh-quadrant-what">{q.what}</p>
                <p>{q.why}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="sh-body sh-research-page">
        <div className="sh-prose">
          <h2 id="districts">The districts</h2>
          <p>
            The table the essay&apos;s embed leaves out. <em>Reconsider</em> is
            the pink quadrant — high land value on a plot too shallow to
            rebuild whole; <em>exposed</em> is the ink quadrant — worth
            clearing and deep enough to survive the setback. Districts are
            ordered by candidate count.
          </p>
          <div className="sh-district-scroll">
            <table className="sh-district-table">
              <thead>
                <tr>
                  <th scope="col">District</th>
                  <th scope="col" className="is-num">Candidates</th>
                  <th scope="col" className="is-num">Median frontage × depth</th>
                  <th scope="col" className="is-num">Appraisal ฿/m²</th>
                  <th scope="col" className="is-num">Median land under one footprint</th>
                  <th scope="col" className="is-num">Reconsider</th>
                  <th scope="col" className="is-num">Exposed</th>
                </tr>
              </thead>
              <tbody>
                {PRESSURE_DISTRICTS.map((d) => (
                  <tr key={d.district}>
                    <th scope="row">
                      {d.district}
                      {d.districtTh ? <small>{d.districtTh}</small> : null}
                    </th>
                    <td className="is-num">{d.count.toLocaleString("en-US")}</td>
                    <td className="is-num">
                      {d.medianFrontageM.toFixed(1)} × {d.medianDepthM.toFixed(1)} m
                    </td>
                    <td className="is-num">
                      {BAHT.format(d.landFloorBahtM2)}–{BAHT.format(d.landPeakBahtM2)}
                    </td>
                    <td className="is-num">฿{BAHT.format(d.medianLandUnderFootprint)}</td>
                    <td className="is-num is-tell">{d.tellTheOwner}</td>
                    <td className="is-num">{d.atRisk}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">All districts</th>
                  <td className="is-num">{sums.count.toLocaleString("en-US")}</td>
                  <td className="is-num">—</td>
                  <td className="is-num">—</td>
                  <td className="is-num">—</td>
                  <td className="is-num is-tell">{sums.tell}</td>
                  <td className="is-num">{sums.risk}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <h2 id="method">Method, in one breath</h2>
          <p>
            Candidate footprints screened from Overture/OSM building geometry
            (frontage and depth are the short and long sides of each
            footprint&apos;s minimum-area bounding rectangle, by rotating
            calipers), joined point-in-polygon to Treasury Department
            appraisal bands quoted per square wah and converted at 1 wah² =
            4 m². The price axis cuts at the median land value under one
            footprint, ฿{BAHT.format(SPLITS.priceBaht)}; the depth axis cuts
            at the median plot depth, {SPLITS.depthM} m, where a{" "}
            {SPLITS.lossM} m setback loss is assumed on an{" "}
            {SPLITS.assumedRoadM} m carriageway. The whole computation is{" "}
            <a
              href="https://github.com/Nonarkara/BKKx/blob/main/scripts/build-shophouse-pressure.py"
              target="_blank"
              rel="noreferrer"
            >
              one readable script
            </a>{" "}
            that runs in under a second with no external calls.
          </p>

          <h2 id="caveats">What this is not</h2>
          <ol className="sh-caveats">
            {PRESSURE_CAVEATS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>

          <h2 id="data">The data itself</h2>
          <p className="sh-fig-note">
            <a href="/data/shophouse-pressure.geojson">
              shophouse-pressure.geojson
            </a>{" "}
            — one point per candidate, quadrant, frontage, depth and land
            value in the properties ·{" "}
            <a href="/data/bkk-land-price.geojson">bkk-land-price.geojson</a>{" "}
            — the district appraisal polygons · both regenerated by{" "}
            <code>scripts/build-shophouse-pressure.py</code> and served from
            this domain, ODbL for the OSM-derived geometry. The full
            catalogue of every dataset this project serves — sourced,
            licensed, checksummed — is at{" "}
            <Link href="/datasets">/datasets</Link>.
          </p>
        </div>
      </div>

      <footer className="sh-footer">
        <p>
          <strong>The Pressure Atlas</strong> — the addressable form of the
          map inside the essay. Computed, not asserted; the caveats above are
          part of the result.
        </p>
        <p>
          <Link href="/shophouses">← The essay</Link> ·{" "}
          <Link href="/shophouses/bible">The Bible</Link> ·{" "}
          <Link href="/shophouses/global">Global research</Link> ·{" "}
          <Link href="/shophouses/research">Bibliography</Link>
        </p>
      </footer>
    </div>
  );
}
