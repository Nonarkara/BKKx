// Where BKKx draws its own Old Town 3D, the base map's buildings step aside.
//
// The OpenFreeMap base style extrudes every OSM building as a plain box
// (`bkkx-3d-buildings`). Inside Rattanakosin the atlas also draws the same
// footprints itself — 9,275 detail parts with typology heights, the hero
// monuments, and the three.js Thai forms. Where both draw, the base box
// pokes through: a signal-yellow block standing inside an ubosot roof or
// beside a chedi, because the base height comes from OSM tags and ours from
// the typology. So inside the cover the base box is hidden and ours stands
// alone; outside it nothing changes.
//
// Idea credit: the "hide the base map's buildings where your own model
// stands" step, and a published `cover` polygon to say where that is, follow
// a public write-up by the Longdo Map 3D team (Longdo3D v2, transit.longdo.com;
// Facebook post of 17 Oct 2026). No Longdo code is used here.
//
// MapLibre's `within` only evaluates points and lines — a building polygon
// is never "within" anything — so the test is `distance`: a footprint that
// touches the cover is at distance 0. MapLibre GL JS has `distance` from 4.2.
//
// Pure: no MapLibre import, so the node test suite can load it.

/** bbox of public/data/bkk-heritage-detail.geojson (its own `bbox` field). */
export const HERITAGE_DETAIL_BBOX = [100.4896474, 13.7393745, 100.5159786, 13.7628402] as const;

/**
 * The detail file is a bbox extract, so its edge cuts through buildings it
 * may or may not include. The cover sits this far inside the bbox: a base box
 * in that edge band stays, exactly as before, rather than leaving a hole.
 */
export const COVER_INSET_M = 50;

/**
 * Below this zoom the base boxes stay. The detail layer starts at z13.5 and
 * a filter is evaluated per tile at whole zooms, so from z14 tiles on the
 * Old Town's own models are guaranteed to be drawing.
 */
export const HIDE_FROM_ZOOM = 14;

type Bbox = readonly [number, number, number, number];
type Polygon = { type: "Polygon"; coordinates: [number, number][][] };

export function insetCover(bbox: Bbox, insetM: number): Polygon {
  const [w, s, e, n] = bbox;
  const lat = ((s + n) / 2) * (Math.PI / 180);
  const dLng = insetM / (111_320 * Math.cos(lat));
  const dLat = insetM / 110_540;
  const W = w + dLng, S = s + dLat, E = e - dLng, N = n - dLat;
  if (!(W < E && S < N)) throw new Error("cover inset larger than the bbox");
  return { type: "Polygon", coordinates: [[[W, S], [E, S], [E, N], [W, N], [W, S]]] };
}

export const OLD_TOWN_COVER = insetCover(HERITAGE_DETAIL_BBOX, COVER_INSET_M);

/**
 * Filter for the base `building` extrusion: keep a box unless, from
 * HIDE_FROM_ZOOM, it touches the cover. `null` means no filter (Old Town 3D off).
 */
export function baseBuildingFilter(oldTown3dOn: boolean, cover: Polygon = OLD_TOWN_COVER) {
  if (!oldTown3dOn) return null;
  return ["step", ["zoom"], true, HIDE_FROM_ZOOM, [">", ["distance", cover], 0]] as unknown[];
}
