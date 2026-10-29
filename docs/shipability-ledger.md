# Shipability ledger

Objective: **Professional shipability on all branches and main: zero spatial
hallucination, zero AI design slops.** This objective is not yet achieved.
Do not substitute one green build or one repaired screen for the full audit.

## Completion evidence required

| Requirement | Evidence needed | Current state |
| --- | --- | --- |
| Preserve all agents' earned work | Dirty trees, stashes, worktrees, local/remote refs and PR disposition; content comparison for squash merges | Initial inventory recorded in agent-reconciliation-2026-10-25.md; no destructive cleanup. PR22 and PR23 merged this round; PR12 and PR13 answered on the record; no branch deleted or rewritten |
| Every intended release branch is shippable | Exact SHA, complete build/type/lint/tests, no missing generated data; actual deploy target | main shipped at a918958 with a proven build stamp. Other branch tips still not proven; the KL fork, the broken MapLibre 6 experiment and the feature branches remain out of scope but preserved |
| No spatial hallucination on every public surface | Actual 390/1024/1440 geometry and screenshots; expanded/empty/error states; task evidence and action together | Whole surface swept at 390 and 1440 with an exhaustive 639-URL gate; 200% enlargement, blocked fonts and keyboard proven on every template. Expanded and error states still not exercised |
| No AI design slop | Role-based fonts, readable hierarchy, no decorative gradients/glass/glow, content-sized groups and one meaningful accent; independent review | Typography and marker work carried forward. Whole-system slop pass not claimed; the homepage's layer chip hues and the overlapping landmark labels remain open |
| Usable without pointer precision | Visible focus, real names, reachable controls, keyboard activation, touch targets, enlarged text | Keyboard proven on 20/20 routes with a visible ring and a real name on every tab stop; 44px targets on the new disclosure; 200% enlargement proven. Dialogs still not exercised |
| Preserve trustworthy data | Observation/model/reference tiers, age, unknown not zero, source links; no invented safe routes or survey precision | Existing safety boundaries retained; the new page-view ceiling adds a count and no identity. PR22's four measures carry their caveats. Not a new validation of all feeds |
| Production matches tested source | Commit/push, build stamp, asset hash, desktop and phone interaction checks on actual domain | Proven: the stamp travels in the artifact and the live site reports it on three domains; the deploy refuses to finish if it does not |
| Independent review | Confirmed findings corrected and rechecked against rendered artifacts | An independent reviewer was run over this round's diff and evidence; its findings are recorded below or applied |

## Remaining branch and PR work

- PR19: pinned Actions update merged and pushed as d44e1e9 (GitHub confirms merged); repo guard
  still runs all current test files and retains least privilege. Verified 25 October; PR23
  supersedes it and merged 29 October.
- PR12: held, with the finding and the replacement written down on the PR. A daily page-view
  ceiling now ships on main; the per-address limit belongs to a Cloudflare rate-limiting
  rule, specified in `docs/pageview-rate-limits.md` and still to be confirmed in the zone.
- PR13: split and documented on the PR — a safe batch that could ship, and majors
  (`vinext` 1, `typescript` 7, `eslint` 10, `three` 0.186, `maplibre-gl` 6,
  `@types/node` 26) that each need their own round.
- PR4: compact-console/camera contribution is partially superseded; compare its
  remaining useful behavior without restoring removed dead/duplicate streams. It needs its own
  audit and a decision on its information density.
- `shophouses`: the separate domain was proven live on 29 October — the essay at `/`, all seven
  internal destinations at 200, and the same build stamp as the main site.
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
`/tmp/bkkx-markers-1024.png`.

Shipped source `52dccab`, pushed to main, Worker version
`247755bf-5a77-4065-a03e-87109de5285a`. Five production routes return 200
with `x-bkkx-build: bkkx-20261025-markers-52dccab`; both the new CSS and
AtlasView JavaScript match the tested local SHA-256 bytes. Reloaded production
browser confirms the full Grand Palace accessible name. Screenshot:
`/tmp/bkkx-markers-live.png`. Initial upload failed due to connectivity; one
retry succeeded. Latest remote CI status could not be retrieved (TLS timeout);
do not equate local passing checks with verified remote CI.

Environment note: this round observed host load averages above379, plus a git
fetch SSL timeout. Existing build/preview handles were polled rather than
restarted solely on observation timeouts. Never kill unrelated agents/services.

## Analytics boundary repair — 25 October 2026

