/* ==========================================================================
   All site copy and data.
   Edit this file to change the site's content; nothing else should need to
   be touched. Copy is final per the design handoff — figures in `rates` in
   particular must not be altered without A.C.'s say-so.
   ========================================================================== */

export const site = {
  name: "A.C. Cotton",
  wordmark: "A.C. COTTON",
  role: "Voice Actor & Narrator",
  tagline: "Character work · dialects · narration · game VO",
  origin: "https://accotton.com",
  email: "narration@accotton.com",
};

/* Audible product pages, in canonical form — the session and referral
   parameters Audible hands out are per-visit and would rot, so they are
   stripped. AUDIBLE_NARRATOR is the listing of everything narrated under this
   name, which is the right link when pointing at the work as a whole. */
export const AUDIBLE_I_WASNT_ME =
  "https://www.audible.com/pd/I-Wasnt-Me-Until-I-Left-Everything-Behind-Audiobook/B0HKLHW6VZ";
export const AUDIBLE_BOOK_OF_WISDOM =
  "https://www.audible.com/pd/B0HLQ62M3X";
export const AUDIBLE_NARRATOR =
  "https://www.audible.com/search?searchNarrator=A.C.+Cotton";

/* Order drives the prev/next stepper. Stepping off either end returns to
   the hub, labelled "Menu". */
export const order = ["about", "reels", "credits", "rates", "contact", "updates"];

export const labels = {
  hub: "Menu",
  about: "About",
  reels: "Demo Reels",
  credits: "Credits",
  rates: "Rates",
  contact: "Contact",
  updates: "Updates",
};

export const routes = {
  hub: "/",
  about: "/about/",
  reels: "/reels/",
  credits: "/credits/",
  rates: "/rates/",
  contact: "/contact/",
  updates: "/updates/",
};

/* Per-route <title> and meta description. Sections are real URLs so they
   can be linked, shared and indexed. */
export const meta = {
  hub: {
    title: "A.C. Cotton — Voice Actor & Narrator",
    description:
      "A.C. Cotton, voice actor and narrator. Long-form audiobook narration, game and character VO, dialects. Five demo reels, rates, and direct booking.",
  },
  about: {
    title: "About — A.C. Cotton",
    description:
      "Character work, dialects and long-form narration from a quiet home studio. Shure MV7+, multiple takes, fast turnaround.",
  },
  reels: {
    title: "Demo Reels — A.C. Cotton",
    description:
      "Five long-form narration samples: folklore and horror, literary prose, historical romance, and suspense. Listen in full.",
  },
  credits: {
    title: "Credits — A.C. Cotton",
    description:
      "Audiobook narration and video game voice credits. I Wasn't Me Until I Left Everything Behind and The Book of Wisdom are out now on Audible, with Loup-Garou and Knight's Path to follow.",
  },
  rates: {
    title: "Rates — A.C. Cotton",
    description:
      "Audiobook narration from $150–$200 PFH, commercial voiceover, e-learning, game VO and character work. Custom projects quoted individually.",
  },
  contact: {
    title: "Contact & Booking — A.C. Cotton",
    description:
      "Book A.C. Cotton for audiobook, game, commercial or character voice work. Direct email, ACX and Voice123 profiles.",
  },
  updates: {
    title: "Updates — A.C. Cotton",
    description:
      "New bookings, releases and studio news from voice actor and narrator A.C. Cotton.",
  },
};

/* --- Hub -----------------------------------------------------------------
   Coordinates are in the stage's fixed 1080x480 space; each tile is centred
   on its point, so array order does not affect the desktop wheel at all.
   Array order IS the mobile order, though, and it drives tab order on both:
   reels first and contact last, matching the brief's priority of getting a
   visitor listening before asking them to book.

   `num` is the wheel's index label. It follows the desktop layout (01-03 down
   the left column, 04-06 down the right), so it is deliberately out of
   sequence here and is hidden on mobile rather than shown out of order.

   `ang` is the compass bearing each tile takes on the mobile radial menu,
   in degrees with 0 = right and increasing clockwise. Six tiles, 60 apart.
   The two paper tiles sit opposite each other on the vertical axis — Demo
   Reels at the top, Contact at the bottom — so the ring reads as balanced
   and the two calls to action anchor it, with the four steel tiles on the
   diagonals. Clockwise from the top: reels, about, credits, contact, rates,
   updates. The build turns these into the unit vectors the CSS positions
   from, and app.js matches a drag against them. */
