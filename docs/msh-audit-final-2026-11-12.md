# Final MSH audit — 12 November 2026

This closes the blocker left in `docs/context-save-screenshot-review.md`: the
six screenshots and the first-screen read that could not be captured because
the previous agent's browser could not screenshot in headless mode. A headless
Chromium can, and did.

**Live build audited:** `bkkx-20261112-9a57a4a` (both `bkk.nonarkara.org` and
`shophouses.nonarkara.org`), plus `bkk-atlas-20261112-1794465969-ce34d8c` for
the Atlas.

Evidence in `docs/msh-evidence/2026-11-12/`.

---

## 1. The six screenshots, captured

| page | 390 | 1440 |
|---|---|---|
| `shophouses.nonarkara.org/` | `first-shophouses-front-390.png` | `first-shophouses-front-1440.png` |
| `shophouses.nonarkara.org/shophouses/read/1` | `first-shophouses-read-1-390.png` | `first-shophouses-read-1-1440.png` |
| `bkk.nonarkara.org/worlds` | `first-worlds-390.png` | `first-worlds-1440.png` |

Full-page captures are also in the same directory
(`shophouses-front-1440.png`, `shophouses-read-1-1440.png`).

## 2. First-screen read

**`/shophouses` at 390** — wordmark, then the seven destinations over two
rows (Essay · Why · Typology · The Bible · Global · Sources · BKKx), then the
credit eyebrow, then the title. The eye enters on the title and the
deputy's name below it; the navigation is above and quiet. The yellow
companion box is the loudest thing on the screen and it earns it: it is the
one instruction a first-time reader needs ("this is the companion, not the
chapter — read it in five parts, or start with the map").

**`/shophouses/read/1` at 390** — wordmark, navigation, the part eyebrow, then
the part title, then the prose. The eyebrow is a link back to the chapter
(`/shophouses#essay`) and is underlined, which is correct: it is a link, and
it looks like one.

**`/worlds` at 390** — a dark page. Eyebrow, a two-tone title ("Bangkok," in
paper white, "block by block." in the lime accent), the lede, then the two
actions — the lime **Start walking** and the outlined **View the source** —
then the map card. The title is the largest thing on the screen by a wide
margin and the primary action is the only filled control. Hierarchy holds.

At 1440 the same three pages keep their hierarchy; the world card gains a
`WORLD 01 / RATCHATHEWI` caption bar and the essay gains a measure.

## 3. The legacy-anchor redirect works

`https://shophouses.nonarkara.org/shophouses/#the-arithmetic-that-eats-a-street`
→ redirects client-side to
`https://shophouses.nonarkara.org/shophouses/read/1#the-arithmetic-that-eats-a-street`,
title "The case", first heading "The case". The anchor survives the redirect,
so a reader who followed an old link lands on the right part and the right
paragraph.

## 4. The type scale holds — with one exception that is now fixed

Audited twelve pages at 390 and 1440, counting every element that renders
text. Before this round the scale had five sizes: **14, 11, 32, 86.4, and 7**.

The 7 was `.wr-tally-unit` on the war room — `font-size: .5em` of a 14px
number, so the units on live figures ("°C", "%", "mm", "µg/m³") rendered at
7px. It is `--text-micro` now.

The scale is now **14 / 11 / 32 / 86.4**, and the 32 and 86.4 are the display
scale, not stray sizes.

## 5. Two more real defects, found and fixed

**The homepage's Old Town list.** The meta line under each card — the
classification and the era — was one line with an ellipsis, and nineteen of
them were cut mid-word: "▥ Market row · Rama V market history; later ma…".
That line is what tells you what you are looking at. It now takes two lines,
the same clamp the note beneath it has always used.

**The Atlas's massing note.** `.atlas-massing-note` sits absolutely over the
map in `--muted` grey with no background and no shadow. Over the extruded
city it landed on grey and ochre blocks and could not be read — and it is
the one sentence a reader most needs ("a schematic massing model, not an
official survey"). It now has the same ground the map's own attribution and
control group already use: a dark plate with a hairline. It was the only
absolutely-positioned text element over the canvas without one.

## 6. The 3D models, against the KL benchmark

`kl.nonarkara.org` is the same Atlas codebase pointed at Kuala Lumpur, so it
is a fair benchmark for the modelling, if not for the framing.

| | KL | Bangkok |
|---|---|---|
| extruded building masses | yes, whole city, over satellite | yes — `bkkx-3d-buildings` from PMTiles, plus a Rattanakosin set and a facade band |
| material language | varied by height and use, gold accents on landmarks | same: ochre and terracotta heritage fabric, white modern masses, blue landmark accents |
| landmark models | place markers with labels | a schematic Grand Palace stand-in GLB, Wat Arun, heritage forms with fitted plans |
| what leads | the 3D city is the default tab | the operational city is; the 3D views are scoped to Grand Palace and Wat Arun |

**The modelling is on par. The framing is not.** KL opens on the 3D city;
Bangkok opens on the flat operational map with the 3D models two clicks away,
scoped to a landmark. That is a product decision rather than a quality gap,
and it is the one place where BKKx is behind the benchmark.

`public/models/grand-palace.glb` is the obvious place a real survey would go
in: the module header already says what to replace it with, what the anchor
and yaw are, and that the mesh is a stand-in.

## 7. Whole-surface geometry

The first sweep was broken by the network — 267 of its measurements never
loaded the page, so it proved nothing. The gate now retries, and a route that
still will not load is UNVERIFIED rather than silently counted.

The clean run: **644 of 644 URLs checked at 390 and 1440, zero load errors,
one real finding** — the atlas layer buttons clipping their own labels
("National Archives (1)" needs 134px and the button is 112). Fixed above.

That single finding is the whole-surface verdict for this build. It is a
clean pass with one defect found, fixed, and re-checked — not a claim that
nothing is wrong.

## 8. Still open

- A clean whole-surface sweep. The gate exists and works; the run needs a
  network that stays up.
- The independent review row in the shipability ledger. Every finding here is
  the work of the agent that made it.
- The KL framing gap: a city-wide 3D tab, as KL has.
- The Atlas's own phone QA and its landmark-popup ownership (closed by
  `e9cfb95` upstream, not re-verified here beyond the standing note).

---

### What was not done, and why

The three "not performed" items in the previous round — 200% enlargement,
blocked fonts, keyboard reachability — were proved on 4 and 11 November and
are recorded in `docs/shipability-ledger.md`. The screenshot review that was
actually blocked is what this document closes.
