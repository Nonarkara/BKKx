import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the Bangkok walkthrough at /worlds", async () => {
  const response = await render("/worlds");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Minecraft worlds · BKKxC\(ulture\)<\/title>/i);
  assert.match(html, /Bangkok,/);
  assert.match(html, /block by block\./);
  assert.match(html, /Ratchathewi/);
  assert.match(html, /Historic Core/);
  assert.match(html, /Walk in 3D/);
  assert.match(html, /\/atlas\/ratchathewi/);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("renders the 3D atlas page for a district", async () => {
  const response = await render("/atlas/ratchathewi");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Ratchathewi — 3D atlas · BKKxC\(ulture\)<\/title>/i);
  assert.match(html, /Ratchathewi/);
  assert.match(html, /ราชเทวี/);
  assert.match(html, /Victory Monument/);
  assert.match(html, /Download world/);
  assert.match(html, /Walk in 3D|atlas-page|bkkx-marker/);
  assert.doesNotMatch(html, /Heritage\s*\([^)]*16|Historic context/);
});

test("limits Old Town context layers to Historic Core", async () => {
  const response = await render("/atlas/historic-core");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Heritage\s*\([^)]*16/);
  assert.match(html, /Conservation zones/);
  assert.match(html, /Public transport/);
  assert.match(html, /Map key/);
  assert.match(html, /Candidates\s*\(/);
  assert.match(html, /orientation only/i);
});

test("returns 404 for an unknown atlas district", async () => {
  const response = await render("/atlas/atlantis");
  assert.equal(response.status, 404);
});

test("serves the 3D map heritage atlas as the front door", async () => {
  // The 3D map is the homepage (2026-08-11 redesign). The Editorial
  // register content moved to /heritage; BKK's own heritage map iframe
  // fills the page, with the sourced rowhouse atlas first and the nine
  // quarter jumps one tab away. No "choose your district" gate.
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  // 3D map front door
  assert.match(html, /atlas-shell/);
  assert.match(html, /atlas-shell-map/);
  assert.match(html, /src="\/atlas\/historic-core\?embed=1"/);
  assert.doesNotMatch(html, /src="https:\/\/atlas\.nonarkara\.org/i);
  // Rowhouses are the useful default; quarters remain in the client tab.
  assert.match(html, /Bangkok rowhouse atlas/);
  assert.match(html, /Rowhouses 32/);
  assert.match(html, /Quarters 9/);
  assert.match(html, /Na Phra Lan shophouses/);
  assert.match(html, /Hua Takhe old canal market/);
  // Register/Walks nav connects to the real anchors on /heritage, not a
  // dead #register on this page or a bare /heritage top scroll.
  assert.match(html, /href="\/heritage#register"/);
  assert.match(html, /href="\/heritage#walks"/);
  // The Minecraft-worlds CTAs and nav tab were placeholders from the
  // pre-redesign era (worlds built before the heritage pivot) and are
  // gone from primary chrome as of 2026-08-11 — the front door promotes
  // the register and walks, not a world download.
  assert.doesNotMatch(html, /Walk Ratchathewi/);
  assert.doesNotMatch(html, /Walk Old Town/);
  assert.doesNotMatch(html, />The worlds</);
  // Editorial register chrome (the shell) is here, the actual
  // register moved to /heritage.
  assert.match(html, /block by block/);
  assert.match(html, /application\/ld\+json/);
});

test("every quarter photo URL resolves (page.tsx must use the photo slot, not the slug)", async () => {
  // Regression: the front door once built each quarter thumbnail from
  // `${a.slug}.jpg` — but two of nine areas use a photo slot that
  // differs from the area slug (yaowarat-sampheng → yaowarat, plus
  // charoen-krung which is fine, but nang-loeng/sam-phraeng also have
  // different conventions). The build must read `a.photo` from
  // heritage-places.json and build the URL from that, or chips 404
  // and render as gray empty boxes.
  const fs = await import("node:fs");
  const path = await import("node:path");
  const pageHtml = await render("/");
  const html = await pageHtml.text();
  const { default: places } = await import("../app/data/heritage-places.json", { with: { type: "json" } });
  for (const area of places.areas) {
    if (!area.photo) continue;
    const expected = `/heritage/photos/${area.photo}.jpg`;
    assert.match(html, new RegExp(expected.replace(/[/.]/g, "\\$&")), `front-door HTML should reference ${expected} for ${area.slug}`);
    const onDisk = path.join(process.cwd(), "public/heritage/photos", `${area.photo}.jpg`);
    assert.ok(fs.existsSync(onDisk), `${area.slug}: photo ${area.photo}.jpg not on disk`);
  }
});

test("rowhouse atlas entries are sourced, geolocated, and evidence-labelled", async () => {
  const { OLDTOWN_SPOTS } = await import("../app/data/oldtown-spots.ts");
  assert.ok(OLDTOWN_SPOTS.length >= 29, "rowhouse atlas must cover at least 29 clusters");
  const slugs = new Set();
  for (const spot of OLDTOWN_SPOTS) {
    assert.ok(!slugs.has(spot.slug), `duplicate rowhouse slug: ${spot.slug}`);
    slugs.add(spot.slug);
    assert.ok(spot.sourceUrl.startsWith("https://"), `${spot.slug}: source must be HTTPS`);
    assert.ok(["registered", "published inventory", "mapped corridor"].includes(spot.evidence), `${spot.slug}: invalid evidence label`);
    const [lng, lat] = spot.center;
    assert.ok(lng >= 100.2 && lng <= 101.0 && lat >= 13.4 && lat <= 14.2, `${spot.slug}: outside Bangkok bbox`);
    assert.ok(spot.note.length > 60, `${spot.slug}: note is too thin`);
    assert.ok(spot.explorerTip.length > 30, `${spot.slug}: explorer tip is too thin`);
    assert.ok(spot.fabric.coordinates.length >= 2, `${spot.slug}: corridor needs at least two coordinates`);
    assert.ok(["high", "medium", "low"].includes(spot.fabric.geometryConfidence), `${spot.slug}: invalid geometry confidence`);
    for (const [fabricLng, fabricLat] of spot.fabric.coordinates) {
      assert.ok(fabricLng >= 100.2 && fabricLng <= 101.0 && fabricLat >= 13.4 && fabricLat <= 14.2, `${spot.slug}: fabric coordinate outside Bangkok bbox`);
    }
  }
});

test("reconciles the complete ONEP Rattanakosin category-E survey", async () => {
  const { OLDTOWN_SPOTS } = await import("../app/data/oldtown-spots.ts");
  const {
    ONEP_MAPPING_QUEUE,
    ONEP_MAPPED_RECORDS,
    ONEP_ROWHOUSE_RECORDS,
    ONEP_ROWHOUSE_SURVEY,
  } = await import("../app/data/onep-rowhouse-register.ts");
  assert.equal(ONEP_ROWHOUSE_RECORDS.length, 46);
  assert.equal(ONEP_ROWHOUSE_SURVEY.recordCount, 46);
  assert.equal(ONEP_MAPPED_RECORDS.length + ONEP_MAPPING_QUEUE.length, 46);
  assert.ok(ONEP_MAPPED_RECORDS.length >= 26);
  const recordIds = new Set();
  const knownSlugs = new Set(OLDTOWN_SPOTS.map((spot) => spot.slug));
  for (const record of ONEP_ROWHOUSE_RECORDS) {
    assert.ok(!recordIds.has(record.id), `duplicate ONEP record: ${record.id}`);
    recordIds.add(record.id);
    assert.equal(record.scores.reduce((sum, score) => sum + score, 0), record.total, `${record.id}: score total mismatch`);
    assert.ok([3, 4, 5].includes(record.priority), `${record.id}: invalid conservation priority`);
    for (const slug of record.mappedSlugs) assert.ok(knownSlugs.has(slug), `${record.id}: unknown mapped corridor ${slug}`);
  }
  assert.equal(ONEP_ROWHOUSE_RECORDS.filter((record) => record.recordType === "rowhouse ensemble").length, 41);
  assert.equal(ONEP_ROWHOUSE_RECORDS.filter((record) => record.recordType === "commercial building").length, 4);
  assert.equal(ONEP_ROWHOUSE_RECORDS.filter((record) => record.recordType === "related structure").length, 1);
});

test("serves the rowhouse research directory", async () => {
  const response = await render("/rowhouses");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Bangkok is a city of rows/);
  assert.match(html, /Evidence, not aesthetic guesswork/);
  assert.match(html, /Na Phra Lan shophouses/);
  assert.match(html, /Talat Phlu railway-market rows/);
  assert.match(html, /Patpong modern shophouse rows/);
  assert.match(html, /Bowonniwet Temple rows/);
  assert.match(html, /Srasong–Longtha rows/);
  assert.match(html, /Official coverage spine · 46 records/);
  assert.match(html, /20<!-- -->.*mapping queue|20.*mapping queue/i);
  assert.match(html, /shapes worth looking at—not/);
  assert.match(html, /heritage claims/i);
  assert.match(html, /not confirmed rowhouses/i);
  assert.match(html, /Candidate footprints/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /GeoJSON/);
  assert.match(html, /solid lines for high-confidence axes/i);
  assert.match(html, /Old Bangkok without a car/);
  assert.match(html, /Chao Phraya Tourist Boat/);
  assert.match(html, /Nearest public transport/);
  assert.match(html, /Eight doors into the city/);
  assert.match(html, /From (?:<!-- -->)?Tha Tien/);
  assert.match(html, /rowhouse-explorer-arrival/);
  assert.match(html, /Evidence room 01/);
  assert.match(html, /Evidence room 02/);
  assert.match(html, /Evidence room 03/);
  assert.equal((html.match(/<details class="rowhouse-research-disclosure">/g) ?? []).length, 3);
  assert.doesNotMatch(html, /<details class="rowhouse-research-disclosure" open/);
});

