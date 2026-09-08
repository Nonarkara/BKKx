// Malay and Simplified Chinese overlays for the KL quarters, walks and about
// essay. Canonical English stays in heritage-places.json. Components fall back
// to English when a slug is missing — never a blank block.

export type AreaTranslation = { tagline: string; prose: string[] };
export type WalkTranslation = { intro: string; stops: Record<string, string> };

export const AREA_MS: Record<string, AreaTranslation> = {
  "merdeka-core": {
    tagline: "Padang, kubah tembaga, menara jam — Kuala Lumpur sivik zaman kolonial.",
    prose: [
      "Dataran Merdeka ialah bilik yang Bangunan Sultan Abdul Samad dibina untuk menghadapinya: padang, menara jam, kubah bawang tembaga, Dewan Bandaraya di utara. Negeri-Negeri Melayu Bersekutu meletakkan senibina sivik di sini pada 1890-an, dan Jabatan Warisan Negara mengisytiharkannya Warisan Kebangsaan pada 2007.",
      "Kemerdekaan diisytiharkan satu kilometer ke selatan, di Stadium Merdeka, pada 31 Ogos 1957. Stadium itu kini Warisan Kebangsaan 2009 dan berdiri di bayang Merdeka 118 — 678.9 m, 118 tingkat. Padang dan puncak ialah satu hujah sivik.",
      "Jalanilah pada waktu pagi, sebelum kumpulan pelancong memenuhi tangga menara jam. Masjid Jamek lima minit ke timur, di pertemuan dua sungai yang memberi nama kepada bandar ini.",
    ],
  },
  klcc: {
    tagline: "Petronas 451.9 m, Menara KL 421 m, taman yang mereka direka untuk dilihat merentasinya.",
    prose: [
      "Menara Berkembar Petronas masih pasangan yang dikenali dunia: CTBUH 451.9 m senibina, 375 m diduduki, jambatan langit 58.4 m pada 170 m. OpenStreetMap merekodkannya sebagai satu way; kembar ini memisahkan outline itu kepada dua batang bintang lapan sudut supaya mereka dibaca sebagai kembar.",
      "Menara KL berdiri di Bukit Nanas antara teras kolonial dan KLCC — antena 421 m, pod pemerhatian 336.5 m. OSM hanya ada nod; batang bulat di sini dilabel interpretif.",
      "Taman KLCC ialah latar depan yang direka. Tanah di bawahnya antara yang paling mahal di negara ini pada bukti senarai; PDF penilaian NAPIC dikatalog, belum ditelan.",
    ],
  },
  "petaling-street": {
    tagline: "Jalan pasar bertutup Chinatown — 茨厂街 — dan gopuram Mariamman.",
    prose: [
      "Jalan Petaling ialah jalan yang bandar Cina kekalkan apabila padang kolonial mengambil pertemuan sungai. Dalam bahasa Cina ia 茨厂街. Arked masih berniaga; warisannya ialah fabrik, bukan satu monumen yang diisytihar.",
      "Sri Mahamariamman, 1873, berdiri di bahu barat jalan — kuil Hindu tertua di ibu negara, dan titik mula kereta perak Thaipusam. Ia tiada dalam senarai Warisan Kebangsaan 2007/2009/2012 yang disemak untuk kembar ini, dan halaman ini mengatakannya.",
      "Pasar Seni, pasar Art Deco 1937, duduk di sungai antara Chinatown dan padang. Dua ekonomi masih berkongsi pintu.",
    ],
  },
  "kampung-baru": {
    tagline: "Kampung Melayu di tengah ibu negara — tanah adat, rumah kayu, menara di langit.",
    prose: [
      "Kampung Baru diwartakan pada 1899 sebagai petempatan Melayu. Rumah kayu dan lot makanan masih berdiri di bawah siluet KLCC. Ini bukan kuarters gazetted yang sama dengan padang; ia fabrik hidup yang atlas ini namakan supaya tidak hilang di antara menara.",
      "Pin di sini ialah pusat kawasan, bukan satu lot. NAPIC dan geran individu tidak ditelan.",
    ],
  },
  brickfields: {
    tagline: "Little India di landasan — kuil, gerai, dan stesen yang menamakan kawasan itu.",
    prose: [
      "Brickfields ialah tanah liat yang menjadi batu bata ibu negara, kemudian Little India di sisi landasan. Kuil, gerai dan stesen KA02/Kuala Lumpur Sentral duduk bersebelahan.",
      "Bangunan Ibu Stesen Keretapi (Hubback, 1910) ialah Warisan Kebangsaan 2007. OSM kini menamakan poligon stesen KA02; pin itu sentroid, direkod sebagai padanan kabur.",
    ],
  },
  "bukit-bintang": {
    tagline: "Jalan beli-belah Segi Tiga Emas — neon, mall, dan harga tanah senarai.",
    prose: [
      "Bukit Bintang ialah jalan runcit Segi Tiga Emas. Pin di tengah jalur, bukan di satu mall. Jalur harga tanah di atlas ini ialah jalur senarai/media, bukan parsel NAPIC.",
    ],
  },
  "chow-kit": {
    tagline: "Pasar basah utara — Jalan TAR, malam, dan ekonomi yang daftar warisan jarang pegang.",
    prose: [
      "Chow Kit ialah pasar utara di Jalan Tuanku Abdul Rahman. Warisannya ialah perdagangan, bukan satu gazet. Atlas ini menamakan kuarters supaya peta tidak melompat dari padang ke KLCC seolah-olah tiada bandar di antaranya.",
    ],
  },
  "river-of-life": {
    tagline: "Sungai Klang dan Gombak — pertemuan yang menamakan Kuala Lumpur.",
    prose: [
      "Kuala Lumpur bermaksud pertemuan lumpur. Sungai Klang dan Sungai Gombak bertemu di Masjid Jamek. Program River of Life membina teres di tebing; JPS InfoBanjir (kod negeri WLH) ialah portal hidup. Tiada API JSON awam yang didokumenkan.",
      "Koridor banjir di atlas ini ialah buffer 90 m interpretif di sekitar sungai OSM. Ia bukan zon banjir rasmi.",
    ],
  },
  "thean-hou": {
    tagline: "Kuil Mazu di bukit — 天后宫 — ikonik, belum dalam senarai 2007/2009/2012 yang disemak.",
    prose: [
      "Kuil Thean Hou (天后宫) ialah kuil Mazu di cerun. Ia ikonik dan dilawat; ia tidak ada dalam senarai Warisan Kebangsaan 2007, 2009 atau 2012 yang ditarik ke sini, dan pin itu mengatakannya.",
      "Batu Caves dan patung Murugan 42.7 m (salinan pelancongan, bukan ukur rasmi) berada di Gombak, Selangor — dilabel demikian, bukan WP KL / DBKL.",
    ],
  },
};

