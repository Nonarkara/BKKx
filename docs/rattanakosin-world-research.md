# Rattanakosin World Build — Research Note

**Date:** 2026-08-25
**Status:** Research, not action. Reading list before writing any blocks.

---

## 1. What's already in the system (the honest baseline)

The Minecraft world is **not a blank canvas**. The BKKx project has been
modeling Bangkok for months. The relevant pieces for the Rattanakosin ask:

### 1.1 The world itself

Two world zips ship today in `releases/`:

- `BKKx-Bangkok-Historic-Core-Java-1.21.4.zip` — the Rattanakosin core
- `BKKx-Ratchathewi-Java-1.21.4.zip` — the adjacent district

`bangkok-historic-core-java/metadata.json` defines the projection:

```json
{"minMcX":0,"maxMcX":3383,"minMcZ":0,"maxMcZ":3216,
 "minGeoLat":13.737134,"maxGeoLat":13.766063,
 "minGeoLon":100.478897,"maxGeoLon":100.510225,
 "projection":"local","scale":1.0}
```

- **Scale 1.0** — one block = one metre, no compression.
- **3,384 × 3,217 blocks** — about 3.4 km × 3.2 km. The full Rattanakosin
  island (≈ 2.5 km × 1.5 km) plus the river edges fits comfortably.
- A linear lon/lat → block projection lives in `metadata.json`; the world
  is not on a true UTM, it is the project-local projection used by the
  heritage register.

The Rattanakosin island maps into the world at roughly block X 660–2070,
Z 450–2200. The Grand Palace centre (100.4915 E, 13.751 N) lands at
block (1361, 1675). Wat Pho lands at (1231, 2153). Wat Arun at
(1069, 2486). All well inside the world.

### 1.2 The hero-monument parts (already defined)

`site/scripts/build-hero-monuments.py` → `bkk-hero-monuments.geojson`:

| Hero complex | Parts | Source |
| --- | ---: | --- |
| Wat Arun prang group | 23 | OSM footprint + Fine Arts 82 m envelope |
| Grand Palace: Phra Siratana Chedi | 7 | Bureau of the Royal Household official plan |
| Grand Palace: Phra Mondop (Library) | 8 | Fine Arts palace publication + plan |
| Grand Palace: Prasat Phra Thepbidorn | 5 | Bureau of the Royal Household plan |
| Wat Pho: Phra Maha Chedi Si Sanphetdayan | 6 | Wat Pho architecture + Fine Arts |
| Wat Pho: Phra Maha Chedi Dilok | 6 | Wat Pho architecture + Fine Arts |
| Wat Pho: Phra Maha Chedi Muni Bat | 6 | Wat Pho architecture + Fine Arts |
| Wat Pho: Phra Maha Chedi Srisuriyothai | 6 | Wat Pho architecture + Fine Arts |
| **Total** | **67** | All interpretive, not measured |

The script's own caveat (line 367) is the right one: **"All tiering
remains interpretive."** Every model carries a `not_measured_survey: true`
flag and a `height_confidence` of `interpretive-envelope`. The 82 m
Wat Arun envelope is one of three published figures (Fine Arts 82 m, TAT
81 m, BMA 67 m); the model picks Fine Arts and notes the disagreement.

### 1.3 The OSM building fabric

`bkk-heritage-detail.geojson` — **9,275 building polygons** in the same
projection. 73 are the curated landmarks (the `bkk-building-*` IDs the
script reads). The other 9,202 are the dense Old-Town fabric — the
shophouse rows, the temple compounds, the palace outbuildings, the
government buildings. They have OSM IDs and footprints; only a small
fraction have height data.

### 1.4 The heritage register

`site/public/heritage-register.json` — **571 gazetted monuments**, of
which **125 have precise block coordinates** in the world. The other
446 are registered (Fine Arts) but not yet placed. Coverage:

| World | Walkable sites |
| --- | ---: |
| `bangkok-historic-core-java` | 105 |
| `bangkok-ratchathewi-java` | 20 |
| (no world) | 446 |

