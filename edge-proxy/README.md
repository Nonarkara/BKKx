# BKKx custom-domain edge

This tiny Cloudflare Worker binds `atlas.nonarkara.org` to the public BKKx Sites deployment, while redirecting the retired `bkk.nonarkara.org` hostname. It fixes the upstream origin, preserves the incoming path and query, rewrites same-origin redirects, and contains no application state.

```bash
wrangler deploy --config edge-proxy/wrangler.jsonc
```

The walkthrough, analytics and assets remain in `site/`; this layer exists only because DNS for `nonarkara.org` and the Sites runtime are managed under separate Cloudflare accounts.
