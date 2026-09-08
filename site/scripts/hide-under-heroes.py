#!/usr/bin/env python3
"""
hide-under-heroes.py
--------------------
Flag the boxes the hero monuments replace, so the atlas stops drawing them.

The atlas extrudes three layers over the Old Town: 9,275 OSM footprints
(bkk-heritage-detail), 73 curated landmark parts (bkk-landmarks) and the
hero-monument parts (bkk-hero-monuments). Every hero monument is built ON the
footprint of a box in one or both of the other two, and in opaque,
depth-tested extrusion a tiered model standing inside a box as tall as itself
is not visible at all. AtlasView has filtered the detail layer on `hide_3d`
since the layer shipped; nothing ever set the flag (AUDIT-2026-09-06.md §3).

This step sets it. For every hero group it hides, in both layers:

  * the feature the hero was built from. The hero parts carry that id —
    `osm_id`, an OSM way id or the landmark id for the Golden Mount chedi —
    so this is a join, not a guess; and
  * any other feature standing on the same ground — its centroid inside the
    hero's lowest part, or the hero's centroid inside it — whose top is above
    the hero's base, because that one would occlude too. The Golden Mount's
    hill (45 m) is exactly such a feature and is NOT hidden: the chedi parts
    start at 45 m, on top of it.

Each decision is written as `hide_3d: true` plus `hidden_by: <hero id>`, so
the record says why a box is missing, and a stale `hidden_by` from an earlier
run is cleared, so the two files are a pure function of the current hero
layer: running the step twice changes nothing. A `hide_3d` somebody set by
hand, without `hidden_by`, is left alone. The files are rewritten in their
own serialisation — minified, ensure_ascii=False, no trailing newline — and
the step refuses to touch a file it cannot reproduce byte for byte first.

Then it checks its own result: no hero part may sit entirely below a box
that is still drawn. If one does, the build stops here rather than shipping
a monument inside a crate again.

Runs in `npm run build` as data:hide, after data:heroes (which writes the
hero layer this reads) and before data:evidence (so the tally never counts a
hidden box as an extruded one). `scripts/audit-hero-occlusion.py --verify`
re-derives the same tables from the files in CI, independently.

    python3 scripts/hide-under-heroes.py            # rewrite the two files
    python3 scripts/hide-under-heroes.py --check    # exit 1 if they would change
"""
from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public/data"
HERO = DATA / "bkk-hero-monuments.geojson"
LAYERS = {
    "detail": DATA / "bkk-heritage-detail.geojson",
    "landmarks": DATA / "bkk-landmarks.geojson",
}

# ---------------------------------------------------------------------------
# Geometry. Pure python: the layers are small enough that a bbox prefilter is
# all the indexing they need, and one fewer dependency is one fewer way for
# this step to be skipped on a machine that lacks it.
# ---------------------------------------------------------------------------

def rings(geom: dict):
    kind = geom.get("type")
    if kind == "Polygon":
        yield geom["coordinates"][0]
    elif kind == "MultiPolygon":
        for poly in geom["coordinates"]:
            yield poly[0]


def point_in_ring(pt, ring) -> bool:
    x, y = pt
    inside = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def contains(pt, geom: dict) -> bool:
    return any(point_in_ring(pt, r) for r in rings(geom))


def centroid(geom: dict):
    pts = [p for r in rings(geom) for p in r]
    # math.fsum, not sum(): CPython 3.12 changed sum() over floats to
    # compensated (Neumaier) summation, so the same ring gives a different
    # last bit on 3.11 and on 3.12. That reached the committed geojson as a
    # seventh-decimal difference on a couple of vertices and turned CI red
    # against a file generated here (AUDIT-2026-09-06.md §2.5). fsum is
    # correctly rounded and identical on every version, so the artifact is
    # a function of the input rather than of the interpreter.
    return (math.fsum(p[0] for p in pts) / len(pts), math.fsum(p[1] for p in pts) / len(pts))


def bbox(geom: dict):
    pts = [p for r in rings(geom) for p in r]
    return (min(p[0] for p in pts), min(p[1] for p in pts), max(p[0] for p in pts), max(p[1] for p in pts))


def disjoint(a, b) -> bool:
    return a[2] < b[0] or a[0] > b[2] or a[3] < b[1] or a[1] > b[3]


