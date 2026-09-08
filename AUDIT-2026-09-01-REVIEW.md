# BKKx three-branch release audit — 2026-09-01 (review)

Reviewer: Mavis (cross-verification of the Codex audit).
Source of truth: `cdc2828` on `main`, `origin/main`, and `origin/shophouses`.
Method: re-derive every number from the actual files, run the test suite
from the correct cwd, hit the live API, and compare claims to runtime output.

## TL;DR

Codex's release at `cdc2828` is **substantively correct but contains one
hardcoded number that disagrees with the data it claims to summarise**. The
release-gate numbers that matter most — tests, build, live state, the
"blank not zero" runtime fix — all hold. One user-facing figure is off by
122 (5 %) and is repeated in five files; fixing it is a one-line edit per
file plus a rebuild.

The original audit (AUDIT-2026-09-01.md) is good. What follows is what
catches it didn't include: the disagreement, the runtime evidence, and
the concrete commands to re-verify.

## What the original audit gets right

| Claim | Evidence |
|---|---|
| Commit `cdc2828` exists, main/shophouses in sync | `git rev-parse origin/main` = `cdc2828dde1cd93831ba635a2618db17894e4c7d` |
| 571 heritage records | `python3 -c 'import json; print(len(json.load(open("site/public/heritage-register.json"))["sites"]))'` = 571 |
| 9,415 extruded features with the right tier split | `site/app/data/evidence-tally.json`: `official: 7, measured: 5987, curated: 156, inferred: 3265, total: 9415` |
| 32 cluster analyses | `bangkok-rowhouse-atlas.geojson` has 32 unique slugs, each with 2 entries (e.g. commercial-street, market-row) → 64 features, 32 clusters |
| 19 checksummed datasets | `site/app/data/dataset-manifest.json` has 19 top-level keys, every entry with `sha256`, `bytes`, `features`, `kinds` |
| 16-source digital-twin catalogue | `site/app/data/twin-sources.ts` has 16 `id:` entries (terrain × 2, weather × 2, air, population, places × 2, mobility, hazard, imagery, plus 6 more) |
| 80/80 tests pass (when run from `site/`) | `node --test tests/rendered-html.test.mjs` from `site/`: `tests 80, pass 80, fail 0`. **See warning below.** |
| `/api/live/*` returns envelopes without env | curl: `/api/live/cctv` → `{"ok":true,"source":"unconfigured","data":{"cameras":[],"cameraCount":0,"configured":false}}`. `/api/live/fires` → `{"ok":false,"source":"firms...","reason":"No FIRMS_MAP_KEY configured..."}`. `/api/live/weather` → `{"ok":false,"source":"open-meteo.com","reason":"Forecast unavailable... Air quality unavailable..."}` |
| New routes are substantive, not stubs | `datasets/page.tsx` 218 lines, `warroom/page.tsx` 334 + `LiveDeck.tsx` 603, `shophouses/atlas/page.tsx` 222 lines |
| Custom domain serves | `curl -I https://bkk.nonarkara.org/` → HTTP 200, 71,931 bytes |
| Sites preview serves | `curl -I https://bkkx-bangkok-atlas.nonsmartcity.chatgpt.site` → HTTP 200, 72,869 bytes |

## What the original audit got wrong

### The "2,311 screened shophouse footprints" figure is stale

The atlas reports **2,311** in five places, but the actual data is **2,433**:

- `site/app/data/shophouse-pressure.ts:6` — comment header
- `site/app/data/shophouse-pressure.ts:193` — `export const PRESSURE_TOTAL = 2311;`
- `site/app/data/shophouse-gazetteer.ts:4` — comment header
- `site/app/data/shophouse-gazetteer.ts:19` — `n: 2311,` (cluster count)
- `site/app/data/twin-sources.ts:73` — FABDEM `unlocks` prose
- `site/app/data/datasets.ts:98` — `/datasets` page blurb
- `site/app/data/water-sources.ts:124` — FABDEM rejoin prose

The right number is in two places already and is reproducible from the geojson:

- `site/app/data/shophouse-spine-index.ts:1224` — `export const SPINE_TOTAL = 2433;`
- `site/app/data/rowhouse-footprint-summary.json` — `candidate_count: 2433, strong_count: 1025, possible_count: 1408`
- `site/public/data/bangkok-rowhouse-footprint-candidates.geojson` — 2,433 features
- `site/app/data/dataset-manifest.json` — 2,433 features for both the candidates file and the spine file

**Delta: 122 features (5 %) under-reported.** This is the one number
Codex's audit copy-pasted from the prose without re-deriving. Fix in one
sweep:

```bash
cd site
sed -i '' 's/2311/2433/g' app/data/shophouse-pressure.ts \
  app/data/shophouse-gazetteer.ts app/data/twin-sources.ts \
  app/data/datasets.ts app/data/water-sources.ts
# Then: npm run data:manifest && npm run data:evidence && npm run build
```

The test suite already checks the new spine index (`SPINE_TOTAL`) and
the geojson; it'll catch the inconsistency on the next CI run.

## What the original audit didn't verify but I did

### Test-suite cwd trap

The single test file (`site/tests/rendered-html.test.mjs`) has 80
`test()` calls. Codex's "80/80 green" is correct **only when the test
runner is invoked from `site/`**. If you run it from the repo root
(`node --test site/tests/rendered-html.test.mjs`), the `path.join(cwd,
"public/heritage/photos", …)` call resolves to a non-existent
`/Users/.../BKKx/public/heritage/photos/rattanakosin.jpg` and 1 test
fails with `rattanakosin: photo rattanakosin.jpg not on disk`. That's
the audit's own test suite reporting false-failure on the wrong cwd.

