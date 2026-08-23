// Citywide shophouse pressure analysis — computed, not asserted.
//
// Every number in this file is produced by scripts/build-shophouse-pressure.py
// from two open datasets, joined by point-in-polygon:
//
//   1. 2311 candidate shophouse footprints screened from Overture/OSM
//      building geometry (site/public/data/bangkok-rowhouse-footprint-candidates.geojson).
//      Frontage and depth are the short and long sides of each footprint's
//      minimum-area bounding rectangle, computed by rotating calipers.
//   2. Treasury Department (กรมธนารักษ์) appraisal bands by district, the same
//      dataset behind the land-price layer on atlas.nonarkara.org. Quoted per
//      square wah in the source and converted here at 1 wah² = 4 m².
//
// WHAT THIS IS NOT. Morphology is not proof: a narrow, deep footprint repeating
// along a street is the shophouse signature, but no field survey has confirmed
// that any individual building here is one, nor its age, condition or tenure.
// Appraised value is the base for transfer tax and sits below market, so every
// land figure is a floor rather than an estimate. And the setback exposure below
// assumes a road width, because per-plot road widths are not published — the
// assumption is stated in SPLITS and can be changed.

export type PressureDistrict = {
  district: string;
  districtTh: string | null;
  count: number;
  medianDepthM: number;
  medianFrontageM: number;
  landFloorBahtM2: number;
  landPeakBahtM2: number;
  medianLandUnderFootprint: number;
  tellTheOwner: number;
  atRisk: number;
};

export const PRESSURE_DISTRICTS: PressureDistrict[] = [
  {
    district: "Phra Nakhon",
    districtTh: "เขตพระนคร",
    count: 1237,
    medianDepthM: 13.1,
    medianFrontageM: 4.3,
    landFloorBahtM2: 62500,
    landPeakBahtM2: 250000,
    medianLandUnderFootprint: 3206250,
    tellTheOwner: 123,
    atRisk: 412,
  },
  {
    district: "Samphanthawong",
    districtTh: "เขตสัมพันธวงศ์",
    count: 723,
    medianDepthM: 13.3,
    medianFrontageM: 5.7,
    landFloorBahtM2: 62500,
    landPeakBahtM2: 250000,
    medianLandUnderFootprint: 4356250,
    tellTheOwner: 105,
    atRisk: 320,
  },
  {
    district: "Bang Rak",
    districtTh: "เขตบางรัก",
    count: 153,
    medianDepthM: 16.1,
    medianFrontageM: 5.0,
    landFloorBahtM2: 62500,
    landPeakBahtM2: 250000,
    medianLandUnderFootprint: 4893750,
    tellTheOwner: 15,
    atRisk: 111,
  },
  {
    district: "Thon Buri",
    districtTh: "เขตธนบุรี",
    count: 58,
    medianDepthM: 15.2,
    medianFrontageM: 7.0,
    landFloorBahtM2: 21250,
    landPeakBahtM2: 50000,
    medianLandUnderFootprint: 2034688,
    tellTheOwner: 0,
    atRisk: 17,
  },
  {
    district: "Bang Kho Laem",
    districtTh: "เขตบางคอแหลม",
    count: 56,
    medianDepthM: 11.2,
    medianFrontageM: 7.0,
    landFloorBahtM2: 62500,
    landPeakBahtM2: 250000,
    medianLandUnderFootprint: 4803125,
    tellTheOwner: 25,
    atRisk: 13,
  },
  {
    district: "Lat Krabang",
    districtTh: "เขตลาดกระบัง",
    count: 41,
    medianDepthM: 11.3,
    medianFrontageM: 6.9,
    landFloorBahtM2: 6250,
    landPeakBahtM2: 12500,
    medianLandUnderFootprint: 443125,
    tellTheOwner: 0,
    atRisk: 1,
  },
  {
    district: "Nong Chok",
    districtTh: "เขตหนองจอก",
    count: 24,
    medianDepthM: 21.8,
    medianFrontageM: 11.0,
    landFloorBahtM2: 3250,
    landPeakBahtM2: 7500,
    medianLandUnderFootprint: 703300,
    tellTheOwner: 0,
    atRisk: 0,
  },
  {
    district: "Pom Prap Sattru Phai",
    districtTh: "เขตป้อมปราบศัตรูพ่าย",
    count: 18,
    medianDepthM: 40.0,
    medianFrontageM: 14.8,
    landFloorBahtM2: 62500,
    landPeakBahtM2: 250000,
    medianLandUnderFootprint: 34465625,
    tellTheOwner: 0,
    atRisk: 13,
  },
  {
    district: "Khlong San",
    districtTh: "เขตคลองสาน",
    count: 1,
    medianDepthM: 23.2,
    medianFrontageM: 8.0,
    landFloorBahtM2: 21250,
    landPeakBahtM2: 50000,
    medianLandUnderFootprint: 3933375,
    tellTheOwner: 0,
    atRisk: 1,
  },
];

/** Where the two axes are cut, and the one assumption behind the setback axis. */
export const SPLITS = {
  /** Median land value under a single footprint, in baht. Above this = high pressure. */
  priceBaht: 3543750,
  /** Median plot depth in metres. Below this, a 6 m setback takes a large share. */
  depthM: 13.5,
  /** Metres of plot depth lost to the setback, on the assumed road width. */
  lossM: 2.0,
  /** Assumed carriageway width. MR55 measures the setback from the CENTRELINE. */
  assumedRoadM: 8.0,
} as const;

export const QUADRANTS = [
  {
    id: "tell-the-owner",
    label: "Worth reconsidering",
    count: 268,
    colour: "#e5007d",
    what: "High land value, shallow plot.",
    why: "Maximum pressure to demolish — and the plot is shallow enough that a compliant replacement loses a serious share of its footprint to the setback. Demolition here is closest to self-defeating, and it is the owner who is least likely to have been told.",
  },
  {
    id: "at-risk",
    label: "Genuinely exposed",
    count: 888,
    colour: "#111014",
    what: "High land value, deeper plot.",
    why: "The land is worth enough to justify clearing and the plot is deep enough to absorb a setback. On present rules these are the ones that go, and an argument for keeping them has to be made on carbon, tenure or social capital rather than on the code.",
  },
  {
    id: "lawful-reuse",
    label: "Reuse is the easy answer",
    count: 884,
    colour: "#ffe94a",
    what: "Lower land value, shallow plot.",
    why: "Little pressure to clear, and the setback would bite hard if anyone tried. Nothing needs defending here yet — which makes it the cheapest place to test what adaptive reuse actually costs.",
  },
  {
    id: "low-pressure",
    label: "Not under pressure",
    count: 271,
    colour: "#b9b4c0",
    what: "Lower land value, deeper plot.",
    why: "Neither the market nor the code is currently forcing a decision. Worth surveying precisely because there is time to do it properly.",
  },
] as const;

export const PRESSURE_TOTAL = 2311;

/** The caveats stated in this file's header, exported so the atlas page
    can print them instead of paraphrasing them. Keep in step with the
    header comment and with scripts/build-shophouse-pressure.py. */
export const PRESSURE_CAVEATS = [
  "Morphology is not proof. A narrow, deep footprint repeating along a street is the shophouse signature, but no field survey has confirmed that any individual building here is one, nor its age, condition or tenure.",
  "Appraised value is the base for transfer tax and sits below market, so every land figure is a floor rather than an estimate.",
  "The setback exposure assumes a road width, because per-plot road widths are not published — the assumption is stated in SPLITS and can be changed.",
] as const;
