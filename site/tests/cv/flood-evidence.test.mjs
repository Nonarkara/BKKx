import test from 'node:test'
import assert from 'node:assert/strict'
import { createFloodEvidence, currentFloodEvidence, floodEvidenceText } from '../../app/cv/floodEvidence.js'
import { toPlanes, detectWater, analyse } from '../../app/cv/detect.js'
import { W, H } from '../../app/cv/detect.js'

const region = { cls: 'water', areaFrac: 0.2, x0: 10, x1: 90, y0: 50, y1: 89 }
const sample = (findings = [region]) => ({ findings, motionRatio: 0 })

test('flood screening requires advancing samples, time and same spatial region, not traffic', () => {
  const tracker = createFloodEvidence()
  assert.equal(tracker.update(sample(), 0).state, 'checking')
  assert.equal(tracker.update(sample(), 2500).state, 'checking')
  const evidence = tracker.update(sample(), 5000)
  assert.equal(evidence.state, 'possible_flooding')
  assert.equal(evidence.samples, 3)
  assert.equal(evidence.spanMs, 5000)
  assert.equal(evidence.imageFraction, 0.2)
  assert.equal(tracker.update(sample([{ cls: 'vehicle' }, { cls: 'person' }]), 6000).state, 'unknown')
})

test('gaps, repeated timestamps, moving reflections and reset cannot accumulate persistence', () => {
  const tracker = createFloodEvidence()
  tracker.update(sample(), 0)
  tracker.update(sample(), 2500)
  assert.equal(tracker.update(sample(), 2500).samples, 1)
  assert.equal(tracker.update(sample(), 6000).samples, 1)
  const distant = { ...region, x0: 100, x1: 159 }
  assert.equal(tracker.update(sample([distant]), 7000).samples, 1)
  tracker.reset()
  assert.equal(tracker.update(sample([distant]), 8000).samples, 1)
})

test('haze, tiny patches, blind and missing findings cannot become flood evidence', () => {
  for (const result of [sample([]), sample([{ ...region, areaFrac: 0.01 }]), sample([region, { cls: 'haze' }]), { ...sample(), blind: true }, null]) {
    const tracker = createFloodEvidence()
    for (const t of [0, 2500, 5000, 7500]) assert.equal(tracker.update(result, t).state, 'unknown')
  }
})

test('stale evidence expires and never becomes a dry/safe/confirmed verdict', () => {
  const evidence = { state: 'possible_flooding', at: 5000 }
  assert.equal(currentFloodEvidence(evidence, 8000).state, 'possible_flooding')
  assert.equal(currentFloodEvidence(evidence, 8001).state, 'unknown')
  assert.equal(currentFloodEvidence(evidence, 4000).state, 'unknown')
  assert.equal(currentFloodEvidence({ state: 'possible_flooding', at: NaN }, 5000).state, 'unknown')
  assert.match(floodEvidenceText(evidence), /Possible flooding/)
  assert.match(floodEvidenceText(null), /unknown/)
  assert.match(floodEvidenceText(null, 'th'), /ประเมิน/)
})

test('water image coverage uses actual resolution, not a hardcoded 160x90 denominator', () => {
  const width = 320, height = 180
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = (y * width + x) * 4
    data.set(y >= 120 ? [150, 165, 190, 255] : [70, 72, 70, 255], p)
  }
  const findings = detectWater(toPlanes({ data, width, height }))
  assert.ok(findings.length > 0)
  for (const f of findings) {
    const expected = (f.x1 - f.x0 + 1) * (f.y1 - f.y0 + 1) / (width * height)
    assert.ok(Math.abs(f.areaFrac - expected) < 0.00001)
    assert.ok(f.areaFrac <= 1)
  }
  const frame = { data, width, height }
  const analysed = analyse(frame, frame).findings.filter(f => f.cls === 'water')
  assert.ok(analysed.length > 0)
  for (const f of analysed) assert.deepEqual(f.box, { x0: f.x0, y0: f.y0, x1: f.x1, y1: f.y1 })
})


