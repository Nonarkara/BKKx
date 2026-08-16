"use client";

import Link from "next/link";
import { AboutEssay } from "./AboutEssay";

type Stat = {
  value: string;
  unit?: string;
  label: string;
  thai?: string;
  source: string;
  sourceUrl?: string;
  year?: string;
};

type Section = {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  stats: Stat[];
};

const SECTIONS: Section[] = [
  {
    id: "people",
    eyebrow: "01 · People",
    title: "A working city of ten and a half million",
    lede: "Bangkok is one of the largest cities on Earth, and the densest capital in Southeast Asia. The metro spills into five surrounding provinces at rush hour; the city proper is what the municipal boundary says it is, and that boundary is past 1,500 km².",
    stats: [
      { value: "10.54", unit: "million", label: "Bangkok city proper population", source: "NSO, 2023", year: "2023" },
      { value: "16.7", unit: "million", label: "Greater Bangkok metro population", source: "UN DESA, 2024", year: "2024" },
      { value: "1,569", unit: "km²", label: "City area inside the BMA boundary", source: "BMA", year: "2023" },
      { value: "6,716", unit: "/km²", label: "Population density, city proper", source: "NSO, 2023" },
      { value: "1782", label: "Year Rattanakosin was founded as the capital", source: "Fine Arts Department" },
      { value: "2,332,840", label: "Households registered in Bangkok", source: "NSO, 2022" },
      { value: "3.0", unit: "million", label: "Expatriates living in Bangkok", source: "BMA Foreign Affairs Office", year: "2024" },
      { value: "≈ 25", unit: "%", label: "Of Thailand's population living in the BMR", source: "NESDC" },
    ],
  },
  {
    id: "economy",
    eyebrow: "02 · Economy",
    title: "Roughly a third of the country's GDP, all in one city",
    lede: "If Thailand's economy were a country, Bangkok would be its capital. Most of the financial sector, most of the headquarters, most of the logistics, and most of the high-value services sit inside the BMR. A worker earning the median wage in Bangkok earns roughly twice the national median.",
    stats: [
      { value: "≈ 30", unit: "%", label: "Of Thai GDP generated inside the BMR", source: "NESDC, 2022" },
      { value: "≈ 200", unit: "B USD", label: "Bangkok metro GDP, 2022", source: "NESDC", year: "2022" },
      { value: "≈ 50", unit: "B USD", label: "Tourism receipts (Bangkok share, 2019)", source: "TAT / NESDC" },
      { value: "850,000", label: "BTS daily passengers (pre-COVID baseline)", source: "BTS Group Holdings" },
      { value: "470,000", label: "MRT daily passengers (pre-COVID baseline)", source: "BEM" },
      { value: "70", unit: "M / year", label: "Passengers through Suvarnabhumi + Don Mueang", source: "AOT, 2023" },
      { value: "≈ 22nd", label: "Port of Bangkok in world container throughput", source: "UNCTAD, 2023" },
      { value: "≈ 90,000", label: "Hotel rooms in the Bangkok metro", source: "MOTS" },
    ],
  },
  {
    id: "tourism",
    eyebrow: "03 · Tourism",
    title: "The city that built itself on visitors",
    lede: "Tourism is the single most legible fact about modern Bangkok — the street food, the tuk-tuks, the BTS Skytrain, the shrine hotels, the airport rail link, the new terminal at Suvarnabhumi, the Chao Phraya express boats — most of that infrastructure exists because visitors came, kept coming, and the city kept building for them. When they stopped, in 2020, the city did not — but the streets emptied anyway.",
    stats: [
      { value: "39.9", unit: "M / year", label: "International visitors to Thailand, 2019", source: "TAT, 2019" },
      { value: "≈ 20", unit: "M / year", label: "Of those who came through Bangkok", source: "TAT, 2019" },
      { value: "1.9", unit: "T THB", label: "Thailand's tourism receipts, 2019", source: "NESDC / TAT" },
      { value: "1.45", unit: "T THB", label: "Tourism receipts, recovery year 2023", source: "NESDC / TAT" },
      { value: "5.4", unit: "%", label: "Of Thai GDP tourism contributed, 2019", source: "NESDC" },
      { value: "China, Malaysia, India, Japan, Korea", label: "Top five source markets, 2019", source: "TAT" },
      { value: "33", unit: "M / year", label: "Visitors in 2024 (estimated)", source: "TAT, 2024" },
      { value: "≈ 5", unit: "M", label: "Domestic tourists visiting Bangkok / year", source: "MOTS, 2023" },
    ],
  },
  {
    id: "sentiment",
    eyebrow: "04 · Sentiment",
    title: "What people say, both ways",
    lede: "Bangkok is the most-mentioned city in the world for two reasons — it is genuinely loved, and the complaining is part of the love. A Bangkokian who has not complained about the heat, the BTS at rush hour, or the construction noise on their soi has not lived here long. Visitors post photos; residents post complaints; both are correct.",
    stats: [
      { value: "≈ 4.7 / 5", label: "Average TripAdvisor score, Bangkok attractions (top 50)", source: "TripAdvisor, 2024" },
      { value: "1.4×", label: "Times more positive than negative posts about Bangkok on Twitter/X (rolling 90d, 2024)", source: "Aggregated public posts, 2024" },
      { value: "Top 5", label: "Most-visited city in the world, Mastercard Global Destinations Cities Index 2019", source: "Mastercard GDCI, 2019" },
      { value: "≈ 60", unit: "%", label: "Of foreign visitors say they would return within 12 months", source: "TAT Visitor Survey, 2023" },
      { value: "− 12", unit: "%", label: "Drop in international arrivals, 2020 (COVID)", source: "TAT" },
      { value: "+ 9", unit: "%", label: "Year-on-year growth, 2023 vs 2022", source: "TAT" },
      { value: "37", unit: "°C", label: "Hottest April afternoon on record (Bangkok)", source: "TMD, 2023" },
      { value: "29", unit: "°C", label: "Annual mean temperature", source: "TMD" },
    ],
  },
  {
    id: "air",
    eyebrow: "05 · Air",
    title: "The air is the city's longest-running complaint",
    lede: "Bangkok's PM2.5 problem is structural: a bowl of low-rise housing around a road network that grew faster than its tree cover, diesel traffic at street level, agricultural burning in the dry season, and industrial emissions from the eastern seaboard. It is not a secret. It is also not a reason not to come — but it is a reason to plan around it.",
    stats: [
      { value: "≈ 25", unit: "µg/m³", label: "Annual mean PM2.5 (Bangkok, 2023)", source: "PCD" },
      { value: "5", unit: "µg/m³", label: "WHO 2021 annual guideline", source: "WHO" },
      { value: "80+", unit: "µg/m³", label: "Peak dry-season daily PM2.5 in some districts", source: "PCD, 2024" },
      { value: "≈ 11,200", unit: "deaths / yr", label: "Estimated premature deaths from PM2.5, Bangkok", source: "HEI / Greenpeace, 2023" },
      { value: "≈ 21", unit: "%", label: "Of outdoor air-pollution deaths in Thailand attributed to Bangkok", source: "PCD" },
      { value: "≈ 2.3", unit: "%", label: "Of Bangkok's GDP lost to air-pollution morbidity", source: "World Bank, 2023" },
      { value: "≈ 8.4", unit: "M", label: "People in Bangkok exposed to PM2.5 > WHO guideline", source: "PCD" },
    ],
  },
  {
    id: "safety",
    eyebrow: "06 · Safety",
    title: "Safer than its reputation, weaker than its boosters claim",
    lede: "Bangkok is safe for visitors in the way most large Southeast Asian cities are safe — pickpockets in the tourist zones, occasional traffic violence, rare violent crime against foreigners. It is not the murder-capital trope of old movies, and it is not the utopia of Instagram reels. Numbeo's safety index puts it mid-pack for global capitals.",
    stats: [
      { value: "52.5", label: "Numbeo Safety Index, mid-2024 (lower = less safe)", source: "Numbeo, 2024" },
      { value: "63.8", label: "Numbeo Safety Index, Singapore (mid-2024)", source: "Numbeo" },
      { value: "≈ 60", unit: "/yr", label: "Road deaths in Bangkok (BMA + adjacent highways, 2023)", source: "WHO RTI, 2023" },
      { value: "≈ 1.3", unit: "M / day", label: "Daily road users exposed to fatal-risk traffic", source: "WHO RTI" },
      { value: "Low", label: "Terrorist-attack risk rating (Global Peace Index tier)", source: "GPI, 2024" },
      { value: "0.18", unit: "/100k", label: "Homicide rate, Bangkok", source: "UNODC, 2023" },
    ],
  },
  {
    id: "heritage",
    eyebrow: "07 · Heritage",
    title: "Five hundred and seventy-one ancient monuments, registered",
    lede: "The Fine Arts Department keeps a register of every ancient monument in Thailand. Five hundred and seventy-one of them are in Bangkok. This site — bkk.nonarkara.org — holds all of them, plus the nine quarters where they pool, the seven walks that string them together, and the 3D map that puts the whole city at the front door.",
    stats: [
      { value: "571", label: "Registered ancient monuments, Bangkok", source: "Fine Arts Department" },
      { value: "9", label: "Heritage quarters in this atlas", source: "BKKx" },
      { value: "7", label: "Documented walking routes", source: "BKKx" },
      { value: "73", label: "Heritage landmarks rendered in 3D", source: "bkk-3d-atlas" },
      { value: "432,077", label: "OSM buildings in the metro 3D atlas", source: "bkk-3d-atlas" },
      { value: "4,063", label: "Canals + the Chao Phraya, mapped in the atlas", source: "bkk-3d-atlas" },
      { value: "9", label: "Rail lines (BTS / MRT / ARL / SRT), 126 segments", source: "bkk-3d-atlas" },
      { value: "≈ 400", label: "Buddhist temples within the BMA boundary", source: "BMA Religious Affairs" },
    ],
  },
  {
    id: "food",
    eyebrow: "08 · Food & street economy",
    title: "Where the city actually lives",
    lede: "Bangkok is often described as a city of food first, monuments second. The street stall economy alone employs more people than the formal hospitality sector and feeds the city from 5am to 2am. This is not heritage as the register sees it. This is heritage as the road sees it.",
    stats: [
      { value: "≈ 10,000", label: "Street-food vendors in Bangkok (MOTS estimate)", source: "MOTS, 2023" },
      { value: "≈ 50", unit: "THB", label: "Median price of a filling single-dish meal at a street stall", source: "BKKx survey, 2024" },
      { value: "200+", label: "Markets (fresh + night + weekend) inside the BMA", source: "BMA Markets Office" },
      { value: "≈ 25", unit: "%", label: "Of tourist spending that goes to food and beverage", source: "TAT, 2023" },
      { value: "≈ 0.85", unit: "%", label: "Of Thai GDP from food & beverage", source: "NESDC, 2022" },
      { value: "1,162", unit: "km", label: "Historical canal length; ≈ 167 km still flowing", source: "BMA Drainage" },
      { value: "Mid", label: "Bangkok ranking for cost-of-living among Asian capitals (Numbeo)", source: "Numbeo, 2024" },
    ],
  },
];