test("heritage mobility routes are sourced, connected, and inside Bangkok", async () => {
  const {
    HERITAGE_MOBILITY_SERVICES,
    HERITAGE_MOBILITY_STOPS,
  } = await import("../app/data/heritage-mobility.ts");
  assert.ok(HERITAGE_MOBILITY_SERVICES.length >= 6);
  assert.ok(HERITAGE_MOBILITY_STOPS.length >= 20);
  const stopIds = new Set(HERITAGE_MOBILITY_STOPS.map((stop) => stop.id));
  const serviceIds = new Set(HERITAGE_MOBILITY_SERVICES.map((service) => service.id));
  assert.equal(stopIds.size, HERITAGE_MOBILITY_STOPS.length, "duplicate mobility stop ID");
  assert.equal(serviceIds.size, HERITAGE_MOBILITY_SERVICES.length, "duplicate mobility service ID");
  for (const service of HERITAGE_MOBILITY_SERVICES) {
    assert.ok(service.sourceUrl.startsWith("https://"), `${service.id}: source must be HTTPS`);
    assert.ok(service.geometry.length >= 2, `${service.id}: route needs at least two coordinates`);
    for (const stopId of service.stopIds) assert.ok(stopIds.has(stopId), `${service.id}: unknown stop ${stopId}`);
  }
  for (const stop of HERITAGE_MOBILITY_STOPS) {
    const [lng, lat] = stop.coordinates;
    assert.ok(lng >= 100.2 && lng <= 101.0 && lat >= 13.4 && lat <= 14.2, `${stop.id}: outside Bangkok bbox`);
    for (const serviceId of stop.serviceIds) assert.ok(serviceIds.has(serviceId), `${stop.id}: unknown service ${serviceId}`);
  }
});

test("exports the rowhouse atlas as open confidence-labelled GeoJSON", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { OLDTOWN_SPOTS } = await import("../app/data/oldtown-spots.ts");
  const path = fileURLToPath(new URL("../public/data/bangkok-rowhouse-atlas.geojson", import.meta.url));
  const data = JSON.parse(readFileSync(path, "utf8"));
  assert.equal(data.type, "FeatureCollection");
  assert.match(data.caveat, /not cadastral parcels/i);
  assert.equal(data.features.length, OLDTOWN_SPOTS.length * 2);
  assert.equal(data.features.filter((feature) => feature.geometry.type === "LineString").length, OLDTOWN_SPOTS.length);
  assert.equal(data.features.filter((feature) => feature.geometry.type === "Point").length, OLDTOWN_SPOTS.length);
  const exportedSlugs = [...new Set(data.features.map((feature) => feature.properties.slug))].sort();
  assert.deepEqual(exportedSlugs, OLDTOWN_SPOTS.map((spot) => spot.slug).sort(), "GeoJSON export is stale");
  for (const feature of data.features) {
    assert.ok(feature.properties.source_url.startsWith("https://"));
    assert.ok(["high", "medium", "low"].includes(feature.properties.geometry_confidence));
  }
});

test("exports a transparent Overture footprint review queue", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const { OLDTOWN_SPOTS } = await import("../app/data/oldtown-spots.ts");
  const candidatePath = fileURLToPath(new URL("../public/data/bangkok-rowhouse-footprint-candidates.geojson", import.meta.url));
  const summaryPath = fileURLToPath(new URL("../app/data/rowhouse-footprint-summary.json", import.meta.url));
  const data = JSON.parse(readFileSync(candidatePath, "utf8"));
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  const knownSlugs = new Set(OLDTOWN_SPOTS.map((spot) => spot.slug));
  assert.equal(data.type, "FeatureCollection");
  assert.match(data.source, /Overture Maps buildings release/);
  assert.match(data.caveat, /not confirmed rowhouses/i);
  assert.match(data.caveat, /not.*heritage designations/i);
  assert.ok(data.features.length > 500, "candidate queue is unexpectedly thin");
  assert.equal(data.candidate_count, data.features.length);
  assert.equal(summary.candidate_count, data.features.length);
  assert.equal(summary.strong_count + summary.possible_count, data.features.length);
  assert.equal(summary.overture_release, data.features[0].properties.overture_release);
  const ids = new Set();
  for (const feature of data.features) {
    assert.ok(["Polygon", "MultiPolygon"].includes(feature.geometry.type));
    assert.ok(!ids.has(feature.properties.overture_id), `duplicate Overture ID: ${feature.properties.overture_id}`);
    ids.add(feature.properties.overture_id);
    assert.ok(knownSlugs.has(feature.properties.cluster_slug), `unknown corridor: ${feature.properties.cluster_slug}`);
    assert.ok(feature.properties.morphology_score >= data.method.score_threshold && feature.properties.morphology_score <= 1);
    assert.equal(feature.properties.review_status, "unverified candidate");
    assert.equal(feature.properties.not_heritage_designation, true);
  }
  for (const slug of knownSlugs) {
    assert.ok(summary.by_cluster[slug] > 0, `${slug}: no building candidates returned`);
  }
});

test("serves an evidence-led comparative case for Old Bangkok", async () => {
  const response = await render("/case-for-bangkok");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Bangkok is not one old town/);
  assert.match(html, /Better is the wrong first word\. Richer is testable/);
  assert.match(html, /What the evidence can—and cannot—say/);
  for (const comparator of ["George Town", "Vigan", "Hoi An", "Luang Prabang", "Galle Fort"]) {
    assert.match(html, new RegExp(comparator), `comparison missing: ${comparator}`);
  }
  assert.match(html, /Not proved/);
  assert.match(html, /Download open GeoJSON/);
});

test("keeps the editorial heritage register at /heritage", async () => {
  // Pre-2026-08-11 the register was at /, with /heritage as a
  // permanentRedirect. After the redesign, /heritage is the actual
  // register page (200), and the homepage is the 3D map. Anyone who
  // saved /heritage during the redirect-stub era now lands on the
  // real register, not a redirect.
  const response = await render("/heritage");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Bangkok&#x27;s heritage,|Bangkok's heritage,/);
  assert.match(html, /monument by monument/);
  assert.match(html, /register-canvas/);
  assert.match(html, /register-filters/);
  assert.match(html, /Fine Arts Department/);
  assert.match(html, /application\/ld\+json/);
});

