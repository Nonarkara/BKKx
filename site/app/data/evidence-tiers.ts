/* The atlas's evidence ladder.
 *
 * Every extruded building in /atlas/* carries a record of where its height
 * came from — `height_source` on the 9,275 Old Town footprints,
 * `height_confidence` on the hero monument parts. Until Evidence mode
 * that record was readable one building at a time, in the inspector card,
 * which made the honest answer to "how much of this city is actually
 * measured?" a nine-thousand-click question.
 *
 * This file is the single definition of the ladder. Three things read it
 * and none of them restates it:
 *
 *   AtlasView.tsx            builds its MapLibre colour expressions from
 *                            the tier table, so the map and the legend can
 *                            never disagree
 *   build-evidence-tally.mjs counts the real corpus into evidence-tally.json
 *                            at build time, and FAILS if the data contains a
 *                            source value no tier claims
 *   the legend               renders label, meaning and count together
 *
 * The failure mode that guard exists to prevent: someone adds a new
 * `height_source` to the generator, every building carrying it silently
 * falls into "inferred", and the atlas quietly understates its own
 * evidence. A build that stops is better than a map that lies.
 */

export type EvidenceTier = "official" | "measured" | "curated" | "inferred";

/* An ordinal ramp on the atlas's dark ground: bright where someone recorded
 * a real dimension, drab where the model inferred one from a building tag.
 * Deliberately cyan — not the signal lime, which is reserved for state and
 * primary actions, and not the amber of the normal massing. Evidence mode is
 * a different question being asked of the same city, not a highlight on top
 * of it. A drab city is the correct picture. */
export const EVIDENCE_COLOR: Record<EvidenceTier, string> = {
  official: "#8fe3f2",
  measured: "#4fb0cd",
  curated: "#2f7b96",
  inferred: "#4d5a63",
};

export type EvidenceTierSpec = {
  tier: EvidenceTier;
  label: string;
  meaning: string;
  /** `height_source` values on bkk-heritage-detail.geojson that land here. */
  detailSources: readonly string[];
  /** `height_confidence` values on bkk-hero-monuments.geojson that land here. */
  heroConfidences: readonly string[];
};

/** Strongest evidence first. The legend renders in this order. */
export const EVIDENCE_TIERS: readonly EvidenceTierSpec[] = [
  {
    tier: "official",
    label: "Published dimension",
    meaning:
      "An official figure — the Fine Arts Department's own published height for the structure.",
    detailSources: [],
    heroConfidences: ["official-envelope"],
  },
  {
    tier: "measured",
    label: "Tagged in OpenStreetMap",
    meaning:
      "Somebody recorded a height for this specific building and published it. Checkable by anyone.",
    detailSources: ["osm"],
    heroConfidences: [],
  },
  {
    tier: "curated",
    label: "Curated for this building",
    meaning:
      "BKKx set the height from knowledge of this building or its Thai type — chedi, viharn, ubosot, prasat, throne hall, mondop — or a per-building override.",
    detailSources: ["override-id", "chedi", "throne", "viharn", "ubosot", "prasat", "mondop"],
    heroConfidences: ["interpretive-proportion"],
  },
  {
    tier: "inferred",
    label: "Inferred from a building tag",
    meaning:
      "No height was recorded anywhere. The model took a default for the tag — house, commercial, terrace — so the silhouette is plausible and the number is not evidence.",
    detailSources: ["type-default", "clamped"],
    heroConfidences: ["interpretive-envelope"],
  },
] as const;

/* The 73 landmark parts carry no height_source field at all: every one is a
   BKKx-chosen envelope for a named structure, which is exactly "curated". */
export const LANDMARK_TIER: EvidenceTier = "curated";

/* Where an unlisted value lands. It is the weakest tier on purpose: if the
   ladder ever falls behind the data, the map understates its evidence rather
   than overstating it — and the build-time guard fails before that can
   ship. */
export const FALLBACK_TIER: EvidenceTier = "inferred";

/** Tier for a `height_source`, or null when no tier claims the value. */
export function tierForDetailSource(value: string): EvidenceTier | null {
  return EVIDENCE_TIERS.find((t) => t.detailSources.includes(value))?.tier ?? null;
}

/** Tier for a `height_confidence`, or null when no tier claims the value. */
export function tierForHeroConfidence(value: string): EvidenceTier | null {
  return EVIDENCE_TIERS.find((t) => t.heroConfidences.includes(value))?.tier ?? null;
}

/** Shape of app/data/evidence-tally.json, written by build-evidence-tally.mjs. */
export type EvidenceTally = {
  generatedFrom: string[];
  /** Feature counts per tier, summed across the detail, hero and landmark layers. */
  byTier: Record<EvidenceTier, number>;
  /** Raw value counts, kept so the legend can cite what it actually counted. */
  detailSources: Record<string, number>;
  heroConfidences: Record<string, number>;
  landmarks: number;
  total: number;
};
