#!/usr/bin/env node
// probe-atlas.mjs — what does the atlas page actually say, and fetch?
//
// When a rendered layer stops drawing, the reason is in the console and in
// the network log, not in the source. This prints both, plus whether the
// heritage-forms chunk was fetched at all.
//
//   node probe-atlas.mjs --url=http://127.0.0.1:43119/atlas/historic-core
import { chromium } from "playwright";

const args = process.argv.slice(2);
const arg = (n, d) => {
  const hit = args.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const URL = arg("url", "http://127.0.0.1:43119/atlas/historic-core");
const AT = arg("at", "100.4914,13.7500,19");

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  locale: "th-TH", timezoneId: "Asia/Bangkok",
});
const page = await ctx.newPage();

const console_ = [];
const errors = [];
const failed = [];
const forms = [];

page.on("console", (m) => console_.push({ type: m.type(), text: m.text().slice(0, 400) }));
page.on("pageerror", (e) => errors.push({ message: String(e.message).slice(0, 400), stack: String(e.stack || "").slice(0, 600) }));
page.on("requestfailed", (r) => failed.push({ url: r.url().slice(0, 160), failure: r.failure()?.errorText }));
page.on("response", (r) => {
  if (/heritage-forms|three/i.test(r.url())) forms.push({ url: r.url().slice(0, 160), status: r.status() });
});

await page.goto(`${URL}?at=${AT}`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(15000);

const toggle = await page.$(".detail-toggle");
let pressed = null;
if (toggle) pressed = await toggle.getAttribute("aria-pressed");

console.log(`\nURL: ${URL}`);
console.log(`Old Town 3D toggle present: ${!!toggle}, aria-pressed: ${pressed}`);
console.log(`\nconsole messages (${console_.length}):`);
for (const m of console_.filter((m) => m.type === "error" || m.type === "warning").slice(0, 15)) {
  console.log(`  [${m.type}] ${m.text}`);
}
console.log(`\npage errors (${errors.length}):`);
for (const e of errors.slice(0, 8)) {
  console.log(`  ${e.message}`);
  if (e.stack) console.log(`    ${e.stack.split("\n").slice(0, 4).join("\n    ")}`);
}
console.log(`\nfailed requests (${failed.length}):`);
for (const f of failed.slice(0, 10)) console.log(`  ${f.failure} ${f.url}`);
console.log(`\nheritage-forms / three requests (${forms.length}):`);
for (const f of forms.slice(0, 12)) console.log(`  ${f.status} ${f.url}`);

await page.screenshot({ path: "/tmp/bkkx-probe-atlas.png", timeout: 90000 });
await browser.close();
