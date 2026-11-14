#!/usr/bin/env node
// apply-dep-round.mjs — set exact dependency versions for one upgrade round.
//
// The staged upgrade of the 24-package dependabot batch (PR #24) is not a
// blanket bump: each round is one connected component of the peer graph, and
// each round earns its own evidence.
//
//   node apply-dep-round.mjs <round>
//
// The version table below is the whole plan, in one place, so a reviewer can
// see the ordering and why it is ordered that way. It is not applied
// automatically — one round at a time, each verified before the next.
//
// WHY THE ROUNDS ARE ROUND-SHAPED (peer graph, checked against the registry):
//
//   vinext@0.0.50 peers   react ^19.2.6
//   vinext@1.4.4  peers   react ^19.3.1
//   => react 19.3 and vinext 1 cannot be separated: React 19.3 does not
//      satisfy vinext 0.0.50, and npm refuses the tree (ERESOLVE).
//
//   wrangler@4.158.0 peers        @cloudflare/workers-types ^5.20261104.1
//   @cloudflare/vite-plugin@1.67 peers  wrangler ^4.156.1
//   => wrangler, workers-types and the vite plugin move as one.
//
//   eslint-config-next@16.4.5 peers eslint >=9  => eslint 10 is a separate round.
//
// So: A = app layer. B = the forced React/vinext/cloudflare cluster.
// C = toolchain majors (typescript, eslint, node types). D = three.
// E = maplibre-gl.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "site");

const ROUNDS = {
  // The app layer: no peer in this set requires anything outside it.
  A: {
    dependencies: {
      "drizzle-orm": "0.45.4",
      next: "16.4.5",
    },
    devDependencies: {
      "@tailwindcss/postcss": "4.3.4",
      "@vitejs/plugin-react": "6.2.1",
      "@vitejs/plugin-rsc": "0.5.39",
      "drizzle-kit": "0.31.11",
      "eslint-config-next": "16.4.5",
      tailwindcss: "4.3.4",
      vite: "8.3.6",
    },
  },
  // The forced cluster. react 19.3 is only legal alongside vinext 1, and
  // vinext 1 only builds against a cloudflare plugin that wants wrangler
  // >= 4.156, which in turn wants workers-types 5.
  B: {
    dependencies: {
      react: "19.3.1",
      "react-dom": "19.3.1",
    },
    devDependencies: {
      "@cloudflare/vite-plugin": "1.67.0",
      "@cloudflare/workers-types": "5.20261106.1",
      "@types/react": "19.3.0",
      "@types/react-dom": "19.3.0",
      "react-server-dom-webpack": "19.3.1",
      vinext: "1.4.4",
      wrangler: "4.158.0",
    },
  },
  // Toolchain majors, each of which changes what a gate even means.
  C: {
    dependencies: {},
    devDependencies: {
      "@types/node": "26.6.6",
      eslint: "10.14.0",
      typescript: "7.0.2",
    },
  },
  // three: under 0.x every minor is breaking. One file uses it.
  D: {
    dependencies: {
      three: "0.187.0",
    },
    devDependencies: {
      "@types/three": "0.187.0",
    },
  },
  // maplibre-gl: two majors against a hand-written atlas layer in eight
  // components. Needs a rendered check, never a compile.
  E: {
    dependencies: {
      "maplibre-gl": "6.16.0",
    },
    devDependencies: {},
  },
};

const round = (process.argv[2] || "").toUpperCase();
if (!ROUNDS[round]) {
  console.error(`usage: apply-dep-round.mjs <${Object.keys(ROUNDS).join("|")}>`);
  process.exit(2);
}

const spec = ROUNDS[round];
const file = join(SITE, "package.json");
const pkg = JSON.parse(readFileSync(file, "utf8"));

const applied = [];
const held = [];
for (const group of ["dependencies", "devDependencies"]) {
  for (const [name, version] of Object.entries(spec[group] || {})) {
    const current = pkg[group]?.[name];
    if (current === version) {
      held.push(`${name} already ${version}`);
      continue;
    }
    pkg[group][name] = version;
    applied.push(`${name} ${current} -> ${version}`);
  }
}

writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
console.log(`round ${round}`);
for (const line of applied) console.log(`  set    ${line}`);
for (const line of held) console.log(`  no-op  ${line}`);
