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
`site/public/data/bkk-hero-monuments.geojson`: **88 stacked parts** across Wat
Arun's prang group (23), the Grand Palace's Phra Mondop (8), Siratana Chedi
(7) and Thepbidorn (5), Wat Pho's four great chedis (6 each), Loha Prasat,
the palace prasats and the Golden Mount chedi.

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

The plan today is rebuilt by `scripts/build-hero-monument-blocks.py` —
stacked parts on a ground plane of y=−61, the first air block above the
−62 surface Arnis generates a superflat at. For a long time every plan in
the repository said y=64, Minecraft's sea level, which for this world is
about 125 blocks up in the air; `AUDIT-2026-09-06.md` §4.1 has the evidence.
The number in the plan is still an assumption with its source stated: every
applier now probes the world for its ground (`scripts/mc_ground.py`) and
re-bases the plan onto what it measures before writing a block.
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

**The shophouses → the screened set, not OSM.** Built as
`scripts/build-shophouse-fabric.py` (Dr Non + Cursor, `feat/shophouse-fabric`),
with `scripts/test-build-shophouse-fabric.py` checking it and
`scripts/apply-shophouse-fabric-to-world.py` writing it. An earlier, flatter
builder of mine — three bands per footprint, no module — was retired in favour
of it on 2026-09-06; the counts below are the fabric plan's own.

**1,824 of the 2,433 screened footprints, 1,397,837 blocks.** 608 lie outside
this world and are counted rather than dropped; one is refused for a frontage
under 2 m and named.

The module is the law, not a survey. `n_bays = floor(frontage / 4 m)`, so a
7.9 m unit stays one bay rather than becoming two illegal ones — 2,527 bays in
all. A firewall lands on the right edge of every fifth bay along a
neighbour-joined run (239 of them, MR55 ข้อ 17). Rows over the 10-unit / 40 m
cap (ข้อ 4) are tagged, not broken: 780 of them, and the plan shows what
stands. Height comes from the statute — ข้อ 22(4): ground ≥ 3.50 m, every
floor above ≥ 3.00 m — so every metre traces to a clause. Shop openings, a 1 m
awning, windows, a rear courtyard on plots deeper than 16 m (ข้อ 2) and a stair
shaft are cut as typological rhythm, and are stated as such: the plan does not
know where any actual door is.

The honesty is in the grading. **595 footprints carry a storey count from
Overture and 1,229 do not**; the latter default to two and are graded
`interpretive-storeys` rather than `overture-storeys`, so the two are never
the same kind of fact and `--min-confidence overture-storeys` builds only the
595. Skirt is zero — adjacent shophouses share a party wall — and 6,306 hero
columns are punched out so the fabric never writes into a monument; the Grand
Palace bbox is not, because that bbox contains buildings that are not the
Grand Palace.

The scanline and projection live in `scripts/mc_blocks.py`, shared with the
hero builder, so a fencepost fix cannot land in the monuments and miss the
shophouses.

**If you would rather stay inside Arnis**, the Tier 4 route is legitimate:
fork it, build a `.schem` per monument, and register it in `landmarks.rs`
keyed by QID. Confirmed QIDs: **Grand Palace `Q873769`**, **Wat Pho
`Q1059910`**. Wat Arun's could not be confirmed from here — search returned
`Q15735659`, which appears to be the *subdistrict* rather than the temple, so
it needs checking on the object itself before anyone keys a model to it. The
cost is maintaining a Rust fork against upstream; the benefit is that anyone
running your fork gets the monuments automatically.

---

## 6. Running it, and knowing that it ran

`worlds/` holds manifests, not saves, so for a long time there was no world in
this repository to write into and the appliers had never been executed against
one at all — every test checked the arithmetic that produces a plan, which is
a different claim from *the blocks are in a world*.

`scripts/make-fixture-world.py` closes that. It builds a small superflat world
in this repository's own block frame — Java 1.21.4, surface at y=−62 where
Arnis puts these worlds, chunks only over the footprint you ask for. A
monument's fixture is four chunks and about 110 KB:

```
python3 scripts/make-fixture-world.py --out /tmp/w --hero grand-palace-siratana-chedi
python3 scripts/apply-hero-monuments-to-world.py --world /tmp/w --hero grand-palace-siratana-chedi
```

which prints, in this order, the three things that used to be assumed:

```
ground: probed: surface y=-62 in 100% of 60 sampled columns (0 missing)
        -> ground plane y=-61; plan said -61
world bounds: y -64..319 — the plan's y -61..-20 fits
cleared 11,046 · wrote 3,374 · failed 0 · 11,046 distinct cells
verified 240/240 sampled blocks on disk (wrong 0, missing 0)
```

**The ground is measured, not assumed.** The applier probes the columns
*around* the plan — not the whole world, whose far corner may be ungenerated,
and not the footprint itself, where whatever the generator already built is
standing — takes the modal surface, and re-bases every y onto it.

**The world is checked before it is written.** A plan outside the world's
declared height is refused. This is not caution for its own sake: amulet
*accepts* a write outside those bounds and drops the sub-chunk on save, so
without the check the applier reports every block written into a world that
receives none. A world whose `level.dat` does not declare its height reads as
the pre-1.18 y=0..255, and at y=−61 that is every block.

**The blocks are read back.** After saving, the applier reopens the world and
reads a 240-block sample: a count of API calls that did not raise is not
evidence that a world contains anything. `scripts/test-apply-to-fixture-world.py`
does the same in CI and additionally reads the Siratana Chedi's profile out of
the world to check it tapers — 195, 151, 100, 60, 17, 4, 1 blocks per course,
plinth to finial, standing on the stone.

---

## 7. What this note does not establish

- **No Arnis build was run.** `arnismc.com`, `live.iticfoundation.org` and
  `youtube.com` are all blocked by this environment's egress proxy; the source
  and wiki were read through the git proxy instead. The flags above are read
  from `src/args.rs`, not observed, and no Arnis-generated world exists here.
  §6's fixture world is built by this repository to the frame the manifest
  records — it is the right shape to test against, and it is not the real
  world. The first write into the real save should still be one monument, and
  somebody should stand next to it.
- **Bedrock output is claimed by the README, not tested here.**
- **The `.schem` authoring workflow is unexamined.** `landmarks.rs` documents
  the placement fields precisely, but how the four bundled Munich schematics
  were *authored* is not in the repository.
- **Licence, if you fork:** Arnis is Apache-2.0, with
  `src/luanti_block_map.rs` derived from MC2MT under LGPL-2.1-or-later. A
  fork carrying BKKx monument schematics inherits both.