export const AREA_ZH: Record<string, AreaTranslation> = {
  "merdeka-core": {
    tagline: "大草场、铜穹顶、钟楼——殖民市政吉隆坡。",
    prose: [
      "独立广场是苏丹阿都沙末大厦面对的厅堂：一片大草场、一座钟楼、铜洋葱顶，北面是市政厅。马来联邦在 1890 年代把市政建筑放在这里，国家遗产局于 2007 年列为国家遗产。",
      "独立本身在南面一公里的默迪卡体育场宣布，日期是 1957 年 8 月 31 日。体育场现为国家遗产 2009，立在默迪卡 118 的影子里——678.9 米、118 层。草场与尖顶是同一套市政论证。",
      "早晨走，赶在旅行团占满钟楼台阶之前。占美清真寺在东面五分钟，位于给这座城市命名的两河交汇。",
    ],
  },
  klcc: {
    tagline: "双子塔 451.9 米，吉隆坡塔 421 米，为对望而设计的公园。",
    prose: [
      "国油双峰塔仍是世界认得的那一对：CTBUH 建筑高度 451.9 米，使用高度 375 米，天空桥 58.4 米、离地 170 米。OpenStreetMap 把它们记成一条 way；这里把轮廓拆成两座八角星塔身，好让它们读作双子。",
      "吉隆坡塔立在武吉免登与殖民核心之间的武吉纳纳斯——天线 421 米，观景舱 336.5 米。OSM 只有节点；这里的圆形塔身标为解释性。",
      "KLCC 公园是设计好的前景。其下土地在挂牌证据上属全国最贵之列；NAPIC 估价 PDF 已编目，尚未入库。",
    ],
  },
  "petaling-street": {
    tagline: "唐人街的有盖市集街——茨厂街——与马里安曼塔门。",
    prose: [
      "茨厂街是殖民大草场拿走两河交汇之后，华人城留下的那条街。拱廊仍在买卖；遗产是整片肌理，不是一处已公布古迹。",
      "马里安曼兴都庙，1873 年，立在街的西肩——首都最老的兴都庙，大宝森银车从此出发。它不在本次核对的 2007/2009/2012 国家遗产名单上，本页如实写明。",
      "中央艺术坊，1937 年装饰风市集，坐在唐人街与大草场之间的河边。两套经济仍共用门口。",
    ],
  },
  "kampung-baru": {
    tagline: "首都正中的马来村落——习俗地、木屋、天上的塔。",
    prose: [
      "新村于 1899 年划为马来聚落。木屋与食档仍立在 KLCC 天际线下。这不是与大草场同一类已公布街区；本图把它标出来，免得它消失在塔群之间。",
      "这里的点是街区中心，不是某一地段。NAPIC 与个人地契未入库。",
    ],
  },
  brickfields: {
    tagline: "铁道边的小印度——庙、档口、给街区命名的车站。",
    prose: [
      "十五碑曾是制砖的黏土，后来成了铁道边的小印度。庙、档口与 KA02／吉隆坡中央车站并排。",
      "吉隆坡火车站大楼（Hubback，1910）为国家遗产 2007。OSM 现把车站多边形标为 KA02；针脚是该形心，记为模糊匹配。",
    ],
  },
  "bukit-bintang": {
    tagline: "金三角购物街——霓虹、商场、挂牌地价。",
    prose: [
      "武吉免登是金三角的零售街。针脚在路段中段，不是某一商场。本图地价带是挂牌／媒体区间，不是 NAPIC 地块。",
    ],
  },
  "chow-kit": {
    tagline: "北面湿市场—— TAR 路、夜晚、遗产名录很少握住的经济。",
    prose: [
      "周吉是东姑阿都拉曼路的北面市场。遗产是买卖本身，不是一份宪报。本图标出街区，免得地图从大草场跳到 KLCC，中间像没有城市。",
    ],
  },
  "river-of-life": {
    tagline: "巴生河与鹅唛河——给吉隆坡命名的交汇。",
    prose: [
      "Kuala Lumpur 意为泥泞的交汇。巴生河与鹅唛河在占美清真寺相会。River of Life 在岸边做了台地；JPS InfoBanjir（州代码 WLH）是活门户。没有已记录的公开 JSON API。",
      "本图洪水廊道是 OSM 河流外 90 米的解释性缓冲，不是官方洪水区。",
    ],
  },
  "thean-hou": {
    tagline: "山腰上的妈祖庙——天后宫——地标，但不在本次核对的 2007/2009/2012 名单上。",
    prose: [
      "天后宫是坡上的妈祖庙。它标志、常被参观；它不在本次拉取的 2007、2009 或 2012 国家遗产名单上，针脚如实写明。",
      "黑风洞与穆鲁根像 42.7 米（旅游文案，非官方实测）在雪兰莪鹅唛——如此标注，不是联邦直辖区吉隆坡／DBKL。",
    ],
  },
};

