# Contributing to BKKx

BKKx grows one testable Bangkok chapter at a time. Open an issue before generating a large district so work is not duplicated.

## A complete district contribution

1. Generate the world at 1 block per metre with a documented bounding box.
2. Keep the raw world out of Git history; package it as a GitHub Release asset.
3. Add `metadata.json` and a `bkkx-manifest.json` with generator version, source attribution and settings.
4. Run `python3 scripts/validate_world.py /path/to/world` and include the region/chunk totals.
5. Add a compressed top-down preview under `previews/` and `site/public/images/`.
6. Add 3–6 accurate landmark chapters to `site/app/walkthrough.tsx`.
7. Run the site build, type check, lint and rendered HTML test documented in the README.

Keep each chapter factual and navigable. Landmark descriptions should explain how to read the surrounding city, not just repeat encyclopedia facts.

## A shophouse type

The public typology is `/shophouses/typology`. Adding a type means adding one object to `site/app/data/shophouse-typology.ts`. If the facade is confirmed, point `elevation` at a drawing in `site/app/shophouses/typology/elevations.tsx`, or add one id there. Do not add a new page per type.

Each entry may carry an `embed`: the Instagram post URL and a 1-based `imageIndex` (the same number as `?img_index=`). The page shows that post with Instagram’s official embed, lazy-loaded, and a credited link if the embed is blocked. Do not copy or rehost the creator’s image files.

Write the name, era, street, district, facade and description in English, Thai and Chinese. Credit the creator’s name, handle, post and article on every entry that uses them. In the description, say what the type teaches about density and adaptability: a household and a livelihood on the same lot, changed one bay at a time. The library’s question is how a city houses a large number of people and keeps its core identity, following Edward Glaeser, Triumph of the City (Penguin, 2011), and Reinhard Goethert’s incremental housing at MIT SIGUS. Do not argue for freezing the street.

Set `lat` and `lng` together, or leave both off. A pin is drawn only when both are set. If a street label on a source drawing cannot be read clearly, use “To confirm” / “ยังไม่ยืนยัน” / “待确认” and list that part in `toConfirm`. Credit the drawing and link it. Do not copy the image into this repository.

Lat Phrao Road is the type Non grew up in. The 5 October 2026 carousel image 3 is titled ถนนลาดพร้าว, so that facade is filed. The decade, the district and the map point stay open. Two other sheets in that carousel did not yield a place name clear enough to file; leave those out rather than guess.
