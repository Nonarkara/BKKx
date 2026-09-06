#!/usr/bin/env python3
"""Which boxes stand under each hero monument, and how many shophouse
candidates are extruded twice — recomputed from the atlas's own files.

Written for AUDIT-2026-09-06.md; now the independent check on
site/scripts/hide-under-heroes.py. Two tables:

  A. per hero group: the detail and landmark features standing on the same
     ground (centroid inside the hero's lowest part, or the hero's centroid
     inside the feature), how many of them the map still draws, the tallest
     one it draws, and how many of the monument's parts sit entirely below
     that — i.e. are invisible in the atlas's opaque, depth-tested extrusion.
     A part's `height` is its absolute top (MapLibre semantics); the first
     draft of the audit added base to it and reported 25 occluded parts
     where the true count was 64.
  B. rowhouse candidates whose centroid lies inside a detail box, by which of
     the two extrusions is taller.

Run:  python3 scripts/audit-hero-occlusion.py             # this checkout
      python3 scripts/audit-hero-occlusion.py --verify    # exit 1 on any occluded part
      python3 scripts/audit-hero-occlusion.py <repo-root> # another worktree

The geometry and the ported height rules come from the build step itself —
one implementation of "what the map draws" — but the tables are re-derived
here from the files on disk, after the step has run, which is the check.
"""
from __future__ import annotations

import importlib.util
import json
import statistics
import sys
from pathlib import Path


def load_step(root: Path):
    spec = importlib.util.spec_from_file_location("hide_under_heroes", root / "site/scripts/hide-under-heroes.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def features(root: Path, name: str) -> list[dict]:
    return json.loads((root / "site/public/data" / name).read_text(encoding="utf-8"))["features"]


def table_a(root: Path, H) -> list[dict]:
    heroes = features(root, "bkk-hero-monuments.geojson")
    layers = {"detail": features(root, "bkk-heritage-detail.geojson"),
              "landmarks": features(root, "bkk-landmarks.geojson")}
    rows = []
    for group in H.hero_groups(heroes):
        on_ground = []
        for layer, feats in layers.items():
            for f in feats:
                p = f.get("properties") or {}
                if f.get("geometry") and H.on_same_ground(group, f["geometry"]):
                    on_ground.append((layer, p.get("id"), H.top_of(layer, p), H.is_drawn(layer, p), p.get("hidden_by")))
        drawn = [b for b in on_ground if b[3]]
        tallest = max((b[2] for b in drawn), default=0.0)
        occluded = sum(1 for part in group["parts"] if tallest >= H.part_top(part["properties"]))
        rows.append({
            "hero": group["hero_id"], "parts": len(group["parts"]), "top": group["top"],
            "base": group["base"], "boxes": on_ground, "drawn": len(drawn),
            "tallest_drawn": tallest, "occluded": occluded,
        })
    return rows


def table_b(root: Path, H) -> dict:
    detail = features(root, "bkk-heritage-detail.geojson")
    cands = features(root, "bangkok-rowhouse-footprint-candidates.geojson")

    def cand_height(p: dict) -> float:
        try:
            n = float(p.get("num_floors") or 0)
        except (TypeError, ValueError):
            n = 0
        return 3.5 + 3 * (n - 1) if n > 0 else 6.5

    grid: dict[tuple[int, int], list[int]] = {}
    for i, d in enumerate(detail):
        x0, y0, x1, y1 = H.bbox(d["geometry"])
        for gx in range(int(x0 * 1000), int(x1 * 1000) + 1):
            for gy in range(int(y0 * 1000), int(y1 * 1000) + 1):
                grid.setdefault((gx, gy), []).append(i)
    same = cand_taller = box_taller = 0
    diffs: list[float] = []
    still_double = 0
    for c in cands:
        pt = H.centroid(c["geometry"])
        hit = next((detail[i] for i in grid.get((int(pt[0] * 1000), int(pt[1] * 1000)), [])
                    if H.contains(pt, detail[i]["geometry"])), None)
        if not hit:
            continue
        ch, dh = cand_height(c["properties"]), H.detail_height(hit["properties"])
        if abs(ch - dh) < 0.01:
            same += 1
        elif ch > dh:
            cand_taller += 1
        else:
            box_taller += 1
        diffs.append(abs(ch - dh))
        # Both extruded: the box is drawn and the candidate is not flagged as
        # standing on one (the flag hide-under-heroes' sibling step will set).
        if H.is_drawn("detail", hit["properties"]) and c["properties"].get("has_detail_box") is not True:
            still_double += 1
    return {
        "overlapping": len(diffs), "same": same, "candidate_taller": cand_taller, "box_taller": box_taller,
        "median_abs_diff_m": statistics.median(diffs) if diffs else None, "still_double_extruded": still_double,
    }


def main(argv: list[str]) -> int:
    verify = "--verify" in argv
    args = [a for a in argv if not a.startswith("--")]
    root = Path(args[0]).resolve() if args else Path(__file__).resolve().parents[1]
    H = load_step(root)

    rows = table_a(root, H)
    print("A. boxes standing on each hero monument's ground (as committed in this checkout)")
    print(f"{'hero':32s} {'parts':>5s} {'top m':>6s} {'base':>5s} {'boxes':>5s} {'drawn':>5s} {'tallest drawn':>13s} {'occluded parts':>14s}")
    total_parts = total_occluded = 0
    for r in rows:
        total_parts += r["parts"]
        total_occluded += r["occluded"]
        ids = "; ".join(f"{layer}:{fid} {top:.0f}m{'' if drawn else ' hidden→' + str(by)}" for layer, fid, top, drawn, by in r["boxes"][:4])
        print(f"{r['hero']:32s} {r['parts']:5d} {r['top']:6.0f} {r['base']:5.0f} {len(r['boxes']):5d} {r['drawn']:5d} {r['tallest_drawn']:13.1f} {r['occluded']:14d}  {ids}")
    print(f"TOTAL parts={total_parts} parts entirely below a drawn box={total_occluded}")

    b = table_b(root, H)
    print("\nB. candidates whose centroid lies inside an OSM detail box")
    print(f"overlapping={b['overlapping']} same_height={b['same']} candidate_taller={b['candidate_taller']} "
          f"box_taller={b['box_taller']} median_abs_diff_m={b['median_abs_diff_m']} "
          f"still_double_extruded={b['still_double_extruded']}")

    if verify and total_occluded:
        print(f"\nverify: {total_occluded} hero part(s) are invisible behind a drawn box — "
              "run site/scripts/hide-under-heroes.py")
        return 1
    if verify and b["still_double_extruded"]:
        print(f"\nverify: {b['still_double_extruded']} candidate(s) are extruded through a drawn OSM box — "
              "run site/scripts/flag-candidates-over-detail.py")
        return 1
    if verify:
        print("\nverify: every hero part clears every drawn box; no candidate is extruded through one")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