export const WALK_MS: Record<string, WalkTranslation> = {
  "merdeka-civic": {
    intro:
      "Bilik sivik kolonial, ke selatan ke stesen dan ke barat ke tugu. Jarak ialah 1.25 × bulatan besar — profil kaki OSRM awam memusing Dataran Merdeka dan tidak digunakan.",
    stops: {
      "Sultan Abdul Samad Building":
        "Kubah bawang tembaga dan menara jam di padang. Warisan Kebangsaan 2007; majlis pengisytiharan 2012 diadakan di sini.",
      "Dataran Merdeka":
        "Padang. Kemerdekaan diisytiharkan satu kilometer selatan di Stadium Merdeka; ini bilik sivik yang deretan kolonial dibina untuk menghadapinya.",
      "Jamek Mosque": "Hubback, 1909, di pertemuan Klang/Gombak. Warisan Kebangsaan 2009.",
      "Kuala Lumpur Railway Station":
        "Stesen Hubback 1910. Nama warisan ialah Bangunan Ibu Stesen Keretapi; OSM kini menamakan poligon stesen KA02.",
      "National Mosque": "1965; bumbung payung 16 titik; menara 73 m. Warisan Kebangsaan 2007 bersama Makam Pahlawan.",
      "National Monument": "Kumpulan gangsa Felix de Weldon, 1966. Warisan Kebangsaan 2007.",
    },
  },
  "golden-triangle": {
    intro:
      "Menara sebagai urutan berjalan: Petronas, taman, Menara KL, Bukit Bintang, TRX, Merdeka 118. Jarak 1.25 × bulatan besar, bukan OSRM.",
    stops: {
      "Petronas Twin Towers":
        "CTBUH 451.9 m senibina, 375 m diduduki, jambatan langit 58.4 m pada 170 m. OSM merekod kembar sebagai satu way.",
      "KLCC Park": "Taman dan Symphony Lake yang menara direka untuk dilihat merentasinya.",
      "Kuala Lumpur Tower": "Antena 421 m, pod 336.5 m, observatori 276 m. OSM ada nod, tiada way bangunan.",
      "Bukit Bintang": "Jalan beli-belah Segi Tiga Emas. Pin di tengah jalur, bukan mall.",
      "The Exchange 106": "CTBUH 453.6 m. TRX, timur Segi Tiga Emas. Utamakan CTBUH berbanding wiki Cina 445.5 m.",
      "Merdeka 118": "CTBUH 678.9 m, 118 tingkat, di atas Stadium Merdeka.",
    },
  },
  "chinatown-hills": {
    intro:
      "Jalan Petaling, gopuram Mariamman, Pasar Seni, kemudian naik ke Thean Hou. Jarak 1.25 × bulatan besar, bukan OSRM.",
    stops: {
      "Petaling Street": "Jalan pasar bertutup Chinatown. Nama Cina ialah 茨厂街.",
      "Sri Mahamariamman Temple": "1873; kuil Hindu tertua di KL. Kereta Thaipusam bermula di sini.",
      "Central Market": "Pasar basah Art Deco 1937, kini dewan kraf, di sungai antara Chinatown dan padang.",
      "Thean Hou Temple": "Kuil Mazu di bukit. Ikonik, tidak dalam senarai JWN 2007/2009/2012 yang ditarik ke sini.",
    },
  },
};

