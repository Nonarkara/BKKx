import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  CREATOR,
  ELEVATION_IDS,
  CLIMATE_POST,
  SAFETY_POST,
  JACOBS_POST,
  SHOPHOUSE_TYPES,
  TO_CONFIRM,
  TYPOLOGY_RECORD,
  TYPOLOGY_STANCE,
  typologyPoints,
} from "../app/data/shophouse-typology.ts";

const LANGS = ["en", "th", "zh"];
const ARTICLE = "https://urbancreature.co/shophouse-supply/";
const POST = "https://www.instagram.com/p/DeG4utWGjvO/";
const POST_2 = "https://www.instagram.com/p/DeaILEpk_xF/";
const POST_3 = "https://www.instagram.com/p/DeUKkA8kvDF/";
const POST_4 = "https://www.instagram.com/p/Dedgqo9jFOM/";
const BANGKOK = { lat: [13.4, 14.2], lng: [100.2, 101.1] };

function text(value, label) {
  assert.equal(typeof value, "object", label);
  for (const lang of LANGS) {
    assert.equal(typeof value[lang], "string", `${label}.${lang}`);
    assert.ok(value[lang].trim().length > 0, `${label}.${lang} is empty`);
  }
}

test("every shophouse type is one complete trilingual entry", () => {
  assert.ok(SHOPHOUSE_TYPES.length >= 4);
  const ids = new Set();
  for (const entry of SHOPHOUSE_TYPES) {
    assert.match(entry.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, entry.id);
    assert.ok(!ids.has(entry.id), `duplicate id ${entry.id}`);
    ids.add(entry.id);
    text(entry.name, `${entry.id} name`);
    text(entry.era, `${entry.id} era`);
    text(entry.street, `${entry.id} street`);
    text(entry.district, `${entry.id} district`);
    text(entry.description, `${entry.id} description`);
    text(entry.drawingRef, `${entry.id} drawingRef`);
    assert.ok(entry.description.en.length >= 40, `${entry.id} description is thin`);
    assert.ok(entry.facade.length >= 1, `${entry.id} facade`);
    for (const feature of entry.facade) text(feature, `${entry.id} facade`);
    assert.ok(ELEVATION_IDS.includes(entry.elevation), `${entry.id} elevation`);
    assert.ok(entry.sources.length >= 1, `${entry.id} sources`);
    const urls = entry.sources.map((source) => source.url);
    assert.ok(urls.includes(ARTICLE), `${entry.id} missing the Urban Creature article`);
    assert.ok(urls.includes(POST), `${entry.id} missing the Instagram post`);
    assert.ok(urls.includes(POST_2), `${entry.id} missing the Jacobs post`);
    assert.ok(urls.includes(POST_3), `${entry.id} missing the climate post`);
    assert.ok(urls.includes(POST_4), `${entry.id} missing the safety comic`);
    const creditBlob = entry.sources.map((source) => `${source.title} ${source.credit}`).join(" ");
    assert.match(creditBlob, /@avanidoesart/);
    assert.match(creditBlob, /@urbanistcomix/);
    assert.match(creditBlob, /Pheangporn Khanti/);
    assert.match(creditBlob, /@shophouse\.supply/);
    assert.match(creditBlob, /Abhinav Bhardwaj/);
    assert.match(creditBlob, /@abhinavbwj/);
    assert.ok(entry.embed, `${entry.id} embed`);
    assert.equal(entry.embed.postUrl, POST);
    assert.equal(Number.isInteger(entry.embed.imageIndex), true);
    assert.ok(entry.embed.imageIndex >= 1, entry.id);
    for (const source of entry.sources) {
      assert.ok(source.url.startsWith("https://"), source.url);
      assert.ok(!source.url.includes("/wp-content/"), `${entry.id} must link, not copy, her image`);
      assert.ok(source.title.trim().length > 0 && source.credit.trim().length > 0, source.url);
    }
    assert.match(entry.drawingRef.en, /not reproduced/i, entry.id);
    const hasLat = typeof entry.lat === "number";
    const hasLng = typeof entry.lng === "number";
    assert.equal(hasLat, hasLng, `${entry.id} lat and lng are a pair`);
    if (hasLat) {
      assert.ok(entry.lat > BANGKOK.lat[0] && entry.lat < BANGKOK.lat[1], entry.id);
      assert.ok(entry.lng > BANGKOK.lng[0] && entry.lng < BANGKOK.lng[1], entry.id);
      assert.ok(!entry.toConfirm.includes("point"), `${entry.id} has a point and still marks it open`);
    } else {
      assert.ok(entry.toConfirm.includes("point"), `${entry.id} has no point`);
    }
    if (entry.toConfirm.includes("street")) assert.deepEqual(entry.street, TO_CONFIRM);
    if (entry.toConfirm.includes("district")) assert.deepEqual(entry.district, TO_CONFIRM);
    if (entry.toConfirm.includes("era")) assert.deepEqual(entry.era, TO_CONFIRM);
    if (entry.toConfirm.includes("facade")) {
      assert.equal(entry.facade.length, 1);
      assert.deepEqual(entry.facade[0], TO_CONFIRM);
      assert.equal(entry.elevation, "to-confirm");
    }
  }
});

