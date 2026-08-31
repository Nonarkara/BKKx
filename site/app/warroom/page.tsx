import type { Metadata } from "next";
import Link from "next/link";
import { BarList, CompositionBar, Tally, TableView } from "./Charts";
import { CAT } from "../data/chart-palette";
import { BangkokClock, RainPanel, WeatherPanel, FirePanel, CctvRail } from "./LiveDeck";
import { PINNED_SITES, REGISTER_COUNTS, REGISTER_SITES } from "../data/heritage-register";
import MANIFEST from "../data/dataset-manifest.json";
import { DATASETS } from "../data/datasets";
import {
  PRESSURE_DISTRICTS,
  PRESSURE_TOTAL,
  QUADRANTS,
  SPLITS,
} from "../data/shophouse-pressure";
import { WATER_SOURCES, WATER_TALLY, LAYER_LABEL, LIVE_ENDPOINTS } from "../data/water-sources";
import {
  TWIN_SOURCES,
  TWIN_TALLY,
  CATEGORY_LABEL,
  INTEGRATION_LABEL,
} from "../data/twin-sources";

/* The war room — the analytics surface that needs no map.
 *
 * Everything on this page that is a number is computed here, at build time,
 * from the files the project actually ships; nothing is transcribed. The two
 * live panels (gauges, cameras) are the only client-fetched things on the
 * page, and each states its own failure rather than rendering a zero.
 *
 * Register: CONSOLE. This is an operator's surface — dark ground, signal lime
 * for state, mono for every figure — the same register as /atlas/*, and
 * deliberately not the Editorial paper of /heritage.
 */

const reg = { counts: REGISTER_COUNTS, sites: REGISTER_SITES };
const manifest = MANIFEST as Record<string, { bytes: number; sha256: string; features: number | null }>;

/* ---- derived, never typed by hand ---------------------------------- */

