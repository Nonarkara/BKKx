// The site is built by `npm run build --prefix site` and deployed straight to
// Cloudflare as the `bkkx-site` Worker:
//
//   npx wrangler deploy -c site/dist/server/wrangler.json --name bkkx-site
//
// It used to sit on Codex Sites, which meant a page could only go live from
// ChatGPT. Deploying from the repo removes that dependency; this proxy stays
// only because it holds the bkk.nonarkara.org custom domain.
const UPSTREAM = "https://bkkx-site.drnon.workers.dev";

export default {
  async fetch(request: Request): Promise<Response> {
    const incomingUrl = new URL(request.url);

    const upstreamUrl = new URL(
      `${incomingUrl.pathname}${incomingUrl.search}`,
      UPSTREAM,
    );

    const upstreamResponse = await fetch(new Request(upstreamUrl, request));
    const headers = new Headers(upstreamResponse.headers);
    const location = headers.get("location");

    if (location) {
      try {
        const parsed = new URL(location); // throws on relative redirects; leave those as-is
        if (parsed.host === new URL(UPSTREAM).host) {
          headers.set(
            "location",
            `${incomingUrl.origin}${parsed.pathname}${parsed.search}${parsed.hash}`,
          );
        }
      } catch {
        // relative Location — already correct for the custom domain
      }
    }
    // HTML must always revalidate. Without this the browser applies heuristic
    // caching to the pages themselves, so a deploy can leave someone reading a
    // stale copy with no way to tell. Hashed assets under /assets/ are
    // immutable by construction and keep whatever caching they arrive with.
    const type = headers.get("content-type") ?? "";
    if (type.includes("text/html") && !headers.has("cache-control")) {
      // Was max-age=0, which woke the upstream Worker on every request — an
      // 8–10 s cold start on the first hit per isolate, measured. These pages
      // change daily at most; stale-while-revalidate keeps a deploy visible
      // within a minute while the edge answers instantly.
      headers.set(
        "cache-control",
        "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      );
    }

    headers.set("x-bkkx-edge", "bkk-heritage");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
