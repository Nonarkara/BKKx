// GitHub Actions hardening check.
//
// security.yml in this repo pins every action to a commit SHA and declares
// least-privilege permissions. ci.yml did not: it ran actions/checkout@v4,
// actions/setup-node@v4 and actions/setup-python@v5 as floating tags on every
// pull request, including from forks. A tag is mutable by whoever owns the
// action — pinning is the whole point, and it is cheap to keep honest.
//
// Run: node scripts/verify-workflows.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const site = dirname(fileURLToPath(import.meta.url));
// site/scripts/ -> site/ -> repo root. Two levels, not one: the workflows live
// at the root, not inside site/.
const dir = join(site, "..", "..", ".github", "workflows");
if (!existsSync(dir)) {
  console.error(`verify-workflows: no workflow directory at ${dir} — refusing to pass a check that checked nothing`);
  process.exit(2);
}
const problems = [];

const files = readdirSync(dir).filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"));
if (!files.length) {
  console.error("verify-workflows: no workflow files found — the check has nothing to check");
  process.exit(2);
}

for (const f of files) {
  const src = readFileSync(join(dir, f), "utf8");

  for (const line of src.split("\n")) {
    const m = line.match(/uses:\s*([^\s#]+)/);
    if (!m) continue;
    const ref = m[1].split("@")[1] || "";
    if (!/^[0-9a-f]{40}$/.test(ref)) problems.push(`${f}: ${m[1]} is a tag or branch, not a commit SHA`);
  }

  if (!/^\s*permissions:/m.test(src)) {
    problems.push(`${f}: no permissions block, so GITHUB_TOKEN keeps its default read/write`);
  }
  if (/actions\/checkout@/.test(src) && !/persist-credentials:\s*false/.test(src)) {
    problems.push(`${f}: checkout leaves a usable token in .git/config for the rest of the job`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(`verify-workflows: ${p}`);
  console.error(`\nverify-workflows: ${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`verify-workflows: ${files.length} workflow(s) — all actions on a commit SHA, permissions declared, no credentials left on disk`);