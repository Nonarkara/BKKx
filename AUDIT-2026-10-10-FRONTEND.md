# BKKx frontend audit — 2026-10-10

Auditor: Claude (this session). Brief: *"Frontend audit again."*, on top of
1.0.0 (`ecbd4c3`) plus this branch's roofs, Wat Arun and camera screening.

**Method.** The production build served by `vinext start` and loaded in
Chromium at 1366×900 and 390×844 on all 22 routes (one sample per dynamic
route). Each load recorded page errors, console errors, failed same-origin
requests, horizontal overflow (with the element that causes it), and
axe-core 4.10.2 at WCAG 2.0/2.1 A + AA. Every fix was re-measured with the
same sweep. The sandbox cannot reach OpenFreeMap, Esri, YouTube or the
upstream feeds, so §3 lists what that hides.

## 1. Results

| | Before | After |
| --- | --- | --- |
| axe violations (22 routes × 2 viewports) | **1,495** | **0** |
| — colour contrast | 1,175 | 0 |
| — `aria-prohibited-attr` | 210 | 0 |
| — `nested-interactive` | 66 | 0 |
| — `scrollable-region-focusable` | 43 | 0 |
| — `aria-hidden-focus` | 1 | 0 |
| Phone pages wider than the screen | 3 (`/datasets` +366 px, `/worlds` +86, `/warroom` +10) | 0 |
| Page errors not caused by the sandbox | 1 (CSP, homepage) | 0 |

Gates after the fixes: build ✓ · generated data unchanged ✓ · `tsc` ✓ ·
lint ✓ · render tests 91/91 ✓ · flood + camera-CV tests 35/35 ✓.

## 2. Findings and fixes

### 2.1 Critical — the front door refused its own map

`worker/index.ts` set `frame-src https://www.youtube.com https://www.youtube-nocookie.com`.
The homepage *is* an iframe of `/atlas/historic-core?embed=1`, a same-origin
frame, which that policy blocks. Chromium logged *"Refused to frame … because
it violates the following Content Security Policy directive"* and the map
area stayed empty. The server-rendered HTML was correct, so the render test,
which only reads HTML, passed. Since the security headers shipped in 1.0.0,
bkk.nonarkara.org has most likely shown an empty map frame.

Fix: `frame-src 'self' …`. A new assertion in the homepage render test reads
the `frame-src` directive from the worker's response and requires `'self'`.
It was confirmed to fail with the old policy and pass with the new one.

### 2.2 High — no basemap meant no map at all

The atlas handed MapLibre the OpenFreeMap style URL directly. When that
request fails, MapLibre never fires `load`, so none of the heritage layers
were added: footprints, roofs, hero monuments and cameras. Every one of them
is served by this site, so the dependency on a third-party CDN was all or
nothing.

Fix: `resolveBasemapStyle()` fetches the style first, with an 8 s timeout.
On failure the atlas starts from a bare dark ground, keeps the glyph URL so
label layers stay valid, and shows *"Basemap unreachable — streets and the
city's generic buildings are missing. Every BKKx layer is served from this
site and still shown."* This was verified here, where OpenFreeMap really is
unreachable: the Old Town, the temple roofs and Wat Arun render on both
`/atlas/historic-core` and the homepage.

### 2.3 Accessibility

- **Links inside buttons (homepage, 32 cards).** Each rowhouse card was a
  `<button>` containing its source `<a>`: invalid HTML, and a link a keyboard
  or screen reader can't reliably reach. The link is now the button's
  sibling, positioned on the card's bottom line (`OldTownPicks.tsx`).
- **Signal yellow on cream (homepage).** The "Why it matters" label was
  `#c9ff38` on `#fffdf5`, a 1.15:1 ratio. It also broke the house rule that
  signal yellow appears only on dark surfaces. It is now ink on the cream
  card and signal yellow only on the dark active card.
