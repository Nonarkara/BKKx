# Rattanakosin Phase 1 — Operator Guide

The moat, river, surviving city gates, and surviving wall forts for
the BKKx Rattanakosin Minecraft world. Self-service pipeline.

## What this produces

Four files in `site/public/data/`:

| File | What | Records |
| --- | --- | --- |
| `rattanakosin-water.geojson` | Moat + Chao Phraya river as line fragments in block coords | 10 moat fragments, 16 river fragments, clipped to world bbox |
| `rattanakosin-gates.geojson` | 9 surviving city gates as point features | 9/9, all inside world bbox |
| `rattanakosin-forts.geojson` | 2 surviving wall forts as polygon features | 2/2, with vertex lists |
| `rattanakosin-water-and-walls.meta.json` | Provenance + counts | version, source URLs, world projection |

Plus one operator-maintained file:

| File | What |
| --- | --- |
| `site/public/data/known-rattanakosin-gates.json` | Positions for the 8 Rattanakosin gates that OSM does not carry as `historic=city_gate` |

## How to run

```bash
# 1. Run the build (one round trip to Overpass, takes 5–10 s)
python3 scripts/build-rattanakosin-water-and-walls.py

# 2. Run the self-test (no network, runs in < 1 s)
python3 scripts/test-build-rattanakosin-water-and-walls.py
```

Output:

```
Rattanakosin Phase 1 — water, walls, gates, forts
  World: 3384 × 3217 blocks at 1:1

[1/4] Fetching waterways from Overpass...
  moat fragments: 10
  river fragments: 16
[2/4] Fetching city gates from Overpass + operator file...
  OSM hits: 0
  Operator-known: 9
  ✓ Pratu Phi, Pratu Suan Mali, ... (all 9)
[3/4] Fetching wall forts from Overpass...
  ✓ Pom Phra Sumen (NW corner), Pom Mahakan (SE corner)
[4/4] Writing provenance meta...
Done.
```

## How to refresh

Re-run the build script whenever:
- OpenStreetMap data for the Rattanakosin area changes (anytime, no schedule)
- The operator file `known-rattanakosin-gates.json` is updated
- A new research paper refines any of the gate / fort positions
- The world projection changes (the `metadata.json` in the world zip)

The build script is idempotent. Re-running it produces byte-identical
geojson except for the `version` field.

## How to add a new gate

If new research refines a gate position (or adds a new surviving
gate), edit `site/public/data/known-rattanakosin-gates.json`:

```json
{
  "Pratu Phi": {
    "lon": 100.4965,
    "lat": 13.7610,
    "source": "1926 Ratcha-anusorn plan + Wikipedia 'Pratu Phi'",
    "source_url": "https://en.wikipedia.org/wiki/Pratu_Phi",
    "notes": "Ghost Gate, north wall, west of Sanam Luang."
  }
}
```

Required fields: `lon`, `lat`, `source`. Optional: `source_url`, `notes`.

Then re-run the build script. The new position will be projected to
block coordinates and written to the gates file.

## How the data flows to the world

The world builder (not in this repo) reads:

1. `rattanakosin-water.geojson` → buffer moat by ~12 m, river by
   ~400 m, place water blocks (the buffer widths come from the
   heritage register's `khlongWidth` and `riverWidth` fields when
   available)
2. `rattanakosin-gates.geojson` → place a 1×1×3 block "marker" at
   each gate (or a real gate building, depending on what the
   heritage register has)
3. `rattanakosin-forts.geojson` → extrude each vertex polygon
   from y=0 to y=8 (8 m fort walls), filled with brick

This script does **not** place blocks. It produces the data the world
gen consumes. The world gen is the next script to write.

## Known caveats

- The moat is in OSM as 10 disconnected line fragments totaling 46
  vertices. To make water, the world gen has to either buffer each
  fragment individually, or first assemble them into a closed
  polygon (the user can do this with `shapely.ops.unary_union`).
- The Chao Phraya river has 16 fragments totaling 68 vertices after
  bbox clipping. Same caveat.
- The gate positions in the operator file are public-domain
  Ratcha-anusorn 1926 plan + Wikipedia references. They are
  approximate to ± 20 m. Refine as new research refines.
- Pom Phra Sumen and Pom Mahakan are extracted from OSM with
  their full vertex lists (9 and 11 vertices respectively). The
  OSM polygons are accurate to the published archaeological
  survey.
- The world projection is local (linear lon/lat → block), not
  UTM. This is correct for the world as built, but means
  block-to-WGS84 conversion must use the same linear formula.
- The OSM `historic=city_gate` query initially returned a
  false positive — the "Pratu Phi" name matched a noodle restaurant
  (Wu Yentafo). The build script filters out amenities, cafes,
  restaurants and shops. If you see a known gate still being
  rejected, check the override file.

## Tests

```bash
python3 scripts/test-build-rattanakosin-water-and-walls.py
```

18 checks across:
- Projection regression (corners + Grand Palace + Wat Pho + Wat Arun spot checks)
- Bbox clipping (in / out / partial cases)
- Operator-override integrity (every entry inside world bbox)
- Generated artifact integrity (every geojson has version, sources, scale)

## Files touched

| File | Action |
| --- | --- |
| `scripts/build-rattanakosin-water-and-walls.py` | new (537 lines) |
| `scripts/test-build-rattanakosin-water-and-walls.py` | new (135 lines) |
| `site/public/data/rattanakosin-water.geojson` | generated |
| `site/public/data/rattanakosin-gates.geojson` | generated |
| `site/public/data/rattanakosin-forts.geojson` | generated |
| `site/public/data/rattanakosin-water-and-walls.meta.json` | generated |
| `site/public/data/known-rattanakosin-gates.json` | new (operator file) |
| `docs/rattanakosin-phase1-operator.md` | this file |
