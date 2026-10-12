# From boxes to buildings: the 3D roadmap

2026-10-12. How BKKx gets from extruded boxes to buildings that look like
the Grand Palace, and what each step needs from the project.

## Where we are

The atlas draws with MapLibre `fill-extrusion`, which can only make
vertical prisms. Everything so far, including the tiered roofs, Wat Arun's
corn-cob prang and the eight Wat Phra Kaew prangs, is stacks of prisms. That
is roughly LOD1.5. It has three hard limits:

- no sloped surfaces, so every roof is a staircase;
- no curves, finials, chofa or eave sweep;
- no textures, only one colour per part.

**Fixed today:** category heights that contradicted footprints. With no OSM
height, every `chapel` got 14 m and every `temple` 16–18 m, so the 5 × 5 m
pavilions round Wat Phra Kaew's ubosot stood as pillars taller than the
ubosot's walls. `site/scripts/cap-default-heights.py` caps those defaults at
max(4 m, 1.25 × span + 2 m), a Thai hall's ridge-to-span proportion. It
touches 408 buildings plus 9 landmark twins and keeps the original value.
The 97 small pavilions now get a body and a three-tier roof. That fixes the
scale. It does not lift the prism ceiling.

## What real 3D exists, and on what terms

| Source | What it is | Terms | Status |
| --- | --- | --- | --- |
| Google Photorealistic 3D Tiles | Streamed photogrammetry mesh of whole cities, the closest thing to "the real Grand Palace in 3D" | API key with per-request billing. Stream and display only: no caching, pre-fetching, export or extraction ([policy](https://developers.google.com/maps/documentation/tile/policies)) | Bangkok coverage not confirmed (Google is unreachable from this sandbox). Check the Grand Palace in Google Earth's 3D view. |
| CyArk, Wat Arun | 347 terrestrial laser scans, 16,543 photos, about 37 M-polygon textured model, made with the Fine Arts Department ([CyArk](https://www.cyark.org/whatwedo/documentation), [tour](https://tapestry.cyark.org/content/watarun)) | CyArk data is shared via Open Heritage 3D, typically CC BY-NC 4.0, on application ([CyArk](https://cyark.org/about/our-journey-to-an-open-archive)) | Not confirmed that the Wat Arun dataset is in the public catalogue; needs an application |
| Sketchfab | Statue scans at Wat Phra Kaew and Wat Arun (e.g. [VR Siam](https://sketchfab.com/saenpich)); paid yaksha models | Per-model CC or paid | No CC model of any Grand Palace building, Wat Arun or Wat Pho found |
| GISTDA / BMA LOD2 CityGML | — | — | None found |
| OpenStreetMap Simple 3D Buildings | `building:part` + `roof:shape` tags ([wiki](https://wiki.openstreetmap.org/wiki/Simple_3D_buildings)) | ODbL; we can contribute | Our extract carries no parts for the palace |
| Our own capture | Ground photogrammetry, phone LiDAR, the Fine Arts Department's measured drawings | Ours, with site permission; drone flight over the royal compound is restricted | Needs access |

There is no free, downloadable, open-licence model of the Grand Palace.
The real meshes that exist are Google's (view-only, paid) and CyArk's (Wat
Arun only, non-commercial, by application).

## The step that unlocks everything: render meshes, not prisms

Whatever the source, it reaches the page as a mesh: glTF models or a 3D
Tiles tileset. deck.gl draws both on top of MapLibre (`Tile3DLayer` for
tilesets, including Google's; `ScenegraphLayer` for glTF), interleaved via
`MapboxOverlay`. So one renderer path serves our own procedural models, a
CyArk mesh and Google's tiles alike. The prism layers stay as the fallback.

## Stages

1. **Procedural meshes (ours, no licences).** Emit glTF from the same type
   parameters the prisms use:
   - real pitched, overlapping multi-tier gables with eave sweep, gable
     boards and chofa;
   - prangs and chedis as lathe surfaces;
   - straight-skeleton hipped roofs for non-rectangular footprints, which
     fixes the 2,260 m² gold slab of Phra Thinang Borommaphiman and the
     cloisters.

   Package as 3D Tiles and render via deck.gl. This covers all 464 roofed
   buildings and the 13 heroes.
2. **Photo-mesh mode (optional).** A toggle that streams Google
   Photorealistic 3D Tiles underneath, with attribution. Needs an API key
   and a billing decision. It adds realism but gives us no data.
3. **Wat Arun, measured.** Apply for CyArk's Wat Arun data, decimate it to
   LODs (about 1–3 M triangles at the top), and replace the procedural Wat
   Arun. Needs a named applicant and acceptance of non-commercial terms.
4. **Hero LOD3.** Hand-modelled glTF for about ten buildings (Wat Phra Kaew
   ubosot, Chakri Maha Prasat, Dusit Maha Prasat, Phra Si Rattana Chedi, the
   Wat Pho viharn) from Fine Arts Department drawings and photographs, or
   from scans under a partnership.
5. **Give back.** Contribute `building:part` and `roof:shape` for the Old
   Town to OpenStreetMap, so every OSM 3D renderer benefits.

Every stage keeps the rule the project runs on: each part says whether it is
measured, licensed survey, or typology.
