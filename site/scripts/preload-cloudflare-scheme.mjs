// Installs the `cloudflare:` scheme resolver for this process.
//
//   node --import ./scripts/preload-cloudflare-scheme.mjs <anything>
//
// `vinext start` serves the built Worker in Node, and under vinext 1 that
// Worker imports `cloudflare:workers` — a scheme only the Workers runtime
// can load. Without this preload the local production server dies on its
// first request with ERR_UNSUPPORTED_ESM_URL_SCHEME, which reads like a
// broken build and is not one.
//
// The deployment target is Cloudflare Workers, where `cloudflare:workers` is
// native and none of this applies. This exists so the artifact can be
// served and measured on the machine that built it.
import { register, registerHooks } from "node:module";
import { resolve } from "./cloudflare-scheme-loader.mjs";

if (typeof registerHooks === "function") {
  registerHooks({ resolve });
} else {
  register("./cloudflare-scheme-loader.mjs", import.meta.url);
}
