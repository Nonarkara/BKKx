import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceMasthead } from "../../PlaceMasthead";
import { PlaceMap } from "../../PlaceMap";
import { AreaProse, AreaTagline } from "../AreaProse";
import { QuestSpots } from "../QuestSpots";
import { MonumentStatus } from "../../walks/MonumentStatus";
import {
  AREAS,
  areaBySlug,
  photoFor,
  walkBySlug,
  walkDistance,
} from "../../data/heritage-content";

type Params = { slug: string };
type Props = { params: Promise<Params> };

export function generateStaticParams(): Params[] {
  return AREAS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = areaBySlug(slug);
  if (!area) return { title: "Quarter not found" };
  return {
    title: `${area.name} · heritage quarter`,
    description: area.tagline,
    alternates: { canonical: `/areas/${area.slug}` },
    openGraph: {
      title: `${area.name} — Kuala Lumpur heritage · KLXxC(ulture)`,
      description: area.tagline,
      url: `/areas/${area.slug}`,
      images: photoFor(area.photo) ? [{ url: photoFor(area.photo)!.file }] : undefined,
    },
  };
}

export default async function AreaPage({ params }: Props) {
  const { slug } = await params;
  const area = areaBySlug(slug);
  if (!area) notFound();

  const photo = photoFor(area.photo);
  const walks = area.walks
    .map((w) => walkBySlug(w))
    .filter((w): w is NonNullable<typeof w> => Boolean(w));
  const pinned = area.monuments.filter((m) => m.lat && m.lon);

  return (
    <div className="register">
      <PlaceMasthead />

      <article className="register-lede place-page">
        <p className="register-eyebrow">
          Heritage quarter · <span lang="ms">{area.district}</span>
        </p>
        <h1>
          {area.name}
          <small lang="ms">{area.thai}</small>
        </h1>
        <AreaTagline area={area} />

        {photo ? (
          <figure className="register-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.file} alt={`${area.name} — ${area.tagline}`} loading="eager" />
            <figcaption>
              {area.name}. Photo: {photo.artist} ·{" "}
              <a href={photo.descriptionUrl} target="_blank" rel="noreferrer">
                Wikimedia Commons
              </a>{" "}
              · {photo.licence}.
            </figcaption>
          </figure>
        ) : null}

        <AreaProse area={area} />
      </article>

      <section className="register-explorer place-page">
        <PlaceMap
          center={area.center}
          zoom={area.zoom}
          markers={pinned.map((m) => ({
            lat: m.lat as number,
            lon: m.lon as number,
            label: m.name,
            muted: !m.registered,
          }))}
        />
        <p className="register-caption">
          Register monuments of the quarter — filled marks are gazetted, hollow marks
          await consideration. Positions from Jabatan Warisan Negara lists and named
          OSM landmarks, relocated where needed as documented on the{" "}
          <Link href="/heritage#register">register page</Link>.
        </p>

        <aside className="place-arrival" aria-labelledby="place-arrival-title">
          <div className="place-arrival-heading">
            <p className="register-eyebrow">Arrive in 3D</p>
            <h2 id="place-arrival-title">See the quarter on the atlas.</h2>
            <Link href={`/atlas/klcc?at=${area.center[0]},${area.center[1]},${area.zoom}`}>Open in 3D ↗</Link>
          </div>
          <p>No Rapid KL stop inventory is ingested on this branch. The 3D map is the orientation layer.</p>
        </aside>

        {area.monuments.length ? (
          <div className="place-monuments">
            <h2>On this register</h2>
            <ul>
              {area.monuments.map((m) => (
                <li key={m.fad}>
                  <span
                    className={m.registered ? "seal is-gazetted" : "seal is-awaiting"}
                    aria-hidden="true"
                  />
                  <span lang="ms">{m.name}</span>
                  <small>
                    <MonumentStatus registered={m.registered} />
                  </small>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="place-monuments">
            <h2>On this register</h2>
            <p className="place-none">
              Nothing here is gazetted on the 2007/2009/2012 lists pulled for this
              twin — this quarter&apos;s heritage is the fabric itself.
            </p>
          </div>
        )}

        {walks.length ? (
          <div className="place-walks">
            <h2>Walks through this quarter</h2>
            <ul>
              {walks.map((w) => (
                <li key={w.slug}>
                  <Link href={`/walks/${w.slug}`}>{w.name}</Link>
                  <small>
                    {w.pattern} · {w.stops.length} stops
                    {walkDistance(w) ? ` · ${walkDistance(w)}` : ""}
                    {w.mode === "bike" ? " · by bicycle" : ""}
                  </small>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <QuestSpots areaSlug={area.slug} />
      </section>
    </div>
  );
}