The 6 walkable sites in the immediate Grand Palace area
(block X 1600–2000, Z 1900–2300): คลองหลอดวัดราชบพิธ, วังบ้านหม้อ,
สะพานมอญ, สะพานหก, สะพานอุบลรัตน์, อาคารศรีเมือง. Bridges and a
single building — the Palace interior itself is mostly unbuilt.

### 1.5 The river and the moat (status)

The world is **land-only at the moment**. The Chao Phraya river and
the Rattanakosin moat (คลองรอบเมือง) are not yet carved as water.
The Talat Noi / Bangkok Noi side of the river is partial OSM
fabric. Adding water is a separate problem from adding buildings, and
one of the next-largest single additions.

---

## 2. What "closely modeled" requires

To make the Grand Palace and Rattanakosin genuinely close to the real
city at 1:1 scale, three layers of work are needed. They are not the
same work and can be done in parallel.

### 2.1 The Palace interior — what is "Grand Palace"?

The Grand Palace compound is not one building. It is a **2,351 m × 1,000
m walled rectangle** enclosing three successive courts, each built by a
different Chakri king, with the Temple of the Emerald Buddha (Wat Phra
Kaew) at its core. The 3 hero structures already modeled (Siratana
Chedi, Phra Mondop, Prasat Phra Dhepbidorn) are the three most prominent
Wat Phra Kaew monuments. The remaining ~30 named structures in the
compound are **not yet modeled**, including:

- Dusit Maha Prasat (Rama I, 1789) — the first throne hall
- Chakri Maha Prasat (Rama V, 1882) — the Italian-Renaissance-style
  throne hall (the green-and-cream building tourists photograph from
  across the moat)
- Phra Thinang Aphonphimok (Rama I) and the surrounding Middle Court
- Ho Phra Monthian Thamnak Monthien — the royal pantheon with its
  Chakri dynasty statues
- The Outer Court buildings: the Maha Surasinghanat Reception Hall,
  the Borom Phiman Mansion, the Suan Misakawan Pavilion, the
  Suan Khlai Mukda Pavilion
- The Queen's Court (Inner Court) — usually closed to visitors
- The Phra Racha Phithi Royal Cemetery, behind Wat Phra Kaew
- The Royal Pantheon (Prasat Phra Thep Dhepharat) — Rama V
- The gates: the Outer Gate, the Middle Gate (Wiset Chai Si),
  the Inner Gate, plus the discreet service gates

