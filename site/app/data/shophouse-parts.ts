import { ESSAY, FOOTNOTES, type Block, type Footnote } from "./shophouse-essay";

// The essay is ~11,000 words. One page of it was 50 phone screens, so it is
// read in five parts. Order and every word are unchanged: this only decides
// where the page breaks fall. `from` is the first h2 of each part.

export type Part = {
  n: number;
  title: string;
  dek: string;
  headings: string[];
  blocks: Block[];
  notes: Footnote[];
  minutes: number;
};

const SPEC: { title: string; dek: string; from: string }[] = [
  { title: "The case", dek: "Why the cheap, ugly row of shops works, and the arithmetic of what demolition costs.", from: "" },
  { title: "The honest limits", dek: "The concession, the ones that are fine, and what the screen cannot tell you.", from: "The concession I have to make first" },
  { title: "Seen from elsewhere", dek: "Shanghai, an elephant, a studio of students and the smart city already on the street.", from: "Four things Shanghai taught me" },
  { title: "What to build", dek: "What it looks like built, and three systems for the shophouse.", from: "What that looks like when you build it" },
  { title: "Reuse and the business", dek: "Reuse for what, who pays, the short version, and where I still walk to.", from: "Reuse for what, exactly" },
];

const NOTE = /\[\[(\d+)\]\]/g;

function blockText(b: Block): string {
  return "text" in b ? b.text : "caption" in b ? b.caption : "";
}

export const PARTS: Part[] = (() => {
  const starts = SPEC.map((s) => (s.from ? ESSAY.findIndex((b) => b.kind === "h2" && b.text === s.from) : 0));
  return SPEC.map((s, i) => {
    const blocks = ESSAY.slice(starts[i], i + 1 < SPEC.length ? starts[i + 1] : ESSAY.length);
    const seen = new Set<number>();
    for (const b of blocks) for (const m of blockText(b).matchAll(NOTE)) seen.add(Number(m[1]));
    const chars = blocks.reduce((a, b) => a + blockText(b).length, 0);
    return {
      n: i + 1,
      title: s.title,
      dek: s.dek,
      headings: blocks.filter((b) => b.kind === "h2").map((b) => (b as { text: string }).text),
      blocks,
      notes: FOOTNOTES.filter((f) => seen.has(f.n)),
      minutes: Math.max(1, Math.round(chars / 1400)),
    };
  });
})();

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}
