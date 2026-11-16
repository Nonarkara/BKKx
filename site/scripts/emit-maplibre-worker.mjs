#!/usr/bin/env node
/**
 * emit-maplibre-worker.mjs
 * -------------------------
 * Put MapLibre's web worker where MapLibre will look for it.
 *
 * MapLibre 6 loads its worker as a SIBLING of the module that spawns it:
 *
 *   function el() {
 *     let e = import.meta.url;
 *     if (!/^https?:/.test(e)) return ``;            // not a browser
 *     let t = e.endsWith(`-dev.mjs`) ? `maplibre-gl-worker-dev.mjs`
 *                                      : `maplibre-gl-worker.mjs`;
 *     return new URL(`./${t}`, e).href;
 *   }
 *
 * So at runtime the browser asks for
 * /_next/static/chunks/maplibre-gl-worker.mjs, next to the chunk the
 * bundler emitted. The bundler did not emit it: the file lives in the
 * package (node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs, 519 KB) and
 * nothing imports it by name, so it never becomes an asset.
 *
 * The symptom is not a crash. The worker request 404s, MapLibre fires
 * "Worker failed to load. Check that the worker URL is correct.", the map
 * never renders a tile, and every map on the site becomes a grey rectangle.
 * Measured on the atlas: 2,647 WebGL draw calls before, 93 after.
 *
 * So the file is copied next to every built chunk that refers to it. The
 * directory is found by SEARCHING for the reference rather than by assuming
 * a path — assuming a path is what broke every dependency PR in this repo
 * before, when the layout moved from dist/client/assets to
 * dist/client/_next/static.
 *
 * And if a chunk refers to a worker that cannot be placed, the build FAILS.
 * A missing worker is a broken map, and a broken map should not reach the
 * edge behind a green build.
 */
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const WORKER_NAMES = ["maplibre-gl-worker.mjs", "maplibre-gl-worker-dev.mjs"];
/** Every file under `dir`, recursively, relative to `dir`. */
function walk(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out.push(relative(base, full).split(sep).join("/"));
  }
  return out;
}

export function emitMapLibreWorker(buildRoot = root) {
  const clientDir = join(buildRoot, "dist", "client");
  // The worker comes from the tree being built, not from wherever this
  // module happens to live: a build root owns its own node_modules.
  const packageWorker = join(buildRoot, "node_modules", "maplibre-gl", "dist");
  if (!existsSync(clientDir)) {
    throw new Error("emit-maplibre-worker: no dist/client — run the build first");
  }

  // Which built chunks refer to a worker?
  const referrers = [];
  const namesByChunk = new Map();
  for (const rel of walk(clientDir)) {
    // .mjs too: MapLibre's own module build is a .mjs, and that is the
    // module whose URL decides which worker is requested.
    if (!rel.endsWith(".js") && !rel.endsWith(".mjs")) continue;
    // The worker itself is not a referrer.
    if (WORKER_NAMES.includes(rel.slice(rel.lastIndexOf("/") + 1))) continue;
    let text;
    try {
      text = readFileSync(join(clientDir, rel), "utf8");
    } catch {
      continue;
    }
    // The chunk names BOTH workers in a ternary — the dev one is used only
    // when the module itself is the "-dev.mjs" build. So the choice is the
    // same one MapLibre makes at runtime, and only that file is copied: the
    // dev worker is 1.2 MB of nothing, and shipping it would put it in front
    // of every reader.
    const named = WORKER_NAMES.filter((n) => text.includes(n));
    if (named.length === 0) continue;
    // The CHUNK'S OWN NAME decides, exactly as MapLibre decides at runtime:
    // a module whose URL ends in "-dev.mjs" asks for the dev worker.
    const chosen = rel.endsWith("-dev.mjs")
      ? "maplibre-gl-worker-dev.mjs"
      : "maplibre-gl-worker.mjs";
    referrers.push(rel);
    namesByChunk.set(rel, [chosen]);
  }

  if (referrers.length === 0) {
    console.log("emit-maplibre-worker: no built chunk refers to a MapLibre worker — nothing to do");
    return { placed: [], referrers: [] };
  }

  const placed = [];
  for (const rel of referrers) {
    const dir = dirname(join(clientDir, rel));
    for (const name of namesByChunk.get(rel) ?? []) {
      const source = join(packageWorker, name);
      if (!existsSync(source)) continue;
      const target = join(dir, name);
      copyFileSync(source, target);
      placed.push({ target: relative(clientDir, target), bytes: statSync(target).size });
      console.log(`emit-maplibre-worker: ${relative(clientDir, target)} ← ${name}`);
    }
  }

  // The whole point: a chunk that refers to a worker must be able to reach
  // one. If it cannot, the map is broken and the build says so.
  const missing = [];
  for (const rel of referrers) {
    const dir = dirname(join(clientDir, rel));
    const has = WORKER_NAMES.some((n) => existsSync(join(dir, n)));
    if (!has) missing.push(rel);
  }
  if (missing.length > 0) {
    throw new Error(
      `emit-maplibre-worker: ${missing.length} built chunk(s) refer to a MapLibre worker that was not placed:\n  ${missing.join("\n  ")}` +
        `\nThe package worker is missing from node_modules/maplibre-gl/dist.`,
    );
  }

  console.log(`emit-maplibre-worker: ${placed.length} worker file(s) placed for ${referrers.length} chunk(s)`);
  return { placed, referrers };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    emitMapLibreWorker(root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