export const WALK_ZH: Record<string, WalkTranslation> = {
  "merdeka-civic": {
    intro:
      "殖民市政厅堂，南至车站、西至国家纪念碑。距离为大圆的 1.25 倍——公开 OSRM 步行线会绕开独立广场，故未采用。",
    stops: {
      "Sultan Abdul Samad Building":
        "大草场上的铜洋葱顶与钟楼。国家遗产 2007；2012 年公布仪式在此举行。",
      "Dataran Merdeka":
        "大草场。独立在南面一公里的默迪卡体育场宣布；这是殖民建筑群面对的市政厅堂。",
      "Jamek Mosque": "Hubback，1909，巴生／鹅唛交汇。国家遗产 2009。",
      "Kuala Lumpur Railway Station":
        "Hubback 1910 年车站。遗产名为 Bangunan Ibu Stesen Keretapi；OSM 现把车站多边形标为 KA02。",
      "National Mosque": "1965；十六角伞顶；宣礼塔 73 米。与英雄墓同列国家遗产 2007。",
      "National Monument": "Felix de Weldon 铜像群，1966。国家遗产 2007。",
    },
  },
  "golden-triangle": {
    intro:
      "把塔当成步行序列：双子塔、公园、吉隆坡塔、武吉免登、TRX、默迪卡 118。距离为大圆的 1.25 倍，不是 OSRM。",
    stops: {
      "Petronas Twin Towers":
        "CTBUH 建筑高度 451.9 米，使用高度 375 米，天空桥 58.4 米、离地 170 米。OSM 把双子记成一条 way。",
      "KLCC Park": "为对望而设计的公园与交响湖。",
      "Kuala Lumpur Tower": "天线 421 米，舱 336.5 米，观景 276 米。OSM 有节点，无建筑 way。",
      "Bukit Bintang": "金三角购物街。针脚在路段中段，不是商场。",
      "The Exchange 106": "CTBUH 453.6 米。TRX，金三角以东。取 CTBUH，不取中文维基 445.5 米。",
      "Merdeka 118": "CTBUH 678.9 米，118 层，立在默迪卡体育场之上。",
    },
  },
  "chinatown-hills": {
    intro: "茨厂街、马里安曼塔门、中央艺术坊，再上到天后宫。距离为大圆的 1.25 倍，不是 OSRM。",
    stops: {
      "Petaling Street": "唐人街的有盖市集街。中文名是茨厂街。",
      "Sri Mahamariamman Temple": "1873；吉隆坡最老的兴都庙。大宝森银车从此出发。",
      "Central Market": "1937 年装饰风湿市场，现为手工艺厅，在唐人街与大草场之间的河边。",
      "Thean Hou Temple": "山腰妈祖庙。地标，但不在本次拉取的 2007/2009/2012 JWN 名单上。",
    },
  },
};

