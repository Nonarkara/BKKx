"use client";

// Static SVG world map of East Asia + Southeast Asia showing the origin
// ports in southern China, the overseas shophouse towns, and the dated
// migration vectors between them. Equirectangular projection, sharp
// edges, no animation, no MapLibre — a paper map for a paper site.
//
// Hover a town to see the verdict in the legend; the same information
// appears below as full text per town.

import { useState } from "react";
import {
  ORIGIN_PORTS,
  TOWNS,
  MIGRATION_ROUTES,
  type Town,
} from "../../data/shophouse-global";

const VB_W = 980;
const VB_H = 600;
// Bounding box (degrees): longitudes 78 E to 125 E, latitudes -8 N to 42 N.
// This covers southern China, mainland SE Asia, the Indonesian/Malay
// archipelago as far south as Jakarta, and Sri Lanka (Galle at 80.2 E
// is the westernmost point we need to show).
const LON_MIN = 78;
const LON_MAX = 125;
const LAT_MIN = -8;
const LAT_MAX = 42;
const PAD_L = 40;
const PAD_R = 60;
const PAD_T = 32;
const PAD_B = 40;

function proj(lon: number, lat: number): [number, number] {
  const x = PAD_L + ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (VB_W - PAD_L - PAD_R);
  const y = PAD_T + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (VB_H - PAD_T - PAD_B);
  return [x, y];
}

const COLOUR_TOWN: Record<Town["protection"], string> = {
  UNESCO: "#e5007d",
  national: "#111014",
  regional: "#5f5b66",
  none: "#a4a69b",
};

const VERDICT_LABEL: Record<Town["impact"]["verdict"], string> = {
  "family-firm surviving": "Family-firm surviving",
  gentrified: "Gentrified",
  overtouristed: "Overtouristed",
  transformed: "Transformed",
  frozen: "Frozen",
  abandoned: "Abandoned",
  "research-stage": "Research stage",
};

