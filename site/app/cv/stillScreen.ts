/* Water screening over agency CCTV stills — FloodDash's detector, BKKx's cadence.

   The detector (detect.js) and the persistence rule (floodEvidence.js) are
   FloodDash's, copied rather than re-derived. What differs is the input:
   FloodDash reads live video several times a second, while BKKx shows iTIC /
   Longdo stills that refresh every 30 s. So:

   - Only the still-scene classes run: water and haze. Motion between two
     stills half a minute apart is not movement in FloodDash's sense, and
     the vehicle/person shapes it would draw are not offered.
   - Persistence is counted in stills: three, spanning at least a minute,
     the same region each time (IoU ≥ 0.5, ≥ 5% of the image), none more
     than 75 s after the last. 75 s tolerates one late refresh, not two.
   - A still identical to the previous one is not a new sample. A frozen
     upstream camera or a cached proxy would otherwise "persist" forever;
     it resets to unknown instead.
   - A frame the browser cannot read is unknown, never clear.

   Nothing here leaves the browser, and no state outlives the page. The
   output is a reason to look at the picture: never a depth, never
   "flooded", never "dry". */
import { W, H, toPlanes, detectWater, detectHaze } from "./detect.js";
import { createFloodEvidence, currentFloodEvidence, floodEvidenceText } from "./floodEvidence.js";

export const STILL_TIMING = { maxGapMs: 75_000, minSpanMs: 60_000, minSamples: 3 } as const;

/** Mean absolute luma change below this means the same image was served again.
 *  Two separately encoded JPEGs of an unchanged scene still differ by more. */
export const REPEAT_MAX_MEAN_DELTA = 0.05;

export type ImageLike = { data: Uint8ClampedArray | Uint8Array; width: number; height: number };

export type WaterRegion = {
  x0: number; y0: number; x1: number; y1: number;
  areaFrac: number; evidence?: string;
};

export type StillEvidence = {
  state: "unknown" | "checking" | "possible_flooding";
  reason: string;
  at?: number;
  spanMs?: number;
  samples?: number;
  imageFraction?: number;
  region?: WaterRegion;
  /** Size of the analysed frame, so a region can be drawn over any display size. */
  frame?: { w: number; h: number };
  method?: string;
};

function meanAbsDelta(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

/** One camera's screening state across successive stills. */
export function createStillScreen() {
  const tracker = createFloodEvidence(STILL_TIMING);
  let lastGray: Float32Array | null = null;
  return {
    reset() {
      tracker.reset();
      lastGray = null;
    },
    /** A still that could not be read (tainted, broken, zero-size). */
    unreadable(at: number): StillEvidence {
      tracker.reset();
      lastGray = null;
      return { state: "unknown", reason: "unreadable", at };
    },
    push(frame: ImageLike, at: number): StillEvidence {
      const planes = toPlanes(frame);
      const repeated = lastGray !== null && meanAbsDelta(lastGray, planes.gray) < REPEAT_MAX_MEAN_DELTA;
      lastGray = planes.gray;
      if (repeated) {
        tracker.reset();
        return { state: "unknown", reason: "repeated_frame", at };
      }
      // The same two still-scene detectors analyse() runs, in the same shape.
      const findings: Array<Record<string, unknown>> = [];
      for (const w of detectWater(planes)) {
        findings.push({ cls: "water", ...w, box: { x0: w.x0, y0: w.y0, x1: w.x1, y1: w.y1 } });
      }
      const haze = detectHaze(planes);
      if (haze) findings.push({ cls: "haze", ...haze });
      const evidence = tracker.update({ findings, blind: false }, at) as StillEvidence;
      return { ...evidence, frame: { w: planes.w, h: planes.h } };
    },
  };
}

/** Evidence older than the gap rule allows is no longer about the current picture. */
export function currentStillEvidence(evidence: StillEvidence | null, now: number): StillEvidence {
  if (evidence && evidence.state === "unknown" && Number.isFinite(evidence.at)
    && now >= (evidence.at as number) && now - (evidence.at as number) <= STILL_TIMING.maxGapMs) {
    return evidence;
  }
  return currentFloodEvidence(evidence, now, STILL_TIMING.maxGapMs) as StillEvidence;
}

export function stillEvidenceText(evidence: StillEvidence | null, lang: "en" | "th" = "en"): string {
  const th = lang === "th";
  if (evidence?.reason === "repeated_frame") {
    return th ? "ภาพนิ่งไม่เปลี่ยน · ประเมินไม่ได้" : "Still not advancing · cannot assess";
  }
  if (evidence?.reason === "unreadable") {
    return th ? "อ่านภาพไม่ได้ · ประเมินไม่ได้" : "Frame unreadable · cannot assess";
  }
  return floodEvidenceText(evidence, lang);
}

/** Draw a loaded still at analysis size. Null when the browser will not hand
 *  the pixels over (a cross-origin still taints the canvas). */
export function readStill(img: HTMLImageElement): ImageLike | null {
  if (!img.complete || img.naturalWidth === 0) return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, W, H);
    return ctx.getImageData(0, 0, W, H);
  } catch {
    return null;
  }
}
