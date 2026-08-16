"use client";

// The Shophouse Health Index. Renders every curated town in composite
// score order (best at the top) with five 1–5 metrics and a verdict.
// Two interactivity surfaces:
//   1) Click a town to "pin" it into the comparison board below.
//   2) The board always shows two pinned towns side-by-side; clear
//      either pin to drop it.
//
// Singapore is the floor of the index on purpose. The Bangkok baseline
// is highlighted in red ink so the page always shows where the home
// city sits relative to the others.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  TOWNS,
  RANKED_TOWNS,
  SCORE_LEGEND,
  compositeScore,
  BANGKOK_BASELINE_ID,
  SINGAPORE_ID,
  type Town,
} from "../../data/shophouse-global";

const METRICS = [
  "authenticity",
  "continuity",
  "vitality",
  "restraint",
  "wisdom",
] as const;

const VERDICT_BG: Record<Town["score"]["verdict"], string> = {
  ideal: "#fffdf5",
  thriving: "#fffdf5",
  stable: "#fffdf5",
  vulnerable: "#ffe94a",
  lost: "#ff6b35",
};

const VERDICT_INK: Record<Town["score"]["verdict"], string> = {
  ideal: "#14140f",
  thriving: "#14140f",
  stable: "#14140f",
  vulnerable: "#14140f",
  lost: "#fffdf5",
};

