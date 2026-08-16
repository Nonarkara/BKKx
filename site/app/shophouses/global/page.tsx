import type { Metadata } from "next";
import Link from "next/link";
import { GlobalMap } from "./GlobalMap";
import {
  TOWNS,
  ORIGIN_PORTS,
  MIGRATION_ROUTES,
  GLOBAL_COUNTS,
  type Town,
} from "../../data/shophouse-global";

export const metadata: Metadata = {
  title: "Global Research · Shophouse Metropolis",
  description:
    "The shophouse outside Bangkok — UNESCO sites, migration vectors from southern China, and what the comparative literature actually says about overtourism, gentrification and the family firm. Sourced, not asserted.",
  alternates: { canonical: "/shophouses/global" },
  openGraph: {
    title: "Global Research — the shophouse outside Bangkok",
    description:
      "Where the type went, who carried it, and what the towns are like 200 years later. 14 places, 5 Chinese origin ports, 9 dated migration vectors.",
    url: "/shophouses/global",
  },
};

const VERDICT_ORDER: Town["impact"]["verdict"][] = [
  "family-firm surviving",
  "gentrified",
  "overtouristed",
  "transformed",
  "frozen",
  "abandoned",
  "research-stage",
];

const VERDICT_BLURB: Record<Town["impact"]["verdict"], string> = {
  "family-firm surviving":
    "Stock still in the hands of long-resident merchant or trading families, with continuity of ground-floor commercial use.",
  gentrified:
    "Stock preserved but rent and use have shifted to hospitality, retail or creative-industry tenants; measurable displacement of long-resident community.",
  overtouristed:
    "Visitor-to-resident ratio has crossed a threshold where day-trip volume changes the town's character; ticketing, tourist-retail or museumification common.",
  transformed:
    "The shophouse form survives but the trading community that built it has been replaced by another economy entirely.",
  frozen:
    "UNESCO or national listing has halted change to the building stock, with mixed effect on the resident community.",
  abandoned:
    "Stock no longer in active use, at scale.",
  "research-stage":
    "The shophouse form is documented in the academic literature but the social-impact record is still being written; verdict provisional.",
};

