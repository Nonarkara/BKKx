// The three diagrams the argument actually turns on, which until now existed
// only as prose: the setback trap, the land-locked stair, and the difference
// between installing a smart-city layer and legitimising the one running.
//
// Drawn rather than charted, because each is a geometric or logical fact, not
// a dataset. Palette follows the poster register: pink carries the argument,
// yellow marks the thing worth taking away, black is structure.

const PINK = "#e5007d";
const MARK = "#ffe94a";
const INK = "#111014";
const QUIET = "#5f5b66";

/* ------------------------------------------------------------ setback trap */

export function SetbackFigure() {
  // One 12 m-deep plot on an 8 m road. Existing building fills the plot; the
  // lawful replacement must sit 6 m back from the road centreline, which on
  // this geometry is 2 m behind the existing façade.
  const W = 720;
  const H = 300;
  const roadW = 8; // metres, kerb to kerb
  const plotD = 12; // metres, pavement to rear boundary
  const setbackFromCentre = 6; // metres, MR55 ข้อ 41
  const totalM = roadW / 2 + plotD; // drawn from road centreline back
  const left = 60;
  const right = 92;
  const spanPx = W - left - right;
  const mx = (m: number) => left + (m / totalM) * spanPx;

  const kerb = roadW / 2; // pavement edge, measured from centreline
  const rear = roadW / 2 + plotD;
  const lawfulFace = setbackFromCentre;

  const yTop = 70;
  const yBase = 210;

  return (
    <svg className="sh-section-svg" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Section across a road showing that a replacement building must stand behind the line of the building it replaces">
      {/* road centreline */}
      <line x1={mx(0)} y1={40} x2={mx(0)} y2={yBase + 20} stroke={QUIET} strokeWidth="1" strokeDasharray="4 4" />
      <text className="sh-svg-tag is-muted" x={mx(0)} y={32} textAnchor="middle">road centreline</text>

      {/* ground */}
      <line x1={left - 10} y1={yBase} x2={W - right} y2={yBase} stroke={INK} strokeWidth="1.5" />

      {/* existing building — fills plot to the pavement */}
      <rect x={mx(kerb)} y={yTop} width={mx(rear) - mx(kerb)} height={yBase - yTop}
        fill={MARK} stroke={INK} strokeWidth="1.5" />
      <text className="sh-svg-tag" x={(mx(kerb) + mx(rear)) / 2} y={yTop + 24} textAnchor="middle">
        The shophouse standing today
      </text>
      <text className="sh-svg-dim" x={(mx(kerb) + mx(rear)) / 2} y={yTop + 42} textAnchor="middle">
        12 m deep · built before the rule
      </text>

      {/* lawful replacement envelope */}
      <rect x={mx(lawfulFace)} y={yTop + 58} width={mx(rear) - mx(lawfulFace)} height={yBase - yTop - 58}
        fill="none" stroke={PINK} strokeWidth="2" />
      <text className="sh-svg-tag" x={(mx(lawfulFace) + mx(rear)) / 2} y={yTop + 80} textAnchor="middle" fill={PINK}>
        What may lawfully replace it
      </text>

      {/* the lost strip */}
      <rect x={mx(kerb)} y={yTop + 58} width={mx(lawfulFace) - mx(kerb)} height={yBase - yTop - 58}
        fill={PINK} opacity="0.14" />
      <line x1={mx(lawfulFace)} y1={yTop + 52} x2={mx(lawfulFace)} y2={yBase} stroke={PINK} strokeWidth="2" />

      {/* setback dimension */}
      <line x1={mx(0)} y1={yBase + 26} x2={mx(lawfulFace)} y2={yBase + 26} stroke={PINK} strokeWidth="1" />
      <line x1={mx(0)} y1={yBase + 21} x2={mx(0)} y2={yBase + 31} stroke={PINK} strokeWidth="1" />
      <line x1={mx(lawfulFace)} y1={yBase + 21} x2={mx(lawfulFace)} y2={yBase + 31} stroke={PINK} strokeWidth="1" />
      <text className="sh-svg-dim" x={(mx(0) + mx(lawfulFace)) / 2} y={yBase + 44} textAnchor="middle" fill={PINK}>
        6 m setback required from centreline
      </text>

      {/* pavement + rear labels */}
      <text className="sh-svg-dim" x={mx(kerb)} y={yBase + 16} textAnchor="middle">pavement</text>
      <text className="sh-svg-dim" x={mx(rear) + 6} y={yBase + 16} textAnchor="start">rear</text>

      <text className="sh-svg-tag" x={left - 10} y={H - 16} fill={PINK}>
        The shaded strip is floor area that exists today and cannot legally be rebuilt.
      </text>
    </svg>
  );
}

/* ------------------------------------------------------- circulation / stair */