export const REGISTER_LEDE_MS = {
  h1Line1: "Warisan Kuala Lumpur,",
  h1Line2: "monumen demi monumen.",
  intro: [
    "Jabatan Warisan Negara menyimpan senarai Warisan Kebangsaan. Halaman ini memegang entri 2007, 2009 dan 2012 yang boleh dipetakan di WP Kuala Lumpur, plus mercu tanda OSM yang dinamakan. Ini ialah hirisan WP KL, bukan seluruh senarai negara.",
    "Sebuah tapak sama ada diisytihar — Warisan Kebangsaan dengan tahun — atau ikonik tetapi belum dalam senarai yang ditarik ke sini. Kedua-duanya ada, dan beza itu ditanda. Menara Petronas tidak menunggu warta untuk terus berdiri.",
    "Peta 3D ialah pintu depan KLX sekarang — daftar ini ialah drill-down. Jika anda mahu membaca bandar dari atas dahulu, peta ada di laman utama.",
  ],
};

export const REGISTER_LEDE_ZH = {
  h1Line1: "吉隆坡的遗产，",
  h1Line2: "一座一座地标。",
  intro: [
    "国家遗产局保存国家遗产名单。本页收录可在联邦直辖区吉隆坡落点的 2007、2009 与 2012 条目，外加有名称的 OSM 地标。这是吉隆坡切片，不是全国每一处已公布建筑的总表。",
    "一处地点要么已公布——国家遗产并标明年份——要么是地标但不在本次拉取的名单上。两者都在，差别被标出。双子塔并不需要等一份公报才继续站着。",
    "三维地图现在是 KLX 的正门——这份名录是向下钻取。若要先从上空读这座城市，地图在首页。",
  ],
};

