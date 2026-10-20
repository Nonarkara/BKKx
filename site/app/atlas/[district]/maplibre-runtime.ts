import type maplibregl from "maplibre-gl";

// Vite can expose this UMD package as a default export or named namespace.
export function resolveMapLibre(module: unknown): typeof maplibregl {
  if (!module || typeof module !== "object") throw new Error("MapLibre runtime unavailable");
  const exports = module as { default?: typeof maplibregl; Map?: unknown };
  const runtime = typeof exports.default?.Map === "function" ? exports.default : exports;
  if (typeof runtime.Map !== "function") throw new Error("MapLibre runtime unavailable");
  return runtime as typeof maplibregl;
}
