# DDS briefing

One ingestion pipeline serves `/api/dds/briefing`; BKKx and FloodDash share the
portable `/drainage/` reader. Existing maps, forecasts and incident layers stay
unchanged. Reports never assert present passability or trigger flood alerts.

- `https://dds.bangkok.go.th/flood_report.php`: checked every 15 minutes;
  parse dated sections, validate accepted rows against the published total,
  retain ranges and missing clearance. A clearance before the start clock rolls
  into the next day. No guessed coordinates or duplicate gauge ingestion.
- `https://dds.bangkok.go.th/public_content/files/001/0004901_1.pdf`: extract
  the ten morning canal readings and their published critical thresholds.
  Uses local Poppler `pdftotext`, configurable via `PDFTOTEXT_BIN`.
  The observed time is 07:00 Bangkok, not the retrieval time. A changed template
  fails validation and retains the previous snapshot. PDF rainfall values can
  disagree across sections; they are not blended with telemetry.
- Existing `thaiwater_rain` station records supply Bangkok measurements.
- Each source can fail independently. KV retains last-good snapshots, with
  explicit errors and stale flags after a failed poll, 30 minutes without
  retrieval, or a report more than 36 hours past its dated 07:00 reference.
- Radar is link-only. DDS prohibits commercial use and warns of non-rain echoes.
  Monthly charts and daily peak/rainfall images are contextual source links,
  never live measurements. There is no automatic OCR of their changing text.

Design read: extend the existing Civic field guide with an annotated incident
register below the map. Reference: the DDS road ledger, with its wide columns
reflowed into labelled rows. Map and tide table remain intact; 2px section and
1px record rules retain their roles. Record lists are bounded and searchable.

Verification: `node --test tests/ddsBriefing.test.mjs`, full `npm test`, API and
browser checks on both published hosts. No data is labelled an official warning.
