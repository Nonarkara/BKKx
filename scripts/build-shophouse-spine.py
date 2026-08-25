#!/usr/bin/env python3
"""The per-building spine: one record every lens reads.

Joins, per candidate footprint:
  geometry + dimensions        from the Overture/OSM screen
  district + land appraisal    Treasury bands, per district
  cluster + evidence tier      the documented rowhouse atlas
  theses that name the cluster the 57-item bibliography, placed by title
  the regulations that bind    computed from depth / plot / neighbours,
                               not merely listed
  quadrant                     the pressure classification

Every derived flag states its rule. Every number keeps its source. What
cannot be computed from open data (storeys for two-thirds of the set,
tenure, structural condition, road width) is left null and named as
missing, because a null a researcher can see is worth more than an
estimate they cannot audit.

Outputs
  site/public/data/shophouse-spine.json         one record per building
  site/app/data/shophouse-spine-index.ts        per-cluster rollup + lens data
"""

import json
import math
import statistics as st
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"

FOOTPRINTS = SITE / "public/data/bangkok-rowhouse-footprint-candidates.geojson"
PRESSURE = SITE / "public/data/shophouse-pressure.geojson"
ATLAS = SITE / "public/data/bangkok-rowhouse-atlas.geojson"
LANDPRICE = ROOT.parent / "bkk-3d-atlas/public/bkk-land-price-districts.geojson"
THESES = Path("/tmp/theses.json")
THESIS_CLUSTERS = Path("/tmp/thesis-clusters.json")

WAH2 = 4.0
DEPTH_CAP_M = 24.0        # MR55 ข้อ 2
VOID_ABOVE_M = 16.0       # MR55 ข้อ 2 — uncovered void required beyond this depth
ROW_CAP_UNITS = 10        # MR55 ข้อ 4
ROW_CAP_M = 40.0          # MR55 ข้อ 4
SETBACK_CENTRE_M = 6.0    # MR55 ข้อ 41, road < 10 m
ASSUMED_ROAD_M = 8.0      # stated assumption; per-plot road width is not published
NEIGHBOUR_GAP_M = 1.5     # two footprints closer than this along a row are one row

# GLA whole-life-carbon guidance, table A2.1 — the share of embodied carbon
# in substructure + superstructure, i.e. the share a retrofit keeps.
STRUCTURE_SHARE = 0.55
# Preservation Green Lab (2011): payback range for new-build vs reuse.
PAYBACK_YEARS = (10, 80)


def outer_ring(g):
    c = g["coordinates"]
    while isinstance(c[0][0], list):
        c = c[0]
    return c


def to_m(pts, lat0):
    k = math.cos(math.radians(lat0))
    return [(x * 111_320 * k, y * 110_540) for x, y in pts]


def min_rect(pts):
    best = None
    for i in range(len(pts) - 1):
        dx, dy = pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]
        L = math.hypot(dx, dy)
        if L < 1e-9:
            continue
        ux, uy = dx / L, dy / L
        us = [p[0] * ux + p[1] * uy for p in pts]
        vs = [-p[0] * uy + p[1] * ux for p in pts]
        w, h = max(us) - min(us), max(vs) - min(vs)
        if best is None or w * h < best[0]:
            best = (w * h, min(w, h), max(w, h), (ux, uy))
    return best[1], best[2], best[3]


