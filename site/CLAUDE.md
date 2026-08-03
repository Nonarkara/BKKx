# BKKx site conventions

- `npm run dev` starts the local vinext server.
- `npm run build` creates the Cloudflare Worker bundle in `dist/`.
- Keep walkthrough data in `app/walkthrough.tsx` until a third independent view needs it.
- Do not commit Minecraft world binaries into the website bundle. Link GitHub Release assets.
- Use `#c9ff38` only for signals, selected state and primary actions.
- Preserve keyboard access and reduced-motion behavior when adding interactions.
- D1 stores aggregate pageviews only; never collect IP addresses or credentials.
