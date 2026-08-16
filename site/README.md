# BKKx Culture

The production source for [bkk.nonarkara.org](https://bkk.nonarkara.org): Bangkok's cultural-heritage atlas, rowhouse register, walks, research companion and downloadable geospatial evidence.

This repository deliberately separates two sibling systems:

- **BKKx Culture** — this site. Heritage exploration, registered monuments, ordinary urban fabric, public-transport access and the Shophouse Metropolis research system.
- **Bangkok Digital Twin** — [atlas.nonarkara.org](https://atlas.nonarkara.org). The operational city-management system for traffic, rain, CCTV, incidents and environmental conditions.

The shared 3D language is intentional; the jobs are not interchangeable.

## Public surfaces

| Route | Purpose |
| --- | --- |
| `/` | 3D heritage front door |
| `/heritage` | searchable monument register |
| `/rowhouses` | sourced Bangkok rowhouse field atlas |
| `/areas/[slug]` | heritage-quarter guide |
| `/walks/[slug]` | routed cultural walk |
| `/shophouses` | ten-minute argument, live pressure map and optional long research companion |
| `/shophouses/bible` | measured field reference and gazetteer |
| `/shophouses/global` | comparative Asian shophouse research |

## Development and release gate

```bash
npm ci
npm run lint
npx tsc --noEmit
npm test
```

`npm test` creates the production vinext build and runs the rendered-route and data-integrity suite. CI runs on every pushed branch and pull request so `main` and research branches are held to the same release gate.

The site deploys as a Cloudflare Worker through OpenAI Sites. `.openai/hosting.json` is the authoritative Sites binding; D1 stores pageview analytics. Geographic datasets and confidence caveats live under `app/data` and `public/data`. Generated Minecraft worlds remain GitHub Release assets rather than part of the website bundle.
