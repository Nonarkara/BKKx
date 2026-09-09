// Curated live cameras for the war room rail.
//
// These are hand-entered public live streams, as distinct from the cameras
// that arrive at runtime from the public Longdo / iTIC feed. Both feed the
// same rail.
//
// LOCATION DISCIPLINE. This file follows the same rule as the heritage
// register: a location is recorded at the precision actually known, with the
// method that established it. Never sharpened to a false exactness.
//
// Two streams still have no identifying evidence beyond a city-wide title.
// Per an explicit operator decision (2026-08-30), those are not left pinless:
// each gets a `placeholder` marker — a shared, clearly-nominal Bangkok
// reference point, not a claim about where the camera actually is.
// `place` stays null for a placeholder, so the tile still reads "Location
// not confirmed"; only the coordinate exists, as a stand-in.
//
// PRIVACY. Nothing here contacts Google on page load. The rail shows a poster
// image proxied through this site's own Worker, and the YouTube player is only
// constructed after a viewer clicks — through youtube-nocookie.com.
//
// LIVENESS. Two independent sessions curated this list in parallel and it was
// reconciled by hand on 2026-09-09 — every YouTube id was re-checked against
// the oembed endpoint before being kept. Two entries from that merge were
// dropped as dead (an earlier El Gaucho Soi 11 stream id, and a "Sukhumvit
// Road unplaced" placeholder), and one duplicate (two different current ids
// for the same Sathorn/Silom broadcast) was collapsed to one.

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
// property visible: two cameras sharing one coordinate cannot be
// mistaken for two confirmed, distinct locations.
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
    videoId: "UemFRPrl1hk",
    title: "El Gaucho · Soi 11 · Sukhumvit Road · live street webcam (4K)",
    place: "Sukhumvit Soi 11, off Sukhumvit Road near Nana",
    district: "Watthana",
    // Same operator and the same reasoning as the Soi 19 camera above: the
    // title names the soi, which is a 400 m lane, not a building. An earlier
    // id for this same channel (GIky-GXIBVY) went dead when the broadcast
    // restarted; this id was re-verified live via oembed on 2026-09-09.
    lat: 13.7434,
    lon: 100.5556,
    precision: "street",
    locatedBy: "stream title names Sukhumvit Soi 11; placed at the soi, not the premises",
    sourceUrl: "https://www.youtube.com/live/UemFRPrl1hk",
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
    // A second id for what is almost certainly the same broadcast
    // (542ZL88Wovs, same channel, same title) was found during the
    // 2026-09-09 merge and dropped rather than listing one camera twice.
    lat: 13.722,
    lon: 100.529,
    precision: "district",
    locatedBy:
      "stream title names Sathorn Road and Silom but no vantage point; Sathorn runs ~3 km, so this is recorded at district precision near the Sathorn-Naradhiwas junction rather than sharpened to a false address",
    sourceUrl: "https://www.youtube.com/watch?v=CW4Js-oyc58",
  },
  {
    id: "yt-petchaburi-road",
    kind: "youtube",
    videoId: "a_bUVExv_Cg",
    title: "Petchaburi Road, Bangkok · live traffic webcam",
    place: "Phetchaburi Road, Pratunam stretch — near Platinum Fashion Mall",
    district: "Ratchathewi",
    // Stream title names the road; several public aggregators independently
    // describe the Pratunam / Platinum stretch. Street, not a premises.
    lat: 13.7499,
    lon: 100.5557,
    precision: "street",
    locatedBy:
      "YouTube oembed title is 'Petchaburi Road, Bangkok'; webcamhopper / webcamera24 place the same stream on the Pratunam stretch. Pinned to the named road, not a building.",
    sourceUrl: "https://www.youtube.com/live/a_bUVExv_Cg",
  },
  {
    id: "skyline-sukhumvit",
    kind: "link",
    videoId: "",
    title: "Sukhumvit Road from the Landmark Bangkok (SkylineWebcams)",
    place: "The Landmark Bangkok, Sukhumvit Road near BTS Nana",
    district: "Watthana",
    lat: 13.7407,
    lon: 100.5554,
    precision: "street",
    locatedBy:
      "SkylineWebcams publishes this as Sukhumvit Road, Bangkok; third-party listings identify the mount as the Landmark Hotel near BTS Nana. Pinned to the hotel, not the pan.",
    sourceUrl: "https://www.skylinewebcams.com/en/webcam/thailand/central-thailand/bangkok/sukhumvit-road.html",
  },
  {
    id: "yt-bangkok-360-a",
    kind: "youtube",
    videoId: "4mfkil3LzKg",
    title: "Bangkok Day & Sunset · Skyline Webcam · Bangkok 360",
    place: null,
    district: null,
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "oembed title is a citywide skyline; no building or soi is named. Shared placeholder marker pending a confirmed mount.",
    sourceUrl: "https://www.youtube.com/live/4mfkil3LzKg",
  },
  {
    id: "yt-bangkok-360-b",
    kind: "youtube",
    videoId: "pP98CQP1dg0",
    title: "Bangkok Day & Sunset · Skyline Webcam · Bangkok 360 (second feed)",
    place: null,
    district: null,
    lat: PLACEHOLDER_MARKER.lat,
    lon: PLACEHOLDER_MARKER.lon,
    precision: "placeholder",
    locatedBy:
      "oembed title matches the other Bangkok 360 feed; no building or soi is named. Shared placeholder marker pending a confirmed mount.",
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