test("ships a heritage register whose Minecraft coordinates are inside the worlds", async () => {
  // The whole point of the page is that a block coordinate walks you to a
  // real monument. This is the check that fails if the projection, the world
  // bounds, or the register build ever drift apart.
  const { default: register } = await import("../public/heritage-register.json", {
    with: { type: "json" },
  });

  assert.ok(register.counts.walkable > 100, "expected 100+ walkable monuments");
  assert.equal(
    register.sites.filter((site) => site.block).length,
    register.counts.walkable,
  );

  for (const site of register.sites) {
    if (!site.block) continue;
    const world = register.worlds[site.world];
    assert.ok(world, `${site.id} names a world that is not in the payload`);
    assert.ok(
      site.block.x >= 0 && site.block.x <= world.blocks.maxX,
      `${site.id} x=${site.block.x} outside 0..${world.blocks.maxX}`,
    );
    assert.ok(
      site.block.z >= 0 && site.block.z <= world.blocks.maxZ,
      `${site.id} z=${site.block.z} outside 0..${world.blocks.maxZ}`,
    );
  }

  // A district-precision row must never carry a coordinate — that is the
  // difference between "we do not know" and a plausible-looking guess.
  for (const site of register.sites) {
    if (site.precision !== "district") continue;
    assert.equal(site.lat, undefined, `${site.id} is district-precision but pinned`);
    assert.equal(site.block, undefined, `${site.id} is district-precision but walkable`);
  }
});

test("serves the Bangkok-by-the-numbers about page", async () => {
  // The /about page is the dry frame for the city: 30+ stats with
  // source attribution on every line, then the Dr Non essay (the
  // qualitative side). Numbers first, photos+prose second.
  const response = await render("/about");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  // Numbers
  assert.match(html, /Bangkok by the numbers/);
  assert.match(html, /<div class="register"><header class="register-masthead">/);
  assert.match(html, /numbers-page/);
  assert.match(html, /numbers-stat-grid/);
  // 10.54M population, 39.9M visitors, 571 monuments, 432,077 buildings
  assert.match(html, /10\.54/);
  assert.match(html, /39\.9/);
  assert.match(html, /571/);
  assert.match(html, /432,077/);
  // The first read is intentionally short: four essential sections remain
  // open, while the 30-measure ledger and personal essay use native,
  // keyboard-accessible disclosure controls.
  assert.match(html, /<details class="numbers-disclosure numbers-ledger" id="full-ledger">/);
  assert.match(html, /Open 30 more measures/);
  assert.match(html, /<details class="numbers-disclosure numbers-essay-disclosure" id="essay">/);
  assert.match(html, /Read Dr Non(?:&#x27;|&apos;|')s Bangkok/);
  assert.doesNotMatch(html, /<details[^>]+(?:full-ledger|essay)[^>]+open/);
  // The 8 section eyebrows are present (the middot renders fine in HTML)
  for (const eyebrow of [
    "People",
    "Economy",
    "Tourism",
    "Sentiment",
    "Air",
    "Safety",
    "Heritage",
    "Food (?:&|&amp;) street economy",
  ]) {
    assert.match(html, new RegExp(eyebrow));
  }
  // Source attributions are visible on every stat
  assert.match(html, /NSO/);
  assert.match(html, /TAT/);
  assert.match(html, /PCD/);
  assert.match(html, /Numbeo/);
  // The Dr Non essay is the qualitative second half
  assert.match(html, /numbers-essay/);
  assert.match(html, /dr-non-siam-square\.jpg/);
  assert.match(html, /application\/ld\+json/);
});

test("renders a heritage quarter page with photo attribution", async () => {
  const response = await render("/areas/kudi-chin");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Kudi Chin/);
  assert.match(html, /Santa Cruz/);
  assert.match(html, /Wikimedia Commons/);
  assert.match(html, /CC BY/i);
  assert.match(html, /In the Fine Arts register/);
  assert.match(html, /Arrive without a car/);
  assert.match(html, /The nearest useful stops/);
  assert.match(html, /See every route in 3D/);
  assert.match(html, /Cross-river ferry|MRT Blue|Express Boat|Tourist Boat/);
});

test("renders a heritage walk page with numbered stops", async () => {
  const response = await render("/walks/six-faiths");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Six Faiths of Kudi Chin/);
  assert.match(html, /Wat Kalayanamit/);
  assert.match(html, /Bang Luang Mosque/);
  assert.match(html, /walk-stop-n/);
  assert.match(html, /OSRM foot profile/);
});

test("walk pages show real gazette and leg-distance numbers, not estimates", async () => {
  const response = await render("/walks/six-faiths");
  assert.equal(response.status, 200);
  const html = await response.text();
  // "By the numbers" block: gazetted/awaiting split, oldest gazette age
  assert.match(html, /By the numbers/);
  assert.match(html, /gazetted/);
  assert.match(html, /Oldest gazette entry/);
  assert.match(html, /years ago/);
  // Per-stop: at least one real OSRM leg distance rendered. React splits
  // adjacent JSX expressions with hydration comment markers, so match
  // loosely rather than assuming the numbers sit next to their words.
  assert.match(html, /walk-stop-numbers/);
  assert.match(html, /m from stop/);
  assert.match(html, /min walk/);
});

test("heritage-places.json carries real per-stop and per-walk numbers", async () => {
  const { default: places } = await import("../app/data/heritage-places.json", {
    with: { type: "json" },
  });
  for (const walk of places.walks) {
    assert.ok(walk.stats, `${walk.slug}: missing stats`);
    assert.ok(
      walk.stats.gazetted + walk.stats.awaitingConsideration === walk.stats.citedInRegister,
      `${walk.slug}: gazetted+awaiting must equal citedInRegister`,
    );
    // Every stop after the first on a routed walk carries a real OSRM leg —
    // never a straight-line guess standing in for one.
    if (walk.distanceM) {
      for (const stop of walk.stops.slice(1)) {
        assert.ok(
          typeof stop.distanceFromPrevM === "number" && stop.distanceFromPrevM > 0,
          `${walk.slug}/${stop.name}: missing real leg distance`,
        );
      }
    }
  }
});

test("404s an unknown quarter and an unknown walk", async () => {
  assert.equal((await render("/areas/atlantis")).status, 404);
  assert.equal((await render("/walks/atlantis")).status, 404);
});

test("heritage places data is internally consistent", async () => {
  const { default: places } = await import("../app/data/heritage-places.json", {
    with: { type: "json" },
  });
  const { default: photos } = await import("../public/heritage/photos.json", {
    with: { type: "json" },
  });
  const { default: geometry } = await import("../public/heritage-walk-geometry.json", {
    with: { type: "json" },
  });
  const { existsSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");

  const walkSlugs = new Set(places.walks.map((w) => w.slug));
  const okLicence = /^(PD|Public domain|CC0|CC[ -]?BY)/i;

  for (const area of places.areas) {
    // every walk an area advertises must exist
    for (const w of area.walks) assert.ok(walkSlugs.has(w), `${area.slug} -> missing walk ${w}`);
    // every area photo must exist on disk with a free licence on record
    const photo = photos[area.photo];
    assert.ok(photo, `${area.slug}: no attribution entry for photo '${area.photo}'`);
    assert.match(photo.licence, okLicence, `${area.slug}: licence '${photo.licence}' not free`);
    const onDisk = fileURLToPath(new URL(`../public${photo.file}`, import.meta.url));
    assert.ok(existsSync(onDisk), `${area.slug}: photo file missing ${photo.file}`);
  }

  // no photo reused across slots
  const titles = Object.values(photos).map((p) => p.title);
  assert.equal(new Set(titles).size, titles.length, "a Commons photo is used twice");

  for (const walk of places.walks) {
    assert.ok(walk.stops.length >= 4, `${walk.slug}: fewer than 4 stops`);
    for (const stop of walk.stops) {
      assert.ok(
        typeof stop.lat === "number" && typeof stop.lon === "number",
        `${walk.slug}/${stop.name}: unresolved stop`,
      );
      // a hand-placed stop must say so and say why
      if (stop.locatedBy === "hand") {
        assert.ok(stop.approx && stop.approxWhy, `${walk.slug}/${stop.name}: silent hand placement`);
      }
    }
    // routed walks carry a line whose ends sit near the first and last stop
    const geom = geometry[walk.slug];
    if (walk.distanceM) {
      assert.ok(geom?.line?.length > 10, `${walk.slug}: distance without a line`);
      const [flon, flat] = geom.line[0];
      const near = (a, b) => Math.abs(a - b) < 0.005;
      assert.ok(
        near(flat, walk.stops[0].lat) && near(flon, walk.stops[0].lon),
        `${walk.slug}: route line does not start at stop 1`,
      );
    }
  }
});

test("renders the About page with all nine essay photos", async () => {
  const response = await render("/about");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The city that never got the plaque/);
  assert.match(html, /Thammasat/);
  assert.match(html, /Penang.*Kyoto.*Vienna.*Graz.*Prague.*Warsaw.*Krakow.*Wigan/s);
  assert.match(html, /571 monuments/);
  for (const file of [
    "dr-non-siam-square.jpg", "dr-non-thammasat.jpg", "wat-arun-lasers.jpg",
    "temples-everywhere.jpg", "foodstalls-at-night.jpg", "safe-city-night.jpg",
    "shophouses-midnight.jpg", "alley-wat-arun-view.jpg", "bangkok-waterfront.jpg",
    "open-space-oldtown.jpg",
  ]) {
    assert.match(html, new RegExp(`/about/${file}`), `missing photo ${file}`);
  }
});

