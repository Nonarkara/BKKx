// Repository guards that must fail the build, run as the first step of `npm test`.
//
// Two things that are cheap to break silently and expensive to discover late:
//
// 1. GitHub Actions hardening. security.yml pins every action to a commit SHA
//    and declares least-privilege permissions. ci.yml did not: it ran
//    actions/checkout@v4, actions/setup-node@v4 and actions/setup-python@v5 as
//    floating tags on every pull request, including from forks. A tag is mutable
//    by whoever owns the action, and pinning is the whole point.
//
// 2. Test coverage of the test command. `npm test` names its files explicitly,
//    so a new file dropped in tests/ never runs unless somebody remembers to add
//    it. That is how a suite goes from 109 assertions to a much smaller number
//    with CI still green — and a report claiming "23 tests passed" is exactly
//    what a suite looks like after its command was quietly pointed elsewhere.
//    Every tests/*.test.mjs must be named, and every file the command names must
//    exist, so the count can never drift from the tree in either direction.
//
// Run: node scripts/verify-repo.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// site/scripts/ -> site/ is one level up; the repo root is two.
const scriptsDir = dirname(fileURLToPath(import.meta.url));
const site = join(scriptsDir, "..");
const problems = [];
const ok = [];

function fail(msg) { problems.push(msg); }
function pass(msg) { ok.push(msg); }

// ── 1. Actions hardening ────────────────────────────────────────────────────
// The workflows live at the repo root, one level above site/.
const dir = join(site, "..", ".github", "workflows");
if (!existsSync(dir)) {
  console.error(`verify-repo: no workflow directory at ${dir} — refusing to pass a check that checked nothing`);
  process.exit(2);
}

const files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
if (!files.length) {
  console.error("verify-repo: no workflow files found — the check has nothing to check");
  process.exit(2);
}

for (const f of files) {
  const src = readFileSync(join(dir, f), "utf8");

  for (const line of src.split("\n")) {
    const m = line.match(/uses:\s*([^\s#]+)/);
    if (!m) continue;
    const ref = m[1].split("@")[1] || "";
    if (!/^[0-9a-f]{40}$/.test(ref)) fail(`${f}: ${m[1]} is a tag or branch, not a commit SHA`);
  }

  if (!/^\s*permissions:/m.test(src)) {
    fail(`${f}: no permissions block, so GITHUB_TOKEN keeps its default read/write`);
  }
  if (/actions\/checkout@/.test(src) && !/persist-credentials:\s*false/.test(src)) {
    fail(`${f}: checkout leaves a usable token in .git/config for the rest of the job`);
  }
}
if (!problems.length) pass(`${files.length} workflow(s) — actions on commit SHAs, permissions declared, no credentials left on disk`);

// ── 2. Every test file is actually run ───────────────────────────────────────
{
  const testsDir = join(site, "tests");
  if (!existsSync(testsDir)) {
    console.error(`verify-repo: no tests directory at ${testsDir} — refusing to pass`);
    process.exit(2);
  }
  const onDisk = readdirSync(testsDir).filter((f) => /\.test\.m?js$/.test(f)).sort();
  if (!onDisk.length) {
    console.error("verify-repo: no test files found — a suite that runs nothing is green for the wrong reason");
    process.exit(2);
  }

  const pkg = JSON.parse(readFileSync(join(site, "package.json"), "utf8"));
  const testCmd = pkg.scripts?.test || "";
  if (!testCmd) {
    console.error("verify-repo: package.json has no test script");
    process.exit(2);
  }

  // Direction one: a test file nobody runs.
  const orphaned = onDisk.filter((f) => !testCmd.includes(f));
  for (const f of orphaned) {
    fail(`tests/${f} is never run — add it to the "test" script in package.json`);
  }

  // Direction two: the command names a file that is gone.
  const named = [...testCmd.matchAll(/(tests\/[\w.-]+\.test\.m?js)/g)].map((m) => m[1]);
  for (const n of named) {
    if (!existsSync(join(site, n))) fail(`the test script names ${n}, which does not exist`);
  }

  // Direction three: the command must not have wandered off node's test runner.
  if (!/node\s+(--experimental-strip-types\s+)?--test\b/.test(testCmd)) {
    fail(`the test script no longer runs node --test: "${testCmd}" — assert a runner this repo does not use`);
  }

  if (!problems.length) {
    pass(`${onDisk.length} test file(s) all named in npm test: ${onDisk.join(", ")}`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(`verify-repo: ${p}`);
  console.error(`\nverify-repo: ${problems.length} problem(s)`);
  process.exit(1);
}
for (const o of ok) console.log(`verify-repo: ${o}`);