const districtCounts = (() => {
  const m = new Map<string, number>();
  for (const s of reg.sites) {
    const d = s.district?.trim();
    if (d) m.set(d, (m.get(d) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
})();

const locatedBy = (() => {
  let fineArts = 0;
  let osm = 0;
  let unlocated = 0;
  for (const s of reg.sites) {
    const l = s.locatedBy ?? "";
    if (l === "unlocated") unlocated += 1;
    else if (l === "fine-arts") fineArts += 1;
    else if (l.startsWith("osm:")) osm += 1;
  }
  return { fineArts, osm, unlocated };
})();

const corpusBytes = DATASETS.reduce((n, d) => n + manifest[d.file].bytes, 0);
const corpusFeatures = DATASETS.reduce((n, d) => n + (manifest[d.file].features ?? 0), 0);

const pressureSorted = [...PRESSURE_DISTRICTS].sort((a, b) => b.count - a.count);

// Slim tuples for the fire panel's proximity check — computed here, once,
// server-side, so the client component never imports the full 1.3 MB
// register file just to compare two numbers per monument. The id is the
// register's own, so a detection near a monument can name the record and
// link straight to it.
const locatedMonuments = PINNED_SITES.map((s) => ({
  id: s.id,
  name: s.name,
  lat: s.lat,
  lon: s.lon,
}));

export const metadata: Metadata = {
  title: "War room",
  description: `The BKKx operational picture without a map: ${reg.counts.total} register entries, ${PRESSURE_TOTAL.toLocaleString("en-US")} screened shophouse footprints, ${DATASETS.length} checksummed datasets, and the live Bangkok gauge network.`,
  alternates: { canonical: "/warroom" },
  robots: { index: false },
};

export default function WarRoom() {
  const buildIso = new Date().toISOString();

  return (
    <div className="warroom">
      <header className="wr-masthead">
        <div>
          <p className="wr-eyebrow">BKKx · operational picture</p>
          <h1>War room</h1>
          <p className="wr-dek">
            Everything the system can count, without a map underneath it. Static
            layers are computed from the shipped data at build time; the two
            live panels poll and report their own failures.
          </p>
        </div>
        <BangkokClock buildIso={buildIso} />
      </header>

      {/* ---------------- the standing picture ---------------- */}
      <section className="wr-tallies" aria-label="Corpus at a glance">
        <Tally value={reg.counts.total} label="Register entries" sub="Fine Arts Dept, Bangkok" tone="signal" />
        <Tally value={reg.counts.registered} label="Gazetted" sub={`${reg.counts.awaiting} awaiting`} />
        <Tally value={PRESSURE_TOTAL} label="Screened footprints" sub={`${PRESSURE_DISTRICTS.length} districts`} />
        <Tally value={DATASETS.length} label="Datasets served" sub="each checksummed" />
        <Tally value={corpusFeatures} label="Features shipped" sub={`${(corpusBytes / 1_000_000).toFixed(1)} MB on the wire`} />
        <Tally value={reg.counts.walkable} label="Walkable in Minecraft" sub="monuments inside a world" />
      </section>

      {/* ---------------- cameras: one line ---------------- */}
      <CctvRail />

      {/* ---------------- water ---------------- */}
      <div className="wr-grid-2">
        <RainPanel />
        <WeatherPanel />
      </div>

      <FirePanel monuments={locatedMonuments} />

      <div className="wr-grid-2">
        <section className="wr-panel" aria-labelledby="wr-water-h">
          <header className="wr-panel-head">
            <h2 id="wr-water-h">Water, flood &amp; drainage sources</h2>
            <span className="wr-state is-idle">
              <i aria-hidden="true" />
              {WATER_TALLY.ingested}/{WATER_TALLY.total} ingested
            </span>
          </header>
          <p className="wr-panel-note">
            The twelve nominated <code>data.go.th</code> datasets, studied and
            catalogued. None carries figures yet: <code>data.go.th</code> is
            blocked from the environment this was built in, so the honest state
            is <em>awaiting ingest</em> rather than a plausible number. Run{" "}
            <code>python3 scripts/ingest-bkk-water.py</code> anywhere with open
            egress — it resolves each dataset against CKAN, reads the real
            column names instead of assuming a schema, and writes what it finds.
          </p>
          <ul className="wr-sources">
            {WATER_SOURCES.map((s) => (
              <li key={s.id}>
                <span className={`wr-src-layer is-${s.layer}`}>{LAYER_LABEL[s.layer]}</span>
                <span className="wr-src-name">
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.id}
                  </a>
                  <small className="th">{s.titleTh}</small>
                </span>
                <span className={`wr-src-status is-${s.status}`}>
                  {s.status === "ingested" ? "ingested" : "awaiting"}
                  {s.confidence === "inferred" ? <small title="Title inferred from the slug; confirmed at ingest">inferred</small> : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="wr-panel-note">
            Live endpoint wired: <code>{LIVE_ENDPOINTS[0].route}</code> →{" "}
            {LIVE_ENDPOINTS[0].agency}.
          </p>
        </section>

        <section className="wr-panel" aria-labelledby="wr-twin-h">
          <header className="wr-panel-head">
            <h2 id="wr-twin-h">Twin source register</h2>
            <span className="wr-state is-ok">
              <i aria-hidden="true" />
              {TWIN_TALLY.wired} wired · {TWIN_TALLY.ready} ready
            </span>
          </header>
          <p className="wr-panel-note">
            Candidate layers for the twin, each with the capability it unlocks
            and the caveat that will bite. <strong>Terrain is the gap</strong>:
            Bangkok floods because it is flat, low and sinking, and without an
            elevation model the hazard layers can colour a district but cannot
            say where water goes. {TWIN_TALLY.keyless} of {TWIN_TALLY.total}{" "}
            need no credential at all.
          </p>
          <ul className="wr-sources wr-twin-list">
            {TWIN_SOURCES.map((s) => (
              <li key={s.id}>
                <span className={`wr-src-layer is-${s.category}`}>
                  {CATEGORY_LABEL[s.category]}
                </span>
                <span className="wr-src-name">
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.name}
                  </a>
                  <small>{s.provider}</small>
                </span>
                <span className={`wr-src-status is-${s.integration}`}>
                  {INTEGRATION_LABEL[s.integration]}
                  {s.auth !== "none" ? <small>needs {s.auth}</small> : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="wr-panel-note">
            Full reasoning, licence traps and the adapter pattern for reuse in
            another twin codebase are in{" "}
            <code>docs/twin-data-sources.md</code>.
          </p>
        </section>
      </div>

      {/* ---------------- the register ---------------- */}
      <div className="wr-grid-2">
        <section className="wr-panel" aria-labelledby="wr-status-h">
          <header className="wr-panel-head">
            <h2 id="wr-status-h">Protection status</h2>
          </header>
          <CompositionBar
            total={reg.counts.total}
            caption="Every Fine Arts Department entry in Bangkok, by whether protection has actually been granted."
            parts={[
              { label: "Gazetted", value: reg.counts.registered, hue: CAT[0], meaning: "ขึ้นทะเบียนแล้ว — protection in force" },
              { label: "Awaiting consideration", value: reg.counts.awaiting, hue: CAT[1], meaning: "รอพิจารณาขึ้นทะเบียน — listed, unprotected" },
            ]}
            note="Nearly two thirds of the register is waiting; those are the buildings most likely to be gone before a decision arrives."
          />
        </section>

        <section className="wr-panel" aria-labelledby="wr-precision-h">
          <header className="wr-panel-head">
            <h2 id="wr-precision-h">Coordinate precision</h2>
          </header>
          <CompositionBar
            total={reg.counts.total}
            caption="How precisely each monument can be placed — the project's founding problem, quantified."
            parts={[
              { label: "Building precision", value: reg.counts.buildingPrecision, hue: CAT[4], meaning: "pinned to a structure" },
              { label: "District only", value: reg.counts.districtPrecision, hue: CAT[2], meaning: "~1.1 km — never pinned, never given a block" },
            ]}
            note="The register publishes many coordinates to two decimal places; those rows are left unpinned rather than guessed."
          />
          <BarList
            caption="How the placed monuments were resolved."
            data={[
              { label: "Register coordinate", sub: "≥5 decimals, used as-is", value: locatedBy.fineArts, hue: CAT[4] },
              { label: "OpenStreetMap match", sub: "name-matched, guarded", value: locatedBy.osm, hue: CAT[0] },
              { label: "Left unlocated", sub: "honest refusal to guess", value: locatedBy.unlocated, hue: CAT[2] },
            ]}
          />
        </section>
      </div>

      {/* ---------------- districts ---------------- */}
      <div className="wr-grid-2">
        <section className="wr-panel" aria-labelledby="wr-dist-h">
          <header className="wr-panel-head">
            <h2 id="wr-dist-h">Register concentration</h2>
            <span className="wr-panel-meta">{districtCounts.length} districts</span>
          </header>
          <BarList
            caption="Registered monuments by district — the top ten of 39. Heritage in Bangkok is not scattered evenly; it is quartered."
            data={districtCounts.slice(0, 10).map(([label, value]) => ({ label, value }))}
          />
          <TableView
            summary={`All ${districtCounts.length} districts as a table`}
            columns={["District", "Monuments"]}
            rows={districtCounts}
          />
        </section>

        <section className="wr-panel" aria-labelledby="wr-quad-h">
          <header className="wr-panel-head">
            <h2 id="wr-quad-h">Shophouse pressure</h2>
            <span className="wr-panel-meta">
              split ฿{SPLITS.priceBaht.toLocaleString("en-US")} · {SPLITS.depthM} m
            </span>
          </header>
          <CompositionBar
            total={PRESSURE_TOTAL}
            caption="Every screened shophouse footprint by the two axes that decide its fate: land value under it, and whether the plot survives a setback."
            parts={QUADRANTS.map((q, i) => ({
              label: q.label,
              value: q.count,
              hue: CAT[i % CAT.length],
              meaning: q.what,
            }))}
          />
          <BarList
            caption="Candidate footprints by district."
            data={pressureSorted.map((d) => ({
              label: d.district,
              sub: d.districtTh ?? undefined,
              value: d.count,
            }))}
          />
          <TableView
            summary="Pressure table — candidates, reconsider, exposed"
            columns={["District", "Candidates", "Reconsider", "Exposed"]}
            rows={pressureSorted.map((d) => [d.district, d.count, d.tellTheOwner, d.atRisk])}
          />
        </section>
      </div>

      {/* ---------------- integrity ---------------- */}
      <section className="wr-panel" aria-labelledby="wr-int-h">
        <header className="wr-panel-head">
          <h2 id="wr-int-h">Corpus integrity</h2>
          <span className="wr-panel-meta">SHA-256 at build</span>
        </header>
        <BarList
          caption="Features per shipped dataset. Every file is checksummed at build; the catalogue fails the build if a served file is missing from it, or a listed file is missing from disk."
          data={DATASETS.filter((d) => (manifest[d.file].features ?? 0) > 0)
            .map((d) => ({ label: d.title, value: manifest[d.file].features ?? 0 }))
            .sort((a, b) => b.value - a.value)}
        />
        <p className="wr-panel-note">
          Full provenance — source, licence, generator and checksum per file — is
          on <Link href="/datasets">the datasets shelf</Link>.
        </p>
      </section>

      <footer className="wr-foot">
        <p>
          Static panels computed at build from the shipped corpus. Live panels
          poll <code>/api/live/*</code>, which the Worker proxies server-side
          because the upstream gauge feed is plain HTTP and sends no CORS
          headers. No panel on this page renders a number it did not receive.
        </p>
        <p>
          <Link href="/atlas/historic-core">Console atlas →</Link>{" "}
          <Link href="/datasets">Datasets →</Link>{" "}
          <Link href="/heritage">The register →</Link>
        </p>
      </footer>
    </div>
  );
}
