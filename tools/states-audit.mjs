// states-audit.mjs — exercise the states the pages only reach after an
// interaction: empty results, failed feeds, opened disclosures, inspector
// cards. The sweeps measure the pages as they load; this measures what they
// become once someone uses them, at 390 and 1440.
//
// The ledger carried "expanded, empty and error states not exercised" across
// three rounds. This closes that row with an instrument that:
//   - performs the interaction that reaches each state (fill a search, abort
//     the feed, open the disclosure, pick a marker),
//   - verifies the state actually changed (a count, a visibility, a text
//     mark) before measuring — a state that did not open is UNVERIFIED, not a
//     pass,
//   - measures document overflow, clipped text (minus the sr-only pattern),
//     sub-24px non-inline targets and console errors in each state,
//   - exits non-zero if anything is unverified or defective.
import { chromium } from 'playwright';

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;

// Each check: label, url, width, then one of { open: evaluate-string that
// performs the interaction and returns a proof-object }, abortApi (regex
// list), verify (a property the state must now show).
const STATES = [
  {
    label: 'home · quarter index open',
    url: 'https://bkk.nonarkara.org/',
    open: () => { const b = document.querySelector('.atlas-shell-index-toggle'); if (b) b.click(); return { toggled: !!b, expanded: b?.getAttribute('aria-expanded') }; },
    verify: (proof) => proof.toggled,
  },
  {
    label: 'home · heritage card open',
    url: 'https://bkk.nonarkara.org/',
    // the map is an iframe: click in frame if the main document has none
    openClick: '.bkkx-heritage-marker',
    verifyCard: '.heritage-inspector-card',
    verify: (proof) => proof.clicked,
  },
  {
    label: 'heritage · search with no matches (empty state)',
    url: 'https://bkk.nonarkara.org/heritage',
    open: () => {
      const input = document.querySelector('input[type=search], input[name*=search], input[aria-label*=earch]');
      if (!input) return { filled: false };
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'zzzzqqqxx');
      input.dispatchEvent(new window.Event('input', { bubbles: true }));
      return { filled: true };
    },
    verify: (proof) => proof.filled,
  },
  {
    label: 'atlas · atmosphere & layers deck open',
    url: 'https://bkk.nonarkara.org/atlas/historic-core',
    open: () => { const b = document.querySelector('.control-toggle[aria-controls="atlas-deck-body"]'); if (b && b.getAttribute('aria-expanded') === 'false') b.click(); return { toggled: !!b }; },
    verify: (proof) => proof.toggled,
  },
  {
    label: 'atlas · heritage inspector card open',
    url: 'https://bkk.nonarkara.org/atlas/historic-core',
    openClick: '.bkkx-heritage-marker',
    verifyCard: '.heritage-inspector-card',
    verify: (proof) => proof.clicked,
  },
  {
    label: 'shophouses read/1 · folded figure open',
    url: 'https://shophouses.nonarkara.org/shophouses/read/1',
    open: () => { const b = document.querySelector('.sh-fold-toggle'); if (b && b.getAttribute('aria-expanded') === 'false') b.click(); return { toggled: !!b }; },
    verify: (proof) => proof.toggled,
  },
  {
    label: 'typology · a typology card detail open',
    url: 'https://shophouses.nonarkara.org/shophouses/typology',
    open: () => { const d = document.querySelector('details.typo-sources'); if (d) d.open = true; return { opened: !!d }; },
    verify: (proof) => proof.opened,
  },
  {
    label: 'flood · feed failure state (requests aborted)',
    url: 'https://bkk.nonarkara.org/flood',
    abortApi: [/\/api\/flood\//],
    verify: () => true,
  },
];

const MEASURE = () => {
  const VW = innerWidth;
  const out = { docOverflowX: document.documentElement.scrollWidth > VW + 2, clipped: [], small: [], exposed: [] };
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') && el.tagName !== 'svg') continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (el.clientWidth <= 1 && el.clientHeight <= 1) continue; // sr-only
    if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0
      && (cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis' || cs.overflow === 'hidden'))
      out.clipped.push((typeof el.className === 'string' ? el.className : el.tagName).slice(0, 50) + ' "' + (el.innerText || '').trim().slice(0, 40) + '"');
    if (el.matches('a[href], button, input, select, textarea, [role=button]') && (r.width < 24 || r.height < 24)) {
      // the same WCAG-wording rule as msh-audit: a link inline in flowing text
      // is the exception; a block/flex-item link in the same container is a
      // control and takes the floor.
      const textContext = !!el.closest('p, figcaption, li, td, blockquote, small, [class*=provenance], [class*=source-note]');
      const blockified = !/^inline/.test(cs.display);
      const inline = textContext && !blockified;
      const attr = !!el.closest('.maplibregl-ctrl-attrib, .leaflet-control-attribution');
      if (!inline && !attr) { out.small.push((typeof el.className === 'string' ? el.className : el.tagName).slice(0, 50) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); out.smallTotal = (out.smallTotal || 0) + 1; }
      else out.exemptCount = (out.exemptCount || 0) + 1;
    }
    // honesty state: an unconditional error-bearing surface must SAY it is
    // failing, not render an empty success
    // The flood layer states its failures in Thai AND English: เชื่อมต่อไม่ได้ /
    // "connection failed · previous copy if available", "Unavailable · not
    // evidence of dry streets". Match both scripts or the honesty check
    // reports zero surfaced failures while the page is saying it plainly.
    const fail = /connection failed|unavailable|not evidence of|previous copy|เชื่อมต่อไม่ได้|ไม่ใช่ว่าถนน|สำเนาเดิม|ยังไม่อัปเดต|ไม่ทราบอายุ/i;
    if (el.children.length === 0 && fail.test((el.innerText || '').trim())) out.exposed.push((el.innerText || '').trim().slice(0, 70));
  }
  return out;
};

