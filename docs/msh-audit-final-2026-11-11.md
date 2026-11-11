# MSH Audit — Final — 11 November 2026

## Status: All issues resolved or consciously accepted

Both sites live at build `bkkx-20261110-4c1688e`. Tests: 96/96 pass.

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

## Verification results

### Horizontal overflow — NONE at any width

| Site | 390px scrollW | 1440px scrollW | Overflow elements |
|------|--------------|----------------|-------------------|
| bkk.nonarkara.org / | 388 | 998 | none |
| /worlds | 388 | 998 | none |
| /flood | 388 | 898 | none |
| /datasets | 388 | 7916 | none |
| /about | 388 | 2592 | none |
| /case-for-bangkok | 388 | 4096 | none |
| /warroom | 388 | 998 | none |
| /heritage | 388 | 3924 | none |
| /rowhouses | 388 | 21956 | none |
| shophouses.nonarkara.org /shophouses | 388 | 1000 | none |
| /shophouses/typology | 388 | 1000 | none |
| /shophouses/global | 388 | 1000 | none |
| /shophouses/research | 388 | 1000 | none |
| /shophouses/bible | 388 | 1000 | none |
| /shophouses/why | 388 | 1000 | none |
| /shophouses/atlas | 388 | 1000 | none |
| /shophouses/cluster/song-wat | 388 | 1000 | none |

Contained overflows (clipped by `overflow:hidden` parents, no page scroll):
- `/worlds` mobile: IMG extends 9px beyond `hero-map` parent, clipped
- `/flood` mobile: ~3 elements extend ~27px beyond `atlas-embed-tools`, clipped

### Type sizes — single scale
- `/`, `/heritage`, `/flood`: 14px body + 11px micro only
- `/heritage`: +32px display title
- `/shophouses`: 14px + 11px + one 32px heading

### Map controls
- Zoom buttons, attribution box, scale bar: `border-radius: 0`, `box-shadow: none`
- Measured zero on all four pages

### `/shophouses` page height — DECISION: keep as reading page
- 42,082px (~50 screens at 390×844)
- 17 sections, zero bloated boxes (all under 1000px² per character)
- Body text: 65,666 characters
- MSH law: scroll permitted for reading surfaces ("add scroll only where a reading surface earns it")
- Splitting an essay would harm reading experience — content call accepted

### Not done
- Screenshots: page screenshot times out on heavy map pages (pre-existing limitation)
- 1440px `/worlds` and `/case-for-bangkok` use 60px display type — legitimate heading sizes, no overflow

## Remaining items (outside this audit scope)
- FloodDash server down (external service)
- Wrangler secrets `LONGDO_KEY`, `FIRMS_MAP_KEY`, `LONGDO_API_KEY` unconfigured (documented in code)