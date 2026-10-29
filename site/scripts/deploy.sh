#!/usr/bin/env bash
# Release the BKKx site, and prove afterwards which bytes are live.
#
# The point of this script is not that it deploys. It is that after it
# returns, "the live site is running commit X" is a fact anybody can check
# with curl — not a claim somebody has to take on trust.
#
#   bash scripts/deploy.sh
#
# HOW THE BUILD ID SURVIVES
#
# The id is baked into the built artifact (scripts/stamp-build-id.mjs), not
# passed as a command flag. A `--var BUILD_ID:…` flag applies to the one
# command that carries it; the deploy command this repo documents everywhere
# else has no such flag, so on 26 October 2026 a release went out with an
# empty `vars` map and the live site stopped reporting its build. A stamp
# that lives in the bytes cannot be dropped by choosing a different command.
#
# The script also refuses to publish bytes it cannot identify, and refuses to
# publish uncommitted work. It refuses to refuse, however, because of an
# unrelated untracked file sitting in the repository — a guard that blocks
# every release gets bypassed, and a bypassed guard is the same as no guard.
set -euo pipefail

cd "$(dirname "$0")/.."
SITE_DIR="$(pwd)"
REPO_ROOT="$(cd .. && pwd)"

UPSTREAM="https://bkkx-site.drnon.workers.dev"
LIVE="https://bkk.nonarkara.org"

fail() {
  echo "deploy: $*" >&2
  exit 1
}

# ── 1. What ships must be what is committed ────────────────────────────────
# A modified tracked file means the bytes on the edge are not the bytes that
# were reviewed. That is the one thing this script will not negotiate.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "deploy: tracked files are modified or staged. Commit first — what ships must be what is committed." >&2
  git status --short >&2
  exit 1
fi

# An untracked file under a path the build reads WOULD change the deployed
# bytes, so it has to be committed or deleted. An untracked file anywhere else
# is a local artifact — the OSM extract at the repository root, a scratch
# build — and has no business blocking a release.
CONSUMED=(
  "site/app/"
  "site/public/"
  "site/scripts/"
  "site/worker/"
  "site/drizzle/"
  "site/db/"
  "site/package.json"
  "site/package-lock.json"
  "site/vite.config.ts"
  "site/tsconfig.json"
  "site/next.config.ts"
  "site/postcss.config.mjs"
  "site/eslint.config.mjs"
  "scripts/"
  "worlds/"
)

UNTRACKED="$(git -C "$REPO_ROOT" ls-files --others --exclude-standard --full-name)"
BLOCKING=""
LOCAL_ONLY=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  blocked=no
  for c in "${CONSUMED[@]}"; do
    case "$f" in
      "$c"*) blocked=yes; break ;;
    esac
  done
  if [ "$blocked" = yes ]; then
    BLOCKING="$BLOCKING  $f\n"
  else
    LOCAL_ONLY="$LOCAL_ONLY  $f\n"
  fi
done <<< "$UNTRACKED"

if [ -n "$BLOCKING" ]; then
  echo "deploy: these untracked files are inside paths the build reads. Commit or remove them:" >&2
  printf "$BLOCKING" >&2
  exit 1
fi

if [ -n "$LOCAL_ONLY" ]; then
  echo "deploy: ignoring untracked local files (not read by the build):"
  printf "$LOCAL_ONLY"
fi

# ── 2. Build, and stamp the artifact with the commit it came from ─────────
PATH="/opt/homebrew/bin:$PATH" npm run build

SHA="$(git rev-parse --short HEAD)"
node scripts/stamp-build-id.mjs --check
BUILD_ID="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync("dist/server/wrangler.json","utf8")).vars.BUILD_ID)')"

if [[ "$BUILD_ID" == *"$SHA" ]]; then
  echo "deploy: artifact stamped ${BUILD_ID} (commit ${SHA})"
else
  fail "the artifact stamp ${BUILD_ID} does not carry the commit ${SHA} that is being released."
fi

# ── 3. Upload ──────────────────────────────────────────────────────────────
echo
echo "deploy: uploading ${BUILD_ID}"
PATH="/opt/homebrew/bin:$PATH" ./node_modules/.bin/wrangler deploy \
  -c dist/server/wrangler.json \
  --name bkkx-site

# ── 4. Prove it ────────────────────────────────────────────────────────────
# A deploy that does not prove its own provenance is not a deploy. The header
# is the only evidence that the bytes at the edge are the bytes that were
# built, so the script reads it back and fails if it is not there.
#
# The custom domain caches HTML for up to a minute, so it can legitimately
# answer with the previous build for a short while. The workers.dev URL is not
# cached the same way, so it is checked first and the domain is polled until
# the edge catches up.
probe() {
  local url="$1"
  curl -sI --max-time 20 "$url" 2>/dev/null \
    | tr -d '\r' \
    | grep -i '^x-bkkx-build:' \
    | sed 's/^[Xx]-*[Bb]kkx-[Bb]uild: *//' \
    | head -1
}

wait_for_build() {
  local url="$1" label="$2" tries="${3:-20}" seen=""
  for _ in $(seq 1 "$tries"); do
    seen="$(probe "$url" || true)"
    if [ "$seen" = "$BUILD_ID" ]; then
      echo "deploy: ${label} reports ${seen}"
      return 0
    fi
    sleep 3
  done
  echo "deploy: ${label} last reported '${seen:-nothing}', expected '${BUILD_ID}'" >&2
  return 1
}

echo
echo "deploy: verifying the live site reports ${BUILD_ID}"
wait_for_build "$UPSTREAM" "upstream worker" 20
wait_for_build "$LIVE" "bkk.nonarkara.org" 20

echo
echo "deploy: ${BUILD_ID} is live and says so. Check it yourself:"
echo "deploy:   curl -sI ${LIVE}/ | grep -i x-bkkx-build"