test("Lat Phrao is the type Non grew up in, and its facade is not guessed", () => {
  const entry = SHOPHOUSE_TYPES.find((item) => item.id === "lat-phrao");
  assert.ok(entry, "lat-phrao");
  assert.equal(entry.featured.en, "The type Non grew up in");
  assert.match(entry.featured.th, /นน/);
  assert.match(entry.featured.th, /[ก-๙]/);
  assert.notEqual(entry.featured.th, entry.featured.en);
  assert.match(entry.featured.zh, /Non/);
  assert.match(entry.featured.zh, /\p{Script=Han}/u);
  assert.notEqual(entry.featured.zh, entry.featured.en);
  assert.equal(entry.street.en, "Lat Phrao Road");
  assert.equal(entry.street.th, "ถนนลาดพร้าว");
  assert.match(entry.street.zh, /拉抛/);
  assert.ok(!entry.toConfirm.includes("street"));
  for (const part of ["era", "district", "point"]) {
    assert.ok(entry.toConfirm.includes(part), part);
  }
  assert.equal(entry.lat, undefined);
  assert.equal(entry.lng, undefined);
  assert.match(entry.description.en, /stay open/i);
  assert.equal(entry.embed.imageIndex, 3);
  assert.equal(entry.elevation, "lat-phrao-row");
  assert.ok(!entry.toConfirm.includes("facade"));
  assert.match(entry.description.en, /two-storey/i);
});

test("the intro asks how a city houses people, and each type teaches a density lesson", () => {
  const { intro, sources } = TYPOLOGY_STANCE;
  text(intro, "intro");
  assert.match(intro.en, /large number of people/);
  assert.match(intro.en, /core identity/);
  assert.match(intro.en, /Glaeser/);
  assert.match(intro.en, /Goethert/);
  assert.match(intro.en, /middle-class NIMBYism/);
  assert.match(intro.th, /หนาแน่น/);
  assert.notEqual(intro.th, intro.en);
  assert.match(intro.zh, /密度/);
  assert.match(intro.zh, /\p{Script=Han}/u);
  assert.notEqual(intro.zh, intro.en);
  const urls = sources.map((source) => source.url);
  assert.ok(urls.includes("https://www.penguinrandomhouse.com/books/303439/triumph-of-the-city-by-edward-glaeser/"));
  assert.ok(urls.includes("https://web.archive.org/web/20231226060819/http://sigus.mit.edu/about.php"));
  assert.ok(urls.includes("https://web.archive.org/web/20241223082938/http://web.mit.edu/incrementalhousing/"));
  for (const source of sources) {
    assert.ok(source.url.startsWith("https://"), source.url);
    assert.ok(source.credit.includes("2026") || source.credit.includes("2011"), source.title);
  }
  for (const entry of SHOPHOUSE_TYPES) {
    assert.match(entry.description.en, /lesson/i, entry.id);
    assert.match(entry.description.th, /บทเรียน/, entry.id);
    assert.match(entry.description.zh, /课/, entry.id);
    assert.match(entry.description.en, /densit|adaptab/i, entry.id);
  }
  const contributing = readFileSync(new URL("../../CONTRIBUTING.md", import.meta.url), "utf8");
  assert.match(contributing, /Triumph of the City/);
  assert.match(contributing, /SIGUS/);
});

test("the cover types name the facades we can see, and no street we cannot", () => {
  const fin = SHOPHOUSE_TYPES.find((item) => item.id === "fin-and-flowerbox");
  const arch = SHOPHOUSE_TYPES.find((item) => item.id === "arch-and-column");
  const brick = SHOPHOUSE_TYPES.find((item) => item.id === "paired-window-brick");
  const features = (entry) => entry.facade.map((item) => item.en).join(" ");
  assert.match(features(fin), /Vertical fins/);
  assert.match(features(fin), /Flower-box balconies/);
  assert.match(features(fin), /Folding steel door/);
  assert.match(features(arch), /Arched upper windows/);
  assert.match(features(arch), /Columns/);
  assert.match(features(brick), /Brick facade/);
  assert.match(features(brick), /Paired windows/);
  assert.equal(fin.street.th, "ถนนบรรทัดทอง");
  assert.equal(fin.embed.imageIndex, 2);
  assert.equal(arch.street.th, "ย่านพระราม 4");
  assert.equal(arch.embed.imageIndex, 6);
  assert.deepEqual(brick.street, TO_CONFIRM);
  assert.equal(brick.embed.imageIndex, 1);
  const pratunam = SHOPHOUSE_TYPES.find((item) => item.id === "pratunam");
  assert.equal(pratunam.street.th, "ย่านประตูน้ำ");
  assert.equal(pratunam.embed.imageIndex, 5);
  for (const entry of [fin, arch, brick, pratunam]) {
    assert.ok(!entry.toConfirm.includes("facade"));
  }
});

