"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Stop = {
  id: string;
  name: string;
  thai: string;
  chapter: string;
  description: string;
  signal: string;
  coordinates: string;
  x: number;
  y: number;
};

type World = {
  id: "ratchathewi" | "historic-core";
  number: string;
  name: string;
  thai: string;
  strapline: string;
  description: string;
  image: string;
  width: number;
  height: number;
  distance: string;
  regions: number;
  chunks: string;
  download: string;
  stops: Stop[];
};

const REPOSITORY = "https://github.com/Nonarkara/BKKx";
const RELEASE_BASE = `${REPOSITORY}/releases/latest/download`;

const worlds: World[] = [
  {
    id: "ratchathewi",
    number: "01",
    name: "Ratchathewi",
    thai: "ราชเทวี",
    strapline: "Bangkok in motion",
    description:
      "Follow the rail lines, markets and superblocks that pull Bangkok toward Victory Monument, Pratunam and Makkasan.",
    image: "/images/ratchathewi.png",
    width: 4956,
    height: 2945,
    distance: "4.96 × 2.95 km",
    regions: 60,
    chunks: "61,440",
    download: `${RELEASE_BASE}/BKKx-Ratchathewi-Java-1.21.4.zip`,
    stops: [
      {
        id: "victory-monument",
        name: "Victory Monument",
        thai: "อนุสาวรีย์ชัยสมรภูมิ",
        chapter: "The city as a roundabout",
        description:
          "Bangkok's buses, vans and rail lines converge around a monument that behaves less like an object and more like a machine for moving people.",
        signal: "Begin above the traffic circle, then follow the BTS viaduct south.",
        coordinates: "13.7649° N · 100.5383° E",
        x: 42.0,
        y: 35.6,
      },
      {
        id: "phaya-thai",
        name: "Phaya Thai Station",
        thai: "สถานีพญาไท",
        chapter: "Two rail systems cross",
        description:
          "The BTS and Airport Rail Link meet here, turning a compact station into the district's gateway to both central Bangkok and Suvarnabhumi.",
        signal: "Trace the elevated tracks east toward Makkasan or west toward Siam.",
        coordinates: "13.7568° N · 100.5347° E",
        x: 34.1,
        y: 66.2,
      },
      {
        id: "baiyoke",
        name: "Baiyoke Tower II",
        thai: "ตึกใบหยก 2",
        chapter: "The vertical landmark",
        description:
          "A tower rising from Pratunam's dense market fabric. From street level, the district reads as alleys; from above, as a continuous commercial field.",
        signal: "Use the tower as your compass before dropping into the market lanes.",
        coordinates: "13.7547° N · 100.5401° E",
        x: 45.9,
        y: 74.1,
      },
      {
        id: "pratunam",
        name: "Pratunam Market",
        thai: "ตลาดประตูน้ำ",
        chapter: "Commerce at one-block scale",
        description:
          "Wholesale fashion, hotels, street food and narrow passages form a district that only makes sense when explored slowly and close to the ground.",
        signal: "Switch from flying to walking and read the grain of the smaller blocks.",
        coordinates: "13.7508° N · 100.5396° E",
        x: 44.8,
        y: 88.8,
      },
      {
        id: "makkasan",
        name: "Makkasan Station",
        thai: "สถานีมักกะสัน",
        chapter: "The eastern threshold",
        description:
          "Rail yards, expressways and the airport line open the dense district into a wide infrastructural landscape at Bangkok's eastern edge.",
        signal: "Fly east along the rail corridor to see the city change scale.",
        coordinates: "13.7512° N · 100.5614° E",
        x: 92.3,
        y: 87.4,
      },
    ],
  },
  {
    id: "historic-core",
    number: "02",
    name: "Historic Core",
    thai: "เกาะรัตนโกสินทร์",
    strapline: "River, ritual, memory",
    description:
      "Cross the Chao Phraya and read Bangkok's royal, civic and spiritual landmarks as one connected urban landscape.",
    image: "/images/historic-core.png",
    width: 3384,
    height: 3217,
    distance: "3.38 × 3.22 km",
    regions: 49,
    chunks: "50,176",
    download: `${RELEASE_BASE}/BKKx-Bangkok-Historic-Core-Java-1.21.4.zip`,
    stops: [
      {
        id: "democracy-monument",
        name: "Democracy Monument",
        thai: "อนุสาวรีย์ประชาธิปไตย",
        chapter: "The civic axis",
        description:
          "Ratchadamnoen Avenue frames a monument whose geometry, traffic and political history make it one of Bangkok's most charged public spaces.",
        signal: "Start at the monument and follow the avenue west toward Sanam Luang.",
        coordinates: "13.7567° N · 100.5018° E",
        x: 73.1,
        y: 32.4,
      },
      {
        id: "sanam-luang",
        name: "Sanam Luang",
        thai: "สนามหลวง",
        chapter: "The ceremonial clearing",
        description:
          "An enormous open field interrupts the fine-grained old city and gives the surrounding temples, museums and palace walls room to breathe.",
        signal: "Climb high enough to see the oval field anchor the royal precinct.",
        coordinates: "13.7563° N · 100.4930° E",
        x: 45.0,
        y: 33.8,
      },
      {
        id: "grand-palace",
        name: "Grand Palace",
        thai: "พระบรมมหาราชวัง",
        chapter: "Walls within the city",
        description:
          "The palace compound reads as a dense city inside a city: gates, courts, roofs and sacred structures organized behind a continuous white wall.",
        signal: "Circle the perimeter first; enter the precinct only after reading its full scale.",
        coordinates: "13.7500° N · 100.4914° E",
        x: 39.8,
        y: 55.7,
      },
      {
        id: "wat-pho",
        name: "Wat Pho",
        thai: "วัดโพธิ์",
        chapter: "A temple as a campus",
        description:
          "Courtyards, chedis and cloisters spread south of the palace, showing why Bangkok's great temples are urban ensembles rather than single buildings.",
        signal: "Walk the compound edges and compare their rhythm with the palace walls.",
        coordinates: "13.7465° N · 100.4930° E",
        x: 45.0,
        y: 67.6,
      },
      {
        id: "wat-arun",
        name: "Wat Arun",
        thai: "วัดอรุณ",
        chapter: "The river crossing",
        description:
          "The temple's central prang marks the Thonburi bank and turns the Chao Phraya from a boundary into the main room of the historic city.",
        signal: "Cross the river at low altitude; the changing skyline is the point.",
        coordinates: "13.7437° N · 100.4889° E",
        x: 31.9,
        y: 77.3,
      },
    ],
  },
];

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