**Fix recipe in the audit itself** (currently missing): the release-gate
line should read

```bash
cd site && npm run build && node --test tests/rendered-html.test.mjs
```

not `cd /path/to/BKKx && node --test site/tests/rendered-html.test.mjs`.

### Runtime evidence is now in the live API

The "missing data remains blank rather than becoming fake zeroes" claim
is verifiable end-to-end. With no env, the three live endpoints behave
exactly as the audit describes:

```
GET /api/live/cctv
{"ok":true,"fetchedAt":"2026-08-31T17:58:53.540Z","source":"unconfigured",
 "data":{"cameras":[],"cameraCount":0,"configured":false}}

GET /api/live/fires
{"fetchedAt":"2026-08-31T17:58:53.607Z","source":"firms.modaps.eosdis.nasa.gov",
 "ok":false,"reason":"No FIRMS_MAP_KEY configured on this deployment. Request
 a free key at https://firms.modaps.eosdis.nasa.gov/api_map_key/ and set
 FIRMS_MAP_KEY in the Worker environment — never in the repository."}

GET /api/live/weather
{"fetchedAt":"2026-08-31T17:58:53.676Z","source":"open-meteo.com","ok":false,
 "reason":"Forecast unavailable: The operation was aborted. Air quality
 unavailable: The operation was aborted."}
```

Each response is a real envelope: timestamp, source attribution,
honest `ok:false` with the *reason* the data isn't there. None of them
return `0` or `[]` pretending to be a live reading. This is the most
concrete user-facing improvement in the release and was previously
invisible to operators.

## Honest limitations still on the board

- **BMA rain endpoint** is now correctly classified as credentialed, not
  keyless-and-wired. A separate Bangkok Open Data layer records the
  public flood-risk and annual road-flood datasets as historical
  context, explicitly not live observation. ✓ correctly described in
  the audit.
- **The camera rail still shows only 3 YouTube streams + 1 BMA bookmark
  in `/bkk-live-cams.geojson` (live, served at `atlas.nonarkara.org`).
  The Codex audit doesn't touch this — it's outside scope of the
  three-branch real-data release — but the suggestion-a-location UI
  in the new war room implies a 5th camera workflow that the underlying
  geojson doesn't yet back. Worth flagging for the next round.
- **`/api/live/weather` partial-failure handling** is correct in the
  test ("weather keeps valid air observations when the forecast is
  rate-limited"), but on the live deployment right now *both* components
  fail because the upstream aborted. The partial-success code path is
  tested but not currently observed live. Good — the test guards the
  regression.

## How to re-verify this audit yourself

```bash
cd /Users/nonarkara/Projects/BKKx

# 1. Commit and branch state
git rev-parse origin/main
git rev-parse origin/shophouses
git log --oneline -1 origin/main   # expect: cdc2828 release: promote audited real-data twin

# 2. The numbers
python3 -c 'import json; print("heritage sites:", len(json.load(open("site/public/heritage-register.json"))["sites"]))'
python3 -c 'import json; print("footprints:", len(json.load(open("site/public/data/bangkok-rowhouse-footprint-candidates.geojson"))["features"]))'
python3 -c 'import json; print("manifest entries:", len(json.load(open("site/app/data/dataset-manifest.json"))))'
python3 -c 'import json; print("tally total:", json.load(open("site/app/data/evidence-tally.json"))["total"])'
grep -c "id:" site/app/data/twin-sources.ts
grep -c "slug:" site/app/data/shophouse-gazetteer.ts

# 3. Build + test + lint + typecheck (run from site/)
cd site && npm run lint && npx tsc --noEmit && node --test tests/rendered-html.test.mjs

# 4. Live state
curl -sI https://bkk.nonarkara.org/ | head -1
curl -sI https://bkk.nonarkara.org/datasets | head -1
curl -sI https://bkk.nonarkara.org/warroom | head -1
curl -sI https://bkk.nonarkara.org/shophouses/atlas | head -1
curl -s https://bkk.nonarkara.org/api/live/cctv | python3 -m json.tool
curl -s https://bkk.nonarkara.org/api/live/fires | python3 -m json.tool
```

If any of these doesn't return the value above, the audit is stale.

## What the next audit should add

The Codex audit is good. The structural improvements that would push it
from "good" to "this is the canonical record" are:

1. **Inline verification commands in every claim**, not just a final
   "Method" line. Audit documents that drift are usually those whose
   numbers were never re-derivable. Embed the `python3 -c` one-liner
   next to the number.
2. **A "stale numbers" check** — grep for hardcoded counts and cross-
   reference against the data they describe. That's how the 2,311
   discrepancy would have been caught at audit time instead of by me
   later.
3. **A cwd-correct test invocation** in the release-gate section. The
   `node --test` call is silently wrong when run from outside `site/`.
4. **Live-state curl output in the audit body**, not just a claim that
   the routes "work." Operators need to see the response shape to
   trust the "blank not zero" claim.
5. **A "this audit does not cover" section.** The camera rail and the
   atlas are mentioned in passing but not in scope. Saying so
   explicitly prevents the next reader from assuming the audit
   endorsed them.