test("Thai translations cover every area and walk slug, with no stray keys", async () => {
  const { default: places } = await import("../app/data/heritage-places.json", {
    with: { type: "json" },
  });
  const { AREA_TH, WALK_TH, ABOUT_TH } = await import("../app/data/heritage-translations-th.ts");

  const areaSlugs = new Set(places.areas.map((a) => a.slug));
  const walkSlugs = new Set(places.walks.map((w) => w.slug));

  for (const slug of areaSlugs) {
    assert.ok(AREA_TH[slug], `AREA_TH missing translation for ${slug}`);
    assert.ok(AREA_TH[slug].prose.length >= 1, `AREA_TH[${slug}] has no prose`);
  }
  for (const key of Object.keys(AREA_TH)) {
    assert.ok(areaSlugs.has(key), `AREA_TH has a stray slug not in heritage-places.json: ${key}`);
  }

  for (const walk of places.walks) {
    const t = WALK_TH[walk.slug];
    assert.ok(t, `WALK_TH missing translation for ${walk.slug}`);
    for (const stop of walk.stops) {
      assert.ok(
        typeof t.stops[stop.name] === "string" && t.stops[stop.name].length > 0,
        `WALK_TH[${walk.slug}] missing stop translation for "${stop.name}"`,
      );
    }
  }
  for (const key of Object.keys(WALK_TH)) {
    assert.ok(walkSlugs.has(key), `WALK_TH has a stray slug not in heritage-places.json: ${key}`);
  }

  assert.equal(ABOUT_TH.paragraphs.length, 9, "About essay Thai translation must have exactly 9 paragraphs");
  for (const key of ["portrait", "thammasat", "watarun1", "temples", "foodstalls", "safecity", "shophouses", "alley", "waterfront", "openspace"]) {
    assert.ok(ABOUT_TH.captions[key], `ABOUT_TH.captions missing "${key}"`);
  }
});

test("EN and TH dictionaries have exactly matching key sets", async () => {
  const { DICTIONARY } = await import("../app/i18n/dictionary.ts");
  const enKeys = Object.keys(DICTIONARY.en).sort();
  const thKeys = Object.keys(DICTIONARY.th).sort();
  assert.deepEqual(thKeys, enKeys, "dictionary.ts: en/th key sets diverged");
});

// ---------------------------------------------------------------------------
// data.go.th POI layers — 5 GeoJSON files under site/public/pois/
// Every feature is asserted to be inside the BKK bbox. The 5 files are
// the only source of truth for the 5 atlas layer toggles; if any of them
// shrink below 1 feature or ships an out-of-bbox pin, the BKK-bbox test
// catches it here rather than as a broken-pin ghost on the live map.
// ---------------------------------------------------------------------------

const BKK_BBOX = { lngMin: 100.2, lngMax: 101.0, latMin: 13.4, latMax: 14.2 };
const POI_FILES = [
  "temples",
  "royal-temples",
  "national-museums",
  "national-libraries",
  "national-archives",
  "oldtown",
];

test("the 6 POI GeoJSON files exist and parse (5 data.go.th + 1 BKKx rowhouse atlas)", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  for (const kind of POI_FILES) {
    const path = fileURLToPath(new URL(`../public/pois/${kind}.geojson`, import.meta.url));
    const data = JSON.parse(readFileSync(path, "utf8"));
    assert.equal(data.type, "FeatureCollection", `${kind}.geojson: not a FeatureCollection`);
    assert.ok(data.features.length > 0, `${kind}.geojson: empty FeatureCollection`);
    assert.ok(data.source_url?.startsWith("http"), `${kind}.geojson: missing source_url`);
    assert.equal(data.bbox.length, 4, `${kind}.geojson: bbox must be 4-tuple`);
  }
});

test("every data.go.th POI pin is inside the BKK bbox", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  for (const kind of POI_FILES) {
    const path = fileURLToPath(new URL(`../public/pois/${kind}.geojson`, import.meta.url));
    const data = JSON.parse(readFileSync(path, "utf8"));
    for (const f of data.features) {
      const [lng, lat] = f.geometry.coordinates;
      assert.ok(
        lng >= BKK_BBOX.lngMin && lng <= BKK_BBOX.lngMax,
        `${kind}/${f.properties.id}: lng ${lng} outside ${BKK_BBOX.lngMin}–${BKK_BBOX.lngMax}`,
      );
      assert.ok(
        lat >= BKK_BBOX.latMin && lat <= BKK_BBOX.latMax,
        `${kind}/${f.properties.id}: lat ${lat} outside ${BKK_BBOX.latMin}–${BKK_BBOX.latMax}`,
      );
      assert.ok(typeof f.properties.name_th === "string" && f.properties.name_th.length > 0,
        `${kind}/${f.properties.id}: missing Thai name`);
    }
  }
});

test("the 6 POI files are valid GeoJSON, parseable, and have non-zero features", async () => {
  // The test worker stubs out static assets, so we read the files directly
  // from disk. The real production worker (wrangler deploy) serves these as
  // immutable static assets under /pois/, which is verified by the
  // `bkkx-ship-verified` curl probe in scripts/verify-live.sh.
  const { readFileSync, statSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  for (const kind of POI_FILES) {
    const path = fileURLToPath(new URL(`../public/pois/${kind}.geojson`, import.meta.url));
    const bytes = statSync(path).size;
    assert.ok(bytes > 200, `${kind}.geojson unexpectedly small (${bytes} bytes)`);
    const text = readFileSync(path, "utf8");
    assert.match(text, /"type":\s*"FeatureCollection"/, `${kind}.geojson did not look like a FeatureCollection`);
  }
});

test("ships the Old Town architectural-detail tier with explicit provenance", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const detailPath = fileURLToPath(new URL("../public/data/bkk-heritage-detail.geojson", import.meta.url));
  const landmarksPath = fileURLToPath(new URL("../public/data/bkk-landmarks.geojson", import.meta.url));
  const detail = JSON.parse(readFileSync(detailPath, "utf8"));
  const landmarks = JSON.parse(readFileSync(landmarksPath, "utf8"));

  assert.equal(detail.type, "FeatureCollection");
  assert.equal(detail.featureCount, 9_275);
  assert.equal(detail.features.length, detail.featureCount);
  assert.match(detail.description, /full OSM footprints/i);
  assert.match(detail.description, /no roof meshes/i);
  assert.equal(landmarks.featureCount, 73);
  assert.equal(landmarks.features.length, landmarks.featureCount);
  assert.ok(landmarks.features.every((feature) => feature.properties.source),
    "every landmark part must describe its height source");
  assert.ok(landmarks.features.every((feature) => Number(feature.properties.height) > 0),
    "every landmark part must have a positive massing height");
});