export const ABOUT_MS = {
  title: "Bandar yang mesti dilihat oleh datuk bandar.",
  eyebrow: "Sebab wujud",
  paragraphs: [
    "Saya membina atlas Bangkok dahulu. Kuala Lumpur meminta yang sama: menara yang dikenali sebagai diri mereka, daftar warisan yang jujur, dan air yang tidak direka.",
    "Petronas mesti dibaca sebagai kembar. Merdeka 118 mesti ada puncak. Menara KL mesti ada pod merah jambu. Masjid Negara mesti ada bumbung payung. Itu bukan hiasan — itu sebab datuk bandar datang.",
    "Angka yang kami tunjuk ialah angka yang ada sumber. CTBUH untuk ketinggian senibina. Jabatan Warisan Negara untuk pengisytiharan. OSM untuk jejak. JPS InfoBanjir tiada API JSON awam, jadi kami tidak mencuri cermin.",
    "Banjir di sini dilukis sebagai koridor interpretif 90 m di sekitar sungai OSM, dilabel bukan zon banjir. Harga tanah ialah jalur senarai, bukan parsel NAPIC.",
    "Batu Caves berada di Gombak, Selangor. Atlas ini menunjukkannya dan mengatakannya. WP KL dan DBKL tidak boleh menuntutnya.",
    "Tiada dunia Minecraft untuk Kuala Lumpur dalam cawangan ini. Atlas sahaja. Kami tidak mengada-adakan chunk.",
    "Kamera yang kami pautkan ialah suapan awam YouTube dan portal KLCCC. Tiada URL CCTV DBKL yang direka. Penanda placeholder berkongsi satu koordinat nominal.",
    "Daftar di sini kecil dengan sengaja: dua puluh tapak, empat belas diisytihar, enam menunggu. Lebih baik senarai pendek yang boleh disemak daripada 571 entri yang disalin dari bandar lain.",
    "Itu seluruh hujah: tunjukkan bandar seperti yang ia ada, dengan label di mana kita menafsir, supaya mesyuarat dengan datuk bandar bermula dari peta yang sama.",
  ],
  captions: {
    portrait: "Langit malam Petronas — muka bandar yang dunia sudah kenali.",
    thammasat: "Teras sivik: padang, kubah tembaga, menara jam.",
    watarun1: "KLCC dan taman yang menara direka untuk dilihat merentasinya.",
    temples: "茨厂街 — fabrik, bukan satu gazet.",
    foodstalls: "Kampung Baru di bawah menara.",
    safecity: "Brickfields dan stesen Hubback.",
    shophouses: "Bukit Bintang pada waktu malam.",
    alley: "Chow Kit — ekonomi yang daftar jarang pegang.",
    waterfront: "Pertemuan dua sungai.",
    openspace: "Thean Hou di cerun.",
  },
};

export const ABOUT_ZH = {
  title: "市长必须看见的城市。",
  eyebrow: "为何存在",
  paragraphs: [
    "我先做了曼谷的地图。吉隆坡要同样的东西：让人一眼认出的塔、一份诚实的遗产名录、以及不虚构的水。",
    "双子塔必须读作一对。默迪卡 118 必须有尖顶。吉隆坡塔必须有粉红舱。国家清真寺必须有伞顶。那不是装饰——那是市长来的原因。",
    "我们出示的数字都有出处。建筑高度用 CTBUH。公布用国家遗产局。足迹用 OSM。JPS InfoBanjir 没有已记录的公开 JSON API，所以我们不抓镜像。",
    "洪水在这里画成 OSM 河流外 90 米的解释性廊道，并标明不是官方洪水区。地价是挂牌带，不是 NAPIC 地块。",
    "黑风洞在雪兰莪鹅唛。本图画出它并写明。联邦直辖区吉隆坡与 DBKL 不能认领它。",
    "本分支没有吉隆坡的 Minecraft 世界。只有地图。我们不虚构区块。",
    "我们链接的摄像头是公开 YouTube 与 KLCCC 门户。没有编造的 DBKL CCTV 地址。占位针脚共用一个名义坐标。",
    "这里的名录故意很小：二十处，十四处已公布，六处等待。宁可一份可核对的短名单，也不要从别的城市复制 571 条。",
    "全部论点就是：按它本来的样子出示这座城市，在我们解释的地方贴上标签，好让与市长的会议从同一张地图开始。",
  ],
  captions: {
    portrait: "双子塔夜空——世界已经认得的那张脸。",
    thammasat: "市政核心：大草场、铜穹顶、钟楼。",
    watarun1: "KLCC 与为对望而设计的公园。",
    temples: "茨厂街——肌理，不是一份宪报。",
    foodstalls: "塔影下的新村。",
    safecity: "十五碑与 Hubback 车站。",
    shophouses: "夜里的武吉免登。",
    alley: "周吉——名录很少握住的经济。",
    waterfront: "两河交汇。",
    openspace: "坡上的天后宫。",
  },
};
