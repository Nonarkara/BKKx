#!/usr/bin/env bash
# Render the book-length essay to PDF from /shophouses/print.
#
# Headless Chrome rather than a PDF library, so the output uses the real
# typefaces the site uses — Sao Chingcha for display, Source Serif 4 for the
# read — instead of approximating them. Needs the dev server running.
set -euo pipefail

PORT="${1:-3001}"
OUT="${2:-docs/Shophouse-Metropolis_Non-Arkara_essay.pdf}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
URL="http://localhost:${PORT}/shophouses/print"

curl -sf -o /dev/null "$URL" || { echo "dev server not answering at $URL"; exit 1; }

"$CHROME" \
  --headless \
  --disable-gpu \
  --no-pdf-header-footer \
  --virtual-time-budget=20000 \
  --print-to-pdf="$OUT" \
  "$URL" 2>/dev/null

echo "wrote $OUT ($(du -h "$OUT" | cut -f1))"
