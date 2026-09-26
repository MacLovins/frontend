// Static copy for the public About pages, verbatim from the design spec (design-scoring-quality-brief.md §4.3, §5.3).

export const pains = [
  {
    eyebrow: "Pain 1 · Time",
    title: "Hours of research per account",
    body: "News, websites, reports, careers pages and LinkedIn are read one tab at a time, for every account and every service.",
  },
  {
    eyebrow: "Pain 2 · Subjectivity",
    title: "Two reps, two answers",
    body: "Relevance, recency and strength are judged from personal experience. The judgement can't be reproduced, audited or improved.",
  },
  {
    eyebrow: "Pain 3 · Timing",
    title: "The moment passes unseen",
    body: "A new COO, a cost programme or a ransomware incident is a window of a few months. One-off research misses it.",
  },
  {
    eyebrow: "Pain 4 · Offer",
    title: "Same pitch for every account",
    body: "Knowing why a company might buy, and what blocks it, decides whether to lead with automation, cybersecurity or nothing.",
  },
] as const

/** Where a step links: `icp`/`scoring` are admin settings pages, the rest are app screens. */
export type StepTarget = "icp" | "accounts" | "prospects" | "scoring"

export const steps: {
  head: string
  today: string
  ours: string
  link: string
  target: StepTarget
}[] = [
  {
    head: "1 · ICP",
    today: "Kept in people's heads and slide decks",
    ours: "Per service: countries, industries, size, revenue. Must-haves filter; nice-to-haves add weight.",
    link: "Settings → ICP",
    target: "icp",
  },
  {
    head: "2 · Accounts",
    today: "Lists built by hand in Sales Navigator",
    ours: "CSV and Crunchbase-export import, manual add, and discovery of new companies that match the ICP.",
    link: "Accounts · Discover",
    target: "accounts",
  },
  {
    head: "3 · Public data",
    today: "Dozens of tabs: news, sites, reports, careers",
    ours: "Google News, GDELT, NewsAPI, company sites and newsrooms, ATS job boards, Wikidata. Deduplicated and dated.",
    link: "Company → Sources",
    target: "prospects",
  },
  {
    head: "4 · Signals",
    today: "Skim and copy-paste what looks relevant",
    ours: "Plain-English questions per service. AI answers with a verbatim quote, and code checks the quote against the source.",
    link: "Company → Evidence",
    target: "prospects",
  },
  {
    head: "5 · Interpretation",
    today: "Gut feel on relevance, recency, strength",
    ours: "Strength rubric, source reliability, a half-life per source type, positive vs blocker, corroboration.",
    link: "Signal cards",
    target: "prospects",
  },
  {
    head: "6 · Score",
    today: "None, or a private judgement call",
    ours: "ICP fit × Buying signals × (1 − Blockers) gives Priority 0–100 and a tier. Rules exclude, cap or flag.",
    link: "Score breakdown",
    target: "scoring",
  },
  {
    head: "7 · Prioritized",
    today: "A spreadsheet that is stale by Friday",
    ours: 'Ranked list with "why now", a Fit × Signals matrix, NEW badges, outreach drafts, CSV and HubSpot.',
    link: "Prospects",
    target: "prospects",
  },
]

export const principles = [
  {
    title: "No quote, no signal",
    body: "Every signal is a verbatim quote with a link and a date. Code checks the quote exists in the source, is about this company (not a namesake or a customer) and is recent. Rejected evidence is counted, which gives a measured hallucination rate.",
  },
  {
    title: "The model reads, a formula ranks",
    body: "The LLM only extracts facts. Ranking is a transparent formula, so a change of weight re-ranks every account in under 2 seconds with zero AI calls, and the same inputs always give the same score.",
  },
  {
    title: "Blockers are first-class",
    body: "In-house automation centres, incumbent partners and financial distress are questions too. As in the Annex's Lufthansa and DHL cases, a company can be hot and blocked at once. That changes the angle of the pitch, not just the number.",
  },
  {
    title: "Configured by sales, not engineers",
    body: "A question is a sentence. Keywords in EN, DE and FR are generated for it. Presets for Intelligent Automation and Cybersecurity work out of the box, and a new market or service is a setting, not a code change.",
  },
  {
    title: "Monitoring, not a one-off search",
    body: "Tracked accounts re-run incrementally every 6 hours. AI is called only when there is new text to read. New signals get a badge, and tier changes show up in Today.",
  },
  {
    title: "Reps teach the system",
    body: "Correct, Wrong or Not relevant on every signal. Wrong removes it from the score at once, and all labels feed a precision number per category and source, visible to everyone.",
  },
] as const

