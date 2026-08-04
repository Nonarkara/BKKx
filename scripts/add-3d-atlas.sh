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
site_dir="$script_dir/../site"
atlas_page="$site_dir/app/atlas/[district]/page.tsx"
atlas_view="$site_dir/app/atlas/[district]/AtlasView.tsx"

usage() {
  cat >&2 <<'EOF'
Usage: $0 [install|check|package|deploy-orphan]
  (default)       Run build + tests against the 3D atlas page.
  install         Run `npm install` first to refresh maplibre-gl.
  check           Only verify the atlas files and dependency are present.
  package         Build, test, and emit a Codex deploy archive under dist/.
  deploy-orphan   Deploy to the personal Cloudflare Workers account
                  (preview URL only — NOT bkk.nonarkara.org).
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

if [ "$action" = "deploy-orphan" ]; then
  say "Building site (vinext → Cloudflare Worker bundle)..."
  (cd "$site_dir" && npm run build)
  say "Deploying to personal Cloudflare (orphan worker, NOT bkk.nonarkara.org)..."
  (cd "$site_dir" && npx wrangler deploy)
  say "Orphan deploy complete. Production deploy to bkk.nonarkara.org still"
  say "requires the Codex Sites plugin (see $0 package + Codex deploy step)."
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
  say "Next: hand the archive to the Codex Sites plugin to create a new"
  say "site_version, then call deploy_private_site_version. Production URL"
  say "remains bkk.nonarkara.org (fronted by edge-proxy)."
  exit 0
fi

say "Done. Next steps:"
say "  - Add a new district: edit site/app/walkthrough-data.ts (the worlds[]"
say "    array), then re-run $0"
say "  - Personal Cloudflare preview (NOT production): $0 deploy-orphan"
say "  - Codex hosting archive (for production bkk.nonarkara.org): $0 package"
say "  - Local preview: cd site && npm run dev, then open"
say "    http://localhost:3000/atlas/ratchathewi"
