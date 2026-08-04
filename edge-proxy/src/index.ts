const UPSTREAM = "https://bkkx-bangkok-atlas.nonsmartcity.chatgpt.site";

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
    headers.set("x-bkkx-edge", "bangkok-atlas");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
