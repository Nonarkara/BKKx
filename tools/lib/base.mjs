// lib/base.mjs — the origin the instruments measure.
//
// Every MSH instrument in this folder had the production origin written into
// it as a literal. That made them usable only after a deploy, which is the
// wrong half of the loop: the point of a staged dependency upgrade is to know
// whether a build changed the RENDERING before it replaces the live one.
//
// So the origins are arguments now, with the production values as defaults.
// The defaults are the same strings that were hard-coded, so running an
// instrument with no arguments measures exactly what it measured before.
//
//   node popup-audit.mjs --origin=http://127.0.0.1:43119
//   node popup-audit.mjs --origin=http://127.0.0.1:43119 --shop-origin=http://127.0.0.1:43119
//
// Two origins, because the site is served from two hostnames: the main one
// and the shophouses proxy. Locally both are the same preview server, so
// both flags point at the same port.

const DEFAULTS = {
  origin: "https://bkk.nonarkara.org",
  shopOrigin: "https://shophouses.nonarkara.org",
};

const args = process.argv.slice(2);

function flag(name, fallback) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const origin = flag("origin", DEFAULTS.origin).replace(/\/$/, "");
const shopOrigin = flag("shop-origin", DEFAULTS.shopOrigin).replace(/\/$/, "");

/**
 * Point a production URL at the origin under test.
 *
 * The path is preserved exactly; only the origin is swapped. A URL on a host
 * the instruments do not know about is returned untouched, so an instrument
 * that reaches a third party is not silently retargeted.
 *
 * ONE REWRITE, and it is not optional. `shophouses.nonarkara.org` is served
 * by a thin proxy whose only rewrite is the root: "/" is the essay there, not
 * the home page. So on that host the front page lives at "/shophouses" on the
 * upstream app. A local preview server has no host-based rewrite, so a naive
 * origin swap sends the audit to the BKKx home page and calls it the
 * shophouses front page.
 *
 * That is not a hypothetical: it made the vertical audit report 64 cut
 * elements locally against 34 in production, because the home page was
 * measured twice and the essay page once less. The pages looked identical
 * because they were the same page. So the rewrite is reproduced here, and
 * only when the shop origin is NOT production — in production the proxy
 * already does it.
 */
export function retarget(url) {
  if (url.startsWith(DEFAULTS.shopOrigin)) {
    const rest = url.slice(DEFAULTS.shopOrigin.length);
    if (shopOrigin !== DEFAULTS.shopOrigin) {
      const [path, ...tail] = rest.split(/(?=[?#])/);
      const rewritten = path === "/" ? "/shophouses" : path;
      return shopOrigin + rewritten + tail.join("");
    }
    return shopOrigin + rest;
  }
  if (url.startsWith(DEFAULTS.origin)) {
    return origin + url.slice(DEFAULTS.origin.length);
  }
  return url;
}

/** The origin under test, for instruments that build URLs from scratch. */
export const ORIGIN = origin;
export const SHOP_ORIGIN = shopOrigin;

/** Every production URL in a list, retargeted. */
export function retargetAll(urls) {
  return urls.map(retarget);
}
