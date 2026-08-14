// Reuse vs demolish-and-rebuild: the coefficients, and what they do not cover.
//
// Every number here is from a named institutional or peer-reviewed source,
// verified against the primary document. Nothing is interpolated to make the
// arithmetic tidy. Where a figure that ought to exist does not, the gap is
// recorded as data — see GAPS below, which is the honest part of this model
// and arguably its most useful output for a research sponsor.
//
// The system boundary matters more than the number. A benchmark quoted
// without its modules is not evidence, so each coefficient carries the
// EN 15978 modules it covers and a plain sentence on what it excludes.

export type Coefficient = {
  id: string;
  label: string;
  value: number;
  unit: string;
  range?: [number, number];
  modules: string;
  source: string;
  sourceUrl: string;
  year: number;
  covers: string;
  excludes: string;
};

export const COEFFICIENTS: Coefficient[] = [
  {
    id: "new-build-residential",
    label: "New build, residential — embodied carbon",
    value: 850,
    unit: "kgCO₂e/m² GIA",
    range: [500, 850],
    modules: "A1–A5 (cradle to practical completion)",
    source: "Greater London Authority, London Plan Guidance: Whole Life-Cycle Carbon Assessments, Table A2.1",
    sourceUrl: "https://www.london.gov.uk/sites/default/files/lpg_-_wlca_guidance.pdf",
    year: 2022,
    covers:
      "Substructure, superstructure, façade, finishes, fittings and MEP for a new residential building. 850 is the benchmark; 500 the aspirational target.",
    excludes:
      "Operational energy and water (B6/B7), and Module D. Derived from UK project data using EN 15804 EPDs — UK material carbon intensity, not Thai.",
  },
  {
    id: "new-build-office",
    label: "New build, commercial — embodied carbon",
    value: 950,
    unit: "kgCO₂e/m² GIA",
    range: [600, 950],
    modules: "A1–A5 (cradle to practical completion)",
    source: "Greater London Authority, London Plan Guidance: Whole Life-Cycle Carbon Assessments, Table A2.1",
    sourceUrl: "https://www.london.gov.uk/sites/default/files/lpg_-_wlca_guidance.pdf",
    year: 2022,
    covers: "Shell, core and CAT A fit-out for a new commercial building. 950 benchmark, 600 aspirational.",
    excludes: "Operational energy and water (B6/B7), and Module D. UK material carbon intensity, not Thai.",
  },
  {
    id: "structure-share",
    label: "Share of embodied carbon held in substructure + superstructure",
    value: 0.55,
    unit: "of A1–A5",
    range: [0.54, 0.63],
    modules: "A1–A5 elemental breakdown",
    source: "Greater London Authority, London Plan Guidance, Table A2.1 (offices 19% + 36%; residential 21% + 33%)",
    sourceUrl: "https://www.london.gov.uk/sites/default/files/lpg_-_wlca_guidance.pdf",
    year: 2022,
    covers:
      "The frame and foundations — the part a retrofit keeps. This is the single strongest number in the model and the reason reuse wins on carbon before any other argument is made.",
    excludes:
      "The façade is a separate 17–18%. A retrofit that keeps the frame but replaces the whole street elevation retains about 55%, not 72%.",
  },
  {
    id: "demolition",
    label: "Demolition and disposal",
    value: 50,
    unit: "kgCO₂e/m² GIA demolished",
    modules: "A5.1 (pre-construction demolition)",
    source: "RICS, Whole Life Carbon Assessment for the Built Environment, 2nd edition",
    sourceUrl: "https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/construction-standards/whole-life-carbon-assessment",
    year: 2023,
    covers: "Demolition plant, transport and disposal of the existing building.",
    excludes:
      "The embodied carbon lost in the discarded structure itself — that is counted separately, and it is the larger number. A default to be superseded by site data.",
  },
  {
    id: "retrofit-measures",
    label: "Deep retrofit — energy-efficiency measures",
    value: 140,
    unit: "kgCO₂e/m²",
    range: [20, 140],
    modules: "Retrofit measures only",
    source: "CRREM, Embodied Carbon of Retrofits: embodied carbon vs. operational savings",
    sourceUrl: "https://www.crrem.eu/wp-content/uploads/2023/09/Report-Embodied-carbon-vs-operational-savings_Sep23.pdf",
    year: 2023,
    covers:
      "Insulation, glazing and HVAC. ~30 kgCO₂e/m² for a light retrofit, up to 140 for a heavy one. The high end is used here as the conservative case.",
    excludes:
      "Structural work, internal fit-out and finishes. This is NOT a whole-building adaptive-reuse figure and must not be read as one — see the gap note below.",
  },
];

