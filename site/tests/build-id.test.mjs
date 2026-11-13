import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const WORKER_SRC = readFileSync(
  fileURLToPath(new URL('../worker/index.ts', import.meta.url)),
  'utf8',
);
const DEPLOY_SRC = readFileSync(
  fileURLToPath(new URL('../scripts/deploy.sh', import.meta.url)),
  'utf8',
);
const STAMP_PATH = fileURLToPath(new URL('../scripts/stamp-build-id.mjs', import.meta.url));
const STAMP_SRC = existsSync(STAMP_PATH) ? readFileSync(STAMP_PATH, 'utf8') : '';
const PKG = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8'),
);

test('the Worker reports which build is live', () => {
  // "The live site is running commit X" has to be checkable, not claimed.
  assert.ok(
    /BUILD_ID\??:\s*string/.test(WORKER_SRC),
    'the Env interface does not declare BUILD_ID',
  );
  assert.ok(
    /headers\.set\(\s*["']x-bkkx-build["']/.test(WORKER_SRC),
    'the Worker never sets the x-bkkx-build header',
  );
});

test('the build bakes the id into the artifact, not into a command flag', () => {
  // wrangler's --var BUILD_ID:x applies to the one command that carries it.
  // The upload command this repo documents everywhere else has no such flag
  // and the built manifest's vars map is empty, so on 26 October 2026 a
  // release went out and the live site stopped reporting its build. A stamp
  // that lives in the bytes cannot be dropped by choosing another command.
  assert.ok(existsSync(STAMP_PATH), 'scripts/stamp-build-id.mjs does not exist');
  assert.ok(
    /vars/.test(STAMP_SRC) && /BUILD_ID/.test(STAMP_SRC),
    'the stamp script does not write a BUILD_ID var into the built manifest',
  );
  assert.ok(
    /stamp-build-id\.mjs/.test(PKG.scripts?.build ?? ''),
    'the build does not stamp the artifact, so a build made by hand ships an unidentifiable Worker',
  );
});

test('the deploy script stamps the id it claims to have deployed', () => {
  // This test used to assert that deploy.sh contained "--var BUILD_ID:", which
  // it did — in a COMMENT explaining why the flag is not the mechanism. The
  // real mechanism is that the id is baked into the built manifest, and the
  // assertion passed whether or not that was still true.
  //
  // So assert the chain that actually runs, end to end:
  //   the stamp script writes vars.BUILD_ID into the built manifest →
  //   the deploy script uploads THAT manifest →
  //   the Worker reads env.BUILD_ID and sets the header from it →
  //   the deploy script reads the header back and compares it to the id.
  assert.ok(
    /\.vars\b/.test(STAMP_SRC) && /BUILD_ID\s*[:=]/.test(STAMP_SRC),
    'the stamp script does not write a BUILD_ID var into the built manifest',
  );
  assert.ok(
    /BUILD_ID/.test(WORKER_SRC) && /env\.BUILD_ID/.test(WORKER_SRC),
    'the Worker does not read the build id out of its environment',
  );
  assert.ok(
    /x-bkkx-build/.test(WORKER_SRC),
    'the Worker does not report the build id in a header',
  );
  assert.ok(
    /dist\/server\/wrangler\.json/.test(DEPLOY_SRC),
    'the deploy script does not upload the built manifest, so the stamp baked into it would never reach the Worker',
  );
  assert.ok(
    !/--var\s+["']?BUILD_ID=/.test(DEPLOY_SRC),
    'the deploy script passes BUILD_ID with "=", which wrangler binds as a variable NAMED "BUILD_ID=..."',
  );
  assert.ok(
    /git rev-parse --short HEAD/.test(DEPLOY_SRC),
    'the build id does not carry the commit it was built from',
  );
  assert.ok(
    /status --porcelain|ls-files --others/.test(DEPLOY_SRC),
    'the deploy script does not refuse a dirty tree',
  );
});

test('the deploy script proves the live site is running what it uploaded', () => {
  // A deploy that cannot say which bytes are live is a deploy nobody can
  // check. The script has to read the id back off the live site and fail if
  // it is not there — otherwise the stamp is a claim, not evidence.
  assert.ok(
    /x-bkkx-build/.test(DEPLOY_SRC),
    'the deploy script never reads the x-bkkx-build header back',
  );
  assert.ok(
    /curl/.test(DEPLOY_SRC),
    'the deploy script does not probe the live site at all',
  );
  assert.ok(
    /bkk\.nonarkara\.org/.test(DEPLOY_SRC),
    'the deploy script does not verify the real domain, only some other URL',
  );
  // Three public domains serve these bytes. A release that checked two of
  // them could exit 0 with the third still on an older build.
  assert.ok(
    /shophouses\.nonarkara\.org/.test(DEPLOY_SRC),
    'the deploy script does not verify the shophouse domain, so a release can be half-done',
  );
  assert.ok(
    /workers\.dev/.test(DEPLOY_SRC),
    'the deploy script does not verify the upstream worker',
  );
});

test('the dirty-tree guard does not block on files the build never reads', () => {
  // The guard once refused to release anything while an unrelated untracked
  // OSM extract sat at the repository root. A guard that blocks every
  // release gets bypassed, and a bypassed guard is the same as no guard.
  // It must still refuse tracked modifications.
  assert.ok(
    /git diff --quiet/.test(DEPLOY_SRC),
    'the deploy script does not refuse modified tracked files',
  );
  const blocksEverything = /git status --porcelain\)\s*;?\s*then/.test(DEPLOY_SRC);
  assert.ok(
    !blocksEverything,
    'the deploy script refuses every untracked file; it must only refuse the ones the build reads',
  );
  assert.ok(
    /CONSUMED/.test(DEPLOY_SRC),
    'the deploy script does not say which paths the build actually reads',
  );
});

test('no documented upload path drops the stamp', () => {
  // Every place in the repo that tells somebody how to upload must go
  // through the release script, or through an artifact that already carries
  // the id. A hand-rolled upload is how the stamp was lost in the first
  // place.
  const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
  const candidates = [
    'context.md',
    'README.md',
    'site/README.md',
    'scripts/add-3d-atlas.sh',
    'edge-proxy/src/index.ts',
  ];
  for (const rel of candidates) {
    const abs = new URL(rel, `file://${repoRoot}`);
    if (!existsSync(fileURLToPath(abs))) continue;
    const src = readFileSync(fileURLToPath(abs), 'utf8');
    src.split('\n').forEach((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('#') || trimmed.startsWith('//')) return; // a comment
      if (!/wrangler\s+deploy/.test(trimmed)) return;
      const uploadsArtifact = /dist\/server\/wrangler\.json/.test(trimmed);
      const goesThroughScript = /deploy\.sh/.test(trimmed);
      assert.ok(
        !uploadsArtifact || goesThroughScript,
        `${rel}:${i + 1} uploads the built manifest directly, which leaves the build id behind — route it through site/scripts/deploy.sh`,
      );
    });
  }
});
