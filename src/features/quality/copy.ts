/** Signal quality screen copy (design spec §3.3), verbatim. Enum labels not listed here come from /meta/labels. */
export const qualityCopy = {
  title: "Signal quality",
  subtitle: "How often the signals are right, measured on your team's labels",
  scopeLabel: "Service",
  bothServices: "Both services",
  allServices: "All services",

  precisionLabel: "Signal precision",
  precisionSub: (labeled: string) =>
    `of ${labeled} labelled signals were correct · target 80%`,
  precisionEmptySub: "No labelled signals yet · target 80%",
  precisionHelp:
    "Share of labelled signals your team marked Correct. Wrong and Not relevant both count against it. Target: 80%.",

  inventedLabel: "Invented quotes caught",
  inventedSub: (caught: string, total: string) =>
    `${caught} of ${total} AI quotes weren't in the source and were dropped`,
  inventedEmptySub: "Nothing checked yet",
  inventedHelp:
    "Quotes the AI returned that code could not find in the source text. They were dropped before scoring.",

  documentsLabel: "Documents read today",
  documentsEmptySub: "No documents fetched yet today",
  documentsHelp:
    "Documents fetched from every source since the daily reset, for all services.",

  callsLabel: "AI calls today",
  callsSub: (pct: number) => `${pct}% answered from cache`,
  callsEmptySub: "No AI calls yet today",
  callsHelp:
    "AI model calls since the daily reset, for all services, including answers served from cache.",

  tileError: "Couldn't load",
  precisionError: "Couldn't load precision.",
  rejectedError: "Couldn't load the checker's results.",
  usageError: "Couldn't load AI usage.",

  byCategoryTitle: "Precision by signal type",
  bySourceTitle: "Precision by source",
  precisionEmpty:
    "No labels yet. Mark signals as Correct, Wrong or Not relevant to measure precision.",
  labelledCount: (labeled: number) => `${labeled} labelled signals`,
  belowTarget: (labels: string[]) =>
    `${joinQuoted(labels)} ${labels.length === 1 ? "is" : "are"} below target.`,

  reviewTitle: "Needs a human look",
  reviewLeft: (left: number) =>
    `${left} low-confidence signals left in your top 20 leads`,
  reviewConfidence: (pct: string) => `AI confidence ${pct}`,
  reviewDone: "All caught up. Your labels are counted in precision.",
  reviewError: "Couldn't load signals to review.",
  reviewShortcuts:
    "Keyboard: C marks correct, W wrong, N not relevant, S skips.",
  reviewActionsLabel: "Label this signal",
  voteError: "Couldn't save your label. Try again.",
  correct: "✓ Correct",
  wrong: "✕ Wrong",
  notRelevant: "⊘ Not relevant",
  skip: "Skip",

  rejectedTitle: "What the checker rejected",
  rejectedFooter: (rejected: string, total: string, pct: number) =>
    `${rejected} of ${total} pieces of evidence (${pct}%) never reached a score.`,
  rejectedEmpty: "Nothing rejected yet.",

  usageTitle: "AI usage today",
  usageRowHelp: (
    model: string,
    calls: number,
    cacheHits: number,
    errors: number
  ) =>
    `${model}: ${calls} calls today, ${cacheHits} from cache, ${errors} errors.`,
  usageFooter: "When a limit is hit, runs pause and resume from the same step.",
  usageResets: (time: string) => `Daily limits reset at ${time}.`,
  usageEmpty: "No AI models configured.",
  usageMeterLabel: (label: string) => `${label} calls against the daily limit`,
  usageFallback: " · fallback",

  tryAgain: "Try again",
} as const

/** `"a"`, `"a" and "b"`, `"a", "b" and "c"`. */
function joinQuoted(labels: string[]) {
  const quoted = labels.map((label) => `"${label}"`)
  if (quoted.length < 2) return quoted.join("")
  return `${quoted.slice(0, -1).join(", ")} and ${quoted[quoted.length - 1]}`
}

/** Short scope-tab names by service slug; other services show their full name. */
export const serviceTabLabels: Record<string, string> = {
  intelligent_automation: "Automation",
  cybersecurity: "Cyber",
}

/** Source rows as the Quality mock names them; unknown types fall back to /meta/labels. */
export const sourceLabels: Record<string, string> = {
  jobs: "Job postings",
  website: "Company website",
  report: "Reports",
  news: "News",
  incident: "Incidents",
  registry: "Registries",
  derived: "Derived from firmographics",
  manual: "Added manually",
}

/** The checker's reject reasons, longer than the /meta/labels wording. */
export const rejectReasonLabels: Record<string, string> = {
  wrong_subject: "About another company (customer, partner, namesake)",
  below_confidence: "Confidence below the threshold",
  quote_not_found: "Quote not found in the source",
  stale: "Too old for the question's window",
  no_evidence_for_yes: 'A "yes" without a supporting quote',
}

/** Usage rows by model pool (`/meta/usage` `models[].pool`). */
export const poolLabels: Record<string, string> = {
  main: "Main model (extraction)",
  cheap: "Light model (keywords)",
}
