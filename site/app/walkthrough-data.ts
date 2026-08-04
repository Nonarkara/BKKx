// Shared world data for every BKKx view (2D walkthrough, 3D atlas, future
// per-district pages). Server-safe: no "use client" directive, no JSX,
// no browser-only APIs. Re-exported from the client walkthrough module
// for backwards compatibility.

export type Stop = {
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

export type WorldId = "ratchathewi" | "historic-core";

export type World = {
  id: WorldId;
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

export const REPOSITORY = "https://github.com/Nonarkara/BKKx";
export const RELEASE_BASE = `${REPOSITORY}/releases/latest/download`;

export const worlds: World[] = [
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
