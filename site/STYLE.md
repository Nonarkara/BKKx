# BKKx STYLE.md — Design bible wired into the codebase

This file is the amygdala of the BKKx codebase: it locks the design decisions
made from the three bibles (MSH, Kinetic Grids, Glance Path) so every agent
editing this repo reads the same law before touching UI.

Companion laws: `ANTI-SLOP.md`, `AGENTS.md`, `MSH.md` (downloaded 2026-11-04),
`KINETIC-GRIDS-FOR-AI.md`, `GLANCE-PATH-FOR-AI.md`.

---

## Registered grid (Kinetic Grids §2.1)

The homepage (`site/app/page.tsx` → `HomepageClient`) runs one named grid:

```
Named grid: column          (default product surface per KINETIC-GRIDS §2.8)
Heaviest visual: the 3D map iframe (≥60% first screen, map-first product)
Glance exit: headline + CityGlance instruments sit on the map's right edge
Intentional voids: left column quarter chips keep blank photo slots as
                   placeholder initials; never invent filler cards
Accents (≤2): --signal (#c9ff38) for hover/active state; --seal (#8c2f23)
              for heritage register accents. --signal is the live signal,
              one job only.
Scale step: masthead wordmark ~25px vs body ~13px (real step, not 16→20px)
Motion: none on first load; snap skeleton then content if any
Map-first override: n/a (map IS the entry on homepage)
```

No other named grid may be mixed on the first screen. Radial/axial are
reserved for marketing chapter openers only (KINETIC-GRIDS §2.8).

---

## Surface register

| Surface | Register | Grid | Map share | Accents |
|---|---|---|---|---|
| `/` homepage | Editorial | column | ≥60% | signal (active state) |
| `/areas/[slug]` | Editorial | column | n/a | seal |
| `/walks/[slug]` | Editorial | column | n/a | seal |
| `/flood` | Console (dark) | column | ≥60% | none (map is dark) |
| `/worlds` | Console (dark) | column | ≥60% | none |
| `/warroom` | Console (dark) | column | ≥60% | signal |

---

## Type scale (MSH §2.7, Glance Path §3)

≤8 font sizes. Display vs body is a real step (~1.5–2×), never 16→20px.

| Token | Size | Use |
|---|---|---|
| `--size-up` | display | masthead wordmark, section titles |
| body | 13–16px | prose, labels, chips |
| `--size-down` | 11–12px | meta, eyebrows, source lines |
| mono tabular | 10–20px | CityGlance numbers |

---

## Colour roles (Kinetic Grids §2.5)

| Role | Token | Job |
|---|---|---|
| Ground | `--paper` (#f1efe8) | quiet near-mono ground, Editorial |
| Ink | `--ink` (#11120f) | primary text, rules |
| Signal | `--signal` (#c9ff38) | live signal, active state, one job |
| Seal | `--seal` (#8c2f23) | heritage register accent, oxide |
| Quiet | `rgba(17,18,15,0.62)` | secondary text, source lines |

No decorative gradients, gradient text, or glass blur. No rainbow.

---

## MSH hard laws (never relax)

1. Boxes fit content; padding ≈ 0.5–1.5× line-height
2. No void over ~⅓ of first screen; no floating phone column on desktop
3. Compact first; scroll only for interesting detail
4. Symbols over prose when unambiguous
5. Logos never boxed
6. Something must win (≥1.5–2× type contrast, no equal card grids)
7. Subtract before add (≤15 cards, ≤3 shadows, one radius, ≤5 pills)
8. Map ≥60% of first screen on map products
9. MoMA alignment — no loose edges
10. Builder ≠ auditor

---

## Pre-ship checklist (every UI change)

- [ ] Grid named (or explicitly `none`) in component brief comment
- [ ] Elements snap to grid; no arbitrary `position: absolute` drift
- [ ] At least one intentional void (or documented why every track is full)
- [ ] Title scale is a real step; body stays readable (~45–75ch)
- [ ] ≤2 saturated accents; quiet ground
- [ ] No boxed logo plugging space
- [ ] Glance path pass: heaviest visual = entry, headline on its exit
- [ ] Tab order matches glance path
- [ ] Screenshots at 1440 / 1024 / 390; different reviewer signed off
- [ ] `grid: <name>` / `voids: intentional` / `accents: N` / `glance: pass\|fail`
  recorded in commit message or component comment

---

## Component inventory (audited 2026-11-04)

| Component | File | Grid | Glance path | MSH status |
|---|---|---|---|---|
| Homepage masthead | `HomepageClient.tsx:90` | column | Title above map — VIOLATION (fix) | REVISE |
| CityGlance strip | `CityGlance.tsx:108` | column (row of 5) | Readout on map edge — PASS | PASS |
| Quarter chips | `HomepageClient.tsx:173` | column | Edge instrument — PASS | REVISE (96px inflated) |
| OldTownPicks cards | `OldTownPicks.tsx:47` | column | n/a | PASS |
| PlaceMasthead | `PlaceMasthead.tsx:43` | column | n/a | PASS |
| Flood page | `flood/page.tsx:10` | column (map-first) | Map entry — PASS | PASS |

---

## Audit trail

- 2026-11-04: MSH audit captured in `Scars/MSH-audit-20261101.md` (atlas REVIEW 3pts, BKKx REVIEW 4pts)
- 2026-11-04: Grand Palace throne-hall columns fixed via `mark-slender.py` + `slender.test.mjs`
- 2026-11-04: KINETIC-GRIDS + GLANCE-PATH bibles wired into this STYLE.md