The Bureau of the Royal Household's official plan
(https://www.royalgrandpalace.th/download/plan_eng.pdf) is the source.
It is the only public-domain full plan with named structures.

### 2.2 The Rattanakosin district — what is "Rattanakosin"?

The Rattanakosin district (เขตพระนคร) is the modern administrative
unit. The historical "Rattanakosin" the user means is the walled city
of 1782, bounded by:

- The river to the west and south
- The moat (คลองรอบเมือง) on the other three sides
- The original 18 city gates (ประตูเมือง), of which the major ones
  surviving are: Pratu Phi, Pratu Suan Mali, Pratu Tha Phra,
  Pratu Chakkrawat, Pratu Thep Ratcha, Pratu Ratcha Dindam,
  Pratu Suan Phu, Pratu Damrong Sawan, Pratu Phutthai Sawan
- The Rattanakosin wall, mostly destroyed, with the surviving
  Pom Phra Sumen fort (the 1783 hexagonal fort) and the
  Fort Mahakan (the 1783 octagonal fort) on the eastern corner
- Inside the wall, the royal temples, the royal pantheon, the
  city pillar shrine, the elephant kraal, the Thammasat
  University grounds, the National Museum, the Wang Luang
  (the old Front Palace), the Chakri Palace

For the Minecraft model, the meaningful sub-precincts inside the wall:

- Phra Nakhon (the royal quarter)
- Thewet (the royal residence quarter)
- The old Chinese quarter (Talat Noi, across the river, but visually
  part of the same walled island)
- The Tha Chang market street
- The Phra Chan market street

### 2.3 The MahaNakhon tower (the "Mahana Korn" reference)

The Bangkok skyscraper in the user's reference is **MahaNakhon**
(มหานคร), the OMA-designed pixelated tower at 1005 Silom Road
(100.5253 E, 13.7262 N). It is a comparatively trivial 314 m,
77-storey addition to the Rattanakosin world — a single hero monument
much like the Wat Arun prang group, but at a different scale and in a
modern rather than historical register. The commmit
`1ccd8ac feat: model Wat Arun as a sourced 3D hero` (and the run before
it) implies the same hero-monument system can model MahaNakhon with a
single script addition.

---

## 3. The phased plan (proposed, not started)

This is the work in the order I would do it. Each phase is a separate
piece of work with its own commit and review.

### Phase 1 — Palace wall, moat, and gates (2 weeks)

- Carve the moat (คลองรอบเมือง) and the river (Chao Phraya) into the
  world as water. This is the only step that needs terrain work, and
  it frames everything that follows.
- Place the surviving wall fragments (Pom Phra Sumen, Fort Mahakan,
  the small Pom Pratu Phi and Pom Pratu Damrong Sawan sections).
- Place the 9 surviving city gates as small free-standing buildings
  (or as the gates on bridges where the gate was a bridge).
- All coordinates come from the heritage register; the
  `bkk-building-` IDs in `bkk-heritage-detail.geojson` for the
  footprint of each fort and gate.

### Phase 2 — Wat Phra Kaew full complex (2 weeks)

- The three hero structures already in `bkk-hero-monuments.geojson`
  (Siratana Chedi, Phra Mondop, Prasat Thepbidorn) are the
  three most-photographed monuments in the temple, but the
  complex has ~40 named structures: the cloister walls, the
  Phra Si Rattana Chedi (which is also a Rama I chedi, different
  from the 4 Wat Pho chedis), the Prasat Phra Thep Dhepharat
  (the Royal Pantheon, Rama V, 1903), the Ho Phra Monthian Thamnak
  Monthien (the royal residence chapel), the model of Angkor Wat
  (the Royal Pantheon contains it), the Ramakien murals on the
  cloister walls, the belfry, the gate.
- Each gets the same tier-by-tier structure the existing
  hero parts use, sourced to the Royal Household plan.
- The whole temple sits on a single stone plinth raised 2 m above
  the Palace courtyard; that plinth is its own part.

### Phase 3 — Outer and Middle Courts of the Palace (3 weeks)

- The Dusit Maha Prasat (Rama I throne hall) and its cross-shaped
  mosaic interior is the hardest one — Thai temple crossed with
  European Renaissance, built 1789.
- The Chakri Maha Prasat (Rama V) is the most-photographed exterior
  (Italian Renaissance loggia on a Thai temple base).
- The Maha Surasinghanat, the Suan Misakawan, the Suan Khlai Mukda,
  the Borom Phiman Mansion, the two gates, the two pyramidal
  Phra Thinang structures. The Bureau of the Royal Household plan
  names them all with dimensions.

### Phase 4 — Rattanakosin walls and gates (2 weeks)

- After the Palace is dense, work outward. The 9 surviving gates
  (Pratu Phi, Pratu Suan Mali, Pratu Tha Phra, Pratu Chakkrawat,
  Pratu Thep Ratcha, Pratu Ratcha Dindam, Pratu Suan Phu,
  Pratu Damrong Sawan, Pratu Phutthai Sawan) as small free-standing
  buildings.
- The 16th-century-city-pillar shrine (Lak Mueang, the city pillar
  that Rama I moved to Rattanakosin in 1782) as a small but
  prominent hero.
- The Phra Sumen fort (the 1783 hexagonal brick fort on the
  western moat corner) and Fort Mahakan (the 1783 octagonal
  fort on the eastern moat corner) as hero monuments with the
  same tier system.

### Phase 5 — Surrounding royal temples (2 weeks)

- Wat Suthat Thep Wararam (Rama I, 1807), the largest temple outside
  the Palace, with its 25 m red iron *Sao Ching Cha* giant swing.
- Wat Ratchabophit (Rama V, 1869), the only Thai temple with
  Gothic interior.
- Wat Bowonniwet (Rama III), the royal temple of two kings.
- Wat Ratchanatdaram (Rama III), the Loha Prasat metal-castle.
- Wat Indraviharn (Rama IV), the giant Buddha.
- All of these are already in the heritage register with
  `block` coordinates, ready to be marked as hero monuments.

### Phase 6 — MahaNakhon (1 week, optional)

- A single 314 m × ~70 m × ~70 m tower with the pixelated stepped
  facade. Different from the other heroes because it is a modern
  building, but the existing system handles it the same way.
- The MahaNakhon is a useful counterpoint to the historical
  register: it makes the case that the system models the
  contemporary city too, not just the historical one.

### Phase 7 — The 446 unplaced registered monuments (ongoing)

- Many of the 571 gazetted monuments are not yet placed. The
  heritage-register pipeline is the right tool. The world's block
  coordinate system makes the placement mechanical for the
  ~200 Old-Town sites.

---

## 4. The data we already have, the data we need

### Have

- 9,275 building polygons (bkk-heritage-detail.geojson)
- 571 gazetted monuments (heritage-register.json, 125 with block coords)
- 73 curated landmarks (bkk-landmarks.geojson, with OSM IDs)
- Bureau of the Royal Household official plan PDF
- Fine Arts Department publications for Wat Pho, Wat Arun, the Palace
- 9 quarters with walks and stops
- The full OSM building fabric (32,077 shophouse candidates in
  the rowhouse atlas)
- 1:1 scale world covering the entire Rattanakosin core
- 67 hero-monument parts already defined and tested

### Need

- The Bureau of the Royal Household plan, fully extracted as named
  structure polygons (currently only 3 of ~30 extracted as `bkk-building-`
  IDs)
- The 18 city gate locations (we have 9 surviving, but the original 18
  are part of the historical record)
- The Rattanakosin wall alignment (mostly destroyed, but the
  alignment is recorded in the Ratcha-anusorn 1926 city plan)
- The river banks (Chao Phraya) — the world is land-only at the moment
- The moat polygon — the moat was filled in 1850 in some places,
  preserved in others; the current alignment is what the OSM
  captures

### Could go further with

- Photogrammetric data for individual temple ornaments
- The Rama IX approved plan for the Chao Phraya riverbank
  redevelopment (which is contested and would need a clear editorial
  line)
- LiDAR scans of the Palace grounds (the Fine Arts Department
  has these but does not publish them in a research-friendly form)

---

## 5. The honest constraints

- The world is at 1:1 scale, which is correct for accuracy but means
  the model is a 3.4 km × 3.2 km city. That is a real city. Every
  change touches a real place.
- The existing hero-monument system is **interpretive**, not
  measured. Every part carries the caveat. Anyone using the model
  for academic or legal work needs to know that.
- The 18 city gates are recorded but the original 1782 wall is gone
  almost everywhere. Reconstructing it from photographs and the 1926
  plan is a separate historical project.
- The user wants this on the "Minecraft engine we use to build the
  whole system here." That is the Java 1.21.4 world already in
  `releases/`. The work is to extend that world, not a new engine.

---

## 6. Next step

I will not start writing blocks without your sign-off on this
research. The first concrete decision is which phase to start
with, and that depends on which of the three areas — Palace
interior, Rattanakosin walls, surrounding royal temples — matters
most for the comparison cases you are building.

The most useful first move is probably **Phase 1 (wall, moat, and
gates)** because it frames everything else, and because the
river-and-moat carve is the one infrastructure addition the world
needs. But if the comparison is "Bangkok then and now" or
"Palace vs. Cathedral", Phase 2 (Wat Phra Kaew) is the better
first move.

Recommend we agree on a phase before any code.
