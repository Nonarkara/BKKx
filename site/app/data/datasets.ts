// The open-data catalogue behind /datasets.
//
// Every public dataset this project serves, annotated by hand here and
// measured by machine in dataset-manifest.json (bytes, sha256, feature
// count — written by scripts/build-dataset-manifest.mjs on every build).
// The build fails if a served data file is missing from this list or a
// listed file is missing from disk: a dataset the catalogue does not
// describe is a provenance gap, and silence is how those grow.
//
// license states what a re-user must honour, in one line, worst first.
// generator names the script that writes the file, where one exists in
// this repo; a dataset regenerated elsewhere says so instead of implying
// reproducibility it does not have.

export type DatasetNote = {
  /** Path as served, from the site root (also the path under public/). */
  file: string;
  title: string;
  /** What it is and what is in it — two sentences at most. */
  what: string;
  /** Where the underlying facts come from. */
  source: string;
  /** What re-use must honour. */
  license: string;
  /** Repo path of the script that regenerates it, if it lives here. */
  generator?: string;
  /** Routes that read it, so a reader can see the data in use. */
  usedBy: string[];
};

export const DATASETS: DatasetNote[] = [
  {
    file: "/heritage-register.json",
    title: "The Bangkok heritage register",
    what: "All 571 Fine Arts Department registered ancient monuments in Bangkok, each relocated to building precision where the published coordinate is too coarse — with the resolution method recorded per site (register coordinate, OSM name match, or honestly left unpinned).",
    source: "Fine Arts Department, ข้อมูลบัญชีตำแหน่งโบราณสถาน (data.go.th/dataset/gis-finearts); OpenStreetMap for coordinate relocation.",
    license: "CC BY (Fine Arts Department source); OSM-derived coordinates ODbL, © OpenStreetMap contributors.",
    generator: "scripts/build-heritage-register.py",
    usedBy: ["/heritage", "/areas/:slug", "/walks/:slug", "/atlas/:district"],
  },
  {
    file: "/data/bangkok-rowhouse-atlas.geojson",
    title: "The rowhouse atlas",
    what: "32 documented rowhouse ensembles across royal frontages, market rows, commercial streets, canal markets and community-led conservation — cultural corridors with per-record source, geometry method and confidence. Not cadastral parcels and not legal conservation boundaries.",
    source: "Authored curation with a citation per record, crosswalked to ONEP's Rattanakosin category-E survey; corridor geometry follows documented extents and street axes.",
    license: "CC BY 4.0 (BKKx curation and metrics); underlying OpenStreetMap geometry ODbL, © OpenStreetMap contributors.",
    generator: "site/scripts/export-rowhouse-data.mjs",
    usedBy: ["/rowhouses", "/atlas/historic-core"],
  },
  {
    file: "/data/bangkok-rowhouse-footprint-candidates.geojson",
    title: "Rowhouse footprint candidates",
    what: "Current building footprints screened for rowhouse morphology, as an opt-in field-review queue. Explicitly does not confirm that any building is a rowhouse, its age, or its heritage status.",
    source: "Overture Maps / OpenStreetMap building geometry, morphology-screened.",
    license: "ODbL, © OpenStreetMap contributors; Overture Maps Foundation data licenses per theme.",
    generator: "site/scripts/build-rowhouse-footprints.py",
    usedBy: ["/rowhouses", "/shophouses/atlas"],
  },
  {
    file: "/data/bkk-heritage-detail.geojson",
    title: "Rattanakosin detail layer",
    what: "9,275 full-resolution OSM building footprints for the Grand Palace quarter with curated typology heights (chedi, prasat, ubosot, viharn) — every height carries a height_source label naming its origin.",
    source: "OpenStreetMap extract with curated overrides; collection metadata carries its version date.",
    license: "ODbL, © OpenStreetMap contributors. Heights are labelled interpretation, not measured conservation data.",
    // No generator entry on purpose: this layer is regenerated outside this
    // repo, and claiming a script here would imply reproducibility it lacks.
    usedBy: ["/atlas/historic-core"],
  },
  {
    file: "/data/bkk-hero-monuments.geojson",
    title: "Hero monuments (3D parts)",
    what: "67 transparent, survey-informed 3D parts for Wat Arun, Wat Phra Kaew, Wat Pho's Four Great Chedis and company. Official published dimensions define the envelopes; intermediate tiers are labelled proportional interpretation, not measurement.",
    source: "Fine Arts Department and BMA publications, the Grand Palace plan, watpho.com architecture records, and a checked-in OSM way snapshot.",
    license: "ODbL for OSM-derived footprints, © OpenStreetMap contributors; cited official documents for dimensions.",
    generator: "site/scripts/build-hero-monuments.py",
    usedBy: ["/atlas/historic-core"],
  },
  {
    file: "/data/bkk-land-price.geojson",
    title: "Treasury land appraisal by district",
    what: "50 district polygons carrying Treasury Department appraisal bands, converted from per-square-wah to per-m². Appraised value sits below market — every figure is a floor, not an estimate.",
    source: "Treasury Department (กรมธนารักษ์) draft appraisal round, via the cited Prachachat Business summary; the same dataset behind the atlas.nonarkara.org land layer.",
    license: "Figures quoted from the cited source; district geometry ODbL, © OpenStreetMap contributors.",
    generator: "scripts/build-shophouse-pressure.py",
    usedBy: ["/shophouses", "/shophouses/atlas"],
  },
  {
    file: "/data/bkk-landmarks.geojson",
    title: "Curated landmark extrusions",
    what: "73 curated 3D massing parts — Victory Monument's 50 m shaft, Democracy Monument, the Golden Mount — with per-part source lines. Schematic massing, labelled as such.",
    source: "OpenStreetMap ways with curated heights; per-feature source field names each part's basis.",
    license: "ODbL, © OpenStreetMap contributors; heights are labelled schematic massing.",
    usedBy: ["/atlas/historic-core"],
  },
  {
    file: "/data/shophouse-pressure.geojson",
    title: "The shophouse pressure atlas",
    what: "2,311 candidate shophouse footprints, each carrying its quadrant (price × depth), frontage, depth and the land value under it. The map behind the essay's central argument.",
    source: "Computed by joining the footprint candidates to the Treasury appraisal bands, point-in-polygon; splits at the medians.",
    license: "ODbL for the OSM/Overture-derived geometry, © OpenStreetMap contributors; appraisal figures quoted from the cited Treasury summary.",
    generator: "scripts/build-shophouse-pressure.py",
    usedBy: ["/shophouses", "/shophouses/atlas"],
  },
  {
    file: "/data/sukhumvit71-corridor.geojson",
    title: "Sukhumvit 71 study corridor",
    what: "The Pridi Banomyong road centreline and every building footprint along it screened for shophouse morphology — a candidate set for field review, like the rowhouse queue.",
    source: "OpenStreetMap via Overpass; frontage/depth expectations from the studio's measured elevations.",
    license: "ODbL, © OpenStreetMap contributors.",
    generator: "scripts/build-sukhumvit71.py",
    usedBy: ["/shophouses"],
  },
  {
    file: "/data/sources/wat-arun-osm-way-snapshot.json",
    title: "Wat Arun OSM way snapshot",
    what: "The checked-in OpenStreetMap way snapshot the hero-monument builder starts from — kept in the repo so the 3D parts are reproducible against a fixed input rather than a moving map.",
    source: "OpenStreetMap, snapshot of the Wat Arun complex ways.",
    license: "ODbL, © OpenStreetMap contributors.",
    usedBy: ["/atlas/historic-core"],
  },
  {
    file: "/pois/temples.geojson",
    title: "Bangkok temples (wat1)",
    what: "460 temples from the BMA's wat1 dataset, pinned and bbox-asserted.",
    source: "data.bangkok.go.th, dataset wat1; per-feature source and source_url fields.",
    license: "Open Government Data of Thailand licence, per the source catalogue entry.",
    generator: "scripts/ingest-bkk-pois.py",
    usedBy: ["/atlas/:district"],
  },
  {
    file: "/pois/royal-temples.geojson",
    title: "Royal temples (พระอารามหลวง)",
    what: "94 royal temples geocoded from the Dhamma registry's address-only XLS, Bangkok subset.",
    source: "catalog.dra.go.th, dataset dra_0302_01; per-feature source fields.",
    license: "Open Government Data of Thailand licence, per the source catalogue entry.",
    generator: "scripts/ingest-bkk-pois.py",
    usedBy: ["/atlas/:district"],
  },
  {
    file: "/pois/national-museums.geojson",
    title: "National museums",
    what: "Fine Arts Department national museums, Bangkok subset of the national dataset.",
    source: "data.go.th, dataset gis_fad005; per-feature source fields.",
    license: "Open Government Data of Thailand licence, per the source catalogue entry.",
    generator: "scripts/ingest-bkk-pois.py",
    usedBy: ["/atlas/:district"],
  },
  {
    file: "/pois/national-libraries.geojson",
    title: "National libraries",
    what: "Fine Arts Department national libraries, Bangkok subset, UTM coordinates converted.",
    source: "data.go.th, dataset gis_fad003; per-feature source fields.",
    license: "Open Government Data of Thailand licence, per the source catalogue entry.",
    generator: "scripts/ingest-bkk-pois.py",
    usedBy: ["/atlas/:district"],
  },
  {
    file: "/pois/national-archives.geojson",
    title: "National archives",
    what: "Fine Arts Department national archives, Bangkok subset, UTM coordinates converted.",
    source: "data.go.th, dataset gis_fad004; per-feature source fields.",
    license: "Open Government Data of Thailand licence, per the source catalogue entry.",
    generator: "scripts/ingest-bkk-pois.py",
    usedBy: ["/atlas/:district"],
  },
  {
    file: "/data/rattanakosin-water.geojson",
    title: "Rattanakosin moat & river edge",
    what: "The moat (คลองรอบกรุง) and the Chao Phraya river edge of the royal island, as line geometry — 10 moat fragments and 16 river fragments. Carries world block coordinates alongside the original WGS84, so every placement in the Minecraft build is auditable back to the map.",
    source: "OpenStreetMap via the Overpass API; the Ratcha-anusorn 1926 city plan is referenced for the historic line but not extracted into this file.",
    license: "ODbL, © OpenStreetMap contributors.",
    generator: "scripts/build-rattanakosin-water-and-walls.py",
    usedBy: ["/atlas/historic-core"],
  },
  {
    file: "/data/rattanakosin-gates.geojson",
    title: "Rattanakosin city gates",
    what: "The 9 surviving city gates of the old walled city as points, projected into world block coordinates at 1:1 with their WGS84 origin preserved. The build asserts 9 found against 9 expected.",
    source: "OpenStreetMap via the Overpass API, cross-checked against the expected gate list in the build script.",
    license: "ODbL, © OpenStreetMap contributors.",
    generator: "scripts/build-rattanakosin-water-and-walls.py",
    usedBy: ["/atlas/historic-core"],
  },
  {
    file: "/data/rattanakosin-forts.geojson",
    title: "Rattanakosin wall forts",
    what: "The 2 surviving forts of the Rattanakosin wall — Phra Sumen and Mahakan — as points in world block coordinates with WGS84 preserved. The build asserts 2 found against 2 expected.",
    source: "OpenStreetMap via the Overpass API, cross-checked against the expected fort list in the build script.",
    license: "ODbL, © OpenStreetMap contributors.",
    generator: "scripts/build-rattanakosin-water-and-walls.py",
    usedBy: ["/atlas/historic-core"],
  },
  {
    file: "/pois/oldtown.geojson",
    title: "Old Town interpretive spots",
    what: "The 29 documented Old Town clusters as map points, each carrying its own citation in the source field.",
    source: "Exported from the documented cluster records in app/data/oldtown-spots.ts; per-feature source field names each record's citation.",
    license: "CC BY 4.0 (BKKx curation); each record's underlying citation as noted per feature.",
    usedBy: ["/atlas/historic-core"],
  },
];

/** How to cite a dataset — one line, filled per file on the page. */
export function citationFor(d: DatasetNote, host = "https://bkk.nonarkara.org"): string {
  return `Arkara, N. (2026). ${d.title} [Data set]. BKKx. ${host}${d.file}`;
}
