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
  assert.match(html, /Rowhouses 29/);
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
  assert.match(html, /numbers-page/);
  assert.match(html, /numbers-stat-grid/);
  // 10.54M population, 39.9M visitors, 571 monuments, 432,077 buildings
  assert.match(html, /10\.54/);
  assert.match(html, /39\.9/);
  assert.match(html, /571/);
  assert.match(html, /432,077/);
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
  assert.match(html, /Four UNESCO World Heritage towns/);
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

test("the Shophouse Health Index renders the ranking, comparison, and Singapore-as-floor", async () => {
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
  // Singapore explicitly called out as floor
  assert.match(html, /Singapore.*floor of the index/i);
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