export function StairFigure() {
  const W = 720;
  const H = 356;
  const colW = 196;
  const leftX = 46;
  const rightX = 400;
  const floors = 4;
  const fH = 52;
  const yTop = 58;

  const block = (x: number, showSecondStair: boolean) => {
    const rows = [];
    for (let i = 0; i < floors; i++) {
      const y = yTop + i * fH;
      const isGround = i === floors - 1;
      // With one stair, everything above ground is reached through the shop.
      const locked = !showSecondStair && !isGround;
      rows.push(
        <g key={i}>
          <rect x={x} y={y} width={colW} height={fH}
            fill={showSecondStair ? MARK : locked ? "#f3f1f4" : MARK}
            stroke={INK} strokeWidth="1.4" />
          <text className="sh-svg-tag" x={x + 26} y={y + fH / 2 + 4}>
            {isGround
              ? "Shop"
              : showSecondStair
                ? ["Roof bar", "Family", "Workshop"][i]
                : "Locked to the shop tenant"}
          </text>
        </g>,
      );
    }
    return rows;
  };

  const stairX = (x: number) => x + 12;

  return (
    <svg className="sh-section-svg" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Two sections of the same shophouse, one with a single internal stair and one with a second line of circulation">
      <text className="sh-svg-tag" x={leftX} y={36}>As built — one stair, one tenant</text>
      <text className="sh-svg-tag" x={rightX} y={36} fill={PINK}>With a second stair — four tenancies</text>

      {block(leftX, false)}
      {block(rightX, true)}

      {/* single internal stair, left */}
      <line x1={stairX(leftX)} y1={yTop + floors * fH} x2={stairX(leftX)} y2={yTop}
        stroke={INK} strokeWidth="3" />
      <text className="sh-svg-dim" x={leftX} y={yTop + floors * fH + 22}>
        stair rises from inside the shop
      </text>

      {/* internal stair + external second line, right */}
      <line x1={stairX(rightX)} y1={yTop + floors * fH} x2={stairX(rightX)} y2={yTop + fH * (floors - 1)}
        stroke={INK} strokeWidth="3" />
      <line x1={rightX + colW + 16} y1={yTop + floors * fH} x2={rightX + colW + 16} y2={yTop}
        stroke={PINK} strokeWidth="3" />
      {[1, 2, 3].map((i) => (
        <line key={i} x1={rightX + colW} y1={yTop + i * fH} x2={rightX + colW + 16} y2={yTop + i * fH}
          stroke={PINK} strokeWidth="2" />
      ))}
      <text className="sh-svg-dim" x={rightX} y={yTop + floors * fH + 22} fill={PINK}>
        second line of circulation reaches every floor
      </text>

      <text className="sh-svg-tag" x={leftX} y={H - 26}>
        Same envelope, same floor area, same structure. The only thing that changes
      </text>
      <text className="sh-svg-tag" x={leftX} y={H - 10}>
        is who can reach the upper floors — and the law calls making it a demolition.
      </text>
    </svg>
  );
}

/* ------------------------------------------------- top-down vs bottom-up */

export function TopDownFigure() {
  const rows = [
    { q: "Starting condition", a: "A formal city, already legible", b: "A working city, already running, unrecorded" },
    { q: "First purchase", a: "Sensors and a platform", b: "Legal status for what exists" },
    { q: "Citizens are", a: "Data sources", b: "The operators of the system" },
    { q: "Cost driver", a: "Hardware, licences, integration", b: "Survey, registration, rule-writing" },
    { q: "Fails when", a: "The formal city was never built", b: "Nobody will grant the permission" },
  ];
  const W = 720;
  const rowH = 46;
  const headH = 62;
  const H = headH + rows.length * rowH + 34;
  const c0 = 20;
  const c1 = 208;
  const c2 = 456;
  const colW = 240;

  return (
    <svg className="sh-section-svg" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label="Comparison of the imported top-down smart city model against legitimising existing systems">
      <text className="sh-svg-tag" x={c1} y={26} fill={QUIET}>The imported model</text>
      <text className="sh-svg-dim" x={c1} y={42}>sensors first, permission never</text>
      <text className="sh-svg-tag" x={c2} y={26} fill={PINK}>Legitimising what runs</text>
      <text className="sh-svg-dim" x={c2} y={42} fill={PINK}>permission first, sensors if needed</text>

      <line x1={c0} y1={headH - 12} x2={W - 20} y2={headH - 12} stroke={INK} strokeWidth="1.5" />

      {rows.map((r, i) => {
        const y = headH + i * rowH;
        return (
          <g key={r.q}>
            {i % 2 === 1 && <rect x={c0} y={y - 12} width={W - 40} height={rowH} fill="#faf8fb" />}
            <text className="sh-svg-dim" x={c0} y={y + 12}>{r.q}</text>
            <text className="sh-svg-tag" x={c1} y={y + 12}>{r.a}</text>
            <text className="sh-svg-tag" x={c2} y={y + 12} fill={PINK}>{r.b}</text>
            <line x1={c0} y1={y + rowH - 12} x2={W - 20} y2={y + rowH - 12}
              stroke={INK} strokeOpacity="0.12" strokeWidth="1" />
          </g>
        );
      })}

      <rect x={c2 - 8} y={headH - 12} width={colW + 16} height={rows.length * rowH}
        fill="none" stroke={PINK} strokeWidth="1.5" />
    </svg>
  );
}
