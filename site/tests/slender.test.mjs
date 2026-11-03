// Named chedis and throne pavilions far narrower than their height must be
// flagged, or they draw as 20-40 m columns in the Grand Palace.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => JSON.parse(readFileSync(new URL(`../public/data/${f}`, import.meta.url), "utf8")).features;

test("Grand Palace chedis and pavilions are pads, not columns", () => {
  const lm = read("bkk-landmarks.geojson");
  const flagged = (re) => lm.filter((f) => re.test(f.properties.name ?? ""));
  for (const f of flagged(/มหาเจดีย์|พระเจดีย์ทรงเครื่อง|พระสุวรรณเจดีย์|พระที่นั่งสนามจันทร์/)) {
    assert.equal(f.properties.slender, true, f.properties.name);
  }
});

test("halls and unnamed buildings keep their boxes", () => {
  for (const file of ["bkk-landmarks.geojson", "bkk-heritage-detail.geojson"]) {
    for (const f of read(file).filter((x) => x.properties.slender)) {
      assert.ok(f.properties.name, "an unnamed building is never guessed into a spire");
      assert.doesNotMatch(f.properties.name, /วิหาร|อุโบสถ/);
    }
  }
});
