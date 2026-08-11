import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceMasthead } from "../../PlaceMasthead";
import { PlaceMap } from "../../PlaceMap";
import {
  WALKS,
  areaBySlug,
  walkBySlug,
  walkDistance,
  type Gazette,
} from "../../data/heritage-content";

function gazetteYear(g: Gazette | undefined): number | null {
  const year = Number(g?.date.split("/")[2]);
  return Number.isFinite(year) && year > 1800 ? year : null;
}

function paceLabel(distanceM: number, durationMin: number): string {
  const kmh = distanceM / 1000 / (durationMin / 60);
  return `${kmh.toFixed(1)} km/h`;
}

type Params = { slug: string };
type Props = { params: Promise<Params> };

export function generateStaticParams(): Params[] {
  return WALKS.map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const walk = walkBySlug(slug);
  if (!walk) return { title: "Walk not found" };
  return {
    title: `${walk.name} · heritage walk`,
    description: walk.intro,
    alternates: { canonical: `/walks/${walk.slug}` },
    openGraph: {
      title: `${walk.name} — a Bangkok heritage walk · BKKxC(ulture)`,
      description: walk.intro,
      url: `/walks/${walk.slug}`,
    },
  };
}

export default async function WalkPage({ params }: Props) {
  const { slug } = await params;
  const walk = walkBySlug(slug);
  if (!walk) notFound();

  const areas = walk.areas
    .map((a) => areaBySlug(a))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const distance = walkDistance(walk);
  const stats = walk.stats;
  const thisYear = new Date().getFullYear();

  return (
    <div className="register">
      <PlaceMasthead />

      <article className="register-lede place-page">
        <p className="register-eyebrow">
          Heritage walk · {walk.pattern}
        </p>
        <h1>
          {walk.name}
          <small lang="th">{walk.thai}</small>
        </h1>

        <dl className="walk-facts">
          <div>
            <dt>Stops</dt>
            <dd>{walk.stops.length}</dd>
          </div>
          {distance ? (
            <div>
              <dt>Distance</dt>
              <dd>{distance}</dd>
            </div>
          ) : null}
          {walk.durationMin ? (
            <div>
              <dt>On foot</dt>
              <dd>~{walk.durationMin} min</dd>
            </div>
          ) : null}
          <div>
            <dt>Mode</dt>
            <dd>{walk.mode === "bike" ? "Bicycle" : "Walking"}</dd>
          </div>
        </dl>

        <div className="register-intro">
          <p>{walk.intro}</p>
        </div>
      </article>

      <section className="register-explorer place-page">
        <PlaceMap
          center={[walk.stops[0].lon, walk.stops[0].lat]}
          zoom={14}
          fit
          routeSlug={walk.slug}
          markers={walk.stops.map((s, i) => ({
            lat: s.lat,
            lon: s.lon,
            label: s.name,
            n: i + 1,
          }))}
        />
        <p className="register-caption">
          The line is a real street-following walking route (OSRM foot profile, ©
          OpenStreetMap contributors)
          {distance ? ` — ${distance}${walk.durationMin ? `, about ${walk.durationMin} minutes at walking pace` : ""}` : ""}
          . Follow the numbers.
        </p>

        <div className="walk-stats">
          <h2>By the numbers</h2>
          <dl>
            {stats.citedInRegister > 0 ? (
              <div>
                <dt>On the Fine Arts register</dt>
                <dd>
                  {stats.gazetted} gazetted
                  {stats.awaitingConsideration
                    ? `, ${stats.awaitingConsideration} awaiting consideration`
                    : ""}
                </dd>
              </div>
            ) : null}
            {stats.oldestGazetteYear ? (
              <div>
                <dt>Oldest gazette entry on this walk</dt>
                <dd>
                  {stats.oldestGazetteYear}
                  <small>
                    {" "}
                    — {thisYear - stats.oldestGazetteYear} years ago
                    {stats.newestGazetteYear && stats.newestGazetteYear !== stats.oldestGazetteYear
                      ? `, newest ${stats.newestGazetteYear}`
                      : ""}
                  </small>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Walkable in Minecraft</dt>
              <dd>
                {stats.walkable} of {walk.stops.length} stops
              </dd>
            </div>
            {walk.distanceM && walk.durationMin ? (
              <div>
                <dt>Pace</dt>
                <dd>{paceLabel(walk.distanceM, walk.durationMin)}</dd>
              </div>
            ) : null}
            {stats.longestLegM && stats.shortestLegM ? (
              <div>
                <dt>Longest / shortest leg</dt>
                <dd>
                  {stats.longestLegM} m / {stats.shortestLegM} m
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        <ol className="walk-stops">
          {walk.stops.map((stop, i) => (
            <li key={stop.name} id={`stop-${i + 1}`}>
              <span className="walk-stop-n" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <h2>
                  {stop.name}
                  {stop.thai ? <small lang="th">{stop.thai}</small> : null}
                </h2>
                <p>{stop.note}</p>
                <p className="walk-stop-meta">
                  {stop.fad ? (
                    <>
                      Register {stop.fad.replace("fad-", "no. ")} ·{" "}
                      {stop.registered ? "gazetted" : "awaiting consideration"} ·{" "}
                    </>
                  ) : null}
                  {stop.approx
                    ? "position approximate — " + (stop.approxWhy ?? "hand-placed")
                    : `${stop.lat.toFixed(5)}, ${stop.lon.toFixed(5)}`}
                  {stop.tp ? (
                    <>
                      {" "}· in Minecraft: <code>{stop.tp}</code>
                    </>
                  ) : null}
                </p>
                <p className="walk-stop-numbers">
                  {(() => {
                    const year = gazetteYear(stop.gazette);
                    return year ? (
                      <span>
                        Gazetted {year} · {thisYear - year} years ago
                      </span>
                    ) : null;
                  })()}
                  {stop.distanceFromPrevM ? (
                    <span>
                      {stop.distanceFromPrevM} m from stop {i}
                      {stop.durationFromPrevMin ? ` · ${stop.durationFromPrevMin} min walk` : ""}
                    </span>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {areas.length ? (
          <div className="place-walks">
            <h2>The quarters this walk crosses</h2>
            <ul>
              {areas.map((a) => (
                <li key={a.slug}>
                  <Link href={`/areas/${a.slug}`}>{a.name}</Link>
                  <small>{a.tagline}</small>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
