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
// `placeholder` marker — a shared, clearly-nominal Bangkok reference point,
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
      Bangkok marker so the tile is not pinless, pending confirmation — the
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

// The nominal Bangkok reference point used for every `placeholder` camera —
// the same coordinate the weather feed uses for a citywide reading
// (worker/live.ts BANGKOK). Reusing an already-documented generic point
// rather than inventing a new one keeps the "this is not real evidence"
// property visible: three cameras sharing one coordinate cannot be
// mistaken for three confirmed, distinct locations.
const PLACEHOLDER_MARKER = { lat: 13.7563, lon: 100.5018 };

export const CURATED_CAMERAS: CuratedCamera[] = [
  {
    id: "earthcam-millennium-hilton",
    kind: "link",
    videoId: "",
    title: "Chao Phraya River from the Millennium Hilton (EarthCam)",
    place: "Millennium Hilton Bangkok, Charoen Nakhon Road — west bank, looking over the Chao Phraya toward Rattanakosin",
    district: "Khlong San",
    // The hotel is a fixed landmark on the Thonburi bank; the camera's own
    // pan is not fixed, so this pins the mount, not the view.
    lat: 13.7274,
    lon: 100.5095,
    precision: "street",
    locatedBy:
      "EarthCam publishes this camera as hosted by the Millennium Hilton Bangkok; pinned to the hotel on the west bank, not to the framing, which pans",
    sourceUrl: "https://www.earthcam.com/world/thailand/bangkok/?cam=bangkok",
  },
  {
    id: "yt-sukhumvit-soi-19",
    kind: "youtube",
    videoId: "Q71sLS8h9a4",
    title: "El Gaucho · Soi 19 · Sukhumvit Road · live street webcam (4K)",
    place: "Sukhumvit Soi 19, off Sukhumvit Road near Asok",
    district: "Watthana",
    // Street precision: the stream names the soi, which places it on a
    // 300 m stretch, not on a building. Recorded at that precision rather
    // than sharpened to a false exactness.
    lat: 13.7385,
    lon: 100.56,
    precision: "street",
    locatedBy: "stream title names Sukhumvit Soi 19; placed at the soi, not the premises",
    sourceUrl: "https://www.youtube.com/live/Q71sLS8h9a4",
  },
  {
    id: "yt-jacks-bar-chao-phraya",
    kind: "youtube",
    videoId: "UdDpOaGviq4",
    title: "Chao Phraya River · Jack's Bar · live camera stream",
    place: "Jack's Bar, end of Soi Wat Suan Phlu off Charoen Krung, on the river just south of the Shangri-La",
    district: "Bang Rak",
    // The operator publishes a street address (62/1 Soi Wat Suan Phlu, Bang
    // Rak); the camera looks out across the water, so this pins the terrace
    // it stands on, not what it sees.
    lat: 13.7192,
    lon: 100.5132,
    precision: "street",
    locatedBy:
      "the venue publishes its address at the river end of Soi Wat Suan Phlu, Bang Rak; pinned to that soi rather than to the framing, which faces across the Chao Phraya toward Thonburi",
    sourceUrl: "https://www.youtube.com/watch?v=UdDpOaGviq4",
  },
  {
    id: "yt-el-gaucho-soi-11",
    kind: "youtube",
    videoId: "GIky-GXIBVY",
    title: "El Gaucho · Soi 11 · Sukhumvit Road · live street webcam (4K)",
    place: "Sukhumvit Soi 11, off Sukhumvit Road near Nana",
    district: "Watthana",
    // Same operator and the same reasoning as the Soi 19 camera already in
    // this file: the title names the soi, which is a 400 m lane, not a
    // building.
    lat: 13.7434,
    lon: 100.5556,
    precision: "street",
    locatedBy: "stream title names Sukhumvit Soi 11; placed at the soi, not the premises",
    sourceUrl: "https://www.youtube.com/watch?v=GIky-GXIBVY",
  },
  {
    id: "yt-soi-cowboy",
    kind: "youtube",
    videoId: "ISPQCuWssKA",
    title: "Soi Cowboy · Bangkok · live",
    place: "Soi Cowboy, the lane between Sukhumvit Soi 21 (Asok) and Soi 23",
    district: "Watthana",
    // Unusually good for a street precision: Soi Cowboy is a single
    // ~150 m pedestrian lane, so naming it places the camera more tightly
    // than most soi names do.
    lat: 13.7373,
    lon: 100.5606,
    precision: "street",
    locatedBy:
      "stream title names Soi Cowboy, a single 150 m lane between Sukhumvit 21 and 23; placed at its midpoint",
    sourceUrl: "https://www.youtube.com/watch?v=ISPQCuWssKA",
  },
  {
    id: "yt-sathorn-silom",
    kind: "youtube",
    videoId: "CW4Js-oyc58",
    title: "Sathorn Road · Silom · Bangkok livestream 24/7 (4K)",
    place: "Sathorn Road at Silom — the business district, exact vantage not published",
    district: "Bang Rak",
    // District precision, not street. Sathorn Road runs about 3 km and forms
    // the Bang Rak / Sathon boundary; naming it plus "Silom" narrows the
    // camera to a neighbourhood, not to a block. Pinned near the
    // Sathorn-Naradhiwas junction, the centre of the area both names share.
    lat: 13.722,
    lon: 100.529,
    precision: "district",
    locatedBy:
      "stream title names Sathorn Road and Silom but no vantage point; Sathorn runs ~3 km, so this is recorded at district precision near the Sathorn-Naradhiwas junction rather than sharpened to a false address",
    sourceUrl: "https://www.youtube.com/watch?v=CW4Js-oyc58",
  },
  {
    id: "yt-sukhumvit-unplaced-TfOOzM6mPT4",
    kind: "youtube",
    videoId: "TfOOzM6mPT4",
    title: "Sukhumvit Road · Bangkok · live street webcam",
    place: null,
    district: null,
    // The title names a road and nothing else. Sukhumvit runs the length of
    // the city and crosses Khlong Toei, Watthana and Phra Khanong, so even a
    // district would be a guess. Placeholder, like the three streams below.
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "stream title names Sukhumvit Road and no soi or landmark. Sukhumvit crosses several districts, so no district can be recorded either; pinned at the shared placeholder marker per the operator decision of 2026-08-30, awaiting someone who recognises the frame",
    sourceUrl: "https://www.youtube.com/live/TfOOzM6mPT4",
  },
  {
    id: "yt-unconfirmed-a_bUVExv_Cg",
    kind: "youtube",
    videoId: "a_bUVExv_Cg",
    title: "Live stream — location not yet confirmed",
    place: null,
    district: null,
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "no evidence of the real location; pinned at the shared placeholder marker per an explicit operator decision (2026-08-30) rather than left without a coordinate. supplied as a live camera; the stream's own title could not be read from the build environment (youtube.com is blocked by egress policy) and it is not indexed by search. Plays correctly; awaiting a location from the operator.",
    sourceUrl: "https://www.youtube.com/live/a_bUVExv_Cg",
  },
  {
    id: "yt-unconfirmed-4mfkil3LzKg",
    kind: "youtube",
    videoId: "4mfkil3LzKg",
    title: "Live stream — location not yet confirmed",
    place: null,
    district: null,
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "no evidence of the real location; pinned at the shared placeholder marker per an explicit operator decision (2026-08-30) rather than left without a coordinate. supplied as a live camera; title unreadable from this environment and not indexed. Plays correctly; awaiting a location from the operator.",
    sourceUrl: "https://www.youtube.com/live/4mfkil3LzKg",
  },
  {
    id: "yt-unconfirmed-pP98CQP1dg0",
    kind: "youtube",
    videoId: "pP98CQP1dg0",
    title: "Live stream — location not yet confirmed",
    place: null,
    district: null,
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "no evidence of the real location; pinned at the shared placeholder marker per an explicit operator decision (2026-08-30) rather than left without a coordinate. supplied as a live camera; title unreadable from this environment and not indexed. Plays correctly; awaiting a location from the operator.",
    sourceUrl: "https://www.youtube.com/live/pP98CQP1dg0",
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
