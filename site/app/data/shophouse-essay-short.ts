// The book version — the essay cut to length for Shophouse Metropolis.
//
// Not a mechanical abridgement of the long version. The argument is the same
// and the evidence is the same, but it is written again at the length a
// printed chapter can carry: one concession, one legal discovery, one carbon
// case, four rules, one elephant, the studio, and the turn. Roughly 3,800
// words against the site version's 7,000.
//
// Rendered at /shophouses/print and exported to PDF from there.

export type ShortBlock =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "pull"; text: string };

export const SHORT_META = {
  title: "Bangkok Doesn't Need a Smart City",
  subtitle: "It needs to legitimise the one it already built.",
  byline: "Non Arkara",
  context:
    "The third essay in Shophouse Metropolis (Harvard University Graduate School of Design), following Chatpong Chuenrudeemol's title essay and Bangkok Bastards.",
  note:
    "An extended version, with an interactive survey of the Sukhumvit 71 corridor, a sourced reuse-versus-demolition carbon model and a catalogue of 57 theses, is at shophouses.nonarkara.org",
  updated: "2026-08-14",
} as const;

export const SHORT: ShortBlock[] = [
  {
    kind: "p",
    text: "We left our shophouse because it was too small. There were four of us and the woman who raised me, three floors above a shop in the old town, and by the early 1980s my parents had done the arithmetic that every Bangkok family of that decade eventually did. We moved to the suburbs. I remember the specific quality of what we left: noise at all hours, food on every corner, neighbours who were not a category but people whose names I knew. The building was cramped and my mother was right about the arithmetic. But I have spent the forty years since watching that texture get thinner across the city, and I have come to think we are losing it for reasons that are not as good as our reasons for leaving.",
  },
  {
    kind: "p",
    text: "I work on smart cities, so when people invite me to write something they expect sensors and dashboards. This essay starts with land instead. And it starts with a disclosure that determines how the rest should be read: I am not a preservationist. I have no attachment to old things on the grounds that they are old. I think technology can make this city safer, cleaner in its air and water, less lethal on its roads and more economically viable for more people than it currently is, and I want all of that faster than it is arriving.",
  },
  {
    kind: "p",
    text: "What I think we get wrong is the speed at which people absorb a new environment. Humans do not adapt to a rebuilt city as quickly as a city can be rebuilt. We need remnants — enough of the familiar left standing to orient by, so that the new reads as a change to something rather than a replacement of everything. Continuity is not nostalgia. It is the condition under which change is survivable. That is a futurist's argument for keeping things, and it produces different conclusions from a conservationist's.",
  },

  { kind: "h2", text: "The arithmetic that eats a street" },
  {
    kind: "p",
    text: "Cities became the engine of growth, so land inside cities became the asset — and not all land equally. Land that already has a road, a sewer, a power line and a station within walking distance is worth many times land without, because somebody already paid for the expensive part. In Bangkok that land has an awkward feature: it is occupied. It is occupied by the capitalist infrastructure of a previous era, which we call the shophouse — a shop below, the shopkeeper's house above, one of the more honest names in architecture.",
  },
  {
    kind: "p",
    text: "There are roughly 400,000 left. There were about 750,000 at the peak in the 1960s and 70s, when more than half of everything built in Thai cities was shophouses and some seventy per cent of Bangkok lived in one. The number that should stop you is not the total but the slope: we are a quarter of a million units into a demolition nobody ever decided to carry out.",
  },
  {
    kind: "p",
    text: "There is a sharper version of that slope in a thesis almost nobody has read. In 2010 a Chulalongkorn master's student, Quin Limp, took the 1907 cadastral survey of Bangkok — a 1:1,000 map made to issue land title deeds, which is why it records individual buildings — and counted every shophouse in Samphanthawong. There were 2,430, in sixteen reconstructable design types, including a run of 63 identical units across Songsawat, Charoen Krung and Yaowarat. Then he counted what survived. Around 310. One district, one century, roughly 87 per cent gone.",
  },
  {
    kind: "p",
    text: "Each transaction that produced that number made sense on its own terms. If you hold a plot on a main road with three storeys on it and the market will support thirty, the difference is the return, and clearing the low-rise is the shortest path to it. For a long time we called this progress and for a long time it was. Then at some point people notice that something has changed: the original residents have gone, franchises have arrived because a franchise can pay rent a family shop cannot, and the street has a retailscape you could find in any city on earth. Sterile is the word people reach for. The more precise word is generic.",
  },
  {
    kind: "p",
    text: "You can watch it happen along one avenue. Sukhumvit 26 became Phrom Phong. Sukhumvit 55 became Thonglor. Sukhumvit 63 became Ekkamai. In each case the shophouses went first and what replaced them was worth more per square metre and less distinguishable from anywhere else. Sukhumvit 71 still has its stock, still occupied, still hybrid — a Burmese community that turned an old theatre block into a fresh market at the southern end, massage parlours and coffee places through the middle, furniture-and-motorcycle-garage hybrids at the north. It also has a station and a developer's spreadsheet with its name on it. That is why the studio picked it.",
  },

  { kind: "h2", text: "The concession, and the discovery" },
  {
    kind: "p",
    text: "This is not an argument against building. Let me concede the strongest version of the other case first, because an argument that cannot survive its own counter-example is not worth publishing.",
  },
  {
    kind: "p",
    text: "A great many shophouses should come down. They were built cheaply and fast by settlers who needed a shop and a bed, not by anyone designing for a long service life, and some of them have been used harder than they were built for. Reinforced concrete of 1960s practice, in a hot wet climate, cut through by decades of informal modification — some of these buildings are dangerous, and the people inside them are the ones in danger. My rule, learned expensively in Shanghai, is that you never preserve a building at the expense of the humans living in it. If the structure is unsafe you protect the people first and argue about the architecture afterwards.",
  },
  {
    kind: "p",
    text: "Set those aside. What about the ones in decent condition, on good land, coming down anyway because the arithmetic says so? Here I want to be careful, because there is a sentimental version of this essay and I do not want to write it. The usual defence is the sense of place. I believe in the sense of place; I also know it does not fly alone in a room with a developer, and I would rather win than be right in a way that changes nothing.",
  },
  {
    kind: "p",
    text: "So before any of that — a legal fact I did not know until I went reading, and the strangest thing in this essay. On a great many shophouse plots you are not permitted to rebuild what you tear down. Setback rules require a building over two storeys to stand six metres back from the centreline of a road narrower than ten metres. An old shophouse occupies its entire plot, right up to the pavement, because it was built before that rule existed. Demolish it and the replacement must step back — onto land that, on a twelve-metre-deep plot, is most of the site.",
  },
  {
    kind: "pull",
    text: "Reuse is not the sentimental option on these plots. It is the only lawful one, and most owners do not know it.",
  },

  { kind: "h2", text: "The carbon case, and what we cannot say" },
  {
    kind: "p",
    text: "Every demolition spends carbon twice: the carbon already embodied in the building, thrown away, and the carbon of making its replacement. Roughly 55 per cent of a building's embodied carbon sits in its substructure and superstructure — the foundations and frame, the part a retrofit keeps and a demolition puts in a truck. So a reuse project starts with more than half the carbon already banked, before anyone mentions character.",
  },
  {
    kind: "p",
    text: "The classic study is The Greenest Building, from the Preservation Green Lab in 2011. Across six building types and four cities on a seventy-five-year horizon, it found that a new energy-efficient building takes between ten and eighty years to overcome, through better performance, the climate impact of its own construction — for most types and climates, twenty to thirty. If your city has a 2050 target, a building you demolish in 2026 may not break even until after the target has passed. That same study also found a case where reuse lost: a warehouse-to-apartment conversion that replaced so much it spent more than it saved. I include it because it is the boundary of my own argument. A retrofit that guts a building to its frame and rebuilds everything in aluminium and glass is a demolition with better manners.",
  },
  {
    kind: "p",
    text: "Now the honest part. There is no embodied-carbon study of the Bangkok shophouse. None. Thai work covers standard low-rise houses and one high-rise; neither is a shophouse. Every coefficient I can offer is imported from British or American benchmarks, and while concrete is concrete and the direction is not in doubt, Thai cement and Thai practice and the Thai grid are all different. Worse, there is no institutional benchmark anywhere for whole-building deep retrofit — the GLA, RICS, RIBA and LETI all publish new-build numbers and none publishes the reuse equivalent. Which means every comparison in circulation, including mine, has a well-measured demolition side and an estimated reuse side, and that asymmetry quietly favours knocking things down.",
  },
  {
    kind: "pull",
    text: "The most useful thing anyone could fund off the back of this studio is not another render. It is a life-cycle assessment of one ordinary Bangkok shophouse.",
  },
  {
    kind: "p",
    text: "On the other hand, a great deal of research does exist and is simply unread. There are at least fifty-seven graduate theses on Bangkok shophouses and historic districts in the repositories of Chulalongkorn, Silpakorn, Thammasat, KMUTT and universities abroad. People have surveyed the stock, measured the units, interviewed the owners, mapped the 1907 cadastre and traced the legal obstacles in detail. Master's students have been solving this problem, one district at a time, for forty years, and none of it reaches the room where a demolition is decided. I read four properly for this essay and each contained something I would otherwise have guessed at.",
  },

  { kind: "h2", text: "Four things Shanghai taught me" },
  {
    kind: "p",
    text: "Chatpong made his students bring a case study from their own city before they were allowed an opinion about Bangkok, which I think is the best decision in the studio. I should hold myself to it. I was born in Bangkok and grew up here; I then spent a decade in Cambridge, Massachusetts, taking degrees and working at MIT and Harvard. Bangkok is not my case study, it is my city. My case study is Shanghai, where I spent years on the lilong lane housing, working on gentrification as an anthropologist.",
  },
  {
    kind: "p",
    text: "What I found there sits on neither side of the usual argument. Gentrification is not one process with one villain; it is several things at once, some genuinely harmful, some straightforwardly good for people who had nothing, and some simply the price of a neighbourhood becoming somewhere people want to be. The romantic reading — that any change to a poor neighbourhood is theft from its residents — did not survive my fieldwork. Neither did the developer's. What I watched was more specific: the government picked which structures were worthy of preservation, which quietly made every unworthy structure available for immediate bulldozing, and the residents of the worthy ones went on living exactly as badly as before, because the money had gone into the façade.",
  },
  {
    kind: "p",
    text: "I should also say that I am not a Jane Jacobs partisan, and I think her influence has done real damage to how we argue about cities. The move she legitimised — a neighbourhood declaring itself finished and defending its texture against newcomers — is indistinguishable from property protectionism once it is in the hands of people who already own the block. Ed Glaeser is right about this. The economic case for diversity is not preserving Greenwich Village for whoever bought in before it got expensive; it is housing more people, close to work, in a city that needs their labour and owes them somewhere to live. Affordability is a by-product of diversity, and you cannot protect it by freezing a place.",
  },
  {
    kind: "p",
    text: "So understand what I am not saying. I am not saying freeze Sukhumvit 71. I am saying these buildings are several hundred thousand units of housing and workspace on serviced land beside transit, and the fastest way to get more people living well in this city is to make them usable again — not to spend twenty years replacing them with fewer, dearer units and calling the difference progress.",
  },
  {
    kind: "p",
    text: "Four rules, then, in the order I would apply them. First, preserve in groups, never one at a time: a single saved building among towers is a specimen, and what is worth keeping is not the object but the connectedness — that the people in it have known each other for thirty years and that this is legible in how the street works. Second, protect the people before the building. Third, bring new functions in, but learn from the old one first: these buildings worked for decades without air conditioning, on high ceilings, cross ventilation and a light well, and a renovation that makes them dependent on mechanical cooling has taken a low-energy structure and given it a permanent bill. Fourth — the one people find counterintuitive — do not keep the façade and fill it with luxury retail. My objection is not ideological. It is that there is not enough demand. Scarce heritage frontage attracts expensive products because expensive products need to borrow authenticity, and a district that is entirely luxury has one kind of person in it at one time of day.",
  },

  { kind: "h2", text: "The elephant" },
  {
    kind: "p",
    text: "Xintiandi in Shanghai took a lilong block, kept the shells and made a high-end dining district. It was enormously successful and set the template for two decades of Chinese heritage-led development. Bangkok now has its own version at Woeng Nakhon Kasem. I want to be fair: it is better than a tower, and it is small-grained and faces the street when it could have been sealed and inward-facing.",
  },
  {
    kind: "p",
    text: "My question is not whether it should exist but how many a city can hold. The value of that model comes entirely from scarcity — it is an experience, and an experience has to be unusual. One in a city is a destination. Three is a theme. Five and you have Disneyland: a fantasy, priced for people who can afford the ticket. How many Disneylands can a city support? One. Perhaps. So if there are 400,000 shophouses and this model can absorb a few blocks, it is not the answer to the problem. It is the answer to a much smaller problem that happens to be very profitable. The remaining 399,000 need something that works at ordinary rents, for ordinary businesses, without a masterplan.",
  },

  { kind: "h2", text: "What the students found" },
  {
    kind: "p",
    text: "Which brings me to the studio. Chatpong sent his students to Sukhumvit 71 and did not fly them in to be experts in three days; he made them document a practice from their own city first — Fuzhou, Qingdao, Chengdu, Chaoshan — so the Bangkok observation arrived through a comparison rather than through astonished eyes. Astonished eyes are shallow, as anyone who has watched a foreign consultant discover street food will know.",
  },
  {
    kind: "p",
    text: "What came back shares a structure I do not think they coordinated. Each project takes a system Bangkok already runs on, which currently has no address, and gives it a building. Win motorcycle taxis, which have no base, get a ramp and a place to sleep. The fresh market a convenience store replaced gets its ground floor back, at three hundred stalls, on a structural grid that turns out to be the same four metres as the market it replaced. Street food gets a serviced wall with water and drainage, bookable by the slot. Nightlife gets a buffer strip that is a hairdresser at noon and a bar at midnight, so the street stops dying for twelve hours a day. Ritual gets a canopy and a calendar.",
  },
  {
    kind: "p",
    text: "None of these are technology projects. All of them are infrastructure projects for systems that already exist and are not recognised as infrastructure.",
  },

  { kind: "h2", text: "The smart city we already have" },
  {
    kind: "pull",
    text: "Bangkok does not have a smart city deficit. It has a legitimacy deficit. The systems are running. They are simply not written down, not measured, and not permitted.",
  },
  {
    kind: "p",
    text: "Consider what the win motorcycle network is. A demand-responsive last-mile transit system with a distributed rank structure, community-negotiated pricing and a labour pool that self-organises by neighbourhood. It emerged in the 1980s because the sois run a kilometre deep off the main roads and nothing else would serve them, and because women walking home late were being robbed and neighbours with motorbikes started giving lifts. Any transit authority on earth would be proud of having designed it. Nobody designed it. It has no allocated space, no shelter and no formal recognition, and it grosses millions of baht a year while parking illegally on the corner it serves. Street food is the same story: a distributed food-security system feeding a metropolis at a price no formal restaurant sector could match, which began on boats and moved onto the pavement when the canals were filled in, and which still has no electricity, water, waste collection or legal place to put a cart at two in the morning.",
  },
  {
    kind: "p",
    text: "A smart city as usually sold would install sensors to measure the congestion these vendors cause. I am proposing the opposite: that the technology's job is to give these systems the status the city has been withholding, and that this is cheaper and more useful than anything in the standard catalogue.",
  },
  {
    kind: "p",
    text: "I should show my work. I built a national flood monitoring system that, judging by comparable procurement, would have tendered at ten to twenty million baht and arrived after the water had come and gone four times. It took about two weeks, ingests some two million data points, and runs on a server in my house that occasionally goes down because my mother thinks I am using too much data. I built another to help my mother find a massage therapist; it gathered eighty-six thousand records in thirty-eight hours and, mapped against public-health data, showed a geography nobody had drawn. Turning that system into one that matches motorcycle-taxi supply and demand is about seven lines of code. The hard part was never the technology — it was two weeks of looking at what came back and fixing how the data was collected, which is a discipline problem. So when someone asks what a bottom-up smart city would cost, the cost is not the obstacle and never was. What has been missing is the decision that these systems are worth building for.",
  },

  { kind: "h2", text: "Three systems, and one question" },
  {
    kind: "p",
    text: "For this building type, three things are missing and none is hard. The first is a register: nobody knows where Bangkok's shophouses are — a 400,000-unit asset class with no inventory. I screened every building along Sukhumvit 71 by geometry for the shophouse signature, a narrow frontage and a deep plan repeating along a street, and found 2,193 candidates in the study area, 683 within 120 metres of the road. The median has a 4.5-metre frontage and a 12.6-metre depth, within a decimetre of what the students measured by hand. That does not prove any individual building is a shophouse. It proves the population can be found at city scale, from open data, in an afternoon.",
  },
  {
    kind: "p",
    text: "The second is tenure. Which units are occupied, which are for sale, which are for rent — from both ends, so a developer can find stock and a family can find a home. That does not exist and cannot be built from open data, because tenure is not published. What can be built is the frame with the fields visibly empty, which is a specification: it tells you what survey to commission. One commercial number is public, though, and it is the decisive one. Treasury appraisal around Sukhumvit 71 runs from about 47,500 baht per square metre on an inner soi to roughly 150,000 on the nearest main-road band — between 2.7 and 8.5 million baht of ground under one shophouse footprint, and appraised value sits below market. The demolition argument was never really about the building.",
  },
  {
    kind: "p",
    text: "The third would actually unlock reuse. The obstacle to adapting a shophouse is not space, it is circulation: the stair sits at the front on the ground floor, so whoever rents the shop controls access to everything above. Let the ground floor to a coffee chain and you have land-locked three storeys. I assumed this was an architect's observation until I read the research and found it is a measured cause — a 2021 survey of forty owners lists the placement of the stair among the root causes of upper-floor vacancy, with one owner's recorded reason being simply that there are no stairs outside. And here the law closes the circle in a way that would be funny if it were not expensive: Ministerial Regulation No. 11 defines removing a reinforced-concrete stair as demolition rather than modification, so the one change that would unlock the upper floors of several hundred thousand buildings triggers full compliance with a code the building cannot meet, because it is old. Thailand has already shown it knows how to write the exception — a 2016 regulation let existing buildings become small hotels under relaxed standards, grandfathering setbacks and parking to the rules in force when they were first permitted. It worked, it was extended three times, and it appears to have been allowed to lapse.",
  },
  {
    kind: "p",
    text: "Which leaves the question a preservation case never answers: reuse for what? Let me answer with what I actually do. I built every system in this essay on a laptop carried to a place and opened. There are thousands of people doing this in Bangkok now and the number is climbing steeply, because the tools got cheap enough that one person with an idea can build what needed a funded team five years ago. This economy is nearly indifferent to floor plate and prestige and almost entirely dependent on where it feels good to sit for nine hours — which turns out to be the inner city, the mildly chaotic part, dense and mixed and loud with four kinds of food within sixty seconds of the door. Sensory richness is an input, not a preference. And the shophouse supplies it almost comically well: a small floor plate that suits a team of three, a shop below that keeps the street alive, a house above someone can live in, and a door onto a pavement where things are happening.",
  },
  {
    kind: "pull",
    text: "The most valuable thing a shophouse has is the one thing no new building can be given: a street outside that is already interesting.",
  },
  {
    kind: "p",
    text: "For a sponsor, the commercial logic follows directly. There are 400,000 units of infrastructure-rich, transit-adjacent, structurally-serviceable floor area whose owners believe they are worth only the land beneath them. If reuse can be made cheap and legible enough to beat demolition on an ordinary spreadsheet, that stock is not urban trash — it is the largest under-priced asset class in the city, and the first firm to build the tools to assess it at scale is the firm everyone else has to hire. That is not a preservation argument in commercial clothing. It is a commercial argument that happens to preserve things.",
  },

  { kind: "h2", text: "What I still walk to" },
  {
    kind: "p",
    text: "I go back to the old town most weeks — temples to food stalls to cafés to bookshops, the same loop, which after four decades is less research than habit. It has changed. It is quieter than the street I grew up on, with less food on the pavement and fewer people who have been there forever. Gentrified is the available word and it is roughly accurate. But it is still working, and I would argue, without being able to prove it, that the old town of Bangkok is the most alive old town in the world. It has never had World Heritage status, and I have come to think that is part of why. Nobody ever froze it.",
  },
  {
    kind: "p",
    text: "The shophouse is the same proposition at the scale of one building. It was never precious. It was built cheap and fast for people who needed a shop and a bed, it was modified by everyone who ever lived in it, and the modifications are the evidence that it worked. Chatpong calls these buildings bastards, and the affection in that is doing real work: a bastard has no pedigree, no lineage anyone recorded, and turns out to be more inventive than the legitimate children.",
  },
  {
    kind: "p",
    text: "I do not know how many we will keep. I know the number is falling and that nobody decided it should. And I have noticed that every time I explain the win motorcycle system to someone from a city without one, they are impressed — genuinely, not politely — and then they ask who runs it, and I have to say that nobody does, and that officially it is not there at all. That is the gap I would like us to close. Not by building something clever on top of the city, but by writing down what the city already built, and admitting that it counts.",
  },
];
