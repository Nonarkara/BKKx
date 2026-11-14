// A stand-in for the Workers-only `cloudflare:*` modules.
//
// The built Worker imports `cloudflare:workers`, a module scheme only the
// Workers runtime can load. Node's ESM loader refuses it outright:
//
//   Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in:
//   file, data, and node are supported … Received protocol 'cloudflare:'
//
// The bundle uses the import for one thing: it reads the `tracing` export
// and turns tracing on if it is there. Under Node there is no tracing, so
// the honest stand-in is a module with no `tracing` export — the bundle's
// own guard (`Sa && A(...)`) then does nothing, exactly as it would in a
// runtime without tracing.
//
// This is not a mock of the Worker. The tests that use it import
// dist/server/index.js and call its fetch handler: the artifact under test
// is still the artifact, with the one module the Node runtime cannot
// provide standing in for it.
export {};
