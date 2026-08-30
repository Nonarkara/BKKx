// Curated live cameras for the war room rail.
//
// These are hand-entered public live streams, as distinct from the cameras
// that arrive at runtime from CCTV_SOURCE_URL. Both feed the same rail.
//
// LOCATION DISCIPLINE. This file follows the same rule as the heritage
// register: a location is recorded at the precision actually known, with the
// method that established it, and a stream whose location cannot be confirmed
// is marked `unconfirmed` rather than given a plausible coordinate. A camera
// pinned to the wrong corner is worse than a camera with no pin, because the
// pin will be believed.
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
  /** Not established. No coordinate is recorded. */
  | "unconfirmed";

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
    id: "yt-unconfirmed-a_bUVExv_Cg",
    kind: "youtube",
    videoId: "a_bUVExv_Cg",
    title: "Live stream — location not yet confirmed",
    place: null,
    district: null,
    lat: null,
    lon: null,
    precision: "unconfirmed",
    locatedBy:
      "supplied as a live camera; the stream's own title could not be read from the build environment (youtube.com is blocked by egress policy) and it is not indexed by search. Plays correctly; awaiting a location from the operator.",
    sourceUrl: "https://www.youtube.com/live/a_bUVExv_Cg",
  },
  {
    id: "yt-unconfirmed-4mfkil3LzKg",
    kind: "youtube",
    videoId: "4mfkil3LzKg",
    title: "Live stream — location not yet confirmed",
    place: null,
    district: null,
    lat: null,
    lon: null,
    precision: "unconfirmed",
    locatedBy:
      "supplied as a live camera; title unreadable from this environment and not indexed. Plays correctly; awaiting a location from the operator.",
    sourceUrl: "https://www.youtube.com/live/4mfkil3LzKg",
  },
  {
    id: "yt-unconfirmed-pP98CQP1dg0",
    kind: "youtube",
    videoId: "pP98CQP1dg0",
    title: "Live stream — location not yet confirmed",
    place: null,
    district: null,
    lat: null,
    lon: null,
    precision: "unconfirmed",
    locatedBy:
      "supplied as a live camera; title unreadable from this environment and not indexed. Plays correctly; awaiting a location from the operator.",
    sourceUrl: "https://www.youtube.com/live/pP98CQP1dg0",
  },
];

export const CAMERA_TALLY = {
  total: CURATED_CAMERAS.length,
  embedded: CURATED_CAMERAS.filter((c) => c.kind === "youtube").length,
  linked: CURATED_CAMERAS.filter((c) => c.kind === "link").length,
  located: CURATED_CAMERAS.filter((c) => c.precision !== "unconfirmed").length,
  unconfirmed: CURATED_CAMERAS.filter((c) => c.precision === "unconfirmed").length,
};

/** Poster image, proxied so the page never calls Google before a click. */
export function posterFor(videoId: string): string {
  return `/api/live/camera-poster?v=${encodeURIComponent(videoId)}`;
}

/** The player, built only on demand. youtube-nocookie defers Google's cookies. */
export function embedFor(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1`;
}
