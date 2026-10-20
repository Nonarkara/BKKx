# Maintenance and spatial audit — 21 October 2026

Scope: BKKx heritage front door and the sibling operational Atlas. Reports from
other agents are leads, not proof. No flood model, report geometry, or hydraulic
obstacle was changed.

## Reproduced failures and changes

1. **Heritage map blank.** Live console threw `reading 'Map'`. The deployed
   chunk exposed named exports; AtlasView assumed a default export. The loader
   now checks either shape. A unit regression covers both.
2. **Undeclared runtime upgrade.** The installed MapLibre was 6.11.2 while
   package.json and the lockfile pin 4.7.1. After recovering the constructor,
   the 6.x module worker failed because its adjacent worker asset was not
   packaged. Restore dependencies with `npm ci`, not a manual upgrade. A
   prebuild `npm ls --depth=0` now rejects installed top-level dependencies
   outside their declared ranges before bundling; it is not a full lockfile
   parity test.
3. **Phone map below the directory.** At 390px the masthead, wrapped navigation,
   metric strip and directory consumed most of the first screen. The map is
   now before the directory; the masthead is compact, secondary introduction
   is hidden on phones, and navigation remains one scrollable strip with a
   visible native scrollbar. All directory entries remain below the map.
4. **Unnecessary card chrome.** The rowhouse rail wrapped every entry in a
   rounded box and gave the active entry a shadow. It is now a ruled list;
   photographs remain beside their titles and evidence. Low-contrast lime
   callout labels on paper now inherit the readable callout colour.
5. **Atlas matrix mismatch.** The sibling's massing and wireframe layers
   preferred a raw perspective matrix over the normalized-Mercator custom-layer
   matrix. The vendored 6.4.1 source does contain
   `defaultProjectionData.mainMatrix`; the previous absence claim was false.
   Both renderers now use one tested contract, without incompatible fallbacks.
6. **News provenance overstatement.** Atlas displayed an aggregator result
   referring to a 2017 event as a fresh trusted headline. The feed is now
   labelled search results, without trust badges. Feed age is distinguished
   from event age; readers must verify publisher, date and place. This does not
   repair the upstream search index or validate its keyword severity labels.

## Landmark detail

Atlas Wat Arun doubles radial subdivisions of the existing schematic prang
profile. Bounds and 70m model height stay unchanged; phone geometry remains
lighter than desktop. This improves curve resolution, not survey accuracy.
The existing Commons reference and credit remain attached to the model.

No roof plant, ornament, facade texture, or source dimension was invented.
The Grand Palace stand-in remains explicitly schematic. A true multi-view
reconstruction still requires suitable licensed photographs and manual review.

## Design verdict

This is a bounded repair, not a claim that either product is free of design
slop. Remaining review: Atlas desktop sidebar weight, overly long research
navigation, map control density, and source-age explanations in expanded
boards. Preserve the maps and evidence while reducing chrome. Do not hide
unreliable data behind reassuring visual treatment.

Primary rendering contract: [MapLibre custom-layer input](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CustomRenderMethodInput/).

## Closeout / concrete blocker

- Atlas `55af1f6`, stamped `0255b2b`: deployed; 112 tests, 34 live smoke
  checks, and visual Old Town rendering verified. Screenshots precede the news
  wording change and must not be used as proof of that change.
- Heritage `05bee41`: deployed namespace-loader and phone-order changes;
  constructor failure resolved, but live verification exposed the undeclared
  6.11.2 worker failure. This is **not** a verified recovered map.
- Subsequent heritage list/build checks and Atlas news wording are saved in
  Git but not fully released. The host reported load averages around 190;
  clean installation was CPU-starved for more than 12 minutes. Interrupted
  install files were retained at `/tmp/bkkx-node-modules-recovery-20261021`.
- The second Atlas gate stopped on 4 phone-harness subprocess deadline failures
  (108/112 passed). No deadlines were weakened to manufacture a green result.
- Resume with reduced host contention: `cd site && npm ci --no-audit`, run
  typecheck, lint and full tests, build and deploy `bkkx-site`, then verify
  actual tiles/buildings and phone layout. Re-run Atlas release gates for the
  committed news wording. Dependency installation is currently incomplete.
