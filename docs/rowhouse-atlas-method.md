# Bangkok Rowhouse Atlas — mapping method

This is a cultural exploration dataset, designed to make Bangkok's ordinary urban heritage legible without
pretending that incomplete evidence is cadastral certainty. The canonical source is
[`site/app/data/oldtown-spots.ts`](../site/app/data/oldtown-spots.ts); `npm run data:rowhouses` exports the public
GeoJSON used outside the application.

## What one record means

Each of the 22 records represents a documented rowhouse ensemble or cultural corridor, not a single building.
It combines:

- an explorer anchor (`Point`) for navigation and map inspection;
- a cultural corridor (`LineString`) showing the street, canal edge or documented block extent to read on foot;
- an institutional, scholarly or conservation source;
- typology, period, evidence class and a short field-reading prompt;
- a geometry method and confidence level.

The public file contains 44 features: one point and one line for every record. Record slugs join the two.

## Evidence classes

| Class | Meaning |
| --- | --- |
| `registered` | The ensemble or an associated building appears in the Fine Arts Department register or another named heritage register. |
| `published inventory` | A scholarly or institutional source identifies or counts the ensemble. |
| `mapped corridor` | Published cultural evidence establishes the place, while BKKx curates its explorer-facing extent. |

These classes describe documentary evidence, not physical condition or legal protection.

## Geometry methods

| Method | Meaning |
| --- | --- |
| `OSM street axis` | The line follows the relevant OpenStreetMap street axis through the documented ensemble. |
| `documented block extent` | The line joins documented edges or anchors of a known ensemble. |
| `curated connection` | The line is an interpretive link between documented anchors and must be treated as provisional. |

`high` confidence is rendered as a solid line. `medium` and `low` confidence are dashed. Geometry confidence is
separate from evidence class: a well-documented community may still have an interpretive line until its
individual buildings are surveyed.

## What the data does not claim

The lines are not building footprints, land parcels, statutory conservation zones, property boundaries or a
complete inventory of Bangkok rowhouses. They must not be used for regulation, height control, ownership,
valuation or demolition decisions. The map is an orientation and research layer.

## Building-footprint review queue

`bangkok-rowhouse-footprint-candidates.geojson` adds one deliberately separate layer: present-day Overture Maps
building roofprints/footprints near the sourced corridors, ranked for human review. It is opt-in in the 3D map.
Every polygon retains its Overture/GERS ID and release, joins to one corridor slug, and publishes the factors that
caused it to surface:

- distance from the documented corridor (within 58 metres);
- narrow/deep footprint shape;
- similarly aligned neighbours within 32 metres;
- plausible footprint area.

Morphology is calibrated against the 1988 study *A Study on the Composition of Shophouses in the Central Part of
Bangkok*, which measured 14,421 units and reported a 3.80 m mean frontage and 2.93 mean depth-to-width ratio.
Those aggregate figures calibrate shape only. They do not date, identify or confer value on any current building.

The output is **not** a set of confirmed rowhouses, age estimates, cadastral parcels, statutory conservation zones
or heritage designations. A high score means “inspect this shape first,” never “protect this building on the
algorithm's authority.” Archival research, façade inspection and community review remain mandatory.

## Rebuilding the public file

```bash
cd site
npm run data:rowhouses
npm run data:rowhouse-footprints
```

The first command writes `site/public/data/bangkok-rowhouse-atlas.geojson`. The second fetches the current Overture
building release and writes `site/public/data/bangkok-rowhouse-footprint-candidates.geojson` plus the small summary
consumed by the interface. The ordinary site build refreshes the corridor export but does not make a multi-gigabyte
remote Overture query; maintainers run the candidate command intentionally when corridors or source releases change.
Tests verify feature counts, geometry validity, source links, confidence fields and candidate caveats.

## Licence and attribution

BKKx curation and generated morphology metrics are CC BY 4.0. Underlying OpenStreetMap geometry remains ODbL and
requires OpenStreetMap attribution. Overture features retain the source references and licences shipped with each
record under the Overture Data License. Institutional and scholarly evidence is linked per feature; those sources retain their own rights.
Photographs are licensed and attributed separately in the site's photo metadata.

## Next evidence threshold

A nomination-grade or regulatory atlas needs one polygon per surviving building, frontage width, storey count,
age band, alteration and condition, current use, occupancy/tenure where ethically collectable, linked archival
photographs, and an audit trail for every change. Satellite and machine classification can propose candidates;
street-level inspection, archival evidence and community review must confirm them.
