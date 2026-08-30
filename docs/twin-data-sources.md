# Feeding a city digital twin

Research notes and a reusable pattern, written while wiring live data into
BKKx. The city-specific rows are Bangkok's; the structure is meant to be
lifted into another twin codebase unchanged.

Companion code: [`site/app/data/twin-sources.ts`](../site/app/data/twin-sources.ts)
(the registry), [`site/worker/live.ts`](../site/worker/live.ts) (the adapters),
[`site/app/warroom/`](../site/app/warroom/) (the surface that consumes them).

---

## 1. The decision that comes first: transport, not preference

Whether a feed can reach the browser is a property of the feed, not a choice
you get to make. Two questions settle the architecture before any design
work:

| Feed is… | Browser can fetch it? | Therefore |
| --- | --- | --- |
| HTTPS **and** sends CORS headers | yes | Direct fetch is *possible* |
| HTTPS, no CORS | no | Must proxy |
| Plain HTTP | no — mixed content | Must proxy |
| Needs a secret key | never | Must proxy |

The BMA rainfall feed is HTTP *and* CORS-less, so it can only ever be
server-fetched. Discovering that after designing a client-side panel is a
rewrite; discovering it first is a five-minute decision.

**Being able to fetch directly is not a reason to.** Open-Meteo is keyless
and sends `Access-Control-Allow-Origin: *`, so the browser could call it —
but then every visitor hands their IP to a third party. This project's own
rule forbids collecting that ourselves, and proxying keeps the same promise
about who *else* receives it. Edge caching is the bonus, not the reason.

**A key in a repository is a leak**, including in a private one — it ends up
in build logs, forks and screenshots. Every keyed source reads its credential
from Worker env at request time, and the proxy never echoes it back, not even
in an error message. Note the small trap: a naive proxy that reports
`failed to fetch ${upstream}` leaks the key into the error string.

---

## 2. What a city twin is usually missing

Most civic dashboards are over-supplied with *overlays* and under-supplied
with *structure*. Ranked by how much capability each unlocks per unit of
effort:

### Terrain — the one that actually matters

**Bangkok floods because it is flat, low and sinking.** Without an elevation
model, hazard layers can colour a district but cannot answer *where the water
goes*, which is the only question a flood twin exists to answer.

Published accuracy work over this region is unusually clear: **FABDEM v1-2**
— Copernicus GLO-30 with forest and building bias removed — ranked first
among free global DEMs, ~1.95 m RMSE for the Bangkok area and best-in-class
in urban terrain.

The trap is the licence, not the download: FABDEM is **CC BY-NC-SA** —
non-commercial. A commercial fork must fall back to **Copernicus GLO-30**,
which is openly licensed but is a *surface* model: rooftops and canopy are
terrain as far as it is concerned, and flood routing on raw GLO-30 through a
dense district produces confident nonsense.

At 30 m, either is right for catchment and exposure screening and far too
coarse for street-level drainage. Say which you are doing.

### Population — and the "growth" question

**GHS-POP / GHS-BUILT** (EC Joint Research Centre) give population and
built-up surface in five-year steps **1975 → 2030**, openly licensed with
attribution. That time series is the honest answer to "show population
growth", and paired with the built-up layer it shows fifty years of urban
expansion against whatever heritage or asset register the twin holds.

It is also the exposure denominator: *population inside a hazard polygon* is
what converts a hazard into a priority.

Caveat worth stating on the page: GHS-POP disaggregates census counts by
built-up volume, so it is strongest exactly where a city is dense and weakest
at rural fringes, where published comparisons find large negative bias.

### Weather — forecast beside observation, never instead of

A gauge network says what fell; a forecast says what is coming. Keep both and
label which is which. Where they disagree, the gauge is what happened.

**Open-Meteo** is the efficiency win of this whole exercise: no key, no
signup, CORS-open, and it carries forecast, air quality, marine, geocoding
and point-elevation endpoints on the same free tier. For a twin that would
otherwise need three vendors and three secrets, it collapses to one adapter.

### Observed inundation

Satellite flood extent (GISTDA publishes daily maps for Thailand) is the only
source that shows where water *stood* rather than where a zone says it might.
It is the check on the risk polygons — places that flood but are not zoned
are the finding. Caveat: optical flood mapping is defeated by exactly the
cloud that accompanies the flood, so **gaps are weather, not dry days**.

### Local providers beat global ones on local names

