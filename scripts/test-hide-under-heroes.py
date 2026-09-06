#!/usr/bin/env python3
"""Tests for site/scripts/hide-under-heroes.py.

What would be invisible and wrong: a hero's own box left drawn (the monument
vanishes), the hill under the Golden Mount hidden (the chedi floats), a flag
that survives its hero (a hole in the fabric nobody can explain), a rewrite
that is not byte-stable (a diff every build), and a committed file older than
the hero layer it was derived from.

Run:  python3 scripts/test-hide-under-heroes.py
"""
from __future__ import annotations

import copy
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"

spec = importlib.util.spec_from_file_location("hide_under_heroes", SITE / "scripts/hide-under-heroes.py")
H = importlib.util.module_from_spec(spec)
spec.loader.exec_module(H)

FAILED: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    if ok:
        print(f"  ok   {name}")
    else:
        FAILED.append(name)
        print(f"  FAIL {name}{': ' + detail if detail else ''}")


def load_all():
    heroes = json.loads(H.HERO.read_text(encoding="utf-8"))["features"]
    layers = {layer: json.loads(path.read_text(encoding="utf-8"))["features"] for layer, path in H.LAYERS.items()}
    return heroes, layers


def test_every_hero_hides_the_box_it_was_built_from() -> None:
    heroes, layers = load_all()
    ids = {layer: {f["properties"]["id"]: f["properties"] for f in feats} for layer, feats in layers.items()}
    missing = []
    for group in H.hero_groups(heroes):
        for rid in group["replaces"]:
            for layer in layers:
                p = ids[layer].get(rid)
                if p is not None and (p.get("hide_3d") is not True or p.get("hidden_by") != group["hero_id"]):
                    missing.append(f"{layer}:{rid} (built into {group['hero_id']})")
    check("the box each hero was built from is hidden by that hero, in every layer it appears",
          not missing, "; ".join(missing[:4]))
    # Specifically the eleven that were invisible, and the one the audit rendered.
    p = ids["detail"].get("bkk-building-783589706")
    check("Wat Pho's Dilok chedi box (way 783589706) is hidden",
          p is not None and p.get("hidden_by") == "wat-pho-dilok", str(p and p.get("hidden_by")))
    p = ids["landmarks"].get("bkk-building-23482988")
    check("the landmark-layer copy of the Siratana Chedi box is hidden too",
          p is not None and p.get("hidden_by") == "grand-palace-siratana-chedi", str(p and p.get("hidden_by")))


def test_the_hill_under_the_golden_mount_survives() -> None:
    """The chedi parts start at 45 m, on the hill. Hide the hill and they float."""
    _, layers = load_all()
    lm = {f["properties"]["id"]: f["properties"] for f in layers["landmarks"]}
    hill = lm.get("landmark-golden-mount")
    chedi = lm.get("landmark-golden-mount-chedi")
    check("landmark-golden-mount (the 45 m hill) is still drawn",
          hill is not None and hill.get("hide_3d") is not True, str(hill and hill.get("hidden_by")))
    check("landmark-golden-mount-chedi (the box the hero chedi was built from) is hidden",
          chedi is not None and chedi.get("hidden_by") == "golden-mount-chedi", str(chedi and chedi.get("hidden_by")))
    det = {f["properties"]["id"]: f["properties"] for f in layers["detail"]}
    box = det.get("bkk-building-88359228")
    check("the 58 m override box on the mount is hidden — it would have swallowed the plinth",
          box is not None and box.get("hidden_by") == "golden-mount-chedi", str(box and box.get("hidden_by")))


def test_no_part_is_below_a_drawn_box() -> None:
    heroes, layers = load_all()
    occ = H.occlusions(heroes, layers)
    check("no hero part sits entirely below a box the map still draws", not occ,
          "; ".join(f"{o['hero']}/{o['part']} under {o['layer']}:{o['box']}" for o in occ[:4]))
    check("… and that is asserted over all 13 hero groups",
          len(H.hero_groups(heroes)) == 13, str(len(H.hero_groups(heroes))))