# ---------------------------------------------------------------------------
# The atlas's own height rules, ported verbatim from AtlasView.tsx so that
# "would occlude" here is computed the way the map draws. If those expressions
# change, this table must change with them — test-hide-under-heroes.py pins
# the port against the TSX source.
# ---------------------------------------------------------------------------

DETAIL_TYPE_DEFAULT = {
    "temple": 18, "pagoda": 36, "shrine": 14, "chapel": 14, "monastery": 16,
    "commercial": 12, "retail": 12, "terrace": 12, "house": 10, "residential": 10,
}


def _coalesce(*values):
    return next((v for v in values if v is not None), None)


def detail_height(p: dict) -> float:
    """HERITAGE_DETAIL_HEIGHT."""
    h = _coalesce(p.get("render_height"), p.get("height"), 9)
    if h != 9:
        return float(h)
    return float(DETAIL_TYPE_DEFAULT.get(_coalesce(p.get("building"), p.get("building_type"), ""), 9))


def detail_base(p: dict) -> float:
    """The detail layer's fill-extrusion-base."""
    b = float(_coalesce(p.get("render_min_height"), p.get("min_height"), p.get("base_height"), 0))
    return 0.0 if b >= detail_height(p) else b


def landmark_height(p: dict) -> float:
    return float(_coalesce(p.get("height"), 12))


def landmark_base(p: dict) -> float:
    return float(_coalesce(p.get("base_height"), 0))


EXTRUSION = {
    "detail": (detail_base, detail_height),
    "landmarks": (landmark_base, landmark_height),
}


def top_of(layer: str, p: dict) -> float:
    base, height = EXTRUSION[layer]
    return base(p) + height(p)


def is_drawn(layer: str, p: dict) -> bool:
    """What the map's layer filter admits: not hidden, and (detail) taller than 0."""
    if p.get("hide_3d") is True:
        return False
    return layer != "detail" or detail_height(p) > 0


# ---------------------------------------------------------------------------
# Heroes
# ---------------------------------------------------------------------------

def part_top(p: dict) -> float:
    """A hero part's `height` is its absolute top, as MapLibre's
    fill-extrusion-height reads it — Wat Pho's finial is base 38, height 40,
    a 2 m cap on a 40 m chedi. Not base + height, which the first draft of
    the audit used and which halved its own occlusion count."""
    return float(p["height"])


def hero_groups(hero_features: list[dict]) -> list[dict]:
    """One record per hero_id: the ground it stands on and the ids it replaces."""
    by: dict[str, list[dict]] = {}
    for f in hero_features:
        by.setdefault(f["properties"]["hero_id"], []).append(f)
    groups = []
    for hero_id, parts in by.items():
        lowest = min(parts, key=lambda f: float(f["properties"].get("base_height") or 0))
        base = float(lowest["properties"].get("base_height") or 0)
        replaces = set()
        for f in parts:
            osm = f["properties"].get("osm_id")
            if osm is None:
                continue
            s = str(osm)
            replaces.add(f"bkk-building-{s}" if s.isdigit() else s)
        groups.append({
            "hero_id": hero_id,
            "parts": parts,
            "base": base,
            "top": max(part_top(f["properties"]) for f in parts),
            "plinth": lowest["geometry"],
            "centroid": centroid(lowest["geometry"]),
            "bbox": bbox(lowest["geometry"]),
            "replaces": replaces,
        })
    return groups


def on_same_ground(group: dict, geom: dict) -> bool:
    if disjoint(bbox(geom), group["bbox"]):
        return False
    return contains(centroid(geom), group["plinth"]) or contains(group["centroid"], geom)


def decide(groups: list[dict], features: list[dict], layer: str) -> dict[str, str]:
    """feature id -> hero id, for every feature a hero supersedes."""
    out: dict[str, str] = {}
    for f in features:
        p = f.get("properties") or {}
        fid = p.get("id")
        geom = f.get("geometry")
        if fid is None or not geom:
            continue
        for group in groups:
            if fid in group["replaces"]:
                out[fid] = group["hero_id"]
                break
            if on_same_ground(group, geom) and top_of(layer, p) > group["base"]:
                out[fid] = group["hero_id"]
                break
    return out


def apply(features: list[dict], decisions: dict[str, str]) -> int:
    """Write the flags in; clear the ones this step wrote before. Returns changes."""
    changed = 0
    for f in features:
        p = f.setdefault("properties", {})
        want = decisions.get(p.get("id"))
        if want:
            if p.get("hide_3d") is not True or p.get("hidden_by") != want:
                p["hide_3d"] = True
                p["hidden_by"] = want
                changed += 1
        elif "hidden_by" in p:
            p.pop("hidden_by", None)
            p.pop("hide_3d", None)
            changed += 1
    return changed


