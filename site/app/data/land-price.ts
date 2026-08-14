// Land value under a shophouse.
//
// The tenure view has no rent and no sale data, because Thailand publishes
// neither. But it can carry the one commercial number that IS public, and it
// happens to be the number that decides these buildings' fate: what the dirt
// is worth. A developer's case for demolition is not really an argument about
// the building at all. It is an argument that the land is worth more without it.
//
// Source is the same Treasury (กรมธนารักษ์) appraisal dataset already powering
// the land-price layer on atlas.nonarkara.org, re-used here rather than
// re-sourced so the two systems cannot drift apart.
//
// TWO conversions matter and both are easy to get wrong:
//   * Thai land is appraised per ตารางวา (square wah). 1 wah² = 4 m².
//     Every figure below is divided by 4 to reach a per-m² price.
//   * Appraised value is not market value. Treasury appraisal is the base for
//     transfer tax and generally sits BELOW what a plot actually trades for,
//     so the numbers here understate the pressure rather than exaggerate it.

export const LAND_PRICE_SOURCE = {
  dataset: "Treasury Department (กรมธนารักษ์) draft appraisal round",
  via: "Home Buyers Team analysis, per Tanunpong Suksomsak (Director, Property Appraisal Division), Prachachat Business, 9 December 2020",
  url: "https://www.home.co.th/hometips/new-land-appraisal-price-53898",
  sharedWith: "atlas.nonarkara.org land-price layer",
  caveats: [
    "A media summary of Treasury DRAFT data, not the official gazette.",
    "Quoted per square wah in the source; converted here at 1 wah² = 4 m².",
    "Appraised value is the base for transfer tax and typically sits below market value — these figures understate the pressure on the plot.",
    "The source has no entry for Sukhumvit 71 / Pridi Banomyong itself. The nearest documented band is Sukhumvit Road at Soi 40/42/59/63; the district-group floor is used as the low end.",
  ],
} as const;

const WAH2_TO_M2 = 4;

export type PriceBand = {
  id: string;
  label: string;
  note: string;
  bahtPerWah2: number;
};

/** The district group Sukhumvit 71 sits inside: Watthana / Khlong Toei / Phra Khanong. */
export const CORRIDOR_BANDS: PriceBand[] = [
  {
    id: "group-floor",
    label: "District-group floor",
    note: "The lowest new appraisal in the Watthana / Khlong Toei / Phra Khanong group — an inner soi, off the main road.",
    bahtPerWah2: 190_000,
  },
  {
    id: "thong-lo",
    label: "Thong Lo Road",
    note: "The neighbouring cross-street that already lost its shophouses.",
    bahtPerWah2: 500_000,
  },
  {
    id: "soi-40-63",
    label: "Sukhumvit Rd, Soi 40/42/59/63",
    note: "The nearest documented band to Soi 71 — the main-road frontage a few sois west.",
    bahtPerWah2: 600_000,
  },
  {
    id: "peak",
    label: "Sukhumvit Rd at Asok",
    note: "The group's peak, for scale.",
    bahtPerWah2: 750_000,
  },
];

export function bahtPerM2(band: PriceBand): number {
  return band.bahtPerWah2 / WAH2_TO_M2;
}

/** Land value under one shophouse footprint at the studio's measured median. */
export function landValueUnderUnit(band: PriceBand, footprintM2: number): number {
  return bahtPerM2(band) * footprintM2;
}

export const CITY_PEAK = {
  road: "Ploenchit Road / Witthayu Road",
  bahtPerWah2: 1_000_000,
  note: "The most expensive appraised land in Bangkok, for scale.",
} as const;
