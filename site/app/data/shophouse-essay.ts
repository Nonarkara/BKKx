// "Bangkok Doesn't Need a Smart City" — the third essay in the Shophouse
// Metropolis studio book (Harvard GSD / CHAT Architects / AECOM), following
// Chatpong Chuenrudeemol's "Shophouse Metropolis" and "Bangkok Bastards".
//
// Written first-person as Dr Non. Blocks rather than one markdown string so
// the interactive figures can sit inside the argument at the point the
// argument needs them, instead of being decoration bolted to the end.
// The manuscript export at /shophouses/manuscript renders the same source
// as continuous prose for the printed book.

export type Block =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "pull"; text: string }
  | { kind: "note"; text: string }
  | { kind: "figure"; id: FigureId; caption: string };

export type FigureId =
  | "stock"
  | "timeline"
  | "sukhumvit-pattern"
  | "carbon"
  | "corridor"
  | "projects"
  | "tenure"
  | "research";

export const ESSAY_META = {
  title: "Bangkok Doesn't Need a Smart City",
  subtitle: "It needs to legitimise the one it already built.",
  byline: "Non Arkara",
  context:
    "The third essay in Shophouse Metropolis (Harvard Graduate School of Design, 2026), following Chatpong Chuenrudeemol's title essay and Bangkok Bastards.",
  abstractTh:
    "ผมไม่ใช่นักอนุรักษ์ ผมสนใจอนาคตและเชื่อว่าเทคโนโลยีทำให้เมืองปลอดภัยขึ้น อากาศและน้ำสะอาดขึ้น อุบัติเหตุน้อยลง ใช้พลังงานอย่างสิ้นเปลืองน้อยลง และเปิดโอกาสทางเศรษฐกิจให้คนได้มากขึ้น แต่มนุษย์ปรับตัวเข้ากับสภาพแวดล้อมใหม่ไม่ได้เร็วเท่าที่เมืองถูกรื้อสร้าง เราจึงต้องการ ‘เศษเสี้ยวของความคุ้นเคย’ เหลือไว้พอให้การเปลี่ยนแปลงนั้นอ่านออกและอยู่กับมันได้ ความต่อเนื่องจึงไม่ใช่ความโหยหาอดีต แต่คือเงื่อนไขที่ทำให้การเปลี่ยนแปลงเป็นไปได้จริง\n\nข้อโต้แย้งของผมเริ่มจากที่ดิน ไม่ใช่เทคโนโลยี ที่ดินในเมืองที่มีโครงสร้างพื้นฐานพร้อมแล้วเป็นที่ต้องการ และถูกครอบครองอยู่ก่อนโดยโครงสร้างพื้นฐานทุนนิยมของอีกยุคหนึ่ง คือตึกแถว ราวสี่แสนหลัง จากที่เคยมีถึงเจ็ดแสนห้าหมื่นหลังในยุครุ่งเรือง ผมไม่ได้คัดค้านการพัฒนา ตึกแถวจำนวนมากเสื่อมสภาพและอันตรายจริง หลักการของผมคือต้องปกป้องคนก่อนปกป้องอาคารเสมอ\n\nแต่สำหรับหลังที่ยังอยู่ในสภาพดี ผมเสนอให้เริ่มจากเหตุผลทางเศรษฐศาสตร์ คาร์บอน และข้อกฎหมาย ก่อนเหตุผลเรื่องคุณค่าทางใจ ข้อค้นพบสำคัญคือ กฎระยะร่นทำให้หลายแปลงไม่สามารถสร้างอาคารใหม่บนผังเดิมได้ตามกฎหมาย การใช้ซ้ำจึงไม่ใช่ทางเลือกเชิงอุดมคติ แต่เป็นทางเลือกเดียวที่ถูกกฎหมาย และงานวิจัยไทยกว่าห้าสิบเจ็ดเล่มได้ตอบคำถามเหล่านี้ไว้แล้ว เพียงแต่ไม่เคยไปถึงห้องที่มีการตัดสินใจรื้อถอน\n\nสุดท้าย เทคโนโลยีที่กรุงเทพฯ ต้องการไม่ใช่ระบบใหม่ที่นำเข้ามา แต่คือการทำให้ระบบที่เมืองนี้สร้างขึ้นเองอยู่แล้ว—วินมอเตอร์ไซค์ รถเข็น ตลาดสด—มีที่ทางอย่างถูกต้อง วัดผลได้ และมีอาคารรองรับ",
  updated: "2026-08-14",
} as const;