export function BangkokWalkthrough() {
  const [worldId, setWorldId] = useState<World["id"]>("ratchathewi");
  const [stopId, setStopId] = useState(worlds[0].stops[0].id);
  const [visits, setVisits] = useState<number | null>(null);

  const world = useMemo(
    () => worlds.find((item) => item.id === worldId) ?? worlds[0],
    [worldId],
  );
  const stop =
    world.stops.find((item) => item.id === stopId) ?? world.stops[0];

  useEffect(() => {
    fetch("/api/pageview", {
      method: "POST",
      keepalive: true,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {});
    fetch("/api/stats")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const stats = data as { total?: unknown } | null;
        if (typeof stats?.total === "number") setVisits(stats.total);
      })
      .catch(() => {});
  }, []);

  function chooseWorld(nextWorld: World) {
    setWorldId(nextWorld.id);
    setStopId(nextWorld.stops[0].id);
  }

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="BKKx home">
          <span>BKK</span><b>x</b>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#atlas">Walkthrough</a>
          <a href="#enter">Enter the world</a>
          <a href={REPOSITORY} target="_blank" rel="noreferrer">
            GitHub <ArrowIcon />
          </a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow">
            Digital Bangkok <span /> Minecraft Java
          </p>
          <h1>
            Bangkok,
            <br />
            <em>block by block.</em>
          </h1>
          <p className="hero-lede">
            กรุงเทพฯ ทีละบล็อก — an open, playable city atlas. Follow the
            streets, cross the river, then step inside the map.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#atlas">
              Start walking <span aria-hidden="true">↓</span>
            </a>
            <a
              className="button button-quiet"
              href={REPOSITORY}
              target="_blank"
              rel="noreferrer"
            >
              View the source <ArrowIcon />
            </a>
          </div>
        </div>

        <div className="hero-map" aria-label="Minecraft overview of Ratchathewi">
          <Image
            src="/images/ratchathewi.png"
            alt="Top-down Minecraft map of Ratchathewi, Bangkok"
            fill
            priority
            sizes="(max-width: 900px) 92vw, 52vw"
          />
          <div className="map-scanline" />
          <p className="map-coordinate map-coordinate-top">13.7743° N</p>
          <p className="map-coordinate map-coordinate-bottom">100.5649° E</p>
          <div className="hero-map-label">
            <span>WORLD 01</span>
            <strong>RATCHATHEWI</strong>
          </div>
        </div>

        <div className="hero-index">
          <span>01</span>
          <p>Two worlds online<br />Bangkok keeps growing</p>
        </div>
      </section>

      <section className="signal-strip" aria-label="Project statistics">
        <div><strong>02</strong><span>Worlds online</span></div>
        <div><strong>111</strong><span>Region files</span></div>
        <div><strong>111,616</strong><span>Validated chunks</span></div>
        <div><strong>1:1</strong><span>Block-to-metre scale</span></div>
        <div><strong>{visits === null ? "LIVE" : visits.toLocaleString()}</strong><span>{visits === null ? "Open atlas" : "Atlas visits"}</span></div>
      </section>

      <section className="atlas-section" id="atlas">
        <div className="section-heading">
          <p className="eyebrow">Field atlas / สมุดภาคสนาม</p>
          <h2>Pick a district.<br />Follow the signals.</h2>
          <p>
            Each marker is a chapter. Read the city from above, then download
            the same terrain and walk it at one-block scale.
          </p>
        </div>

        <div className="world-switcher" role="tablist" aria-label="Choose a world">
          {worlds.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === world.id}
              className={item.id === world.id ? "is-active" : ""}
              onClick={() => chooseWorld(item)}
            >
              <span>{item.number}</span>
              <strong>{item.name}</strong>
              <small>{item.thai}</small>
            </button>
          ))}
        </div>

        <article className="world-intro">
          <div>
            <p className="world-number">WORLD {world.number}</p>
            <h3>{world.strapline}</h3>
          </div>
          <p>{world.description}</p>
          <dl>
            <div><dt>Coverage</dt><dd>{world.distance}</dd></div>
            <div><dt>Regions</dt><dd>{world.regions}</dd></div>
            <div><dt>Chunks</dt><dd>{world.chunks}</dd></div>
          </dl>
        </article>

        <div className={`map-explorer map-${world.id}`}>
          <div
            className="explorer-canvas"
            style={{ aspectRatio: `${world.width} / ${world.height}` }}
          >
            <Image
              key={world.image}
              src={world.image}
              alt={`Top-down Minecraft map of ${world.name}, Bangkok`}
              fill
              sizes="(max-width: 1000px) 100vw, 68vw"
            />
            <div className="map-shade" />
            {world.stops.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`hotspot ${item.id === stop.id ? "is-active" : ""}`}
                style={{ left: `${item.x}%`, top: `${item.y}%` }}
                aria-label={`Open chapter ${index + 1}: ${item.name}`}
                aria-pressed={item.id === stop.id}
                onClick={() => setStopId(item.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
              </button>
            ))}
            <p className="map-north"><span>↑</span> N</p>
          </div>

          <aside className="chapter-panel" aria-live="polite">
            <div className="chapter-count">
              <span>{String(world.stops.indexOf(stop) + 1).padStart(2, "0")}</span>
              <small>/ {String(world.stops.length).padStart(2, "0")}</small>
            </div>
            <p className="chapter-kicker">{stop.chapter}</p>
            <h3>{stop.name}</h3>
            <p className="chapter-thai">{stop.thai}</p>
            <p className="chapter-description">{stop.description}</p>
            <div className="field-note">
              <span>FIELD NOTE</span>
              <p>{stop.signal}</p>
            </div>
            <p className="coordinates">{stop.coordinates}</p>
            <div className="chapter-nav" aria-label="Walkthrough chapters">
              {world.stops.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={item.id === stop.id ? "is-active" : ""}
                  onClick={() => setStopId(item.id)}
                  aria-label={`Chapter ${index + 1}: ${item.name}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="enter-section" id="enter">
        <div className="enter-heading">
          <p className="eyebrow">From browser to blocks</p>
          <h2>Enter Bangkok.</h2>
          <p>Three steps. No mods. The city is ready when Minecraft is.</p>
        </div>
        <ol className="steps">
          <li>
            <span>01</span>
            <div><h3>Choose a world</h3><p>Start with transit-heavy Ratchathewi or cross the river through the historic core.</p></div>
          </li>
          <li>
            <span>02</span>
            <div><h3>Download and unzip</h3><p>Place the world folder inside your Minecraft Java <code>saves</code> directory.</p></div>
          </li>
          <li>
            <span>03</span>
            <div><h3>Walk, fly, build</h3><p>Open Minecraft Java 1.21.4+, choose Singleplayer, and enter in Creative mode.</p></div>
          </li>
        </ol>

        <div className="download-grid">
          {worlds.map((item) => (
            <a key={item.id} className="download-card" href={item.download}>
              <span className="download-number">{item.number}</span>
              <div>
                <small>MINECRAFT JAVA 1.21.4+</small>
                <h3>{item.name}</h3>
                <p>{item.thai} · {item.distance}</p>
              </div>
              <span className="download-arrow" aria-hidden="true">↓</span>
            </a>
          ))}
        </div>
      </section>

      <section className="pipeline-section">
        <div>
          <p className="eyebrow">Built in public</p>
          <h2>A city model should never be a black box.</h2>
        </div>
        <div className="pipeline" aria-label="Data pipeline">
          <span>OPEN MAP DATA</span><b>→</b><span>ARNIS</span><b>→</b><span>MINECRAFT</span><b>→</b><span>YOU</span>
        </div>
        <p>
          Streets, buildings, water and vegetation come from open geographic
          data, translated into blocks by Arnis, then checked region by region.
          The code, world manifests and future roadmap remain open on GitHub.
        </p>
        <a className="text-link" href={REPOSITORY} target="_blank" rel="noreferrer">
          Explore the repository <ArrowIcon />
        </a>
      </section>

      <section className="next-section">
        <p>THE ATLAS IS OPEN</p>
        <h2>Bangkok is bigger than two worlds.</h2>
        <p>
          This is the foundation: a district-by-district walkthrough designed
          to grow into live city layers, community stories and collaborative builds.
        </p>
        <a href={`${REPOSITORY}/issues`} target="_blank" rel="noreferrer">
          Suggest the next district <ArrowIcon />
        </a>
      </section>

      <footer>
        <a className="wordmark footer-wordmark" href="#top"><span>BKK</span><b>x</b></a>
        <p>Bangkok, block by block.<br />กรุงเทพฯ ทีละบล็อก</p>
        <div>
          <a href={REPOSITORY} target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://github.com/louis-e/arnis" target="_blank" rel="noreferrer">Arnis</a>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>
        </div>
        <small>© 2026 Non Arkara · Open city, open source.</small>
      </footer>
    </main>
  );
}
