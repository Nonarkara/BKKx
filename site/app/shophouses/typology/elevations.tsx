import type { ElevationId } from "../../data/shophouse-typology";

// Original elevations for this library. Palette colours, flat fills.
// They describe facade features named in the typology entries.
// They are not traces of Pheangporn Khanti’s drawings.

const INK = "#15140f";
const PAPER = "#f4ebd5";
const PAPER_SOFT = "#f8f1de";
const DEEP = "#ecdfc1";
const RAIL = "#254f82";
const SEAL = "#a83332";
const SEAL_DEEP = "#7a2222";
const GOLD = "#d2a14e";
const GOLD_DEEP = "#7a5f24";
const JADE = "#628a70";

type PlateProps = { title: string; caption: string };

function Plate({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 180 248" role="img" className="typo-elev">
      <title>{title}</title>
      <rect width="180" height="248" fill={PAPER} />
      {children}
    </svg>
  );
}

function FinAndFlowerbox({ title }: PlateProps) {
  return (
    <Plate title={title}>
      <polygon points="34,28 148,24 156,230 28,228" fill={PAPER_SOFT} stroke={INK} strokeWidth="1.6" />
      <polygon points="36,22 150,18 148,28 34,32" fill={DEEP} stroke={INK} strokeWidth="1.2" />
      {[0, 1, 2, 3].map((i) => {
        const y = 46 + i * 40;
        return (
          <g key={i}>
            <rect x={42 + (i % 2)} y={y} width={100 - (i % 3)} height="16" fill={RAIL} />
            <rect x="78" y={y - 7} width="24" height="8" fill={GOLD} stroke={INK} strokeWidth="0.8" />
            <path d={`M86 ${y - 7} q3 -9 9 -1 q-5 1 -9 1`} fill={JADE} />
            <path d={`M98 ${y - 6} q4 -8 8 0 q-5 2 -8 0`} fill={JADE} />
          </g>
        );
      })}
      <line x1="54" y1="30" x2="50" y2="186" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <line x1="78" y1="28" x2="76" y2="188" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="102" y1="30" x2="104" y2="184" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
      <line x1="126" y1="27" x2="128" y2="186" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="44" y="192" width="92" height="34" fill={RAIL} stroke={INK} strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <line
          key={i}
          x1={52 + i * 11}
          y1="194"
          x2={50 + i * 11}
          y2="224"
          stroke={PAPER}
          strokeWidth="1.4"
        />
      ))}
      <line x1="20" y1="232" x2="164" y2="236" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    </Plate>
  );
}

