# Bangkok — MSH audit and upgrade plan

Date: 2026-10-25 (Asia/Bangkok). Original research and implementation plan;
approved by the user's subsequent “Continue.” See the reconciliation receipt
for implementation and verification, rather than treating baseline values as current.

## Scope and conservation law

`BKKx/site` serves bkk.nonarkara.org (heritage). The separate
`../bkk-3d-atlas` serves atlas.nonarkara.org (operations). Do not merge their
domains, Workers or purposes. Preserve every map, camera wall, source ledger,
heritage record, walk, layer and safety caveat. Leave the untracked
`bbb-buildings.osm.pbf` alone.

Applied: current AGENTS.md and ANTI-SLOP.md; anti-slop-design,
shared-memory-hub, axiom-design-core, planning-discipline and browser-use.
Read HCMC's MSH.md: MSH means Massacre Spatial Hallucination, not a memory acronym.
Recalled three relevant shared-memory lessons before architecture work.

## Observed on the live heritage homepage

Read-only browser inspection; geometry from rendered DOM, screenshots viewed.
Measurements are map iframe rectangles, not unobscured geographic pixels.

| Viewport | Header | Status strip | Sidebar | Map frame | Frame share of viewport |
| --- | --- | --- | --- | --- | --- |
| 1440 × 900 | 113.54 px | 69.84 px | 432 px | 1008 × 716.62 px | 55.7% |
| 1024 × 900 | 157.34 px | 69.84 px | 400 px | 624 × 672.81 px | 45.6% |
| 390 × 844 | 119.70 px | 69.84 px | below map | 673.22 × 523.27 px | invalid: frame wider than viewport |

- At 390 px, shell children measure 673.22 px wide. Navigation, status items
  and map are clipped. `documentElement.scrollWidth > innerWidth` returns false:
  clipping masks the regression. Test element rectangles and reachability too.
- At 1024 px, a 400 px rail and 227 px of top chrome displace the operating
  surface. The legend and attribution then cover more of the remaining map.
- Broad navigation and secondary weather readings receive space before the
  visitor has chosen a heritage place. Collapse secondary material deliberately;
  do not delete it or merely shrink the text.
- Active map controls use several bright fills; evidence categories, selection
  and wayfinding need distinct roles rather than competing equal emphasis.
- The current face is Sao Chingcha, not Inter. Heritage layout also loads IBM
  Plex Sans Thai, JetBrains Mono and Source Serif 4. Axiom's two-family policy
  and the established English essay serif role require an explicit scope choice.

## Operational sibling: limited inspection

At its default 1280 × 720 browser viewport: header 47 px; map 840 × 463 px;
bottom band 210 px. The map frame is 42.2% of the viewport, before overlays.
This is not a full responsive audit of Atlas. Its historical-warning label
correctly says current conditions are unknown. Preserve that distinction.
The news rail already distinguishes feed age from event age; do not present
its keyword labels as official warnings.

## Borrow what earns its place

1. HCMC `public/place-brief-model.js`: separates nearest fixed planning sample
   selection from feed validity; records straight-line facility distances and
   explicitly denies route-safety/facility-opening knowledge. Bangkok already
   has `public/place-briefing.js`; extend its contracts, do not install a duplicate.
2. HCMC `public/flood-briefing-model.js`: complete forecast windows, source tiers,
   stale/future rejection, explicit datum and no additive river-sector claim.
   Port tests/validation patterns only after mapping Bangkok's different schemas.
3. HCMC has a locally vendored font and MapLibre distribution. Prefer reproducible
   font delivery over another runtime CDN dependency. Do not copy its Vietnamese
   material palette or pretend all of its feeds are observations.
4. Current Atlas has new `building-facades.js` and batched façade work in
   `building-massing.js`. Inspect and retain this before considering replacement.
   Procedural detail is not surveyed architecture or photo reconstruction.
5. Current glTF Transform documentation supports inspection, deduplication,
   simplification and texture processing: https://gltf-transform.dev/ .
   Mesh compression/texture conversion are documented at
   https://meshoptimizer.org/gltf/ . These are delivery optimizations, not new
   source detail. Check decoder support and preserve named landmark components.

Jakarta's local checkout was not located in the project-root inventory this
pass. No claim of a fresh Jakarta code comparison is made.

## Proposed first implementation batch — approval required

### Critical choices

- Start in the heritage site, where clipping is reproduced. Audit/repair Atlas
  separately so its flood and camera behavior cannot regress in a shared rewrite.
- Proof Jost for Latin plus Prompt for Thai, using real names, errors, numerals,
  warnings, 200% enlargement and blocked-font fallback. Do not replace map glyph
  fonts blindly. Use tabular figures when supported rather than mono everywhere.
- Preserve Source Serif 4 only in its existing long-form English essay role as
  an explicit scoped third-family exception, or remove it if the director wants
  the two-family limit to be absolute. Recommended: preserve the earned essay.

### Surgical file scope

- `site/app/globals.css`: constrain shell and grid children to available width;
  fix intrinsic track sizing; reduce secondary chrome; compact desktop rail;
  establish typography roles; no global deletion/reset of legacy surfaces.
- `site/app/layout.tsx`: load approved Jost/Prompt cuts and retain the scoped essay
  role; remove redundant face loading only after coverage/fallback tests.
- `site/app/heritage-atlas/HomepageClient.tsx`: deliberate responsive navigation
  disclosure with every existing destination preserved; keyboard/focus behavior.
- `site/app/heritage-atlas/CityGlance.tsx`: progressive disclosure of secondary
  readings, retaining sources, missing states and any warning indication.
- `site/tests/`: regression contracts for navigation reachability and font roles;
  browser geometry must supplement, not be replaced by, source-string checks.

### Verification and release

1. Baseline and after at 390 × 844, 1024 × 900, 1440 × 900. Target >=60% desktop
   first-screen map frame, and record overlay cost separately.
2. Assert shell/map bounds fit viewport, not just document scroll width. Reach
   every navigation/layer control; open secondary panels and warnings.
3. English/Thai, long labels, 200% text, keyboard focus, reduced motion, font
   blocking and failed-data states. No clipping or hidden required actions.
4. Typecheck, lint, relevant tests and build; independent visual review required
   before claiming a design pass. No independent review performed in this audit.
5. Commit/push only scoped changes; deploy heritage Worker only; verify build ID
   and live user flows. A second plan scopes operational/data/model changes.

Planning-discipline requires presenting this plan and stopping for approval
before source edits. Nothing in this report is a claim that changes shipped.
