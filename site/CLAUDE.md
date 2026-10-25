# BKKx site conventions

- `npm run dev` starts the local vinext server.
- `npm run build` creates the Cloudflare Worker bundle in `dist/`.
- Keep walkthrough data in `app/walkthrough.tsx` until a third independent view needs it.
- Do not commit Minecraft world binaries into the website bundle. Link GitHub Release assets.
- Use `#c9ff38` only for signals, selected state and primary actions — and
  only on the dark Console surfaces (`/worlds`, `/atlas/*`). The Editorial
  register surfaces use one accent, the oxide seal `#8c2f23`.
- **BKKx 1.0.0** also exposes the Dao × Palette tokens in `:root` —
  `--palette-rail-blue`, `--palette-paper-*`, `--palette-seal[-deep]`,
  `--palette-gold`, `--palette-jade`, `--palette-signal-yellow`. The
  case-for-bangkok page opts into the Palette seal as its accent;
  the heritage register stays on the oxide seal until a page chooses
  Palette explicitly.
- Interface typography is **Jost + Prompt** (Latin + non-looped Thai),
  bundled as local assets by the production build. Jost's fallback must
  name Prompt before a generic family, or the generic steals Thai glyphs.
  Numbers use tabular figures. Source Serif 4 remains only for the existing
  English long-form essay. Preserve the typology page's Chinese font.
  Never Inter/Roboto/Poppins/Montserrat/Open Sans/Lato.
- Preserve keyboard access and reduced-motion behavior when adding interactions.
- **BKKx 1.0.0** ships a real defense-in-depth header set on every HTML
  page from the worker (worker/index.ts `withSecurityHeaders`): CSP
  built from the actual origin inventory, nosniff, SAMEORIGIN,
  Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy
  off for camera/mic/geo. Atlas sister project did this in
  eed2077 / 84b4428 / 0f9c0bd; BKKx 1.0 ships the same set.
- D1 stores pageview events only — path, referrer, country, language,
  timestamp. Never IP addresses, user-agent strings or credentials, and
  nothing that identifies a person across requests.

## The new front door (2026-08-11)

The 3D map IS the homepage. `app/page.tsx` renders a thin Editorial shell
that hosts a dark Console iframe of `/atlas/historic-core?embed=1` — a
path on THIS domain, never `https://atlas.nonarkara.org`. Pointing the
iframe at the atlas domain is what made bkk.nonarkara.org look like the
atlas to its owner; keep it relative. The
nine heritage quarters are quick-jump chips in the side panel that fly
the iframe to a precise center+zoom (atlas accepts `?at=lng,lat,zoom`).
The two Minecraft worlds are side offers in the masthead, not a section.

The Editorial register content (the 571 Fine Arts Department
monuments, the nine quarters, the seven walks) lives at `/heritage`
now, and at the drill-down pages `/areas/[slug]` and `/walks/[slug]`.
Anyone who saved the old URL `/heritage` (which used to redirect
to `/`) now lands on the actual register page.

The deliberate visual split is **Editorial frames, Console focus**:
the shell chrome stays in the bkk Editorial register (paper, Sao
Chingcha type, oxide seal accent); the iframe
shows the dark CONSOLE atlas (ink, signal yellow for buildings,
amber for Buzz, alarm red for live incidents). Two design systems
deliberately held apart — the bkk shell's job is to frame the atlas,
not to compete with it.

**Hardcoded for the future**: no BKKx surface shall look templated.
Every page is a unique implementation inside the Axiom Design Core
presets — the Editorial preset for the register, the Console preset
for the atlas, the heritage shell for the bridge. If a new page
arrives looking generic, that is a bug.
