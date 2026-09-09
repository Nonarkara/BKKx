# BKKx custom-domain edge

This tiny Cloudflare Worker binds **`bkk.nonarkara.org`** to the `bkkx-site` Worker. It must not claim `atlas.nonarkara.org` — that hostname belongs to the separate `bkk-3d-atlas` deploy. Claiming it here once took the domain away from that Worker and served this site in its place.

```bash
wrangler deploy --config edge-proxy/wrangler.jsonc
```

The walkthrough, analytics and assets remain in `site/`; this layer exists only because DNS for `nonarkara.org` and the Sites runtime are managed under separate Cloudflare accounts.
