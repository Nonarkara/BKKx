// The instruments in tools/ are how the MSH law is checked, so they get the
// same treatment as the site: a test that holds the behaviour.
//
// Three defects were found by using them, all of the same family — a tool
// that could report a result it did not earn:
//
//   1. base.mjs swapped origins but not the proxy's "/" -> "/shophouses"
//      rewrite, so a local run measured the home page and called it the
//      shophouses front page. The vertical audit reported 64 cut elements
//      against production's 34, and every one of them was the same page
//      counted twice.
//   2. The audits skipped a page they could not load and then printed
//      "no clamped element is cut vertically on any page checked" — a clean
//      bill of health for a page nobody opened. The preview server had
//      died; the audit reported success.
//   3. diff-sweeps keyed its records by array index, and the index order
//      differs between runs, so it compared different pages and called the
//      difference a change.
//
// These are pinned here so the next person who edits an instrument does not
// put the false pass back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..");
const TOOLS = join(SITE, "..", "tools");

// ---------------------------------------------------------------- base.mjs

test("a local origin reproduces the shophouse proxy's root rewrite", async () => {
  const { retarget } = await import(join(TOOLS, "lib", "base.mjs"));
  // The proxy rewrites "/" -> "/shophouses" on that host and passes
  // everything else through. A local server has no host-based rewrite, so
  // the instrument has to make it or it measures the wrong page.
  const prod = retarget("https://shophouses.nonarkara.org/");
  assert.equal(prod, "https://shophouses.nonarkara.org/");

  const local = await withArgv(
    ["--origin=http://127.0.0.1:43119", "--shop-origin=http://127.0.0.1:43119"],
    () => importFresh(join(TOOLS, "lib", "base.mjs")),
  );
  assert.equal(local.retarget("https://shophouses.nonarkara.org/"), "http://127.0.0.1:43119/shophouses");
  assert.equal(
    local.retarget("https://shophouses.nonarkara.org/shophouses/read/1"),
    "http://127.0.0.1:43119/shophouses/read/1",
  );
  // The other host is untouched by the rewrite.
  assert.equal(local.retarget("https://bkk.nonarkara.org/"), "http://127.0.0.1:43119/");
  // A third party is never silently retargeted.
  assert.equal(local.retarget("https://example.com/x"), "https://example.com/x");
});

// ------------------------------------------------------------- measure.mjs

test("a page that was not measured is reported as unverified, not as a pass", async () => {
  const { Coverage } = await import(join(TOOLS, "lib", "measure.mjs"));

  const clean = new Coverage("test");
  clean.record("https://a/", true);
  assert.equal(clean.unverified, 0);
  assert.equal(clean.summary(), 0, "a fully measured run exits 0");

  const partial = new Coverage("test");
  partial.record("https://a/", true);
  partial.record("https://b/", false);
  assert.equal(partial.unverified, 1);
  assert.equal(
    partial.summary(),
    1,
    "a run that measured nothing for a page must exit non-zero — silence is not a result",
  );
});

test("loadPage reports failure instead of throwing", async () => {
  const { loadPage } = await import(join(TOOLS, "lib", "measure.mjs"));
  const page = {
    goto: async () => {
      throw new Error("ECONNREFUSED");
    },
    waitForTimeout: async () => {},
  };
  assert.equal(await loadPage(page, "http://127.0.0.1:1/", { attempts: 2, settle: 0, wait: 0 }), false);
});

// ------------------------------------------------------------ diff-sweeps

