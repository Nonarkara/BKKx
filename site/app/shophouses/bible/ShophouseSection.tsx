"use client";

import { useState } from "react";

// The anatomy drawing. A long section through a four-storey shophouse at the
// consensus dimensions — 4 m frontage, 12 m depth, 3.5 m ground storey, 3 m
// above — labelled with Tirapas's eight spatial elements.
//
// The toggle is the argument. "As built" puts the stair at the back, which is
// what almost every shophouse in Bangkok does: it frees the shopfront for
// trade and leaves the middle of every upper floor with no light from either
// end. "Tirapas" moves it to the centre, which is what he proposed in print —
// rooms then reach both façades and the dark middle disappears. Same envelope,
// same structure, same floor area.

const W = 720;
const H = 430;
const M = { l: 58, r: 26, t: 26, b: 46 };
const PLAN_W = W - M.l - M.r;
const PLAN_H = H - M.t - M.b;

const DEPTH_M = 12;
const STOREYS = [3.5, 3, 3, 3]; // ground first
const TOTAL_H = STOREYS.reduce((a, b) => a + b, 0);

const SEAL = "#8c2f23";
const INK = "#14140f";
const QUIET = "#6b6a60";

const mx = (m: number) => M.l + (m / DEPTH_M) * PLAN_W;
const my = (m: number) => M.t + PLAN_H - (m / TOTAL_H) * PLAN_H;

