#!/usr/bin/env node
// serve-preview.mjs — a preview server that stays up.
//
// The local preview died mid-audit and took the measurement with it:
//
//   TypeError: terminated
//     at Fetch.onAborted (node:internal/deps/undici/undici:13629:53)
//     at ClientHttp2Session.onHttp2SessionGoAway (…)
//     at file:///…/vinext/dist/server/socket-error-backstop.js:114
//
// The preview server makes an outbound fetch (a webfont) over HTTP/2, the
// remote end sends GOAWAY, and vinext's socket-error backstop rethrows it on
// an unhandled 'error' event, which takes the whole process down. The audit
// that was talking to it then silently measured nothing.
//
// The Cloudflare runtime does not have this failure mode, so it is a local
// rig problem. But a rig that dies mid-measurement produces false evidence,
// so the rig gets a supervisor: start the server, and if it exits for any
// reason, start it again. The audit tools now report UNVERIFIED for pages
// they could not open, so a crash cannot be mistaken for a clean run.
//
//   node serve-preview.mjs --port=43119 --state=/tmp/bkkx-state
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, "..", "site");

const args = process.argv.slice(2);
const arg = (n, d) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};

const PORT = arg("port", "43119");
const STATE = arg("state", "/tmp/bkkx-preview-state");
const MAX_RESTARTS = Number(arg("max-restarts", "40"));

if (!existsSync(STATE)) mkdirSync(STATE, { recursive: true });

let restarts = 0;
let stopping = false;

function start() {
  const child = spawn(
    process.execPath,
    [
      // `vite preview` runs the built Worker under workerd through the
      // Cloudflare plugin, and serves dist/client through the assets binding —
      // the same runtime model as production.
      //
      // It replaced `vinext start` here because vinext 1's Node preview
      // answers every file outside /_next/static with HTTP 200 and an EMPTY
      // BODY: the whole public tree — the immutable data, the heritage
      // register, the favicon — came back with zero bytes. Nothing on the
      // page said so. The atlas simply lost its data, the Thai-forms layer
      // never loaded, and every DOM-geometry sweep still reported "identical
      // to baseline" because an empty data file does not move a box.
      //
      // So the rig serves the artifact the way the cloud does, and the
      // instruments are pointed at it.
      join(SITE, "node_modules", "vite", "bin", "vite.js"),
      "preview",
      "--port",
      PORT,
      "--host",
      "127.0.0.1",
    ],
    {
      cwd: SITE,
      env: {
        ...process.env,
        BKKX_PREVIEW_STATE: STATE,
        WRANGLER_LOG_PATH: ".wrangler/wrangler.log",
      },
      stdio: ["ignore", "inherit", "inherit"],
    },
  );

  child.on("exit", (code, signal) => {
    if (stopping) return;
    restarts++;
    if (restarts > MAX_RESTARTS) {
      console.error(`serve-preview: ${restarts} restarts, giving up (last exit code=${code} signal=${signal})`);
      process.exit(1);
    }
    console.error(`serve-preview: server exited (code=${code} signal=${signal}) — restarting (#${restarts})`);
    setTimeout(start, 1000);
  });

  return child;
}

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    stopping = true;
    process.exit(0);
  });
}

/**
 * The canary: the rig must serve the artifact BYTE-COMPLETE, or it is not
 * measuring the artifact.
 *
 * vinext 1's Node preview answered every public file with HTTP 200 and an
 * empty body. Nothing said so. The atlas lost its data, the Thai-forms layer
 * never loaded, and every DOM-geometry sweep still reported "identical to
 * baseline" — because an empty data file does not move a box. The rig was
 * measuring a broken site and calling it a clean one.
 *
 * So the rig checks itself before any instrument is pointed at it: a page
 * that must have a body, and a static file that must have bytes. If either
 * comes back empty, the rig says so loudly instead of serving a hollow site.
 */
async function canary() {
  const base = `http://127.0.0.1:${PORT}`;
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const page = await fetch(`${base}/`, { redirect: "follow" });
      const pageBytes = (await page.arrayBuffer()).byteLength;
      if (pageBytes === 0) {
        console.error(`serve-preview: CANARY FAILED — / returned 200 with an empty body`);
        return false;
      }
      // Any file in the public tree that is on disk must come back with its
      // bytes. The heritage register is large and stable, so an empty body
      // cannot be a coincidence.
      const res = await fetch(`${base}/heritage-register.json`);
      const bytes = (await res.arrayBuffer()).byteLength;
      if (bytes === 0) {
        console.error(
          `serve-preview: CANARY FAILED — /heritage-register.json returned ${res.status} with an empty body`,
        );
        console.error(
          "serve-preview: the rig is serving a hollow site; measurements taken against it prove nothing",
        );
        return false;
      }
      console.log(
        `serve-preview: canary passed — / is ${pageBytes} bytes, /heritage-register.json is ${bytes} bytes`,
      );
      return true;
    } catch {
      if (attempt === 30) {
        console.error("serve-preview: CANARY FAILED — the server never answered");
        return false;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return false;
}

console.log(`serve-preview: supervising vite preview on 127.0.0.1:${PORT} (state ${STATE})`);
start();

const ok = await canary();
if (!ok) {
  console.error("serve-preview: refusing to serve an artifact that is not byte-complete");
  stopping = true;
  process.exit(1);
}