- **Translucent ink as text (Editorial pages, ~900 nodes).** Captions, metas
  and indices used `rgba(17,18,15,.40–.58)` on paper, about 3.4:1. The
  minimum that clears 4.5:1 on all six paper shades is 0.63. The 25 text
  `color:` declarations below 0.64 were raised to 0.64. Borders and fills
  were left alone.
- **War room faint grey.** `--wr-faint` changed from `#5e6157` (2.9:1 on the
  panel) to `#80827a` (4.6:1). The magenta source-layer label was lightened
  from `#c14190` to `#c8589d`, since chart hues used as text must still read.
- **Shophouse pink as text.** A new `--sh-seal-text: #c4006b` replaces
  `--sh-seal` wherever pink is used as text (50 declarations). The brand pink
  stays for rules, underlines and fills.
- **Case page.** The archive red used as text takes its deep step on warm
  paper and its light step on the one dark band. The "promising" chip's gold
  background darkens to `--palette-gold-deep`.
- **Smaller items.** Score pips got `role="img"` (they carried an
  `aria-label` on a bare `div`). The global map's `<svg>` changed from
  `role="img"` to `role="group"`, because it contains focusable town markers.
  On the atlas cursor readout, `aria-hidden` moved from the whole `<p>` to
  the live coordinates, so the shortcuts button is no longer hidden. The
  `/shophouses/atlas` district table scroller is now focusable, with a label
  and a focus ring. Faded `opacity` captions were replaced with the quiet
  colour. Remaining grey literals on `/worlds` and `/shophouses` were moved
  to the nearest AA shade.

### 2.4 Phone layout

- `/datasets`: citations were `white-space: nowrap` inside a `1fr` grid
  track, so the track grew to fit them. Columns are now `minmax(0, 1fr)` and
  citations wrap, which also removes 20 keyboard-unreachable scroll boxes.
- `/worlds`: the download card's 200 px button column sat beside the title.
  On phones the buttons now drop below it.
- `/warroom`: a degraded panel quotes the upstream's reason verbatim, and an
  unbroken token pushed the page 10 px wide. Reasons and notes now wrap.

### 2.5 Robustness

`/api/pageview` and `/api/stats` threw a 500 when there was no D1 binding
(local or preview runs; `/worlds` asks for stats). They now answer 503 with
`"pageview store not configured (no D1 binding)"`. A test covers both a
missing env and an empty one.

## 3. What this sweep cannot see

- **Third-party content.** Basemap tiles, Esri imagery, YouTube posters
  (`/api/live/camera-poster` → 404 here) and the flood upstreams
  (`/api/flood/roads`, `/api/flood/evidence` → 503 here) are blocked in the
  sandbox. The pages degrade to their stated reasons, which is the intended
  behaviour, but how they look with live data was not observed.
- **Basemap boxes under the new roofs.** OpenFreeMap's generic buildings draw
  the Old Town too. None of the roofed or hero buildings carry an OSM height
  tag, so their basemap boxes are OpenMapTiles' default of about 5 m. That
  sits inside every hall's walls or roof. For Wat Pho's eight prangs,
  however, whose first terrace tops out at 2.9 m, a basemap box would show as
  a ring about 2 m high. The tiles could not be fetched here to confirm it.
  MapLibre 4.7's `within` does not evaluate polygons, so the fix would be an
  id-based filter on the basemap layer, if its tiles carry feature ids.
- **Screen readers and real devices.** axe checks rules, not experience. The
  sweep used Chromium only, with no Safari or Firefox and no touch input.

## 4. Also in this round (separate commits)

- `fead184`: FloodDash's camera water screening on the war room's agency
  stills (opt-in), with its tests in CI.
- In bkk-3d-atlas (`claude/audit-main-branches-f0rkih`): the Maholan camera
  dots are opt-in (`51d0927`); BKKx's roofs and Wat Arun are synced into the
  shared atlas, each drawn once (`087d407`); FloodDash's camera-wall CV runs
  on the iTIC popup stream (`1dac1fc`).