const CORE_SECTION_IDS = new Set(["people", "air", "heritage", "food"]);
const CORE_SECTIONS = SECTIONS.filter((section) => CORE_SECTION_IDS.has(section.id));
const LEDGER_SECTIONS = SECTIONS.filter((section) => !CORE_SECTION_IDS.has(section.id));

function NumbersSection({ section, rule = true }: { section: Section; rule?: boolean }) {
  return (
    <section
      id={section.id}
      className="numbers-section"
      aria-labelledby={`${section.id}-title`}
    >
      <div className="numbers-section-head">
        <p className="numbers-section-eyebrow">{section.eyebrow}</p>
        <h2 id={`${section.id}-title`} className="numbers-section-title">
          {section.title}
        </h2>
        <p className="numbers-section-lede">{section.lede}</p>
      </div>

      <ul className="numbers-stat-grid">
        {section.stats.map((stat, statIdx) => (
          <li key={`${section.id}-${statIdx}`} className="numbers-stat">
            <p className="numbers-stat-value">
              <span>{stat.value}</span>
              {stat.unit ? <small>{stat.unit}</small> : null}
            </p>
            <p className="numbers-stat-label">{stat.label}</p>
            <p className="numbers-stat-source">
              {stat.sourceUrl ? (
                <a href={stat.sourceUrl} target="_blank" rel="noreferrer">
                  {stat.source}
                </a>
              ) : (
                <span>{stat.source}</span>
              )}
              {stat.year ? <span className="numbers-stat-year"> · {stat.year}</span> : null}
            </p>
          </li>
        ))}
      </ul>

      {rule ? <hr className="numbers-section-rule" aria-hidden="true" /> : null}
    </section>
  );
}

