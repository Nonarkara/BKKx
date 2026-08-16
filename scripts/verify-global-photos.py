#!/usr/bin/env python3
"""Verify every photo URL on the global shophouse page still returns 200.

A photo of a real shophouse town that 404s is a worse outcome than no photo
at all — the same anti-fabrication discipline that applies to coordinates
applies to images. Run this before shipping a change to the global data
file. Exit code 1 on any failure, 0 on all-green.

Usage:  python3 scripts/verify-global-photos.py
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site/app/data/shophouse-global.ts"

UA = "BKKx/1.0 (audit; drnon@nonarkara.org)"
MIN_BYTES = 5_000  # a real photo is well over this; HTML 404s and stub responses are not


def extract_photo_urls(src: str) -> list[tuple[str, str, str]]:
    """Return [(id, url, credit), ...] for every town with a photo."""
    out = []
    # crude: split into town blocks by id: "...",
    blocks = re.split(r'\n  \{\n    id: "([^"]+)",', src)
    # blocks[0] is the prelude; pairs of (id, body)
    for i in range(1, len(blocks), 2):
        tid = blocks[i]
        body = blocks[i + 1]
        m_url = re.search(r'url:\s*"(https://upload\.wikimedia\.org/[^"]+)"', body)
        if not m_url:
            continue
        out.append((tid, m_url.group(1), ""))
    return out


def main() -> int:
    src = DATA.read_text()
    photos = extract_photo_urls(src)
    if not photos:
        print("(no photo URLs to verify)")
        return 0
    print(f"verifying {len(photos)} photo URLs\n")
    failures = []
    for tid, url, _ in photos:
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://shophouses.nonarkara.org/"})
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                status = r.status
                body = r.read()
                size = len(body)
        except Exception as e:
            print(f"  ✗ {tid:30s} ERR  {e}")
            failures.append((tid, url, "exception"))
            continue
        if status != 200 or size < MIN_BYTES:
            print(f"  ✗ {tid:30s} {status}  {size} bytes  {url[:80]}")
            failures.append((tid, url, f"{status}/{size}b"))
        else:
            print(f"  ✓ {tid:30s} {status}  {size:>8} bytes  {url[:80]}")
    print()
    if failures:
        print(f"{len(failures)} of {len(photos)} failed")
        return 1
    print(f"all {len(photos)} photos are live.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
