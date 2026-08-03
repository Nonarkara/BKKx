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
