// lib/measure.mjs — a page that was not measured is not a page that passed.
//
// This is the MSH rule, applied to the instruments rather than to the site:
// a sweep whose network dropped reports UNVERIFIED, never "pass". The audits
// in this folder were the ones that had not learned it.
//
// What went wrong, concretely: the preview server died mid-run, every
// `page.goto` failed, the audit skipped each page and printed
//
//   no clamped element is cut vertically on any page checked
//
// which reads as a clean bill of health for a page nobody opened. A gate
// that can report success by measuring nothing is worse than no gate,
// because it is believed.
//
// So: a failed load is counted, named, and reported as UNVERIFIED, and the
// process exits non-zero. Silence is not a result.

/**
 * Load a page, retrying a few times. Returns true only if the page actually
 * loaded. A false return means UNVERIFIED — never "no findings".
 */
export async function loadPage(page, url, { attempts = 3, settle = 6000, wait = 2500 } = {}) {
  for (let a = 1; a <= attempts; a++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(settle);
      return true;
    } catch (e) {
      if (a === attempts) return false;
      await page.waitForTimeout(wait * a);
    }
  }
  return false;
}

/**
 * Tracks what was actually measured, so the summary can say so.
 */
export class Coverage {
  constructor(label) {
    this.label = label;
    this.loaded = 0;
    this.failed = [];
  }

  record(url, ok) {
    if (ok) this.loaded++;
    else this.failed.push(url);
  }

  get unverified() {
    return this.failed.length;
  }

  /**
   * Print the coverage line. Returns the process exit code: 1 when anything
   * went unmeasured, so a caller or a CI step cannot mistake a partial run
   * for a clean one.
   */
  summary(extra = '') {
    if (this.unverified === 0) {
      console.log(`\n${this.label}: ${this.loaded} page-viewport(s) measured, 0 unverified.${extra}`);
      return 0;
    }
    console.log(
      `\n${this.label}: ${this.loaded} page-viewport(s) measured, ${this.unverified} UNVERIFIED — not measured is not passed.`,
    );
    for (const u of this.failed) console.log(`  UNVERIFIED ${u}`);
    return 1;
  }
}
