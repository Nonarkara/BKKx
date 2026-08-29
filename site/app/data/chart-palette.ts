// The war room's categorical chart palette.
//
// Deliberately NOT exported from a "use client" module. The server component
// that builds the chart data imports these hues too, and a value imported
// from a client module into a server component arrives as a client-reference
// proxy — indexing it yields undefined, the style object collapses, and React
// drops the attribute. The result is a chart with correct geometry and no
// colour: it type-checks, it lints, and it passes an HTML test. It shows up
// only when a person looks at the page. (It did, on 2026-08-29.)
//
// Validated against the dark chart surface with the project's palette
// validator — all six checks PASS:
//   lightness band L 0.48–0.67 · chroma floor · CVD separation (worst
//   adjacent ΔE 9.9 deutan / 10.0 tritan) · normal-vision floor (worst
//   ΔE 16.0) · contrast >= 3:1.
// Do not add a sixth hue by eye; re-run the validator.
//
// The Console signal lime (#c9ff38) is absent on purpose: it means
// "signal / selected / primary action" everywhere else in this project, and
// spending it on a data series would make selection unreadable.
export const CAT = ["#4691c9", "#c97f33", "#c14190", "#8b7ad1", "#2f9e86"] as const;

/** One hue for magnitude — bars that all mean "more of the same thing". */
export const SEQ = "#4691c9";