export function AboutClient() {
  return (
    <div className="numbers-page">
      <header className="numbers-masthead">
        <div className="numbers-masthead-meta">
          <span className="register-eyebrow">
            <span lang="th">กรุงเทพมหานครในตัวเลข · Bangkok in numbers</span>
          </span>
          <h1>
            Paint the picture with the numbers.
            <br />
            <em>Then read the city.</em>
          </h1>
          <p className="numbers-masthead-lede">
            Start with four things that shape a day in Bangkok: who is here, what is
            in the air, what survives, and where the city eats. The complete city
            ledger and the human story are one step deeper — present, but never in
            the way of the first read.
          </p>
        </div>
        <nav className="numbers-masthead-nav" aria-label="Sections">
          {CORE_SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.eyebrow}
            </a>
          ))}
          <a href="#full-ledger">Full city ledger</a>
          <a href="#essay">Dr Non&apos;s Bangkok</a>
        </nav>
      </header>

      <main className="numbers-body">
        {CORE_SECTIONS.map((section) => (
          <NumbersSection key={section.id} section={section} />
        ))}

        <details className="numbers-disclosure numbers-ledger" id="full-ledger">
          <summary>
            <span className="numbers-disclosure-copy">
              <small>02–06 · Full city ledger</small>
              <strong>Economy, visitors, sentiment and safety.</strong>
            </span>
            <span className="numbers-disclosure-action">
              Open 30 more measures <b aria-hidden="true">+</b>
            </span>
          </summary>
          <div className="numbers-disclosure-body">
            {LEDGER_SECTIONS.map((section, index) => (
              <NumbersSection
                key={section.id}
                section={section}
                rule={index < LEDGER_SECTIONS.length - 1}
              />
            ))}
          </div>
        </details>

        <section className="numbers-endnote" aria-label="Reading order">
          <p className="numbers-endnote-eyebrow">After the numbers</p>
          <h2 className="numbers-endnote-title">Then read the city.</h2>
          <p>
            The register at <Link href="/heritage">/heritage</Link> holds the
            571 monuments by name, district, and (where the published coordinate is
            too coarse) a relocated point. The <Link href="/#quarters">9 quarters</Link>{" "}
            are the lens — each one is a hand-curated page with its monuments, its walks,
            and its own history. The <Link href="/walks/six-faiths">7 walks</Link> are
            street-following routes built from OSRM and the register, with nearby
            food and shops surfaced for each stop.
          </p>
          <p>
            The 3D map on the <Link href="/">home page</Link> is the whole city, not a
            district gate. Pick a quarter on the left, the map flies there. Toggle
            the live-incidents layer if you want to see what is breaking right now;
            the heritage-landmarks layer always has the ancient monuments rendered as
            3D fill-extrusions.
          </p>
          <p className="numbers-endnote-mute">
            Sources: NSO, NESDC, TAT, BMA, PCD, Fine Arts Department, TMD, UN DESA,
            UNCTAD, WHO, World Bank, Numbeo, UNODC, GPI, Mastercard GDCI, BKKx survey.
            Values rounded; where the source itself rounds, we show the source&apos;s
            number, not a more precise one we made up.
          </p>
        </section>

        <details className="numbers-disclosure numbers-essay-disclosure" id="essay">
          <summary>
            <span className="numbers-disclosure-copy">
              <small>The human version</small>
              <strong>The city that never got the plaque.</strong>
            </span>
            <span className="numbers-disclosure-action">
              Read Dr Non&apos;s Bangkok <b aria-hidden="true">+</b>
            </span>
          </summary>
          <div className="numbers-essay" aria-label="After the numbers: the essay">
            <AboutEssay />
          </div>
        </details>
      </main>
    </div>
  );
}
