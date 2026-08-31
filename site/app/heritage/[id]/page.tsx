import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PlaceMasthead } from "../../PlaceMasthead";
import { PlaceMap } from "../../PlaceMap";
import { MonumentStatus } from "../../walks/MonumentStatus";
import { CopyCitation } from "../../datasets/CopyCitation";
import {
  REGISTER_SITES,
  REGISTER_SOURCE,
  REGISTER_COUNTS,
  REGISTER_WORLDS,
  citationForSite,
  describeLocation,
  districtCount,
  isPinned,
  locationVerdict,
  MATCH_MEANING,
  nearestPinned,
  parseLocatedBy,
  siteById,
  type RegisterSite,
} from "../../data/heritage-register";

/* One page per entry in the Fine Arts Department register — all 571.
 *
 * Until now the register was addressable only as a whole: /heritage#register
 * loaded 1.3 MB of JSON into a map and let you click. Nothing could be
 * linked to, cited, or argued with. A conservation officer who wanted to
 * point at one monument had no URL to point at, and the provenance this
 * project spends most of its effort computing — how each pin was
 * established, and how good that evidence is — was a raw string inside a
 * popup.
 *
 * These pages exist to make that provenance the subject rather than a
 * footnote. Every page leads with how the record was located, hands over
 * the OpenStreetMap object id when a relocation was involved so the claim
 * can be checked by someone who does not trust it, and — for the 260
 * entries that could not be located at all — renders no map and explains
 * why instead of drawing a pin nobody can defend.
 *
 * Everything on the page is read from public/heritage-register.json, which
 * scripts/build-heritage-register.py writes. Nothing is restated by hand.
 */

type Params = { id: string };
type Props = { params: Promise<Params> };

export function generateStaticParams(): Params[] {
  return REGISTER_SITES.map((s) => ({ id: s.id }));
}

/** Only ids the register actually contains — no on-demand rendering of guesses. */
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const site = siteById(id);
  if (!site) return { title: "Register entry not found" };
  const status = site.registered ? "gazetted" : "awaiting consideration";
  const where = [site.subDistrict, site.district].filter(Boolean).join(", ");
  return {
    title: `${site.name} · register entry ${site.id}`,
    description: `${site.name} — Fine Arts Department register entry ${site.id}, ${where}. ${status.charAt(0).toUpperCase()}${status.slice(1)}; ${site.precision === "building" ? "pinned to building precision" : "listed at district precision, not pinned"}.`,
    alternates: { canonical: `/heritage/${site.id}` },
    openGraph: {
      title: `${site.name} — Bangkok heritage register · BKKxC(ulture)`,
      description: `Register entry ${site.id}, ${where}. ${status}.`,
      url: `/heritage/${site.id}`,
    },
  };
}

/** Metres of positional slack the record's own precision admits. */
const PRECISION_NOTE: Record<RegisterSite["precision"], string> = {
  building:
    "Building precision — the coordinate names a structure, not a neighbourhood.",
  district:
    "District precision — the register's published coordinate for this row rounds to about a kilometre, which is a district, not a building.",
};

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
}