function Arch({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const r = w / 2;
  return (
    <path
      d={`M ${x} ${y + h} L ${x} ${y + r} A ${r} ${r * 0.9} 0 0 1 ${x + w} ${y + r + 1} L ${x + w} ${y + h} Z`}
      fill={RAIL}
      stroke={INK}
      strokeWidth="1.15"
    />
  );
}

function ArchAndColumn({ title }: PlateProps) {
  return (
    <Plate title={title}>
      <polygon points="26,78 156,72 160,230 22,232" fill={PAPER_SOFT} stroke={INK} strokeWidth="1.6" />
      <polygon points="24,64 158,58 156,74 26,80" fill={GOLD} stroke={INK} strokeWidth="1" />
      <rect x="30" y="148" width="14" height="80" fill={DEEP} stroke={INK} strokeWidth="1.2" />
      <rect x="136" y="144" width="16" height="84" fill={DEEP} stroke={INK} strokeWidth="1.2" />
      <rect x="26" y="142" width="22" height="8" fill={GOLD} stroke={INK} strokeWidth="0.8" />
      <rect x="132" y="138" width="24" height="8" fill={GOLD} stroke={INK} strokeWidth="0.8" />
      <Arch x={48} y={86} w={22} h={36} />
      <Arch x={76} y={84} w={24} h={38} />
      <Arch x={106} y={87} w={21} h={34} />
      <Arch x={50} y={132} w={20} h={28} />
      <Arch x={76} y={130} w={22} h={30} />
      <Arch x={104} y={133} w={20} h={27} />
      <rect x="52" y="186" width="74" height="40" fill={RAIL} stroke={INK} strokeWidth="1.1" />
      <line x1="18" y1="234" x2="166" y2="238" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    </Plate>
  );
}

const BRICKS: Array<[number, number, number, string]> = [
  [32, 108, 26, SEAL],
  [60, 110, 22, GOLD_DEEP],
  [84, 107, 28, SEAL_DEEP],
  [114, 109, 24, SEAL],
  [140, 108, 16, GOLD_DEEP],
  [26, 120, 20, SEAL_DEEP],
  [48, 122, 30, SEAL],
  [80, 119, 24, GOLD_DEEP],
  [106, 121, 28, SEAL],
  [136, 120, 22, SEAL_DEEP],
  [30, 132, 24, GOLD_DEEP],
  [56, 134, 22, SEAL],
  [80, 131, 26, SEAL_DEEP],
  [108, 133, 20, SEAL],
  [130, 132, 28, GOLD_DEEP],
  [28, 168, 22, SEAL],
  [52, 170, 28, SEAL_DEEP],
  [82, 167, 24, GOLD_DEEP],
  [108, 169, 26, SEAL],
  [136, 168, 20, SEAL_DEEP],
  [32, 180, 26, GOLD_DEEP],
  [60, 182, 22, SEAL],
  [84, 179, 30, SEAL_DEEP],
  [116, 181, 22, GOLD_DEEP],
  [140, 180, 16, SEAL],
  [26, 204, 24, SEAL_DEEP],
  [52, 206, 28, SEAL],
  [82, 203, 22, GOLD_DEEP],
  [106, 205, 26, SEAL],
  [134, 204, 22, SEAL_DEEP],
];

function WindowPair({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="13" height="20" fill={PAPER} stroke={INK} strokeWidth="1.1" />
      <rect x={x + 17} y={y + 1} width="12" height="19" fill={PAPER} stroke={INK} strokeWidth="1.1" />
    </g>
  );
}

function PairedWindowBrick({ title }: PlateProps) {
  return (
    <Plate title={title}>
      <polygon points="24,96 158,92 162,230 20,232" fill={DEEP} stroke={INK} strokeWidth="1.6" />
      {BRICKS.map(([x, y, w, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height="7" fill={fill} />
      ))}
      <WindowPair x={40} y={112} />
      <WindowPair x={108} y={114} />
      <WindowPair x={108} y={176} />
      <rect x="40" y="176" width="28" height="40" fill={RAIL} stroke={INK} strokeWidth="1.1" />
      <line x1="16" y1="234" x2="168" y2="238" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    </Plate>
  );
}

function ToConfirm({ title, caption }: PlateProps) {
  return (
    <Plate title={title}>
      <rect x="28" y="36" width="124" height="176" fill="none" stroke={INK} strokeWidth="1.4" strokeDasharray="4 3" />
      <line x1="22" y1="30" x2="36" y2="30" stroke={SEAL} strokeWidth="1.6" />
      <line x1="22" y1="30" x2="22" y2="44" stroke={SEAL} strokeWidth="1.6" />
      <line x1="158" y1="30" x2="144" y2="30" stroke={SEAL} strokeWidth="1.6" />
      <line x1="158" y1="30" x2="158" y2="44" stroke={SEAL} strokeWidth="1.6" />
      <line x1="22" y1="218" x2="36" y2="218" stroke={SEAL} strokeWidth="1.6" />
      <line x1="22" y1="218" x2="22" y2="204" stroke={SEAL} strokeWidth="1.6" />
      <line x1="158" y1="218" x2="144" y2="218" stroke={SEAL} strokeWidth="1.6" />
      <line x1="158" y1="218" x2="158" y2="204" stroke={SEAL} strokeWidth="1.6" />
      <text x="90" y="128" textAnchor="middle" fill={INK} fontSize="13">
        {caption}
      </text>
      <line x1="18" y1="234" x2="164" y2="238" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    </Plate>
  );
}

function LatPhraoRow({ title }: PlateProps) {
  return (
    <Plate title={title}>
      <polygon points="22,78 160,74 164,230 18,232" fill={DEEP} stroke={INK} strokeWidth="1.6" />
      {BRICKS.map(([x, y, w, fill], i) => (
        <rect key={i} x={x} y={y + 8} width={w} height="7" fill={fill} />
      ))}
      <rect x="48" y="96" width="22" height="34" fill={PAPER} stroke={INK} strokeWidth="1.1" />
      <path d="M46 96 H74 V108 Q60 92 46 108 Z" fill={PAPER} stroke={INK} strokeWidth="1.1" />
      <rect x="112" y="98" width="16" height="22" fill={PAPER} stroke={INK} strokeWidth="1" />
      <rect x="132" y="98" width="16" height="22" fill={PAPER} stroke={INK} strokeWidth="1" />
      <rect x="46" y="168" width="10" height="48" fill={GOLD_DEEP} />
      <rect x="86" y="168" width="10" height="48" fill={GOLD_DEEP} />
      <rect x="56" y="176" width="30" height="40" fill={RAIL} stroke={INK} strokeWidth="1.1" />
      <line x1="16" y1="234" x2="168" y2="238" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    </Plate>
  );
}

function AwningRow({ title }: PlateProps) {
  return (
    <Plate title={title}>
      <polygon points="36,36 150,32 156,228 30,230" fill={PAPER_SOFT} stroke={INK} strokeWidth="1.6" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={48 + (i % 2)} y={52 + i * 36} width="86" height="18" fill={RAIL} />
      ))}
      <polygon points="28,168 158,162 154,178 32,184" fill={GOLD} stroke={INK} strokeWidth="1.1" />
      <rect x="58" y="186" width="28" height="36" fill={SEAL} stroke={INK} strokeWidth="1" />
      <rect x="100" y="188" width="28" height="34" fill={JADE} stroke={INK} strokeWidth="1" />
      <line x1="18" y1="234" x2="166" y2="238" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
    </Plate>
  );
}

const DRAWINGS: Record<ElevationId, (props: PlateProps) => React.ReactElement> = {
  "fin-and-flowerbox": FinAndFlowerbox,
  "arch-and-column": ArchAndColumn,
  "paired-window-brick": PairedWindowBrick,
  "lat-phrao-row": LatPhraoRow,
  "awning-row": AwningRow,
  "to-confirm": ToConfirm,
};

export function TypeElevation({
  id,
  title,
  caption,
}: {
  id: ElevationId;
  title: string;
  caption: string;
}) {
  const Draw = DRAWINGS[id];
  return <Draw title={title} caption={caption} />;
}