For Thailand, **Longdo** carries a Thai POI corpus and a Thai-language
geocoder tuned to วัด / ตรอก / ซอย naming, plus routing, traffic speed, and a
camera overlay whose Bangkok feeds come from the **iTIC Foundation**. A
global provider will not match Thai honorifics and temple-name variants as
well.

If you add a third geocoder to a resolver that already has two, **record
which pass placed each record**. A third resolver is a third way to be
confidently wrong, and a silent merge destroys the audit trail. (BKKx keeps
this in a per-site `locatedBy` field: `fine-arts`, `osm:<id>:<method>`, or
`unlocated`.)

---

## 3. Cameras: the cost trap

Traffic camera networks generally deliver **HLS streams, not still images**.
The obvious implementation — a rail of live tiles — decodes N video streams
at once and will cost more than the entire rest of the page.

The pattern that works: **stills in the rail, stream on demand.** Show a
poster/snapshot per camera, refresh it on an interval, pause the interval
when the tab is hidden, and open the live stream only when someone asks for
that camera.

And do not invent camera endpoints to make a demo look alive. A fabricated
URL renders a broken tile that *looks like a working system*, which is worse
than an empty rail that explains itself.

---

## 4. The adapter pattern (portable)

Three files, and they are the whole thing.

**1 — the registry.** One typed array of candidate sources. Every entry
carries what it *unlocks*, its licence, its auth mode, whether the browser
can reach it, and — written *before* integration, not after — the caveat that
will bite. An `integration` field (`wired` / `ready` / `researched`) means the
page can show status honestly instead of implying everything works.

**2 — the adapters.** One function per source in the Worker, each returning
the same envelope:

```ts
type LiveEnvelope<T> = {
  ok: boolean;
  fetchedAt: string;   // when the server fetched, not when the source observed
  source: string;
  data?: T;            // present when ok
  reason?: string;     // present when !ok — shown to the operator verbatim
};
```

Rules that earn their keep:

- **Never invent a reading.** `ok: false` plus a reason, never a zero. An
  unreachable gauge network and a city with no rain are opposite facts and
  must not look alike on screen.
- **Normalise defensively.** Undocumented civic feeds change shape. Read the
  first plausible key for each field, drop rows you cannot read, and *count*
  the drops — then surface the count. A parser that silently defaults to zero
  is how a dashboard starts lying.
- **Timeout everything** (`AbortController`), and settle independent upstreams
  separately so one failure does not take out the rest.
- **Allowlist proxy parameters.** Never forward the caller's query string
  wholesale — that is how you build an open proxy by accident.

**3 — the surface.** Panels render `reason` when `!ok`, and static figures are
computed from shipped files at build rather than transcribed.

---

## 5. Ingest for bulk data

Live APIs are pull-on-demand; catalogue datasets are not. For those, an
ingest script should **discover rather than assume**: ask the catalogue what
resources exist, read the actual column names, and write what it found into a
manifest. A first run that reports "these twelve datasets have these real
columns" is worth more than a hand-written schema that is wrong in two
places. See [`scripts/ingest-bkk-water.py`](../scripts/ingest-bkk-water.py).

Guard every ingested coordinate against a bounding box and **report the drop
rate rather than silently filtering** — the filter rate is a data-quality
measurement, not noise.

---

## 6. Lifting this into another twin

1. Copy `twin-sources.ts`; replace the rows, keep the fields — especially
   `caveat` and `integration`.
2. Copy the envelope and one adapter as a template.
3. Keep the failure discipline. It is the part that makes a dashboard
   trustworthy, and the part most likely to be dropped for looking pessimistic.
4. Re-check licences for *your* deployment. NC terms (FABDEM) and
   agency terms (camera imagery) do not travel just because the code does.

## Sources

- FABDEM / DEM accuracy over flood-prone terrain — <https://www.tandfonline.com/doi/full/10.1080/17538947.2024.2308734>, <https://www.fathom.global/product/global-terrain-data-fabdem/>
- Copernicus Data Space — <https://dataspace.copernicus.eu/>
- GHSL population & built-up, 1975–2030 — <https://human-settlement.emergency.copernicus.eu/ghs_pop.php>
- Open-Meteo (forecast, air quality, elevation; keyless, CORS) — <https://open-meteo.com/>
- Longdo Map REST API — <https://map.longdo.com/docs/rest>; camera overlay & iTIC — <https://api.longdo.com/map/doc/>
- GISTDA daily flood extent — <https://data.go.th/en/dataset/http-flood-gistda-or-th>
- ESA WorldCover — <https://esa-worldcover.org/>
