# Flood Edition — evidence before simulation

Approved direction: 3D Bangkok with animated flood-report evidence, deeper inspection and preserved heritage functions.

The `/flood` route reuses AtlasView without replacing the heritage homepage. Its report layer reads `/api/flood/evidence`, a same-origin allowlisted adapter for FloodDash `/api/traffic` (iTIC/Longdo). Polling: 60 seconds. Upstream fetch time, not browser fetch time, determines the 15-minute stale state. Stale copies remain labelled and static. Only reports from the last 24 hours inside 100.2–101 E / 13.4–14.2 N are accepted; the UI defaults to three hours. This bounding box includes neighbouring provinces, so it is labelled Bangkok region.

Resident descriptions, photos and contributor fields are not forwarded. Titles have labelled attribution/contact suffixes removed and phone/email patterns redacted; arbitrary unlabelled names cannot reliably be distinguished from place names. Source points have unspecified positional accuracy: no road-segment closure, flood boundary, depth interpolation or safe-route claim is generated. Repeated reports may concern the same event. Source stop times are not treated as verified clearance. Depth, when provided, is reported rather than measured.

Ripples draw attention to report locations. They are not hydrodynamic simulation. Reduced-motion and pause controls disable them. A keyboard-accessible list gives equivalent inspection and camera navigation. District-only reports, assistance statuses and currents require separate contracts before rendering; they are explicitly unavailable in this layer.

Preserved: Atlas geometry, buildings, camera controls, source layers, heritage routes, existing drainage and operational pages. Tests cover sanitization, invalid coordinates/time, duplicate IDs and freshness. Browser gates: report selection, search, time filter, pause, mobile layout, and heritage regression. Release requires build/lint/tests, push/deploy and live verification.