test("the sweep diff compares pages by route, not by position", () => {
  const source = readFileSync(join(TOOLS, "diff-sweeps.mjs"), "utf8");
  assert.match(
    source,
    /rec\.route/,
    "the diff must key records by the route they measured",
  );
  assert.doesNotMatch(
    source,
    /Object\.keys\(report\.records/,
    "the diff must not key records by their array index — that order is not stable between runs",
  );
});

// ------------------------------------------------- the audits themselves

test("no audit can report a clean run without saying how much it measured", () => {
  for (const name of ["vertical-audit.mjs", "input-audit.mjs", "scale-audit.mjs"]) {
    const source = readFileSync(join(TOOLS, name), "utf8");
    assert.match(
      source,
      /Coverage/,
      `${name} must track coverage — a skipped page must not read as a pass`,
    );
    assert.match(
      source,
      /process\.exit\(code\)/,
      `${name} must exit non-zero when something went unmeasured`,
    );
  }
});

// ------------------------------------------- the 17-18 November repairs

test("the popup audit measures the cards markers actually open, or says it measured nothing", () => {
  const source = readFileSync(join(TOOLS, "popup-audit.mjs"), "utf8");
  // Heritage markers open inspector cards; the numbered chapter markers
  // only fly the camera. The click must reach for the heritage ones first,
  // and a comma list returns the first match in DOCUMENT order, so the
  // query is two steps, not one list with heritage written first.
  assert.match(
    source,
    /querySelector\('\.bkkx-heritage-marker'\)/,
    "the popup audit must query the heritage marker alone before its fallback chain",
  );
  assert.match(
    source,
    /querySelectorAll\('\.maplibregl-popup, \.atlas-heritage-popup, \.heritage-inspector-card/,
    "the popup audit must match the inspector cards markers actually open",
  );
  assert.match(
    source,
    /MEASURED NOTHING/,
    "the popup audit must refuse to read as a pass when no popup appeared",
  );
  assert.match(
    source,
    /process\.exit\(measuredPages \? 0 : 1\)/,
    "the popup audit must exit non-zero when nothing was measured",
  );
});

test("no instrument keeps measuring a selector the app no longer renders", () => {
  // 15 Nov: audit-live measured .sh-contents-strip — a strip that stopped
  // existing when the contents became the front-page parts nav (4e76f6f) —
  // and reported chip:null as data. 18 Nov: scale-audit's first selector was
  // a class from before the five-part split. Every app selector an
  // instrument reads must exist in site/app.
  const appText = (() => {
    const out = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(tsx?|css)$/.test(entry)) out.push(readFileSync(p, "utf8"));
      }
    };
    walk(join(SITE, "app"));
    return out.join("\n");
  })();
  for (const name of ["audit-live.mjs", "scale-audit.mjs", "verify-front.mjs", "shot-local.mjs"]) {
    // Comments may NARRATE a selector that stopped existing (the repair
    // comments do exactly that); only code queries count.
    const source = readFileSync(join(TOOLS, name), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const m of source.matchAll(/\.((?:sh|wr|atlas|typo|register|bkkx|maplibre)-[a-z0-9-]+)/g)) {
      assert.ok(
        appText.includes(m[1]),
        `${name} still measures .${m[1]}, which no app file renders`,
      );
    }
  }
  // and the two repairs must be present: the front-page nav instead of the
  // dead strip, and no dead class leading scale-audit's chain. Comments
  // narrate the history; only the code queries.
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const audit = strip(readFileSync(join(TOOLS, "audit-live.mjs"), "utf8"));
  assert.ok(!audit.includes("sh-contents-strip"), "audit-live still measures the contents strip that stopped existing in 4e76f6f");
  assert.ok(audit.includes(".sh-parts a"), "audit-live must measure the front-page parts nav");
  const scale = strip(readFileSync(join(TOOLS, "scale-audit.mjs"), "utf8"));
  assert.ok(!scale.includes("sh-part-eyebrow"), "scale-audit still leads with the pre-split eyebrow class");
});

test("the geometry audit does not report contained overflow, sr-only text or inline links as defects", () => {
  const source = readFileSync(join(TOOLS, "msh-audit.mjs"), "utf8");
  // Map tiles inside their map, an image cropped inside its overflow:hidden
  // frame: an ancestor catches them, the page fits, and the record must say
  // so rather than count against the route.
  assert.match(source, /overflowingCount: overflowing\.filter\(\(o\) => !o\.clippedBy\)\.length/);
  // The sr-only pattern is an accessibility device, not a clip.
  assert.match(source, /el\.clientWidth <= 1 && el\.clientHeight <= 1\) continue/);
  // Inline links and the map's own attribution are exempt from the 24px
  // floor, and the exemption must be recorded per target, not assumed.
  assert.match(source, /exempt: inline \|\| attribution/);
  assert.match(source, /el\.closest\('p, figcaption, li, td, blockquote, small, \[class\*=provenance\], \[class\*=source\]'\)/);
});