export function GlobalMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const focus = hovered ? TOWNS.find((t) => t.id === hovered) : null;

  return (
    <figure className="sh-globalmap">
      <svg
        className="sh-section-svg"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label="Map of East and Southeast Asia showing origin ports, shophouse towns and migration routes."
      >
        {/* Frame */}
        <rect
          x={0}
          y={0}
          width={VB_W}
          height={VB_H}
          fill="#fffdf5"
          stroke="#111014"
          strokeWidth={1}
        />

        {/* Latitude / longitude grid */}
        <g stroke="rgba(17,16,20,0.10)" strokeWidth={0.5} fill="none">
          {Array.from({ length: 7 }).map((_, i) => {
            const lon = LON_MIN + ((i + 1) * (LON_MAX - LON_MIN)) / 8;
            const [x1] = proj(lon, LAT_MAX);
            const [x2] = proj(lon, LAT_MIN);
            return <line key={`lat${i}`} x1={x1} y1={PAD_T} x2={x2} y2={VB_H - PAD_B} />;
          })}
          {Array.from({ length: 6 }).map((_, i) => {
            const lat = LAT_MIN + ((i + 1) * (LAT_MAX - LAT_MIN)) / 7;
            const [, y1] = proj(LON_MIN, lat);
            const [, y2] = proj(LON_MAX, lat);
            return <line key={`lon${i}`} x1={PAD_L} y1={y1} x2={VB_W - PAD_R} y2={y2} />;
          })}
        </g>

        {/* Equator, marked */}
        {(() => {
          const [, y] = proj(LON_MIN, 0);
          return (
            <g>
              <line
                x1={PAD_L}
                y1={y}
                x2={VB_W - PAD_R}
                y2={y}
                stroke="rgba(17,16,20,0.30)"
                strokeWidth={0.6}
                strokeDasharray="2 4"
              />
              <text x={PAD_L + 4} y={y - 3} fontSize={9} fill="#5f5b66" fontFamily="ui-monospace, monospace">
                equator
              </text>
            </g>
          );
        })()}

        {/* Country / region land mass — schematic, hand-traced.
           Not a coastline. The point is to anchor a place name to a
           believable blob so the reader does not have to keep looking
           at the legend. */}
        <g fill="rgba(20,20,15,0.06)" stroke="rgba(20,20,15,0.30)" strokeWidth={0.7}>
          {/* China mainland (southern + eastern) */}
          <path d={landmass.china} />
          {/* Indochina */}
          <path d={landmass.indochina} />
          {/* Malay peninsula */}
          <path d={landmass.malay} />
          {/* Sumatra */}
          <path d={landmass.sumatra} />
          {/* Java */}
          <path d={landmass.java} />
          {/* Borneo (schematic) */}
          <path d={landmass.borneo} />
          {/* Philippines (schematic) */}
          <path d={landmass.philippines} />
          {/* Sri Lanka */}
          <path d={landmass.srilanka} />
        </g>

        {/* Country labels */}
        <g
          fontSize={11}
          fontFamily='"IBM Plex Sans Thai", "Sao Chingcha", sans-serif'
          fill="#5f5b66"
          fontWeight={600}
        >
          <CountryText name="CHINA" lon={108} lat={36} />
          <CountryText name="INDIA" lon={86} lat={22} />
          <CountryText name="MYANMAR" lon={97} lat={21} />
          <CountryText name="THAILAND" lon={101} lat={17} />
          <CountryText name="LAOS" lon={103} lat={19} />
          <CountryText name="VIETNAM" lon={108} lat={14} />
          <CountryText name="CAMBODIA" lon={105} lat={13} />
          <CountryText name="MALAYSIA" lon={102} lat={5} />
          <CountryText name="INDONESIA" lon={113} lat={-3} />
          <CountryText name="PHILIPPINES" lon={121} lat={13} />
          <CountryText name="SRI LANKA" lon={81} lat={9} />
        </g>

        {/* Migration routes — drawn from origin to town, curved.
           Stroke style signals the protection tier of the destination. */}
        <g fill="none" stroke="#8c2f23" strokeWidth={1.1} opacity={0.75}>
          {MIGRATION_ROUTES.map((r) => {
            const from = ORIGIN_PORTS.find((o) => o.id === r.from);
            const to = TOWNS.find((t) => t.id === r.to);
            if (!from || !to) return null;
            const [x1, y1] = proj(from.lon, from.lat);
            const [x2, y2] = proj(to.lon, to.lat);
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - 30; // control point above the line
            return (
              <path
                key={r.id}
                d={`M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                strokeDasharray="3 4"
                opacity={hovered && hovered !== to.id ? 0.18 : 1}
              />
            );
          })}
        </g>

        {/* Origin ports (China) — square markers, distinctive */}
        <g>
          {ORIGIN_PORTS.map((p) => {
            const [x, y] = proj(p.lon, p.lat);
            return (
              <g key={p.id}>
                <rect
                  x={x - 5}
                  y={y - 5}
                  width={10}
                  height={10}
                  fill="#fffdf5"
                  stroke="#8c2f23"
                  strokeWidth={1.6}
                />
                <text
                  x={x + 9}
                  y={y + 3}
                  fontSize={10}
                  fontWeight={700}
                  fontFamily='"IBM Plex Sans Thai", "Sao Chingcha", sans-serif'
                  fill="#14140f"
                >
                  {p.name}
                </text>
              </g>
            );
          })}
        </g>

        {/* Overseas towns — round markers, colour by protection */}
        <g>
          {TOWNS.map((t) => {
            const [x, y] = proj(t.lon, t.lat);
            const isFocus = hovered === t.id;
            return (
              <g
                key={t.id}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered((id) => (id === t.id ? null : id))}
                onFocus={() => setHovered(t.id)}
                onBlur={() => setHovered((id) => (id === t.id ? null : id))}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`${t.name}, ${t.country}. ${VERDICT_LABEL[t.impact.verdict]}.`}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isFocus ? 8 : 5}
                  fill={COLOUR_TOWN[t.protection]}
                  stroke="#fffdf5"
                  strokeWidth={1.5}
                />
                <text
                  x={x + 9}
                  y={y + 3}
                  fontSize={10}
                  fontWeight={isFocus ? 700 : 500}
                  fontFamily='"IBM Plex Sans Thai", "Sao Chingcha", sans-serif'
                  fill={isFocus ? "#14140f" : "#5f5b66"}
                >
                  {t.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Hover / focus info bar */}
      <figcaption className="sh-globalmap-cap">
        {focus ? (
          <>
            <strong>{focus.name}</strong> · {focus.country} ·{" "}
            <span className={`sh-globalmap-verdict is-${focus.impact.verdict}`}>
              {VERDICT_LABEL[focus.impact.verdict]}
            </span>
            <small>
              {focus.period} · {focus.kind}
              {focus.community ? ` · ${focus.community}` : ""}
            </small>
          </>
        ) : (
          <>
            <strong>Hover a town</strong> to see its verdict, period and
            community. Square markers are Chinese origin ports; round markers
            are overseas shophouse towns. Dashed arcs are dated migration
            vectors.
          </>
        )}
      </figcaption>
    </figure>
  );
}

function CountryText({
  name,
  lon,
  lat,
}: {
  name: string;
  lon: number;
  lat: number;
}) {
  const [x, y] = proj(lon, lat);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      style={{ letterSpacing: "0.10em" }}
    >
      {name}
    </text>
  );
}

// Hand-traced schematic landmasses in the projected coordinate space.
// Not a coastline — readable blobs that anchor the eye. With the wider
// bbox (78 E to 125 E to include Sri Lanka), the China blob sits further
// right in the canvas; the rest is anchored by the projection math.
const landmass = {
  china: "M 200 100 L 520 100 L 540 230 L 490 290 L 420 320 L 360 320 L 310 300 L 280 270 L 260 240 L 220 200 L 190 160 Z",
  indochina:
    "M 310 290 L 420 290 L 460 330 L 450 380 L 420 420 L 370 430 L 330 410 L 310 380 L 300 340 Z",
  malay:
    "M 340 430 L 380 430 L 390 480 L 380 510 L 360 530 L 350 510 L 345 480 Z",
  sumatra: "M 310 510 L 380 510 L 410 570 L 380 580 L 330 570 L 310 540 Z",
  java: "M 420 575 L 520 575 L 570 600 L 420 600 Z",
  borneo: "M 470 470 L 570 470 L 600 530 L 540 545 L 480 530 Z",
  philippines: "M 570 300 L 625 290 L 640 360 L 600 410 L 570 400 L 560 350 Z",
  srilanka: "M 35 380 L 60 380 L 75 420 L 50 440 L 30 410 Z",
  india: "M 0 200 L 80 200 L 130 280 L 130 350 L 100 400 L 60 420 L 0 420 Z",
};