def occlusions(hero_features: list[dict], layers: dict[str, list[dict]]) -> list[dict]:
    """Every hero part that sits entirely below a box the map still draws.

    The post-condition. Empty means every monument is visible from plinth to
    finial; anything else is a monument inside a crate.
    """
    out = []
    for group in hero_groups(hero_features):
        boxes = []
        for layer, feats in layers.items():
            for f in feats:
                p = f.get("properties") or {}
                geom = f.get("geometry")
                if not geom or not is_drawn(layer, p):
                    continue
                if on_same_ground(group, geom):
                    boxes.append((layer, p.get("id"), top_of(layer, p)))
        if not boxes:
            continue
        layer, box_id, box_top = max(boxes, key=lambda b: b[2])
        for part in group["parts"]:
            pp = part["properties"]
            top = part_top(pp)
            if box_top >= top:
                out.append({
                    "hero": group["hero_id"], "part": pp["id"], "part_top": top,
                    "layer": layer, "box": box_id, "box_top": box_top,
                })
    return out


# ---------------------------------------------------------------------------
# Files
# ---------------------------------------------------------------------------

def dumps(obj: dict, trailing_newline: bool) -> bytes:
    text = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return (text + ("\n" if trailing_newline else "")).encode("utf-8")


def load(path: Path) -> tuple[dict, bytes]:
    raw = path.read_bytes()
    obj = json.loads(raw)
    if dumps(obj, raw.endswith(b"\n")) != raw:
        raise SystemExit(
            f"{path.name}: cannot reproduce this file byte for byte, so I will not rewrite it. "
            "It was written with a different serialiser; match it here first."
        )
    return obj, raw


def run(write: bool) -> dict:
    heroes = json.loads(HERO.read_text(encoding="utf-8"))["features"]
    groups = hero_groups(heroes)
    summary = {
        "byHero": {g["hero_id"]: {"detail": [], "landmarks": []} for g in groups},
        "changed": {}, "rewritten": {}, "hidden": {},
    }
    layer_features: dict[str, list[dict]] = {}
    for layer, path in LAYERS.items():
        obj, raw = load(path)
        feats = obj["features"]
        decisions = decide(groups, feats, layer)
        summary["changed"][layer] = apply(feats, decisions)
        summary["hidden"][layer] = sum(1 for f in feats if (f.get("properties") or {}).get("hide_3d") is True)
        for fid, hid in decisions.items():
            summary["byHero"][hid][layer].append(fid)
        out = dumps(obj, raw.endswith(b"\n"))
        summary["rewritten"][layer] = out != raw
        if write and out != raw:
            path.write_bytes(out)
        layer_features[layer] = feats
    summary["occlusions"] = occlusions(heroes, layer_features)
    return summary


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true",
                    help="do not write; exit 1 if either file would change (the CI staleness guard)")
    args = ap.parse_args()

    s = run(write=not args.check)
    for hero_id, layers in s["byHero"].items():
        hidden = [f"{layer}:{fid}" for layer in ("detail", "landmarks") for fid in layers[layer]]
        print(f"  {hero_id:<30} hides {len(hidden)}  {' '.join(hidden)}")
    print(f"hide-under-heroes: {s['hidden']['detail']} detail + {s['hidden']['landmarks']} landmark "
          f"features carry hide_3d · changed {s['changed']['detail']}+{s['changed']['landmarks']}")

    if s["occlusions"]:
        print(f"\n{len(s['occlusions'])} hero part(s) still sit entirely below a box the map draws:")
        for o in s["occlusions"]:
            print(f"  {o['hero']}/{o['part']} top {o['part_top']:.0f} m  under {o['layer']}:{o['box']} top {o['box_top']:.0f} m")
        return 1
    if args.check and any(s["rewritten"].values()):
        stale = ", ".join(l for l, r in s["rewritten"].items() if r)
        print(f"\n{stale}: committed flags do not match the hero layer — run scripts/hide-under-heroes.py")
        return 1
    for layer, rewrote in s["rewritten"].items():
        print(f"  {LAYERS[layer].name}: {'rewritten' if rewrote else 'unchanged'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
