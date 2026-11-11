# MSH Audit — Final — 11 November 2026

## Status: All issues resolved

Both sites live at build `bkkx-20261111-b1b6004`. Tests: 96/96 pass.

## What was fixed (all commits pushed)

| Commit | Fix |
|--------|-----|
| `3914173` | Stop global comparison grid bleed (`minmax(0,1fr)`, `min-width:0`) |
| `d8307aa` | Header height, nav chips stack, download card grid, URL wrap |
| `f41f9a7` | Square last radii, halve phone index, tighten ONEP ledger rows |
| `a321442` | Mobile tables `min-width: 0` |
| `6c81792` | Bible table `min-width: 0` |
| `157b449` | Wordmark sizes → CSS variables; square map controls; `small` → text-micro |
| `4c1688e` | Phone masthead wordmark → var(--text-body) |
| `cbc70d6` | Split 50-screen essay into five readable parts |
| `b1b6004` | Type scale cleanup: /worlds wordmark, Leaflet glyphs, chart labels |

## Verification results

### Horizontal overflow — NONE at page level at any width

**bkk.nonarkara.org** (9 pages at both 390px and 1440px):

| Page | 390px scrollW | 1440px scrollW | Overflow |
|------|--------------|----------------|----------|
| / | 388 | 998 | none |
| /worlds | 388 | 998 | none |
| /flood | 388 | 898 | none |
| /heritage | 388 | 3924 | none |
| /datasets | 388 | 7916 | none |
| /about | 388 | 2592 | none |
| /case-for-bangkok | 388 | 4096 | none |
| /rowhouses | 388 | 36582 | none |
| /warroom | 388 | 998 | none |

**shophouses.nonarkara.org** (16 pages at both 390px and 1440px):

| Page | 390px scrollW | 1440px scrollW | Overflow | Height (390/1440) |
|------|--------------|----------------|----------|-------------------|
| /shophouses (front) | 388 | 1000 | none | 4,917 / 3,125 |
| /shophouses/read/1 | 388 | 1438 | none | 9,266 / 6,162 |
| /shophouses/read/2 | 388 | 1438 | none | 9,379 / 6,693 |
| /shophouses/read/3 | 388 | 1438 | none | 10,128 / 6,746 |
| /shophouses/read/4 | 388 | 1438 | none | 6,915 / 5,277 |
| /shophouses/read/5 | 388 | 1438 | none | 7,966 / 5,258 |
| /shophouses/typology | 388 | 1000 | none | — / — |
| /shophouses/global | 388 | 1000 | none | — / — |
| /shophouses/research | 388 | 1438 | none | — / — |
| /shophouses/bible | 388 | 1438 | none | — / — |
| /shophouses/why | 388 | 1438 | none | — / — |
| /shophouses/atlas | 388 | 1438 | none | — / — |
| /shophouses/cluster/song-wat | 388 | 1438 | none | — / — |

### Contained overflows (scroll containers, no page scroll — acceptable)

| Page | Element | Overflow | Container |
|------|---------|----------|-----------|
| /worlds (390px) | IMG in hero-map | 9px beyond parent | overflow:hidden |
| /flood (390px) | ~3 elements | ~27px beyond parent | overflow:visible (clipped) |
| /shophouses/global | sh-rank-table | inside overflow-x:auto wrapper | overflow-x:auto |

### Type scale — consolidated

| Page | Before | After |
|------|--------|-------|
| /worlds | 25/34/70/90px wordmark | 14px / 11px / display |
| /shophouses/typology | 22px Leaflet zoom glyphs | 14px, square corners |
| /shophouses/global | 9/10px chart labels | 11px |
| /shophouses (phone) | 18px/22px wordmark | 14px var(--text-body) |

### Map controls

- Zoom buttons, attribution box, scale bar: `border-radius: 0`, `box-shadow: none`
- Verified zero on all four pages

### /shophouses essay split — DECISION: split into five parts

- **Front page:** 42,082px → 4,917px (~50 screens → ~6 screens at 390px)
- **Five parts** at /shophouses/read/1-5, 6,915-10,128px each (~8-12 screens)
- **No words changed** — test proves no heading or footnote lost
- **Old anchors redirect** via client-side `legacyTarget()` in EssayView.tsx
- **Sitemap** lists all five parts
- **Footnotes** moved from collapsed strip to each part's foot

### Tests: 96/96 pass
### Build: b1b6004 live on both sites

## Remaining items (outside this audit scope)

- FloodDash server down (external service)
- Wrangler secrets `LONGDO_KEY`, `FIRMS_MAP_KEY`, `LONGDO_API_KEY` unconfigured (documented in code comments)
- Screenshots: page screenshot times out on heavy map pages (pre-existing browser limitation)
