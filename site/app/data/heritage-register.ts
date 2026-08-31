// Server-side reader for public/heritage-register.json.
//
// The register file is ~1.3 MB and is fetched by the client explorer at
// runtime (HeritageExplorer). Server surfaces — the war room tallies, the
// per-monument permalinks — import it directly instead, so the figures on
// those pages are computed at build time from the same bytes the explorer
// downloads, rather than restated by hand.
//
// Nothing here invents a value. Every helper either reads a field the
// generator wrote or derives a number from fields it wrote; where the
// register says nothing, these functions say nothing too.

// The import attribute is not decoration: the bundler is happy without it,
// but node --test loads this module directly and refuses a bare JSON import.
// Keeping it here means the register's helpers stay testable outside a build.
import REGISTER from "../../public/heritage-register.json" with { type: "json" };

export type Gazette = {
  volume: string;
  part: string;
  date: string;
  topic: string;
};

export type Block = { x: number; z: number };

export type RegisterSite = {
  id: string;
  name: string;
  district: string;
  subDistrict: string;
  road: string;
  registered: boolean;
  registerStatus: string;
  /** "building" when the row carries a real coordinate; "district" otherwise. */
  precision: "building" | "district";
  /** How the coordinate was established — see parseLocatedBy. */
  locatedBy: string;
  lat?: number;
  lon?: number;
  world?: string;
  block?: Block;
  gazette?: Gazette | null;
  history?: string;
  artCulture?: string;
  present?: string;
  blurb?: string;
  blurbTruncated?: boolean;
};

export type RegisterWorld = {
  title: string;
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
  blocks: { maxX: number; maxZ: number };
  spawnY: number | null;
  siteCount: number;
};

export type RegisterFile = {
  source: {
    name: string;
    nameEn: string;
    dataset: string;
    licence: string;
    coordinateNote: string;
    osmAttribution: string;
    retrieved?: string;
  };
  worlds: Record<string, RegisterWorld>;
  counts: {
    total: number;
    registered: number;
    awaiting: number;
    buildingPrecision: number;
    districtPrecision: number;
    walkable: number;
    byWorld: Record<string, number>;
  };
  sites: RegisterSite[];
};

const FILE = REGISTER as unknown as RegisterFile;

export const REGISTER_SOURCE = FILE.source;
export const REGISTER_COUNTS = FILE.counts;
export const REGISTER_WORLDS = FILE.worlds;
export const REGISTER_SITES: RegisterSite[] = FILE.sites;

const BY_ID = new Map(REGISTER_SITES.map((s) => [s.id, s]));

export function siteById(id: string): RegisterSite | null {
  return BY_ID.get(id) ?? null;
}

export type PinnedSite = RegisterSite & { lat: number; lon: number };

export function isPinned(s: RegisterSite): s is PinnedSite {
  return typeof s.lat === "number" && typeof s.lon === "number";
}

export const PINNED_SITES: PinnedSite[] = REGISTER_SITES.filter(isPinned);

/* ---------------------------------------------------------------- *
 * locatedBy — the provenance string, parsed
 *
 * The generator (scripts/build-heritage-register.py) resolves each row in
 * a fixed order and records the winner. Three shapes exist:
 *
 *   "fine-arts"                       the register's own coordinate, kept
 *                                     because it carried >= 5 decimals
 *   "osm:{type}/{id}:{match}"         relocated onto an OpenStreetMap
 *                                     feature whose name matched
 *   "unlocated"                       nothing matched; no pin was given
 *
 * Parsing it rather than printing it is the whole point of this file: an
 * OSM match is checkable by anyone, but only if the page hands over the
 * object id as a link and says how good the match was.
 * ---------------------------------------------------------------- */

export type MatchQuality = "exact" | "fuzzy" | "prefix" | "rank-suffix" | "unknown";

export type LocationMethod =
  | { kind: "fine-arts" }
  | {
      kind: "osm";
      osmType: "way" | "node" | "relation";
      osmId: string;
      match: MatchQuality;
      url: string;
    }
  | { kind: "unlocated" }
  | { kind: "other"; raw: string };

const OSM_PATTERN = /^osm:(way|node|relation)\/(\d+):(.+)$/;

