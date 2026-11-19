#!/usr/bin/env node
// atlas-3d-check.mjs — does the Atlas's 3D massing still DRAW?
//
// The Atlas resolves three.js through an inline import map that points at
// unpkg. Bumping that pin moves the RUNTIME, not just the dependency: the
// browser now loads a different three.js than the one the code was written
// against. The Atlas's own gates check that the import map and the source
// pins agree and that the CSP hash matches — none of which asks whether a
// single triangle is drawn.
//
// So this opens the live Atlas at street zoom, counts the WebGL draw calls,
// watches for console errors, checks which three.js the browser actually
// fetched, and takes a picture of the result.
//
//   node atlas-3d-check.mjs --url=https://atlas.nonarkara.org
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const args = process.argv.slice(2);
const arg = (n, d) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const URL_ = arg("url", "https://atlas.nonarkara.org");
const AT = arg("at", "100.4914,13.7500,17");
const OUT = arg("out", "/tmp/bkkx-atlas-3d");
const W = Number(arg("w", 1440));
const H = Number(arg("h", 900));

mkdirSync(OUT, { recursive: true });

const INIT = () => {
  window.__gl = { calls: [] };
  for (const proto of [WebGLRenderingContext, WebGL2RenderingContext]) {
    if (!proto) continue;
    for (const kind of ["drawElements", "drawArrays"]) {
      if (!proto.prototype[kind]) continue;
      const orig = proto.prototype[kind];
      proto.prototype[kind] = function (...a) {
        window.__gl.calls.push({ kind, mode: a[0], count: kind === "drawElements" ? a[1] : a[2] });
        return orig.apply(this, a);
      };
    }
  }
};

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({
  viewport: { width: W, height: H }, deviceScaleFactor: 1, locale: "th-TH", timezoneId: "Asia/Bangkok",
});
await ctx.addInitScript(INIT);
const page = await ctx.newPage();

const consoleErrors = [];
const threeFetches = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => consoleErrors.push(String(e.message).slice(0, 200)));
page.on("request", (r) => { if (/three/i.test(r.url())) threeFetches.push(r.url().slice(0, 120)); });

await page.goto(`${URL_}/?at=${AT}`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(20000);

// Ask the page what it thinks it loaded.
const info = await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  const map = document.querySelector(".maplibregl-canvas") || canvas;
  return {
    canvas: !!canvas,
    canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
    importMap: (document.querySelector('script[type="importmap"]')?.textContent || "").match(/three@[0-9.]+/)?.[0] || null,
    layers: window.__atlasLayerIds || null,
    drawCalls: window.__gl?.calls.length || 0,
  };
});
await page.waitForTimeout(3000);
const after = await page.evaluate(() => {
  const calls = window.__gl?.calls || [];
  const byKind = {};
  let biggest = 0;
  for (const c of calls) {
    byKind[c.kind] = (byKind[c.kind] || 0) + 1;
    if (c.count > biggest) biggest = c.count;
  }
  return { total: calls.length, byKind, biggest };
});
await page.screenshot({ path: `${OUT}/atlas-3d.png`, timeout: 90000 });

console.log(`\n=== ${URL_} ?at=${AT} @${W}x${H} ===`);
console.log(`  import map in the served page : ${info.importMap}`);
console.log(`  three.js the browser fetched  : ${[...new Set(threeFetches)].join(", ") || "(none seen)"}`);
console.log(`  canvas                        : ${info.canvas ? info.canvasSize.w + "×" + info.canvasSize.h : "NONE"}`);
console.log(`  WebGL draw calls              : ${after.total} (${JSON.stringify(after.byKind)})`);
console.log(`  biggest single draw           : ${after.biggest} vertices`);
console.log(`  console errors                : ${consoleErrors.length}`);
for (const e of consoleErrors.slice(0, 6)) console.log(`    ${e}`);

const drawn = after.total > 0 && after.biggest > 1000 && consoleErrors.length === 0;
console.log(`\n${drawn ? "DRAWS: the 3D massing is rendering." : "NOT PROVEN — read the numbers above."}`);
writeFileSync(`${OUT}/result.json`, JSON.stringify({ info, after, consoleErrors, threeFetches: [...new Set(threeFetches)] }, null, 2));
await browser.close();
process.exit(drawn ? 0 : 1);