export const nodes = [
  { key: "reels",   x: 150, y: 245, w: 250, variant: "paper", ang: -90, num: "02", note: "Start here", title: "Demo Reels", desc: "Five long-form narrations", titleSize: 34 },
  { key: "about",   x: 221, y: 125, w: 216, variant: "steel", ang: -30, num: "01", title: "About",             desc: "The voice, the range, the room" },
  { key: "credits", x: 221, y: 366, w: 216, variant: "steel", ang:  30, num: "03", title: "Credits",           desc: "Books and games on the record" },
  { key: "rates",   x: 860, y: 125, w: 216, variant: "steel", ang: 150, num: "04", title: "Rates",             desc: "What a session costs" },
  { key: "updates", x: 860, y: 366, w: 216, variant: "steel", ang: 210, num: "06", title: "Updates",           desc: "New bookings and releases" },
  { key: "contact", x: 930, y: 245, w: 250, variant: "paper", ang:  90, num: "05", title: "Contact & Booking", desc: "Brief me, or find me on ACX", titleSize: 30 },
];

export const stage = { w: 1080, h: 480, cx: 540, cy: 245 };

/* --- About --------------------------------------------------------------- */

export const about = {
  heading: "Give me a script and I'll give you options.",
  paragraphs: [
    "Grumpy tavern keeper. Small-town sheriff. The villain who is far too pleased with himself. The steady voice on the last thirty seconds of a car ad. I've been told my range is annoyingly wide, and I have decided to take that as a compliment.",
    "Most of the work is long-form: audiobooks, game NPCs, anything where one voice has to hold up over hours instead of seconds. I record at home in a room I have quietly obsessed over, and I send multiple takes every time, because the read in your head is rarely the first one out of my mouth.",
    "Two of those are out in the world: Christin Niebanck's memoir, I Wasn't Me Until I Left Everything Behind, and Elias Thorne's The Book of Wisdom. Both are on Audible, nine days apart, and I have stopped pretending I do not check the listings every morning.",
  ],
  specs: [
    { label: "Microphone", value: "Shure MV7+",      sub: "USB-C / XLR hybrid dynamic" },
    { label: "Room",       value: "Quiet home studio", sub: "Ready to record today" },
    { label: "Delivery",   value: "Multiple takes",  sub: "Fast turnaround" },
    { label: "Union status", value: "Non-union",     sub: "Available for non-union projects" },
    // PLACEHOLDER MARK: rebuilt from a screenshot, not the APA's own artwork.
    // Swap in their file as soon as they send a media kit — theirs will be
    // outlined, correctly typeset, and licensed for member use.
    { label: "Membership", value: "APA member",      sub: "Audio Publishers Association",
      logo: "/img/apa-logo.svg", logoAlt: "Audio Publishers Association" },
  ],
  chipGroups: [
    {
      heading: "Accents & dialects",
      tone: "light",
      chips: ["Irish", "British RP", "Cockney", "American Southern", "American Midwest",
              "Boston", "Transatlantic", "Australian", "Indian", "Mexican"],
    },
    {
      heading: "Character & narration",
      tone: "steel",
      chips: ["Character VO", "Video game VO", "Commercial VO", "Solo audiobook",
              "Multi-character scenes"],
    },
  ],
  cta: { label: "Hear the reels →", to: "reels" },
  listen: { label: "Both titles on Audible →", href: AUDIBLE_NARRATOR },
};

/* --- Demo reels ----------------------------------------------------------
   `file` maps to /media/<file> and to the matching key in waveforms.json. */
