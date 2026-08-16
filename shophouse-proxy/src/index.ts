// shophouses.nonarkara.org — the Shophouse Metropolis essay and its data.
//
// The content lives in the same app as bkk.nonarkara.org (it is built from
// the same heritage data and shares the register), so this proxies to the
// one `bkkx-site` Worker rather than duplicating a deployment. The only
// rewrite is the root: on this domain "/" is the essay, not the 3D map.
const UPSTREAM = "https://bkkx-site.drnon.workers.dev";
const HOME = "/shophouses";

export default {
  async fetch(request: Request): Promise<Response> {
    const incoming = new URL(request.url);

    // "/" -> "/shophouses". Everything else passes through untouched, so
    // /shophouses/research, /data/*.geojson and hashed /assets/* all work.
    const path = incoming.pathname === "/" ? HOME : incoming.pathname;

    const upstreamUrl = new URL(`${path}${incoming.search}`, UPSTREAM);
    const upstreamResponse = await fetch(new Request(upstreamUrl, request));

    const headers = new Headers(upstreamResponse.headers);
    const location = headers.get("location");
    if (location) {
      try {
        const parsed = new URL(location); // relative redirects throw; leave them
        if (parsed.host === new URL(UPSTREAM).host) {
          headers.set(
            "location",
            `${incoming.origin}${parsed.pathname}${parsed.search}${parsed.hash}`,
          );
        }
      } catch {
        // already correct for this custom domain
      }
    }

    // HTML: serve from the edge, refresh in the background. `max-age=0` was
    // forcing every request to wake the upstream Worker — an 8–10 s cold
    // start on the first hit per isolate, measured, on pages that change
    // once a day. `stale-while-revalidate` keeps a deploy visible within a
    // minute while the edge answers instantly. Hashed assets keep whatever
    // caching they arrive with.
    const type = headers.get("content-type") ?? "";
    if (type.includes("text/html") && !headers.has("cache-control")) {
      headers.set(
        "cache-control",
        "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      );
    }
    headers.set("x-bkkx-edge", "shophouses");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
