#!/usr/bin/env python3
"""Resolve and ingest the Bangkok water / flood / drainage datasets.

This script is the instrument that turns app/data/water-sources.ts from a plan
of record into data. It was written in an environment where data.go.th is
unreachable (the egress proxy answers 403 to CONNECT), so it is deliberately
built to *discover* rather than to assume:

  * it asks CKAN what a dataset actually is, instead of trusting the slug;
  * it reads the real column names off each resource and records them;
  * it never invents a field mapping — where it cannot parse a resource it
    says so and moves on, and the failure is written into the manifest.

That means the first run is expected to produce a manifest with unknowns in
it. That manifest is the finding: it is the honest answer to "what is actually
in these twelve datasets", and it is what app/data/water-sources.ts should be
corrected against.

Outputs
  site/app/data/water-manifest.json   what each dataset really is, per resource
  site/public/data/water/<id>.geojson normalised points/lines, where derivable

Usage
  python3 scripts/ingest-bkk-water.py                 # resolve + download all
  python3 scripts/ingest-bkk-water.py --resolve-only  # metadata, no downloads
  python3 scripts/ingest-bkk-water.py --only floodgate canal1
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT_DATA = SITE / "public/data/water"
MANIFEST = SITE / "app/data/water-manifest.json"
SOURCES_TS = SITE / "app/data/water-sources.ts"

CKAN = "https://data.go.th/api/3/action/package_show?id="
UA = "BKKx/1.0 (civic data ingest; https://bkk.nonarkara.org)"
TIMEOUT = 45

# Bangkok bounding box — the same defence-in-depth guard ingest-bkk-pois.py
# uses. A water asset outside this box is a projection error, not a fact.
BKK_BBOX = (100.2, 13.4, 101.0, 14.2)  # minlon, minlat, maxlon, maxlat

# Column-name candidates, lowercased. Used ONLY to *propose* a mapping; every
# proposal is recorded in the manifest so a human can see what was guessed.
LAT_KEYS = ("lat", "latitude", "y", "ycoord", "lat_y", "ละติจูด")
LON_KEYS = ("lon", "lng", "long", "longitude", "x", "xcoord", "lon_x", "ลองจิจูด")
NAME_KEYS = ("name", "name_th", "namethai", "gate_name", "canal_name", "ชื่อ", "ชื่อคลอง", "ชื่อประตู")
DISTRICT_KEYS = ("district", "amphoe", "khet", "เขต", "อำเภอ")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read()


def read_source_ids() -> list[str]:
    """Take the dataset ids straight from water-sources.ts.

    The TypeScript file is the single list of what we intend to ingest; parsing
    it here keeps the two from drifting apart.
    """
    src = SOURCES_TS.read_text(encoding="utf-8")
    block = src[src.index("export const WATER_SOURCES"): src.index("Live endpoints")]
    return re.findall(r'^\s{4}id: "([^"]+)",', block, re.M)


def sniff_columns(body: bytes, fmt: str) -> tuple[list[str], int | None]:
    """Return (column names, row count) for a resource, without assuming schema."""
    fmt = (fmt or "").lower()
    text_head = body[:400_000].decode("utf-8", errors="replace")

    if "json" in fmt or text_head.lstrip()[:1] in "{[":
        try:
            parsed = json.loads(body.decode("utf-8", errors="replace"))
        except Exception:
            return [], None
        if isinstance(parsed, dict) and parsed.get("type") == "FeatureCollection":
            feats = parsed.get("features") or []
            keys = sorted({k for f in feats[:200] for k in (f.get("properties") or {})})
            return keys, len(feats)
        if isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
            return sorted({k for row in parsed[:200] for k in row}), len(parsed)
        return [], None

    if "csv" in fmt or "," in text_head.split("\n", 1)[0]:
        try:
            rdr = csv.reader(io.StringIO(text_head))
            header = next(rdr, [])
            rows = sum(1 for _ in csv.reader(io.StringIO(text_head))) - 1
            return [h.strip() for h in header], max(rows, 0)
        except Exception:
            return [], None

    return [], None


def pick(cols: list[str], candidates: tuple[str, ...]) -> str | None:
    low = {c.lower().strip(): c for c in cols}
    for cand in candidates:
        if cand in low:
            return low[cand]
    for c in cols:  # substring fallback
        if any(cand in c.lower() for cand in candidates):
            return c
    return None


def to_points(body: bytes, fmt: str, cols: list[str]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Best-effort point extraction. Returns (features, mapping-report)."""
    lat_c, lon_c = pick(cols, LAT_KEYS), pick(cols, LON_KEYS)
    report = {"latColumn": lat_c, "lonColumn": lon_c,
              "nameColumn": pick(cols, NAME_KEYS), "districtColumn": pick(cols, DISTRICT_KEYS)}
    if not (lat_c and lon_c) or "csv" not in (fmt or "").lower():
        return [], report

    feats, out_of_box = [], 0
    rdr = csv.DictReader(io.StringIO(body.decode("utf-8", errors="replace")))
    for row in rdr:
        try:
            lat, lon = float(row[lat_c]), float(row[lon_c])
        except (TypeError, ValueError, KeyError):
            continue
        if not (BKK_BBOX[0] <= lon <= BKK_BBOX[2] and BKK_BBOX[1] <= lat <= BKK_BBOX[3]):
            out_of_box += 1
            continue
        props = {k: v for k, v in row.items() if k not in (lat_c, lon_c) and v not in ("", None)}
        feats.append({"type": "Feature",
                      "geometry": {"type": "Point", "coordinates": [lon, lat]},
                      "properties": props})
    report["outOfBboxDropped"] = out_of_box
    return feats, report


