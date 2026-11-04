---
updated: 2026-11-04
drafted_by: codex/gpt-5
reviewed: false
amended_by: mcode
amended_note: >
  The BKKx batch below was taken up, landed and deployed. The Atlas
  landmark-popup repair was not: it is carried over here with a diagnosis
  instead of a guess, because the named defect did not reproduce at the
  named coordinates on the current live build.
---

# Multi-agent reconciliation and proposed repair batch

Scope: BKKx main df6eb1e and bkk-3d-atlas main88b5c73. Audit and local
preparation only. No commit, push, PR mutation or deployment in this pass.
The director approval checkpoint is required by planning-discipline before
integrating/releasing the batch below. This is not a shipability clearance.

> **Amended 4 November 2026.** The approval was given and the BKKx batch
> below was integrated and released: the CI pin, the water relay fix, the
> glance strip's explicit error state and its elapsed-time deadline, and the
> new component test, all on main, all green in CI, all deployed. PR25, PR4
> and PR12 are closed with their dispositions written on them; PR24 is held
> with its real root cause. The Atlas popup repair is the one item carried
> forward, and it now carries a diagnosis rather than a description — see
> "The Atlas popup repair, carried over with a diagnosis" at the end.

## Reconciliation

Both initial mains were clean and synced. No stashes. BKKx is shallow, so local
missing merge bases or git-cherry output alone cannot prove work was lost.
Atlas has a clean active evidence worktree with two genuinely unmerged commits
and an older unpushed dependency proposal9925ff4 on pr21. Preserve both.
One prunable BKKx worktree registration was left untouched.

