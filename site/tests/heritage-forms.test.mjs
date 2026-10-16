import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildForm, classify, fitRect, earClip, toLocal, openRing } from '../app/atlas/[district]/heritage-forms.ts';

const forms = JSON.parse(readFileSync(new URL('../public/data/bkk-heritage-forms.json', import.meta.url), 'utf8')).forms;
const byName = (n) => forms.find((f) => f.name === n);

test('the buildings that define Rattanakosin get their own form, not a box', () => {
  assert.equal(byName('พระศรีรัตนเจดีย์')?.kind, 'chedi');
  assert.equal(byName('พระศรีรัตนเจดีย์')?.finish, 'gold');
  assert.equal(byName('พระมณฑป')?.kind, 'mondop');
  assert.equal(byName('ปราสาทพระเทพบิดร')?.kind, 'prasat');
  // Wat Phra Kaew's eight Phra Atthamaha Chedi are prangs, though named chedi.
  assert.equal(byName('พระสัมมาสัมพุทธมหาเจดีย์')?.kind, 'prang');
  assert.equal(forms.filter((f) => f.id.startsWith('form-wat-arun')).length, 5);
  assert.equal(byName('พระอุโบสถ')?.kind, 'hall');
});

test('names decide before shapes; a named non-temple building is never given a temple roof', () => {
  const ring = [[100.5, 13.75], [100.5003, 13.75], [100.5003, 13.7501], [100.5, 13.7501], [100.5, 13.75]];
  const f = (props) => ({ geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'x', building: 'temple', render_height: 16, ...props } });
  assert.equal(classify(f({ name: 'โรงเรียนพุทธศาสนา' })), null);
  assert.equal(classify(f({ name: 'พระที่นั่งบรมพิมาน' })), null, 'throne halls without ปราสาท may be European; style unknown');
  assert.equal(classify(f({ name: null }))?.kind, 'hall', 'an unnamed long temple building reads as a hall');
  assert.equal(classify(f({ name: null, render_height: 1 })), null, 'too low to carry a form');
});

test('a mondop name is never claimed by the hall rule', () => {
  // มณเฑียร (scripture repository) is a mondop. Its name begins "หอ", and the
  // hall rule for "หอพระ" sits *after* the mondop rule, so a missing spelling
  // does not fail loudly — it quietly becomes a hall, or matches nothing and
  // disappears from the published file. Both happened:
  //   หอพระธาตุมณเฑียร  was published as kind "hall"
  //   หอมณเฑียรธรรม   matched no rule at all and was dropped from the file
  const ring = [[100.5, 13.75], [100.5003, 13.75], [100.5003, 13.7501], [100.5, 13.7501], [100.5, 13.75]];
  const f = (name) => ({ geometry: { type: 'Polygon', coordinates: [ring] }, properties: { id: 'x', building: 'temple', render_height: 16, name } });
  for (const name of ['พระมณฑป', 'มณฑป', 'หอพระธาตุมณเฑียร', 'หอมณเฑียรธรรม', 'หอมณเฑียรวัดสุทัศน', 'หอระฆัง', 'หอไตร']) {
    assert.equal(classify(f(name))?.kind, 'mondop', `${name} must read as a mondop`);
  }
});

test('the published file agrees: no mondop name is shipped as another form', () => {
  // Assert on the artefact, not just the function — the defect that shipped was
  // baked into bkk-heritage-forms.json, and a classifier test alone would not
  // have caught a stale or hand-edited data file.
  for (const f of forms) {
    if (!f.name) continue;
    if (/มณฑป|มณเฑียร/.test(f.name)) {
      assert.equal(f.kind, 'mondop', `${f.name} is published as ${f.kind}`);
    }
  }
  // And the building that was dropped entirely must be back.
  assert.ok(byName('หอมณเฑียรธรรม'), 'หอมณเฑียรธรรม must be present in the published forms');
  assert.equal(byName('หอมณเฑียรธรรม')?.kind, 'mondop');
  assert.equal(byName('หอพระธาตุมณเฑียร')?.kind, 'mondop');
});

test('every form builds finite geometry that stays inside its envelope', () => {
  for (const spec of forms) {
    const { positions, colors } = buildForm(spec);
    assert.ok(positions.length > 0 && positions.length % 9 === 0, spec.id);
    assert.equal(colors.length, positions.length, spec.id);
    let zMax = -Infinity, zMin = Infinity;
    for (let i = 2; i < positions.length; i += 3) { zMax = Math.max(zMax, positions[i]); zMin = Math.min(zMin, positions[i]); }
    assert.ok(positions.every(Number.isFinite), spec.id);
    assert.ok(zMin >= spec.base - 0.01, `${spec.id} below its base`);
    // Chofa and merlons may rise a little past the roof line; nothing towers.
    assert.ok(zMax <= spec.base + spec.height * 1.12 + 1.2, `${spec.id} taller than its envelope (${zMax.toFixed(1)} > ${(spec.base + spec.height).toFixed(1)})`);
  }
});

test('geometry primitives: oriented rectangle and ear clipping', () => {
  const rot = (a) => [[0, 0], [20, 0], [20, 8], [0, 8]].map(([x, y]) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]);
  const r = fitRect(rot(0.6));
  assert.ok(Math.abs(r.hl - 10) < 1e-6 && Math.abs(r.hw - 4) < 1e-6);
  assert.equal(earClip([[0, 0], [4, 0], [4, 4], [2, 1], [0, 4]]).length, 3, 'a concave pentagon is three triangles');
  assert.deepEqual(openRing([[1, 1], [2, 2], [1, 1]]), [[1, 1], [2, 2]]);
  assert.ok(Math.abs(toLocal([100.5028, 13.7511])[0]) < 1e-9);
});
