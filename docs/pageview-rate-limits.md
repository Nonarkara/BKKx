# Page-view write limits

`POST /api/pageview` is the only write endpoint on this site. It writes one
row to D1 per page view. This note says what stands in front of it, what it
costs, and where each control lives.

## The exposure

The endpoint accepts a browser-shaped POST. It validates the Origin header
against the site's own origins, the content type, the body size, and the
shape of the JSON. That validation is **request hygiene, not authentication**:
a non-browser caller can forge an `Origin` header and a `Referer` header. The
boundary repair of 2026-10-25 says so in the code, and the claim is not
overstated anywhere.

So the honest question is not "who is calling" but "how much can one caller
cost". That is a rate limit, and it belongs in two places: at the edge, where
a flood is refused before it costs anything, and in the Worker, where the
total is bounded whatever the edge lets through.

## Control 1 — the edge (primary)

A Cloudflare rate-limiting rule on the zone, applied to
`http.request.uri.path eq "/api/pageview"` and
`http.request.method eq "POST"`:

| Rule | Characteristic | Threshold | Period | Action |
|---|---|---|---|---|
| Page views per address | `ip.src` | 20 requests | 60 seconds | Block |
| Page views, whole site | static (all requests to the path) | 5,000 requests | 60 seconds | Block |

Configured under **Security → WAF → Rate limiting rules** in the
`nonarkara.org` zone.

Why the edge and not the Worker: a rate limit that runs inside the Worker
still pays for a Worker invocation on every request it refuses. Cloudflare's
limiter runs in front of the Worker, so a refused flood costs the Worker
nothing. The address is a counter key inside Cloudflare's own short-lived
limiter state; it is never written to D1 by this site and never leaves the
platform.

These rules are configured in the zone rather than in this repository because
that is where Cloudflare keeps them. Re-create them from the table above if
the zone is rebuilt. Verify them the way a flood would:

```bash
# 25 requests in a burst from one address: the 21st and after are refused.
for i in $(seq 1 25); do
  curl -s -o /dev/null -w "%{http_code} " -X POST https://bkk.nonarkara.org/api/pageview \
    -H 'content-type: application/json' \
    -H 'origin: https://bkk.nonarkara.org' \
    --data '{"path":"/rate-limit-check"}'
done; echo
```

## Control 2 — the Worker (backstop)

`site/worker/pageview-caps.ts` bounds the total. One row per Bangkok day in
`pageview_daily`, incremented by a single atomic statement:

```sql
INSERT INTO pageview_daily (day, n, updated_at) VALUES (?, 1, ?)
ON CONFLICT(day) DO UPDATE SET n = pageview_daily.n + 1, updated_at = excluded.updated_at
RETURNING n
```

When the count passes the ceiling the Worker answers `429` with a
`retry-after` pointing at the next Bangkok midnight, and no page view is
written. The default ceiling is 10,000 rows a day; the deployment can lower it
with the `PAGEVIEW_DAILY_CAP` environment variable. It cannot be raised by a
pull request, because the value lives in the environment and not in the code.

**What the counter row contains:** a day, a number, and a timestamp. Nothing
else. There is no address, no user agent, no header, and no identifier of any
kind, so there is nothing about the visitor to keep and nothing to expire. The
table holds one row per day and is pruned to the last seven days on every
write.

This is deliberately **not** a per-address limiter. PR12 proposed one, and it
was held for two reasons that still hold: it keyed its buckets on the raw
connecting address, which is a personal identifier in durable storage with no
expiry of its own; and a Durable Object in front of every write costs more
than the row insert it protects, so under attack the limiter makes the bill
worse rather than better.

## What is stored

`pageviews` holds path, referrer, country, language and a timestamp. Nothing
that identifies a person across requests. The user-agent column is retired
and always null: a per-request UA + referrer + country + millisecond tuple is
a browser fingerprint, which is the thing the privacy rule exists to prevent.

## The tests

`site/tests/pageview-caps.test.mjs` proves the ceiling fires — it claims past
the limit and asserts the `429`, and asserts that the page-view row was not
written. It also asserts that the cap module contains no code path that reads
an address, a user agent or a header, and that the counter row holds only a
day, a count and a timestamp. The ceiling is armed before the request is
made, so the test cannot pass vacuously.
