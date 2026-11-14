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
    [join(SITE, "node_modules", "vinext", "dist", "cli.js"), "start", "--port", PORT, "--hostname", "127.0.0.1"],
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

console.log(`serve-preview: supervising vinext start on 127.0.0.1:${PORT} (state ${STATE})`);
start();