export const criteria = [
  {
    pct: "25%",
    title: "Signal accuracy",
    body: "Verified quotes, namesake and vendor traps, feedback and precision. Company, Quality.",
  },
  {
    pct: "20%",
    title: "Configurability",
    body: "Services, questions, H/M/L weights, blockers, ICP, rules, scoring profile, live what-if. Settings.",
  },
  {
    pct: "20%",
    title: "AI/ML innovation",
    body: "LangGraph pipeline, hybrid retrieval, grounded extraction, decay-weighted scoring, auto keywords.",
  },
  {
    pct: "15%",
    title: "Usability",
    body: '"Why now" in plain words, tiers, a tooltip on every number, live progress, no AI jargon.',
  },
  {
    pct: "10%",
    title: "Technical execution",
    body: "Queue with checkpoints, SSE with polling fallback, caching, rate limits, incremental runs. Runs.",
  },
  {
    pct: "10%",
    title: "Business impact",
    body: "New market or service by configuration, CSV and HubSpot hand-off, usage and cost metrics.",
  },
] as const

/** Positions are percentages of the mock's 520 × 440 map so the illustration scales. */
export const mapPoints = [
  {
    name: "Intent data",
    sub: "6sense · Demandbase · Bombora",
    left: "11.54%",
    top: "75%",
    inline: false,
  },
  {
    name: "Contact data + triggers",
    sub: "ZoomInfo · Apollo · Cognism",
    left: "5.77%",
    top: "52.73%",
    inline: false,
  },
  {
    name: "Sales Navigator",
    sub: "alerts, job changes",
    left: "11.54%",
    top: "34.09%",
    inline: false,
  },
  {
    name: "CRM scoring",
    sub: "HubSpot · Einstein",
    left: "28.85%",
    top: "87.73%",
    inline: true,
  },
  {
    name: "News & filings intel",
    sub: "Feedly MI · AlphaSense",
    left: "38.46%",
    top: "15.91%",
    inline: false,
  },
  {
    name: "AI workbench",
    sub: "Clay · Claygent",
    left: "63.46%",
    top: "56.82%",
    inline: false,
  },
] as const

export const comparisonColumns = [
  "Approach",
  "How it finds signals",
  "Gap for this brief",
  "We borrow",
] as const

export const comparisonRows = [
  {
    approach: "Intent data",
    how: 'Topic research "surges" across publisher networks; predicted buying stage',
    gap: "A number without a quotable reason; topics aren't tied to one service",
    borrow: "Tiers and buying stages; activity that fades with age",
  },
  {
    approach: "Contact data + triggers",
    how: "Firmographics plus alerts on funding, hiring, leadership change",
    gap: "Generic triggers for every seller; EU contact data is GDPR-sensitive",
    borrow: "Leadership-change and hiring signals as categories",
  },
  {
    approach: "AI workbench",
    how: "A prompt per spreadsheet column; an agent browses and answers per row",
    gap: "Answers aren't verified, there's no score, decay or monitoring, and it needs prompt skills",
    borrow: "The question as the unit of configuration; one-click outreach",
  },
  {
    approach: "News & filings intel",
    how: "Custom classifiers over news, filings and reports",
    gap: "Built for analysts: feeds and search, no ICP fit or ranked list",
    borrow: "Annual reports as a source; full source transparency",
  },
  {
    approach: "Sales Navigator",
    how: "Account and lead alerts, job changes, people search",
    gap: "Closed data, no scraping allowed; people-centric, not strategy-centric",
    borrow:
      'Decision-maker roles, with a "find on LinkedIn" link and no scraping',
  },
  {
    approach: "CRM scoring",
    how: "Learns from first-party engagement and closed deals",
    gap: "Blind to accounts that were never contacted, the whole prospecting problem",
    borrow: "Stage 2: learn weights from deal outcomes; HubSpot push now",
  },
] as const

export const dontDo = [
  "Scrape LinkedIn or use its API. The app makes zero requests to linkedin.com, and a test enforces it.",
  "Build a personal contact database. We store roles to look for, not people.",
  "Train a black-box model before there are deal outcomes to learn from.",
  "Buy intent data. Every source is public, free or under a free trial.",
] as const

export const growth = [
  "Weights learned from HubSpot outcomes, explained per feature",
  "Research agent for hot accounts: a one-page account brief",
  "Question sandbox: test on 5 companies before saving",
  "Market packs (DACH, Nordics, Romania) with local sources and languages",
  "Crunchbase API once licensed; the adapter slot already exists",
] as const