test("the record keeps the article and both posts, and the embed script stays lazy", () => {
  assert.match(TYPOLOGY_RECORD.en, /857,000/);
  assert.match(TYPOLOGY_RECORD.en, /infrastructure for small business/);
  assert.match(TYPOLOGY_RECORD.en, /Singapore/);
  assert.match(TYPOLOGY_RECORD.th, /เพียงพร/);
  assert.match(TYPOLOGY_RECORD.zh, /857,000/);
  assert.match(TYPOLOGY_RECORD.en, /shape of a street sets its temperature/);
  assert.match(TYPOLOGY_RECORD.en, /0\.4 to 0\.6/);
  assert.match(TYPOLOGY_RECORD.en, /not a real site/);
  assert.match(TYPOLOGY_RECORD.th, /0\.4 ถึง 0\.6/);
  assert.match(TYPOLOGY_RECORD.zh, /0\.4 到 0\.6/);
  assert.equal(CLIMATE_POST.post, POST_3);
  assert.equal(CLIMATE_POST.imageIndex, 4);
  assert.match(TYPOLOGY_RECORD.en, /@avanidoesart/);
  assert.match(TYPOLOGY_RECORD.en, /@urbanistcomix/);
  assert.match(TYPOLOGY_RECORD.en, /line of sight/);
  assert.match(TYPOLOGY_RECORD.en, /Freezing the buildings/);
  assert.match(TYPOLOGY_RECORD.th, /@avanidoesart/);
  assert.match(TYPOLOGY_RECORD.zh, /@urbanistcomix/);
  assert.equal(SAFETY_POST.post, POST_4);
  assert.equal(SAFETY_POST.imageIndex, 3);
  const page = readFileSync(new URL("../app/shophouses/typology/TypologyView.tsx", import.meta.url), "utf8");
  assert.match(page, /SAFETY_POST/);
  assert.match(page, /CLIMATE_POST/);
  assert.equal(TYPOLOGY_STANCE.embed.postUrl, JACOBS_POST.post);
  assert.equal(TYPOLOGY_STANCE.embed.imageIndex, 8);
  assert.equal(CREATOR.post, POST);
  const view = readFileSync(new URL("../app/shophouses/typology/InstagramEmbed.tsx", import.meta.url), "utf8");
  assert.match(view, /blockquote/);
  assert.match(view, /instagram-media/);
  assert.match(view, /embed\.js/);
  assert.match(view, /IntersectionObserver/);
  const worker = readFileSync(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /script-src[^"]*https:\/\/www\.instagram\.com/);
  assert.match(worker, /frame-src[^"]*https:\/\/www\.instagram\.com/);
});

test("a pin exists only for an entry that has both coordinates", () => {
  assert.equal(typologyPoints().features.length, 0);
  const pinned = typologyPoints([
    {
      ...SHOPHOUSE_TYPES[1],
      lat: 13.75,
      lng: 100.5,
      toConfirm: ["street"],
    },
  ]);
  assert.equal(pinned.features.length, 1);
  assert.deepEqual(pinned.features[0].geometry.coordinates, [100.5, 13.75]);
});

test("the library tells a contributor to add one entry, and the map chrome stays short", () => {
  const contributing = readFileSync(new URL("../../CONTRIBUTING.md", import.meta.url), "utf8");
  assert.match(contributing, /shophouse-typology\.ts/);
  assert.match(contributing, /To confirm/);
  const css = readFileSync(new URL("../app/shophouses/typology/typology.css", import.meta.url), "utf8");
  assert.match(css, /\.typo-top\s*\{[^}]*height:\s*48px/);
  assert.match(css, /\.typo-bottom\s*\{[^}]*height:\s*56px/);
  assert.doesNotMatch(css, /linear-gradient|radial-gradient/);
  const drawings = readFileSync(new URL("../app/shophouses/typology/elevations.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(drawings, /linear-gradient|radial-gradient|foreignObject/);
});
