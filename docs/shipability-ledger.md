# Shipability ledger

Objective: **Professional shipability on all branches and main: zero spatial
hallucination, zero AI design slops.** This objective is not yet achieved.
Do not substitute one green build or one repaired screen for the full audit.

## Completion evidence required

| Requirement | Evidence needed | Current state |
| --- | --- | --- |
| Preserve all agents' earned work | Dirty trees, stashes, worktrees, local/remote refs and PR disposition; content comparison for squash merges | Initial inventory recorded in agent-reconciliation-2026-10-25.md; no destructive cleanup |
| Every intended release branch is shippable | Exact SHA, complete build/type/lint/tests, no missing generated data; actual deploy target | Main verified at e3d2d65 previously; PR19 incorporated locally in d44e1e9; other branch tips not proven |
| No spatial hallucination on every public surface | Actual 390/1024/1440 geometry and screenshots; expanded/empty/error states; task evidence and action together | Homepage shell repaired; other routes and product branches require systematic rendered audit |
| No AI design slop | Role-based fonts, readable hierarchy, no decorative gradients/glass/glow, content-sized groups and one meaningful accent; independent review | Homepage typography repaired; marker nameplate/glass cleanup in next release; not a whole-system pass |
| Usable without pointer precision | Visible focus, real names, reachable controls, keyboard activation, touch targets, enlarged text | Homepage navigation verified; marker naming repair in progress; broader dialogs and enlarged-text coverage remain |
| Preserve trustworthy data | Observation/model/reference tiers, age, unknown not zero, source links; no invented safe routes or survey precision | Existing safety boundaries retained; not a new validation of all feeds |
| Production matches tested source | Commit/push, build stamp, asset hash, desktop and phone interaction checks on actual domain | Previous release proved; each subsequent release must repeat |
| Independent review | Confirmed findings corrected and rechecked against rendered artifacts | Previous release passed bounded review; not a blanket approval of all branches |

## Remaining branch and PR work

- PR19: pinned Actions update merged and pushed as d44e1e9 (GitHub confirms merged); repo guard
  still runs all current test files and retains least privilege. Verify new CI.
- PR12: pageview limits remain open; raw IP storage keys lack retention cleanup.
  Fix privacy/retention and audit the spending claim before adding storage.
- PR13: broad dependency proposal has failing checks; MapLibre/Three/vinext
  migrations need version-specific rendering/worker tests, not a blanket bump.
- PR4: compact-console/camera contribution is partially superseded; compare its
  remaining useful behavior without restoring removed dead/duplicate streams.
- `shophouses`: separate-domain proxy/build changes require their own live proof.
- `feat/shophouse-fabric`, `audit-typology`, the real-data release ref, and merged
  phone/data/security/essay refs retain original histories; integration of their
  contributions does not prove their historical tips ship with today's fixes.
- `wip/maplibre6-security-fixes`: explicitly broken experiment, not a release.
- `klx.nonarkara.org`: a different city; do not silently treat it as Bangkok.
- Operational Atlas: its outstanding PR25/4/2 and dependency/Actions proposals
  remain separate work, as recorded in the reconciliation receipt.

Clarification requested: does “all branches” mean the active Bangkok products,
or every historical tip including a different-city fork and broken experiment?
Until answered, preserve both the broad objective and every contribution; do not
claim completion by silently narrowing the scope or deleting troublesome refs.

## Marker repair acceptance record — 25 October 2026

Found: first-word labels made landmarks “The”/“Wat” and all rowhouses
“Rowhouse”; every location carried a large glowing/glass nameplate.

Repair: retain every marker and coordinate, use 44px native buttons with small
geographic symbols, disclose actual full names on hover/keyboard focus, keep
the full inspector on activation. No dynamic place name enters innerHTML.
Legend starts closed. Heritage points are circles, other POIs squares.

Runtime exposed a separate existing accessibility failure: MapLibre4 `addTo()`
replaces custom `aria-label` values with “Map marker”. Names are now restored
after installation for chapters, heritage, POIs and cameras, not merely declared
before installation. Regression test checks that ordering for all four groups.

Preview evidence: all16 curated heritage markers remain; full Grand Palace name
appears on keyboard focus; computed shadow and backdrop blur are none. Enter
opens the sourced heritage inspector at phone width. Screenshots:
`/tmp/bkkx-marker-focus.png`, `/tmp/bkkx-marker-phone.png`.
Final production build and tests pass (42 source checks and 94 rendered tests),
typecheck and lint pass, and the independent diff reviewer reports no remaining
confirmed blocker. Pointer activation also opens the inspector at phone width.
Additional viewport captures: `/tmp/bkkx-markers-1440.png` and
`/tmp/bkkx-markers-1024.png`. Production verification is still required.

Environment note: this round observed host load averages above379, plus a git
fetch SSL timeout. Existing build/preview handles were polled rather than
restarted solely on observation timeouts. Never kill unrelated agents/services.