| Open PR | Disposition proposed, not executed |
| --- | --- |
| [BKKx25](https://github.com/Nonarkara/BKKx/pull/25) | Incorporate the targeted amulet-leveldb1.0.7 CI pin; source head b311338. Main run41798327201 fails its C++20 build; the PR checks are green. Local adaptation preserves Python3.11 and both world-write tests. Current-main CI remains unverified. |
| [BKKx24](https://github.com/Nonarkara/BKKx/pull/24) | Hold/split failing24-package batch, including MapLibre4→6 and TypeScript5→7. |
| [BKKx12](https://github.com/Nonarkara/BKKx/pull/12) | Close as replaced after recording disposition: main already has request validation and D1 daily write caps. Do not add the conflicting old Durable Object limiter. |
| [BKKx4](https://github.com/Nonarkara/BKKx/pull/4) | Close obsolete console proposal after recording disposition; BKKx is cultural heritage, operational CCTV belongs in Atlas. |
| [Atlas26](https://github.com/Nonarkara/bkk-3d-atlas/pull/26) | Hold/split failing dependency batch: TypeScript7, Three0.187 and Wrangler. |
| [Atlas25](https://github.com/Nonarkara/bkk-3d-atlas/pull/25) | Preserve and harden. Six targeted tests/typecheck pass, but no main UI consumer, CI checks or proven separate-Worker deployment. Future-dated cached evidence incorrectly survives upstream failure. |
| [Atlas16](https://github.com/Nonarkara/bkk-3d-atlas/pull/16) | Separate maintenance candidate. SHA-pinned Actions, green verification; review deployment-action major update explicitly. |
| [Atlas4](https://github.com/Nonarkara/bkk-3d-atlas/pull/4) | Close as superseded after recording disposition: main has civic dots, zoom floor, filters, fallback and click handling. |
| [Atlas2](https://github.com/Nonarkara/bkk-3d-atlas/pull/2) | Close as superseded after recording disposition: newer phone-header work replaces the conflicting proposal. |

Read-only reconciliation by pr_reconciliation. No branch or contribution was
deleted. Open dependency PRs are not automatically safe to merge.

## Confirmed gaps

1. **P1 BKKx water relay freshness.** Shared proxyWater spread the upstream
   payload then overwrote fetchedAt and source. A mocked2020 observation became
   current2026 with HTTP200. Prepared fix preserves the payload and puts receipt
   metadata in separate x-bkkx-relayed-at/x-bkkx-upstream headers. Malformed
   payloads retain the503/no-store contract. Eighteen flood tests pass.
2. **P2 BKKx permanent loading.** CityGlance fetch failures returned undefined,
   also the initial loading sentinel. Actual TSX execution with failed fetches
   produced five polling labels indefinitely. Prepared explicit ok:false error
   state preserves unknown values; successful cells/source failures stay useful.
   New component regression tests exercise network/HTTP/JSON failure and unmount.
   Register the new test in the explicit npm test list before release. A hung
   request deadline is still worth checking; unmount cancellation alone is not
   an elapsed-time deadline.
3. **P2 Atlas competing landmark popups.** A live1440×900 Grand Palace map click
   opened three overlapping cards: compound stand-in, heritage form and monument
   drawing. This is still reproducible after recent type changes. Proposed fix:
   one shared owner for these three architectural popups, deterministic priority
   for the specific monument over the compound summary, normal close/disposal
   lifecycle. Do not remove attribution or the underlying map/geometry.
4. **CI incorporation gap.** The working targeted CI pin exists in PR25 but was
   missing on main despite reports saying no code-doable work remained.
5. **Atlas25 future-cache gap.** A mocked upstream503 plus cached fetchedAt2999
   was returned as stale evidence even though sourceState rejects future dates.
   Add a worker-level regression and reject invalid/future cached copies before
   integration. Do not deploy an orphan backend with no caller merely to merge.

## Prepared local files, not shipped

- .github/workflows/ci.yml — PR25 pin adapted by pr_reconciliation.
- site/worker/flood.ts and site/tests/flood-evidence.test.mjs — relay fix/tests.
- site/app/heritage-atlas/CityGlance.tsx and site/tests/city-glance.test.mjs —
  loading/error distinction and component tests, by heritage_gap_review.
- This reconciliation/approval plan. Atlas main remains untouched.

Tests reported by the preparing agents are targeted, not a fresh full build,
independent finished-UI review or proof of production changes. Terminal
verification after the CityGlance type narrowing correction: flood18/18,
component4/4, typecheck and diff check pass. Do not claim the whole system
passed from those checks.

## Proposed approved batch

### User review / critical decisions

Approve integration of the three prepared BKKx fixes, registration of the new
component test, and the Atlas landmark-popup ownership repair. Keep Atlas25 as a
separate hardening/integration task, preserve its worktree, and leave dependency
majors out of this release. Approve obsolete-PR closure only after preserving
the disposition record; do not delete branches.

### Sacred items and anti-regression

- Keep the three type tokens, palettes and earned maps/media/data layers.
- No inferred new coordinates, heights, entrance/access or safe-route claims.
- No file collapse>30%, wholesale redesign, new paid service or secret change.
- No changes to the working heritage geometry solely to satisfy a scanner.

### Visual brief for the interaction repair

Reader/task: inspect one landmark and understand its evidence/limitations.
Named grid: existing column edge instruments; map remains initial entry.
Attention: map1 → specific landmark explanation2 → source/close action3.
Exit: popup adjacent to selected location, source and dismissal together.
Preserve full qualifications, layer toggles and normal keyboard/close behaviour.
No new motion, decorative chrome, palette or font tier. This is an ownership
repair, not an excuse to compress necessary source text.

### Verification and falsifiers

1. Re-run proxy/component regression tests; show old code fails those cases.
2. Register component suite; full BKKx tests, typecheck, lint/build as applicable.
3. Atlas popup unit tests cover handler-order permutations, repeated clicks,
   close/remove lifecycle and map isolation; old three-owner behaviour must fail.
4. Actual browser checks390×844,1024×768,1440×900 and enlarged text: one popup,
   readable complete qualification, reachable close, preserved map and controls.
   Record before/after popup count and bounds, action visibility and map geometry.
5. Different agent reviews the finished diff and actual captures. A font count
   or overflow pass does not clear task geometry.
6. Commit/push/deploy through existing scripts, then verify live bytes/headers,
   APIs and browser interactions. Rerun current-main CI to validate the pin.

## Audit limits

Live phone check showed recent agents already repaired the old half-width
verdict:390px now has a366px verdict and visible32px grouped actions in a200px
strip. Preserve that work; do not repeat the29 October finding as if unfixed.
An initial screenshot caught a closing drawer mid-transition; a subsequent
read confirmed the closed drawer outside the viewport, not a static obstruction.
This does not certify enlarged-text behaviour or all routes.

No complete reconstruction/photo commission, hydraulic forecast validation,
LONGDO/FIRMS credential provisioning or FloodDash server repair was performed.
Those are not closed by typography, a clean tree or HTTP200.

## The Atlas popup repair, carried over with a diagnosis

The one item from the batch above that was not carried out. It is a different
repository, it needs a design decision rather than a patch, and the named
defect did not reproduce at the named coordinates — so a guess would have been
worse than an honest handover.

### What was measured

Driving the live Atlas with a headless browser at 1440×900, on the build it
is currently serving (`bkk-atlas-20261104-1793780426-272dc15`):

- Navigated with the Atlas's own share-link parameter, `?at=100.4913,13.7500,16`.
  **The parameter takes lng, lat AND zoom** — `parseAtQuery()` (app.js:1748)
  matches `^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$` and returns
  null for a two-argument form, which is then silently ignored. A
  reproduction that omits the zoom never moves the map and appears to prove
  nothing.
- Clicked the map centre. The click landed at **100.49265° E, 13.74875° N** —
  the Grand Palace — and the coordinates are reported in the inspector, so the
  click was where it was meant to be.
- Counted what opened: **zero** `.maplibregl-popup` elements; one inspector
  card in the right panel (225px wide, 1166px tall — it scrolls); one place
  briefing inside that panel; the bottom "BKK provincial live" strip.

**No three overlapping cards.** The defect did not reproduce at the Grand
Palace on the current build.

### The mechanism, located

The arbitration already exists in the Atlas and is the right one:

- `pointLayersOwningClick(map, point)` (app.js:7562) returns the overlay
  features under the cursor, and the generic inspector already defers to
  them: `if (pointLayersOwningClick(map, event.point).length) return;`
  (app.js:7591). Every operational overlay — CCTV, live cams, civic POIs,
  flood roads, canals, water transit — is in that list.
- The **architectural** layers are not. `INSPECT_BUILDING_LAYERS`
  (app.js:7295) is `[LANDMARKS_LAYER, RATTANAKOSIN_BUILDINGS_LAYER,
  BKKX_BUILDINGS_LAYER]` — those are the things the inspector *reads*, not
  the things that *own* the click. The heritage-detail compound stand-in
  (`bkk-heritage-detail.geojson`, 9,275 features), the monument drawings
  (`bkk-landmarks.geojson`, 115 features, `kind: "monument"`) and the 3D
  heritage forms (`FORMS_LAYER`) are therefore three layers that can each
  answer the same click, and only the inspector is in the ownership
  protocol.
- `public/heritage-forms-layer.js:508` registers a **bare** `map.on('click')`.
  It opens a MapLibre popup whenever a form is near the cursor. It does not
  consult `pointLayersOwningClick`, it does not `stopPropagation`, and it
  does not dispose of a popup it opened on a previous click.

### The shape of the fix

1. Put the three architectural layers into the ownership decision, with
   deterministic priority: the specific monument over the compound stand-in
   over the generic form. "Specific" means the feature whose own footprint
   the cursor is inside, not the nearest one by distance.
2. Have the forms layer consult that decision before opening its popup, and
   have the inspector consult it before filling its card.
3. Give every architectural popup a normal close/dispose lifecycle, so a
   second click does not leave the first card on the map.
4. Preserve the full qualifications, the layer toggles and the normal
   keyboard and close behaviour. This is an ownership repair; it is not a
   licence to compress the source text.

### The test that must exist, before the fix

- Handler-order permutations: the forms handler registered before and after
  the inspector must give the same answer.
- Repeated clicks on the same point: one card, not two.
- Close and remove lifecycle: closing a card removes it; a later click opens
  exactly one.
- Map isolation: a click on a non-architectural feature opens no
  architectural card.
- The old three-owner behaviour must fail these cases.

### What is not settled

Whether the defect needs a landmark rather than the palace. The
reconciliation's third card was a "monument drawing", and the heritage forms
layer only activates at zoom ≥ 15 (`FORMS_MIN_ZOOM`). A sweep of the landmark
layer was started and did not complete — the page stopped answering
mid-sweep — so the landmarks were not checked one by one. The first thing to
try is a landmark with `kind: "monument"` at zoom ≥ 16.

If it does not reproduce anywhere, the honest disposition is to close the
finding with the measurement rather than to keep re-reporting it: a defect
nobody can reproduce is not evidence of a defect, and re-reporting it as one
spends the next agent's budget.
