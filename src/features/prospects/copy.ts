/** Prospects and Fit × Signals copy, verbatim from the design (design-shell-prospects-matrix.md, F3). */
export const prospectsCopy = {
  title: "Prospects",
  allTiers: "All tiers",
  tierFilterLabel: "Filter by tier",
  serviceTabsLabel: "Service",
  search: "Search company or domain",
  searchAria: "Search companies",
  market: "Market",
  industry: "Industry",
  newThisWeek: "New signals this week",
  newThisWeekTip: "Companies with signals first found in the last 7 days",
  minPriority: "Min priority",
  clearFilters: "Clear filters",
  exportCsv: "Export CSV",
  analyze: "Analyze",
  precision: "Signal precision",
  labelsSuffix: "labels",
  noLabels: "No labels yet",
  precisionTip:
    "Share of signals your team marked Correct, out of all signals they rated.",
  colRank: "#",
  colCompany: "Company",
  colPriority: "Priority",
  colBars: "Fit · Signals · Blockers",
  colWhy: "Why now",
  colSignals: "Signals",
  noSignals: "No signals yet",
  perPage: "50 per page",
  previous: "Previous",
  next: "Next",
  noLeadsTitle: "No leads yet",
  noLeadsBody: "Analyze your accounts to rank them by fit and buying signals.",
  analyzeAccounts: "Analyze accounts",
  addAccounts: "Add accounts",
  noMatches: "No leads match these filters.",
  loadError: "Could not load prospects.",
} as const

export const matrixCopy = {
  title: "Fit × Buying signals",
  accounts: "accounts",
  intro:
    "Ranking multiplies fit and signals instead of adding them, so a perfect-fit company with no signals and a hyperactive company outside the ICP both rank low. Click a dot to see why it sits there.",
  quadrants: {
    wrongMoment: {
      title: "Right company, wrong moment",
      sub: "Monitor. Alerts fire when signals appear.",
    },
    contactNow: { title: "Contact now", sub: "High fit, fresh signals" },
    deprioritise: { title: "Deprioritise" },
    weakFit: {
      title: "Strong signals, weak fit",
      sub: "Check whether the ICP is too narrow",
    },
  },
  xAxis: "Buying signals →",
  yAxis: "ICP fit →",
  legendRisk: "Blockers ≥ 30",
  legendOther: "Other accounts",
  cappedNote: "Showing the top 500 accounts by priority",
  selected: "Selected",
  priority: "Priority",
  fit: "Fit",
  signals: "Signals",
  blockers: "Blockers",
  noReasons: "No buying signals found yet.",
  openCompany: "Open company",
  howTo: "How to read the quadrants",
  howToLines: [
    {
      lead: "Contact now:",
      text: "call this week. Why-now reasons are fresh, so lead with them.",
    },
    {
      lead: "Wrong moment:",
      text: "ideal customers with nothing happening. Keep them monitored; a new CIO or a cost programme moves them right.",
    },
    {
      lead: "Weak fit:",
      text: "real activity outside the ICP. Several of these in one industry suggest widening the ICP.",
    },
  ],
  emptyTitle: "Nothing to plot yet",
  emptyBody: "Analyze accounts to place them on the matrix.",
  loadError: "Could not load the matrix.",
} as const

export const viewCopy = {
  label: "View",
  list: "List",
  matrix: "Fit × Signals",
} as const

export const analyzeCopy = {
  title: "Analyze accounts",
  fullRefresh: "Full refresh (ignore cached results)",
  cancel: "Cancel",
  start: "Start analysis",
  started: "Analysis started",
  noTracked: "No tracked accounts yet",
  noTrackedBody: "Track accounts first, then analyze them to rank them here.",
  goToAccounts: "Go to Accounts",
  loadError: "Could not load your tracked accounts.",
} as const

export const noServicesCopy = {
  title: "No services yet",
  create: "Create a service",
  askAdmin: "Ask an admin to set up a service.",
} as const