const KNOWN_MATCHES: readonly MatchQuality[] = ["exact", "fuzzy", "prefix", "rank-suffix"];

export function parseLocatedBy(raw: string): LocationMethod {
  if (raw === "fine-arts") return { kind: "fine-arts" };
  if (raw === "unlocated") return { kind: "unlocated" };
  const m = OSM_PATTERN.exec(raw);
  if (m) {
    const osmType = m[1] as "way" | "node" | "relation";
    const osmId = m[2];
    const found = KNOWN_MATCHES.find((q) => q === m[3]);
    return {
      kind: "osm",
      osmType,
      osmId,
      match: found ?? "unknown",
      url: `https://www.openstreetmap.org/${osmType}/${osmId}`,
    };
  }
  return { kind: "other", raw };
}

/** What each match quality actually means, in one sentence a reader can act on. */
export const MATCH_MEANING: Record<MatchQuality, string> = {
  exact: "the register name and the OpenStreetMap name are the same string",
  fuzzy: "the names are close but not identical — worth checking before you cite the position",
  prefix: "the OpenStreetMap name begins with the register name",
  "rank-suffix": "the names differ only by a royal-rank suffix (…ราชวรวิหาร and the like)",
  unknown: "recorded by the generator in a form this page does not recognise",
};

/** The evidence held, in five words — for the head of the record page. */
export function locationVerdict(site: RegisterSite): string {
  const method = parseLocatedBy(site.locatedBy);
  switch (method.kind) {
    case "fine-arts":
      return "Pinned on the department's own coordinate.";
    case "osm":
      return `Pinned by ${method.match === "exact" ? "an exact" : `a ${method.match}`} name match against OpenStreetMap.`;
    case "unlocated":
      return "Not pinned. District precision is all this record holds.";
    case "other":
      return "Located by an unrecognised method.";
  }
}

/** Headline sentence for the provenance panel. */
export function describeLocation(site: RegisterSite): string {
  const method = parseLocatedBy(site.locatedBy);
  switch (method.kind) {
    case "fine-arts":
      return "Pinned at the Fine Arts Department's own published coordinate, which for this row carries enough decimal places to name a building.";
    case "osm":
      return `The register's published coordinate for this row was too coarse to pin, so the monument was relocated onto an OpenStreetMap feature by name — ${MATCH_MEANING[method.match]}.`;
    case "unlocated":
      return "This monument is not pinned. The register's coordinate for it resolves to about a kilometre, and no OpenStreetMap feature matched its name, so it is listed at district precision and given no position.";
    case "other":
      return `Located by an unrecognised method recorded as “${method.raw}”.`;
  }
}

/* ---------------------------------------------------------------- *
 * Neighbours
 * ---------------------------------------------------------------- */

const EARTH_R = 6_371_000;

/** Great-circle distance in metres. */
export function haversineM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export type Neighbour = PinnedSite & { distanceM: number };

/** The n nearest other pinned monuments, by straight-line distance. */
export function nearestPinned(site: PinnedSite, n: number): Neighbour[] {
  return PINNED_SITES.filter((o) => o.id !== site.id)
    .map((o) => ({ ...o, distanceM: haversineM(site, o) }))
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, n);
}

/** Other entries the register places in the same district. */
export function sameDistrict(site: RegisterSite, n: number): RegisterSite[] {
  return REGISTER_SITES.filter((o) => o.id !== site.id && o.district === site.district).slice(0, n);
}

export function districtCount(district: string): number {
  return REGISTER_SITES.filter((s) => s.district === district).length;
}

/* ---------------------------------------------------------------- *
 * Citation
 * ---------------------------------------------------------------- */

export function citationForSite(site: RegisterSite, host = "https://bkk.nonarkara.org"): string {
  const retrieved = REGISTER_SOURCE.retrieved ?? "n.d.";
  return `กรมศิลปากร [Fine Arts Department]. ${site.name} (register id ${site.id}). ข้อมูลบัญชีตำแหน่งโบราณสถาน [Data set], retrieved ${retrieved}. Relocated and published by BKKx. ${host}/heritage/${site.id}`;
}

export function permalinkFor(site: Pick<RegisterSite, "id">): string {
  return `/heritage/${site.id}`;
}