Previous turn: verified progress, not completion. GitHub now confirms successful
CI for d44e1e9, 52dccab and 87794c0 (runs 40163806300, 40164552497,
40165163197). BKKx has no stash; operational Atlas and BKKxCulture have no dirty
files. The pre-existing PBF and prunable detached scratch-worktree record remain
untouched. No historical branch was deleted or rewritten.

PR12 source 85aadfb supplied the origin-check concept. Its proposed persistent
raw-IP buckets have no expiry, so they remain held. Its JSON parser, like main's,
also treats `null` as an object; reproduced `TypeError: Cannot read properties
of null (reading 'path')` before editing.

Main now validates before D1: exact allowed origin (including the custom-domain
proxy), JSON content type, actual streamed UTF-8 byte limit of 4096, object shape
and local path. Rejections are 400/403/413/415 with no-store. A forged Origin is
not authentication: non-browser callers can still spoof it. No new storage,
per-IP counter, rate limit or hard spending ceiling is claimed.

New analytics records keep only the current pathname and referring origin, not
queries, fragments, credentials or the previous document path. Existing stored
history is not purged by this change.

Verification: production build, typecheck, lint, 94 rendered tests and the final
consolidated run of all 48 source tests pass (142 total). The built Worker
rejects six invalid request classes with a D1 getter that throws on access, and
records a valid sanitized payload against a test-only DB. All ten test files are
wired into both npm test and CI. Generated public data remains unchanged.
Shipped source cb3b69b, pushed to main; Worker version
`fa5aa9f5-96c1-4173-8bf1-a78c1add301a`. Production homepage returns 200 with
`x-bkkx-build: bkkx-20261025-analytics-cb3b69b`. All six live rejected-request
probes return the expected 400/403/413/415 and no-store. No synthetic successful
pageview was written in production. Initial live GET timed out; the subsequent
bounded verification completed successfully. GitHub run 40165521101 passed;
40165600473 was still in progress at the last observation, not claimed passed.

## Release provenance and whole-surface audit — 29 October 2026

Base `475f2af`. This round repaired the release chain, audited the whole public
surface with instruments instead of by eye, fixed what the audit found, and
deployed.

### The release chain was broken, and the cause was structural

The live site had stopped reporting which build it was running. The deployed
Worker's only binding was `DB` — no `BUILD_ID` — so "the live site is running
commit X" had become a claim nobody could check.

The cause was not a bug in the stamping code. It was where the stamp lived.
`wrangler --var BUILD_ID:…` applies to the one command that carries it, and
the upload command this repo documents everywhere else —
`wrangler deploy -c site/dist/server/wrangler.json` — has no such flag, and
the built manifest's `vars` map is empty. The 26 October release went out
through that command. The site answered 200 the whole time.

The id is now baked into the artifact: `site/scripts/stamp-build-id.mjs` writes
it into `dist/server/wrangler.json` during the build, and a `wrangler
--dry-run` confirms the deployed Worker binds `env.BUILD_ID` from it. There is
no upload command left that can drop the stamp, because the stamp travels with
the bytes. `site/scripts/deploy.sh` is now the only documented path; it reads
`x-bkkx-build` back off the live site after uploading and fails if the id
differs from the one it uploaded.

The dirty-tree guard was part of the cause. It refused to release anything
while an unrelated untracked file sat in the repository — the OSM extract at
the repo root — so the guard was bypassed on 26 October, and bypassing it is
what lost the stamp. It now refuses modified tracked files and untracked files
the build actually reads, and ignores the rest. A guard that blocks every
release gets bypassed.

### What the audit found, and what it cost

The instruments are in `tools/`: `msh-audit.mjs` records what MSH §6 asks for
at 390, 1024 and 1440; `msh-sweep.mjs` is the exhaustive geometry gate over
every public URL; `msh-resilience.mjs` proves 200% enlargement, blocked fonts
and keyboard reachability. `slop-lint.mjs` is vendored from the house tools.
All three refuse to measure a site they cannot identify — during this work a
second agent's server took the same port on IPv6, and a sweep silently
measured a different website for the last stretch of its run.

Found and fixed:

- **176 public pages** — the editorial masthead's navigation was a
  horizontally scrolling strip with the scrollbar hidden. Eleven destinations
  in 294px put eight of them past the fold with nothing to say so, and the
  strip cut a word in half ("T" for "The case"). It is now the labelled
  disclosure the front door already used. Phone chrome on that shell falls
  from 129px to 75px.
