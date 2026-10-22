import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const WORKER_SRC = readFileSync(
  fileURLToPath(new URL('../worker/index.ts', import.meta.url)),
  'utf8',
);
const DEPLOY_SRC = readFileSync(
  fileURLToPath(new URL('../scripts/deploy.sh', import.meta.url)),
  'utf8',
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

test('the deploy script stamps the id it claims to have deployed', () => {
  // wrangler's --var takes KEY:VALUE. KEY=VALUE does not fail loudly — it
  // binds a variable NAMED "KEY=VALUE", so env.KEY stays undefined and the
  // var does nothing at all. The whole feature looks deployed and is not.
  assert.ok(
    /--var\s+["']?BUILD_ID:/.test(DEPLOY_SRC),
    'the deploy script does not pass BUILD_ID to wrangler as KEY:VALUE',
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
    /status --porcelain/.test(DEPLOY_SRC),
    'the deploy script does not refuse a dirty tree',
  );
});