test("the 24px floor fixes the 18 November audit found stay in the stylesheet", () => {
  const css = readFileSync(join(SITE, "app", "globals.css"), "utf8");
  const typo = readFileSync(join(SITE, "app", "shophouses", "typology", "typology.css"), "utf8");
  const both = css + "\n" + typo;
  // Every tappable surface the audit measured under 24px carries a floor now
  // The failing dimension decides the fix: a bar link grows taller, the
  // narrow support-logo anchor grows wider. Either dimension meets the floor.
  const floorRule = (sel, dim) =>
    new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + `[\\s\\S]{0,420}?min-${dim}: 24px`);
  for (const [sel, dim] of [
    [".site-header nav a", "height"], [".wordmark", "height"], [".text-link", "height"],
    [".worlds-footer > div a", "height"], [".sh-support-logos a", "width"],
    [".typo-top a", "height"], [".typo-bottom a", "height"],
  ]) {
    assert.ok(floorRule(sel, dim).test(both), `${sel} must carry min-${dim}: 24px`);
  }
  // The dek's three-line clamp and the switcher's content sizing stay put
  assert.match(css, /\.sh-part-dek\s*\{[\s\S]*?-webkit-line-clamp: 3;/);
  assert.ok(
    !/\.world-switcher button\s*\{[^}]*min-height: (8[89]|9[0-9]|1[0-9][0-9])px/.test(css),
    "the world-switcher tabs must not carry the 88-112px min-height inflation again",
  );
});

test("the slop linter can honor a named exemption and still reports it", () => {
  const source = readFileSync(join(TOOLS, "slop-lint.mjs"), "utf8");
  const allow = join(TOOLS, "slop-allowlist.json");
  assert.ok(existsSync(allow), "the waiver file must exist");
  const entries = JSON.parse(readFileSync(allow, "utf8"));
  assert.ok(entries.length >= 4, "the waivers it holds: the hero band, the switcher, the hero map, and the two rule decisions");
  for (const e of entries) assert.ok(e.reason && e.reason.length > 40, "every waiver must carry its written reason");
  assert.match(source, /ALLOW\.filter\(\(?\w+\)? => \w+\.rule\)/, "the linter must apply rule-level waivers");
  assert.match(source, /applyRuleWaivers/, "the waiver application must be one shared function both scorers call");
  assert.match(source, /waived rule:/, "the linter must print what it waived");
  // emoji proper, not Extended_Pictographic (which counts the house's own
  // geometric glyphs ◩ ◆ ≋ as emoji)
  assert.match(source, /emojiCharRe/, "the emoji count must use the strict emoji definition");
  assert.match(source, /iframe\[src\*="\/atlas\/"\]/, "the map selector must see the iframe embeds the front door actually uses");
});

test("the sweep separates load failures from geometry failures", () => {
  // 18 Nov: eight /heritage pages failed page.goto on a broken local link
  // and the headline read "8 with geometry failures". A route that never
  // loaded is the run's, not the site's — the sweep says UNVERIFIED and
  // exits non-zero either way, because unverified is not a pass.
  const source = readFileSync(join(TOOLS, "msh-sweep.mjs"), "utf8");
  assert.match(source, /loadFailures/, "the sweep must bucket unverified routes separately");
  assert.match(source, /UNVERIFIED/, "an unloaded route must be named, not folded into failures");
  assert.match(source, /process\.exit\(failures\.length \|\| loadFailures\.length \? 1 : 0\)/, "the sweep must exit non-zero when a route went unverified");
});

// ---------------------------------------------------------------- helpers

async function importFresh(path) {
  // A module reads process.argv once, at import time, so a second import
  // with different arguments needs a cache-busting query.
  return import(`${path}?t=${Math.random()}`);
}

async function withArgv(argv, fn) {
  const original = process.argv;
  process.argv = [original[0], original[1], ...argv];
  try {
    return await fn();
  } finally {
    process.argv = original;
  }
}
