#!/usr/bin/env node
// three-layer-check.mjs — does the Old Town's Thai-forms layer still DRAW?
//
// The Thai forms are drawn by three.js into MapLibre's WebGL context, as a
// custom layer with a merged mesh of roughly seventy thousand triangles.
// A green build says nothing about that: three.js reaches the browser as
// bytes, and the layer can fail to load, fail to render, or render a
// different mesh.
//
// So this measures the DRAW CALLS.
//
//   - every drawElements / drawArrays call is recorded with its mode and
//     vertex/index count;
//   - the page is measured with the architectural-detail toggle ON and then
//     OFF. The detail toggle is what loads and shows the forms layer, and
//     turning it off hides the layer, so the calls that DISAPPEAR are the
//     ones that belong to it;
//   - the three.js layer's signature is the merged mesh: one call with a very
//     large index count, and nothing else in the surface draws at that size.
//
// The measurement is network-independent: the map tiles draw identically on
// both sides of a comparison, so the delta is the layer.
//
//   node three-layer-check.mjs --a=https://bkk.nonarkara.org --b=http://127.0.0.1:43119
//
// It compares two origins, because a number on its own proves nothing — the
// same number must come out of the old three.js and the new one.
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const arg = (n, d) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};

const A = arg("a");
const B = arg("b");
const PATH = arg("path", "/atlas/historic-core");
// The atlas takes a "Cite this view" camera pose in ?at=lng,lat,zoom. Using
// it makes the camera identical on both sides of a comparison, instead of
// arriving at it by wheeling — which lands somewhere slightly different
// every time and makes the two sides incomparable.
const AT = arg("at", "100.4914,13.7500,19");
const OUT = arg("out", "/tmp/bkkx-three-layer");
const W = Number(arg("w", 1440));
const H = Number(arg("h", 900));
const ZOOM_WHEELS = Number(arg("wheels", 26));

mkdirSync(OUT, { recursive: true });

// Recorded in the page before any script runs, so no draw call is missed.
const INIT = () => {
  window.__gl = { calls: [], errors: [] };
  const record = (kind) => function (...args) {
    // drawElements(mode, count, type, offset) · drawArrays(mode, first, count)
    const count = kind === "drawElements" ? args[1] : args[2];
    const mode = args[0];
    window.__gl.calls.push({ kind, mode, count });
    return window.__gl.__orig[kind].apply(this, args);
  };
  for (const proto of [WebGLRenderingContext, WebGL2RenderingContext]) {
    if (!proto) continue;
    for (const kind of ["drawElements", "drawArrays"]) {
      if (!proto.prototype[kind]) continue;
      window.__gl.__orig = window.__gl.__orig || {};
      window.__gl.__orig[kind] = proto.prototype[kind];
      proto.prototype[kind] = record(kind);
    }
  }
  window.addEventListener("error", (e) => window.__gl.errors.push(String(e.message).slice(0, 200)));
};

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

async function measure(origin, label) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 1,
    isMobile: W < 500, hasTouch: W < 500, locale: "th-TH", timezoneId: "Asia/Bangkok",
  });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => consoleErrors.push(String(e.message).slice(0, 200)));

  let loaded = false;
  for (let a = 1; a <= 4; a++) {
    try {
      await page.goto(`${origin}${PATH}?at=${AT}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      loaded = true;
      break;
    } catch (e) {
      if (a === 4) break;
      await page.waitForTimeout(3000 * a);
    }
  }
  if (!loaded) {
    await ctx.close();
    return { label, origin, loaded: false };
  }
  await page.waitForTimeout(9000);

  // The map canvas.
  const canvas = await page.$("canvas.maplibregl-canvas");
  if (!canvas) {
    await ctx.close();
    return { label, origin, loaded: true, canvas: false, consoleErrors };
  }
  const box = await canvas.boundingBox();

  await page.waitForTimeout(6000);

  // The forms layer is behind the "Old Town 3D" toggle, which is ON by
  // default. Read its real state rather than assuming: clicking a toggle
  // that is already on measures the opposite of what was intended.
  const toggle = await page.$(".detail-toggle");
  if (!toggle) {
    await ctx.close();
    return { label, origin, loaded: true, canvas: true, consoleErrors, noToggle: true };
  }
  const pressed = async () =>
    (await toggle.getAttribute("aria-pressed")) === "true";
  const wasOn = await pressed();
  if (!wasOn) {
    await toggle.click();
    await page.waitForTimeout(9000);
  }
  const onCalls = await page.evaluate(() => {
    const c = window.__gl?.calls || [];
    window.__gl.calls = [];
    return c;
  });

  // Now turn it off: the layer is hidden, so its draws stop.
  await toggle.click();
  await page.waitForTimeout(8000);
  const offCalls = await page.evaluate(() => {
    const c = window.__gl?.calls || [];
    window.__gl.calls = [];
    return c;
  });

  await page.screenshot({ path: `${OUT}/${label}.png`, timeout: 90000 });

  const signature = (calls) => {
    const m = new Map();
    for (const c of calls) {
      const key = `${c.kind}/${c.mode}/${c.count}`;
      m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  };
  const sigOn = signature(onCalls);
  const sigOff = signature(offCalls);
  const delta = [...sigOn.entries()].filter(([k]) => !sigOff.has(k));
  const onAgain = await pressed();

  await ctx.close();
  return {
    label, origin, loaded: true, canvas: true, consoleErrors,
    onTotal: onCalls.length, offTotal: offCalls.length,
    wasOn, delta,
    // The three.js layer is the merged mesh: one call, a very large count.
    biggest: delta.reduce((m, [k, n]) => {
      const count = Number(k.split("/")[2]);
      return count > m.count ? { count, n, key: k } : m;
    }, { count: 0, n: 0, key: null }),
  };
}

const a = await measure(A, "a");
const b = await measure(B, "b");

for (const r of [a, b]) {
  console.log(`\n=== ${r.label}: ${r.origin} ===`);
  if (!r.loaded) { console.log("  LOAD FAILED"); continue; }
  if (r.canvas === false) { console.log("  NO MAP CANVAS"); continue; }
  console.log(`  draw calls: on=${r.onTotal} off=${r.offTotal}`);
  console.log(`  calls that disappear when the layer is hidden: ${r.delta.length}`);
  for (const [k, n] of r.delta.slice(0, 6)) console.log(`    ${k} ×${n}`);
  console.log(`  biggest disappearing call: ${JSON.stringify(r.biggest)}`);
  console.log(`  console errors: ${r.consoleErrors.length}`);
  for (const e of r.consoleErrors.slice(0, 5)) console.log(`    ${e}`);
}

if (a.canvas && b.canvas && a.delta && b.delta) {
  const ka = a.biggest.key;
  const kb = b.biggest.key;
  console.log(`\nlayer signature  A: ${ka}`);
  console.log(`layer signature  B: ${kb}`);
  if (ka && kb && ka === kb && a.biggest.count > 1000) {
    console.log(`\nMATCH: both builds draw the merged mesh with the same signature (${a.biggest.count}).`);
  } else {
    console.log(`\nDIFFERENT — the layer did not draw the same mesh on both sides.`);
    process.exitCode = 1;
  }
  if (a.consoleErrors.length || b.consoleErrors.length) process.exitCode = 1;
}

writeFileSync(`${OUT}/result.json`, JSON.stringify({ a, b }, null, 2));
await browser.close();
