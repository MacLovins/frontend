export const labels = {
  fit: "ICP fit",
  signals: "Buying signals",
  blockers: "Blockers",
  priority: "Priority",
  whyNow: "Why now",
  analyze: "Analyze",
  prospects: "Prospects",
  runs: "Runs",
  accounts: "Accounts",
  discover: "Discover",
  settings: "Settings",
  services: "Services",
  questions: "Questions",
  icp: "ICP",
  rules: "Rules",
  scoring: "Scoring",
  sources: "Sources",
  precision: "Signal precision",
  emptyLeads: "No leads yet. Analyze the demo accounts.",
  emptyFilters: "No leads match these filters.",
  forbidden: "You do not have access to this page.",
  signIn: "Sign in",
  signOut: "Sign out",
  loading: "Loading…",
  retry: "Try again",
  save: "Save",
  add: "Add",
  delete: "Delete",
  reanalyze: "Re-analyze",
  correct: "Correct",
  wrong: "Wrong",
  irrelevant: "Not relevant",
  new: "NEW",
} as const

export const tiers = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
  disqualified: "Disqualified",
} as const

export const stages = [
  "resolving",
  "collecting",
  "indexing",
  "prefiltering",
  "extracting",
  "verifying",
  "scoring",
  "done",
] as const

export const stageLabels: Record<(typeof stages)[number], string> = {
  resolving: "Resolving",
  collecting: "Collecting",
  indexing: "Indexing",
  prefiltering: "Prefiltering",
  extracting: "Extracting",
  verifying: "Verifying",
  scoring: "Scoring",
  done: "Done",
}

export const categories = {
  automation: "Automation & AI projects",
  hiring: "Hiring",
  capability: "In-house capability",
  cost: "Cost reduction program",
  leadership: "New leadership",
} as const
