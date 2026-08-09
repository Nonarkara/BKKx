# BKKx web atlas

The public walkthrough for [atlas.nonarkara.org](https://atlas.nonarkara.org). It presents Bangkok's generated Minecraft worlds as a guided, bilingual field atlas with landmark chapters, download links and lightweight D1 pageview analytics.

## Development

```bash
npm install
npm run dev
npm run build
npm test
```

The site is built with vinext and deployed as a Cloudflare Worker through OpenAI Sites. Geographic previews and walkthrough data live in `public/images` and `app/walkthrough.tsx`; world binaries are distributed through GitHub Releases rather than the website bundle.