test("builds Wat Arun, Wat Phra Kaew and Wat Pho as sourced, evidence-labelled hero models", async () => {
  const { readFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const heroPath = fileURLToPath(new URL("../public/data/bkk-hero-monuments.geojson", import.meta.url));
  const sourcePath = fileURLToPath(new URL("../public/data/sources/wat-arun-osm-way-snapshot.json", import.meta.url));
  const hero = JSON.parse(readFileSync(heroPath, "utf8"));
  const source = JSON.parse(readFileSync(sourcePath, "utf8"));

  assert.equal(source.elements.length, 5, "Wat Arun source snapshot must carry one central and four satellite footprints");
  assert.match(source.attribution, /OpenStreetMap contributors/);
  assert.equal(source.retrieved_at, "2026-08-17");
  assert.equal(hero.featureCount, 67);
  assert.equal(hero.features.length, hero.featureCount);
  assert.deepEqual(hero.complexes, {
    "wat-arun-prang-group": 23,
    "wat-phra-kaew-hero-structures": 20,
    "wat-pho-four-great-chedis": 24,
  });
  assert.match(hero.modelStatus, /not a measured conservation model/i);
  assert.match(hero.sourceConflict, /Fine Arts: 82 m/);
  assert.match(hero.sourceConflict, /BMA Bangkok Yai: 67 m/);
  assert.equal(Math.max(...hero.features.map((feature) => feature.properties.height)), 82);
  assert.equal(hero.features.filter((feature) => feature.properties.kind === "hero_prang").length, 7);
  assert.equal(hero.features.filter((feature) => feature.properties.kind === "satellite_prang").length, 16);
  assert.equal(hero.features.filter((feature) => feature.properties.model_status === "official-plan matched schematic").length, 20);
  assert.equal(hero.features.filter((feature) => feature.properties.kind === "hero_wat_pho_chedi").length, 24);
  assert.equal(new Set(hero.features.filter((feature) => feature.properties.kind === "hero_wat_pho_chedi").map((feature) => feature.properties.hero_id)).size, 4);
  assert.ok(hero.features.some((feature) => feature.properties.id === "grand-palace-phra-mondop-roof-7"),
    "Phra Mondop must carry the Fine Arts-documented seventh roof tier");
  for (const feature of hero.features) {
    assert.equal(feature.properties.not_measured_survey, true);
    assert.ok(feature.properties.source_url?.startsWith("https://"));
    assert.ok(feature.properties.base_height < feature.properties.height, `${feature.properties.id}: collapsed tier`);
    const ring = feature.geometry.coordinates[0];
    assert.deepEqual(ring[0], ring.at(-1), `${feature.properties.id}: footprint is not closed`);
  }
});

test("the 3D atlas shell renders the 5 POI layer toggles", async () => {
  const response = await render("/atlas/historic-core");
  const html = await response.text();
  // 5 layer chips — labels are short Thai/English and must show up in the markup
  for (const label of ["Royal Temples", "National Museums", "National Archives", "National Libraries"]) {
    assert.match(html, new RegExp(label), `chip missing in markup: ${label}`);
  }
  // Caption references the open-data registries
  assert.match(html, /data\.go\.th/);
  // 460 temples chip is opt-in (off by default) but the button still renders
  assert.match(html, /Temples/);
  assert.match(html, /Solid lines: high-confidence documented axes/);
  assert.match(html, /Satellite aerosol/);
  assert.match(html, /NASA aerosol is a dated regional optical-depth composite/);
  assert.match(html, /Old Town 3D/);
  assert.match(html, /9,275/);
  assert.match(html, /full-resolution OSM footprints/);
  assert.match(html, /evidence-labelled schematic, not measured conservation documentation/);
  assert.match(html, /67(?:<!-- -->)? hero parts across Wat Arun, Wat Phra Kaew and Wat Pho/);
  assert.match(html, /Evidence-labelled hero model/);
});

test("the shophouse essay defaults to a short argument without deleting the research", async () => {
  const response = await render("/shophouses");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The ten-minute version/);
  assert.match(html, /run out of excuses for not counting them/);
  assert.match(html, /Full research companion/);
  assert.match(html, /Open the long read/);
  assert.match(html, /documented clusters/);
  assert.match(html, /candidate footprints/);
  assert.match(html, /Open Bangkok(?:&#x27;|')s rowhouse register/);
  assert.match(html, /<details[^>]+sh-research-companion/);
});

test("every primary public route renders successfully", async () => {
  for (const route of [
    "/", "/about", "/heritage", "/rowhouses", "/case-for-bangkok", "/worlds",
    "/atlas/historic-core", "/areas/kudi-chin", "/walks/six-faiths",
    "/shophouses", "/shophouses/bible", "/shophouses/global",
    "/shophouses/print", "/shophouses/research",
  ]) {
    const response = await render(route);
    assert.equal(response.status, 200, `${route} is not shippable`);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i, `${route} is not HTML`);
  }
});

test("serves the global shophouse research page with map, origins, and verdicts", async () => {
  const response = await render("/shophouses/global");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();

  // Lede
  assert.match(html, /The shophouse outside Bangkok/);
  // Subtitle counts are derived from the data now (8 UNESCO among 19)
  assert.match(html, /UNESCO World Heritage towns among the(?:\s|<!-- -->)*\d+/);
  // Page map renders the schematic SVG
  assert.match(html, /sh-globalmap/);
  // Origin ports — all five
  for (const port of ["Quanzhou", "Xiamen", "Guangzhou", "Chaozhou", "Fuzhou"]) {
    assert.match(html, new RegExp(port), `origin port missing: ${port}`);
  }
  // UNESCO towns (4) all rendered
  for (const town of ["Melaka", "George Town", "Hoi An", "Vigan"]) {
    assert.match(html, new RegExp(town), `UNESCO town missing: ${town}`);
  }
  // Migration routes — at least 3 of the 9 vector names
  for (const vec of ["Hokkien", "Cantonese", "Teochew"]) {
    assert.match(html, new RegExp(vec), `migration community missing: ${vec}`);
  }
  // Verdict tags appear
  assert.match(html, /overtouristed/);
  assert.match(html, /gentrified/);
  // All sources are HTTPS
  const hrefs = [...html.matchAll(/href="(https:\/\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(hrefs.length > 5, `expected multiple HTTPS sources, got ${hrefs.length}`);
  for (const h of hrefs) {
    assert.ok(h.startsWith("https://"), `non-HTTPS source: ${h}`);
  }
  // Application/ld+json
  assert.match(html, /application\/ld\+json/);
  // Photos link out, not host
  assert.match(html, /upload\.wikimedia\.org/);
});

test("every global shophouse town has a real source URL and a verdict", async () => {
  const { TOWNS, MIGRATION_ROUTES } = await import("../app/data/shophouse-global.ts");
  assert.ok(TOWNS.length >= 14, `expected at least 14 towns, got ${TOWNS.length}`);
  for (const t of TOWNS) {
    assert.ok(t.name.length > 1, `${t.id}: missing name`);
    assert.ok(t.countryCode.length === 2, `${t.id}: countryCode must be ISO-2`);
    assert.ok(t.lat >= -8 && t.lat <= 42 && t.lon >= 78 && t.lon <= 125, `${t.id}: outside the map bbox (${t.lat},${t.lon})`);
    assert.ok(
      ["UNESCO", "national", "regional", "precinct", "none"].includes(t.protection),
      `${t.id}: invalid protection`,
    );
    assert.ok(
      [
        "five-foot way", "tubular Chinese", "qilou", "bahay na bato",
        "shikumen", "lianpai", "store-residence", "riverside shop",
        "ruko", "colonial townhouse",
      ].includes(t.kind),
      `${t.id}: invalid kind`,
    );
    assert.ok(
      [
        "family-firm surviving", "gentrified", "overtouristed",
        "transformed", "frozen", "abandoned", "research-stage",
      ].includes(t.impact.verdict),
      `${t.id}: invalid impact verdict`,
    );
    assert.ok(t.impact.body.length > 50, `${t.id}: impact body is too thin`);
    assert.ok(t.sources.length >= 1, `${t.id}: no sources`);
    for (const s of t.sources) {
      assert.ok(s.url.startsWith("https://"), `${t.id}: non-HTTPS source ${s.url}`);
    }
  }
  // Migration routes are consistent (from + to must exist)
  for (const r of MIGRATION_ROUTES) {
    const to = TOWNS.find((t) => t.id === r.to);
    assert.ok(to, `migration route ${r.id} points at unknown town: ${r.to}`);
    assert.ok(r.source.url.startsWith("https://"), `route ${r.id}: non-HTTPS source`);
  }
});

test("the essay masthead has a Global nav link", async () => {
  const response = await render("/shophouses");
  const html = await response.text();
  assert.match(html, /href="\/shophouses\/global"/, "essay masthead missing Global link");
});

test("the Shophouse Health Index renders the ranking, comparison, and the Singapore caution", async () => {
  const response = await render("/shophouses/global");
  assert.equal(response.status, 200);
  const html = await response.text();

  // Ranking table
  assert.match(html, /The Shophouse Health Index/);
  assert.match(html, /sh-rank-table/);
  // All 18 towns (14 from before + Ipoh + Kuching + KL + Bangkok) are scored
  for (const name of [
    "Melaka", "George Town", "Vigan", "Hoi An",
    "Phuket", "Pingyao", "Lijiang", "Singapore",
    "Phnom Penh", "Jakarta", "Galle", "Luang Prabang",
    "Zhouzhuang", "Ipoh", "Kuching", "Kuala Lumpur",
    "Bangkok — Sukhumvit 71",
  ]) {
    assert.match(html, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `town missing from index: ${name}`);
  }
  // Singapore's caution is stated without asserting a rank the table
  // could contradict — the rank sentence above the board is derived.
  assert.match(html, /bottom tier/i);
  // Bangkok baseline tagged
  assert.match(html, /Bangkok baseline/);
  // Comparison board pre-pinned with Singapore + Bangkok
  assert.match(html, /Side by side/);
  // Pin / Unpin controls
  assert.match(html, /Unpin/);
});

test("every town in the index has the five 1-5 metric scores plus a verdict", async () => {
  const { TOWNS, RANKED_TOWNS, BANGKOK_BASELINE_ID, SINGAPORE_ID, compositeScore } = await import(
    "../app/data/shophouse-global.ts"
  );
  assert.equal(TOWNS.length, RANKED_TOWNS.length, "RANKED_TOWNS must mirror TOWNS");
  // Sorted descending by composite
  for (let i = 1; i < RANKED_TOWNS.length; i++) {
    const prev = compositeScore(RANKED_TOWNS[i - 1].score);
    const curr = compositeScore(RANKED_TOWNS[i].score);
    assert.ok(prev >= curr, `ranked order broken at index ${i}: ${prev} -> ${curr}`);
  }
  // Singapore is below the Bangkok baseline on the index (by the user's brief)
  const baseline = TOWNS.find((t) => t.id === BANGKOK_BASELINE_ID);
  const sg = TOWNS.find((t) => t.id === SINGAPORE_ID);
  assert.ok(baseline && sg, "both baseline and Singapore entries must exist");
  const baselineComposite = compositeScore(baseline.score);
  const sgComposite = compositeScore(sg.score);
  assert.ok(sgComposite < baselineComposite, `Singapore (${sgComposite}) should be below Bangkok baseline (${baselineComposite})`);
  for (const t of TOWNS) {
    for (const m of ["authenticity", "continuity", "vitality", "restraint", "wisdom"]) {
      const v = t.score[m];
      assert.ok(Number.isInteger(v) && v >= 1 && v <= 5, `${t.id}.${m} = ${v} (must be 1..5 integer)`);
    }
    assert.ok(
      ["ideal", "thriving", "stable", "vulnerable", "lost"].includes(t.score.verdict),
      `${t.id}: invalid score verdict`,
    );
    assert.ok(t.score.editorial.length > 20, `${t.id}: editorial too thin`);
  }
});

test("Bangkok reference photos are real Wikimedia URLs and the page lists them", async () => {
  const response = await render("/shophouses/global");
  const html = await response.text();
  // 6 Bangkok photos from the search
  const bkkPhotos = [
    "Old_shophouses_in_the_Yaowarat_Road_area_01",
    "Old_shophouses_in_the_Yaowarat_Road_area_02",
    "TMB_Thanachart_Chinatown",
    "The_Chinatown_Rama_07.23",
    "%E6%9B%BC%E8%B0%B7%E5%94%90%E4%BA%BA%E8%A1%9720190824_03",
    "Bangkok_architecture%2C_Banglamphu",
  ];
  for (const name of bkkPhotos) {
    assert.match(html, new RegExp(name), `Bangkok photo missing: ${name}`);
  }
  // Each Bangkok photo links to its Commons source page
  assert.match(html, /commons\.wikimedia\.org\/wiki\/File:/);
  // Each photo has a credit line
  assert.match(html, /Supanut Arunoprayote/);
  assert.match(html, /MOS ss/);
});

test("each UNESCO town carries the WHC metadata block and OUV summary", async () => {
  const response = await render("/shophouses/global");
  const html = await response.text();

  // 8 UNESCO pills + 8 criteria blocks
  const unescoPills = (html.match(/sh-unesco-pill/g) ?? []).length;
  const criteriaBlocks = (html.match(/sh-unesco-criteria/g) ?? []).length;
  assert.ok(unescoPills >= 8, `expected at least 8 UNESCO pills, got ${unescoPills}`);
  assert.ok(criteriaBlocks >= 8, `expected at least 8 criteria blocks, got ${criteriaBlocks}`);

  // OUV quote is the lead-in for each
  const ouvCount = (html.match(/Outstanding Universal Value/g) ?? []).length;
  assert.ok(ouvCount >= 8, `expected at least 8 OUV quotes, got ${ouvCount}`);

  // The 7 WHC map links
  for (const id of [1223, 948, 502, 812, 811, 451, 479]) {
    assert.match(html, new RegExp(`whc\\.unesco\\.org/en/list/${id}/maps`), `map link missing for WHC ${id}`);
  }

  // Specific criteria show up (entity-encoded &amp; is fine)
  assert.match(html, /Criteria .*ii, iii, iv/);
  assert.match(html, /Criteria .*ii, v/);
  assert.match(html, /Criteria .*iv/);

  // Each UNESCO town gets a "official boundary map" link
  const mapLinks = (html.match(/official boundary map/g) ?? []).length;
  assert.ok(mapLinks >= 8, `expected 8 official map links, got ${mapLinks}`);
});

test("the key academic references list is rendered with all 8 canonical works", async () => {
  const { KEY_REFERENCES } = await import("../app/data/shophouse-global.ts");
  const response = await render("/shophouses/global");
  const html = await response.text();
  assert.match(html, /Key references/);
  // The labels contain "&" which gets HTML-encoded to &amp; — match either form
  for (const [key, ref] of Object.entries(KEY_REFERENCES)) {
    // Replace & with a non-capturing group that matches both forms, then
    // escape the rest for use as a regex.
    const safe = ref.label
      .replace(/&/g, "§AMP§")
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/§AMP§/g, "(?:&amp;|&)");
    assert.match(html, new RegExp(safe), `key reference missing: ${key}`);
  }
  assert.equal(Object.keys(KEY_REFERENCES).length, 8, "expected 8 key references");
});

test("the Health Index bottom-of-table sentence is derived, not asserted", async () => {
  const { RANKED_TOWNS, TOWNS, SINGAPORE_ID, compositeScore } = await import(
    "../app/data/shophouse-global.ts"
  );
  const response = await render("/shophouses/global");
  const html = await response.text();

  const sg = TOWNS.find((t) => t.id === SINGAPORE_ID);
  const sgComposite = compositeScore(sg.score);
  const below = RANKED_TOWNS.filter((t) => compositeScore(t.score) < sgComposite);

  // The sentence must name every town actually ranked below Singapore …
  for (const t of below) {
    const short = t.name.replace(/\s*\(.*\)$/, "");
    assert.match(
      html,
      new RegExp(`above only [^<]*${short}`),
      `the Singapore sentence must name ${short}, which ranks below it`,
    );
  }
  // … and may claim "the floor of the index" only when Singapore truly is it.
  // An earlier revision asserted the floor while the table showed Shanghai lower.
  if (below.length > 0) {
    // Not just the lede sentence: the claim once survived in the pinned
    // comparison card and the how-to-read note after being killed above.
    assert.doesNotMatch(html, /the floor of the index/);
    assert.doesNotMatch(html, /the floor on purpose/);
  }
});

test("a serial UNESCO listing says its area is the whole listing's total", async () => {
  const { TOWNS } = await import("../app/data/shophouse-global.ts");
  const response = await render("/shophouses/global");
  const html = await response.text();

  // Towns sharing one WHC id are components of a serial listing (Melaka &
  // George Town, WHC 1223). The WHC publishes one property total for the
  // pair, so each component's card must say the figures are shared.
  const byId = new Map();
  for (const t of TOWNS) {
    if (t.unesco) byId.set(t.unesco.whcId, (byId.get(t.unesco.whcId) ?? 0) + 1);
  }
  let serialComponents = 0;
  for (const t of TOWNS) {
    if (t.unesco && byId.get(t.unesco.whcId) > 1) {
      serialComponents += 1;
      assert.ok(
        t.unesco.serialWith,
        `${t.id} shares WHC ${t.unesco.whcId} but declares no serialWith`,
      );
    }
  }
  // Rendered strings appear in the DOM and again in the RSC flight payload,
  // so count >= (the pill test above uses the same convention).
  const labels = (html.match(/serial listing total, shared with/g) ?? []).length;
  assert.ok(
    labels >= serialComponents,
    `expected at least ${serialComponents} serial-listing labels rendered, got ${labels}`,
  );
});

test("every count in the global page prose is derived from the data", async () => {
  const { TOWNS } = await import("../app/data/shophouse-global.ts");
  const response = await render("/shophouses/global");
  const html = await response.text();
  // The hand-written counts of an earlier revision must not return
  assert.doesNotMatch(html, /Fourteen towns/);
  assert.doesNotMatch(html, /Four UNESCO World Heritage towns/);
  assert.match(html, new RegExp(`${TOWNS.length}(?:<!-- -->)? towns, each with a photo`));
});

test("the score verdict follows its stated rules: lost ⇔ continuity 1", async () => {
  const { TOWNS } = await import("../app/data/shophouse-global.ts");
  for (const t of TOWNS) {
    if (t.score.continuity === 1) {
      assert.equal(t.score.verdict, "lost", `${t.id}: continuity 1 must read lost`);
    }
    if (t.score.verdict === "lost") {
      assert.equal(t.score.continuity, 1, `${t.id}: lost requires continuity 1`);
    }
  }
});

test("the pressure atlas has an address of its own at /shophouses/atlas", async () => {
  const { PRESSURE_TOTAL, PRESSURE_DISTRICTS, QUADRANTS } = await import(
    "../app/data/shophouse-pressure.ts"
  );
  const response = await render("/shophouses/atlas");
  assert.equal(response.status, 200);
  const html = await response.text();

  // The headline count and every quadrant, with their computed counts
  assert.match(html, new RegExp(PRESSURE_TOTAL.toLocaleString("en-US")));
  for (const q of QUADRANTS) {
    assert.match(html, new RegExp(q.count.toLocaleString("en-US")), `quadrant count ${q.id}`);
  }

  // The full district table — the one thing the essay's embed leaves out —
  // with every district named and the totals row summing to the whole set
  for (const d of PRESSURE_DISTRICTS) {
    assert.match(html, new RegExp(d.district), `district row ${d.district}`);
  }
  const sum = PRESSURE_DISTRICTS.reduce((n, d) => n + d.count, 0);
  assert.equal(sum, PRESSURE_TOTAL, "district counts must sum to the total");

  // Caveats are printed, not paraphrased away
  assert.match(html, /Morphology is not proof/);
  // Data downloads are offered from this domain
  assert.match(html, /\/data\/shophouse-pressure\.geojson/);
  assert.match(html, /\/data\/bkk-land-price\.geojson/);
});

test("the essay names the atlas's own address", async () => {
  const response = await render("/shophouses");
  const html = await response.text();
  assert.match(html, /\/shophouses\/atlas/);
});

test("/shophouses/manuscript forwards instead of 404ing", async () => {
  const response = await render("/shophouses/manuscript");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /The manuscript left this site/);
  // It offers every surviving surface
  for (const path of [
    "/shophouses/print",
    "/shophouses/atlas",
    "/shophouses/bible",
    "/shophouses/global",
    "/shophouses/research",
  ]) {
    assert.match(html, new RegExp(path.replace(/\//g, "\\/")), `must offer ${path}`);
  }
  // And stays out of the index — it is a forwarding page, not content
  assert.match(html, /noindex/);
});

test("/datasets renders the full catalogue with build-measured truth", async () => {
  const { DATASETS } = await import("../app/data/datasets.ts");
  const { default: manifest } = await import("../app/data/dataset-manifest.json", {
    with: { type: "json" },
  });
  const response = await render("/datasets");
  assert.equal(response.status, 200);
  const html = await response.text();

  // Every annotated dataset appears, with its download path and checksum
  for (const d of DATASETS) {
    assert.ok(html.includes(d.title), `catalogue entry missing: ${d.title}`);
    assert.ok(html.includes(`href="${d.file}"`), `download link missing: ${d.file}`);
    assert.ok(
      html.includes(manifest[d.file].sha256.slice(0, 12)),
      `checksum missing for ${d.file}`,
    );
  }
  // The catalogue and the manifest cover exactly the same files
  assert.deepEqual(
    DATASETS.map((d) => d.file).sort(),
    Object.keys(manifest).sort(),
    "annotations and manifest must cover the same files",
  );
  // Machine-readable catalogue for harvesters
  assert.match(html, /"@type":"DataCatalog"/);
  // Citation lines render
  assert.match(html, /Arkara, N\. \(2026\)\./);
});

test("the dataset manifest matches the files actually on disk", async () => {
  const { createHash } = await import("node:crypto");
  const { readFileSync } = await import("node:fs");
  const { default: manifest } = await import("../app/data/dataset-manifest.json", {
    with: { type: "json" },
  });
  // Spot-check three files end to end: a stale manifest is a lie with a
  // checksum on it, which is worse than no manifest.
  for (const file of [
    "/heritage-register.json",
    "/data/shophouse-pressure.geojson",
    "/data/bkk-hero-monuments.geojson",
  ]) {
    const buf = readFileSync(new URL(`../public${file}`, import.meta.url));
    assert.equal(buf.length, manifest[file].bytes, `${file}: bytes drifted — re-run data:manifest`);
    assert.equal(
      createHash("sha256").update(buf).digest("hex"),
      manifest[file].sha256,
      `${file}: checksum drifted — re-run data:manifest`,
    );
  }
});

test("the atlas offers a citable view link", async () => {
  const response = await render("/atlas/historic-core");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Cite this view/);
});

test("the atlas console carries the operator surface", async () => {
  const response = await render("/atlas/historic-core");
  const html = await response.text();
  // The citable-view control lives in the right-hand key stack (its old
  // bottom-left spot was underneath the control panel), with the cursor
  // readout and the shortcuts hint beside it.
  assert.match(html, /atlas-key-stack/);
  assert.match(html, /Cite this view/);
  assert.match(html, /atlas-cursor-readout/);
  assert.match(html, /Keyboard shortcuts/);
});

test("the ?at= parameter accepts a full camera pose and rejects garbage", async () => {
  // 5-part pose renders
  const posed = await render("/atlas/historic-core?at=100.4914,13.75,16.5,45.0,-90.0");
  assert.equal(posed.status, 200);
  // 3-part legacy links still render
  const legacy = await render("/atlas/historic-core?at=100.4914,13.75,16.5");
  assert.equal(legacy.status, 200);
  // wrong arity or out-of-range pitch degrade to the default view, not an error
  for (const bad of ["100,13", "100.49,13.75,16.5,999,0", "a,b,c"]) {
    const r = await render(`/atlas/historic-core?at=${bad}`);
    assert.equal(r.status, 200, `bad at=${bad} must not break the page`);
  }
});

test("the Health Index headers are sort controls", async () => {
  const response = await render("/shophouses/global");
  const html = await response.text();
  const sortButtons = (html.match(/sh-rank-sort/g) ?? []).length;
  assert.ok(sortButtons >= 6, `expected six sortable headers, got ${sortButtons}`);
});

test("no footer inherits the worlds-only dark chrome", async () => {
  // The bare `footer` tag rule used to paint every footer #0b0c0a; it is
  // scoped to .worlds-footer now. The shophouses footer strong (ink) was
  // invisible against it — assert the class exists only on /worlds.
  const worlds = await (await render("/worlds")).text();
  assert.match(worlds, /worlds-footer/);
  for (const path of ["/shophouses/global", "/datasets", "/heritage"]) {
    const html = await (await render(path)).text();
    assert.doesNotMatch(html, /worlds-footer/, `${path} must not carry the dark footer`);
  }
});

test("the datasets ledger is jumpable and citations are copyable", async () => {
  const { DATASETS } = await import("../app/data/datasets.ts");
  const html = await (await render("/datasets")).text();
  const indexLinks = (html.match(/datasets-index/g) ?? []).length;
  assert.ok(indexLinks >= 1, "jump index missing");
  const copyButtons = (html.match(/datasets-copy/g) ?? []).length;
  assert.ok(copyButtons >= DATASETS.length, `expected ${DATASETS.length} copy buttons, got ${copyButtons}`);
});

test("the war room computes its figures from the shipped corpus", async () => {
  const { default: register } = await import("../public/heritage-register.json", {
    with: { type: "json" },
  });
  const { PRESSURE_TOTAL, QUADRANTS } = await import("../app/data/shophouse-pressure.ts");
  const { DATASETS } = await import("../app/data/datasets.ts");

  const response = await render("/warroom");
  assert.equal(response.status, 200);
  const html = await response.text();

  // Register figures come from the register file, not from prose
  for (const n of [
    register.counts.total,
    register.counts.registered,
    register.counts.awaiting,
    register.counts.buildingPrecision,
    register.counts.districtPrecision,
  ]) {
    assert.match(html, new RegExp(n.toLocaleString("en-US")), `register figure ${n} missing`);
  }
  // Shophouse quadrants and the total
  assert.match(html, new RegExp(PRESSURE_TOTAL.toLocaleString("en-US")));
  for (const q of QUADRANTS) {
    assert.match(html, new RegExp(q.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `quadrant ${q.id}`);
  }
  // Dataset count
  assert.match(html, new RegExp(`>${DATASETS.length}<`));
  // It is an operator surface, kept out of the index
  assert.match(html, /noindex/);
});

test("the war room ships all twelve water sources and never fakes a reading", async () => {
  const { WATER_SOURCES, WATER_TALLY } = await import("../app/data/water-sources.ts");
  const html = await (await render("/warroom")).text();

  assert.equal(WATER_SOURCES.length, 12, "twelve datasets were nominated");
  for (const s of WATER_SOURCES) {
    assert.ok(html.includes(s.id), `water source missing from the panel: ${s.id}`);
  }
  // Nothing may claim ingestion until the ingest has actually run
  assert.equal(WATER_TALLY.ingested, 0, "no water dataset has been ingested yet");
  assert.equal(WATER_TALLY.awaiting, 12);
  assert.match(html, /awaiting/i);
  // The ingest route is named on the page so the next operator can run it
  assert.match(html, /ingest-bkk-water\.py/);
});

test("the camera rail renders one line and explains an empty registry", async () => {
  const html = await (await render("/warroom")).text();
  assert.match(html, /wr-cctv/);
  // No invented camera endpoints ship in the bundle
  assert.doesNotMatch(html, /snapshotUrl":\s*"http/);
  assert.match(html, /CCTV_SOURCE_URL/);
});

test("the twin source register ships with honest integration status", async () => {
  const { TWIN_SOURCES, TWIN_TALLY } = await import("../app/data/twin-sources.ts");
  const html = await (await render("/warroom")).text();

  // Names round-trip through HTML entity encoding (& -> &amp;)
  const enc = (t) => t.replace(/&/g, "&amp;");
  for (const s of TWIN_SOURCES) {
    assert.ok(html.includes(enc(s.name)), `twin source missing from the panel: ${s.id}`);
  }
  // Every source states a caveat before it is integrated — the field exists
  // so the limit is written down ahead of the chart, not discovered after.
  for (const s of TWIN_SOURCES) {
    assert.ok(s.caveat && s.caveat.length > 40, `${s.id} needs a real caveat`);
    assert.ok(s.unlocks && s.unlocks.length > 40, `${s.id} must say what it unlocks`);
  }
  // Anything needing a credential must be proxied, never browser-reachable
  for (const s of TWIN_SOURCES) {
    if (s.auth !== "none") {
      assert.equal(s.browserReachable, false, `${s.id} needs auth so must not be browser-reachable`);
    }
  }
  assert.ok(TWIN_TALLY.wired >= 1, "at least one source is actually wired");
});

test("no API key or secret is committed anywhere in the bundle", async () => {
  const { readFileSync } = await import("node:fs");
  // The Longdo key is read from Worker env at request time. Assert the source
  // never carries a literal key, and that the proxy cannot echo one: an error
  // string containing the upstream URL would leak it.
  const live = readFileSync(new URL("../worker/live.ts", import.meta.url), "utf8");
  assert.match(live, /LONGDO|key: string \| undefined|key\?: string/);
  assert.doesNotMatch(live, /key=[A-Za-z0-9]{12,}/, "a literal API key must never be committed");
  // The failure path reports a status code, not the upstream URL
  assert.match(live, /Longdo returned HTTP \$\{res\.status\}/);
  assert.doesNotMatch(live, /reason: `Longdo unreachable: \$\{upstream\}/);
});

test("weather is presented as forecast, distinct from the observed gauges", async () => {
  const html = await (await render("/warroom")).text();
  assert.match(html, /Weather/);
  assert.match(html, /Gauge network/);
  // The page must not let a model reading pass as an observation
  assert.match(html, /Forecast, not observation/);
});

test("curated cameras render as facades and never leak to Google on load", async () => {
  const { CURATED_CAMERAS } = await import("../app/data/cctv-cameras.ts");
  const html = await (await render("/warroom")).text();

  // Every supplied stream is present
  assert.ok(CURATED_CAMERAS.length >= 5, "all supplied cameras are registered");
  // A camera whose operator does not licence embedding is linked, not taken
  for (const c of CURATED_CAMERAS) {
    if (c.kind === "link") {
      assert.equal(c.videoId, "", "a link-only camera carries no embeddable id");
      assert.ok(html.includes(c.sourceUrl), `link camera must link out: ${c.id}`);
    }
  }
  for (const c of CURATED_CAMERAS.filter((x) => x.kind === "youtube")) {
    assert.ok(html.includes(c.videoId), `camera missing from the rail: ${c.videoId}`);
  }
  // Posters come from this origin, not from Google
  assert.match(html, /\/api\/live\/camera-poster\?v=/);
  assert.doesNotMatch(html, /i\.ytimg\.com/, "poster must be proxied, not hotlinked");
  // No player is constructed until a click — no iframe in the served HTML
  assert.doesNotMatch(html, /youtube-nocookie\.com\/embed/, "the embed must be built on demand only");
});

test("a placeholder camera carries a nominal marker but never a claimed place", async () => {
  // Three cameras arrived with zero identifying evidence. Per an explicit
  // operator decision they are pinned at a shared, clearly-nominal marker
  // rather than left without a coordinate — but that marker must never be
  // mistaken for evidence: no place name, no district, and the reasoning
  // must say plainly that it is a stand-in.
  const { CURATED_CAMERAS, isLocated } = await import("../app/data/cctv-cameras.ts");
  const placeholders = CURATED_CAMERAS.filter((c) => c.precision === "placeholder");
  assert.equal(placeholders.length, 3, "three cameras were supplied with no identifying evidence");

  const markers = new Set(placeholders.map((c) => `${c.lat},${c.lon}`));
  assert.equal(markers.size, 1, "placeholder cameras must share one nominal marker, never distinct invented positions");

  for (const c of placeholders) {
    assert.equal(c.place, null, `${c.id}: a placeholder marker must not carry a place name`);
    assert.equal(c.district, null, `${c.id}: a placeholder marker must not carry a district`);
    assert.match(c.locatedBy, /placeholder|no evidence/i, `${c.id} must say its coordinate is a stand-in`);
    assert.equal(isLocated(c), false, `${c.id}: a placeholder marker is not "located" for the tally`);
  }

  for (const c of CURATED_CAMERAS) {
    if (isLocated(c)) {
      assert.ok(typeof c.lat === "number" && typeof c.lon === "number", `${c.id} is located but has no coordinate`);
      assert.ok(c.place, `${c.id} is located but carries no place name`);
      assert.ok(c.locatedBy.length > 20, `${c.id} must record how it was located`);
    } else {
      // Not located (placeholder or a true, coordinate-free unconfirmed
      // entry) — either way the tile must not claim a place.
      assert.equal(c.place, null, `${c.id}: an unlocated camera must not carry a place name`);
    }
  }

  // The tile still reads "Location not confirmed" for every unlocated
  // camera, placeholder or not — the marker is invisible in the label.
  const html = await (await render("/warroom")).text();
  assert.match(html, /Location not confirmed/);
  assert.match(html, /awaiting a location/);
});
