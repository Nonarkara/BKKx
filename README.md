# BKKx — Bangkok, block by block

[bkk.nonarkara.org](https://bkk.nonarkara.org) is an open, playable walkthrough of Bangkok. BKKx turns public geographic data into Minecraft Java worlds, then layers a guided field atlas on top so anyone can read the city from above and explore it one block at a time.

## What is live

| World | Coverage | Size | Validated chunks |
| --- | --- | ---: | ---: |
| Ratchathewi / ราชเทวี | Victory Monument, Phaya Thai, Pratunam and Makkasan | 4.96 × 2.95 km | 61,440 |
| Historic Core / เกาะรัตนโกสินทร์ | Phra Nakhon, Chao Phraya and adjacent Thonburi | 3.38 × 3.22 km | 50,176 |

Both worlds use a 1 block = 1 metre local projection and open in Creative mode on Minecraft Java Edition 1.21.4 or newer.

## Download and enter Bangkok

Download the worlds from [GitHub Releases](https://github.com/Nonarkara/BKKx/releases/latest), or install from a clone on macOS:

```bash
./scripts/install-macos.sh ratchathewi
./scripts/install-macos.sh historic-core
```

The installer uses a local generated world when present. A lightweight GitHub clone automatically downloads the matching release instead, and never overwrites an existing Minecraft save.

## Repository map

```text
site/       public walkthrough, landmark chapters and pageview analytics
edge-proxy/ custom-domain binding for bkk.nonarkara.org
worlds/     generation manifests and local world data when available
previews/   validated top-down world maps
releases/   archive checksums; binary worlds are attached to GitHub Releases
scripts/    installer and Minecraft Anvil integrity validator
```

## Run the atlas locally

```bash
cd site
npm install
npm run dev
```

Production checks:

```bash
npm run build
npx tsc --noEmit
npm run lint
node --test tests/rendered-html.test.mjs
```

The web atlas uses vinext/React and deploys as a Cloudflare Worker. A small D1 table records aggregate pageviews without storing IP addresses. World binaries remain outside the website bundle and are distributed through GitHub Releases.

## Generate another Bangkok district

Worlds are generated with [Arnis](https://github.com/louis-e/arnis) from OpenStreetMap, Overture Maps and land-cover data. Record the exact bounding box, scale, generator version and validation results in a `bkkx-manifest.json`, then add the district and landmark chapters to `site/app/walkthrough.tsx`.

```bash
python3 scripts/validate_world.py /path/to/generated-world
```

These are procedurally generated city-scale models, not survey-grade engineering twins. Building footprints, inferred heights, roads, water, vegetation and selected 3D assets depend on source-map coverage.

## Roadmap

- Add the remaining Bangkok districts as independent world chapters.
- Layer air quality, flooding, transit and civic data onto the atlas.
- Add community-submitted stories and landmark corrections.
- Support collaborative builds and Minecraft Education workflows.
- Publish a reproducible district generation queue.

Contributions and district requests are welcome through [GitHub Issues](https://github.com/Nonarkara/BKKx/issues). See [CONTRIBUTING.md](CONTRIBUTING.md) for the minimum handoff.

## Attribution and license

Code is released under the MIT License. Geographic data is © OpenStreetMap contributors under ODbL 1.0; supplemental building data may include Overture Maps. Arnis is Apache-2.0 licensed. Generated world distributions retain their source-data attribution in each manifest and in [NOTICE.md](NOTICE.md).
