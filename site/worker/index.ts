/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { pageviewStats, recordPageview } from "./pageviews";
import { floodBulletinResponse, floodEvidenceResponse, floodRoadsResponse } from "./flood";
import {
  handleLiveRain,
  handleLiveCctv,
  handleLiveWeather,
  handleLiveLongdo,
  handleLiveThaiwaterWarnings,
  handleCameraPoster,
  handleCameraStill,
  handleCctvHealth,
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
    if (url.pathname === "/api/flood/evidence" && request.method === "GET") return floodEvidenceResponse();
    if (url.pathname === "/api/flood/bulletin" && request.method === "GET") return floodBulletinResponse();
    if (url.pathname === "/api/flood/roads" && request.method === "GET") return floodRoadsResponse();

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
    // Worker can reach it — and it now needs credentials, so /api/live/rain
    // reads the same agency's network through HII ThaiWater's public mirror.
    // See worker/live.ts.
    if (url.pathname === "/api/live/rain" && request.method === "GET") {
      return handleLiveRain();
    }

    if (url.pathname === "/api/live/thaiwater-warnings" && request.method === "GET") {
      return handleLiveThaiwaterWarnings();
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

    if (url.pathname === "/api/live/camera-still" && request.method === "GET") {
      return handleCameraStill(url.searchParams.get("u"));
    }

    if (url.pathname === "/api/live/cctv-health" && request.method === "GET") {
      return handleCctvHealth();
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

    const upstream = await handler.fetch(request, env, ctx);
    return withSecurityHeaders(upstream, url);
  },
};

// ── BKKx 1.0.0 security headers ─────────────────────────────────────
// v1.0 ships real defense-in-depth headers on every response. The atlas
// got this layer (Kimi K3 audit, 2026-10-03); the site is catching up.
//
// Rules, derived from the live origin inventory:
//   script-src      self + YouTube iframe + Cloudflare analytics beacon
//                   (the zone injects static.cloudflareinsights.com/beacon.min.js
//                   — without an allowlist CSP would silently kill it)
//   frame-src       YouTube only (the heritage video embeds and the YouTube
//                   live cams in the war room; nothing else embeds)
//   frame-ancestors self (so other sites cannot iframe the heritage shell)
//   object-src      'none'  (no <embed>, <applet>, etc.)
//   base-uri        self      (no rogue <base> rewrites)
//   form-action     none      (no <form> targets)
//   connect-src     self + https: (worker proxy APIs + Cloudflare)
//   media-src       self + blob + iTIC (HLS .m3u8 segments + poster jpegs)
//   img-src         self + https: data: (iTIC camera snapshots, OpenFreeMap)
//   worker-src      self + blob (vinext streaming SSR)
//   font-src        self + tiles.openfreemap.org + data: (Sao Chingcha + fallback)
//   style-src       self + 'unsafe-inline' (vinext + Tailwind inline) + unpkg
//                   (MapLibre CSS pinned with SRI)
//
// Also: nosniff, SAMEORIGIN, Referrer-Policy strict-origin-when-cross-origin,
// Permissions-Policy off for camera/mic/geo (we don't need any of them).
// All third-party scripts are pinned with SRI (handled in app/loading.tsx).
function withSecurityHeaders(res: Response, url: URL): Response {
  // Skip API + asset endpoints — only HTML/JSON consumed by browsers
  // needs CSP, and adding it to /assets/*.css or *.js breaks the
  // browser's own parser without buying anything.
  const ct = res.headers.get("content-type") ?? "";
  const isHtml = ct.includes("text/html");
  const isJson = ct.includes("json");
  if (!isHtml && !isJson && url.pathname.startsWith("/assets/")) return res;

  const headers = new Headers(res.headers);
  if (isHtml) {
    headers.set(
      "content-security-policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net https://www.youtube.com https://static.cloudflareinsights.com https://www.instagram.com",
        "style-src 'self' 'unsafe-inline' https://unpkg.com",
        "img-src 'self' https: data: blob:",
        "font-src 'self' https://tiles.openfreemap.org data:",
        "connect-src 'self' https:",
        "worker-src 'self' blob:",
        "media-src 'self' blob: https://camerai.iticfoundation.org",
        "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.instagram.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        "frame-ancestors 'self'",
      ].join("; ")
    );
  }
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "SAMEORIGIN");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export default worker;
