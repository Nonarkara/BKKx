#!/usr/bin/env bash
# Release the BKKx site with a build id the live site reports back.
#
# The atlas stamps a build id into its page; this stamps one into the
# Worker as a var, and the Worker reports it in the x-bkkx-build header.
# The point is that "the live site is running commit X" becomes a fact
# anybody can check, not a claim somebody has to take on trust.
#
#   bash scripts/deploy.sh
#
# It refuses to release a tree with uncommitted changes: what is deployed
# must be what is committed.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -n "$(git status --porcelain)" ]; then
  echo "deploy: the working tree is dirty. Commit first — what ships must be what is committed." >&2
  git status --short >&2
  exit 1
fi

SHA="$(git rev-parse --short HEAD)"
DAY="$(date -u +%Y%m%d)"
BUILD_ID="bkkx-${DAY}-$(date -u +%s)-${SHA}"

echo "deploy: building ${BUILD_ID}"
PATH="/opt/homebrew/bin:$PATH" npm run build

echo "deploy: uploading ${BUILD_ID}"
PATH="/opt/homebrew/bin:$PATH" ./node_modules/.bin/wrangler deploy --var "BUILD_ID=${BUILD_ID}"

echo
echo "deploy: ${BUILD_ID} is live. The site reports it in the x-bkkx-build header:"
echo "deploy:   curl -sI https://bkk.nonarkara.org/ | grep -i x-bkkx-build"
