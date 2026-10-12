#!/usr/bin/env python3
"""
build-temple-roofs.py
---------------------
Give Bangkok's temple halls their roofs.

The atlas extrudes 9,275 OpenStreetMap footprints as flat prisms. 541 of them
are tagged `temple`, and a Thai ubosot or viharn drawn as a prism reads as a
warehouse: the thing that makes it a temple at a glance is the steep, layered
gable roof. The hero-monument models cover 13 groups; this covers the rest.

WHAT IS EVIDENCE AND WHAT IS NOT
  * the footprint                — OpenStreetMap, unchanged
  * the overall height           — whatever the detail layer already says, from
                                   whatever source it already cites
                                   (`height_source` is copied, not replaced)
  * the walls/roof split, the tier count and their insets
                                 — the documented TYPE of a Thai hall roof,
                                   graded `typology` and never shown as a
                                   measurement of this building
So the envelope a reader could check is unchanged; only the form inside it
changes, and the form says it is a type.

WHICH BUILDINGS
  Halls: `building=temple`, or a curated `height_source` of ubosot, viharn
  or throne; at least 60 m^2; at least 78% of the minimum-area rectangle
  filled (i.e. rectangular); long side 1.15-4.5x the short side. A footprint
  that fails those is left as the box it was — an L-shaped cloister or a
  monks' house with a tiered gable on it would be invention.
  Chedis: `height_source=chedi`, compact footprint -> a bell stack scaled
  from the real ring.
  Anything a hero model already replaced (hide_3d by hide-under-heroes) is
  skipped: that monument has a better model.

The detail box of every building given a roof is flagged
`hide_3d: true, hidden_by: "temple-roof:hall"` (or `:chedi`) so the two never draw together —
the defect the 2026-09-06 audit spent a section on. The flags are a pure
function of the inputs; stale ones are cleared; the file is rewritten in its
own serialisation.

    python3 scripts/build-temple-roofs.py           # write
    python3 scripts/build-temple-roofs.py --check   # exit 1 if anything would change
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public/data"
DETAIL = DATA / "bkk-heritage-detail.geojson"
LANDMARKS = DATA / "bkk-landmarks.geojson"
OUT = DATA / "bkk-temple-roofs.geojson"
TAG = "temple-roof:"   # namespace; flags are temple-roof:hall / temple-roof:chedi

_spec = importlib.util.spec_from_file_location("hide_under_heroes", ROOT / "scripts/hide-under-heroes.py")
H = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(H)

_hspec = importlib.util.spec_from_file_location("hero_monuments", ROOT / "scripts/build-hero-monuments.py")
HM = importlib.util.module_from_spec(_hspec)
_hspec.loader.exec_module(HM)

HALL_SOURCES = {"ubosot", "viharn", "throne"}

# The eight Phra Atthamaha Chedi on the east side of Wat Phra Kaew are prangs,
# not bell chedis — OSM tags them `chedi`, and the Fine Arts Department and the
# Bureau of the Royal Household describe them as eight prangs, one per glazed
# colour. A bell stack would be the wrong TYPE, so these take the same redented
# prang profile as Wat Arun (scaled to their own recorded height).
PRANG_IDS = {f"bkk-building-{n}" for n in range(23482991, 23482999)}
PRANG_COLOURS = ["#e7e3d8", "#4f7fb3", "#d0b04a", "#4e8a66", "#b8574a", "#7a5aa0", "#c98a3a", "#5f9aa8"]
MIN_AREA_M2 = 60.0
# Pavilions: the sala, bell towers and small shrines that stand around a hall.
# Below a hall's size they take a lower body and a three-tier roof, so they
# read at their own scale instead of as pillars (see cap-default-heights.py).
PAVILION_MIN_M2 = 12.0
PAVILION_MAX_ASPECT = 3.0
RELIGIOUS_TYPES = {"temple", "chapel", "shrine"}
PAVILION_TIERS = [        # (long-axis scale, short-axis scale, colour)
    (1.12, 1.12, "#2f6f52"),   # eaves skirt, wider than the body
    (0.90, 0.62, "#c4572c"),
    (0.76, 0.30, "#d8a54a"),   # ridge, gilt
]
MIN_FILL = 0.78
ASPECT = (1.15, 4.5)
CHEDI_MIN_COMPACT = 0.6

WALL = "#ece5d3"
ROOF_TIERS = [            # (long-axis scale, short-axis scale, colour)
    (1.04, 1.04, "#2f6f52"),   # green-glazed outer skirt over the eaves
    (0.98, 0.80, "#c4572c"),
    (0.92, 0.60, "#cf6532"),
    (0.86, 0.42, "#c4572c"),
    (0.80, 0.24, "#d8a54a"),   # ridge, gilt
]
CHEDI = [                 # (fraction of height from, to, ring scale, colour)
    (0.00, 0.08, 1.00, "#e6dfcf"),
    (0.08, 0.16, 0.86, "#ece6d8"),
    (0.16, 0.48, 0.70, "#efe9dc"),   # bell
    (0.48, 0.56, 0.40, "#e2dbc9"),   # harmika
    (0.56, 0.70, 0.27, "#ece6d8"),
    (0.70, 0.86, 0.15, "#e6dfcf"),
    (0.86, 1.00, 0.06, "#d8b04f"),   # gilt finial
]


def outer_ring(geom: dict) -> list | None:
    if geom.get("type") == "Polygon":
        return geom["coordinates"][0]
    if geom.get("type") == "MultiPolygon" and len(geom["coordinates"]) == 1:
        return geom["coordinates"][0][0]
    return None


def frame(ring):
    pts = ring[:-1] if ring[0] == ring[-1] else ring
    lon0 = math.fsum(p[0] for p in pts) / len(pts)
    lat0 = math.fsum(p[1] for p in pts) / len(pts)
    kx, ky = math.cos(math.radians(lat0)) * 111320.0, 110540.0
    to_m = lambda p: ((p[0] - lon0) * kx, (p[1] - lat0) * ky)
    to_ll = lambda x, y: [round(lon0 + x / kx, 7), round(lat0 + y / ky, 7)]
    return [to_m(p) for p in pts], to_ll


def area(pts) -> float:
    return abs(math.fsum(x1 * y2 - x2 * y1 for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]))) / 2


def min_rect(pts):
    """(angle rad, centre u, centre v, half-long, half-short, long-axis-is-u)."""
    best = None
    for tenth in range(0, 900, 5):
        a = math.radians(tenth / 10)
        c, s = math.cos(a), math.sin(a)
        us = [x * c + y * s for x, y in pts]
        vs = [-x * s + y * c for x, y in pts]
        du, dv = max(us) - min(us), max(vs) - min(vs)
        if best is None or du * dv < best[0]:
            best = (du * dv, a, (max(us) + min(us)) / 2, (max(vs) + min(vs)) / 2, du, dv)
    _, a, cu, cv, du, dv = best
    return a, cu, cv, du, dv


def rect_ring(a, cu, cv, hu, hv, to_ll):
    c, s = math.cos(a), math.sin(a)
    corners = [(-hu, -hv), (hu, -hv), (hu, hv), (-hu, hv)]
    ring = [to_ll((cu + u) * c - (cv + v) * s, (cu + u) * s + (cv + v) * c) for u, v in corners]
    return ring + [ring[0]]


def scaled_ring(pts, k, to_ll):
    cx = math.fsum(x for x, _ in pts) / len(pts)
    cy = math.fsum(y for _, y in pts) / len(pts)
    ring = [to_ll(cx + (x - cx) * k, cy + (y - cy) * k) for x, y in pts]
    return ring + [ring[0]]


def feature(src: dict, n: int, label: str, ring, base: float, top: float, color: str, form: str) -> dict:
    p = src["properties"]
    return {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [ring]},
        "properties": {
            "id": f"{p['id']}-{n}",
            "source_id": p["id"],
            "name": p.get("name") or "",
            "part_label": label,
            "base_height": round(base, 2),
            "height": round(top, 2),
            "material_color": color,
            # The building's height evidence travels with every part, so
            # Evidence mode colours a roofed hall exactly as it coloured its box.
            "height_source": p.get("height_source"),
            "roof_form": form,
            "form_confidence": "typology",
            "model_status": "typological form · not a survey of this building",
            "source": "OpenStreetMap footprint and recorded height; walls/roof split and tiers by documented Thai type",
            "not_measured_survey": True,
        },
    }


def classify(f: dict):
    """('hall'|'chedi'|None, reason)."""
    p = f["properties"]
    if p.get("hide_3d") is True and not str(p.get("hidden_by", "")).startswith(TAG):
        return None, "replaced by a hero model or a row-strip flag"
    ring = outer_ring(f.get("geometry") or {})
    if not ring or len(ring) < 4:
        return None, "not a single polygon"
    src = p.get("height_source")
    is_temple = (p.get("building") or p.get("building_type")) in RELIGIOUS_TYPES
    if p.get("id") in PRANG_IDS:
        return "prang", "documented prang"
    if src == "chedi":
        pts, _ = frame(ring)
        a, *_rest, du, dv = min_rect(pts)
        compact = area(pts) / (du * dv) if du * dv else 0
        return ("chedi", "chedi") if compact >= CHEDI_MIN_COMPACT else (None, "chedi footprint not compact")
    if not (is_temple or src in HALL_SOURCES):
        return None, "not a temple"
    pts, _ = frame(ring)
    a, cu, cv, du, dv = min_rect(pts)
    if du * dv == 0:
        return None, "degenerate"
    fp = area(pts)
    if fp < PAVILION_MIN_M2:
        return None, "too small"
    if fp / (du * dv) < MIN_FILL:
        return None, "not rectangular"
    if fp < MIN_AREA_M2:
        aspect = max(du, dv) / min(du, dv)
        return ("pavilion", "pavilion") if aspect <= PAVILION_MAX_ASPECT else (None, "proportions not a pavilion")
    aspect = max(du, dv) / min(du, dv)
    if not (ASPECT[0] <= aspect <= ASPECT[1]):
        return None, "proportions not a hall"
    return "hall", "hall"


def massing(f: dict, kind: str) -> list[dict]:
    p = f["properties"]
    top = H.detail_height(p)
    base = H.detail_base(p)
    ring = outer_ring(f["geometry"])
    pts, to_ll = frame(ring)
    out: list[dict] = []
    if kind == "prang":
        to_m, to_ll2 = HM._local_frame(ring if ring[0] == ring[-1] else ring + [ring[0]])
        pts_m = [to_m(*q) for q in ring]
        angle, half = HM._min_area_angle(pts_m)
        cx = math.fsum(x for x, _ in pts_m[:-1]) / (len(pts_m) - 1)
        cy = math.fsum(y for _, y in pts_m[:-1]) / (len(pts_m) - 1)
        glaze = PRANG_COLOURS[sorted(PRANG_IDS).index(p["id"])]
        for i, (tid, label, b0, b1, frac, notch, color) in enumerate(HM.prang_profile(top - base)):
            c = glaze if tid.startswith("cob") or tid in ("body", "niche") else color
            out.append(feature(f, i, label, HM.redented_square(cx, cy, half * frac, half * notch, angle, to_ll2),
                               base + b0, base + b1, c, "typology: Khmer-derived prang (documented for these eight)"))
        return out
    if kind == "chedi":
        for i, (f0, f1, k, color) in enumerate(CHEDI):
            out.append(feature(f, i, "chedi tier", scaled_ring(pts, k, to_ll),
                               base + (top - base) * f0, base + (top - base) * f1, color, "typology: bell chedi"))
        return out
    a, cu, cv, du, dv = min_rect(pts)
    long_u = du >= dv
    half_long, half_short = (du, dv) if long_u else (dv, du)
    half_long, half_short = half_long / 2, half_short / 2
    span = top - base
    if kind == "pavilion":
        eave = base + max(2.4, 0.42 * span)
        out.append(feature(f, 0, "body", ring if ring[0] == ring[-1] else ring + [ring[0]],
                           base, eave, WALL, "typology: Thai pavilion"))
        step = (top - eave) / len(PAVILION_TIERS)
        for i, (kl, ks, color) in enumerate(PAVILION_TIERS):
            hl, hs = half_long * kl, half_short * ks
            hu, hv = (hl, hs) if long_u else (hs, hl)
            out.append(feature(f, i + 1, f"roof tier {i + 1}", rect_ring(a, cu, cv, hu, hv, to_ll),
                               eave + i * step, eave + (i + 1) * step, color,
                               "typology: tiered Thai pavilion roof"))
        return out
    wall_top = base + min(max(0.4 * span, 3.5), 11.0)
    wall_top = min(wall_top, base + 0.7 * span)
    # Walls on the REAL footprint; roof tiers on its oriented rectangle.
    out.append(feature(f, 0, "walls", ring if ring[0] == ring[-1] else ring + [ring[0]],
                       base, wall_top, WALL, "typology: Thai hall"))
    step = (top - wall_top) / len(ROOF_TIERS)
    for i, (kl, ks, color) in enumerate(ROOF_TIERS):
        hl, hs = half_long * kl, half_short * ks
        hu, hv = (hl, hs) if long_u else (hs, hl)
        out.append(feature(f, i + 1, f"roof tier {i + 1}", rect_ring(a, cu, cv, hu, hv, to_ll),
                           wall_top + i * step, wall_top + (i + 1) * step, color,
                           "typology: tiered Thai gable, ridge on the long axis"))
    return out


def dumps(obj, nl: bool) -> bytes:
    return (json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + ("\n" if nl else "")).encode()


def run(write: bool) -> dict:
    raw = DETAIL.read_bytes()
    detail = json.loads(raw)
    if dumps(detail, raw.endswith(b"\n")) != raw:
        raise SystemExit(f"{DETAIL.name}: cannot reproduce byte for byte; not rewriting it.")
    feats = detail["features"]
    parts: list[dict] = []
    counts = {"hall": 0, "pavilion": 0, "chedi": 0, "prang": 0}
    skipped: dict[str, int] = {}
    changed = 0
    for f in feats:
        kind, why = classify(f)
        p = f["properties"]
        if kind:
            counts[kind] += 1
            parts += massing(f, kind)
            want = TAG + kind
            if p.get("hide_3d") is not True or p.get("hidden_by") != want:
                p["hide_3d"], p["hidden_by"] = True, want
                changed += 1
        else:
            if why not in ("not a temple",):
                skipped[why] = skipped.get(why, 0) + 1
            if str(p.get("hidden_by", "")).startswith(TAG):
                p.pop("hide_3d", None); p.pop("hidden_by", None)
                changed += 1
    # A re-massed building's twin in the curated landmark layer is the same
    # footprint at the same height drawn a second time — the duplication the
    # 2026-09-06 audit found under the hero monuments (§2.4). Hide it with
    # the same flag, so each building is drawn exactly once.
    lraw = LANDMARKS.read_bytes()
    lobj = json.loads(lraw)
    if dumps(lobj, lraw.endswith(b"\n")) != lraw:
        raise SystemExit(f"{LANDMARKS.name}: cannot reproduce byte for byte; not rewriting it.")
    roofed = {f["properties"]["id"]: f["properties"]["hidden_by"] for f in feats
              if str(f["properties"].get("hidden_by", "")).startswith(TAG)}
    twins = 0
    for f in lobj["features"]:
        p = f["properties"]
        want = roofed.get(p.get("id"))
        foreign = p.get("hide_3d") is True and not str(p.get("hidden_by", "")).startswith(TAG)
        if want and not foreign:
            twins += 1
            if p.get("hidden_by") != want or p.get("hide_3d") is not True:
                p["hide_3d"], p["hidden_by"] = True, want
                changed += 1
        elif str(p.get("hidden_by", "")).startswith(TAG):
            p.pop("hide_3d", None); p.pop("hidden_by", None)
            changed += 1
    counts["landmarkTwinsHidden"] = twins

    out = {
        "type": "FeatureCollection",
        "name": "bkk-temple-roofs",
        "description": (
            "Thai temple halls and chedis from the OpenStreetMap detail layer, re-massed by type: "
            "walls on the real footprint, a tiered gable on its oriented rectangle, ridge on the long "
            "axis; chedis as a bell stack. The overall height is the detail layer's own, with its "
            "source copied onto every part. The form is a documented TYPE, not a survey of the building."
        ),
        "formConfidence": "typology",
        "counts": {**counts, "parts": len(parts), "leftAsBoxes": skipped},
        "features": parts,
    }
    out_bytes = dumps(out, True)
    detail_bytes = dumps(detail, raw.endswith(b"\n"))
    landmark_bytes = dumps(lobj, lraw.endswith(b"\n"))
    stale = (not OUT.exists() or OUT.read_bytes() != out_bytes) or detail_bytes != raw or landmark_bytes != lraw
    if write:
        if landmark_bytes != lraw:
            LANDMARKS.write_bytes(landmark_bytes)
        if detail_bytes != raw:
            DETAIL.write_bytes(detail_bytes)
        if not OUT.exists() or OUT.read_bytes() != out_bytes:
            OUT.write_bytes(out_bytes)
    return {"counts": out["counts"], "changed": changed, "stale": stale}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    r = run(write=not a.check)
    c = r["counts"]
    print(f"build-temple-roofs: {c['hall']} halls roofed, {c['pavilion']} pavilions, {c['chedi']} chedis stacked, {c['prang']} prangs, "
          f"{c['landmarkTwinsHidden']} landmark twins hidden, {c['parts']} parts · "
          f"left as boxes: {c['leftAsBoxes']} · flags changed {r['changed']}")
    if a.check and r["stale"]:
        print("committed roofs or flags are stale — run scripts/build-temple-roofs.py")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