export const reels = [
  { n: "01", title: "Loup-Garou",                 kicker: "Long-form narration", tag: "Folklore & horror",     file: "loup-garou",
    blurb: "Werewolf folklore carried at length. Atmosphere and pacing built for a sustained listen rather than a quick clip." },
  { n: "02", title: "The Book of Wisdom",         kicker: "Long-form narration", tag: "Reflective & literary", file: "book-of-wisdom",
    blurb: "A reflective, wisdom-literature register — measured and unhurried." },
  { n: "03", title: "His Hand-Me-Down Countess", kicker: "Long-form narration", tag: "Historical romance",    file: "his-hand-me-down-countess",
    blurb: "Sorcha Mowbray's Victorian romance — warm and close, played for the people rather than the period." },
  { n: "04", title: "Knife Point",                kicker: "Audition submission", tag: "Suspense & thriller",   file: "knife-point",
    blurb: "Suspense at length, submitted for audition — tension held across a long stretch of prose." },
  { n: "05", title: "Hunting for My Obsession",   kicker: "Audition submission", tag: "Long-form narration",   file: "hunting-for-my-obsession",
    blurb: "A long-form narration sample submitted for audition." },
];

export const reelsIntro = {
  heading: "Reels, dialects & narration.",
  lede: "Folklore, literary prose, historical romance, suspense. Click a waveform to play it, click again to scrub.",
};

/* --- Credits -------------------------------------------------------------- */

export const TRAILER_URL = "https://youtu.be/qj51LFfawi0?si=ncYceXSEMIHoBTKV";

/* Ordered by how far along each title is: released first, then what is still
   being recorded. */
export const credits = {
  heading: "On the record.",
  items: [
    { medium: "Audiobook", tone: "steel", role: "Narrator — ", work: "I Wasn't Me Until I Left Everything Behind", em: true,
      listen: AUDIBLE_I_WASNT_ME,
      cover: "cover-i-wasnt-me", coverH: 120,
      coverAlt: "Cover of I Wasn't Me Until I Left Everything Behind by Christin Niebanck",
      meta: "Christin Niebanck · Memoir", status: "Out now", live: true },
    { medium: "Audiobook", tone: "steel", role: "Narrator — ", work: "The Book of Wisdom: The Hidden Order Behind All Things", em: true,
      listen: AUDIBLE_BOOK_OF_WISDOM,
      cover: "cover-book-of-wisdom", coverH: 120,
      coverAlt: "Cover of The Book of Wisdom: The Hidden Order Behind All Things by Elias Thorne",
      meta: "Elias Thorne · Esoteric non-fiction", status: "Out now", live: true },
    { medium: "Video game", tone: "dark", role: "NPC voice actor — ", work: "Knight's Path", em: true,
      trailer: true,
      // Transparent logo rather than cover art, so it carries no card or shadow.
      cover: "cover-knights-path", coverExt: "png", coverH: 102, coverPlain: true,
      coverHref: "https://www.knightspath.net",
      coverAlt: "Knight's Path logo",
      meta: "Character and dialect work · Medieval historical", status: "In production" },
    { medium: "Audiobook", tone: "steel", role: "Narrator — ", work: "Loup-Garou", em: true,
      cover: "cover-loup-garou", coverH: 132,
      coverAlt: "Cover art for Loup-Garou by Kevin Schumacher",
      meta: "Kevin Schumacher · Folklore & horror", status: "In production" },
  ],
  footnote: "More credits added as new roles are booked.",
};

/* --- Rates ---------------------------------------------------------------
   Figures are contractual. Do not alter without A.C.'s approval. */
export const rates = {
  heading: "Rates.",
  hero: { label: "Audiobook narration", figure: "$150–$200", unit: "per finished hour (PFH)" },
  cards: [
    { title: "Commercial voiceover", tiers: [
      { figure: "$150–$250", unit: "Local / regional (3-month usage)" },
      { figure: "$200–$350", unit: "Streaming / online only (YouTube, social, OTT)" },
    ]},
    { title: "Corporate / e-learning narration", tiers: [
      { figure: "$0.10–$0.15", unit: "per word" },
      { figure: "$15–$20", unit: "or per finished minute" },
    ]},
    { title: "Video game VO", tiers: [
      { figure: "From $150 / session", unit: "Session-based; custom quote based on scope" },
    ]},
    { title: "Character / animation voices", tiers: [
      { figure: "From $100", unit: "per short piece (15–30 seconds); custom quote for larger roles" },
    ]},
  ],
  custom: {
    title: "Custom projects",
    body: "Dialect, and multi-character work quoted individually based on script complexity and usage.",
  },
  cta: { label: "Request a quote", to: "contact" },
};

