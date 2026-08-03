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

    if (location?.startsWith(UPSTREAM)) {
      headers.set("location", location.replace(UPSTREAM, incomingUrl.origin));
    }
    headers.set("x-bkkx-edge", "bangkok-atlas");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    });
  },
};
