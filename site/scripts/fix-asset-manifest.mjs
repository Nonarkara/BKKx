#!/usr/bin/env node
/**
 * fix-asset-manifest.mjs
 * ----------------------
 * Point the RSC asset manifest at chunks that actually exist — and prove,
 * at the end, that every chunk it names is really on disk.
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
 * WHERE THE CHUNKS LIVE, AND WHAT THEY ARE CALLED
 *
 * The first version hard-coded `dist/client/assets`. vinext 1.x moved the
 * client statics to `dist/client/_next/static`, so the script stopped at
 * "no dist/client/assets — run the build first" and failed the build of every
 * dependency PR that carried the bump — the failure looked like a dependency
 * problem and was not one.
 *
 * The second version found the chunks by walking the client output, but it
 * recognised them by the NAME they had under vinext 0.x: `name-hash.js`.
 * vinext 1.x names a chunk by its hash alone — `B0PXqnjO.js`, `UfT-2Bz1.js` —
 * so no file matched, the walk found nothing, and the script threw
 * "no hashed chunks under dist/client — run the build first" against a build
 * that had just completed successfully. A second false alarm, and it took the
 * build down with it.
 *
 * So the script no longer cares what a chunk is called. It walks the client
 * output, keeps every file, and learns the naming convention from the
 * manifest's own entries. A chunk has a logical name only when its basename
 * is `name-hash` with an eight-character hash; a basename of exactly eight
 * characters is a bare hash, which carries no name to match on.
 *
 * AND THE INVARIANT THAT MATTERS
 *
 * A manifest entry that names a file which does not exist is a guaranteed
 * 404 for every reader who loads that chunk. Under vinext 0.x those were
 * repairable — the logical name found the replacement. Under vinext 1.x a
 * bare hash carries no name, so a missing entry cannot be repaired safely and
 * is NEVER guessed at. It is reported, and the build fails with the list.
 * Shipping a 404 is worse than shipping nothing.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The logical name of a chunk, or null when it has none.
 *
 * "maplibre-gl-BjusSPiM.js" -> "maplibre-gl" (a name, a hash)
 * "B0PXqnjO.js"             -> null     (a bare hash, vinext 1.x)
 * "UfT-2Bz1.js"             -> null     (a bare hash that happens to hold a dash)
 */
function logicalName(file) {
  const dot = file.lastIndexOf(".");
  if (dot < 0) return null;
  const base = file.slice(0, dot);
  const ext = file.slice(dot + 1);
  if (ext !== "js" && ext !== "css") return null;
  // A bare hash is exactly eight characters of base64url, dashes included.
  if (base.length === 8 && /^[A-Za-z0-9_-]+$/.test(base)) return null;
  const m = /^(.+)-([A-Za-z0-9_-]{8})$/.exec(base);
  return m ? m[1] : null;
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

/** Every chunk-looking path a manifest mentions, deduplicated. */
function manifestEntries(source) {
  const out = new Set();
  for (const m of source.matchAll(/"(\/[^"]*?\.(?:js|css))"/g)) out.add(m[1]);
  return [...out];
}

/**
 * Fix the manifests under one built tree.
 *
 * @param {string} buildRoot the project root (the folder holding dist/)
 * @returns {{fixed:number, skipped:number, rewritten:string[], found:number, missing:string[]}}
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

  // Every file the build produced, wherever it sits, whatever it is called.
  const builtPaths = new Set();
  const byLogicalName = new Map();
  for (const rel of walk(clientDir)) {
    builtPaths.add(rel);
    const name = logicalName(rel.slice(rel.lastIndexOf("/") + 1));
    if (name === null) continue;
    byLogicalName.set(name, [...(byLogicalName.get(name) ?? []), rel]);
  }

  let fixed = 0;
  let skipped = 0;
  const rewritten = [];

  for (const manifestPath of manifests) {
    if (!existsSync(manifestPath)) continue;
    const original = readFileSync(manifestPath, "utf8");
    const updated = original.replace(
      // A manifest entry is a path relative to the client root whose last
      // segment is a chunk: "assets/x-hash.js", "_next/static/chunks/x.js".
      /((?:[A-Za-z0-9._-]+\/)*)([A-Za-z0-9._-]+\.(?:js|css))/g,
      (whole, prefix, file) => {
        if (builtPaths.has(`${prefix}${file}`)) return whole;
        const name = logicalName(file);
        if (name === null) {
          // A bare hash with no logical name: there is nothing to match a
          // replacement against, and a guess is a wrong 404. Leave it, and let
          // the existence check below report it.
          return whole;
        }
        const candidates = byLogicalName.get(name) ?? [];
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

  // THE INVARIANT: after the repair, every chunk the manifest names is on
  // disk. A manifest that points at a file which is not there is a 404 on
  // every page that loads that chunk, and it is not a warning.
  const missing = new Set();
  for (const manifestPath of manifests) {
    if (!existsSync(manifestPath)) continue;
    const source = readFileSync(manifestPath, "utf8");
    for (const entry of manifestEntries(source)) {
      const rel = entry.replace(/^\//, "");
      if (!existsSync(join(clientDir, rel))) missing.add(entry);
    }
  }

  console.log(
    `fix-asset-manifest: ${fixed} rewritten, ${skipped} left alone, ${missing.size} missing`,
  );

  if (missing.size > 0) {
    const list = [...missing].slice(0, 12).join("\n  ");
    throw new Error(
      `fix-asset-manifest: ${missing.size} chunk(s) the RSC manifest names are not on disk:\n  ${list}` +
        (missing.size > 12 ? `\n  … and ${missing.size - 12} more` : ""),
    );
  }

  return { fixed, skipped, rewritten, found: builtPaths.size, missing: [] };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    fixAssetManifest(root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
