import type { RunKind, RunStatus } from "@/api/generated/model"

/** "1 company", "4 companies". */
export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`
}

export const kindLabels: Record<RunKind, string> = {
  analyze: "Analyze",
  refresh: "Monitoring",
  rescore: "Re-score",
  discover: "Discover",
}

// `pending` is the scheduler's queued state (backend worker/scheduled.py:95).
export const runStatusLabels: Record<RunStatus, string> = {
  queued: "Queued",
  pending: "Queued",
  running: "Running",
  succeeded: "Done",
  partial: "Partial",
  failed: "Failed",
  cancelled: "Cancelled",
}

export const runStatusText: Record<RunStatus, string> = {
  queued: "text-link-hover",
  pending: "text-link-hover",
  running: "text-link-hover",
  succeeded: "text-positive-strong",
  partial: "text-warning-strong",
  failed: "text-negative-strong",
  cancelled: "text-muted-foreground",
}

/** Short service names for dense lines ("IA · 37 snippets selected"); other services use their name. */
export const serviceShortLabels: Record<string, string> = {
  intelligent_automation: "IA",
  cybersecurity: "Cyber",
}

export const stepLabels = [
  "Resolve",
  "Collect",
  "Index",
  "Shortlist",
  "Extract",
  "Verify",
  "Score",
  "Done",
] as const

export const stepGlossary: [term: string, text: string][] = [
  [
    "Resolve",
    "find the website, careers page and job board, and registry data",
  ],
  ["Collect", "news, site pages, reports and job ads, deduplicated"],
  ["Index", "split into passages and index them for search"],
  [
    "Shortlist",
    "pick at most 40 passages per service that match the questions",
  ],
  ["Extract", "one AI call per service: answers with quotes"],
  ["Verify", "code checks every quote, the company and the date"],
  ["Score", "formula and rules, no AI"],
]

export const copy = {
  runs: "Runs",
  run: "Run",
  live: "Live",
  polling: "Updating every 3 s",
  connecting: "Connecting…",

  progress: {
    done: "companies done",
    counts: (failed: number, paused: number) =>
      `· ${failed} failed · ${paused} paused`,
    leave: "You can leave this page; the run continues.",
    aria: "Companies done",
  },

  showMore: (count: number) => `Show ${count} more`,
  companyUnavailable: "Company unavailable",
  tryAgain: "Try again",

  glossaryTitle: "What each step does",
  recentTitle: "Recent runs",
  recentEmpty: "No other runs yet.",
  recentError: "Could not load recent runs.",
  startAnalysis: "Start analysis",
  eventLogTitle:
    "Event stream (for admins) · reconnects with Last-Event-ID, falls back to polling",

  cancel: {
    action: "Cancel run",
    title: "Cancel this run?",
    body: "Companies that are already done keep their results. The others stop after their current step.",
    keep: "Keep running",
  },

  retry: {
    paused: "Retry paused",
    failed: "Retry failed",
    both: "Retry failed and paused",
    started: (count: number) =>
      `Retrying ${plural(count, "company", "companies")}`,
  },

  finished: {
    succeeded: (done: number) =>
      `Run finished: ${plural(done, "company", "companies")} analysed`,
    partial: (done: number, paused: number, failed: number) =>
      `Run finished: ${done} done, ${paused} paused, ${failed} failed`,
    failed: "Run failed",
    cancelled: "Run cancelled",
  },

  message: {
    queued: "Waiting for a free worker",
    notStarted: "The run was cancelled before this company started.",
    resolved: (domain: string, ownDomains: number) =>
      `Resolved ${domain}${ownDomains > 0 ? ` · ${plural(ownDomains, "own domain")}` : ""}`,
    collecting: (sources: string) => `Collecting from ${sources}`,
    aiCalls: (count: number) => plural(count, "AI call"),
    priority: (priority: number, tier: string) =>
      `Priority ${priority} (${tier})`,
    result: (scores: string) => `Result: ${scores}`,
    pausedUntil: (time: string) =>
      `The daily AI quota is used up. The run resumes from this step after the reset at ${time}, or when you press Retry paused.`,
    pausedAuto:
      "The daily AI quota is used up. The run resumes from this step automatically, or when you press Retry paused.",
  },

  notFound: "This run does not exist or was deleted.",
  allRuns: "All runs",

  empty: {
    title: "No runs yet",
    body: "Analyses you start from Prospects, Accounts or Discover show up here with live progress.",
    accounts: "Go to accounts",
  },

  start: {
    title: "Start analysis",
    body: (count: number, service: string) =>
      `Collect fresh evidence and re-score ${plural(count, "tracked account")} for ${service}. You can keep working; progress continues on Runs.`,
    limited: (limit: number) =>
      `A run takes at most ${limit} companies; the ${limit} most recently added are included.`,
    full: "Full refresh (ignore cached results)",
    noAccounts: "No tracked accounts yet",
    noAccountsBody:
      "Track companies on Accounts first, then analyze them here.",
    accounts: "Go to accounts",
    cancel: "Cancel",
    submit: "Start analysis",
    started: "Analysis started",
  },
} as const