def test_flags_are_a_pure_function_of_the_hero_layer() -> None:
    heroes, layers = load_all()
    groups = H.hero_groups(heroes)
    # Deciding again over already-flagged features changes nothing.
    feats = copy.deepcopy(layers["landmarks"])
    check("re-running over flagged features changes nothing",
          H.apply(feats, H.decide(groups, feats, "landmarks")) == 0)
    # Remove a hero and its flags go with it.
    without = [f for f in heroes if f["properties"]["hero_id"] != "grand-palace-siratana-chedi"]
    feats = copy.deepcopy(layers["landmarks"])
    changed = H.apply(feats, H.decide(H.hero_groups(without), feats, "landmarks"))
    lm = {f["properties"]["id"]: f["properties"] for f in feats}
    check("a hero that disappears takes its flags with it",
          changed >= 1 and "hidden_by" not in lm["bkk-building-23482988"] and "hide_3d" not in lm["bkk-building-23482988"])
    # A hand-set hide_3d without hidden_by is not this step's to remove.
    feats = copy.deepcopy(layers["landmarks"])
    victim = next(f for f in feats if "hidden_by" not in f["properties"])
    victim["properties"]["hide_3d"] = True
    H.apply(feats, H.decide(groups, feats, "landmarks"))
    check("a hide_3d somebody set by hand is left alone", victim["properties"].get("hide_3d") is True)


def test_the_rewrite_is_byte_stable_and_the_files_are_current() -> None:
    """The staleness guard: what is committed is what the step produces now."""
    s = H.run(write=False)
    check("neither file would change if the step ran again",
          not any(s["rewritten"].values()), str(s["rewritten"]))
    check("the step reports zero changes against the committed files",
          s["changed"] == {"detail": 0, "landmarks": 0}, str(s["changed"]))
    for layer, path in H.LAYERS.items():
        raw = path.read_bytes()
        check(f"{path.name} round-trips through the step's serialiser byte for byte",
              H.dumps(json.loads(raw), raw.endswith(b"\n")) == raw)


def test_the_height_port_matches_the_atlas() -> None:
    """The rule for 'what the map draws' lives in AtlasView.tsx; the port must not drift."""
    tsx = (SITE / "app/atlas/[district]/AtlasView.tsx").read_text(encoding="utf-8")
    block = tsx[tsx.index("const HERITAGE_DETAIL_HEIGHT"):]
    block = block[: block.index("];") + 2]
    pairs = dict((k, int(v)) for k, v in re.findall(r'"([a-z]+)", (\d+),', block))
    check("the detail type-default table matches the TSX expression", pairs == H.DETAIL_TYPE_DEFAULT,
          f"tsx={pairs} port={H.DETAIL_TYPE_DEFAULT}")
    check("the TSX fallback height is 9, as ported", re.search(r"\n\s+9,\n\s+\],\n\];", block) is not None)
    check("the landmark layer filters on hide_3d",
          'id: "bkkx-heritage-landmarks"' in tsx and
          tsx[tsx.index('id: "bkkx-heritage-landmarks"'):].split("paint:")[0].count('["!=", ["get", "hide_3d"], true]') == 1)


def test_hidden_boxes_are_not_counted_as_evidence() -> None:
    tally = json.loads((SITE / "app/data/evidence-tally.json").read_text(encoding="utf-8"))
    _, layers = load_all()
    hidden = {layer: sum(1 for f in feats if f["properties"].get("hide_3d") is True) for layer, feats in layers.items()}
    check("evidence-tally.json records the hidden counts", tally.get("hidden") == hidden,
          f"tally={tally.get('hidden')} files={hidden}")
    drawn_detail = len(layers["detail"]) - hidden["detail"]
    drawn_landmarks = len(layers["landmarks"]) - hidden["landmarks"]
    heroes = len(json.loads(H.HERO.read_text(encoding="utf-8"))["features"])
    check("the tally's total is drawn detail + drawn landmarks + hero parts",
          tally["total"] == drawn_detail + drawn_landmarks + heroes,
          f"total={tally['total']} expected={drawn_detail + drawn_landmarks + heroes}")


def main() -> int:
    for fn in (
        test_every_hero_hides_the_box_it_was_built_from,
        test_the_hill_under_the_golden_mount_survives,
        test_no_part_is_below_a_drawn_box,
        test_flags_are_a_pure_function_of_the_hero_layer,
        test_the_rewrite_is_byte_stable_and_the_files_are_current,
        test_the_height_port_matches_the_atlas,
        test_hidden_boxes_are_not_counted_as_evidence,
    ):
        print(f"\n{fn.__name__}")
        fn()
    print()
    if FAILED:
        print(f"{len(FAILED)} check(s) failed: {', '.join(FAILED)}")
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
