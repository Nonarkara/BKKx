---
updated: 2026-11-04
drafted_by: codex/gpt-5
reviewed: false
---

# Multi-agent reconciliation and proposed repair batch

Scope: BKKx main df6eb1e and bkk-3d-atlas main88b5c73. Audit and local
preparation only. No commit, push, PR mutation or deployment in this pass.
The director approval checkpoint is required by planning-discipline before
integrating/releasing the batch below. This is not a shipability clearance.

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