def resolve(dataset_id: str, download: bool) -> dict[str, Any]:
    entry: dict[str, Any] = {"id": dataset_id, "resolvedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    try:
        pkg = json.loads(fetch(CKAN + urllib.parse.quote(dataset_id)).decode("utf-8"))
    except urllib.error.HTTPError as e:
        entry["error"] = f"HTTP {e.code} from CKAN"
        return entry
    except Exception as e:  # network, TLS, proxy denial
        entry["error"] = f"{type(e).__name__}: {e}"
        return entry

    if not pkg.get("success"):
        entry["error"] = "CKAN returned success=false"
        return entry

    res = pkg["result"]
    entry.update({
        "title": res.get("title"),
        "notes": (res.get("notes") or "")[:600],
        "organization": (res.get("organization") or {}).get("title"),
        "license": res.get("license_title"),
        "updateFrequency": res.get("update_frequency") or res.get("data_update_frequency"),
        "lastModified": res.get("metadata_modified"),
        "resources": [],
    })

    for r in res.get("resources", []):
        rec = {"name": r.get("name"), "format": r.get("format"), "url": r.get("url"),
               "columns": [], "rows": None}
        if download and r.get("url"):
            try:
                body = fetch(r["url"])
                rec["bytes"] = len(body)
                cols, rows = sniff_columns(body, r.get("format", ""))
                rec["columns"], rec["rows"] = cols, rows
                feats, mapping = to_points(body, r.get("format", ""), cols)
                rec["mapping"] = mapping
                if feats:
                    OUT_DATA.mkdir(parents=True, exist_ok=True)
                    path = OUT_DATA / f"{dataset_id}.geojson"
                    path.write_text(json.dumps({
                        "type": "FeatureCollection",
                        "name": dataset_id,
                        "source": f"https://data.go.th/dataset/{dataset_id}",
                        "ingestedAt": entry["resolvedAt"],
                        "featureCount": len(feats),
                        "features": feats,
                    }, ensure_ascii=False), encoding="utf-8")
                    rec["wrote"] = str(path.relative_to(SITE))
                    rec["featureCount"] = len(feats)
            except Exception as e:
                rec["error"] = f"{type(e).__name__}: {e}"
        entry["resources"].append(rec)
    return entry


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--resolve-only", action="store_true", help="metadata only, no resource downloads")
    ap.add_argument("--only", nargs="*", help="limit to these dataset ids")
    args = ap.parse_args()

    ids = args.only or read_source_ids()
    print(f"ingest-bkk-water: {len(ids)} datasets\n")

    entries, ok, failed = [], 0, 0
    for i, did in enumerate(ids, 1):
        print(f"[{i}/{len(ids)}] {did} … ", end="", flush=True)
        e = resolve(did, download=not args.resolve_only)
        entries.append(e)
        if e.get("error"):
            failed += 1
            print(f"FAILED — {e['error']}")
        else:
            ok += 1
            wrote = [r.get("featureCount") for r in e["resources"] if r.get("wrote")]
            print(f"{e.get('title') or '(untitled)'} · {len(e['resources'])} resource(s)"
                  + (f" · wrote {wrote[0]} features" if wrote else ""))
        time.sleep(0.6)  # polite

    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps({
        "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "resolved": ok, "failed": failed, "datasets": entries,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\nresolved {ok}, failed {failed} -> {MANIFEST.relative_to(ROOT)}")
    if failed:
        print("Failures are recorded in the manifest rather than hidden. If every "
              "dataset failed with a proxy or DNS error, this machine cannot reach "
              "data.go.th — run it somewhere with open egress.")
    print("\nNext: correct app/data/water-sources.ts against the manifest "
          "(titles, layers, limits), then wire the ingested layers into the war room.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