def pip(pt, ring):
    x, y = pt
    inside = False
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def main():
    fp = json.loads(FOOTPRINTS.read_text())
    landprice_file = (
        LANDPRICE if LANDPRICE.exists() else SITE / "public/data/bkk-land-price.geojson"
    )
    lp = json.loads(landprice_file.read_text())
    atlas = json.loads(ATLAS.read_text())

    theses = json.loads(THESES.read_text()) if THESES.exists() else []
    tc = json.loads(THESIS_CLUSTERS.read_text()) if THESIS_CLUSTERS.exists() else {"mapping": {}}
    thesis_by_cluster = defaultdict(list)
    for n, slugs in tc.get("mapping", {}).items():
        for s in slugs:
            thesis_by_cluster[s].append(int(n))
    thesis_meta = {t["n"]: t for t in theses}

    clusters = {}
    for f in atlas["features"]:
        p = f["properties"]
        clusters.setdefault(p["slug"], p)

    districts = []
    for f in lp["features"]:
        p, g = f["properties"], f["geometry"]
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        name = p.get("name_en") or p.get("name")
        name_th = p.get("name_th")
        peak = p.get("peakNewPrice") or p.get("peak") or 0
        group_min = p.get("groupMinNewPrice") or p.get("min") or 0
        districts.append({
            "name": name,
            "th": name_th,
            "peak": peak,
            "min": group_min,
            "rings": [pl[0] for pl in polys],
        })

    # pressure quadrants, keyed by rounded centroid
    pq = {}
    for f in json.loads(PRESSURE.read_text())["features"]:
        x, y = f["geometry"]["coordinates"]
        pq[(round(x, 5), round(y, 5))] = f["properties"]["q"]

    rows = []
    for f in fp["features"]:
        p = f["properties"]
        try:
            ring = outer_ring(f["geometry"])
        except Exception:
            continue
        lat0 = sum(y for _, y in ring) / len(ring)
        lon0 = sum(x for x, _ in ring) / len(ring)
        m = to_m(ring, lat0)
        short, long, axis = min_rect(m)
        if short < 1.5 or long < 3:
            continue
        d = next((d for d in districts if any(pip((lon0, lat0), r) for r in d["rings"])), None)
        if not d:
            continue
        cx = sum(px for px, _ in m) / len(m)
        cy = sum(py for _, py in m) / len(m)
        rows.append({
            "id": p.get("overture_id") or f"{lon0:.6f},{lat0:.6f}",
            "lon": round(lon0, 6), "lat": round(lat0, 6),
            "_mx": cx, "_my": cy, "_axis": axis,
            "frontage_m": round(short, 1), "depth_m": round(long, 1),
            "area_m2": round(p.get("area_m2") or short * long, 1),
            "storeys": p.get("num_floors") or None,
            "height_m": p.get("height_m") or None,
            "district": d["name"], "district_th": d["th"],
            "cluster": p.get("cluster_slug"),
            "strength": p.get("candidate_strength"),
            "morph": p.get("morphology_score"),
            "land_floor_baht_m2": round((d["min"] or 0) / WAH2),
            "land_peak_baht_m2": round((d["peak"] or 0) / WAH2),
            "quadrant": pq.get((round(lon0, 5), round(lat0, 5))),
        })

    # --- row detection: neighbours along the frontage axis (MR55 ข้อ 4) -------
    # For each building, project neighbours in the same cluster onto the
    # frontage direction (perpendicular to the depth axis) and count how many
    # touch end-to-end. This is geometry, not a survey — it finds continuous
    # runs, which is what the row cap regulates.
    by_cluster = defaultdict(list)
    for r in rows:
        by_cluster[r["cluster"]].append(r)
    for slug, grp in by_cluster.items():
        for r in grp:
            ux, uy = r["_axis"]                       # depth axis
            fx, fy = -uy, ux                          # frontage axis
            # neighbours within a corridor along the frontage
            run = [r]
            for o in grp:
                if o is r:
                    continue
                dx, dy = o["_mx"] - r["_mx"], o["_my"] - r["_my"]
                along = dx * fx + dy * fy
                across = abs(dx * ux + dy * uy)
                if across < max(r["depth_m"], o["depth_m"]) * 0.6 and abs(along) < 60:
                    run.append(o)
            # sort along the frontage and count contiguous
            run.sort(key=lambda o: (o["_mx"] - r["_mx"]) * fx + (o["_my"] - r["_my"]) * fy)
            contiguous = 1
            total_len = r["frontage_m"]
            i = run.index(r)
            # walk left
            j = i
            while j > 0:
                a, b = run[j - 1], run[j]
                gap = abs(((b["_mx"] - a["_mx"]) * fx + (b["_my"] - a["_my"]) * fy)) - (a["frontage_m"] + b["frontage_m"]) / 2
                if gap <= NEIGHBOUR_GAP_M:
                    contiguous += 1
                    total_len += a["frontage_m"]
                    j -= 1
                else:
                    break
            j = i
            while j < len(run) - 1:
                a, b = run[j], run[j + 1]
                gap = abs(((b["_mx"] - a["_mx"]) * fx + (b["_my"] - a["_my"]) * fy)) - (a["frontage_m"] + b["frontage_m"]) / 2
                if gap <= NEIGHBOUR_GAP_M:
                    contiguous += 1
                    total_len += b["frontage_m"]
                    j += 1
                else:
                    break
            r["row_units"] = contiguous
            r["row_length_m"] = round(total_len, 1)

    # --- rules applied per building --------------------------------------
    for r in rows:
        depth = r["depth_m"]
        rules = []
        # ข้อ 2 — depth cap and void
        if depth > DEPTH_CAP_M:
            rules.append({"clause": "MR55 ข้อ 2", "finding": f"depth {depth} m exceeds the 24 m cap — a compliant rebuild must be shallower",
                          "kind": "binds"})
        elif depth > VOID_ABOVE_M:
            rules.append({"clause": "MR55 ข้อ 2", "finding": f"depth {depth} m > 16 m — a rebuild must open an uncovered void of ≥10% of ground-floor area between 12 and 16 m",
                          "kind": "binds"})
        # ข้อ 4 — row cap
        if r["row_units"] > ROW_CAP_UNITS or r["row_length_m"] > ROW_CAP_M:
            rules.append({"clause": "MR55 ข้อ 4", "finding": f"sits in a continuous run of {r['row_units']} units / {r['row_length_m']} m — over the 10-unit / 40 m cap; a rebuild must break the row",
                          "kind": "binds"})
        # ข้อ 17 — firewall (informational: every ≤5 units)
        if r["row_units"] >= 5:
            rules.append({"clause": "MR55 ข้อ 17", "finding": f"run of {r['row_units']} units — a firewall is required at least every 5",
                          "kind": "applies"})
        # ข้อ 41 — setback exposure
        loss = SETBACK_CENTRE_M - ASSUMED_ROAD_M / 2
        pct = round(min(loss / depth, 1) * 100)
        r["setback_loss_m"] = loss
        r["setback_loss_pct"] = pct
        rules.append({"clause": "MR55 ข้อ 41", "finding": f"on an assumed {ASSUMED_ROAD_M:g} m road a rebuild steps back {loss:g} m — {pct}% of this plot's depth",
                      "kind": "binds" if pct >= 15 else "applies"})
        # MR11 — always applies to a shophouse with an RC stair
        rules.append({"clause": "MR11 ข้อ 2", "finding": "moving the reinforced-concrete stair is classified as demolition, not modification",
                      "kind": "applies"})
        # storeys, where known
        if r["storeys"] and r["storeys"] > 2:
            rules.append({"clause": "MR55 ข้อ 41", "finding": f"{r['storeys']} storeys — over the 2-storey threshold, so the setback applies in full",
                          "kind": "binds"})
        r["rules"] = rules
        r["binds"] = sum(1 for x in rules if x["kind"] == "binds")

        # carbon position: what a retrofit keeps, in structural share terms.
        # No Thai LCA exists; this is the SHARE, not tonnes.
        r["carbon_kept_share"] = STRUCTURE_SHARE
        r["carbon_payback_years"] = PAYBACK_YEARS

        # cluster + evidence
        c = clusters.get(r["cluster"])
        r["cluster_name"] = c["name_en"] if c else None
        r["cluster_name_th"] = c.get("name_th") if c else None
        r["evidence"] = c.get("evidence") if c else None
        r["registered"] = (c.get("evidence") == "registered") if c else False
        r["register_id"] = c.get("register_id") if c else None
        r["theses"] = thesis_by_cluster.get(r["cluster"], [])

        # what we do NOT know, named
        missing = []
        if not r["storeys"]:
            missing.append("storeys")
        missing += ["tenure", "structural condition", "road width", "build year"]
        r["missing"] = missing

        for k in ("_mx", "_my", "_axis"):
            r.pop(k, None)

    (SITE / "public/data/shophouse-spine.json").write_text(json.dumps(rows, separators=(",", ":"), ensure_ascii=False))

    # --- cluster rollup for the lens pages --------------------------------
    roll = []
    for slug, grp in sorted(by_cluster.items(), key=lambda kv: -len(kv[1])):
        c = clusters.get(slug, {})
        depths = [g["depth_m"] for g in grp]
        fronts = [g["frontage_m"] for g in grp]
        q = Counter(g["quadrant"] for g in grp)
        binds = Counter(x["clause"] for g in grp for x in g["rules"] if x["kind"] == "binds")
        land = [g["land_floor_baht_m2"] * g["area_m2"] for g in grp]
        roll.append({
            "slug": slug, "name": c.get("name_en"), "nameTh": c.get("name_th"),
            "kind": c.get("kind"), "period": c.get("period"), "typology": c.get("typology"),
            "evidence": c.get("evidence"), "registerId": c.get("register_id"),
            "documentedUnits": c.get("documented_units"), "note": c.get("note"),
            "source": c.get("source"), "sourceUrl": c.get("source_url"),
            "district": Counter(g["district"] for g in grp).most_common(1)[0][0],
            "n": len(grp),
            "medianDepth": round(st.median(depths), 1), "medianFrontage": round(st.median(fronts), 1),
            "p90Depth": round(st.quantiles(depths, n=10)[8], 1) if len(depths) >= 10 else max(depths),
            "overDepthCap": sum(1 for d in depths if d > DEPTH_CAP_M),
            "storeysKnown": sum(1 for g in grp if g["storeys"]),
            "quadrants": dict(q),
            "landFloorM2": grp[0]["land_floor_baht_m2"], "landPeakM2": grp[0]["land_peak_baht_m2"],
            "medianLandUnder": round(st.median(land)),
            "bindingClauses": dict(binds),
            "medianRowUnits": round(st.median([g["row_units"] for g in grp])),
            "overRowCap": sum(1 for g in grp if g["row_units"] > ROW_CAP_UNITS),
            "theses": [thesis_meta[n]["n"] for n in thesis_by_cluster.get(slug, []) if n in thesis_meta],
        })

    ts = "// GENERATED by scripts/build-shophouse-spine.py — do not edit by hand.\n"
    ts += "// Per-cluster rollup of the per-building spine. Every figure is computed;\n"
    ts += "// the script header states each rule and each source.\n\n"
    ts += "export type ClusterRecord = {\n"
    ts += "  slug: string; name: string | null; nameTh: string | null; kind: string | null;\n"
    ts += "  period: string | null; typology: string | null; evidence: string | null;\n"
    ts += "  registerId: string | null; documentedUnits: number | null; note: string | null;\n"
    ts += "  source: string | null; sourceUrl: string | null; district: string; n: number;\n"
    ts += "  medianDepth: number; medianFrontage: number; p90Depth: number; overDepthCap: number;\n"
    ts += "  storeysKnown: number; quadrants: Record<string, number>;\n"
    ts += "  landFloorM2: number; landPeakM2: number; medianLandUnder: number;\n"
    ts += "  bindingClauses: Record<string, number>; medianRowUnits: number; overRowCap: number;\n"
    ts += "  theses: number[];\n};\n\n"
    ts += "export const CLUSTER_RECORDS: ClusterRecord[] = " + json.dumps(roll, ensure_ascii=False, indent=1) + ";\n\n"
    ts += f"export const SPINE_TOTAL = {len(rows)};\n"
    ts += f"export const SPINE_ASSUMPTIONS = {{ assumedRoadM: {ASSUMED_ROAD_M}, structureShare: {STRUCTURE_SHARE}, paybackYears: {list(PAYBACK_YEARS)}, neighbourGapM: {NEIGHBOUR_GAP_M} }} as const;\n"
    ts += "export const SPINE_MISSING = [\"storeys (for two-thirds of the set)\", \"tenure\", \"structural condition\", \"road width\", \"build year\"] as const;\n"
    (SITE / "app/data/shophouse-spine-index.ts").write_text(ts)

    print(f"{len(rows)} buildings · {len(roll)} clusters")
    print(f"over 24 m depth cap: {sum(1 for r in rows if r['depth_m'] > DEPTH_CAP_M)}")
    print(f"in a run over 10 units: {sum(1 for r in rows if r['row_units'] > ROW_CAP_UNITS)}")
    print(f"buildings with ≥1 binding clause: {sum(1 for r in rows if r['binds'])}")
    print(f"clusters with theses: {sum(1 for c in roll if c['theses'])}")


if __name__ == "__main__":
    main()
