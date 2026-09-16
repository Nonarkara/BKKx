# Row-strip audit — the diagonal boxes

2026-09-16. Prompt: boxes render as diagonals where the ground truth is
normal grid rectangles. Method: every one of the 9,275 detail-layer
footprints measured (polygon area vs bounding-box area, edge-heading
histogram, segment-intersection scan), then judged against the street, not
against cardinal north — a shophouse row follows its soi, and the old town's
sois run diagonal.

## What the scan found

- **0 self-intersecting rings.** No bowtie geometry; MapLibre triangulates
  everything defined.
- **1 degenerate sliver**, hidden by `data:strips` (`row-strip:sliver`):
  `bkk-building-1524815659` — building=roof, 44 vertices, 737 m² of polygon
  inside a 122×98 m box. Forty-one edges share one heading; it is a folded
  tracing fragment extruded 9 m as a diagonal shard. Nothing truthful is
  lost: a 737 m² sawtooth at an OSM tag height is not a building record.
- **16 thin whole-row strips, kept.** A whole row traced as one OSM polygon
  (terrace/yes/school) is coarse, not false, and hiding one would leave a
  hole the 2,433 screened candidates do not cover — zero candidate centroids
  fall inside any of these bboxes. The step reports them every build so the
  list cannot silently grow.

## The sixteen, with verdicts

| id | name | type | height | verts | area m² | bbox m | centre |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bkk-building-229783080 | แถวเต๊งกลาง | terrace | 12 type-default | 16 | 4444 | 397x251 | 100.4918,13.7486 |
| bkk-building-88222002 | แถวเต๊งใน | terrace | 12 type-default | 7 | 2874 | 334x37 | 100.4923,13.7480 |
| bkk-building-88222013 | — | yes | 9.0 osm | 11 | 2090 | 241x58 | 100.4916,13.7474 |
| bkk-building-138949999 | ตึกยาว | school | 10 type-default | 12 | 2592 | 69x192 | 100.4987,13.7432 |
| bkk-building-178329986 | ตึกถาวรวัตถุ | yes | 9.0 osm | 37 | 2951 | 62x177 | 100.4917,13.7543 |
| bkk-building-1469737732 | — | yes | 9.0 osm | 7 | 1733 | 61x146 | 100.5036,13.7453 |
| bkk-building-1469737733 | — | yes | 9.0 osm | 5 | 4121 | 70x228 | 100.5042,13.7476 |
| bkk-building-127288701 | อาคารราชวัลลภ | yes | 9.0 osm | 16 | 3410 | 165x60 | 100.4949,13.7470 |
| bkk-building-164002735 | คณะพาณิชยศาสตร์และการบัญชี | university | 12 type-default | 6 | 2663 | 139x63 | 100.4904,13.7563 |
| bkk-building-234366080 | — | school | 10 type-default | 11 | 3377 | 139x86 | 100.5009,13.7577 |
| bkk-building-348393897 | กระทรวงเกษตรและสหกรณ์ | yes | 9.0 osm | 5 | 2353 | 68x121 | 100.5069,13.7594 |
| bkk-building-348393898 | กระทรวงคมนาคม | yes | 9.0 osm | 5 | 2861 | 73x130 | 100.5077,13.7591 |
| bkk-building-461153819 | — | yes | 9.0 osm | 22 | 3215 | 106x116 | 100.4909,13.7461 |
| bkk-building-1185498557 | — | yes | 18.0 osm | 8 | 3347 | 94x104 | 100.5051,13.7453 |
| bkk-building-1526723637 | — | terrace | 12 type-default | 5 | 2660 | 54x174 | 100.5048,13.7500 |
| bkk-building-1526723654 | — | terrace | 12 type-default | 5 | 2327 | 139x67 | 100.5069,13.7500 |

Reading it: the Talad Noi/Song Wat rows (แถวเต๊งกลาง/ใน and neighbours at
13.748, 100.492) and the Sam Phraeng strips (13.745–13.747, 100.504) follow
their diagonal sois — the individual shophouses are grid rectangles aligned
to a diagonal street, and OSM maps the row as one polygon. The ministry and
faculty blocks are single long buildings. All kept, all drawn at their
existing evidence-graded heights.

## What was NOT the cause

- The block builders (`mc_blocks.py`, the fabric and hero plans) add no
  rotation: hero tiers are OSM rings scaled about their centroid, fabric
  massing follows each footprint's own oriented rectangle. A diagonal in the
  world means a diagonal in the source footprint.
- The 73 landmark parts all sit within 40 m of the OSM box they stand on;
  none is misplaced.
- The 705 strongly-diagonal screened candidates are Overture footprints on
  diagonal sois, extruded at the statutory storey height — street-aligned,
  not erroneous.

## Guard

`scripts/flag-row-strips.py` (`data:strips`, after `data:hide`, before
`data:candidates`): hides slivers (polygon < 1,500 m² in a box > 8,000 m² —
thresholds sitting between the 737 m² sliver found and the 1,733 m² thinnest
kept row, not at round numbers), reports the kept strips, fails the build if
a sliver is still drawn. `scripts/test-flag-row-strips.py` (14 checks) pins
it; `hide-under-heroes.py` preserves the `row-strip:` namespace in return.
