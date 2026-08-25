import type { Metadata } from "next";
import Link from "next/link";
import { PlaceMasthead } from "../PlaceMasthead";
import { DATASETS, citationFor } from "../data/datasets";
import { CopyCitation } from "./CopyCitation";
import MANIFEST from "../data/dataset-manifest.json";

// The evidence shelf. Every public dataset this project serves, in one
// ledger: what it is, where its facts come from, what re-use must honour,
// which script regenerates it, and the machine-measured truth of the file
// itself — bytes, feature count, sha256 — stamped at build time by
// scripts/build-dataset-manifest.mjs. The catalogue cannot silently drift
// from the served files: the build fails when either side is missing.
//
// Editorial register: paper ground, oxide seal, hairline rules; checksums
// and byte counts in mono. The page is a research instrument, not a
// downloads section.

type Measured = {
  bytes: number;
  sha256: string;
  features: number | null;
  kinds: string[];
};

const manifest = MANIFEST as Record<string, Measured>;

const totalBytes = DATASETS.reduce((n, d) => n + manifest[d.file].bytes, 0);
const totalFeatures = DATASETS.reduce(
  (n, d) => n + (manifest[d.file].features ?? 0),
  0,
);

export const metadata: Metadata = {
  title: "The datasets",
  description: `Every public dataset behind BKKx — ${DATASETS.length} files, ${totalFeatures.toLocaleString("en-US")} features — each with its source, its license, the script that regenerates it and its build-time checksum.`,
  alternates: { canonical: "/datasets" },
  openGraph: {
    title: "The datasets · BKKxC(ulture)",
    description: `${DATASETS.length} open data files: the heritage register, the rowhouse atlas, the shophouse pressure map, the POI layers — sized, checksummed, licensed, citable.`,
    url: "https://bkk.nonarkara.org/datasets",
  },
};

function anchorFor(file: string): string {
  return file.replace(/[/.]/g, "-").replace(/^-/, "");
}

function formatBytes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} MB`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} KB`;
  return `${n} B`;
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "DataCatalog",
  name: "BKKx open data",
  description:
    "The public datasets behind Bangkok's BKKx heritage system: the Fine Arts Department register resolved to building precision, the rowhouse and shophouse atlases, curated 3D monument parts and the POI layers.",
  url: "https://bkk.nonarkara.org/datasets",
  creator: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
  dataset: DATASETS.map((d) => ({
    "@type": "Dataset",
    name: d.title,
    description: d.what,
    contentUrl: `https://bkk.nonarkara.org${d.file}`,
    license: d.license,
    isBasedOn: d.source,
  })),
};

export default function DatasetsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="register">
        <PlaceMasthead />

        <article className="datasets-lede">
          <p className="register-eyebrow">Open data</p>
          <h1>The datasets</h1>
          <p className="datasets-standfirst">
            Everything this project asserts, it asserts from a file you can
            download. This shelf is all of them — what each one is, where its
            facts come from, what re-use must honour, and the checksum that
            says the file you fetched is the file the site argues from.
          </p>
          <dl className="datasets-tally" aria-label="Catalogue totals">
            <div>
              <dt>datasets</dt>
              <dd>{DATASETS.length}</dd>
            </div>
            <div>
              <dt>features</dt>
              <dd>{totalFeatures.toLocaleString("en-US")}</dd>
            </div>
            <div>
              <dt>on the wire</dt>
              <dd>{formatBytes(totalBytes)}</dd>
            </div>
            <div>
              <dt>measured</dt>
              <dd>every build</dd>
            </div>
          </dl>
          <p className="datasets-note">
            Checksums are SHA-256 of the served file, computed at build time —
            the catalogue fails the build if a served dataset is missing from
            this page or a listed file is missing from disk. OSM-derived
            geometry is ODbL and stays ODbL; the licence line on each entry is
            the one that binds.
          </p>
          <nav className="datasets-index" aria-label="Jump to a dataset">
            {DATASETS.map((d) => (
              <a key={d.file} href={`#${anchorFor(d.file)}`}>
                {d.title}
              </a>
            ))}
          </nav>
        </article>

        <section className="datasets-shelf" aria-label="Dataset catalogue">
          {DATASETS.map((d) => {
            const m = manifest[d.file];
            return (
              <article key={d.file} className="datasets-entry" id={anchorFor(d.file)}>
                <header>
                  <h2>
                    <a href={d.file} download>
                      {d.title}
                    </a>
                  </h2>
                  <p className="datasets-measure">
                    <span>{formatBytes(m.bytes)}</span>
                    {m.features !== null ? (
                      <span>
                        {m.features.toLocaleString("en-US")}{" "}
                        {m.kinds.length ? m.kinds.join(" + ").toLowerCase() : "records"}
                      </span>
                    ) : null}
                    <code title={`sha256 ${m.sha256}`}>{m.sha256.slice(0, 12)}</code>
                  </p>
                </header>
                <p className="datasets-what">{d.what}</p>
                <dl className="datasets-provenance">
                  <div>
                    <dt>Source</dt>
                    <dd>{d.source}</dd>
                  </div>
                  <div>
                    <dt>Licence</dt>
                    <dd>{d.license}</dd>
                  </div>
                  <div>
                    <dt>Regenerated by</dt>
                    <dd>
                      {d.generator ? (
                        <a
                          href={`https://github.com/Nonarkara/BKKx/blob/main/${d.generator}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <code>{d.generator}</code>
                        </a>
                      ) : (
                        <em>maintained outside this repo — the file, its version field and this checksum are the record</em>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>In use at</dt>
                    <dd className="datasets-usedby">
                      {d.usedBy.map((u) =>
                        u.includes(":") ? (
                          <code key={u}>{u}</code>
                        ) : (
                          <Link key={u} href={u}>
                            <code>{u}</code>
                          </Link>
                        ),
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Cite as</dt>
                    <dd className="datasets-cite-row">
                      <code className="datasets-citation">{citationFor(d)}</code>
                      <CopyCitation text={citationFor(d)} />
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </section>

        <footer className="datasets-foot">
          <p>
            Corrections welcome through{" "}
            <a href="https://github.com/Nonarkara/BKKx/issues" target="_blank" rel="noreferrer">
              GitHub Issues
            </a>
            . The shophouse pressure figures have their own page at{" "}
            <Link href="/shophouses/atlas">/shophouses/atlas</Link>; the
            register&apos;s method is documented in{" "}
            <Link href="/heritage">the register</Link> itself.
          </p>
        </footer>
      </div>
    </>
  );
}
