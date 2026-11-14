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
import { readFileSync } from "node:fs";
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
