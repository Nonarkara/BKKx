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
#     3. build the site, and
#     4. run the rendered-html tests against the new route.
#
# Usage:
#   ./scripts/add-3d-atlas.sh           # build + test
#   ./scripts/add-3d-atlas.sh install   # also run npm install
#   ./scripts/add-3d-atlas.sh check     # only verify files + deps
#
# Re-run after editing any atlas-related file, after adding a new
# district to site/app/walkthrough.tsx, or before deploying.

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
site_dir="$script_dir/../site"
atlas_page="$site_dir/app/atlas/[district]/page.tsx"
atlas_view="$site_dir/app/atlas/[district]/AtlasView.tsx"

usage() {
  cat >&2 <<'EOF'
Usage: $0 [install|check]
  (default)  Run build + tests against the 3D atlas page.
  install    Run `npm install` first to refresh maplibre-gl.
  check      Only verify the atlas files and dependency are present.
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

say "Building site (vinext → Cloudflare Worker bundle)..."
(cd "$site_dir" && npm run build)

say "Running rendered-html tests..."
(cd "$site_dir" && node --test tests/rendered-html.test.mjs)

say "Done. Next steps:"
say "  - Add a new district: edit site/app/walkthrough.tsx (the worlds[]"
say "    array), then re-run $0"
say "  - Deploy: cd site && npx wrangler deploy"
say "  - Local preview: cd site && npm run dev, then open"
say "    http://localhost:3000/atlas/ratchathewi"
