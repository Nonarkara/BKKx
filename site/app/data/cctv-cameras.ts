// Curated live cameras for the war room rail.
//
// These are hand-entered public live streams, as distinct from the cameras
// that arrive at runtime from CCTV_SOURCE_URL. Both feed the same rail.
//
// LOCATION DISCIPLINE. This file follows the same rule as the heritage
// register: a location is recorded at the precision actually known, with the
// method that established it. Four of the five cameras here carry real
// evidence (a stream title naming a soi, an operator's own listing) and are
// placed at that evidence's precision — never sharpened to a false
// exactness.
//
// Three streams arrived with no identifying evidence at all. Per an explicit
// operator decision (2026-08-30), those are not left pinless: each gets a
// `placeholder` marker — a shared, clearly-nominal Kuala Lumpur reference point,
// not a claim about where the camera actually is — so the tile has
// *somewhere* to sit while someone who recognises the footage confirms it.
// `place` stays null for a placeholder, so the tile still reads "Location
// not confirmed"; only the coordinate exists, as a stand-in. A true
// `unconfirmed` entry (no marker at all) remains available for a future
// camera with neither evidence nor an operator instruction to place it
// anyway.
//
// PRIVACY. Nothing here contacts Google on page load. The rail shows a poster
// image proxied through this site's own Worker, and the YouTube player is only
// constructed after a viewer clicks — through youtube-nocookie.com. That is
// the same reasoning applied to the weather feed: this project does not
// collect visitor IPs, so it should not silently hand them to a third party
// either. It also means four live players are never decoded at once.

export type Precision =
  /** Pinned to the camera's actual position. */
  | "exact"
  /** Known to the street or soi, not the building. */
  | "street"
  /** Known only to the district. */
  | "district"
  /** No evidence of the real location. Carries a shared, clearly-nominal
      Kuala Lumpur marker so the tile is not pinless, pending confirmation — the
      coordinate is a stand-in, not a claim. See LOCATION DISCIPLINE above. */
  | "placeholder"
  /** No coordinate recorded at all. */
  | "unconfirmed";

/** Precisions backed by real evidence — the register's own idea of
    "actually located", as distinct from a placeholder marker. */
const LOCATED_PRECISIONS: readonly Precision[] = ["exact", "street", "district"];

export function isLocated(c: Pick<CuratedCamera, "precision">): boolean {
  return LOCATED_PRECISIONS.includes(c.precision);
}

export type CameraKind =
  /** A YouTube live stream we may embed, played on demand. */
  | "youtube"
  /** A proprietary stream we link to rather than embed. Some operators
      do not licence their player for third-party embedding, and taking it
      anyway is not ours to do — so the tile sends the viewer to the
      operator's own page. */
  | "link";

export type CuratedCamera = {
  id: string;
  kind: CameraKind;
  /** YouTube video id, when kind is "youtube". Empty for link cameras. */
  videoId: string;
  /** What the stream is called, as published. */
  title: string;
  /** Human-readable place, or null when unconfirmed. */
  place: string | null;
  district: string | null;
  lat: number | null;
  lon: number | null;
  precision: Precision;
  /** How the location was established — the register's `locatedBy` idea. */
  locatedBy: string;
  sourceUrl: string;
};

// The nominal Kuala Lumpur reference point used for every `placeholder`
// camera — the same coordinate the weather feed uses for a citywide reading
// (worker/live.ts KUALA_LUMPUR). Reusing an already-documented generic point
// rather than inventing a new one keeps the "this is not real evidence"
// property visible: several cameras sharing one coordinate cannot be
// mistaken for several confirmed, distinct locations.
const PLACEHOLDER_MARKER = { lat: 3.139, lon: 101.6869 };

export const CURATED_CAMERAS: CuratedCamera[] = [
  {
    id: "yt-kl-skyline-live",
    kind: "youtube",
    videoId: "r5e4P91NjBw",
    title: "LIVE Cam KL Skyline Lofi Chillhop Music — Kuala Lumpur 24/7 (KL Skyline Live)",
    place: null,
    district: null,
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "channel describes a Petronas / KL Tower skyline view and a Tapo C325WB; the rooftop mount is unpublished. Video ids restart at 05:00 and 17:00 GMT+8, so this id will go stale; the channel link is the durable pointer. Placeholder marker, not a claimed rooftop.",
    sourceUrl: "https://www.youtube.com/watch?v=r5e4P91NjBw",
  },
  {
    id: "link-kl-skyline-channel",
    kind: "link",
    videoId: "",
    title: "KL Skyline Live — channel (restarts 05:00 and 17:00 GMT+8)",
    place: null,
    district: null,
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "no evidence of the camera mount; the channel is the durable public pointer. Placeholder marker, not a claimed rooftop.",
    sourceUrl: "https://www.youtube.com/channel/UCfVBWzBee1rnmR8AhT2Esng",
  },
  {
    id: "link-klccc",
    kind: "link",
    videoId: "",
    title: "KLCCC — DBKL Command & Control Centre public portal",
    place: null,
    district: null,
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "KLCCC publishes a public portal for city CCTV operations; individual camera endpoints and mounts are not a documented public JSON API. This twin does not invent DBKL stream URLs. Placeholder marker pending a licensed still or embed.",
    sourceUrl: "https://klccc.dbkl.gov.my/",
  },
  {
    id: "link-infobanjir",
    kind: "link",
    videoId: "",
    title: "JPS Public Info Banjir (WP Kuala Lumpur = WLH)",
    place: null,
    district: null,
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "not a street camera — the official flood information portal. Linked here because mayors ask where the water is. No public JSON API is documented; unofficial mirrors are not scraped. Placeholder marker, not a gauge.",
    sourceUrl: "https://publicinfobanjir.water.gov.my/",
  },
  {
    id: "yt-kl-skyline-night",
    kind: "youtube",
    videoId: "JI_7qlINVs4",
    title: "7 Sep 2026 Night | Kuala Lumpur KL Skyline 24/7 | Weather & Traffic Cam",
    place: null,
    district: null,
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "dated 12-hour archive from KL Skyline Live; mount unpublished. Placeholder marker, not a claimed rooftop. Prefer the channel link when this id 404s.",
    sourceUrl: "https://www.youtube.com/watch?v=JI_7qlINVs4",
  },
];

export const CAMERA_TALLY = {
  total: CURATED_CAMERAS.length,
  embedded: CURATED_CAMERAS.filter((c) => c.kind === "youtube").length,
  linked: CURATED_CAMERAS.filter((c) => c.kind === "link").length,
  located: CURATED_CAMERAS.filter(isLocated).length,
  // "awaiting a location" on the tile — placeholder and true-unconfirmed
  // both still need a human to confirm where the camera actually is.
  unconfirmed: CURATED_CAMERAS.filter((c) => !isLocated(c)).length,
};

/** Poster image, proxied so the page never calls Google before a click. */
export function posterFor(videoId: string): string {
  return `/api/live/camera-poster?v=${encodeURIComponent(videoId)}`;
}

/** The player, built only on demand. youtube-nocookie defers Google's cookies. */
export function embedFor(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1`;
}
