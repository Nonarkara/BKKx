# Building the Grand Palace with Arnis — and where Arnis stops

Research note, 2026-09-01. Sources read: the [louis-e/arnis](https://github.com/louis-e/arnis)
source tree at the September 2026 tip (`src/element_processing/buildings.rs`,
`src/landmarks.rs`, `src/models_3d/*`, `src/args.rs`, `taginfo.json`) and the
project [wiki](https://github.com/louis-e/arnis/wiki). Apache-2.0.

The question was: can Arnis build a Grand Palace compound, plus shophouses and
temples that look distinctive rather than boxy? The short answer is **yes for
the city, no for the monuments — and BKKx already holds better monument data
than Arnis could ever infer.** That last part is the finding worth acting on.

---

## 1. What Arnis actually is

A Rust program that reads OpenStreetMap plus elevation data and writes a
Minecraft **Java 1.17+ or Bedrock** world. GUI by default; the CLI is:

```
cargo run --release --no-default-features -- \
  --output-dir="…/.minecraft/saves/BKKx-Historic-Core" \
  --bbox="13.737134,100.478897,13.766063,100.510225"
```

That bbox is BKKx's own Historic Core world, read from
`site/public/heritage-register.json`. Ratchathewi is
`13.7478553,100.5190372,13.7743399,100.5649221`.

Flags that matter here:

| Flag | Effect |
| --- | --- |
| `--mode geo-terrain` | default — OSM objects on real elevation |
| `--mode geo-only` | OSM objects on flat ground |
| `--mode terrain-only` | terrain alone; skips the OSM query entirely |
| `--scale` | blocks per metre, `0.05`–`4.0`, default `1.0` |
| `--interior` | generate building interiors (off by default) |
| `--fillground` | fill under the world instead of leaving voids |

Scale is a real constraint, not a preference. Below `0.3`
(`OBJECT_SKIP_SCALE` in `src/args.rs`) road half-widths floor at one block and
objects stop being representable; above `4.0` a single square kilometre already
costs gigabytes and hours. **BKKx's 1 block = 1 m convention is Arnis's
default**, so the two already agree.

---

## 2. Four fidelity tiers, and only one of them is not a box

This is the part that decides the Grand Palace. Arnis has four separate paths
to a building, in ascending fidelity:

**Tier 1 — extruded footprint (the default, and what "boxy" means).**
`buildings.rs` walls the OSM polygon and caps it. Height comes from `height` or
`building:levels`, materials from `building:material`. Roof form comes from
`roof:shape`, and Arnis parses twelve values: `gabled`, `hipped`, `half-hipped`,
`gambrel`, `mansard`, `round`, `skillion`, `pyramidal`, `dome`, `onion`, `cone`,
`flat`. Everything else falls back to flat or an auto-gable.

**Tier 2 — typology palettes.** `building=temple|church|mosque|synagogue` or
`amenity=place_of_worship` selects a `Religious` classification with its own
material palette (`buildings.rs:371`, `placement.rs:468`). This changes the
*colour and materials*, not the silhouette. A Thai ubosot tagged this way
becomes a nicely-coloured box.

**Tier 3 — fetched 3D models, voxelised.** `src/models_3d/` will pull a glTF
from [3dmr.eu](https://3dmr.eu) when an element carries `3dmr=<id>`, or an STL
from a Wikidata `P4896` (3D model) property, voxelise it and place it on
sampled ground. This is the general escape hatch from boxes — **if a model
exists**, which for Thai monuments it generally does not.

**Tier 4 — bundled landmark schematics.** `src/landmarks.rs` matches a building
by **Wikidata QID** and replaces it wholesale with a hand-built, gzipped Sponge
`.schem` at one block per metre, anchored to a published lat/lon, with
controls for ground offset, interior carve-out and how much surrounding OSM
fabric to suppress. Four landmarks ship today, all Munich Olympiapark
(`Q131610`, `Q48849`, `Q3882013`, `Q599148`).

> Tier 4 is how a landmark stops looking generated. It is also the only tier
> that requires **compiling a fork** — the schematics are `include_bytes!`d
> into the binary, so adding one means patching `landmarks.rs` and rebuilding.

---

## 3. Why Thai architecture comes out boxy, specifically

Not a bug in Arnis — a vocabulary gap in OSM's own roof taxonomy.

- **No stacked gable.** The defining Thai temple roof is a multi-tier gable
  (จั่วซ้อน), two or three overlapping pitches descending in steps, with `chofa`
  finials at the ridge ends. `roof:shape` has no value for it. Tagged
  `gabled`, a viharn gets one plain pitch and loses the thing that makes it
  read as Thai from any distance.
- **A prang is not a roof.** Wat Arun's central prang is a corn-cob tower
  ~82 m tall. It is not a roof shape at all, so no `roof:shape` value can
  produce it. `onion` and `cone` are the closest and both are wrong.
- **A chedi is not a roof either.** The bell-and-spire stack is a solid form
  with no wall/roof distinction to extrude.
- **Gilding has no tag.** `building:colour` exists, but the gold-leaf-over-
  lacquer of a mondop is a material Minecraft can approximate (gold block,
  yellow terracotta, polished blocks) and OSM cannot express.
- **Shophouses are usually untagged.** Bangkok's `ตึกแถว` are rarely tagged
  `building=terrace`; most are `building=yes` with no `building:levels`, so
  Arnis falls back to a generic default and the whole fabric flattens to one
  height. That erases the exact rhythm — 4 m module, firewall every 5 units,
  10-unit row cap — that BKKx's shophouse work is about.

---

## 4. The finding: BKKx already holds better monument data than OSM

`site/scripts/build-hero-monuments.py` writes
`site/public/data/bkk-hero-monuments.geojson`: **67 stacked parts** across Wat
Arun's prang group (23), the Grand Palace's Phra Mondop (8), Siratana Chedi
(7) and Thepbidorn (5), and Wat Pho's four great chedis (6 each).

Every part already carries exactly what a voxel build needs:

| Field | What it gives a builder |
| --- | --- |
| `geometry` | the real footprint polygon, scaled per tier |
| `base_height` / `height` | the vertical slab this part occupies, in metres |
| `material_color` | the intended tone (`#d9b75e`, `#ebca6e`, `#dcb445` …) |
| `part_label` | "square plinth", "stepped terrace", "circular drum massing" |
| `height_source` / `height_confidence` | the provenance chain, per part |

That is a tiered solid model — plinth, terrace, drum, spire — which is
precisely the form OSM cannot express and Arnis therefore cannot generate. It
is already computed, already provenance-labelled, and already shipped.

**And the writer exists too.** `scripts/apply-rattanakosin-to-world.py` is an
operator-runnable Python script that reads geojson in block coordinates and
writes blocks straight into `.mca` region files with `amulet-core` — already
used for the moat, the Chao Phraya, nine city gates and two wall forts.

So the two halves of a distinctive Grand Palace are both in this repository
and have simply never been introduced to each other.

---

## 5. The recipe

**The city fabric → Arnis.** Run it for the two world bboxes above at
`--scale 1.0`. It is genuinely good at streets, water, land cover and the
general building mass, and it does elevation properly. Take its output as the
base world.

**The monuments → BKKx's own writer.** The first half of this now exists:
`scripts/build-hero-monument-blocks.py` turns the massing into a placement
plan, and `scripts/test-build-hero-monument-blocks.py` checks it. It:

1. reads `bkk-hero-monuments.geojson`,
2. projects each part's polygon with the same transform
   `build-heritage-register.py` uses — verified against the **105 register
   monuments already committed with block coordinates**, 96 of which it
   reproduces exactly and none by more than one block (the residual is the
   register storing lat/lon at six decimal places, not a different projection),
3. scanline-fills each footprint into row spans and fills `base_height` to
   `height` with a block chosen by an explicit hue-and-lightness rule, with the
   full 32-colour → family → block table written into the output and pinned by
   the test, so every assignment is reviewable,
4. records a **per-hero bounding box** so the applier can clear the generated
   box underneath first, the same way `landmarks.rs` suppresses OSM fabric
   under a schematic,
5. and refuses any part whose `height_confidence` is missing, so the world
   cannot contain massing the register cannot defend.

The plan today: **67 parts, 78,399 blocks**, ground plane y=64 — the
same frame the moat surface (y=63) and the gate markers (y=64) already use.
The Phra Mondop comes out as a seven-tier stepped spire alternating gilt and
green glazed tile, tapering from 2,496 blocks at the body to 16 at the finial.
That is precisely the form `roof:shape` has no value for, and it fell out of
data that was already in the repository.

Two finials — the Siratana Chedi's at 0.94 m across — are genuinely narrower
than one block. They are snapped to a single column rather than dropped, since
dropping them blunts the spire they tip, and the plan marks them
`snappedToOneColumn` so the block reads as a placement and not a measurement.

**What is left is the applier**: a thin amulet-core loop over
`bkk-hero-monument-blocks.json` that clears each `heroBounds` box and writes
the spans. That half needs a world file and so belongs on your machine, not in
CI — which is exactly why the arithmetic was split out to where it could be
tested.

Point 5 matters: the atlas's Evidence mode already grades these parts
(`official-envelope` 7, `interpretive-proportion` 16, `interpretive-envelope`
44). The Minecraft build should inherit that grading rather than quietly
flattening it — a world that shows the Fine Arts Department's published 82 m
envelope and a BKKx-curated silhouette as the same kind of fact is a world
that lies more confidently than the map does.

**The shophouses → the screened set, not OSM.**
`bangkok-rowhouse-footprint-candidates.geojson` holds 2,433 screened
footprints with measured frontage and depth per building, and
`shophouse-spine-index.ts` holds storeys for 1/3 of them plus the binding
regulation clauses. Building the rows from that gives the real 4 m module and
the real row breaks. Where storeys are null, leave them null and use one
stated default — the spine already names storeys as missing data rather than
estimating it, and the world should not invent what the dataset refuses to.

**If you would rather stay inside Arnis**, the Tier 4 route is legitimate:
fork it, build a `.schem` per monument, and register it in `landmarks.rs`
keyed by QID. Confirmed QIDs: **Grand Palace `Q873769`**, **Wat Pho
`Q1059910`**. Wat Arun's could not be confirmed from here — search returned
`Q15735659`, which appears to be the *subdistrict* rather than the temple, so
it needs checking on the object itself before anyone keys a model to it. The
cost is maintaining a Rust fork against upstream; the benefit is that anyone
running your fork gets the monuments automatically.

---

## 6. What this note does not establish

- **Nothing here was run.** `arnismc.com`, `live.iticfoundation.org` and
  `youtube.com` are all blocked by this environment's egress proxy; the source
  and wiki were read through the git proxy instead. No Arnis build was
  executed and no world was generated, so the flags above are read from
  `src/args.rs`, not observed.
- **Bedrock output is claimed by the README, not tested here.**
- **The `.schem` authoring workflow is unexamined.** `landmarks.rs` documents
  the placement fields precisely, but how the four bundled Munich schematics
  were *authored* is not in the repository.
- **Licence, if you fork:** Arnis is Apache-2.0, with
  `src/luanti_block_map.rs` derived from MC2MT under LGPL-2.1-or-later. A
  fork carrying BKKx monument schematics inherits both.
