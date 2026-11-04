#!/usr/bin/env node
/**
 * fix-asset-manifest.mjs
 * ----------------------
 * Point the RSC asset manifest at chunks that actually exist.
 *
 * vinext builds the client bundle and the RSC preload manifest in two passes,
 * and the hashes can disagree: a clean build emits
 * `dist/client/assets/maplibre-gl-BjusSPiM.js` while the manifest still asks
 * the browser to `modulepreload` `maplibre-gl-B3EYWl7f.js`. The page works —
 * the real import carries the right hash — but every page that lazy-loads
 * MapLibre fires a guaranteed 404 on load.
 *
 * This rewrites only entries whose target file is missing, and only when
 * exactly one built file shares the same chunk name. Anything ambiguous is
 * left alone and reported, because a wrong rewrite would be worse than the
 * 404 it replaces.
 *
 * WHERE THE CHUNKS LIVE
 *
 * The first version hard-coded `dist/client/assets`. vinext 1.x moved the
 * client statics to `dist/client/_next/static`, so the script stopped at
 * "no dist/client/assets — run the build first" and failed the build of every
 * dependency PR that carried the bump — the failure looked like a dependency
 * problem and was not one.
 *
 * So the script now finds the chunks instead of assuming where they are: it
 * walks the client output and collects every hashed chunk it can see. More
 * candidates can only mean more ambiguity, and ambiguity means "leave it
 * alone" — the safe direction. It never rewrites to a guess.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** "maplibre-gl-BjusSPiM.js" -> name "maplibre-gl", ext "js" */
function split(file) {
  const m = /^(.*)-([A-Za-z0-9_-]{8})\.(js|css)$/.exec(file);
  return m ? { name: m[1], hash: m[2], ext: m[3] } : null;
}

/** Every file under `dir`, recursively, as paths relative to `dir`. */
function walk(dir, base = dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else if (entry.isFile()) out.push(relative(base, full).split(sep).join("/"));
  }
  return out;
}

/**
 * Fix the manifests under one built tree.
 *
 * @param {string} buildRoot the project root (the folder holding dist/)
 * @returns {{fixed:number, skipped:number, rewritten:number[], found:number}}
 */
export function fixAssetManifest(buildRoot = root) {
  const clientDir = join(buildRoot, "dist", "client");
  const manifests = [
    join(buildRoot, "dist", "server", "__vite_rsc_assets_manifest.js"),
    join(buildRoot, "dist", "server", "ssr", "__vite_rsc_assets_manifest.js"),
  ];

  if (!existsSync(clientDir)) {
    throw new Error("fix-asset-manifest: no dist/client — run the build first");
  }

  // Every hashed chunk the build produced, wherever it sits.
  const byName = new Map();
  const builtPaths = new Set();
  let found = 0;
  for (const rel of walk(clientDir)) {
    const file = rel.slice(rel.lastIndexOf("/") + 1);
    const parts = split(file);
    if (!parts) continue;
    found += 1;
    builtPaths.add(rel);
    const key = `${parts.name}.${parts.ext}`;
    byName.set(key, [...(byName.get(key) ?? []), rel]);
  }

  if (found === 0) {
    throw new Error("fix-asset-manifest: no hashed chunks under dist/client — run the build first");
  }

  let fixed = 0;
  let skipped = 0;
  const rewritten = [];

  for (const manifestPath of manifests) {
    if (!existsSync(manifestPath)) continue;
    const original = readFileSync(manifestPath, "utf8");
    const updated = original.replace(
      // A manifest entry is a path relative to the client root whose last
      // segment is a hashed chunk: "assets/x-hash.js", "_next/static/x-hash.js".
      /((?:[A-Za-z0-9._-]+\/)*)([A-Za-z0-9._-]+-[A-Za-z0-9_-]{8}\.(?:js|css))/g,
      (whole, prefix, file) => {
        if (builtPaths.has(`${prefix}${file}`)) return whole;
        const parts = split(file);
        if (!parts) return whole;
        const candidates = byName.get(`${parts.name}.${parts.ext}`) ?? [];
        if (candidates.length !== 1) {
          console.warn(
            `fix-asset-manifest: ${file} is missing and ${candidates.length} chunks match — left as-is`,
          );
          skipped += 1;
          return whole;
        }
        const target = candidates[0];
        console.log(`fix-asset-manifest: ${prefix}${file} -> ${target}`);
        fixed += 1;
        rewritten.push(`${prefix}${file} -> ${target}`);
        return target;
      },
    );
    if (updated !== original) writeFileSync(manifestPath, updated);
  }

  console.log(`fix-asset-manifest: ${fixed} rewritten, ${skipped} left alone`);
  if (skipped > 0) process.exitCode = 0; // reporting only; never fail the build
  return { fixed, skipped, rewritten, found };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    fixAssetManifest(root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
