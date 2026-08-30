"use client";

import { useId, useState } from "react";
import { SEQ } from "../data/chart-palette";

/* Chart primitives for the Console war room.
 *
 * Hand-authored SVG, no charting library — these are three forms (magnitude
 * bars, a composition bar, a stat tile) and a library would weigh more than
 * the code it replaced.
 *
 * The palette lives in ../data/chart-palette so the server component that
 * builds the chart data can import the same hues — see the note there.
 */

type Datum = { label: string; sub?: string; value: number; hue?: string };

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/* ------------------------------------------------------------------ *
 * Magnitude — horizontal bars, one series, ranked.
 * Labels sit outside the plot so long Thai district names never collide
 * with the mark, and the value is direct-labelled at the bar end rather
 * than on an axis the reader has to trace back to.
 * ------------------------------------------------------------------ */
export function BarList({
  data,
  caption,
  unit = "",
  max,
}: {
  data: Datum[];
  caption: string;
  unit?: string;
  max?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const top = max ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <figure className="wr-fig">
      <div className="wr-barlist" role="img" aria-label={caption}>
        {data.map((d, i) => {
          const pct = (d.value / top) * 100;
          return (
            <div
              key={d.label}
              className={`wr-bar-row${hover === i ? " is-hover" : ""}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
            >
              <span className="wr-bar-label">
                {d.label}
                {d.sub ? <small>{d.sub}</small> : null}
              </span>
              <span className="wr-bar-track">
                <span
                  className="wr-bar-fill"
                  style={{ width: `${Math.max(pct, 0.6)}%`, background: d.hue ?? SEQ }}
                />
              </span>
              <span className="wr-bar-value">
                {fmt(d.value)}
                {unit ? <small>{unit}</small> : null}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * Composition — one stacked bar, 2–4 parts of a stated whole.
 * Segments carry a 2px surface gap so adjacent fills never read as one
 * mark, and every segment is direct-labelled in the legend with its own
 * value; identity is never colour alone.
 * ------------------------------------------------------------------ */
export function CompositionBar({
  parts,
  total,
  caption,
  note,
}: {
  parts: { label: string; value: number; hue: string; meaning?: string }[];
  total: number;
  caption: string;
  note?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();

  return (
    <figure className="wr-fig">
      <div
        className="wr-comp"
        role="img"
        aria-label={`${caption}. ${parts.map((p) => `${p.label} ${p.value}`).join(", ")}. Total ${total}.`}
      >
        {parts.map((p, i) => (
          <span
            key={p.label}
            className={`wr-comp-seg${hover === i ? " is-hover" : ""}`}
            style={{ flexGrow: p.value, background: p.hue }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            title={`${p.label}: ${fmt(p.value)} of ${fmt(total)}`}
          />
        ))}
      </div>
      <ul className="wr-legend" aria-describedby={id}>
        {parts.map((p, i) => (
          <li
            key={p.label}
            className={hover === i ? "is-hover" : undefined}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="wr-swatch" style={{ background: p.hue }} aria-hidden="true" />
            <span className="wr-legend-label">{p.label}</span>
            <span className="wr-legend-value">
              {fmt(p.value)}
              <small>{((p.value / total) * 100).toFixed(1)}%</small>
            </span>
            {p.meaning ? <span className="wr-legend-meaning">{p.meaning}</span> : null}
          </li>
        ))}
      </ul>
      <figcaption id={id}>
        {caption}
        {note ? <em> {note}</em> : null}
      </figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------------ *
 * A single number that answers one question — no plot, so no hover.
 * ------------------------------------------------------------------ */
export function Tally({
  value,
  unit,
  label,
  sub,
  tone = "neutral",
}: {
  value: string | number;
  unit?: string;
  label: string;
  sub?: string;
  tone?: "neutral" | "signal" | "warn";
}) {
  return (
    <div className={`wr-tally is-${tone}`}>
      <p className="wr-tally-value">
        {typeof value === "number" ? fmt(value) : value}
        {unit ? <span className="wr-tally-unit">{unit}</span> : null}
      </p>
      <p className="wr-tally-label">{label}</p>
      {sub ? <p className="wr-tally-sub">{sub}</p> : null}
    </div>
  );
}

/* A plain table of the same numbers, collapsed by default. Every chart on
   this page is answerable without seeing colour. */
export function TableView({
  columns,
  rows,
  summary,
}: {
  columns: string[];
  rows: (string | number)[][];
  summary: string;
}) {
  return (
    <details className="wr-table-view">
      <summary>{summary}</summary>
      <div className="wr-table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={String(r[0])}>
                {r.map((cell, i) =>
                  i === 0 ? (
                    <th key={i} scope="row">{cell}</th>
                  ) : (
                    <td key={i}>{typeof cell === "number" ? fmt(cell) : cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
