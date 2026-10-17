# Data and world attribution

BKKx source code is licensed under the MIT License. The generated Minecraft worlds combine software output with geographic source data and retain the following attribution:

- OpenStreetMap data: © OpenStreetMap contributors, available under the Open Database License (ODbL) 1.0.
- Overture Maps building data: subject to the Overture Maps Foundation data licenses applicable to each theme.
- ESA WorldCover land-cover data may be used by the generator.
- Arnis generator: Apache License 2.0, maintained at https://github.com/louis-e/arnis.
- Minecraft is a trademark of Microsoft/Mojang. BKKx is an independent open-source project and is not affiliated with or endorsed by Microsoft or Mojang.

Each distributed world includes `metadata.json` and `bkkx-manifest.json` with its exact geographic bounds, scale and generation details.

## Ideas credited

- Hiding the base map's own building boxes wherever BKKx draws its Old Town 3D, tested against a published cover polygon (`site/app/atlas/[district]/old-town-cover.ts`), follows a public write-up by the Longdo Map 3D team about Longdo3D v2 (transit.longdo.com, Facebook post of 17 October 2026). The idea is credited; no Longdo code or data is used.
