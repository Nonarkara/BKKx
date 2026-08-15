// The book version — the essay as edited by Dr Non, then re-edited to the
// style his own markup established, and to what the Chatpong transcript asks
// for but never says out loud.
//
// Style rules taken from his edit pass on the manuscript (2026-08-15):
//   * Short paragraphs. Break at the turn, not at the page.
//   * One-line paragraphs carry the landing line.
//   * Colon after an opening phrase: "Let's cut to the chase:", "Consider X:".
//   * No pull quotes — he deleted every one. The line earns it in prose or not.
//   * Credentials and self-reference belong in footnotes, not the body.
//   * "Social capital" is the economic frame, never the sentimental one.
//   * Concrete lists beat abstraction.
//   * People are introduced by role: "The economist Ed Glaeser".
//   * Single quotes for terms held at arm's length: 'bastards', 'retailscape'.
//
// Rendered at /shophouses/print and /shophouses/manuscript; exported to PDF
// and DOCX from there.

export type ShortBlock =
  | { kind: "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "figure"; id: string; caption: string };

export type Footnote = { n: number; text: string };

export const SHORT_META = {
  title: "Bangkok Doesn't Need a Smart City",
  subtitle: "It must legitimize what it has already built.",
  byline: "Non Arkara",
  context:
    "The third essay in Shophouse Metropolis (Harvard University Graduate School of Design), following Chatpong Chuenrudeemol's title essay and Bangkok Bastards.",
  note:
    "An extended version, with an interactive survey of the Sukhumvit 71 corridor, a sourced reuse-versus-demolition carbon model and a catalogue of 57 theses, is at shophouses.nonarkara.org",
  dedication:
    "For the late Dr Chamnarn Tirapas of the School of Architecture and Design, King Mongkut's University of Technology Thonburi — a leading expert on the shophouse, whom I came to know during my first year as senior expert at depa, when we found ourselves working the same smart-city problem from opposite ends. Energetic, down to earth, funny and caring. None of us knew how little time there would be. The anatomy this essay leans on is his, and so is the proposal to move the stair.",
  updated: "2026-08-15",
} as const;

export const SHORT: ShortBlock[] = [
  {
    kind: "p",
    text: "Let's cut to the chase: Preserving cultural heritage sounds like an obviously good thing. The hard part is how.",
  },
  {
    kind: "p",
    text: "Picture the first option: a historic-looking quarter built entirely from the ground up to resemble old shophouse alleys, every unit a luxury store.",
  },
  {
    kind: "p",
    text: "Now the second: a genuinely preserved alley where people live at squatter density in a building nobody has surveyed, and nobody in it knows what happens when a fire starts.",
  },
  {
    kind: "p",
    text: "My guess is you want neither. Those are broadly the two directions on offer.",
  },
  {
    kind: "p",
    text: "Three reasons came easily when Chatpong asked me to write this. My day job in the Thai government is designing policy and implementation protocols for smart cities — cities that use technology to benefit the people in them. So I always want to see what we can do to make our cities better without razing them to rebuild just because we can. Second, I grew up in the shophouses of central Bangkok; my father worked in the old town and I spent childhood running around his office, so this is not just a case study to me. And I spent years studying shophouses in Shanghai for my doctorate in anthropology, in the course of which I accidentally talked myself out of believing that gentrification means one thing, and that the one thing is usually bad.",
  },
  {
    kind: "p",
    text: "So: I am not a preservationist. I have no attachment to old things on the grounds that they are old. I think technology can make this city safer, cleaner in its air and water, less lethal on its roads and more economically viable for more people than it currently is, and I want that faster than it is arriving.",
  },
  {
    kind: "p",
    text: "As an architect and anthropologist, what I think we get wrong is how fast people absorb a new environment. Humans do not adapt to a rebuilt city as quickly as a city can be rebuilt. We thrive in familiar places, which frees up the cognitive capacity to invent, invest and innovate. We need remnants — enough of the familiar left standing to orient by.",
  },
  {
    kind: "p",
    text: "That is, continuity is not nostalgia: it is the condition under which change is survivable.",
  },

  { kind: "h2", text: "Why the bastards work" },
  {
    kind: "p",
    text: "Chatpong calls certain types of buildings 'bastards.' His affection for them is doing real architectural research work. A bastard has no pedigree, no recorded lineage, no design theory to justify it — and turns out to be more inventive than the legitimate children.",
  },
  {
    kind: "p",
    text: "From temporary construction camps assembled out of corrugated metal, to motorcycle taxis and street food stands, to hotels rented by the hour, Chatpong looks at these not as architectural problems but as social capital.",
  },
  {
    kind: "p",
    text: "That is the right category, and it is what makes this an economic argument rather than an aesthetic one. Social capital is the part of a place's value that nobody can draw: thirty years of the same neighbours knowing which stall opens at five, which rider will wait, whose son fixes air conditioners. It cannot be designed, commissioned or accelerated. It can only be accumulated.",
  },
  {
    kind: "p",
    text: "And it is destroyed in an afternoon by an excavator.",
  },
  {
    kind: "p",
    text: "That asymmetry is the whole argument. You can rebuild a building in eighteen months. You cannot rebuild thirty years of a street in eighteen months, at any budget.",
  },
  {
    kind: "p",
    text: "I recognized the pattern immediately, because I have watched it from the government side of the table for years. I have seen comprehensive policies fail completely while the thing locals rigged up for themselves works perfectly for the people using it.",
  },
  {
    kind: "p",
    text: "For example: a city I worked with wanted a simple digital problem-reporting system. The citizens wanted one too, and between them they built something that fit what people actually needed — instead of procuring an expensive, policy-backed platform that would have arrived late and fitted nobody.",
  },
  {
    kind: "p",
    text: "Long procurement cycles, bureaucratic process, distance from the facts on the ground, and often a plain lack of capacity: that is how both policies and projects fail.",
  },
  {
    kind: "p",
    text: "So, like Chatpong, I look for clues from citizens — their pain points, and the ingenious circumstantial solutions they have already built. That is why I studied anthropology after architecture. We have to understand where the problem actually is before we can design anything meaningful.",
  },
  {
    kind: "p",
    text: "That sounds obvious. It is routinely skipped, because understanding a problem takes longer than specifying a platform, and only one of the two can go in a procurement document.",
  },
  {
    kind: "p",
    text: "A bastard building is that same intelligence in concrete: somebody had a problem, no budget and no permission, and solved it anyway.",
  },

  { kind: "h2", text: "The arithmetic that eats a street" },
  {
    kind: "p",
    text: "Long story short: in the post-war era cities became the engine of growth, so land inside cities became the asset — and not all land equally. Land that already has a road, a sewer, a power line and a station within walking distance is worth many times the land without, because somebody already paid for the expensive part.",
  },
  {
    kind: "p",
    text: "In Bangkok that land has an awkward feature: it is occupied. It is occupied by the capitalist infrastructure of a previous era, which we call the shophouse — a shop below, the shopkeeper's house above, one of the more honest names in architecture.",
  },
  {
    kind: "p",
    text: "There are roughly 400,000 left. There were about 750,000 at the peak in the 1960s and 70s, when more than half of everything built in Thai cities was shophouses and some seventy per cent of Bangkok lived in one.[[1]]",
  },
  {
    kind: "p",
    text: "The number that should stop you is not the total but the slope: we are a quarter of a million units into a demolition nobody ever decided to carry out.",
  },
  { kind: "figure", id: "stock", caption: "Bangkok's shophouse stock. The slope, not the total." },
  {
    kind: "p",
    text: "There is a sharper version of that slope in a thesis almost nobody has read. In 2010 a Chulalongkorn master's student, Quin Limp, took the 1907 cadastral survey of Bangkok — a 1:1,000 map made to issue land title deeds, which is why it records individual buildings — and counted every shophouse in Samphanthawong. There were 2,430, in sixteen reconstructable design types, including a run of 63 identical units across Songsawat, Charoen Krung and Yaowarat.",
  },
  {
    kind: "p",
    text: "Then he counted what survived. Around 310.[[2]]",
  },
  { kind: "figure", id: "samphanthawong", caption: "One district, one century, 87 per cent gone. Quin Limp's count from the 1907 cadastre against what stands today." },
  {
    kind: "p",
    text: "Each transaction that produced that number made sense on its own terms. If you hold a plot on a main road with three storeys on it and the market will support thirty, the difference is the return, and clearing the low-rise is the shortest path to it.",
  },
  {
    kind: "p",
    text: "For a long time we called this progress and for a long time it was. Then at some point people notice that something has changed: the original residents have gone, franchises have arrived because a franchise can pay rent a family shop cannot, and the street has a particular 'retailscape' you could find in any city on earth. Sterile is the word people reach for.",
  },
  {
    kind: "p",
    text: "The more precise word is generic.",
  },
  {
    kind: "p",
    text: "You can watch it happen along one avenue in downtown Bangkok. Sukhumvit 26 became Phrom Phong. Sukhumvit 55 became Thonglor. Sukhumvit 63 became Ekkamai. In each case the shophouses went first and what replaced them was worth more per square metre and less distinguishable from anywhere else: high-rise condos, elite malls, wedding studios, expensive international schools.",
  },
  {
    kind: "p",
    text: "Sukhumvit 71 still has its stock, still occupied, still hybrid — a Burmese community that turned an old theatre block into a fresh market at the southern end, massage parlours and coffee places through the middle, furniture-and-motorcycle-garage hybrids at the north. It also has a station and a developer's spreadsheet with its name on it.",
  },
  {
    kind: "p",
    text: "That is why the studio chose it.",
  },
  { kind: "figure", id: "sukhumvit-pattern", caption: "The same avenue, four times. Each cross-road that redeveloped lost its shophouses first." },

  { kind: "h2", text: "The concession, and the discovery" },
  {
    kind: "p",
    text: "This is not an argument against building. Let me concede the strongest version of the other case first, because an argument that cannot survive its own counter-example is not worth publishing.",
  },
  {
    kind: "p",
    text: "A great many shophouses should come down. They were built cheaply and fast by settlers who needed a shop and a bed, not by anyone designing for a long service life, and some have been used harder than they were built for. Reinforced concrete of 1960s practice, in a hot wet climate, cut through by decades of informal modification — some of these buildings are dangerous, and the people inside them are the ones in danger.",
  },
  {
    kind: "p",
    text: "My rule, learned expensively in Shanghai, is that you never preserve a building at the expense of the humans living in it. If the structure is unsafe you protect the people first and argue about the architecture afterwards.",
  },
  {
    kind: "p",
    text: "Set those aside. What about the ones in decent condition, on good land, coming down anyway because the arithmetic says so?",
  },
  {
    kind: "p",
    text: "Here I want to be careful, because there is a sentimental version of this essay and I do not want to write it. The usual defence is the 'sense of place.' I believe in the sense of place; I also know it does not fly alone in a room with a developer, and I would rather win than be right in a way that changes nothing.",
  },
  {
    kind: "p",
    text: "So before any of that — a legal fact I did not know until I went reading, and the strangest thing in this essay.",
  },
  {
    kind: "p",
    text: "On a great many shophouse plots you are not permitted to rebuild what you tear down. Setback rules require a building over two storeys to stand six metres back from the centreline of a road narrower than ten metres.[[3]] An old shophouse occupies its entire plot, right up to the pavement, because it was built before that rule existed.",
  },
  {
    kind: "p",
    text: "Demolish it and the replacement must step back — onto land that, on a twelve-metre-deep plot, is most of the site.",
  },
  { kind: "figure", id: "setback", caption: "The setback trap. The building that stands could not be built today, and what legally replaces it is smaller than what was demolished." },
  {
    kind: "p",
    text: "Read that again, because it inverts the usual argument. On these plots reuse is not the sentimental option, and not even merely the cheaper one. It is the only lawful one — and most owners do not know it.",
  },

  { kind: "h2", text: "The carbon case, and what we cannot say" },
  {
    kind: "p",
    text: "Every demolition spends carbon twice: the carbon already embodied in the building, thrown away, and the carbon of making its replacement.",
  },
  {
    kind: "p",
    text: "Roughly 55 per cent of a building's embodied carbon sits in its substructure and superstructure[[4]] — the foundations and frame, the part a retrofit keeps and a demolition puts in a truck. So a reuse project starts with more than half the carbon already banked, before anyone mentions character.",
  },
  { kind: "figure", id: "carbon", caption: "Demolish-and-rebuild against retrofit, at the measured dimensions of a Sukhumvit 71 shophouse. Every coefficient shows its source." },
  {
    kind: "p",
    text: "The classic study is The Greenest Building, from the Preservation Green Lab in 2011. Across six building types and four cities on a seventy-five-year horizon, it found that a new energy-efficient building takes between ten and eighty years to overcome, through better performance, the climate impact of its own construction — for most types and climates, twenty to thirty.[[5]]",
  },
  {
    kind: "p",
    text: "If your city has a 2050 target, a building you demolish in 2026 may not break even until after the target has passed.",
  },
  {
    kind: "p",
    text: "That same study also found a case where reuse lost: a warehouse-to-apartment conversion that replaced so much it spent more than it saved. I include it because it is the boundary of my own argument. A retrofit that guts a building to its frame and rebuilds everything in aluminium and glass is a demolition with better manners.",
  },
  {
    kind: "p",
    text: "Now the honest part. There is no embodied-carbon study of the Bangkok shophouse. None.",
  },
  {
    kind: "p",
    text: "Thai work covers standard low-rise houses and one high-rise; neither is a shophouse. Every coefficient I can offer is imported from British or American benchmarks, and while concrete is concrete and the direction is not in doubt, Thai cement and Thai practice and the Thai grid are all different.",
  },
  {
    kind: "p",
    text: "Worse, there is no institutional benchmark anywhere for whole-building deep retrofit — the GLA, RICS, RIBA and LETI all publish new-build numbers and none publishes the reuse equivalent. Which means every comparison in circulation, including mine, has a well-measured demolition side and an estimated reuse side, and that asymmetry quietly favours knocking things down.",
  },
  {
    kind: "p",
    text: "The single most useful thing anyone could fund off the back of this studio is not another render. It is a life-cycle assessment of one ordinary Bangkok shophouse.",
  },
  {
    kind: "p",
    text: "On the other hand, a great deal of research does exist and is simply unread. There are at least fifty-seven graduate theses on Bangkok shophouses and historic districts in the repositories of Chulalongkorn, Silpakorn, Thammasat, KMUTT and universities abroad. People have surveyed the stock, measured the units, interviewed the owners, mapped the 1907 cadastre and traced the legal obstacles in detail.",
  },
  {
    kind: "p",
    text: "Master's students have been solving this problem, one district at a time, for forty years, and none of it reaches the room where a demolition is decided. I read four properly for this essay and each contained something I would otherwise have guessed at.",
  },

  { kind: "h2", text: "Four things Shanghai taught me" },
  {
    kind: "p",
    text: "Chatpong made his students bring a case study from their own city before they were allowed an opinion about Bangkok, which I think is the best decision in the studio. I should hold myself to it.",
  },
  {
    kind: "p",
    text: "I was born in Bangkok and grew up here; I then spent a decade in Cambridge, Massachusetts, taking degrees and working at MIT and Harvard. Bangkok is not my case study, it is my city. My case study is Shanghai, where I spent years on the lilong lane housing, working on gentrification as an anthropologist.",
  },
  {
    kind: "p",
    text: "What I found there sits on neither side of the usual argument. Gentrification is not one process with one villain; it is several things at once, some genuinely harmful, some straightforwardly good for people who had nothing, and some simply the price of a neighbourhood becoming somewhere people want to be.",
  },
  {
    kind: "p",
    text: "The romantic reading — that any change to a poor neighbourhood is theft from its residents — did not survive my fieldwork. Neither did the developer's.",
  },
  {
    kind: "p",
    text: "What I watched was more specific: the government picked which structures were worthy of preservation, which quietly made every unworthy structure available for immediate bulldozing, and the residents of the worthy ones went on living exactly as badly as before, because the money had gone into the façade.",
  },
  {
    kind: "p",
    text: "I should also say that I am not a Jane Jacobs partisan, and I think her influence has done real damage to how we argue about cities. The move she legitimised — a neighbourhood declaring itself finished and defending its texture against newcomers — is indistinguishable from property protectionism once it is in the hands of people who already own the block.",
  },
  {
    kind: "p",
    text: "The economist Ed Glaeser is right about this. The economic case for diversity is not preserving Greenwich Village for whoever bought in before it got expensive; it is housing more people, close to work, in a city that needs their labour and owes them somewhere to live. Affordability is a by-product of diversity, and you cannot protect it by freezing a place.",
  },
  {
    kind: "p",
    text: "So understand what I am not saying. I am not saying freeze Sukhumvit 71. I am saying these buildings are several hundred thousand units of housing and workspace on serviced land beside transit, and the fastest way to get more people living well in this city is to make them usable again — not to spend twenty years replacing them with fewer, dearer units and calling the difference progress.",
  },
  {
    kind: "p",
    text: "Four rules, then, in the order I would apply them.",
  },
  {
    kind: "p",
    text: "First, preserve in groups, never one at a time. A single saved building among towers is a specimen. What is worth keeping is not the object but the connectedness — that the people in it have known each other for thirty years, and that this is legible in how the street works. Save a block and you keep the social capital. Save one façade and you keep a photograph.",
  },
  {
    kind: "p",
    text: "Second, protect people from the building. If it is unsafe, that comes before everything else in this essay.",
  },
  {
    kind: "p",
    text: "Third, bring new functions in, but learn from the old one first. These buildings worked for decades without air conditioning, on high ceilings, cross ventilation and a light well. A renovation that makes them dependent on mechanical cooling has taken a low-energy structure and given it a permanent bill.",
  },
  {
    kind: "p",
    text: "Fourth — the one people find counterintuitive — do not keep the façade and fill it with luxury retail. My objection is not ideological. It is that there is not enough demand. Scarce heritage frontage attracts expensive products because expensive products need to borrow authenticity, and a district that is entirely luxury has one kind of person in it at one time of day.",
  },

  { kind: "h2", text: "The elephant" },
  {
    kind: "p",
    text: "Xintiandi in Shanghai took a lilong block, kept the shells and made a high-end dining district. It was enormously successful and set the template for two decades of Chinese heritage-led development. Bangkok now has its own version at Woeng Nakhon Kasem.",
  },
  {
    kind: "p",
    text: "I want to be fair: it is better than a tower, it is small-grained, and it faces the street when it could have been sealed and inward-facing.",
  },
  {
    kind: "p",
    text: "My question is not whether it should exist but how many a city can hold. The value of that model comes entirely from scarcity — it is an experience, and an experience has to be unusual.",
  },
  {
    kind: "p",
    text: "One in a city is a destination. Three is a theme. Five and you have Disneyland: a fantasy, priced for people who can afford the ticket. How many Disneylands can a city support? One. Perhaps.",
  },
  {
    kind: "p",
    text: "So if there are 400,000 shophouses and this model can absorb a few blocks, it is not the answer to the problem. It is the answer to a much smaller problem that happens to be very profitable.",
  },
  {
    kind: "p",
    text: "The remaining 399,000 need something that works at ordinary rents, for ordinary businesses, without a masterplan.",
  },

  { kind: "h2", text: "What the students found" },
  {
    kind: "p",
    text: "Which brings me to the studio.",
  },
  {
    kind: "p",
    text: "Chatpong sent his students to Sukhumvit 71 and did not fly them in to be experts in three days. He made them document a practice from their own city first — Fuzhou, Qingdao, Chengdu, Chaoshan, Kerala — so the Bangkok observation arrived through a comparison rather than through astonished eyes. Astonished eyes are shallow, as anyone who has watched a foreign consultant discover street food will know.",
  },
  {
    kind: "p",
    text: "What came back shares a structure I do not think they coordinated. Each project takes a system Bangkok already runs on, which currently has no address, and gives it a building.",
  },
  {
    kind: "p",
    text: "Win motorcycle taxis, which have no base, get a ramp and a place to sleep. The fresh market a convenience store replaced gets its ground floor back, at three hundred stalls, on a structural grid that turns out to be the same four metres as the market it replaced. Street food gets a serviced wall with water and drainage, bookable by the slot. Ritual gets a canopy and a calendar.",
  },
  {
    kind: "p",
    text: "The one I would put in front of a sceptic is the day-and-night project. A buffer strip that runs vocational training and a hairdresser by day and a bar by midnight — so a street that currently dies for twelve hours earns rent for twenty-four, and the people working the night shift have a daytime skill and a legal address to practise it in.",
  },
  {
    kind: "p",
    text: "None of these are technology projects, and none is really a repurposing project either. Adaptive reuse is the technique, not the ambition.",
  },
  {
    kind: "p",
    text: "What each student is actually drawing is a piece of social and economic infrastructure: a complex for micro-mobility, a hybrid marketplace, a building that trades day shift for night shift. Not intervention for its own sake, but an ecosystem a neighbourhood can run on and keep running on.",
  },
  {
    kind: "p",
    text: "That distinction is commercial as much as intellectual. A repurposing project is a one-off transaction with a fixed return. An ecosystem project builds the thing that keeps a place worth investing in.",
  },
  {
    kind: "p",
    text: "It is also the difference between designing a form and designing a programme. The renders that circulate as Bangkok's urban future — the sculpted bridge, the photogenic pavilion — are forms in search of a use. These projects are uses in search of the cheapest available form, which is very often a building that is already standing.",
  },

  { kind: "h2", text: "The smart city we already have" },
  {
    kind: "p",
    text: "Consider what Bangkok's motorcycle taxi network is: a demand-responsive last-mile transit system with a distributed rank structure, community-negotiated pricing and a labour pool that self-organises by neighbourhood.",
  },
  {
    kind: "p",
    text: "It emerged in the 1980s because the sois run a kilometre deep off the main roads and nothing else would serve them, and because women walking home late were being robbed and neighbours with motorbikes started giving lifts.",
  },
  {
    kind: "p",
    text: "Any transit authority on earth would be proud of having designed it. Nobody designed it.",
  },
  {
    kind: "p",
    text: "It has no allocated space, no shelter and no formal recognition, and it grosses millions of baht a year while parking illegally on the corner it serves. My Harvard anthropology classmate Claudio Sopranzetti goes as far as to argue that this network is bottom-up resistance to the power of the elites.[[6]]",
  },
  {
    kind: "p",
    text: "Street food is the same story: a distributed food-security system feeding a metropolis at a price no formal restaurant sector could match, which began on boats and moved onto the pavement when the canals were filled in, and which still has no electricity, water, waste collection or legal place to put a cart at two in the morning.",
  },
  {
    kind: "p",
    text: "Flooding is the third. Every wet season this city runs a live, distributed and surprisingly accurate information network — neighbours reporting water depth to each other in real time, on their own phones, for free — and almost none of it reaches the desk where someone decides whether to open a gate.",
  },
  {
    kind: "p",
    text: "A smart city as usually sold would install sensors to measure the congestion these vendors cause.",
  },
  {
    kind: "p",
    text: "I am proposing the opposite: that the technology's job is to give these systems the status the city has been withholding, and that this is cheaper and more useful than anything in the standard catalogue.[[7]]",
  },
  {
    kind: "p",
    text: "This is also where I part company with the model currently being sold across this region. The Singapore template — sensors first, platform second, citizens as data sources — works in Singapore because Singapore built the formal city first and the data layer second.",
  },
  {
    kind: "p",
    text: "Bangkok did it the other way round. The systems are already running. What is missing is not the technology but the permission.",
  },
  {
    kind: "p",
    text: "So buying the Singapore product for a Southeast Asian city is not merely expensive. It is a category error: you are paying to instrument a formal city you do not have, while the informal one that actually moves your workforce stays illegal and therefore stays unmeasurable.",
  },
  { kind: "figure", id: "topdown", caption: "Two ways to build a smart city. One installs a layer over the formal city; the other legitimises the working city that is already there." },

  { kind: "h2", text: "Three systems, and one question" },
  {
    kind: "p",
    text: "For this building type, three things are missing and none of them is hard.",
  },
  {
    kind: "p",
    text: "The first is a register. Nobody knows where Bangkok's shophouses are — a 400,000-unit asset class with no inventory.",
  },
  {
    kind: "p",
    text: "I screened every building along Sukhumvit 71 by geometry, looking for the shophouse signature: a narrow frontage and a deep plan, repeating along a street. It found 2,193 candidates in the study area, 683 within 120 metres of the road. The median has a 4.5-metre frontage and a 12.6-metre depth, within a decimetre of what the students measured by hand.",
  },
  {
    kind: "p",
    text: "That does not prove any individual building is a shophouse. It proves the population can be found at city scale, from open data, in an afternoon.",
  },
  {
    kind: "p",
    text: "The second is tenure: which units are occupied, which are for sale, which are for rent — from both ends, so a developer can find stock and a family can find a home. That does not exist and cannot be built from open data, because tenure is not published.",
  },
  {
    kind: "p",
    text: "What can be built is the frame with the fields visibly empty, which is a specification: it tells you exactly what survey to commission.",
  },
  {
    kind: "p",
    text: "One commercial number is public, though, and it is the decisive one. Treasury appraisal around Sukhumvit 71 runs from about 47,500 baht per square metre on an inner soi to roughly 150,000 on the nearest main-road band — between 2.7 and 8.5 million baht of ground under one shophouse footprint, and appraised value sits below market.",
  },
  {
    kind: "p",
    text: "The demolition argument was never about the building.",
  },
  { kind: "figure", id: "asset", caption: "What the ground under one shophouse footprint is appraised at, by band. Appraisal sits below market, so read it as a floor." },
  {
    kind: "p",
    text: "The third would actually unlock reuse, and it came out of conversation with Chatpong rather than from any drawing.",
  },
  {
    kind: "p",
    text: "The obstacle to adapting a shophouse is not space. It is circulation.",
  },
  {
    kind: "p",
    text: "The stair sits at the front on the ground floor, so whoever rents the shop controls access to everything above. Let the ground floor to a coffee chain and you have land-locked three storeys.",
  },
  {
    kind: "p",
    text: "I assumed this was an architect's observation until I read the research and found it is a measured cause. A 2021 survey of forty owners lists the placement of the stair among the root causes of upper-floor vacancy,[[8]] with one owner's recorded reason being simply that there are no stairs outside.",
  },
  { kind: "figure", id: "stair", caption: "Why the upper floors are dark. One stair through the shop ties three storeys to a single tenant; a second line of circulation lets the same building be let four ways." },
  {
    kind: "p",
    text: "Solve vertical circulation and the same building can be let in pieces — this floor to a workshop, that floor to a family, the roof to something that only opens at night. The floor area does not change. The number of tenants who can reach it does.",
  },
  {
    kind: "p",
    text: "And here the law closes the circle in a way that would be funny if it were not expensive. Ministerial Regulation No. 11 defines removing a reinforced-concrete stair as demolition rather than modification,[[9]] so the one change that would unlock the upper floors of several hundred thousand buildings triggers full compliance with a code the building cannot meet, because it is old.",
  },
  {
    kind: "p",
    text: "The practical threshold is brutally low: adapt more than a token fraction of a shophouse and the whole building reverts to current code — at which point the setback rule finishes what the stair rule started.",
  },
  {
    kind: "p",
    text: "Thailand has already shown it knows how to write the exception. A 2016 regulation let existing buildings become small hotels under relaxed standards, grandfathering setbacks and parking to the rules in force when they were first permitted. It worked, it was extended three times, and it appears to have been allowed to lapse.",
  },
  {
    kind: "p",
    text: "The building code is under revision as I write. That is the window, and it will not stay open indefinitely.",
  },
  {
    kind: "p",
    text: "Which leaves the question a preservation case never answers: reuse for what?",
  },
  {
    kind: "p",
    text: "Let me answer with what I actually do. I built every system in this essay on a laptop carried to a place and opened. There are thousands of people doing this in Bangkok now and the number is climbing steeply, because the tools got cheap enough that one person with an idea can build what needed a funded team five years ago.",
  },
  {
    kind: "p",
    text: "This economy is nearly indifferent to floor plates and prestige, and almost entirely dependent on where it feels good to sit for nine hours — which turns out to be the inner city: the mildly chaotic part, dense and mixed and loud, with four kinds of food within sixty seconds of the door.",
  },
  {
    kind: "p",
    text: "Sensory richness is an input, not a preference.",
  },
  {
    kind: "p",
    text: "And the shophouse supplies it almost comically well: a small floor plate that suits a team of three, a shop below that keeps the street alive, a house above someone can live in, and a door onto a pavement where things are happening.",
  },

  { kind: "h2", text: "The short version" },
  {
    kind: "p",
    text: "If you are the one deciding what happens to one of these buildings, four things are true regardless of which building it is.",
  },
  {
    kind: "p",
    text: "The land is worth more than the building, and that gap is no longer a feeling. It is an appraisal, a setback calculation and a carbon position — three numbers a spreadsheet can hold.",
  },
  {
    kind: "p",
    text: "On a great many plots, reuse is not the sentimental choice. It is the only lawful one, because a demolished building cannot legally be rebuilt to the footprint it had.",
  },
  {
    kind: "p",
    text: "A retrofit starts more than half paid for, in carbon a demolition throws away — and a demolition may not break even on that debt inside a normal investment horizon.",
  },
  {
    kind: "p",
    text: "And the thing actually blocking reuse is not money. It is a stair, and a 1985 definition that calls moving it a demolition. Regulation made that problem and regulation can unmake it, which is a far cheaper intervention than anything involving concrete.",
  },
  {
    kind: "p",
    text: "For a firm deciding where to put its regional practice, the arithmetic runs one step further. There are 400,000 units of infrastructure-rich, transit-adjacent, structurally-serviceable floor area whose owners believe they are worth only the land beneath them.",
  },
  {
    kind: "p",
    text: "Nobody can currently tell an owner, a lender or a city which of those buildings is worth keeping. Not because it is difficult, but because the four things that would answer it — an inventory, a condition and tenure layer, a circulation solver, a carbon position per plot — have never been assembled in one place.",
  },
  {
    kind: "p",
    text: "There is no universal formula here, and that is precisely the opportunity. Every one of these buildings is a case-by-case judgement, and case-by-case judgement across 400,000 buildings is not a design problem. It is a tooling problem — and tooling is a service line, not a project fee.",
  },
  {
    kind: "p",
    text: "The first firm to build those tools is the firm every developer, lender and city agency in this region eventually has to hire. That is not a preservation argument in commercial clothing. It is a commercial argument that happens to preserve things.",
  },

  { kind: "h2", text: "What I still walk to" },
  {
    kind: "p",
    text: "I go back to the old town most weeks — temples to food stalls to cafés to bookshops, the same loop, which after four decades is less research than habit.",
  },
  {
    kind: "p",
    text: "It has changed. It is quieter than the street I grew up on, with less food on the pavement and fewer people who have been there forever. Gentrified is the available word and it is roughly accurate.",
  },
  {
    kind: "p",
    text: "But it is still working, and I would argue, without being able to prove it, that the old town of Bangkok is the most alive old town in the world. It has never had World Heritage status, and I have come to think that is part of why. Nobody ever froze it.",
  },
  {
    kind: "p",
    text: "The shophouse is the same proposition at the scale of one building. It was never precious. It was built cheap and fast for people who needed a shop and a bed. It was modified by everyone who ever lived in it, and the modifications are the evidence that it worked.",
  },
  {
    kind: "p",
    text: "I do not know how many we will keep. I know the number is falling and that nobody decided it should.",
  },
  {
    kind: "p",
    text: "And I have noticed that every time I explain the win motorcycle system to someone from a city without one, they are impressed — genuinely, not politely — and then they ask who runs it, and I have to say that nobody does, and that officially it is not there at all.",
  },
  {
    kind: "p",
    text: "That is the gap I would like us to close. Not by building something clever on top of the city, but by writing down what the city already built, and admitting that it counts.",
  },
];

export const SHORT_FOOTNOTES: Footnote[] = [
  { n: 1, text: "Chatpong Chuenrudeemol, “Shophouse Metropolis,” in Shophouse Metropolis (Cambridge, MA: Harvard University Graduate School of Design, 2026); Chomchon Fusinpaiboon, “Modernisation of Building,” Journal of Asian Architecture and Building Engineering 21, no. 5 (2022): 1697–1718. Chuenrudeemol gives 450,000 for Thailand as a whole and 400,000 for the Bangkok stock in different passages; the lower figure is used throughout here." },
  { n: 2, text: "Quin Limp, “A Study of Shophouses During the Period of King Rama the Fifth Based on a 1907 Bangkok Map: Case Study of Samphanthawong District” (MArch thesis, Chulalongkorn University, 2010)." },
  { n: 3, text: "Ministerial Regulation No. 55 B.E. 2543 (2000), ข้อ 41, issued under the Building Control Act B.E. 2522 (1979); see also Attachai Luangamornlert, “Adaptive Reuse of Old Shophouses in Bangkok” (MArch thesis, Chulalongkorn University, 2015)." },
  { n: 4, text: "Greater London Authority, London Plan Guidance: Whole Life-Cycle Carbon Assessments (London: GLA, 2022), table A2.1." },
  { n: 5, text: "Preservation Green Lab, The Greenest Building: Quantifying the Environmental Value of Building Reuse (Washington, DC: National Trust for Historic Preservation, 2011)." },
  { n: 6, text: "Claudio Sopranzetti, “Owners of the Map: Mobility and Mobilization among Motorcycle Taxi Drivers in Bangkok,” City & Society 26, no. 1 (2014): 120–143." },
  { n: 7, text: "I should show my work. I built a national flood monitoring system that, judging by comparable procurement, would have tendered at ten to twenty million baht and arrived after the water had come and gone four times. It took about two weeks, ingests some two million data points, and runs on a server in my house that occasionally goes down because my mother thinks I am using too much data. The corridor screen in this book is the same story at smaller scale — an afternoon of code against eleven thousand building footprints, checked by hand for two weeks afterward against buildings I could verify by eye, because a fast tool that is wrong is worse than no tool. So when someone asks what a bottom-up smart city would cost, the cost is not the obstacle and never was. What has been missing is deciding these systems are worth building." },
  { n: 8, text: "Nabila Imam, “Vacant Shophouse Buildings in Bangkok: The Root Causes and Strategic Options” (MSc thesis, Chulalongkorn University, 2021), 59, 94." },
  { n: 9, text: "Ministerial Regulation No. 11 B.E. 2528 (1985), ข้อ 2, issued under the Building Control Act B.E. 2522. The practical threshold at which an adaptation reverts to current code, and the code revision now under way, are as reported by Chatpong Chuenrudeemol from the studio's discussions with the reviewing agency; neither is yet published, and both should be confirmed before being relied on." },
];
