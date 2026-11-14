// Install the `cloudflare:` scheme resolver for this test process.
//
// Importing this module is enough:
//
//   import './support/cloudflare-scheme.mjs';
//
// vinext 1's built Worker imports `cloudflare:workers`, a module scheme only
// the Workers runtime can load. Node's ESM loader refuses it:
//
//   Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in:
//   file, data, and node are supported … Received protocol 'cloudflare:'
//
// Any test that imports the built artifact needs this, because the artifact
// is what it is testing — not a copy of it.
//
// registerHooks is the current API and runs in this thread; register is the
// older one and prints a deprecation warning. Either is correct here, so
// the newer is preferred and the older is the fallback.
import { register, registerHooks } from "node:module";
import { resolve } from "../../scripts/cloudflare-scheme-loader.mjs";

if (typeof registerHooks === "function") {
  registerHooks({ resolve });
} else {
  register("../../scripts/cloudflare-scheme-loader.mjs", import.meta.url);
}
