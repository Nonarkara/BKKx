# Agent-work reconciliation — 25 October 2026

Scope: BKKx heritage release. Operational Atlas and the BKKxCulture snapshot
were inventoried, not rewritten or redeployed. This is a bounded release,
not a claim that every historical branch is production-ready.

## Tree truth before editing

- BKKx `main == origin/main` at `1aae709`; no modified tracked files or stashes.
  Two untracked files: the prior MSH plan and `bbb-buildings.osm.pbf` (76 bytes).
  The latter is preserved, not staged, ignored, moved or deleted.
- All local and remote branch tips and worktrees listed. A prunable detached
  scratch checkout points to an old dependency proposal; it was not removed.
- Atlas clean, no stash, main matches origin after fetch at `7d936a3`.
- BKKxCulture clean, no stash, main matches origin at `bd3c61b`; no open PRs.
- Squash merges mean `git cherry`/ancestry alone overstates missing work.
  Compared relevant files and GitHub merged PR metadata instead.

## Decisions on open BKKx work

| Work | Decision |
| --- | --- |
| PR17, standalone phone controls | Incorporated with original branch ancestry in `5828d55`; preserved compact deck, text labels, source disclosure and credit access. |
| PR20, embedded phone shell | Incorporated in `8eb94eb`; reconciled legend state, parent-viewport phone detection, quarter selection and attribution with PR17 and later main fixes. |
| PR4, compact console/live cameras | Not blindly merged: its camera list predates the later dead-stream/duplicate reconciliation. Current camera layer and opt-in discipline retained; current CityGlance retained instead of a second live strip. Compact geometry implemented in this release. PR remains open. |
| PR12, pageview limits | Reviewed, not incorporated. The proposed limiter stores `ip:${ip}` in Durable Object storage without expiry cleanup. Public origin checks do not authenticate non-browser callers. Needs a privacy/retention review before adding storage. Original work remains intact. |
| PR13, 24 dependency upgrades | Held: both test jobs currently fail. Includes major MapLibre/Three/vinext/TypeScript changes; not a safe companion to layout reconciliation. |
| PR19, Actions updates | Inventoried; separate maintenance change, not required for this UI release. Existing SHA pinning and complete test coverage retained. |

Already landed and retained: PR14's typology library, PR15's base-box cover,
PR16's immutable data, PR18's anti-slop rules, earlier essay additions and security
patches. Current `815dcfc` label-font/Worker-weather fixes and `53798ab`/`1aae709`
build stamping remain present after reconciliation.

Other refs: `shophouses` carries a separate-domain proxy/build line; the KLX
branch is a different city. Neither belongs in a blanket heritage merge.
`wip/maplibre6-security-fixes` explicitly records a broken experiment and stays
out. No branch was deleted, reset or force-pushed.

## Operational Atlas open work

PR25 adds isolated location-evidence modules and a separate Worker config;
its source list was inspected, not deployed. PR4 amenity filters and PR2 phone
header are older open proposals; PR24 dev dependencies and PR16 Actions are
also open. They require comparison against Atlas's current renderer and
release gates in a separate operational scope. No claim that they were merged.

## Corrections in this release

- Fix intrinsic grid expansion and replace the cramped phone navigation strip
  with a labelled Browse disclosure; retain all eight destinations and language.
- Bring in both phone PRs without reverting newer map imports, labels, weather
  proxying, immutable data, cover geometry or source evidence.
- Jost + Prompt interface; retain the essay serif and typology Chinese face.
  Fix Jost's generic fallback intercepting Thai; update SVG chart typography.
- Restore focus to the index toggle after a keyboard place selection and to
  the originating disclosure on Escape. Remove imported scroll gradients.
- Isolated optional `BKKX_PREVIEW_STATE` avoids touching another local worker's
  incompatible Miniflare SQLite store. Production defaults/bindings unchanged.

## Verification receipt

- Full production build and test run: 40 source/geometry checks + 94 rendered
  checks, all passed. Typecheck and lint passed before final documentation.
- Independent read-only reviewer examined merged code and four real screenshots.
  Three findings corrected: removed font-variable reference, hidden-index focus,
  and two gradients. Bounded correction review reported no further blocker.
- Browser: English/Thai switch, open index, quarter jump, Browse navigation,
  More layers and map-key open/close exercised. At 375px, Enter on Talad Noi
  closes index, updates iframe location and returns focus to Index.
- Measurements (map-frame allocation, not unobscured geographic pixels):
  390×844 -> header56px / map390×788px;
  1024×900 -> header59px / map744×771.16px (62.3%);
  1440×900 -> header79.89px / map1100×750.27px (63.7%).
  768×900 shell fits; map488×771.16px. 375×812 shell fits, map375×756px.
- Preview screenshots: `/tmp/bkkx-msh-1440.png`, `-1024.png`,
  `-phone-index.png`, `-phone-map.png`. Early map screenshots include loading
  imagery; they do not prove settled rendering. Live proof is recorded below
  only after deployment.
- Not performed: fluent-reader usability study, blocked-font browser test,
  200% browser-text proof, full operational Atlas audit, newly reconstructed
  landmark acquisition or validation. Do not infer those from a layout release.

## Release

- Source: `e3d2d65`, pushed to main with both merge commits. GitHub PR17 and
  PR20 report MERGED at 2026-10-25T02:08:41Z.
- Deployed only `bkkx-site`, version `1ef0d3f0-6139-4a60-b381-523bfe48b2aa`.
  Live header: `x-bkkx-build: bkkx-20261025-msh-e3d2d65`.
- Used the explicit built `dist/server/wrangler.json` and the release script's
  `--var BUILD_ID:...` mechanism, after checking tracked source matched HEAD.
  The normal script refuses any untracked file; the pre-existing PBF was left
  untouched instead of silently committing or hiding it to satisfy that guard.
- Live `/`, `/heritage`, `/rowhouses`, `/shophouses/typology`,
  `/atlas/historic-core`: HTTP200, all reporting the new build.
- Application CSS `/assets/index-CsKyP_SM.css` SHA256 matches the local build
  and contains Browse rules. Production assets include local Jost/Prompt WOFF2.
- Production browser at 390×844: map390×788; Browse reveals About; Escape
  closes it; Enter on Rattanakosin Island updates the iframe on this origin,
  closes the index and restores focus to Index. Thai switch changes the index
  label, and switching back works. At1280×900 map972.8×732.07 (61.8%).
- Settled production screenshots saved to `/tmp/bkkx-msh-live-phone.png` and
  `/tmp/bkkx-msh-live-desktop.png`; geography visibly renders. Overlapping
  landmark marker labels remain a separate cartographic readability issue.
- CI run40153327811: build, generated-file cleanliness, typecheck, lint, repo
  guards, both Node suites and world geometry passed; world-pipeline writes
  were still running at this receipt. Final status must be checked separately.
- Temporary preview process stopped; no local development databases were erased.
  Only the pre-existing untracked PBF remains outside version control.