export function RankingBoard() {
  const [pinned, setPinned] = useState<[string | null, string | null]>([
    BANGKOK_BASELINE_ID,
    SINGAPORE_ID,
  ]);

  const townsWithComposite = useMemo(
    () =>
      RANKED_TOWNS.map((t) => ({
        ...t,
        composite: compositeScore(t.score),
      })),
    [],
  );

  function togglePin(id: string) {
    setPinned(([a, b]) => {
      if (a === id) return [b, null];
      if (b === id) return [a, null];
      if (a === null) return [id, b];
      if (b === null) return [a, id];
      // both pinned — replace the older one
      return [b, id];
    });
  }

  return (
    <div className="sh-rank">
      <div className="sh-rank-tablewrap">
        <table className="sh-rank-table" aria-label="Shophouse Health Index">
          <thead>
            <tr>
              <th className="sh-rank-rank">#</th>
              <th className="sh-rank-name">Town</th>
              <th className="sh-rank-score" title="Composite score (mean of 5 metrics)">
                Score
              </th>
              {METRICS.map((m) => (
                <th
                  key={m}
                  className="sh-rank-metric"
                  title={SCORE_LEGEND[m].definition}
                >
                  {SCORE_LEGEND[m].label}
                  <small>1–5</small>
                </th>
              ))}
              <th className="sh-rank-verdict">Verdict</th>
              <th className="sh-rank-pin" aria-label="Pin for comparison" />
            </tr>
          </thead>
          <tbody>
            {townsWithComposite.map((t, i) => {
              const isBaseline = t.id === BANGKOK_BASELINE_ID;
              const isSingapore = t.id === SINGAPORE_ID;
              const isPinned = pinned[0] === t.id || pinned[1] === t.id;
              return (
                <tr
                  key={t.id}
                  className={[
                    isBaseline ? "is-baseline" : "",
                    isSingapore ? "is-singapore" : "",
                    isPinned ? "is-pinned" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <td className="sh-rank-rank">
                    <span className="sh-rank-rank-n">{i + 1}</span>
                  </td>
                  <td className="sh-rank-name">
                    <strong>{t.name}</strong>
                    <small>
                      {t.country}
                      {t.protection === "UNESCO" ? " · UNESCO" : ""}
                    </small>
                  </td>
                  <td className="sh-rank-score">
                    <CompositeBar score={t.composite} />
                  </td>
                  {METRICS.map((m) => (
                    <td key={m} className="sh-rank-metric">
                      <ScoreCell value={t.score[m]} />
                    </td>
                  ))}
                  <td className="sh-rank-verdict">
                    <span
                      className="sh-rank-verdict-pill"
                      style={{
                        background: VERDICT_BG[t.score.verdict],
                        color: VERDICT_INK[t.score.verdict],
                      }}
                    >
                      {t.score.verdict}
                    </span>
                    {isBaseline ? (
                      <small className="sh-rank-baseline-tag">← Bangkok</small>
                    ) : null}
                  </td>
                  <td className="sh-rank-pin">
                    <button
                      type="button"
                      onClick={() => togglePin(t.id)}
                      aria-pressed={isPinned}
                      className="sh-rank-pin-btn"
                    >
                      {isPinned ? "Pinned" : "Pin"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ComparisonBoard pinned={pinned} setPinned={setPinned} towns={TOWNS} />

      <p className="sh-rank-legend">
        <strong>How to read this.</strong> 5 is the best on every metric. The
        composite is the simple mean. Singapore is the floor on purpose — the
        HDB-style shophouse revival is what the Bangkok Sukhumvit 71 corridor
        should not end up as. A <em>vulnerable</em> verdict means the town scores
        high but its continuity is fragile (e.g. tourism-dependent); a{" "}
        <em>lost</em> verdict means the trading community is gone and the stock
        is a backdrop.
      </p>
    </div>
  );
}

function CompositeBar({ score }: { score: number }) {
  // 1.0 = red, 5.0 = ink
  const w = ((score - 1) / 4) * 100;
  const color =
    score >= 4.0
      ? "#14140f"
      : score >= 3.0
      ? "#5f5b66"
      : score >= 2.0
      ? "#8c2f23"
      : "#ff6b35";
  return (
    <div className="sh-rank-score-cell" aria-label={`Composite ${score.toFixed(1)} of 5`}>
      <div className="sh-rank-score-bar">
        <div
          className="sh-rank-score-fill"
          style={{ width: `${Math.max(w, 4)}%`, background: color }}
        />
      </div>
      <span className="sh-rank-score-num">{score.toFixed(1)}</span>
    </div>
  );
}

function ScoreCell({ value }: { value: number }) {
  // Five pips, filled up to value
  return (
    <div className="sh-rank-pips" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`sh-rank-pip${n <= value ? " is-on" : ""}`}
        />
      ))}
    </div>
  );
}

function ComparisonBoard({
  pinned,
  setPinned,
  towns,
}: {
  pinned: [string | null, string | null];
  setPinned: (v: [string | null, string | null]) => void;
  towns: Town[];
}) {
  const a = pinned[0] ? towns.find((t) => t.id === pinned[0]) : null;
  const b = pinned[1] ? towns.find((t) => t.id === pinned[1]) : null;
  if (!a && !b) {
    return (
      <div className="sh-rank-compare is-empty">
        <p>
          <strong>Compare two towns.</strong> Click <em>Pin</em> on any row to
          put it here. Bangkok is pinned by default against Singapore.
        </p>
      </div>
    );
  }
  return (
    <div className="sh-rank-compare">
      <header className="sh-rank-compare-head">
        <h3>Side by side</h3>
        <p>Five-metric comparison. The composite is the simple mean.</p>
      </header>
      <div className="sh-rank-compare-grid">
        {[a, b].map((t, i) =>
          t ? (
            <CompareCard
              key={t.id}
              town={t}
              onClear={() => {
                const next: [string | null, string | null] =
                  i === 0 ? [null, pinned[1]] : [pinned[0], null];
                setPinned(next);
              }}
            />
          ) : (
            <div className="sh-rank-compare-empty" key={`empty-${i}`}>
              <p>Pin a town to compare</p>
            </div>
          ),
        )}
      </div>
      {a && b ? (
        <div className="sh-rank-compare-delta">
          <p>
            <strong>Δ Composite</strong>{" "}
            {(compositeScore(a.score) - compositeScore(b.score) > 0
              ? "+"
              : "") +
              (compositeScore(a.score) - compositeScore(b.score)).toFixed(1)}
            . Per-metric:{" "}
            {METRICS.map((m) => {
              const d = a.score[m] - b.score[m];
              if (d === 0) return null;
              return (
                <span key={m} className={`sh-rank-compare-delta-chip is-${d > 0 ? "ahead" : "behind"}`}>
                  {m} {d > 0 ? `+${d}` : d}
                </span>
              );
            })}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function CompareCard({
  town,
  onClear,
}: {
  town: Town;
  onClear: () => void;
}) {
  return (
    <article className="sh-rank-compare-card">
      <header>
        <p className="sh-rank-compare-card-eyebrow">
          {town.country}
          {town.protection === "UNESCO" ? " · UNESCO" : ""}
          {town.id === BANGKOK_BASELINE_ID ? " · Bangkok baseline" : ""}
        </p>
        <h4>
          {town.name}{" "}
          <Link
            href={`#town-${town.id}`}
            className="sh-rank-compare-card-anchor"
            aria-label={`Jump to ${town.name} profile`}
          >
            ↗
          </Link>
        </h4>
        <button type="button" onClick={onClear} className="sh-rank-compare-clear">
          Unpin
        </button>
      </header>
      <div className="sh-rank-compare-card-score">
        <strong>{compositeScore(town.score).toFixed(1)}</strong>
        <span>composite of 5.0</span>
      </div>
      <dl className="sh-rank-compare-card-metrics">
        {METRICS.map((m) => (
          <div key={m}>
            <dt>{SCORE_LEGEND[m].label}</dt>
            <dd>
              <ScoreCell value={town.score[m]} />
            </dd>
          </div>
        ))}
      </dl>
      <p className="sh-rank-compare-card-editorial">{town.score.editorial}</p>
    </article>
  );
}
