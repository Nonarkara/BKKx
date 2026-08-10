# BKKx — project context

**Live:** [bkk.nonarkara.org](https://bkk.nonarkara.org)
**Not to be confused with:** [atlas.nonarkara.org](https://atlas.nonarkara.org), a
separate project (`~/Projects/bkk-3d-atlas`) with its own Worker and its own
custom domain. The two used to collide — see "Domains" below.

## What this is

A cultural heritage system for Bangkok, in this order of importance:

1. **The heritage register** (the site root). Every registered ancient
   monument in Bangkok from the Fine Arts Department register, mapped, with
   what the register actually says about each one.
2. **Nine heritage quarters** (`/areas/:slug`) — Rattanakosin, Kudi Chin,
   Talad Noi, Song Wat, Yaowarat–Sampheng, Sam Phraeng, Nang Loeng,
   Charoen Krung, Bang Krachao. Authored editorial pages with a licensed
   Commons photo each (attribution rendered on-page) and the quarter's
   register monuments mapped.
3. **Seven walks** (`/walks/:slug`) — six-faiths, talad-noi-songwad,
   royal-axis, sam-phraeng-lanes, charoen-krung-creative, nang-loeng-market,
   bang-krachao-loop (bicycle). Real OSRM foot-profile route lines, numbered
   stops with notes, register ids and Minecraft teleports where applicable.
4. **The Minecraft worlds** (`/worlds`). Parts of Bangkok generated block by
   block at 1 block = 1 metre, plus a 3D browser atlas per district
   (`/atlas/:district`).

Quarters/walks data: `scripts/build-heritage-places.py` (authored content
lives IN the script; stops resolve register → OSM → hand-with-reason, routes
from OSRM foot, all cached in `.cache/heritage/`). Photos:
`scripts/fetch-heritage-photos.py` (Commons, free licences only, manifest at
`site/public/heritage/photos.json`; two slots pinned after review — Commons
titles are not evidence of content). One photo per slot, none reused.

The register is the front door because that is what people arrive to learn
about; the worlds are what make it walkable.

## Design register

**Root and register: EDITORIAL** (Axiom Design Core §XV; layout law §XX, the
MoMA Grid). The reader is someone learning about Bangkok's heritage start to
finish, by choice — not an operator watching a live system.

- Ground: light, `#f4f2ec`
- Accent: **one**, `--seal: #8c2f23` (oxide). It carries exactly one meaning —
  *gazetted*. "Awaiting consideration" is the absence of it, not a second hue.
- Dials: variance 6 · motion 2 · density 3–4

`/atlas/:district` stays **CONSOLE** (dark, dense, a live 3D map tool). That is
a different reader doing a different job, and the split is deliberate.

**This is the deliberate opposite of atlas.nonarkara.org**, which is Console:
dark ground, one amber. Objectively so — the atlas amber (`#f5a524`, 1.8:1) and
the old BKKx lime (`#c9ff38`, 1.1:1) both fail contrast on this paper, so the
two identities cannot quietly converge.

### Divergence from the Editorial preset (§XVII: named · load-bearing · written down)

The Editorial preset calls for a **serif body**. This page does not have one.
The reading matter is ~90% Thai, and every serif-adjacent Thai face — Sarabun,
TH Sarabun New, the looped families — is banned workspace-wide because large
head-loops read as learner material to a Thai reader. There is no permitted
Thai serif. Body is therefore set in **IBM Plex Sans Thai** (non-looped),
display in **Josefin Sans**, data in **JetBrains Mono**.

## Fonts — two live traps

- `layout.tsx` used **Inter**, which is banned. Replaced.
- The next/font `--font-*` variables must be on **`<html>`**, not `<body>`.
  `globals.css` declares `--font-body: var(--font-plex-thai)` on `:root`, and a
  custom property is substituted against the element it is *declared* on — so a
  `--font-*` living one level down on `<body>` is invisible to it, the chain
  computes to nothing, and everything silently falls back to system-ui. The site
  shipped that way for a while; the fonts were never actually rendering.

## The heritage data

Built by `scripts/build-heritage-register.py` into
`site/public/heritage-register.json`. `--refresh` re-downloads; sources cache in
`.cache/` (gitignored).

**Source:** Fine Arts Department, ข้อมูลบัญชีตำแหน่งโบราณสถาน
([`gis-finearts`](https://data.go.th/dataset/gis-finearts)), CC-BY. 8,341 rows
nationwide, 571 in Bangkok.

**Not** the Ministry of Culture's `vw_important_architecture` — it covers 72
provinces and contains **zero Bangkok records**. It cannot describe this city.

**The coordinate problem.** 397 of 571 Bangkok rows publish latitude to two
decimals (~1.1 km). In the Historic Core 181 monuments collapse onto 12 points,
37 stacked on one. Resolution order, recorded per-site in `locatedBy`:

1. the register's own coordinate when it carries ≥5 decimals
2. an OpenStreetMap feature whose name matches
3. nothing — district precision, listed but **never pinned and never given a
   block coordinate**

Fuzzy matching has two guards, both from real bad matches: digits must agree
(สะพานพระราม 6 was landing on the Rama VIII bridge) and the type word must carry
over (วัดบางขุนนนท์ was landing on the neighbourhood). Cutoff 0.90 — the gap
between every correct spelling variant (≥0.917) and วัดอินทาราม ~ วัดอมรินทราราม
(0.880), two different temples. `self_check()` asserts all of it every build.

Teleport height is each world's real `SpawnY` from `level.dat`, not Minecraft's
default 64 — these worlds are superflat with ground near y = −60.

## Deploy

```bash
npm run build --prefix site
npx wrangler deploy -c site/dist/server/wrangler.json --name bkkx-site
```

The site was on Codex Sites, which meant a page could only reach production from
ChatGPT. It now deploys from the repo to Cloudflare. `edge-proxy/` remains only
because it holds the `bkk.nonarkara.org` custom domain and forwards to
`bkkx-site`; it can be collapsed into a direct custom domain on the Worker
whenever that hop is worth removing.

`npm run build` also runs `site/scripts/fix-asset-manifest.mjs`: vinext builds
the client bundle and the RSC preload manifest in separate passes and their
hashes disagree, so without it every page fires a 404 for a MapLibre chunk that
does not exist.

## Deploy-time gotcha

Cloudflare negative-caches 404s at the custom domain for a few minutes. Do
not browser-test bkk.nonarkara.org in the first minutes after a deploy that
changed chunk hashes — a request racing the asset upload poisons the edge
with 404s for those URLs until the TTL expires. Test the workers.dev URL
first; it is not cached.

## Domains

`bkk.nonarkara.org` → this site. `atlas.nonarkara.org` → `bkk-3d-atlas`.
The edge proxy once claimed **both** and 308-redirected the first to the second,
which stole the route from the atlas Worker and made the two flap on every
deploy. Never add `atlas.nonarkara.org` to `edge-proxy/wrangler.jsonc` again.
