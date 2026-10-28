#!/bin/sh
# add-3d-atlas.sh — operator-runnable pipeline for the BKKx 3D atlas page.
#
# What this does (and why it exists):
#   The 3D atlas is a MapLibre-driven, browser-native view of every BKKx
#   world. It is meant to be the no-install entry point to the city; the
#   Minecraft Java world download remains the deep tier. This script is
#   the single command to:
#     1. confirm the atlas page files are in place,
#     2. install or refresh the maplibre-gl dependency,
#     3. build the site,
#     4. run the rendered-html tests against the new route, and
#     5. (optional) package a deploy archive ready for Codex hosting.
#
# Usage:
#   ./scripts/add-3d-atlas.sh              # build + test
#   ./scripts/add-3d-atlas.sh install      # also run npm install
#   ./scripts/add-3d-atlas.sh check        # only verify files + deps
#   ./scripts/add-3d-atlas.sh package      # build + test + create deploy archive
#   ./scripts/add-3d-atlas.sh deploy-orphan  # deploy to personal Cloudflare (preview only)
#
# Re-run after editing any atlas-related file, after adding a new
# district to site/app/walkthrough-data.ts, or before deploying.

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
root_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
site_dir="$script_dir/../site"
atlas_page="$site_dir/app/atlas/[district]/page.tsx"
atlas_view="$site_dir/app/atlas/[district]/AtlasView.tsx"

usage() {
  cat >&2 <<'EOF'
Usage: $0 [install|check|package|deploy|deploy-orphan]
  (default)       Run build + tests against the 3D atlas page.
  install         Run `npm install` first to refresh maplibre-gl.
  check           Only verify the atlas files and dependency are present.
  package         Build, test, and emit a Codex deploy archive under dist/.
  deploy          Build and deploy to PRODUCTION: Worker `bkkx-site`, which
                  serves bkk.nonarkara.org through edge-proxy/. This is
                  the deploy that counts.
  deploy-orphan   Build and deploy to the preview Worker `bkkx-preview`.
                  Not production.
EOF
  exit 2
}

[ "$#" -le 1 ] || usage

action="${1:-build}"

say() { printf '\n[3d-atlas] %s\n' "$1"; }
fail() { printf '\n[3d-atlas] ERROR: %s\n' "$1" >&2; exit 1; }

say "Site directory : $site_dir"
[ -d "$site_dir" ] || fail "site/ directory not found at $site_dir"
[ -f "$atlas_page" ] || fail "missing $atlas_page"
[ -f "$atlas_view" ] || fail "missing $atlas_view"

if [ ! -d "$site_dir/node_modules" ] || [ "$action" = "install" ]; then
  say "Installing site dependencies (this can take a minute)..."
  (cd "$site_dir" && npm install)
else
  say "Verifying maplibre-gl is installed..."
  if [ ! -d "$site_dir/node_modules/maplibre-gl" ]; then
    fail "maplibre-gl missing under site/node_modules. Run: $0 install"
  fi
fi

if [ "$action" = "check" ]; then
  say "Files + dependency OK. Run $0 (no args) to build + test."
  exit 0
fi

if [ "$action" = "deploy" ] || [ "$action" = "deploy-orphan" ]; then
  say "Building site (vinext → Cloudflare Worker bundle)..."
  (cd "$site_dir" && npm run build)

  # The Worker name must be explicit. `site/package.json` is named
  # "site-creator-vinext-starter", so a bare `wrangler deploy` publishes
  # to a stray Worker of that name that nothing routes to — which is
  # exactly what happened 2026-10-03 → 10-14: the deploy looked
  # successful and bkk.nonarkara.org never moved.
  if [ "$action" = "deploy" ]; then
    say "Deploying to production Worker bkkx-site (serves bkk.nonarkara.org via edge-proxy)..."
    # site/scripts/deploy.sh is the production release path. It builds, bakes
    # the build id into the artifact, deploys, and then reads the id back off
    # the live site to prove the bytes at the edge are the bytes that shipped.
    # A bare `wrangler deploy -c site/dist/server/wrangler.json` leaves the
    # `vars` map empty, so the live site stops reporting which build it is —
    # which is exactly what happened on 2026-10-26.
    (cd "$site_dir" && bash scripts/deploy.sh)
    exit 0
  fi

  say "Deploying to preview Worker (NOT production)..."
  (cd "$site_dir" && npx wrangler deploy --name bkkx-preview)
  say "Preview deploy complete at https://bkkx-preview.drnon.workers.dev"
  say "For production use: $0 deploy"
  exit 0
fi

say "Building site (vinext → Cloudflare Worker bundle)..."
(cd "$site_dir" && npm run build)

say "Running rendered-html tests..."
(cd "$site_dir" && node --test tests/rendered-html.test.mjs)

if [ "$action" = "package" ]; then
  say "Packaging Codex deploy archive..."
  archive="$site_dir/dist/.openai/bkkx-atlas-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
  stage=$(mktemp -d)
  trap 'rm -rf "$stage"' EXIT
  mkdir -p "$stage/dist/.openai"
  cp -R "$site_dir/dist/." "$stage/dist/"
  cp "$site_dir/.openai/hosting.json" "$stage/dist/.openai/hosting.json"
  if [ -d "$site_dir/drizzle" ]; then
    mkdir -p "$stage/dist/.openai/drizzle"
    cp -R "$site_dir/drizzle/." "$stage/dist/.openai/drizzle/"
  fi
  mkdir -p "$(dirname "$archive")"
  tar -C "$stage" -czf "$archive" dist
  say "Archive: $archive"
  say "This archive is only needed for the legacy Codex Sites path. The site"
  say "deploys straight to Cloudflare now (see context.md 'Deploy') — prefer"
  say "  $0 deploy"
  say "which publishes to Worker bkkx-site and serves bkk.nonarkara.org."
  exit 0
fi

say "Done. Next steps:"
say "  - Add a new district: edit site/app/walkthrough-data.ts (the worlds[]"
say "    array), then re-run $0"
say "  - PRODUCTION (bkk.nonarkara.org): $0 deploy"
say "  - Preview Worker (not production): $0 deploy-orphan"
say "  - Local preview: cd site && npm run dev, then open"
say "    http://localhost:3000/atlas/ratchathewi"