export const PAYBACK = {
  yearsLow: 10,
  yearsHigh: 80,
  yearsTypical: [20, 30] as const,
  impactSavingLow: 4,
  impactSavingHigh: 46,
  studyPeriodYears: 75,
  source:
    "Preservation Green Lab, National Trust for Historic Preservation, 'The Greenest Building: Quantifying the Environmental Value of Building Reuse'",
  sourceUrl: "https://living-future.org/wp-content/uploads/2022/05/The_Greenest_Building.pdf",
  year: 2011,
  finding:
    "It takes between 10 and 80 years for a new energy-efficient building to overcome, through better operational performance, the climate impact of its own construction. For most building types and climates the figure is 20 to 30 years. Reuse delivered 4–46% lower environmental impact across six typologies in four cities on a 75-year study period.",
  counterFinding:
    "One case lost. A warehouse-to-multifamily conversion performed worse than a comparable new building, because the conversion was materially intensive. Reuse is not automatically greener — a retrofit that guts and replaces everything can spend more carbon than it saves. This is the honest boundary of the argument.",
} as const;

export const COST = [
  {
    claim: "Conversion runs about 30% cheaper than new construction",
    source: "Gensler Research Institute, from 1,300+ office-to-residential conversion assessments",
    year: 2023,
    caveat: "US portfolio average, hard cost, land excluded.",
  },
  {
    claim: "Conversion at US$250–650/sq ft against new office at ~US$320/sq ft — often more expensive",
    source: "CBRE",
    year: 2024,
    caveat: "Directly contradicts the Gensler figure. Both are shown because the honest answer is that it depends on the building.",
  },
  {
    claim: "Adaptive reuse cut initial cost 52%, lifecycle cost 38% and embodied emissions 46%",
    source: "Office-to-residential LCA/LCC case study, Helsinki (Energy & Buildings)",
    year: 2026,
    caveat: "A single case study. Directional, not a benchmark.",
  },
] as const;

// The gaps. These are findings, not omissions.
export const GAPS = [
  {
    gap: "No embodied-carbon or life-cycle study of the Bangkok shophouse exists.",
    why: "Searched across TGO, TGBI/TREES, and the academic literature. Thai LCA work covers standard low-rise houses (Viriyaroj, Kuittinen & Gheewala 2024, Buildings & Cities 5(1), whole-life 1,886–3,828 kgCO₂e/m² over 50 years) and one BIM-LCA of a high-rise (~99 kgCO₂e/m² structural, A1–A3, using TGO factors). Neither is a shophouse.",
    consequence:
      "Every coefficient in this model is imported from UK or US benchmarks. They are directionally sound — concrete is concrete — but Thai material carbon intensity, construction practice and grid mix are all different. A Bangkok shophouse LCA is the single most useful piece of research anyone could fund off the back of this studio.",
  },
  {
    gap: "No institutional benchmark exists for whole-building deep retrofit.",
    why: "The GLA, RICS, RIBA and LETI all publish new-build benchmarks. None publishes a retrofit A1–A5 equivalent. The CRREM figure used here covers energy-efficiency measures only.",
    consequence:
      "The retrofit side of every reuse-vs-rebuild comparison in circulation — including this one — is weaker than the new-build side. That asymmetry quietly favours demolition in any assessment that pretends otherwise.",
  },
  {
    gap: "No Bangkok-specific retrofit-versus-new-build cost data was retrievable.",
    why: "Arcadis, Turner & Townsend and Savills Thailand all publish Bangkok construction cost guides; all sit behind paywalls.",
    consequence: "The cost argument here rests on US and European evidence that openly contradicts itself.",
  },
] as const;

/** A shophouse unit at the studio's measured dimensions. */
export const UNIT = {
  frontageM: 4.5,
  depthM: 12.6,
  storeys: 3,
  note:
    "Median frontage and depth of the 683 candidate footprints screened within 120 m of the Sukhumvit 71 spine — which land within a decimetre of the 3.5–5 m × 10–12 m the studio measured by hand.",
} as const;

export type Scenario = {
  gia: number;
  newBuildKg: number;
  demolitionKg: number;
  lostStructureKg: number;
  rebuildTotalKg: number;
  retrofitKg: number;
  savedKg: number;
  savedPct: number;
};

/**
 * Compare demolish-and-rebuild against retrofit for a given floor area.
 *
 * Deliberately conservative on both sides: the retrofit case uses CRREM's
 * heavy-retrofit high end (140), and the rebuild case does NOT claim the
 * replacement is larger than what it replaced — which in reality is the
 * entire commercial point of demolishing a shophouse. A developer replacing
 * three storeys with thirty is not represented here, and would multiply the
 * rebuild side several times over.
 */
export function compare(gia: number, newBuildPerM2: number): Scenario {
  const newBuildKg = gia * newBuildPerM2;
  const demolitionKg = gia * 50;
  const lostStructureKg = gia * newBuildPerM2 * 0.55;
  const rebuildTotalKg = newBuildKg + demolitionKg;
  const retrofitKg = gia * 140;
  const savedKg = rebuildTotalKg - retrofitKg;
  return {
    gia,
    newBuildKg,
    demolitionKg,
    lostStructureKg,
    rebuildTotalKg,
    retrofitKg,
    savedKg,
    savedPct: (savedKg / rebuildTotalKg) * 100,
  };
}