- **A menu that opened off-screen** — the atlas "more layers" panel hung 146px
  to the left of the viewport; on a phone two thirds of it was outside the
  frame and its buttons were unreachable.
- **The datasets page scrolled sideways at 200%** — a citation row is a grid
  item whose content is one long unbreakable string, and a grid item's
  automatic minimum is its content's minimum, so the `1fr` track grew past
  the page.
- **Clipped text** on walk pages (stop names truncated to make room for a
  distance), on the typology library's status strip (cut to "5 types · No pin
  yet — a point nee"), on the satellite aerosol button (cut to "◉ Satellite
  aeros…", so the reader never saw which observation they were looking at),
  and on the homepage status strip (the provenance line, cut to "111/136
  stations wet · heavies…").
- **/flood was missing from the sitemap** although it is a public page linked
  from the war room and from the atlas. A new test now holds the line: every
  route on disk must be either in the sitemap or on a list of pages that asked
  not to be indexed, with the directive checked.

### Verified

- 639-URL geometry sweep, run against production: 639/639 URLs checked at 390
  and 1440. The only failure was the status-strip line, which is fixed in
  `dcac1e9` and re-checked live with zero clipped nodes.
- Before the work the same gate reported 387 failures out of the first 391
  URLs checked.
- 200% enlargement, blocked web fonts and keyboard reachability: 9/9 routes
  pass all three after the fixes, and 20/20 routes passed the keyboard check
  (25 tab stops each, every one with a visible focus ring and a real name).
- Live, after deploy: `bkk.nonarkara.org`, `bkkx-site.drnon.workers.dev` and
  `shophouses.nonarkara.org` all report `x-bkkx-build: bkkx-20261029-dcac1e9`,
  which is HEAD. The separate shophouses domain serves the essay at `/` and
  all seven internal destinations at 200.
- The page-view ceiling is live in production D1: the `pageview_daily` table
  exists and counts on the Bangkok day boundary (`2026-10-29`). A valid
  browser-shaped POST returns 201, a forged Origin 403, a `null` body 400.

### PR disposition

- PR22 (four street measures on Why, from Bhardwaj's October carousel) and
  PR23 (pinned Actions) merged. The Instagram post was checked live and is
  correctly attributed: @abhinavbwj, 25 October 2026, "Why Old Towns feel
  good, in numbers?". The PR's own tests assert the caveats and the absence
  of the temperature claim and of the art.
- PR12 is held, with the finding written down on the PR. Its raw-IP Durable
  Object keyed buckets on the connecting address — a personal identifier in
  durable storage, pruned only when a later request arrived — and it put a DO
  in front of every write, which costs more than the row insert it protects.
  The landed replacement is a counter row per Bangkok day holding
  `(day, n, updated_at)` and nothing else. The per-address limit belongs at
  the edge, where it is free; the Cloudflare rate-limiting rules are written
  down in `docs/pageview-rate-limits.md`.
- PR13 is split, not merged, and not in this round. The safe batch (patch and
  minor bumps) and the held majors (`vinext` 1, `typescript` 7, `eslint` 10,
  `three` 0.186, `maplibre-gl` 6, `@types/node` 26, the Cloudflare vite
  plugin) are listed with the reason for each on the PR. A dependency
  migration in the same change as a spatial-hallucination audit makes it
  impossible to attribute a difference to a cause — and the last release
  already lost its build id because two unrelated things changed at once.
- PR4 (compact dense Console) is left open. It is a feature branch that
  needs its own audit and a decision on its information density, not a merge.

### Still open

- The "all branches" question stands: the active Bangkok products are now
  audited and shipped; `feat/shophouse-fabric`, `audit-typology`, the
  real-data release ref, the KL fork and the broken MapLibre 6 experiment
  retain their histories and are not claimed as shipped.
- The Operational Atlas's own PR25/4/2 and dependency proposals remain
  separate work, as recorded in the reconciliation receipt.
- The Cloudflare rate-limiting rules in `docs/pageview-rate-limits.md` are
  specified but must be confirmed as configured in the zone.
- The release path does not itself check that CI passed for the commit it is
  releasing. The discipline is push, wait for CI, deploy — and it was followed
  this round — but the script would happily upload a commit whose checks had
  failed. Gating it on `gh` would make the release path depend on a network
  call to GitHub, which is its own kind of fragility; the honest options are a
  required status check on the branch, or a deliberate override. Not decided
  here.
- Expanded, empty and error states are still not exercised. The proof so far
  covers the states the pages actually load in.

