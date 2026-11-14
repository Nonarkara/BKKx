#!/usr/bin/env node
// diff-sweeps.mjs — two sweep reports, compared field by field.
//
// A sweep that reports "0 failures" on both sides proves only that each
// run found no failure. It does not prove the two runs MEASURED the same
// thing: one run may have loaded a page the other never reached, or found a
// clipped element the other did not, and "0 failures" would hide it.
//
// So this walks both reports route by route and viewport by viewport and
// reports every difference: a status that changed, a finding that appeared
// or vanished, a geometry value that moved.
//
//   node diff-sweeps.mjs /tmp/before/sweep-report.json /tmp/after/sweep-report.json
import { readFileSync } from "node:fs";

const [beforePath, afterPath] = process.argv.slice(2);
const before = JSON.parse(readFileSync(beforePath, "utf8"));
const after = JSON.parse(readFileSync(afterPath, "utf8"));

// Key by the route the record MEASURES, not by its position.
//
// The records are stored in an array whose order is the order the URLs were
// discovered, and that order is not stable between two runs of the same
// site. Keying by index compares page 16 of one run against page 16 of the
// other — which may be a different page entirely — and calls the difference
// a change. That is how a diff invents findings.
const byRoute = (report) => {
  const map = new Map();
  for (const rec of Object.values(report.records || {})) {
    map.set(rec.route, rec);
  }
  return map;
};

const beforeByRoute = byRoute(before);
const afterByRoute = byRoute(after);

const rb = [...beforeByRoute.keys()].sort();
const ra = [...afterByRoute.keys()].sort();

const onlyBefore = rb.filter((r) => !afterByRoute.has(r));
const onlyAfter = ra.filter((r) => !beforeByRoute.has(r));

console.log(`before: ${before.checked}/${before.total} routes, ${before.failures.length} failures`);
console.log(`after : ${after.checked}/${after.total} routes, ${after.failures.length} failures`);
console.log(`routes only in before: ${onlyBefore.length}${onlyBefore.length ? ' → ' + JSON.stringify(onlyBefore.slice(0, 8)) : ''}`);
console.log(`routes only in after : ${onlyAfter.length}${onlyAfter.length ? ' → ' + JSON.stringify(onlyAfter.slice(0, 8)) : ''}`);

const findings = (rec, vp) => {
  const v = rec.viewports?.[vp];
  if (!v) return null;
  const parts = [
    `status=${v.status}`,
    `overflow=${(v.overflow || []).length}`,
    `clipped=${(v.clipped || []).length}`,
    `sideScroll=${v.sideScroll ?? v.hScroll ?? 'n/a'}`,
  ];
  return parts.join(' ');
};

let compared = 0;
const diffs = [];
for (const route of rb) {
  if (!afterByRoute.has(route)) continue;
  for (const vp of Object.keys(beforeByRoute.get(route).viewports || {})) {
    compared++;
    const fb = findings(beforeByRoute.get(route), vp);
    const fa = findings(afterByRoute.get(route), vp);
    if (fb !== fa) diffs.push({ route, vp, before: fb, after: fa });
  }
}

console.log(`\nroute×viewport comparisons: ${compared}`);
console.log(`differences: ${diffs.length}`);
for (const d of diffs.slice(0, 40)) {
  console.log(`  ${d.route} @${d.vp}\n    before ${d.before}\n    after  ${d.after}`);
}
if (diffs.length > 40) console.log(`  … and ${diffs.length - 40} more`);

// The deep check: the actual finding lists, not just their sizes.
const deep = [];
for (const route of rb) {
  if (!afterByRoute.has(route)) continue;
  for (const vp of Object.keys(beforeByRoute.get(route).viewports || {})) {
    const vb = beforeByRoute.get(route).viewports[vp] || {};
    const va = afterByRoute.get(route).viewports[vp] || {};
    for (const key of ['overflow', 'clipped']) {
      const lb = (vb[key] || []).map((x) => JSON.stringify(x));
      const la = (va[key] || []).map((x) => JSON.stringify(x));
      const onlyB = lb.filter((x) => !la.includes(x));
      const onlyA = la.filter((x) => !lb.includes(x));
      if (onlyB.length || onlyA.length) {
        deep.push({ route, vp, key, onlyBefore: onlyB.length, onlyAfter: onlyA.length, sample: (onlyA[0] || onlyB[0] || '').slice(0, 180) });
      }
    }
  }
}
console.log(`\nfinding-level differences: ${deep.length}`);
for (const d of deep.slice(0, 30)) {
  console.log(`  ${d.route} @${d.vp} ${d.key}: only-before=${d.onlyBefore} only-after=${d.onlyAfter}`);
  if (d.sample) console.log(`      ${d.sample}`);
}
if (deep.length > 30) console.log(`  … and ${deep.length - 30} more`);

console.log(
  deep.length === 0 && diffs.length === 0 && onlyBefore.length === 0 && onlyAfter.length === 0
    ? '\nIDENTICAL: the two runs measured the same surface and found the same findings.'
    : '\nDIFFERENT: the two runs are not interchangeable — read the differences above.',
);
