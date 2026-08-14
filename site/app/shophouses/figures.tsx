"use client";

import { useMemo, useState } from "react";
import { SHOPHOUSE_STOCK, SUKHUMVIT_PATTERN, PROJECTS, DOCUMENTED_OF_TOTAL } from "../data/shophouse-studio";
import { COEFFICIENTS, PAYBACK, COST, GAPS, UNIT, compare } from "../data/reuse-carbon";
import { ERAS, FINDINGS, READ_IN_FULL, MAP_1907 } from "../data/shophouse-research";
import { THESES } from "../data/shophouse-theses";
import type { FigureId } from "../data/shophouse-essay";
import { CorridorMap } from "./CorridorMap";

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

/* ---------------------------------------------------------------- stock */

function StockFigure() {
  const { peakUnits, currentUnits, currentUnitsAlt } = SHOPHOUSE_STOCK;
  const bars = [
    { label: "1960s–70s peak", value: peakUnits },
    { label: "Today (essay's two figures)", value: currentUnitsAlt },
    { label: "", value: currentUnits },
  ];
  return (
    <div className="sh-fig sh-stock">
      <div className="sh-stock-bars">
        {bars.map((b, i) => (
          <div className="sh-stock-row" key={i}>
            <span className="sh-stock-label">{b.label}</span>
            <div className="sh-stock-track">
              <div
                className={`sh-stock-fill${i === 0 ? " is-peak" : ""}`}
                style={{ width: `${(b.value / peakUnits) * 100}%` }}
              />
            </div>
            <span className="sh-stock-value">{fmt(b.value)}</span>
          </div>
        ))}
      </div>
      <p className="sh-fig-note">
        {SHOPHOUSE_STOCK.note} Source: {SHOPHOUSE_STOCK.source}.
      </p>
    </div>
  );
}

/* -------------------------------------------------------- sukhumvit map */

