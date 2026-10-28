#!/usr/bin/env node
// Stamp the built Worker with the commit it was built from.
//
// WHY THE ARTIFACT AND NOT THE COMMAND
//
// wrangler's `--var BUILD_ID:x` applies to the one command that carries it.
// The command this repo actually documents everywhere else —
//
//     npx wrangler deploy -c site/dist/server/wrangler.json --name bkkx-site
//
// — has no `--var`, and the built manifest's `vars` map is empty, so
// `env.BUILD_ID` is undefined in production and the `x-bkkx-build` header
// simply is not there. The deploy looks like it worked. The site answers 200.
// And "the live site is running commit X" becomes a claim nobody can check.
//
// That is not hypothetical: on 26 October 2026 the release carrying the
// shophouses "Why" port went out through the documented command, and the
// live site stopped reporting its build. The previous release had reported
// `bkkx-20261025-analytics-cb3b69b`; the one after it reported nothing at
// all, because the deployed Worker's only binding was `DB`.
//
// Baking the id into the ARTIFACT makes the stamp a property of the bytes.
// Any deploy of these bytes carries it. There is no command left that can
// drop it, and nothing to remember at 2am.
//
// Usage:
//   node scripts/stamp-build-id.mjs            stamp dist/server/wrangler.json
//   node scripts/stamp-build-id.mjs --check    verify the stamp matches HEAD
//   node scripts/stamp-build-id.mjs --id X     stamp with an explicit id
//
// `--check` exits non-zero when the artifact is unstamped or stale, so the
// deploy script can refuse to publish bytes that cannot be identified.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(siteDir, "..");
const manifestPath = join(siteDir, "dist", "server", "wrangler.json");

function git(args) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

/** The commit the bytes were built from, or null outside a checkout. */
function headSha() {
  try {
    return git(["rev-parse", "--short", "HEAD"]) || null;
  } catch {
    return null;
  }
}

/**
 * The build id. It names the commit — that is the part anybody actually
 * needs to check — and the UTC day it was built, which is a convenience.
 * Same commit, same id: rebuilding a commit does not change its identity.
 */
export function buildId(sha = headSha()) {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return sha ? `bkkx-${day}-${sha}` : `bkkx-${day}-unknown`;
}

function readManifest() {
  if (!existsSync(manifestPath)) {
    throw new Error(
      `stamp-build-id: no built manifest at ${manifestPath}. Run the build first — ` +
        `there is nothing to stamp.`,
    );
  }
  return JSON.parse(readFileSync(manifestPath, "utf8"));
}

function writeManifest(manifest) {
  // The generated manifest is a single line of JSON. Keep it that way so the
  // build output stays byte-stable for anything that diffs it.
  writeFileSync(manifestPath, JSON.stringify(manifest));
}

const argv = process.argv.slice(2);
const check = argv.includes("--check");
const idIndex = argv.indexOf("--id");
const explicitId = idIndex >= 0 ? argv[idIndex + 1] : null;

if (check) {
  const manifest = readManifest();
  const stamped = manifest?.vars?.BUILD_ID;
  const expectedSha = headSha();
  if (!stamped) {
    console.error(
      "stamp-build-id: the built Worker carries no BUILD_ID. Deploying it would " +
        "publish a site that cannot say which bytes are live.",
    );
    process.exit(1);
  }
  if (expectedSha && !stamped.endsWith(expectedSha)) {
    console.error(
      `stamp-build-id: the artifact is stamped ${stamped} but HEAD is ${expectedSha}. ` +
        `Rebuild before deploying.`,
    );
    process.exit(1);
  }
  console.log(`stamp-build-id: artifact is stamped ${stamped} — matches HEAD`);
  process.exit(0);
}

const id = explicitId ?? buildId();
const manifest = readManifest();
manifest.vars = { ...(manifest.vars ?? {}), BUILD_ID: id };
writeManifest(manifest);
console.log(`stamp-build-id: ${manifestPath} → BUILD_ID=${id}`);
