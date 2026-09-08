// Short, mechanical UI chrome strings — hand-translated, not swarm-translated.
// Long-form content falls back to English via useLocale()'s t().

export const DICTIONARY = {
  en: {
    nav_quarters: "Quarters",
    nav_walks: "Walks",
    nav_register: "Register",
    nav_about: "About",
    nav_worlds: "The atlas",
    nav_github: "GitHub",

    hero_eyebrow: "Why this exists",
    front_door_tagline:
      "The 3D map is the front door. Nine quarters, three walks, a National Heritage register mapped honestly — pick a landmark and fly there.",

    section_quarters_title: "The quarters",
    section_walks_title: "The walks",
    section_register_title: "The register, mapped",
    quarters_lede: "From Dataran Merdeka to Thean Hou. Click to fly the map.",
    home_quarters_heading: "Nine quarters",
    home_source_label: "Source",
    home_source_github: "Source on GitHub",
    quarters_index_lede:
      "Heritage in Kuala Lumpur is not scattered evenly — it pools in quarters, each with its own founding story. Nine of them, from the padang to the hillside temple, each with its monuments, its walks and its own page.",
    walks_index_lede:
      "Three routes through the civic core, the Golden Triangle, and Chinatown to Thean Hou. Distances are 1.25 × great-circle; the public OSRM foot profile detours around Dataran Merdeka and is not used.",
    register_mapped_lede:
      "National Heritage sites from Jabatan Warisan Negara, plus named OSM landmarks. Filled marks are gazetted; hollow marks are iconic but not on the 2007/2009/2012 lists pulled here. Unlocated gazette entries stay unpinned.",
    by_bicycle: "by bicycle",

    filter_all: "Every located monument",
    filter_registered: "Gazetted only",
    filter_walkable: "Walkable in Minecraft",
    status_gazetted: "gazetted",
    status_awaiting: "awaiting consideration",

    walk_eyebrow: "Heritage walk",
    walk_stops: "Stops",
    walk_distance: "Distance",
    walk_on_foot: "On foot",
    walk_mode: "Mode",
    walk_mode_walking: "Walking",
    walk_mode_bike: "Bicycle",
    walk_by_the_numbers: "By the numbers",
    walk_on_register: "On the National Heritage lists pulled here",
    walk_oldest_gazette: "Oldest gazette entry on this walk",
    walk_walkable_minecraft: "Walkable in Minecraft",
    walk_pace: "Pace",
    walk_longest_shortest: "Longest / shortest leg",
    walk_of: "of",
    walk_stops_lower: "stops",
    walk_years_ago: "years ago",
    walk_newest: "newest",
    walk_gazetted_label: "Gazetted",
    walk_nearby_eyebrow: "Nearby · street economy",
    walk_nearby_source: "OpenStreetMap (ODbL) · sorted by distance from this stop",
    walk_from_stop: "m from stop",
    walk_min_walk: "min walk",

    poi_legend_label: "Map layers",
    poi_legend_caption:
      "KLX overlay: stacked hero monuments, OSM rivers, interpretive drainage corridors, listing-based land bands. OpenFreeMap 3D buildings are global OSM massing.",
    poi_pin_label: "pin",
    poi_pins_label: "pins",

    quests_heading: "Side quests near here",
    quests_lede: "Real, currently-open spots — not a top-10 list. Verified before publishing; still worth calling ahead.",
    quests_address_label: "Where",
    quests_map_link: "Open in Maps",

    oldtown_callout_label: "Why it matters",

    nav_global: "Global",

    lang_toggle_label: "Language",
  },
  ms: {
    nav_quarters: "Kawasan",
    nav_walks: "Laluan jalan kaki",
    nav_register: "Daftar warisan",
    nav_about: "Tentang",
    nav_worlds: "Atlas",
    nav_github: "GitHub",

    hero_eyebrow: "Sebab wujud",
    front_door_tagline:
      "Peta 3D ialah pintu depan. Sembilan kawasan, tiga laluan, daftar Warisan Kebangsaan yang dipetakan dengan jujur — pilih mercu tanda dan terbang ke situ.",

    section_quarters_title: "Kawasan",
    section_walks_title: "Laluan jalan kaki",
    section_register_title: "Daftar, dipetakan",
    quarters_lede: "Dari Dataran Merdeka ke Thean Hou. Klik untuk terbang.",
    home_quarters_heading: "Sembilan kawasan",
    home_source_label: "Sumber",
    home_source_github: "Sumber di GitHub",
    quarters_index_lede:
      "Warisan Kuala Lumpur tidak tersebar rata — ia berkumpul dalam kawasan, setiap satu dengan cerita penubuhannya. Sembilan kawasan, dari padang ke kuil di bukit.",
    walks_index_lede:
      "Tiga laluan: teras sivik, Segi Tiga Emas, dan 茨厂街 ke Thean Hou. Jarak ialah 1.25 × bulatan besar; profil kaki OSRM awam memusing Dataran Merdeka dan tidak digunakan.",
    register_mapped_lede:
      "Tapak Warisan Kebangsaan Jabatan Warisan Negara, plus mercu tanda OSM yang dinamakan. Tanda padat sudah diisytihar; tanda berongga ikonik tetapi tiada dalam senarai 2007/2009/2012 yang disemak di sini.",
    by_bicycle: "dengan basikal",

    filter_all: "Setiap monumen yang ada pin",
    filter_registered: "Yang diisytihar sahaja",
    filter_walkable: "Boleh berjalan dalam Minecraft",
    status_gazetted: "diisytihar",
    status_awaiting: "menunggu pertimbangan",

    walk_eyebrow: "Laluan warisan",
    walk_stops: "Hentian",
    walk_distance: "Jarak",
    walk_on_foot: "Berjalan kaki",
    walk_mode: "Mod",
    walk_mode_walking: "Berjalan kaki",
    walk_mode_bike: "Basikal",
    walk_by_the_numbers: "Mengikut nombor",
    walk_on_register: "Dalam senarai Warisan Kebangsaan yang disemak",
    walk_oldest_gazette: "Pengisytiharan tertua pada laluan ini",
    walk_walkable_minecraft: "Boleh berjalan dalam Minecraft",
    walk_pace: "Kadar",
    walk_longest_shortest: "Kaki terpanjang / terpendek",
    walk_of: "daripada",
    walk_stops_lower: "hentian",
    walk_years_ago: "tahun lalu",
    walk_newest: "terbaharu",
    walk_gazetted_label: "Diisytihar",
    walk_nearby_eyebrow: "Berdekatan · ekonomi jalanan",
    walk_nearby_source: "OpenStreetMap (ODbL) · disusun mengikut jarak dari hentian ini",
    walk_from_stop: "m dari hentian",
    walk_min_walk: "min berjalan",

    poi_legend_label: "Lapisan peta",
    poi_legend_caption:
      "Lapisan KLX: mercu tanda bertingkat, sungai OSM, koridor saliran interpretif, jalur harga tanah berasaskan senarai. Bangunan 3D OpenFreeMap ialah jisim OSM global.",
    poi_pin_label: "pin",
    poi_pins_label: "pin",

    quests_heading: "Hentian sampingan dekat sini",
    quests_lede: "Tempat nyata yang masih buka — bukan senarai top-10.",
    quests_address_label: "Di mana",
    quests_map_link: "Buka dalam Peta",

    oldtown_callout_label: "Mengapa penting",

    nav_global: "Global",

    lang_toggle_label: "Bahasa",
  },
  zh: {
    nav_quarters: "街区",
    nav_walks: "步行路线",
    nav_register: "名录",
    nav_about: "关于",
    nav_worlds: "地图",
    nav_github: "GitHub",

    hero_eyebrow: "为何存在",
    front_door_tagline:
      "三维地图就是正门。九个街区、三条步行、一份如实标点的国家遗产名录——选一座地标飞过去。",

    section_quarters_title: "街区",
    section_walks_title: "步行路线",
    section_register_title: "名录，已上图",
    quarters_lede: "从独立广场到天后宫。点击即可飞到地图上。",
    home_quarters_heading: "九个街区",
    home_source_label: "来源",
    home_source_github: "GitHub 源码",
    quarters_index_lede:
      "吉隆坡的遗产并不均匀散布，而是聚在街区里。九个街区，从独立广场到山腰上的天后宫，各有古迹、步行与专页。",
    walks_index_lede:
      "三条路线：殖民市政核心、金三角、茨厂街到天后宫。距离为大圆距离的 1.25 倍；公开 OSRM 步行线会绕开独立广场，故未采用。",
    register_mapped_lede:
      "国家遗产局（Jabatan Warisan Negara）名录，外加有名称的 OSM 地标。实心为已公布；空心为地标但不在本次核对的 2007/2009/2012 名单上。未能定位的条目不打点。",
    by_bicycle: "骑行",

    filter_all: "所有已定位古迹",
    filter_registered: "仅已公布",
    filter_walkable: "可在 Minecraft 中行走",
    status_gazetted: "已公布",
    status_awaiting: "待审议",

    walk_eyebrow: "遗产步行",
    walk_stops: "站点",
    walk_distance: "距离",
    walk_on_foot: "步行",
    walk_mode: "方式",
    walk_mode_walking: "步行",
    walk_mode_bike: "骑行",
    walk_by_the_numbers: "数字",
    walk_on_register: "在本次核对的国家遗产名单上",
    walk_oldest_gazette: "本路线最早公布年份",
    walk_walkable_minecraft: "可在 Minecraft 中行走",
    walk_pace: "步速",
    walk_longest_shortest: "最长 / 最短一段",
    walk_of: "/",
    walk_stops_lower: "站",
    walk_years_ago: "年前",
    walk_newest: "最新",
    walk_gazetted_label: "公布于",
    walk_nearby_eyebrow: "附近 · 街道经济",
    walk_nearby_source: "OpenStreetMap (ODbL) · 按距本站距离排序",
    walk_from_stop: "米，距站点",
    walk_min_walk: "分钟步行",

    poi_legend_label: "图层",
    poi_legend_caption:
      "KLX 图层：分层地标、OSM 河流、解释性排水廊道、基于挂牌的地价带。OpenFreeMap 三维建筑是全球 OSM 体量。",
    poi_pin_label: "点",
    poi_pins_label: "点",

    quests_heading: "附近可去之处",
    quests_lede: "真实仍在营业的地点，不是十佳榜。",
    quests_address_label: "地址",
    quests_map_link: "在地图中打开",

    oldtown_callout_label: "为何重要",

    nav_global: "全球",

    lang_toggle_label: "语言",
  },
} as const;

export type DictKey = keyof typeof DICTIONARY.en;

type _AssertMs = Record<DictKey, string> & typeof DICTIONARY.ms;
type _AssertZh = Record<DictKey, string> & typeof DICTIONARY.zh;
const _checkMs: _AssertMs = DICTIONARY.ms;
const _checkZh: _AssertZh = DICTIONARY.zh;
void _checkMs;
void _checkZh;
