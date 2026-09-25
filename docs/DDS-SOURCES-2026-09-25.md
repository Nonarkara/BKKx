# Bangkok DDS integration, 25 September 2026

The two dashboard URLs supplied by Dr Non are public ArcGIS applications.
One appeared twice in the request; it is ingested once. Their application
definitions resolve to web maps `13024e04857944849f19b5b9433f2938` (drainage)
and `5cc34e58df5a4a989e27c50ed34dea6d` (risk).

## Delivered contract

`/drainage/` in BKKx and FloodDash serves the same portable map, search and tide
table. All GIS layers are **reference** snapshots, refreshed by explicitly
running `node scripts/import-dds-drainage.mjs`. The manifest records retrieval
time, upstream layer edit time, expected/accepted/rejected counts and SHA-256.
Dates describe a dataset edit, not a sensor observation. All counts are fetched,
not inferred from service names. Identity-based batches avoid truncated ArcGIS
queries; failure preserves the previous manifest. Geometry is EPSG:4326 and
generalised to approximately one metre for the web map. Staff names and phone
numbers are excluded by a field allowlist. No credentials required.

The added 2025 risk layer is deliberately excluded: its first feature's geometry
and x/y attributes disagree, and overlap with the consolidated risk inventory
has not been resolved. The core layer retains the agency geometry.

`0006030_1.pdf` is the Navy's 2026 high/low tide table at Royal Thai Navy HQ:
12 pages, 365 days. `pdftotext -layout` followed by
`node scripts/import-dds-tides.mjs INPUT.txt OUTPUT.json` yields the table.
The printed September page was visually checked. Units are metres relative to
mean sea level; time is Bangkok. These are astronomical predictions excluding
rainfall and dam releases, with absent events kept absent. Outside 2026 the UI
shows no prediction. An unavailable tide download does not erase the map.

The Drive file `1QqLbpWbZudTgxWEr0zo1peSI5osU5iML` is a 374-page canal/drain
inventory: page 2 reports 1,980 waterways (1,210 canals and 770 smaller channels),
2,744,923 metres total. The survey date could not be established. Its counts
are not interchangeable with GIS segment counts. It remains a cited document;
garbled extracted Thai is not used to place map features. Retention-basin
capacity figures are not presented as current storage.

The DDS datacenter landing page is a login form. No public API was established,
and no access bypass was attempted. DDS `index2.php` is linked as the source of
official news and notices. Neither is labelled an active sensor feed.

## Sources

- https://dds.bangkok.go.th/public_content/files/001/0006030_1.pdf
- https://datacenter.dds.bangkok.go.th/
- https://drive.google.com/file/d/1QqLbpWbZudTgxWEr0zo1peSI5osU5iML/view
- https://bmasedgis.bangkok.go.th/portal/apps/dashboards/e76fe4f3a9884565ac65dd80d43a9287
- https://bmasedgis.bangkok.go.th/portal/apps/dashboards/a3d8a9fa438f4e219d56a3be16fcce5e
- https://dds.bangkok.go.th/index2.php

Agency GIS services do not state an explicit reuse licence. Public accessibility
is not described as an open licence. Citation and that limitation remain visible.

## Display design

Civic register: a field guide for Bangkok waterways, derived from the Navy's
printed tide table. The map dominates; record search sits beside it. One amber
accent marks selection, 2px section rules separate tasks, 1px rules separate
records. TH/EN controls and a complete list remain available if map tiles fail.