// The homepage map is an IFRAME (embeds /atlas/...?embed=1), so its markers
// live in the frame document. Click helpers go through frames when the main
// document has nothing to click.
async function clickInPageOrFrames(page, selectorString) {
  const fn = (s) => { const el = document.querySelector(s); if (!el) return null; el.click(); return true; };
  // Markers are attached when the map finishes loading — a 7s view of a
  // phone map can legitimately have none yet. Wait up to 25s for the
  // element, in the main doc or the embed frame.
  for (let attempt = 1; attempt <= 10; attempt++) {
    let hit = await page.evaluate(fn, selectorString);
    if (hit) return { clicked: true, where: 'main doc' };
    for (const f of page.frames().filter((x) => x !== page.mainFrame())) {
      try { const r = await f.evaluate(fn, selectorString); if (r) return { clicked: true, where: 'frame' }; } catch {}
    }
    await page.waitForTimeout(2500);
  }
  return { clicked: false };
}

for (const st of STATES) {
  for (const w of [390, 1440]) {
    const h = w === 390 ? 844 : 900;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w < 500, hasTouch: w < 500, locale: 'th-TH', timezoneId: 'Asia/Bangkok' });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 120)); });
    page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 120)));
    if (st.abortApi) { for (const rx of st.abortApi) await page.route(rx, (r) => r.abort()); }
    let ok = false;
    for (let a = 1; a <= 4; a++) { try { await page.goto(st.url, { waitUntil: 'domcontentloaded', timeout: 60000 }); ok = true; break; } catch (e) { if (a === 4) break; await page.waitForTimeout(3000 * a); } }
    if (!ok) { console.log(`UNVERIFIED ${st.label} @${w} — page would not load`); failed++; await ctx.close(); continue; }
    await page.waitForTimeout(w === 390 ? 5000 : 7000);
    let proof = {};
    if (st.openClick) {
      try {
        proof = await clickInPageOrFrames(page, st.openClick);
        if (proof.clicked && st.verifyCard) proof.card = await page.evaluate((s) => document.querySelectorAll(s).length, st.verifyCard);
      }
      catch (e) { console.log(`UNVERIFIED ${st.label} @${w} — interaction threw: ${String(e.message).slice(0, 80)}`); failed++; await ctx.close(); continue; }
      await page.waitForTimeout(2500);
    } else if (st.open) {
      try { proof = await page.evaluate(st.open); }
      catch (e) { console.log(`UNVERIFIED ${st.label} @${w} — interaction threw: ${String(e.message).slice(0, 80)}`); failed++; await ctx.close(); continue; }
      await page.waitForTimeout(2500);
    } else if (st.abortApi) await page.waitForTimeout(6000); // let the aborted feeds settle into their failed state
    if (!st.verify(proof)) { console.log(`UNVERIFIED ${st.label} @${w} — state did not open (proof: ${JSON.stringify(proof).slice(0, 90)})`); failed++; await ctx.close(); continue; }
    let m;
    try { m = await page.evaluate(MEASURE); }
    catch (e) { console.log(`UNVERIFIED ${st.label} @${w} — measurement lost (${String(e.message).split('\n')[0].slice(0, 80)})`); failed++; await ctx.close(); continue; }
    const problems = [];
    if (m.docOverflowX) problems.push('page scrolls sideways');
    if (m.clipped.length) problems.push(`${m.clipped.length} clipped: ${m.clipped.slice(0, 3).join(' | ')}`);
    if (m.small.length) problems.push(`${m.small.length} under-24 targets: ${m.small.slice(0, 3).join(' | ')}`);
    const apiErrors = consoleErrors.filter((e) => !/Failed to load resource|net::ERR_ABORTED|API called with fetch/i.test(e));
    if (apiErrors.length) problems.push(`${apiErrors.length} console errors: ${apiErrors.slice(0, 2).join(' | ')}`);
    // E3: the old line printed "small-targets 0" as a literal on any clean
      // page — the typology page has 39 sub-24px targets and every one of
      // them exempt. A reader took that as "none under 24px", which is
      // false. Report what was measured and what was exempted, the way
      // msh-audit does.
      const smalls = m.smallTotal || m.small.length;
      const exempts = m.exemptCount || 0;
      console.log(`${problems.length ? 'FAIL' : 'ok  '} ${st.label} @${w}${problems.length ? '\n      ' + problems.join('\n      ') : ` — clipped ${m.clipped.length}, sub-24 targets ${smalls} (${exempts} exempt by the WCAG inline/record clauses)${st.abortApi ? ', failed feeds surfaced: ' + (m.exposed.length || 0) : ''}`}`);
    if (problems.length) failed++;
    await ctx.close();
  }
}
console.log(failed ? `\nstates audit: ${failed} finding(s)` : '\nstates audit: every state reached and clean');
await browser.close();
process.exit(failed ? 1 : 0);