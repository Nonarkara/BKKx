# Context Save — BKKx MSH Audit — 11 Nov 2026

## Status: Complete except screenshot review

**LIVE BUILD:** `bkkx-20261111-b1b6004` on both sites  
**TESTS:** 96/96 pass  
**GEOMETRY:** All 25 pages × 2 widths — zero page-level overflow (verified via browser.evaluate)

## What's done

| Area | Status |
|------|--------|
| Page-bleed defects | Fixed: tables min-width:0, grids minmax(0,1fr), cards shrink-to-fit |
| Type scale | Consolidated: 14px/11px/display only at both widths |
| Map controls | Squared: border-radius 0, box-shadow none |
| /shophouses essay | Split into 5 readable parts (was ~50 screens, now ~6-11 each) |
| Old anchor redirects | Implemented in EssayView.tsx `legacyTarget()` |
| Sitemap | Lists all five part pages |

## Remaining — blocks closure (screenshot capture blocked headless)

**3 pages × 2 widths = 6 screenshots needed:**

1. `https://shophouses.nonarkara.org/` at 390px and 1440px
2. `https://shophouses.nonarkara.org/shophouses/read/1` at 390px and 1440px  
3. `https://bkk.nonarkara.org/worlds` at 390px and 1440px

**Checks needed:**
- First-screen read: eye enters on visual weight, hierarchy survives first screen
- Old anchor redirect: open `/shophouses/#the-arithmetic-that-eats-a-street` → verify client-side redirect to correct part
- Phone check: front page on physical phone (first useful action above the fold)

**Browser tabs (may be stale after restart):**
- tab_4fe89ecb-e32e-4d8f-81bc-b567897e86f1 → shophouses read/1
- tab_69ff3aaf-62c1-483b-b2e7-cc2088ce57a4 → bkk worlds  
- tab_ff060669-9d19-45a5-a4e2-c236a47acd12 → atlas

**Screenshot command:** `tools.browser.screenshot({ tabID, fullPage: true })` — BLOCKED in headless mode ("Screenshot needs a visible tab"). Requires a visible desktop browser session.

**Key files:**
- site/app/globals.css
- site/app/shophouses/EssayView.tsx
- site/app/shophouses/PartView.tsx
- site/app/data/shophouse-parts.ts

## Already verified (no action needed)

- `/shophouses` front page: 4,917px (was 42,082px) at 390px; 3,125px at 1440px
- `/shophouses/read/1`: ~9,000px at 390px; 7,034px at 1440px
- `/worlds`: 6,368px at 390px; 5,463px at 1440px
- All pages: zero page-level overflow at both widths
- `/shophouses/global` shadows: 2 inset yellow rules on pinned rows — allowed by house law (inset hairline)
- `/shophouses/typology`: 844px exactly one screen at 390px — intentional full-viewport map
