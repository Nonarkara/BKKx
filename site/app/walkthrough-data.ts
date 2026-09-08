// Shared world data for every KLX view (3D atlas, future per-district pages).
// Server-safe: no "use client" directive, no JSX, no browser-only APIs.

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

export type WorldId = "merdeka-core" | "klcc" | "klang-valley";

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
    id: "merdeka-core",
    number: "01",
    name: "Merdeka civic core",
    thai: "Teras sivik Merdeka",
    strapline: "Padang, copper domes, two rivers",
    description:
      "Read Dataran Merdeka, Sultan Abdul Samad, Masjid Jamek and the Klang/Gombak confluence as one civic room — then south to the Hubback station and Masjid Negara.",
    image: "/heritage/photos/merdeka-core.jpg",
    width: 0,
    height: 0,
    distance: "Atlas only — no Minecraft world has been generated for Kuala Lumpur",
    regions: 0,
    chunks: "none",
    download: "",
    stops: [
      {
        id: "sultan-abdul-samad",
        name: "Sultan Abdul Samad Building",
        thai: "Bangunan Sultan Abdul Samad",
        chapter: "The padang façade",
        description:
          "National Heritage 2007. Copper onion domes and a clock tower built to face Dataran Merdeka. The 2012 gazetting ceremony was held here.",
        signal: "Circle the padang first; the civic range only reads as a room from the grass.",
        coordinates: "3.1484° N · 101.6945° E",
        x: 50,
        y: 50,
      },
      {
        id: "masjid-jamek",
        name: "Jamek Mosque",
        thai: "Masjid Jamek",
        chapter: "The confluence",
        description:
          "National Heritage 2009. Hubback, 1909, at the muddy fork the city is named for.",
        signal: "Drop to the River of Life terraces and look back at the onion domes.",
        coordinates: "3.1488° N · 101.6957° E",
        x: 54,
        y: 48,
      },
      {
        id: "railway-station",
        name: "Kuala Lumpur Railway Station",
        thai: "Bangunan Ibu Stesen Keretapi",
        chapter: "The Hubback station",
        description:
          "National Heritage 2007. OSM currently names the station polygon KA02; the pin is that centroid, recorded as a fuzzy match.",
        signal: "Approach from Jalan Sultan Hishamuddin so the Mughal roof reads against the tracks.",
        coordinates: "3.1399° N · 101.6935° E",
        x: 48,
        y: 70,
      },
      {
        id: "masjid-negara",
        name: "National Mosque",
        thai: "Masjid Negara",
        chapter: "The umbrella roof",
        description:
          "1965. Tourism Malaysia publishes the 73 m minaret and the 16-point star roof. Hall height is interpretive here.",
        signal: "Read the folded turquoise roof against the concrete minaret.",
        coordinates: "3.1419° N · 101.6917° E",
        x: 42,
        y: 66,
      },
    ],
  },
  {
    id: "klcc",
    number: "02",
    name: "KLCC & Golden Triangle",
    thai: "KLCC dan Segi Tiga Emas",
    strapline: "Twins, spike, pink pod",
    description:
      "Petronas as twins plus skybridge, Menara KL as shaft and bulb, Exchange 106 at TRX, Merdeka 118 as a true spire — published envelopes only, interpretive tapers labelled.",
    image: "/heritage/photos/klcc.jpg",
    width: 0,
    height: 0,
    distance: "Atlas only — no Minecraft world has been generated for Kuala Lumpur",
    regions: 0,
    chunks: "none",
    download: "",
    stops: [
      {
        id: "petronas",
        name: "Petronas Twin Towers",
        thai: "Menara Berkembar Petronas",
        chapter: "The twins",
        description:
          "CTBUH 451.9 m architectural, 375 m occupied, skybridge 58.4 m at 170 m AGL. OSM stores one combined outline; this twin splits it.",
        signal: "Pitch up until the skybridge reads, then orbit so both shafts separate.",
        coordinates: "3.1580° N · 101.7118° E",
        x: 62,
        y: 28,
      },
      {
        id: "kl-tower",
        name: "Kuala Lumpur Tower",
        thai: "Menara Kuala Lumpur",
        chapter: "The pink pod",
        description:
          "Antenna 421 m, pod 336.5 m, observatory 276 m. Footprint is an interpretive circle on OSM node 5839389988.",
        signal: "Come in from Bukit Nanas so the bulb sits on the shaft, not as a box.",
        coordinates: "3.1529° N · 101.7038° E",
        x: 40,
        y: 40,
      },
      {
        id: "exchange-106",
        name: "The Exchange 106",
        thai: "Menara Exchange 106",
        chapter: "TRX",
        description:
          "CTBUH 453.6 m. Some Chinese-language summaries quote 445.5 m; this twin uses CTBUH.",
        signal: "Look east of the Golden Triangle; TRX is a different cluster, not KLCC.",
        coordinates: "3.1418° N · 101.7187° E",
        x: 78,
        y: 62,
      },
      {
        id: "merdeka-118",
        name: "Merdeka 118",
        thai: "Menara Merdeka Maybank",
        chapter: "The spire",
        description:
          "CTBUH 678.9 m, occupied 502.8 m, 118 floors, over Stadium Merdeka (National Heritage 2009).",
        signal: "Zoom until the taper reads as a needle, not a fat box.",
        coordinates: "3.1417° N · 101.7008° E",
        x: 36,
        y: 64,
      },
    ],
  },
  {
    id: "klang-valley",
    number: "03",
    name: "Klang Valley",
    thai: "Lembah Klang",
    strapline: "Rivers, hills, the metro edge",
    description:
      "Wider than WP Kuala Lumpur: the Klang and Gombak, Thean Hou on its hill, and Batu Caves in Gombak, Selangor — labelled as such, never as inside DBKL.",
    image: "/heritage/photos/thean-hou.jpg",
    width: 0,
    height: 0,
    distance: "Atlas only — no Minecraft world has been generated for Kuala Lumpur",
    regions: 0,
    chunks: "none",
    download: "",
    stops: [
      {
        id: "thean-hou",
        name: "Thean Hou Temple",
        thai: "Kuil Thean Hou / 天后宫",
        chapter: "The hillside temple",
        description:
          "Iconic Mazu temple. Not on the 2007/2009/2012 National Heritage lists pulled for this twin.",
        signal: "Pitch so the stacked red roofs read against the hill, not the highway.",
        coordinates: "3.1218° N · 101.6876° E",
        x: 30,
        y: 78,
      },
      {
        id: "batu-caves",
        name: "Lord Murugan, Batu Caves",
        thai: "Patung Lord Murugan, Batu Caves",
        chapter: "Selangor / Gombak",
        description:
          "Metro icon, not WP Kuala Lumpur. OSM node 2911346279. The 42.7 m figure is tourism copy, used here as an interpretive envelope only.",
        signal: "This stop is outside DBKL. Say Gombak, Selangor, every time.",
        coordinates: "3.2375° N · 101.6840° E",
        x: 28,
        y: 8,
      },
      {
        id: "confluence",
        name: "Klang / Gombak confluence",
        thai: "Pertemuan Sungai Klang dan Sungai Gombak",
        chapter: "The muddy fork",
        description:
          "The rivers are OSM waterways. The flood colour is an interpretive 90 m corridor, not JPS zon banjir.",
        signal: "Turn on the river layer. The flood corridor is labelled interpretive on purpose.",
        coordinates: "3.1488° N · 101.6957° E",
        x: 48,
        y: 48,
      },
    ],
  },
];