export default async function RegisterEntry({ params }: Props) {
  const { id } = await params;
  const site = siteById(id);
  if (!site) notFound();

  const method = parseLocatedBy(site.locatedBy);
  const pinned = isPinned(site);
  const neighbours = pinned ? nearestPinned(site, 5) : [];
  const world = site.world ? REGISTER_WORLDS[site.world] : undefined;
  const inDistrict = districtCount(site.district);
  const citation = citationForSite(site);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LandmarksOrHistoricalBuildings",
    name: site.name,
    identifier: site.id,
    url: `https://bkk.nonarkara.org/heritage/${site.id}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: site.district,
      addressRegion: "Bangkok",
      addressCountry: "TH",
      ...(site.road ? { streetAddress: site.road } : {}),
    },
    ...(pinned
      ? { geo: { "@type": "GeoCoordinates", latitude: site.lat, longitude: site.lon } }
      : {}),
    isBasedOn: REGISTER_SOURCE.dataset,
    license: "https://creativecommons.org/licenses/by/4.0/",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="register">
        <PlaceMasthead />

        <article className="register-lede mrec-head">
          <p className="register-eyebrow">
            Register entry · <span className="mrec-id">{site.id}</span>
          </p>
          <h1 lang="th">{site.name}</h1>
          <p className="mrec-verdict">{locationVerdict(site)}</p>
          <p className="mrec-where">
            <span
              className={site.registered ? "seal is-gazetted" : "seal is-awaiting"}
              aria-hidden="true"
            />
            <MonumentStatus registered={site.registered} />
            <span className="mrec-where-sep">·</span>
            <span lang="th">{site.registerStatus}</span>
            <span className="mrec-where-sep">·</span>
            <span lang="th">
              {[site.road, site.subDistrict, site.district].filter(Boolean).join(" · ")}
            </span>
          </p>
        </article>

        <div className="register-explorer mrec-body">
          {/* ---- the headline: how this record was located ---- */}
          <section className="mrec-prov" aria-labelledby="mrec-prov-h">
            <h2 id="mrec-prov-h">How this record was located</h2>
            <p className="mrec-prov-lead">{describeLocation(site)}</p>

            <dl className="register-facts mrec-facts">
              <dt>Precision held</dt>
              <dd>
                {site.precision}
                <small>{PRECISION_NOTE[site.precision]}</small>
              </dd>

              <dt>Method</dt>
              <dd>
                <code>{site.locatedBy}</code>
                {method.kind === "osm" ? (
                  <small>
                    Match quality <b>{method.match}</b> — {MATCH_MEANING[method.match]}.{" "}
                    <a href={method.url} target="_blank" rel="noreferrer">
                      Check {method.osmType} {method.osmId} on OpenStreetMap ↗
                    </a>
                  </small>
                ) : null}
                {method.kind === "fine-arts" ? (
                  <small>
                    No relocation was performed on this row; the position is the
                    department&apos;s own.
                  </small>
                ) : null}
              </dd>

              {pinned ? (
                <>
                  <dt>Coordinate</dt>
                  <dd className="mrec-coord">
                    {site.lat.toFixed(6)}, {site.lon.toFixed(6)}
                    <small>WGS 84. Cite this position at the precision above, not beyond it.</small>
                  </dd>
                </>
              ) : null}

              <dt>Source dataset</dt>
              <dd>
                <span lang="th">{REGISTER_SOURCE.name}</span>
                <small>
                  {REGISTER_SOURCE.nameEn} · {REGISTER_SOURCE.licence}
                  {REGISTER_SOURCE.retrieved ? ` · retrieved ${REGISTER_SOURCE.retrieved}` : ""} ·{" "}
                  <a href={REGISTER_SOURCE.dataset} target="_blank" rel="noreferrer">
                    data.go.th ↗
                  </a>
                </small>
              </dd>

              {method.kind === "osm" ? (
                <>
                  <dt>Position attribution</dt>
                  <dd>
                    {REGISTER_SOURCE.osmAttribution}
                    <small>
                      The register supplies the monument and its status; OpenStreetMap
                      supplies where this one sits.
                    </small>
                  </dd>
                </>
              ) : null}
            </dl>
          </section>

          {/* ---- legal status ---- */}
          <section className="mrec-gazette" aria-labelledby="mrec-gazette-h">
            <h2 id="mrec-gazette-h">Legal status</h2>
            {site.gazette ? (
              <>
                <p className="mrec-prov-lead">
                  Gazetted. Protection is in force under the Ancient Monuments Act, announced in
                  the Royal Gazette:
                </p>
                <dl className="register-facts mrec-facts">
                  <dt>เล่ม · Volume</dt>
                  <dd>{site.gazette.volume}</dd>
                  <dt>ตอน · Part</dt>
                  <dd lang="th">{site.gazette.part}</dd>
                  <dt>วันที่ · Date</dt>
                  <dd>{site.gazette.date}</dd>
                  <dt>เรื่อง · Topic</dt>
                  <dd lang="th">{site.gazette.topic}</dd>
                </dl>
              </>
            ) : (
              <p className="mrec-prov-lead">
                Not gazetted. The register lists this entry as{" "}
                <span lang="th">{site.registerStatus}</span> — awaiting consideration for
                registration. Nothing legally prevents its demolition today. It is one of{" "}
                {REGISTER_COUNTS.awaiting.toLocaleString("en-US")} entries in that state, against{" "}
                {REGISTER_COUNTS.registered.toLocaleString("en-US")} with protection in force.
              </p>
            )}
          </section>

          {/* ---- where, or why not ---- */}
          {pinned ? (
            <section className="mrec-map-section" aria-labelledby="mrec-map-h">
              <h2 id="mrec-map-h">Where it stands</h2>
              <PlaceMap
                center={[site.lon, site.lat]}
                zoom={16}
                markers={[
                  {
                    lat: site.lat,
                    lon: site.lon,
                    label: site.name,
                    muted: !site.registered,
                  },
                ]}
              />
              <p className="register-caption">
                One monument, at the precision this record actually holds. Base map ©
                OpenStreetMap contributors.
              </p>
            </section>
          ) : (
            <section className="mrec-unpinned" aria-labelledby="mrec-unpinned-h">
              <h2 id="mrec-unpinned-h">There is no map on this page</h2>
              <p>
                Drawing a pin here would be a guess dressed as a fact. The register publishes
                many Bangkok coordinates to two decimal places — about 1.1 km, which is a
                district, not a building. Rows like this one are relocated by matching the
                monument&apos;s name against OpenStreetMap; nothing matched this name, so it
                keeps district precision and gets no position.
              </p>
              <p>
                This entry is one of {REGISTER_COUNTS.districtPrecision.toLocaleString("en-US")}{" "}
                that stayed unpinned —{" "}
                {Math.round((REGISTER_COUNTS.districtPrecision / REGISTER_COUNTS.total) * 100)}% of
                the register. If you know where <span lang="th">{site.name}</span> actually stands,
                the fastest way to fix this record is to name it in OpenStreetMap; the next build
                of the register will find it by name and pin it here automatically.
              </p>
            </section>
          )}

          {/* ---- what the register says about it ---- */}
          {site.history || site.blurb ? (
            <section className="mrec-prose" aria-labelledby="mrec-prose-h">
              <h2 id="mrec-prose-h">What the register records</h2>
              {site.history ? (
                <>
                  <h3>ประวัติ · History</h3>
                  <p lang="th">{site.history}</p>
                </>
              ) : null}
              {site.artCulture ? (
                <>
                  <h3>ศิลปกรรม · Art and architecture</h3>
                  <p lang="th">{site.artCulture}</p>
                </>
              ) : null}
              {site.present ? (
                <>
                  <h3>สภาพปัจจุบัน · Present condition</h3>
                  <p lang="th">{site.present}</p>
                </>
              ) : null}
              {site.blurb ? (
                <>
                  <p lang="th">{site.blurb}</p>
                  {site.blurbTruncated ? (
                    <p className="mrec-truncation">
                      Truncated. BKKx keeps the full Thai record only for monuments inside the two
                      walkable worlds; for the rest it stores the opening 220 characters. The
                      complete text is in the source dataset — this is a limit of our extract, not
                      of the register.
                    </p>
                  ) : null}
                </>
              ) : null}
            </section>
          ) : (
            <section className="mrec-prose" aria-labelledby="mrec-prose-h">
              <h2 id="mrec-prose-h">What the register records</h2>
              <p className="mrec-truncation">
                The register carries no history text for this entry — only its name, its place and
                its status. That silence is the department&apos;s, not ours.
              </p>
            </section>
          )}

          {/* ---- the walkable world ---- */}
          {world && site.block ? (
            <section className="mrec-world" aria-labelledby="mrec-world-h">
              <h2 id="mrec-world-h">You can walk to it</h2>
              <p>
                This monument falls inside <b>{world.title}</b>, one of two generated Minecraft
                worlds, so it has a block coordinate as well as a geographic one.
              </p>
              <p className="mrec-block">
                <code>
                  /tp {site.block.x} {world.spawnY ?? "~"} {site.block.z}
                </code>
              </p>
              <p>
                <Link href="/worlds">Download the world ↗</Link> · one of{" "}
                {world.siteCount.toLocaleString("en-US")} register monuments standing in it.
              </p>
            </section>
          ) : null}

          {/* ---- neighbours ---- */}
          {neighbours.length ? (
            <section className="mrec-near" aria-labelledby="mrec-near-h">
              <h2 id="mrec-near-h">Nearest pinned monuments</h2>
              <ol className="mrec-near-list">
                {neighbours.map((n) => (
                  <li key={n.id}>
                    <span className="mrec-near-dist">{formatDistance(n.distanceM)}</span>
                    <Link href={`/heritage/${n.id}`} lang="th">
                      {n.name}
                    </Link>
                    <small>
                      <MonumentStatus registered={n.registered} /> · <span lang="th">{n.district}</span>
                    </small>
                  </li>
                ))}
              </ol>
              <p className="register-caption">
                Straight-line distance between recorded positions. Only the{" "}
                {REGISTER_COUNTS.buildingPrecision.toLocaleString("en-US")} pinned entries can
                appear here; the unpinned ones may well be closer.
              </p>
            </section>
          ) : null}

          {/* ---- cite ---- */}
          <section className="mrec-cite" aria-labelledby="mrec-cite-h">
            <h2 id="mrec-cite-h">Cite this record</h2>
            <div className="mrec-cite-row">
              <code className="datasets-citation">{citation}</code>
              <CopyCitation text={citation} />
            </div>
            <p className="register-caption">
              {inDistrict.toLocaleString("en-US")}{" "}
              {inDistrict === 1 ? "entry sits" : "entries sit"} in{" "}
              <span lang="th">{site.district}</span> ·{" "}
              <Link href="/heritage#register">back to the register, mapped</Link> ·{" "}
              <Link href="/datasets">every dataset behind this page</Link>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
