import { SIGNATURE, CLUSTERS, CLUSTER_UNITS_TOTAL } from "../../data/shophouse-gazetteer";
import { REGULATION } from "../../data/shophouse-bible";
import { PRESSURE_TOTAL } from "../../data/shophouse-pressure";

const PINK = "#e5007d";
const MARK = "#ffe94a";
const INK = "#111014";

/* -------------------------------------------------- dimensional signature */

function Histogram({
  bins, p10, p50, p90, label, unit, max, step,
}: {
  bins: readonly { x: number; n: number }[];
  p10: number; p50: number; p90: number;
  label: string; unit: string; max: number; step: number;
}) {
  const W = 640, H = 150;
  const M = { l: 34, r: 14, t: 12, b: 30 };
  const pw = W - M.l - M.r, ph = H - M.t - M.b;
  const peak = Math.max(...bins.map((b) => b.n), 1);
  const x = (v: number) => M.l + (v / max) * pw;
  const bw = (step / max) * pw;

  return (
    <figure className="sh-sig">
      <figcaption>
        <strong>{label}</strong>
        <span>
          p10 {p10}{unit} · median {p50}{unit} · p90 {p90}{unit}
        </span>
      </figcaption>
      <svg className="sh-section-svg" viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Distribution of ${label.toLowerCase()} across ${SIGNATURE.n} candidate footprints; median ${p50} ${unit}`}>
        {bins.map((b) => {
          const h = (b.n / peak) * ph;
          const inBand = b.x + step > p10 && b.x < p90;
          return (
            <rect key={b.x} x={x(b.x)} y={M.t + ph - h} width={Math.max(bw - 1, 1)} height={h}
              fill={inBand ? MARK : "#ece9ef"} stroke={INK} strokeWidth="0.6" />
          );
        })}
        <line x1={x(p50)} y1={M.t - 4} x2={x(p50)} y2={M.t + ph} stroke={PINK} strokeWidth="2" />
        <text className="sh-svg-dim" x={x(p50) + 5} y={M.t + 6} fill={PINK}>median {p50}{unit}</text>
        <line x1={M.l} y1={M.t + ph} x2={W - M.r} y2={M.t + ph} stroke={INK} strokeWidth="1" />
        {[0, max / 4, max / 2, (max * 3) / 4, max].map((t) => (
          <text key={t} className="sh-svg-dim" x={x(t)} y={H - 10} textAnchor="middle">{t}</text>
        ))}
        <text className="sh-svg-dim" x={M.l - 6} y={M.t + 8} textAnchor="end">{peak}</text>
        <text className="sh-svg-dim" x={M.l - 6} y={M.t + ph} textAnchor="end">0</text>
      </svg>
    </figure>
  );
}

export function DimensionalSignature() {
  return (
    <div className="sh-fig">
      <Histogram
        bins={SIGNATURE.frontage.hist} p10={SIGNATURE.frontage.p10}
        p50={SIGNATURE.frontage.p50} p90={SIGNATURE.frontage.p90}
        label="Frontage" unit=" m" max={SIGNATURE.frontage.max} step={SIGNATURE.frontage.step}
      />
      <Histogram
        bins={SIGNATURE.depth.hist} p10={SIGNATURE.depth.p10}
        p50={SIGNATURE.depth.p50} p90={SIGNATURE.depth.p90}
        label="Depth" unit=" m" max={SIGNATURE.depth.max} step={SIGNATURE.depth.step}
      />
      <p className="sh-fig-note">
        Measured across {SIGNATURE.n.toLocaleString()} candidate footprints screened from Overture
        and OpenStreetMap building geometry. Frontage and depth are the short and long sides of each
        footprint&apos;s minimum-area bounding rectangle. The shaded band is p10–p90. Note the depth
        tail: a tenth of the population runs past {SIGNATURE.depth.p90} m, which is where the
        24 m regulatory ceiling starts to bite and where the type stops behaving like a shophouse.
      </p>
    </div>
  );
}

/* --------------------------------------------------------- quick reference */

export function QuickReference() {
  return (
    <aside className="sh-quickref" aria-label="Quick reference">
      <p className="sh-eyebrow">If you only need the numbers</p>
      <dl>
        <div>
          <dt>Frontage</dt>
          <dd>{SIGNATURE.frontage.p50} m <small>median, measured</small></dd>
        </div>
        <div>
          <dt>Depth</dt>
          <dd>{SIGNATURE.depth.p50} m <small>median, measured</small></dd>
        </div>
        <div>
          <dt>Regulatory depth cap</dt>
          <dd>24 m <small>MR 55, ข้อ 41</small></dd>
        </div>
        <div>
          <dt>Setback</dt>
          <dd>6 m <small>from road centreline</small></dd>
        </div>
        <div>
          <dt>Row cap</dt>
          <dd>10 units / 40 m <small>firewall each 5</small></dd>
        </div>
        <div>
          <dt>Screened candidates</dt>
          <dd>{PRESSURE_TOTAL.toLocaleString()} <small>morphology only</small></dd>
        </div>
        <div>
          <dt>Documented clusters</dt>
          <dd>{CLUSTERS.length} <small>{CLUSTER_UNITS_TOTAL} counted units</small></dd>
        </div>
        <div>
          <dt>Regulations that bind</dt>
          <dd>{REGULATION.length} <small>listed in §3</small></dd>
        </div>
      </dl>
      <p className="sh-quickref-note">
        Every figure here is repeated below with its source and its caveat. Do not cite this card —
        cite the section.
      </p>
    </aside>
  );
}

/* ---------------------------------------------------------------- gazetteer */

const EVIDENCE_RANK: Record<string, { label: string; note: string }> = {
  registered: {
    label: "Registered",
    note: "On the Fine Arts Department register — legally protected.",
  },
  "published inventory": {
    label: "Counted",
    note: "Units counted in a published survey, but no statutory protection.",
  },
  "mapped corridor": {
    label: "Mapped only",
    note: "Geometry recorded; nobody has surveyed or counted it.",
  },
};

export function Gazetteer() {
  const byKind = CLUSTERS.reduce<Record<string, typeof CLUSTERS>>((acc, c) => {
    const k = c.kind ?? "other";
    (acc[k] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="sh-gazetteer">
      {Object.entries(byKind).map(([kind, items]) => (
        <section key={kind}>
          <h3>
            {kind} <small>{items.length}</small>
          </h3>
          <ul>
            {items.map((c) => {
              const ev = c.evidence ? EVIDENCE_RANK[c.evidence] : null;
              return (
                <li key={c.slug}>
                  <p className="sh-gaz-name">
                    {c.nameEn}
                    {c.nameTh && (
                      <span lang="th" className="sh-gaz-th"> {c.nameTh}</span>
                    )}
                  </p>
                  <p className="sh-gaz-meta">
                    <span className={`sh-gaz-ev is-${(c.evidence ?? "").replace(/\s+/g, "-")}`}>
                      {ev?.label ?? c.evidence}
                    </span>
                    {c.period && <span>{c.period}</span>}
                    {c.documentedUnits ? <span>{c.documentedUnits} units counted</span> : null}
                    {c.registerId && <span>Reg. {c.registerId}</span>}
                  </p>
                  {c.typology && <p className="sh-gaz-typology">{c.typology}</p>}
                  {c.note && <p>{c.note}</p>}
                  {c.source && (
                    <p className="sh-fig-note">
                      {c.sourceUrl ? (
                        <a href={c.sourceUrl} target="_blank" rel="noreferrer">{c.source}</a>
                      ) : c.source}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