function PatternFigure() {
  return (
    <div className="sh-fig">
      <ol className="sh-pattern">
        {SUKHUMVIT_PATTERN.map((r) => {
          const intact = r.shophouses.startsWith("largely intact");
          return (
            <li key={r.road} className={intact ? "is-intact" : ""}>
              <strong>{r.road}</strong>
              <span className="sh-pattern-became">{r.became}</span>
              <span className="sh-pattern-status">{r.shophouses}</span>
            </li>
          );
        })}
      </ol>
      <p className="sh-fig-note">
        After Chuenrudeemol, “Shophouse Metropolis”. The studio site is the last one on the list.
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- carbon */

function CarbonFigure() {
  const [units, setUnits] = useState(20);
  const [useCase, setUseCase] = useState<"new-build-residential" | "new-build-office">(
    "new-build-residential",
  );
  const [showSources, setShowSources] = useState(false);

  const perUnitGia = UNIT.frontageM * UNIT.depthM * UNIT.storeys;
  const gia = Math.round(perUnitGia * units);
  const coeff = COEFFICIENTS.find((c) => c.id === useCase)!;
  const s = useMemo(() => compare(gia, coeff.value), [gia, coeff.value]);

  const max = Math.max(s.rebuildTotalKg, s.retrofitKg);
  const t = (kg: number) => `${fmt(Math.round(kg / 1000))} t`;

  return (
    <div className="sh-fig sh-carbon">
      <div className="sh-carbon-controls">
        <label>
          <span>Shophouse units</span>
          <input
            type="range"
            min={1}
            max={60}
            value={units}
            onChange={(e) => setUnits(Number(e.target.value))}
          />
          <output>
            {units} <small>≈ {fmt(gia)} m² GIA</small>
          </output>
        </label>
        <div className="sh-carbon-toggle" role="group" aria-label="Replacement building type">
          {(["new-build-residential", "new-build-office"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setUseCase(k)}
              aria-pressed={useCase === k}
              className={useCase === k ? "is-active" : ""}
            >
              {k === "new-build-residential" ? "Replaced by residential" : "Replaced by commercial"}
            </button>
          ))}
        </div>
      </div>

      <div className="sh-carbon-bars">
        <div className="sh-carbon-bar">
          <div className="sh-carbon-head">
            <span>Demolish &amp; rebuild</span>
            <strong>{t(s.rebuildTotalKg)}CO₂e</strong>
          </div>
          <div className="sh-carbon-track">
            <div
              className="sh-carbon-seg is-demo"
              style={{ width: `${(s.demolitionKg / max) * 100}%` }}
              title={`Demolition ${t(s.demolitionKg)}`}
            />
            <div
              className="sh-carbon-seg is-new"
              style={{ width: `${(s.newBuildKg / max) * 100}%` }}
              title={`New build ${t(s.newBuildKg)}`}
            />
          </div>
          <small>
            Demolition {t(s.demolitionKg)} + new build {t(s.newBuildKg)}. Writes off{" "}
            {t(s.lostStructureKg)} already standing in the frame and foundations.
          </small>
        </div>

        <div className="sh-carbon-bar">
          <div className="sh-carbon-head">
            <span>Retrofit &amp; reuse</span>
            <strong>{t(s.retrofitKg)}CO₂e</strong>
          </div>
          <div className="sh-carbon-track">
            <div
              className="sh-carbon-seg is-reuse"
              style={{ width: `${(s.retrofitKg / max) * 100}%` }}
            />
          </div>
          <small>
            Heavy-retrofit case. Keeps roughly 55% of embodied carbon that a demolition discards.
          </small>
        </div>
      </div>

      <p className="sh-carbon-result">
        <strong>{t(s.savedKg)}CO₂e</strong> not spent — about {Math.round(s.savedPct)}% — for{" "}
        {units} unit{units === 1 ? "" : "s"}.
      </p>

      <p className="sh-fig-note">
        Order-of-magnitude planning figures, not a certified assessment. The rebuild case assumes a
        like-for-like replacement; a developer replacing three storeys with thirty would multiply
        that side several times over. {PAYBACK.counterFinding}
      </p>

      <button
        type="button"
        className="sh-sources-toggle"
        onClick={() => setShowSources((v) => !v)}
        aria-expanded={showSources}
      >
        {showSources ? "Hide" : "Show"} every coefficient, source and gap
      </button>

      {showSources && (
        <div className="sh-sources">
          <h4>Coefficients</h4>
          <dl>
            {COEFFICIENTS.map((c) => (
              <div key={c.id}>
                <dt>
                  {c.label} — <strong>{c.range ? `${c.range[0]}–${c.range[1]}` : c.value}</strong>{" "}
                  {c.unit}
                </dt>
                <dd>
                  <em>{c.modules}.</em> {c.covers} <b>Excludes:</b> {c.excludes}{" "}
                  <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                    {c.source} ({c.year})
                  </a>
                </dd>
              </div>
            ))}
          </dl>

          <h4>Payback</h4>
          <p>
            {PAYBACK.finding}{" "}
            <a href={PAYBACK.sourceUrl} target="_blank" rel="noreferrer">
              {PAYBACK.source} ({PAYBACK.year})
            </a>
          </p>

          <h4>Cost — the evidence contradicts itself</h4>
          <ul>
            {COST.map((c) => (
              <li key={c.source}>
                {c.claim} — <b>{c.source}</b>, {c.year}. <em>{c.caveat}</em>
              </li>
            ))}
          </ul>

          <h4>What is missing</h4>
          <ul className="sh-gaps">
            {GAPS.map((g) => (
              <li key={g.gap}>
                <strong>{g.gap}</strong> {g.why} <em>{g.consequence}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- projects */

function ProjectsFigure() {
  const [open, setOpen] = useState<string | null>(PROJECTS[0].slug);
  return (
    <div className="sh-fig sh-projects">
      {PROJECTS.map((p) => {
        const isOpen = open === p.slug;
        return (
          <article key={p.slug} className={`sh-project${isOpen ? " is-open" : ""}`}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : p.slug)}
              aria-expanded={isOpen}
            >
              <span className="sh-project-system">{p.systemShort}</span>
              <span className="sh-project-title">{p.title}</span>
              <span className="sh-project-student">{p.student}</span>
            </button>
            {isOpen && (
              <div className="sh-project-body">
                <p>{p.move}</p>
                <dl>
                  <div>
                    <dt>System</dt>
                    <dd>{p.system}</dd>
                  </div>
                  <div>
                    <dt>Precedent from home</dt>
                    <dd>{p.homePrecedent}</dd>
                  </div>
                  <div>
                    <dt>Precedent in Bangkok</dt>
                    <dd>{p.bangkokPrecedent}</dd>
                  </div>
                  {p.figures.map((f) => (
                    <div key={f.label}>
                      <dt>{f.label}</dt>
                      <dd>{f.value}</dd>
                    </div>
                  ))}
                  <div>
                    <dt>Site</dt>
                    <dd>
                      {p.locationNote}{" "}
                      <em>({p.locationConfidence})</em>
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </article>
        );
      })}
      <p className="sh-fig-note">
        {DOCUMENTED_OF_TOTAL.documented} of {DOCUMENTED_OF_TOTAL.total} projects — the drafts
        supplied document five, and two of them appear in more than one file. The remaining four are
        not in the material provided, so they are not represented here.
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- tenure */

const TENURE_FIELDS = [
  { field: "tenure_status", type: "occupied | vacant | partial (ground let, upper vacant)", have: false },
  { field: "listed_for_sale", type: "boolean + asking price", have: false },
  { field: "listed_for_rent", type: "boolean + monthly rent, per floor", have: false },
  { field: "floors_available", type: "which storeys are separately lettable", have: false },
  { field: "vertical_access", type: "shared stair | shop-controlled stair | rear stair", have: false },
  { field: "structural_condition", type: "surveyed condition grade", have: false },
  { field: "footprint", type: "polygon geometry", have: true },
  { field: "frontage_m / depth_m / storeys", type: "measured morphology", have: true },
  { field: "corridor_distance_m", type: "distance to the road spine", have: true },
];

function TenureFigure() {
  const have = TENURE_FIELDS.filter((f) => f.have).length;
  return (
    <div className="sh-fig sh-tenure">
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Shape</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {TENURE_FIELDS.map((f) => (
            <tr key={f.field} className={f.have ? "is-have" : "is-empty"}>
              <td><code>{f.field}</code></td>
              <td>{f.type}</td>
              <td>{f.have ? "present" : "— no data —"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="sh-fig-note">
        {have} of {TENURE_FIELDS.length} fields have data, and all {have} are geometry. Tenure is not
        published in any open Thai dataset, so every field that a developer or a family would
        actually search on is empty. Filling them is a survey or a listings-feed agreement, not a
        modelling problem — which is exactly why this is drawn as a specification rather than
        demonstrated with invented listings.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- timeline */

function TimelineFigure() {
  const [open, setOpen] = useState<string | null>("rama-v");
  return (
    <div className="sh-fig sh-timeline">
      {ERAS.map((era) => {
        const isOpen = open === era.id;
        const isGap = era.id === "gap";
        return (
          <article key={era.id} className={`sh-era${isOpen ? " is-open" : ""}${isGap ? " is-gap" : ""}`}>
            <button type="button" onClick={() => setOpen(isOpen ? null : era.id)} aria-expanded={isOpen}>
              <span className="sh-era-period">{era.period}</span>
              <span className="sh-era-label">{era.label}</span>
              <span className="sh-era-storeys">{era.storeys}</span>
            </button>
            {isOpen && (
              <div className="sh-era-body">
                <p>{era.what}</p>
                {era.structure !== "—" && (
                  <p className="sh-era-structure">
                    <strong>Structure</strong> {era.structure}
                  </p>
                )}
                <p className="sh-fig-note">{era.source}</p>
              </div>
            )}
          </article>
        );
      })}
      <p className="sh-fig-note">
        Two periodisations exist in the literature and they do not reconcile — one material, one by
        reign, and the reign-based one contradicts itself on which king saw the first row. Both are
        shown rather than blended into a false consensus, and the unexplained 1896–1936 interval is
        marked as the gap it is. <strong>{MAP_1907.title}</strong>: {MAP_1907.what}{" "}
        {MAP_1907.digitisedNote}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- research */

function ResearchFigure() {
  const [openId, setOpenId] = useState<string | null>(FINDINGS[0].id);
  const bySection = THESES.reduce<Record<string, number>>((acc, t) => {
    acc[t.section] = (acc[t.section] ?? 0) + 1;
    return acc;
  }, {});
  return (
    <div className="sh-fig sh-research">
      <div className="sh-research-counts">
        {Object.entries(bySection).map(([s, n]) => (
          <span key={s}>
            <strong>{n}</strong> {SECTION_SHORT[s] ?? s}
          </span>
        ))}
      </div>

      <ol className="sh-findings">
        {FINDINGS.map((f) => {
          const isOpen = openId === f.id;
          return (
            <li key={f.id} className={isOpen ? "is-open" : ""}>
              <button type="button" onClick={() => setOpenId(isOpen ? null : f.id)} aria-expanded={isOpen}>
                {f.claim}
              </button>
              {isOpen && (
                <div className="sh-finding-body">
                  <p>{f.detail}</p>
                  {f.caveat && <p className="sh-finding-caveat">Caveat — {f.caveat}</p>}
                  <p className="sh-fig-note">
                    {f.url ? (
                      <a href={f.url} target="_blank" rel="noreferrer">
                        {f.source}
                      </a>
                    ) : (
                      f.source
                    )}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="sh-fig-note">
        {THESES.length} theses catalogued, {READ_IN_FULL.length} read in full for this essay.{" "}
        <a href="/shophouses/research">The whole bibliography, with links →</a>
      </p>
    </div>
  );
}

const SECTION_SHORT: Record<string, string> = {
  A: "on shophouses directly",
  B: "on old commercial buildings",
  C: "on historic districts",
  D: "from overseas universities",
  E: "open-access papers",
};

/* ---------------------------------------------------------------- index */

export function Figure({ id }: { id: FigureId }) {
  switch (id) {
    case "stock":
      return <StockFigure />;
    case "timeline":
      return <TimelineFigure />;
    case "sukhumvit-pattern":
      return <PatternFigure />;
    case "carbon":
      return <CarbonFigure />;
    case "corridor":
      return <CorridorMap />;
    case "projects":
      return <ProjectsFigure />;
    case "tenure":
      return <TenureFigure />;
    case "research":
      return <ResearchFigure />;
    default:
      return null;
  }
}