export default function GlobalPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            headline: "Global Research — the shophouse outside Bangkok",
            alternativeHeadline:
              "UNESCO sites, migration vectors from southern China, and the comparative literature on overtourism, gentrification and the family firm.",
            author: { "@type": "Person", name: "Non Arkara", url: "https://nonarkara.org" },
            isPartOf: {
              "@type": "Book",
              name: "Shophouse Metropolis",
              publisher: "Harvard University Graduate School of Design",
            },
            about: [
              "Shophouse", "Chinese diaspora", "Maritime Silk Road",
              "Overtourism", "UNESCO World Heritage", "Adaptive reuse",
              "Southeast Asia", "Fujian", "Guangdong", "Hoi An",
              "George Town", "Melaka", "Vigan", "Pingyao", "Lijiang",
            ],
            keywords: TOWNS.map((t) => t.name).join(", "),
            dateModified: new Date().toISOString().slice(0, 10),
          }),
        }}
      />
      <div className="shophouse-essay">
        <header className="sh-masthead">
        <Link href="/shophouses" className="sh-wordmark">
          Shophouse<em>Metropolis</em>
        </Link>
        <nav aria-label="Global">
          <a href="#map">Map</a>
          <a href="#origins">Origins</a>
          <a href="#routes">Routes</a>
          <a href="#places">Places</a>
          <a href="#verdicts">Verdicts</a>
          <Link href="/shophouses">Essay</Link>
          <Link href="/shophouses/bible">Bible</Link>
          <Link href="/shophouses/research">Sources</Link>
        </nav>
      </header>

      <article className="sh-lede">
        <p className="sh-eyebrow">Global research</p>
        <h1>The shophouse outside Bangkok</h1>
        <p className="sh-subtitle">
          Four UNESCO World Heritage towns, ten more in the comparative
          literature, five Chinese origin ports and the dated vectors between
          them — with a verdict on every one.
        </p>
        <p className="sh-byline">
          The Bangkok shophouse is a regional instance of a Maritime Silk Road
          typology. The other instances have been studied for longer, more
          deeply, and in more cases of overtourism. This page is the map and
          the verdict the next essay will need.
        </p>
        <p className="sh-fig-note">
          Coordinates cross-checked against UNESCO listing data and the
          GeoNames database. Social-impact verdicts cite peer-reviewed work
          where it exists; the "research-stage" label is honest about where
          it does not. Photos are Wikimedia Commons (CC BY / BY-SA) and are
          linked, not hosted, so the file is yours to re-use.
        </p>
      </article>

      <div className="sh-body sh-research-page">
        <div className="sh-prose">
          {/* ------------------ summary stats ------------------ */}
          <h2 id="summary">The numbers at a glance</h2>
          <ul className="sh-global-stats">
            <li>
              <strong>{TOWNS.length}</strong>
              <span>towns profiled</span>
            </li>
            <li>
              <strong>{GLOBAL_COUNTS.unesco}</strong>
              <span>UNESCO World Heritage</span>
            </li>
            <li>
              <strong>{GLOBAL_COUNTS.national}</strong>
              <span>national register</span>
            </li>
            <li>
              <strong>{GLOBAL_COUNTS.countries}</strong>
              <span>countries</span>
            </li>
            <li>
              <strong>{ORIGIN_PORTS.length}</strong>
              <span>Chinese origin ports</span>
            </li>
            <li>
              <strong>{MIGRATION_ROUTES.length}</strong>
              <span>dated migration vectors</span>
            </li>
            <li>
              <strong>
                {GLOBAL_COUNTS.verdicts.overtouristed ?? 0}
              </strong>
              <span>overtouristed</span>
            </li>
            <li>
              <strong>{GLOBAL_COUNTS.verdicts.gentrified ?? 0}</strong>
              <span>gentrified</span>
            </li>
          </ul>

          {/* ------------------ the map ------------------ */}
          <h2 id="map">The map</h2>
          <p>
            Equirectangular projection, southern China and the South China Sea
            to the Indonesian archipelago. The square markers are origin
            ports in Fujian and Guangdong — the actual coastal cities the
            diaspora left from. The round markers are the receiving towns,
            colour-coded by protection tier. The dashed arcs are the dated
            migration vectors, each one a real community's century of
            movement.
          </p>
          <GlobalMap />

          <h2 id="origins">Where it starts</h2>
          <p>
            The shophouse is not a single Chinese form transported whole — it
            is a deep-narrow commercial-residential plan that emerged in
            several southern Chinese coastal cities, was formalised under
            British colonial planning in Singapore (Raffles, 1822) and then
            hybridised in every port it reached. The five below are the
            archaeological roots.
          </p>
          <dl className="sh-global-origins">
            {ORIGIN_PORTS.map((p) => (
              <div key={p.id}>
                <dt>
                  <span className="sh-global-origin-square" aria-hidden="true" />
                  {p.name} <small>({p.province})</small>
                </dt>
                <dd>
                  <p className="sh-global-origin-community">{p.community}</p>
                  <p>{p.note}</p>
                  <p className="sh-fig-note">
                    {p.sources.map((s, i) => (
                      <span key={s.url}>
                        {i > 0 && " · "}
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.label}
                        </a>
                      </span>
                    ))}
                  </p>
                </dd>
              </div>
            ))}
          </dl>

          <h2 id="routes">How it moved</h2>
          <p>
            Each vector below is dated and attributed. They are not
            decorative arrows — the dating is the load-bearing claim, because
            the comparative literature depends on which community reached
            which port when, and on what they found when they got there.
          </p>
          <ol className="sh-global-routes">
            {MIGRATION_ROUTES.map((r) => {
              const from = ORIGIN_PORTS.find((o) => o.id === r.from);
              const to = TOWNS.find((t) => t.id === r.to);
              if (!from || !to) return null;
              return (
                <li key={r.id}>
                  <p className="sh-global-route-arc">
                    <strong>{from.name}</strong> &rarr; <strong>{to.name}</strong>
                    <small> · {r.period} · {r.community}</small>
                  </p>
                  <p>{r.note}</p>
                  <p className="sh-fig-note">
                    <a href={r.source.url} target="_blank" rel="noreferrer">
                      {r.source.label}
                    </a>
                  </p>
                </li>
              );
            })}
          </ol>

          {/* ------------------ the towns ------------------ */}
          <h2 id="places">The places</h2>
          <p>
            Fourteen towns, each with a photo, a description of the local
            form, and a verdict on what the type is like there now. The
            order is by protection tier (UNESCO first), then alphabetical.
          </p>
          <div className="sh-global-towns">
            {TOWNS.map((t) => (
              <article key={t.id} className="sh-global-town">
                {t.photo ? (
                  <a
                    className="sh-global-town-photo"
                    href={t.photo.url.replace(/\/thumb\//, "/").replace(/\/\d+px-/, "/")}
                    target="_blank"
                    rel="noreferrer"
                    title={t.photo.credit}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.photo.url}
                      alt={t.photo.caption}
                      loading="lazy"
                    />
                    <span className="sh-global-town-photo-credit">
                      {t.photo.credit}
                    </span>
                  </a>
                ) : (
                  <div className="sh-global-town-photo is-empty">
                    <span>No photo on file</span>
                  </div>
                )}
                <div className="sh-global-town-body">
                  <header>
                    <h3>{t.name}</h3>
                    <p className="sh-global-town-meta">
                      {t.country} · {t.protection === "UNESCO" ? "UNESCO" : t.protection}
                      {" · "}
                      {t.period}
                    </p>
                  </header>
                  <p className="sh-global-town-kind">
                    <em>{t.kind}</em>
                    {t.community ? ` · ${t.community}` : ""}
                  </p>
                  <p>{t.description}</p>
                  <p
                    className={`sh-global-town-verdict is-${t.impact.verdict}`}
                  >
                    <strong>Verdict — {verdictLabel(t.impact.verdict)}.</strong>{" "}
                    {t.impact.body}
                  </p>
                  <p className="sh-fig-note">
                    {t.sources.map((s, i) => (
                      <span key={s.url}>
                        {i > 0 && " · "}
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.label}
                        </a>
                      </span>
                    ))}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {/* ------------------ verdicts ------------------ */}
          <h2 id="verdicts">The verdicts, by frequency</h2>
          <p>
            The same verdict applies to most places, which is itself the
            finding. Overtourism and gentrification are not separate stories
            — they are the standard outcome of heritage listing under
            tourism demand, and the few places that have not gone down that
            road are the ones that have not yet been listed.
          </p>
          <ol className="sh-global-verdicts">
            {VERDICT_ORDER.filter((v) => GLOBAL_COUNTS.verdicts[v] > 0).map(
              (v) => (
                <li key={v}>
                  <p className="sh-global-verdict-label">
                    {verdictLabel(v)}{" "}
                    <small>
                      {GLOBAL_COUNTS.verdicts[v]} of {TOWNS.length}
                    </small>
                  </p>
                  <p>{VERDICT_BLURB[v]}</p>
                </li>
              ),
            )}
          </ol>

          {/* ------------------ what this is not ------------------ */}
          <h2 id="limits">What this is not</h2>
          <p>
            A travel guide. Every photo is Wikimedia Commons and every
            social-impact claim is peer-reviewed or grey-literature sourced;
            what is not sourced is marked as research-stage, which is the
            honest description of the four places that have not been studied
            at the depth the others have. The list is also not complete:
            the comparative literature also includes Phnom Penh, Saigon,
            Rangoon, Semarang and the smaller Peranakan towns of Java and
            Sumatra, all of which would extend the table but are not on it
            because the primary records for each are harder to verify in one
            sitting. They are the next page.
          </p>
        </div>
      </div>

      <footer className="sh-footer">
        <p>
          <strong>Global Research</strong> — the shophouse outside Bangkok.
          Compiled for Shophouse Metropolis, Harvard Graduate School of
          Design. The verdict on every place is the one a researcher should
          be able to defend; where the literature does not yet support one,
          the page says so.
        </p>
        <p>
          <Link href="/shophouses">← The essay</Link> ·{" "}
          <Link href="/shophouses/bible">The Bible</Link> ·{" "}
          <Link href="/shophouses/research">Bibliography</Link>
        </p>
      </footer>
      </div>
    </>
  );
}

function verdictLabel(v: Town["impact"]["verdict"]): string {
  return v
    .split(/[- ]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}