/* --- Contact -------------------------------------------------------------- */

export const contact = {
  heading: "Let's bring your project's voice to life.",
  lede: "Fast turnaround and a home studio ready to go. Reach out directly, find current gigs on ACX and Voice123, or follow along on Facebook.",
  links: [
    { label: "Email direct",     meta: "narration@accotton.com", href: "mailto:narration@accotton.com", tone: "dark" },
    { label: "ACX profile",      meta: "Audiobook auditions",    href: "https://www.acx.com/narrator?p=AH452LR18HLKW", external: true },
    { label: "Voice123 profile", meta: "Casting calls",          href: "https://voice123.com/voice-actor/adamcotton?vref=AO0U6HKC&utm_medium=Share&utm_campaign=Profile&utm_source=Direct", external: true },
    { label: "Facebook",         meta: "ACCottonSpeaks",         href: "https://www.facebook.com/ACCottonSpeaks", external: true },
  ],
  form: {
    label: "Project brief",
    types: ["Audiobook", "Game / character", "Commercial", "Other"],
    submit: "Send brief",
    privacy: "Briefs are emailed straight to me and used only to reply. Nothing is shared, sold, or added to a mailing list.",
  },
};

/* --- Footer ---------------------------------------------------------------
   Section pages only. The hub is a full-screen composition and a footer
   fights it. {year} is filled in at build time so the notice cannot go
   stale on its own. */
export const footer = {
  copyright: "© {year} A.C. Cotton. All rights reserved.",
  note: "Cover art and game assets remain the property of their respective publishers.",
};

/* --- Updates -------------------------------------------------------------
   Knight's Path is pinned to the top as the featured post, per A.C.; the
   audiobooks below it run newest first. Add new posts directly under it. */
export const updates = {
  heading: "Updates.",
  lede: "Short posts when a book wraps, a role is booked, or the studio changes.",
  posts: [
    { tone: "dark", medium: "Video game", status: "In production", trailer: true, date: "August 6, 2026",
      title: "Voicing NPCs for <em>Knight's Path</em>",
      body: "Guards, villagers, and a few people who would really rather you left their tavern. Dialect work across the whole cast, and the first trailer is now up." },
    { tone: "steel", medium: "Audiobook", status: "Out now", date: "October 1, 2026",
      listen: AUDIBLE_BOOK_OF_WISDOM,
      title: "<em>The Book of Wisdom</em> is out on Audible",
      body: "Elias Thorne's guide to Hermetic principles and sacred geometry, six and a half hours of it, cleared review and went live today. That is two titles out in nine days, which is not a pace I expect to keep, but I am enjoying it while it lasts." },
    { tone: "steel", medium: "Audiobook", status: "Out now", date: "September 30, 2026",
      listen: AUDIBLE_I_WASNT_ME,
      title: "<em>I Wasn't Me Until I Left Everything Behind</em> is out on Audible",
      body: "My first published audiobook. Christin Niebanck's memoir is finished, through review, and live on Audible now. The Book of Wisdom is approved by its author and sitting in ACX review behind it, so there should be two before long." },
    { tone: "steel", medium: "Audiobook", status: "In production", date: "August 18, 2026",
      title: "Narrating <em>Loup-Garou</em>",
      body: "Kevin Schumacher's werewolf folklore, full length. It is the longest stretch of sustained atmosphere I have recorded and easily the most fun to sit inside." },
    { tone: "steel", medium: "Audiobook", status: "In production", date: "August 16, 2026",
      title: "Narrating <em>I Wasn't Me Until I Left Everything Behind</em>",
      body: "Christin Niebanck's memoir. Reading someone's own life back to them needs a lighter touch than fiction, and it has been a good reminder to stay out of the way of the story." },
    { tone: "steel", medium: "Audiobook", status: "In production", date: "August 13, 2026",
      title: "Narrating <em>The Book of Wisdom</em>",
      body: "Elias Thorne's esoteric non-fiction on Hermetic principles. A completely different gear from the folklore: slow, deliberate, and entirely unbothered by the clock." },
  ],
};
