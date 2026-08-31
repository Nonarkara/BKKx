/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { pageviewStats, recordPageview } from "./pageviews";
import {
  handleLiveRain,
  handleLiveCctv,
  handleLiveWeather,
  handleLiveLongdo,
  handleCameraPoster,
  handleLiveFires,
} from "./live";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  /** Optional: a JSON camera registry for the war room's CCTV rail. */
  CCTV_SOURCE_URL?: string;
  /** Optional: Longdo Map API key. Env only — never committed. */
  LONGDO_API_KEY?: string;
  /** Optional: NASA FIRMS MAP_KEY. Env only — never committed. */
  FIRMS_MAP_KEY?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/pageview" && request.method === "POST") {
      const body = await request.json().catch(() => ({})) as {
        path?: unknown;
        referrer?: unknown;
      };
      const cloudflareRequest = request as Request & { cf?: { country?: string } };

      await recordPageview(env.DB, {
        path: typeof body.path === "string" ? body.path : "/",
        referrer: typeof body.referrer === "string" ? body.referrer : null,
        country: cloudflareRequest.cf?.country ?? null,
        language: request.headers.get("accept-language"),
      });
      return Response.json({ ok: true }, { status: 201 });
    }

    // Live civic feeds. Proxied here rather than fetched in the browser: the
    // BMA gauge feed is plain HTTP and sends no CORS headers, so only the
    // Worker can reach it. See worker/live.ts.
    if (url.pathname === "/api/live/rain" && request.method === "GET") {
      return handleLiveRain();
    }

    if (url.pathname === "/api/live/cctv" && request.method === "GET") {
      return handleLiveCctv(env?.CCTV_SOURCE_URL);
    }

    if (url.pathname === "/api/live/weather" && request.method === "GET") {
      return handleLiveWeather();
    }

    // Camera stills, re-served from this origin so no third party is
    // contacted until a viewer presses play. See worker/live.ts.
    if (url.pathname === "/api/live/camera-poster" && request.method === "GET") {
      return handleCameraPoster(url.searchParams.get("v"));
    }

    if (url.pathname === "/api/live/fires" && request.method === "GET") {
      return handleLiveFires(env?.FIRMS_MAP_KEY);
    }

    if (url.pathname.startsWith("/api/live/longdo/") && request.method === "GET") {
      const kind = url.pathname.slice("/api/live/longdo/".length);
      if (kind !== "search" && kind !== "cameras") {
        return Response.json({ ok: false, reason: "Unknown Longdo service." }, { status: 404 });
      }
      return handleLiveLongdo(kind, env?.LONGDO_API_KEY, url.searchParams);
    }

    if (url.pathname === "/api/stats" && request.method === "GET") {
      return Response.json(await pageviewStats(env.DB), {
        headers: { "cache-control": "public, max-age=60" },
      });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