// ── BKKx: the same rule over 30-second stills (app/cv/stillScreen.ts) ──
import { createStillScreen, currentStillEvidence, stillEvidenceText, STILL_TIMING } from '../../app/cv/stillScreen.ts'
import { VIDEO_TIMING } from '../../app/cv/floodEvidence.js'

/** A street with a bright smooth bluish band low in frame; `seed` varies the
 *  sky and road so each still is a fresh encode, not the same bytes. */
function still({ water = true, seed = 0 } = {}) {
  const data = new Uint8ClampedArray(W * H * 4)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = (y * W + x) * 4
    const n = ((x * 7 + y * 13 + seed * 31) % 5) - 2
    if (y < 30) data.set([120 + n, 140 + n, 170 + n, 255], p)          // sky
    else if (water && y >= 54) data.set([150 + n, 165 + n, 190 + n, 255], p) // reflective band
    else data.set([60 + 4 * n, 62 + 4 * n, 60 + 4 * n, 255], p)        // textured road
  }
  return { data, width: W, height: H }
}

test('FloodDash defaults are untouched: the parameter only adds a cadence', () => {
  assert.deepEqual(VIDEO_TIMING, { maxGapMs: 3000, minSpanMs: 5000, minSamples: 3 })
  assert.ok(STILL_TIMING.maxGapMs > 30_000 && STILL_TIMING.maxGapMs < 90_000, 'one late 30 s refresh, not two')
})

test('three advancing stills over a minute become possible flooding, never more', () => {
  const s = createStillScreen()
  assert.equal(s.push(still({ seed: 1 }), 0).state, 'checking')
  assert.equal(s.push(still({ seed: 2 }), 30_000).state, 'checking')
  const e = s.push(still({ seed: 3 }), 60_000)
  assert.equal(e.state, 'possible_flooding')
  assert.equal(e.samples, 3)
  assert.deepEqual(e.frame, { w: W, h: H })
  assert.match(stillEvidenceText(e), /Possible flooding · inspect footage/)
  assert.doesNotMatch(JSON.stringify(e), /confirmed|depth|\bdry\b|\bsafe\b/i)
})

test('a still served twice is not persistence; it resets to unknown', () => {
  const s = createStillScreen()
  const same = still({ seed: 1 })
  s.push(same, 0)
  const again = s.push(same, 30_000)
  assert.equal(again.state, 'unknown')
  assert.equal(again.reason, 'repeated_frame')
  assert.equal(s.push(still({ seed: 2 }), 60_000).samples, 1, 'counting restarts after a frozen still')
  assert.match(stillEvidenceText(again), /not advancing/)
})

test('a missed pair of refreshes, a dry street or an unreadable frame cannot accumulate', () => {
  const s = createStillScreen()
  s.push(still({ seed: 1 }), 0)
  assert.equal(s.push(still({ seed: 2 }), 100_000).samples, 1, 'a 100 s gap breaks continuity')
  assert.equal(s.push(still({ water: false, seed: 3 }), 130_000).state, 'unknown')
  const u = s.unreadable(160_000)
  assert.equal(u.state, 'unknown')
  assert.match(stillEvidenceText(u), /unreadable/)
  assert.match(stillEvidenceText(null), /not an all-clear/)
})

test('still evidence expires on the still gap rule, and unknown stays unknown', () => {
  const s = createStillScreen()
  s.push(still({ seed: 1 }), 0); s.push(still({ seed: 2 }), 30_000)
  const e = s.push(still({ seed: 3 }), 60_000)
  assert.equal(currentStillEvidence(e, 60_000 + STILL_TIMING.maxGapMs).state, 'possible_flooding')
  assert.equal(currentStillEvidence(e, 60_001 + STILL_TIMING.maxGapMs).state, 'unknown')
  assert.equal(currentStillEvidence(null, 0).state, 'unknown')
})