export function ShophouseSection() {
  const [midStair, setMidStair] = useState(false);

  // Stair footprint in plan-depth terms: 1.2 m run, at the back or centred.
  const stairDepth = 1.2;
  const stairAt = midStair ? DEPTH_M / 2 - stairDepth / 2 : DEPTH_M - 1.0 - stairDepth;

  const floorTops: number[] = [];
  let acc = 0;
  for (const s of STOREYS) {
    acc += s;
    floorTops.push(acc);
  }

  // Which stretch of each upper floor gets no daylight from either façade.
  // Light reaches ~3 m in from a façade; the stair blocks what it occupies.
  const REACH = 3.2;
  const darkFrom = REACH;
  const darkTo = DEPTH_M - REACH;
  const darkSpans = midStair
    ? [
        [darkFrom, stairAt],
        [stairAt + stairDepth, darkTo],
      ]
    : [[darkFrom, darkTo]];

  return (
    <div className="sh-section-fig">
      <div className="sh-section-controls">
        <button
          type="button"
          onClick={() => setMidStair(false)}
          aria-pressed={!midStair}
          className={!midStair ? "is-active" : ""}
        >
          Stair at the back — as built
        </button>
        <button
          type="button"
          onClick={() => setMidStair(true)}
          aria-pressed={midStair}
          className={midStair ? "is-active" : ""}
        >
          Stair in the middle — Tirapas
        </button>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="sh-section-svg"
        role="img"
        aria-label={
          midStair
            ? "Long section of a shophouse with the stair moved to the centre, showing rooms reaching both façades"
            : "Long section of a shophouse with the stair at the back, showing the unlit middle of each upper floor"
        }
      >
        <rect x={0} y={0} width={W} height={H} fill="none" />

        {/* dark middle — drawn first, sits behind the structure */}
        {floorTops.slice(0, -1).map((top, i) =>
          darkSpans.map(([a, b], j) =>
            b - a > 0.15 ? (
              <rect
                key={`d${i}-${j}`}
                x={mx(a)}
                y={my(floorTops[i + 1])}
                width={mx(b) - mx(a)}
                height={my(top) - my(floorTops[i + 1])}
                fill={INK}
                opacity={0.13}
              />
            ) : null,
          ),
        )}

        {/* ground line */}
        <line x1={M.l - 14} y1={my(0)} x2={W - M.r + 8} y2={my(0)} stroke={INK} strokeWidth={1.5} />

        {/* floor slabs */}
        {[0, ...floorTops].map((f, i) => (
          <line
            key={`f${i}`}
            x1={mx(0)}
            y1={my(f)}
            x2={mx(DEPTH_M)}
            y2={my(f)}
            stroke={INK}
            strokeWidth={i === floorTops.length ? 1.6 : 1}
          />
        ))}

        {/* party walls front and back */}
        <line x1={mx(0)} y1={my(0)} x2={mx(0)} y2={my(TOTAL_H)} stroke={INK} strokeWidth={1.4} />
        <line x1={mx(DEPTH_M)} y1={my(0)} x2={mx(DEPTH_M)} y2={my(TOTAL_H)} stroke={INK} strokeWidth={1.4} />

        {/* the stair, on every floor */}
        {floorTops.slice(0, -1).map((top, i) => (
          <g key={`s${i}`}>
            <rect
              x={mx(stairAt)}
              y={my(floorTops[i + 1])}
              width={mx(stairAt + stairDepth) - mx(stairAt)}
              height={my(top) - my(floorTops[i + 1])}
              fill={SEAL}
              opacity={0.16}
            />
            <line
              x1={mx(stairAt)}
              y1={my(top)}
              x2={mx(stairAt + stairDepth)}
              y2={my(floorTops[i + 1])}
              stroke={SEAL}
              strokeWidth={1.6}
            />
          </g>
        ))}

        {/* daylight arrows at each façade, upper floors */}
        {floorTops.slice(0, -1).map((top, i) => {
          const yMid = (my(top) + my(floorTops[i + 1])) / 2;
          return (
            <g key={`l${i}`} stroke={SEAL} strokeWidth={1} opacity={0.75}>
              <line x1={mx(0) - 12} y1={yMid} x2={mx(0.9)} y2={yMid} />
              <line x1={mx(DEPTH_M) + 12} y1={yMid} x2={mx(DEPTH_M - 0.9)} y2={yMid} />
            </g>
          );
        })}

        {/* element labels */}
        <ElementTag x={mx(0.35)} y={my(TOTAL_H) - 8} text="T · terrace" anchor="start" />
        <ElementTag x={mx(0.35)} y={my(1.6)} text="F · front" anchor="start" />
        <ElementTag x={mx(2.4)} y={my(1.6)} text="H · hall (double height)" anchor="start" />
        <ElementTag x={mx(stairAt + stairDepth + 0.25)} y={my(4.9)} text="C · circulation" anchor="start" />
        <ElementTag x={mx(DEPTH_M - 0.4)} y={my(1.6)} text="S · service" anchor="end" />
        <ElementTag x={mx(DEPTH_M) + 6} y={my(TOTAL_H) + 16} text="R · roof deck" anchor="end" />
        {!midStair && (
          <ElementTag
            x={mx((darkFrom + darkTo) / 2)}
            y={my(7.4)}
            text="no daylight from either façade"
            anchor="middle"
            muted
          />
        )}

        {/* dimension: depth */}
        <g stroke={QUIET} strokeWidth={0.8}>
          <line x1={mx(0)} y1={my(0) + 22} x2={mx(DEPTH_M)} y2={my(0) + 22} />
          <line x1={mx(0)} y1={my(0) + 17} x2={mx(0)} y2={my(0) + 27} />
          <line x1={mx(DEPTH_M)} y1={my(0) + 17} x2={mx(DEPTH_M)} y2={my(0) + 27} />
        </g>
        <text x={mx(DEPTH_M / 2)} y={my(0) + 38} textAnchor="middle" className="sh-svg-dim">
          12.0 m depth · 4.0 m frontage · 4 × 4 m module
        </text>

        {/* dimension: storeys */}
        {[0, ...floorTops].slice(0, -1).map((f, i) => (
          <text key={`h${i}`} x={M.l - 12} y={(my(f) + my(floorTops[i])) / 2 + 4} textAnchor="end" className="sh-svg-dim">
            {STOREYS[i].toFixed(1)} m
          </text>
        ))}
      </svg>

      <p className="sh-fig-note">
        Long section at the consensus dimensions — 4 m frontage, 12 m depth, 3.5 m ground storey and
        3 m above, on Tirapas&apos;s 4 × 4 m module. Elements lettered after his taxonomy. The
        shaded band is the stretch of each upper floor beyond daylight reach from either façade;
        moving the stair to the centre splits it, which is the change he proposed and which
        Ministerial Regulation No. 11 classifies as a demolition. Same envelope, same structure,
        same floor area.
      </p>
    </div>
  );
}

function ElementTag({
  x,
  y,
  text,
  anchor,
  muted,
}: {
  x: number;
  y: number;
  text: string;
  anchor: "start" | "middle" | "end";
  muted?: boolean;
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={`sh-svg-tag${muted ? " is-muted" : ""}`}>
      {text}
    </text>
  );
}
