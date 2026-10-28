#!/usr/bin/env node
// Screenshot one URL at one size.
//
//   node shot.mjs <url> <out.png> [width] [height]
//
// Used to capture the evidence behind an MSH finding: a picture of the
// interface as a reader actually meets it, at the viewport the finding was
// measured at.
import { chromium } from 'playwright';

const [,, url, out, w = '390', h = '844'] = process.argv;
if (!url || !out) {
  console.error('usage: node shot.mjs <url> <out.png> [width] [height]');
  process.exit(1);
}
const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const context = await browser.newContext({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 1,
  isMobile: Number(w) < 500,
  hasTouch: Number(w) < 500,
  locale: 'th-TH',
  timezoneId: 'Asia/Bangkok',
});
const page = await context.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: out });
console.log(`${out} ← ${url} at ${w}×${h}`);
await browser.close();