export const ESSAY: Block[] = [
  {
    kind: "p",
    text: "We left our shophouse because it was too small. There were four of us and the woman who raised me, three floors above a shop in the old town, and by the early 1980s my parents had done the arithmetic that every Bangkok family of that decade eventually did. We moved to the suburbs. I remember the specific quality of what we left: noise at all hours, food on every corner, neighbours who were not a category but people whose names I knew. I do not want to romanticise it. The building was cramped and my mother was right about the arithmetic. But I have spent the forty years since watching that particular texture get thinner across the city, and I have come to think we are losing it for reasons that are not as good as our reasons for leaving.",
  },
  {
    kind: "p",
    text: "I work on smart cities. When people invite me to write something, they expect sensors, dashboards, digital twins — and I do build those, most of them running on a small server in my house because I do not trust anyone else with the data. This essay starts somewhere less interesting than technology. It starts with land.",
  },
  {
    kind: "p",
    text: "One thing first, because it determines how you should read everything after it. I am not a preservationist. I have no particular attachment to old things on the grounds that they are old, and I am not going to argue that Bangkok should be kept as it was for anyone's benefit, least of all a visitor's. I am closer to the opposite: I think technology can make this city safer, cleaner in its air and water, less lethal on its roads, less wasteful with its energy, and more economically viable for more people than it currently is, and I would like all of that to happen faster than it is happening.",
  },
  {
    kind: "p",
    text: "What I think we get wrong is the speed at which people can absorb a new environment. Humans do not adapt to a rebuilt city as quickly as a city can be rebuilt. We need remnants — enough of the familiar left standing to orient by, so that the new is legible as a change to something rather than a replacement of everything. Continuity is not nostalgia. It is the condition under which change is survivable. That is a futurist's argument for keeping things, not a conservationist's, and it produces different conclusions, as I hope to show.",
  },

  { kind: "h2", text: "The arithmetic that eats a street" },
  {
    kind: "p",
    text: "Cities became the engine of growth, so land inside cities became the asset. Not all land equally — land that already has infrastructure. A plot with a road, a sewer, a power line, a transit station within walking distance is worth many times a plot without, because someone already paid for the expensive part. In Bangkok, the land with infrastructure has an awkward feature: it is already occupied. It is occupied by the capitalist infrastructure of a previous era, which we call the shophouse — a shop on the ground floor, the shopkeeper's house stacked above it, which is exactly what the name says and one of the more honest names in architecture.",
  },
  {
    kind: "p",
    text: "There are roughly 400,000 of them left in Bangkok. There were something like 750,000 at the peak, during the boom of the 1960s and 70s. That is the number that should stop you: not how many exist, but the slope. We are a quarter of a million units into a demolition that nobody ever decided to carry out. It is simply what happens when each individual transaction makes sense on its own terms.",
  },
  { kind: "figure", id: "stock", caption: "Bangkok's shophouse stock, from Chatpong Chuenrudeemol's measured account. The slope, not the total." },
  {
    kind: "p",
    text: "There is a sharper version of that slope, and it comes from a thesis almost nobody has read. In 2010 a Chulalongkorn master's student named Quin Limp took the 1907 cadastral survey of Bangkok — a 1:1,000 map made to issue land title deeds, which is why it records individual buildings — and counted every shophouse in Samphanthawong district. There were 2,430. He reconstructed sixteen original design types from them, including a run of 63 identical units across Songsawat, Charoen Krung and Yaowarat. Then he counted what was left. Around 310. One district, one century, roughly 87% gone.",
  },
  {
    kind: "p",
    text: "And each transaction does make sense. If you hold a plot on a main road with a three-storey building on it, and the zoning and the market will support thirty storeys, the difference between three and thirty is the return. Clearing the low-rise is the shortest path to it. For a long time we called this progress, and for a long time it was: the city needed density, needed offices, needed hotel rooms, needed the tax base. Nobody was wrong.",
  },
  {
    kind: "p",
    text: "It is worth saying what this type actually was before we discuss what to do with it, because the history is not decoration. Charoen Krung was cut in 1862 because the foreign consuls petitioned the King that they were falling ill with nowhere to ride, and masonry rows followed along it. Rama V drew the line of Song Wat himself in 1892, and ordered Yaowarat through the 1890s, and the Privy Purse built and leased rows to merchant tenants — which means the shophouse was, for a while, an instrument of royal property income. Siam Cement was founded in 1913 and the frame went from load-bearing wall to concrete skeleton somewhere in the decades after. By the 1960s more than half of everything built in Thai cities was shophouses, and by the mid-1970s about seventy per cent of Bangkok lived in one.",
  },
  { kind: "figure", id: "timeline", caption: "How the type developed — and where the scholarship has a hole in it." },
  {
    kind: "p",
    text: "Then at some point people begin to notice that something is no longer the same. The original residents have moved out, because they sold or because they were priced out. Franchises come in, because a franchise can pay rent that a family shop cannot. Prices rise. And the street ends up with a retailscape you could find in any city on earth — the same coffee chain, the same convenience store, the same phone shop, arranged in the same order. Sterile is the word people reach for. I think the more precise word is generic.",
  },
  {
    kind: "figure",
    id: "sukhumvit-pattern",
    caption: "The same street, four times. Each Sukhumvit cross-road that got redeveloped lost its shophouses first.",
  },
  {
    kind: "p",
    text: "You can watch this happen along a single avenue. Sukhumvit 26 became Phrom Phong and its shopping. Sukhumvit 55 became Thonglor. Sukhumvit 63 became Ekkamai and its nightlife. In each case the shophouses went first, and in each case what arrived was more valuable per square metre and less distinguishable from anywhere else. Sukhumvit 71 — Pridi Banomyong — is one of the few that still has its stock, still occupied, still hybrid. It has a Burmese community at the southern end that turned an old theatre block into a fresh market and food stalls. It has massage parlours and karaoke bars and new coffee places in the middle. It has furniture-factory-hardware-shop-motorcycle-garage hybrids at the north. It also has a BTS station and a developer's spreadsheet with its name on it. That is why the studio picked it.",
  },

  { kind: "h2", text: "The concession I have to make first" },
  {
    kind: "p",
    text: "This is not a paper against building things. I want to concede the strongest version of the other argument before I make mine, because an argument that cannot survive its own counter-example is not worth publishing.",
  },
  {
    kind: "p",
    text: "A great many shophouses should come down. They were built cheaply and fast by settlers who needed a shop and a bed, not by anyone designing for a sixty-five-year service life. Some were built for perhaps that long and have been used harder than that. Reinforced concrete built to 1960s practice, in a hot wet climate, with decades of informal modification cut through it — some of these buildings are genuinely dangerous, and the people living inside them are the ones in danger.",
  },
  {
    kind: "pull",
    text: "Never preserve a heritage building at the expense of the humans inside it. If the structure is unsafe, you protect the people first and you argue about the architecture afterwards.",
  },
  {
    kind: "p",
    text: "I learned that rule the expensive way. I spent more than a decade studying Shanghai, and my doctoral work was on the lilong — the lane housing that the city spent the 1990s and 2000s deciding what to do with. The preservation movement there produced real victories and at least one recurring failure, which was the building saved while the family inside it kept living without a private toilet, because the listing protected the fabric and said nothing about the person. Do not do that. A building is a means.",
  },

  { kind: "h2", text: "So: the ones that are fine" },
  {
    kind: "p",
    text: "Set aside the dangerous ones. What about the shophouses in decent structural condition, on good land, that are coming down anyway because the arithmetic says so? This is where I want to be careful, because there is a version of this essay that is sentimental and I do not want to write it.",
  },
  {
    kind: "p",
    text: "The usual defence of these buildings is the sense of place. I believe in the sense of place. I also know it does not fly alone in a room with a developer, and I would rather win the argument than be right in a way that changes nothing. So let me start with money and carbon and come back to feeling later.",
  },
  {
    kind: "p",
    text: "Although before either — there is a legal fact I did not know until I went reading, and it is the strangest and strongest thing in this essay. On a great many shophouse plots, you are not allowed to rebuild what you tear down. Setback rules require a building over two storeys to stand six metres back from the centreline of a road narrower than ten metres. An old shophouse already occupies its entire plot, right up to the pavement, because it was built before that rule existed. Demolish it and the replacement has to step back — onto land that, on a twelve-metre-deep plot, is most of the site. So for a whole class of buildings, reuse is not the sentimental option and not even the economical one. It is the only lawful thing you can do with the plot, and the alternative is to hold an empty lot.",
  },
  {
    kind: "pull",
    text: "Reuse is not the sentimental option on these plots. It is the only lawful one, and most owners do not know it.",
  },
  {
    kind: "p",
    text: "Every time we tear something down and build something new, we spend carbon. Not operational carbon — the electricity the building will use, which everyone now measures — but the carbon already spent making the thing that exists, thrown away, plus the carbon of demolishing it, plus the carbon of making its replacement. The industry calls this embodied carbon and has only recently started taking it seriously.",
  },
  {
    kind: "p",
    text: "The number that matters most is where embodied carbon sits inside a building. Roughly 55% of it is in the substructure and superstructure — the foundations and the frame. That is the part a retrofit keeps and a demolition throws in a truck. So before any argument about character or community, a reuse project starts with more than half the carbon already banked, and a demolition starts by writing it off and then spending again.",
  },
  { kind: "figure", id: "carbon", caption: "Demolish-and-rebuild against retrofit, at the measured dimensions of a Sukhumvit 71 shophouse. Every coefficient shows its source and its system boundary." },
  {
    kind: "p",
    text: "The classic study here is The Greenest Building, from the Preservation Green Lab in 2011. It compared reuse against new construction across six building types and four American cities on a seventy-five-year horizon, and found that it takes between ten and eighty years for a new energy-efficient building to overcome, through better performance, the climate impact of its own construction. For most types and climates, twenty to thirty years. If your city has a 2050 target, a building you demolish in 2026 and replace with something efficient may not break even until after the target has passed.",
  },
  {
    kind: "p",
    text: "That same study also found a case where reuse lost. A warehouse converted to apartments performed worse than a comparable new building, because the conversion was materially heavy — they replaced so much that they spent more than they saved. I include this because it is the boundary of my own argument and I would rather draw it myself. Reuse is not automatically greener. A retrofit that guts a building to its frame and then rebuilds everything inside it in aluminium and glass is a demolition with better manners.",
  },

  { kind: "h2", text: "What I actually cannot tell you" },
  {
    kind: "p",
    text: "Here is where I have to be honest about the state of the evidence, because I went looking for it and it is not there.",
  },
  {
    kind: "p",
    text: "There is no embodied-carbon study of the Bangkok shophouse. None. There is good Thai work on standard low-rise houses, and a life-cycle assessment of one Thai high-rise using national emission factors, and neither is a shophouse. Every coefficient in the model on this page is imported from British or American benchmarks. Concrete is concrete and the direction of the answer is not in doubt, but Thai cement, Thai construction practice and the Thai grid are all different, and anyone who tells you they know the Bangkok number to two significant figures is guessing.",
  },
  {
    kind: "p",
    text: "It is worse than that. There is no institutional benchmark anywhere for whole-building deep retrofit. The GLA, RICS, RIBA and LETI all publish new-build benchmarks; none publishes the retrofit equivalent. Which means every reuse-versus-rebuild comparison in circulation, including mine, has a well-measured demolition side and an estimated reuse side. That asymmetry quietly favours knocking things down, in every assessment that does not say so out loud.",
  },
  {
    kind: "pull",
    text: "The most useful thing anyone could fund off the back of this studio is not another render. It is a life-cycle assessment of one ordinary Bangkok shophouse.",
  },
  {
    kind: "p",
    text: "On cost the evidence openly contradicts itself. Gensler, from more than 1,300 office-to-residential assessments, puts conversion around 30% cheaper than new construction. CBRE, the following year, puts conversion at 250 to 650 US dollars a square foot against roughly 320 for new office — often more expensive. Both are shown on this page because the honest answer is that it depends on the building, and a consultancy that pretends otherwise is selling something.",
  },

  { kind: "h2", text: "The research is already done" },
  {
    kind: "p",
    text: "That is the gap on carbon. On almost everything else, the opposite is true, and it is the more annoying problem.",
  },
  {
    kind: "p",
    text: "There are at least fifty-seven graduate theses on Bangkok shophouses and historic districts sitting in the repositories of Chulalongkorn, Silpakorn, Thammasat, KMUTT, and half a dozen universities abroad. People have surveyed the stock, measured the units, interviewed the owners, mapped the 1907 cadastre, costed the renovations, and traced the legal obstacles in detail. Master's students have been solving this problem, one district at a time, for forty years.",
  },
  {
    kind: "p",
    text: "None of it reaches the room where a demolition is decided. It is in Thai, behind a repository login, in a PDF with a broken link, indexed under a title nobody would search for. I read four of them properly for this essay and each one contained something I would have otherwise had to guess at — the 87% loss in Samphanthawong, the stair as a measured cause of vacancy rather than an aesthetic complaint, the setback rule that makes rebuilding illegal, the survey finding that owners will hold a building empty for years rather than let it below their price.",
  },
  { kind: "figure", id: "research", caption: "Fifty-seven theses, catalogued. Four read in full for this essay. The rest are waiting." },
  {
    kind: "p",
    text: "I have put the whole bibliography on this site with every working link I could find, because the cheapest research contribution available to this studio is not new fieldwork. It is reading what is already on the shelf and telling somebody.",
  },

  { kind: "h2", text: "Four things Shanghai taught me" },
  {
    kind: "p",
    text: "A word about why I am the one saying this. Chatpong made his students bring a case study from their own city before they were allowed an opinion about Bangkok, which I think is the single best decision in the whole studio. I should hold myself to it. I was born in Bangkok and grew up in it; I then spent a decade in Cambridge, Massachusetts, taking degrees and working at MIT and Harvard. So Bangkok is not my case study, it is my city. My case study is Shanghai, where I spent years on the lilong — the lane housing — and specifically on gentrification, as an anthropologist rather than an architect.",
  },
  {
    kind: "p",
    text: "What I found there does not sit comfortably on either side of the usual argument. Gentrification is not one process with one villain. It is several things happening at once — some of them genuinely bad, some of them straightforwardly good for people who had nothing, and some of them simply the price of a neighbourhood becoming somewhere people want to be. The romantic left-wing reading, that any change to a poor neighbourhood is a theft from its residents, did not survive my fieldwork. Neither did the developer's reading. What I watched was more specific: the government picked which structures were worthy of preservation, which quietly made every unworthy structure available for immediate bulldozing, and the residents of the worthy ones went on living exactly as badly as before, because the renovation had gone into the façade.",
  },
  {
    kind: "pull",
    text: "Affordability is a by-product of diversity, an ingredient in almost all great cities. It is not something you can protect by freezing a place.",
  },
  {
    kind: "p",
    text: "I should say plainly that I am not a Jane Jacobs partisan, and I think her influence has done real damage to how we argue about cities. The move she legitimised — a neighbourhood declaring itself finished and defending its own texture against newcomers — turns out to be indistinguishable from ordinary property protectionism once it is in the hands of people who already own the block. Ed Glaeser is right about this. The economic case for diversity is not preserving Greenwich Village for whoever bought in before it got expensive. It is housing more people, close to work, in a city that needs their labour and owes them a place to live. Anyone who cites Jacobs at me while opposing the housing that would let a delivery rider live within an hour of his job is not making an argument about cities. He is making an argument about his own street.",
  },
  {
    kind: "p",
    text: "So when I say keep the shophouses, understand what I am not saying. I am not saying freeze Sukhumvit 71. I am saying that these buildings are, right now, several hundred thousand units of housing and workspace sitting on serviced land next to transit, and that the fastest way to get more people living well in this city is to make them usable again — not to spend twenty years replacing them with a smaller number of more expensive units and calling the difference progress.",
  },
  {
    kind: "p",
    text: "If reuse is the right answer, the question becomes how, and this is where the Shanghai years are worth something. Four rules, in the order I would apply them.",
  },
  {
    kind: "p",
    text: "First, preserve in groups, never one at a time. A single saved building surrounded by towers is a specimen. The thing worth keeping is not the object, it is the connectedness — the fact that the people in it have known each other for thirty years and that this is legible in how the street works. Save a block and you keep a social fabric. Save one façade and you keep a photograph.",
  },
  {
    kind: "p",
    text: "Second, protect the people before the building. Already said. It is the rule I would enforce hardest.",
  },
  {
    kind: "p",
    text: "Third, bring new functions in, but learn from the old one before you do. These buildings worked for decades without air conditioning: high ceilings, cross ventilation, a light well, a deep plan that stays cool at the back. If your renovation makes the building dependent on mechanical cooling, you have taken a low-energy structure and given it a permanent bill. And there is a specific move available here that we keep missing — the house part of the shophouse is still a house. Staff could live above the shop they work in, which is what the typology was invented for, and which would take a commute off the road and a rent burden off a working household in the same gesture.",
  },
  {
    kind: "p",
    text: "Fourth, and this is the one people find counterintuitive: do not keep the façade and fill it with luxury retail. My objection is not ideological. It is that there is not enough demand. Scarce heritage frontage attracts expensive products because expensive products need to borrow authenticity, and in China nearly every repurposed building ends up housing whatever can pay the rent, which is luxury. Then the whole district is luxury, and a district of luxury has one kind of person in it at one time of day. A shophouse that draws people in — ideally around the clock, ideally people who live nearby — is worth more to the street and, over a long enough lease, worth more to the owner.",
  },

  { kind: "h2", text: "The elephant" },
  {
    kind: "p",
    text: "I have to name the thing everyone in Bangkok is thinking about, because pretending otherwise would make this essay useless.",
  },
  {
    kind: "p",
    text: "Xintiandi in Shanghai — Benjamin Wood's project, which I researched for years — took a lilong block, kept the shells, and made a high-end dining and retail district. It was enormously successful and it set the template for two decades of Chinese heritage-led development. Bangkok now has its own version at Woeng Nakhon Kasem, where a developer bought the old town block and rebuilt it. I want to be fair about this: it is better than a tower. The height limit near the Grand Palace meant they could not have gone tall anyway, but they could have built something sealed and inward-facing, and they did not. It is small-grained and it faces the street.",
  },
  {
    kind: "p",
    text: "My question is not whether it should exist. My question is how many a city can have. Because the value of that model comes entirely from its scarcity — it is an experience, and an experience has to be unusual. One of them in a city is a destination. Three is a theme. Five and you have Disneyland: a fantasy, priced for people who can afford the ticket, populated by characters they were sold in advance. How many Disneylands can a city support? One. Perhaps.",
  },
  {
    kind: "p",
    text: "So if there are 400,000 shophouses and the Xintiandi model can absorb, generously, a few blocks, then the model is not the answer to the problem. It is the answer to a much smaller problem that happens to be very profitable. The remaining 399,000 need something else, and that something else has to work at ordinary rents, for ordinary businesses, without a masterplan.",
  },

  { kind: "h2", text: "What the students found" },
  {
    kind: "p",
    text: "Which brings me to the studio, and to why I think this particular group of drawings matters more than its author probably intends.",
  },
  {
    kind: "p",
    text: "Chatpong sent twelve students to Sukhumvit 71 and did something I would not have thought to do. He did not fly them in to be experts in three days. He made them first document a local best practice from their own city — Fuzhou, Qingdao, Chengdu, Chaoshan — and only then look at Bangkok. The effect is that the Bangkok observation arrives through a comparison rather than through a fresh pair of astonished eyes, and astonished eyes are shallow. Anyone who has watched a foreign consultant discover street food knows exactly how shallow.",
  },
  { kind: "figure", id: "projects", caption: "Five of the nine projects, as documented in the studio's draft. Each takes one system the city runs on and gives it a building." },
  {
    kind: "p",
    text: "What came back is a set of proposals that all share a structure, and I do not think the students coordinated it. Each one takes a system Bangkok already runs on, which currently has no address, and gives it a building. Win motorcycle taxis, which have no base, get a ramp and a place to sleep. The fresh market that a convenience store replaced gets its ground floor back, at three hundred stalls, on a structural grid that turns out to be the same four metres as the market it replaces. Street food gets a serviced wall with water and drainage and power, bookable by the slot. Nightlife gets a buffer strip that is a hairdresser at noon and a bar at midnight, so the street stops dying for twelve hours a day. Ritual gets a canopy and a calendar.",
  },
  {
    kind: "p",
    text: "None of these are technology projects. All of them are infrastructure projects for systems that already exist and are not recognised as infrastructure. And that is the observation I want to build the rest of this essay on.",
  },

  { kind: "h2", text: "The smart city we already have" },
  {
    kind: "p",
    text: "Here is my actual position, and it is not the one people invite me to give.",
  },
  {
    kind: "pull",
    text: "Bangkok does not have a smart city deficit. It has a legitimacy deficit. The systems are running. They are simply not written down, not measured, and not permitted.",
  },
  {
    kind: "p",
    text: "Consider what the win motorcycle network actually is. It is a demand-responsive, last-mile transit system, with a distributed rank structure, community-negotiated pricing, and a labour pool that self-organises by neighbourhood. It emerged in the 1980s because the sois run a kilometre deep off the main roads and nothing else would serve them, and because women walking home late were being robbed and the neighbours with motorbikes started giving lifts. Any transit authority on earth would be proud of having designed it. Nobody designed it. It has no allocated space, no shelter, no formal recognition, and it grosses millions of baht a year while parking illegally on the corner it serves.",
  },
  {
    kind: "p",
    text: "Street food is the same story. It is a distributed food-security system that feeds the working population of a metropolis at a price no formal restaurant sector could match, and it began on boats — vendors paddling between houses when the canals were the streets. When Bangkok filled the canals in and turned to face the road, the vendors moved onto the pavement, which is where they still are, without electricity, water, waste collection, or a legal place to put a cart when they finish at two in the morning.",
  },
  {
    kind: "p",
    text: "A smart city, as it is usually sold, would install sensors to measure the congestion these vendors cause. I am proposing the opposite: that the technology's job is to give these systems the status the city has been withholding, and that this is both cheaper and more useful than anything in the standard catalogue.",
  },

  { kind: "h2", text: "What that looks like when you build it" },
  {
    kind: "p",
    text: "I should show my work rather than assert this, so here is what I have been doing for the last six months, which is going rogue.",
  },
  {
    kind: "p",
    text: "I built a national flood monitoring system. Looking at the historical procurement record, a system of that specification would have gone out to tender at somewhere between ten and twenty million baht and arrived, optimistically, after the water had come and gone four times. I built it in about two weeks. It ingests around two million data points, runs longitudinal analysis of how floods actually propagate, and seven municipalities have asked what it costs. It costs nothing. It runs on a server in my house, which occasionally goes down because my mother thinks I am using too much data.",
  },
  {
    kind: "p",
    text: "I built another one to help my mother find a massage therapist, which sounds trivial and turned out not to be. It gathered eighty-six thousand records in thirty-eight hours and classified them, and once mapped against public-health data it showed a geography that nobody had drawn — where a particular kind of establishment clusters, and where that clustering coincides with HIV prevalence. I did not go looking for that. The system found it because the data had never been put on one map before.",
  },
  {
    kind: "p",
    text: "The part that matters for this essay is what happened next. Turning that system from one that maps massage parlours into one that maps and matches motorcycle-taxi supply and demand is roughly seven lines of code. The hard part was never the technology. The hard part was two weeks of looking at what came back and fixing how the data was collected, which is a discipline problem, not an engineering one.",
  },
  {
    kind: "p",
    text: "So when someone asks what a bottom-up smart city would cost, my answer is that the cost is not the obstacle and never was. A system that legitimises the win network — that lets a rider register, that publishes where the ranks are, that gives a neighbourhood a way to see its own service level — is a fortnight of work and a laptop. What has been missing is not capability. It is the decision that these systems are worth building for.",
  },

  { kind: "h2", text: "Three systems I would build for the shophouse" },
  {
    kind: "p",
    text: "For this particular building type, three things are missing, and none of them is hard.",
  },
  {
    kind: "p",
    text: "The first is a register. Nobody knows where Bangkok's shophouses are. There is no layer, no count, no condition survey — a 400,000-unit asset class with no inventory. The map on this page is a first attempt: every building along Sukhumvit 71 screened by geometry for the shophouse signature, a narrow frontage and a deep plan repeating along a street. It found 2,193 candidates in the study area, 683 of them within 120 metres of the road itself. The median candidate has a 4.5-metre frontage and a 12.6-metre depth, which lands within a decimetre of what the students measured by hand. That is not proof any individual building is a shophouse. It is proof that the population can be found at city scale, by anyone, from open data, in an afternoon.",
  },
  { kind: "figure", id: "corridor", caption: "Sukhumvit 71, screened. Candidate shophouse footprints from open building data — geometry only, unverified, and the point is that this took an afternoon." },
  {
    kind: "p",
    text: "The second is tenure. Chatpong's collaborator asked me a question I have not stopped thinking about: could you see which shophouses are occupied, which are for sale, which are for rent — from both ends, so a developer can find stock and a family can find a home? That system does not exist and I cannot build it from open data, because tenure is not published anywhere. What I can do is build the frame and leave the fields visibly empty, which is what I have done here. An empty field with a known shape is a specification. It tells you exactly what survey to commission.",
  },
  { kind: "figure", id: "tenure", caption: "The tenure question, as a schema with nothing in it. Every field is real; no field has data. This is a specification, not a product." },
  {
    kind: "p",
    text: "The third is the one that would actually unlock reuse, and it came out of the same conversation. The obstacle to adapting a shophouse is not space, it is circulation. The stair is at the front, on the ground floor, so whoever rents the shop controls access to everything above it. Rent the ground floor to a coffee chain and you have land-locked three floors. Solve vertical circulation and you can let a building in pieces: this floor to a workshop, that floor to a family, the roof to something at night.",
  },
  {
    kind: "p",
    text: "I assumed this was an architect's observation until I read the research, and it turns out to be a measured cause. Nabila Imam's 2021 study of forty shophouse owners lists the placement of the stair among the root causes of upper-floor vacancy — tenants will not take the upper floors because the stair runs through the middle of the building and there is no separate way up. One owner's answer, recorded verbatim in her appendix, is simply: no stairs outside. Attachai Luangamornlert reached the same conclusion from the drawings six years earlier, identifying the staircase as the fixed element that governs everything a shophouse can become.",
  },
  {
    kind: "p",
    text: "And here the law closes the circle in a way that would be funny if it were not so expensive. Ministerial Regulation No. 11 defines the removal of a reinforced-concrete stair as a demolition, not a modification. The one change that would unlock the upper floors of several hundred thousand buildings is legally classified as knocking the building down, which triggers full compliance with current code, which the building cannot meet, because it is old. So the stair stays, the upper floors stay dark, and eventually somebody decides the whole thing is urban trash.",
  },
  {
    kind: "p",
    text: "It is a solvable geometry problem — there are a limited number of stair configurations for a four-metre bay, and generating the viable ones for a specific building is exactly the sort of thing worth pointing a machine at. Nobody wants to sit and think about stairs. But the binding constraint is not the geometry. It is a definition in a 1985 regulation, and Thailand has already shown it knows how to write the exception: a 2016 ministerial regulation let existing buildings become small hotels under relaxed standards, grandfathering setbacks and parking to the rules in force when the building was first permitted. It worked. It was extended three times. It appears to have been allowed to lapse.",
  },

  { kind: "h2", text: "Reuse for what, exactly" },
  {
    kind: "p",
    text: "Everything above is an argument that these buildings should stay. It is not yet an argument for what goes in them, and a preservation case with no programme behind it is how you end up with the luxury-retail outcome by default. So let me answer it with the thing I actually do all day.",
  },
  {
    kind: "p",
    text: "I built every system described in this essay on a laptop. Not in an office and not in a lab — carried to a place, opened, worked from. There are thousands of people doing this in Bangkok right now, and the number is climbing steeply, because the tools got cheap enough that a person with an idea and a rented model can build something that would have needed a funded team five years ago. This is a real and growing economy and it has an unusual property: it is almost entirely indifferent to floor plate, prestige and column grid, and almost entirely dependent on where it feels good to sit for nine hours.",
  },
  {
    kind: "p",
    text: "Which turns out to be the inner city. Not the business district — the inner city, the mildly chaotic part, the part that is dense and mixed and loud and has four kinds of food within sixty seconds of the door. Sensory richness is not a lifestyle preference for this kind of work; it is an input. And the shophouse is almost comically well-suited to supplying it: a small floor plate that suits a team of three, a shop below that keeps the street alive, a house above that someone can actually live in, and a door onto a pavement where things are happening. A tower cannot manufacture that, and the several hundred thousand units of it that already exist are currently being valued at the price of the dirt beneath them.",
  },
  {
    kind: "pull",
    text: "The most valuable thing a shophouse has is the one thing no new building can be given: a street outside that is already interesting.",
  },
  {
    kind: "p",
    text: "That is one programme. There are others, and the studio found several — a fresh market where a convenience store won, a base for the riders who have none, a vocational school for skills that currently have no classroom, day-and-night use of the same room so a street stops dying at noon. The point is not that I have picked the right one. It is that the question 'reuse for what?' has more good answers than anyone is currently pricing, and that the developer's default answer — clear it, build luxury — is the one that satisfies the fewest of them.",
  },

  { kind: "h2", text: "Why this is a business, not a charity" },
  {
    kind: "p",
    text: "A word for the sponsor, since this studio has one and I would rather address that directly than pretend a research book is disinterested.",
  },
  {
    kind: "p",
    text: "Southeast Asia is where the interesting urban problems are, and Bangkok is the best laboratory in it. Not because it is the richest or the best governed — it is neither. Because it is unusually safe, unusually open, and unusually tolerant. It is a city where being gay or trans is ordinary, where every religion has its building and they are within a kilometre of each other, where tourists and residents use the same streets, and where a new kind of business can start without asking permission first. Those conditions are not decoration. They are why bottom-up systems can emerge here and cannot emerge in cities that are stricter, and they are the reason the research is worth doing in this city rather than a tidier one.",
  },
  {
    kind: "p",
    text: "And the commercial logic is straightforward. There are 400,000 units of infrastructure-rich, transit-adjacent, structurally-serviceable floor area whose owners currently believe it is worth only what the land under it is worth. If reuse can be made cheap and legible enough to beat demolition on an ordinary spreadsheet, that stock is not urban trash. It is the largest under-priced asset class in the city, and the first firm to build the tools to assess it at scale will be the firm that everyone else has to hire.",
  },
  {
    kind: "p",
    text: "That is the opportunity. It is not a preservation argument dressed up in commercial language. It is a commercial argument that happens to preserve things.",
  },

  { kind: "h2", text: "What I still walk to" },
  {
    kind: "p",
    text: "I go back to the old town most weeks. Temples to food stalls to cafés to bookshops, the same loop, which after four decades is less research than habit.",
  },
  {
    kind: "p",
    text: "It has changed. It is quieter than the street I grew up on. There is less food on the pavement and fewer people who have been there forever, partly because of regulation and partly because the people themselves changed. Gentrified is the available word and it is roughly accurate. But it is still there, and it is still working, and I would argue — without being able to prove it, which I should admit — that the old town of Bangkok is the most alive old town in the world. It has never been given World Heritage status. I have come to think that is part of why. Nobody ever froze it. It was never worth enough to anyone to stop it from continuing to be a place where people live and sell things and argue about the price of fish.",
  },
  {
    kind: "p",
    text: "The shophouse is the same proposition at the scale of one building. It was never precious. It was built cheap and fast for people who needed a shop and a bed, it was modified by everyone who ever lived in it, and the modifications are the evidence that it worked. Chatpong calls these buildings bastards, and the affection in that is doing real work: a bastard has no pedigree, no lineage anyone recorded, and turns out to be more inventive than the legitimate children.",
  },
  {
    kind: "p",
    text: "I do not know how many we will keep. I know the number is falling and that nobody has decided it should. And I have noticed that every time I explain the win motorcycle system to someone from a city that does not have one, they are impressed — genuinely, not politely — and then they ask who runs it, and I have to say that nobody does, and that officially it is not there at all.",
  },
  {
    kind: "p",
    text: "That is the gap I would like us to close. Not by building something clever on top of the city. By writing down what the city already built, and admitting that it counts.",
  },
];
