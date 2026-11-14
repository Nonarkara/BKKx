// A Node loader hook that resolves the Workers-only `cloudflare:*` schemes.
//
// vinext 1's bundle imports `cloudflare:workers`. Only the Workers runtime
// can load that scheme, so two things need a stand-in when the artifact is
// loaded by Node instead:
//
//   - the test that imports dist/server/index.js and exercises its fetch
//     handler (site/tests/support/cloudflare-scheme.mjs installs this hook
//     inside the test process), and
//   - `vinext start`, the local production server, which loads the same
//     artifact in Node (site/scripts/preload-cloudflare-scheme.mjs installs
//     it with `node --import`).
//
// Every `cloudflare:` specifier resolves to the stub next door, so the code
// under test is the code that ships — same handler, same logic — with the
// one module the Node runtime cannot have.
//
// Synchronous on purpose: `module.registerHooks` runs the hook in this
// thread and does not await it, so an async hook would hand back a promise
// where a URL string is required. The older `module.register` path accepts
// the same synchronous return, so one function serves both.
const STUB = new URL("./cloudflare-scheme-stub.mjs", import.meta.url).href;

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("cloudflare:")) {
    if (process.env.CF_SCHEME_DEBUG) console.error("[cf-resolve] intercepted", specifier);
    return { url: STUB, shortCircuit: true, format: "module" };
  }
  const result = nextResolve(specifier, context);
  if (process.env.CF_SCHEME_DEBUG && result && typeof result.url === "string") {
    if (result.url.startsWith("cloudflare:")) {
      console.error("[cf-resolve] resolved to a cloudflare: URL", specifier, "→", result.url);
    }
  }
  return result;
}
