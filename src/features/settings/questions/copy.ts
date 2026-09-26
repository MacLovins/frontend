import type { SourceType, Weight } from "@/api/generated/model"

/** "1 question", "3 questions". */
export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`
}

export const copy = {
  title: "Signal questions",
  suggest: "Suggest questions",
  newQuestion: "New question",
  editQuestion: "Edit question",

  banner: {
    title: (count: number) => `${plural(count, "question")} changed.`,
    body: (companies: number) =>
      `${plural(companies, "company", "companies")} ${companies === 1 ? "was" : "were"} analysed with the old wording. Weight changes apply instantly; wording changes need a re-analysis.`,
    action: (companies: number) =>
      `Re-analyze ${plural(companies, "company", "companies")}`,
  },
  rescored: "Weight saved. Ranking re-scored with no AI calls.",

  table: {
    heads: [
      "Question",
      "Signal type",
      "+/−",
      "Weight",
      "Where to look",
      "Window",
      "Keywords",
    ],
    turnedOff: (count: number) => `${plural(count, "question")} turned off`,
    show: "Show",
    hide: "Hide",
    loadError: "Could not load questions.",
  },
  empty: {
    title: "No questions yet.",
    body: (service: string) =>
      `Ask what would make a company likely to buy ${service}.`,
  },
  notFound: {
    title: "Service not found",
    action: "Go to Services",
  },

  keywordStatus: {
    ready: "Ready",
    pending: "Generating…",
    stalled: "Still pending",
    failed: "Failed",
    fresh: "New · ready",
    readyLanguages: (count: number) => `Ready · ${plural(count, "language")}`,
  },

  sheet: {
    text: "Ask it like you'd ask a colleague",
    textHelp:
      "Good questions name something observable: a programme, a hire, a system, a place or a date.",
    category: "Signal type",
    effect: "Effect",
    importance: "Importance",
    window: "Only count evidence from the last",
    sources: "Where to look",
    keywords: "Search terms, generated",
    keywordsPlaceholder:
      "Search terms are generated after you save, in the languages of your ICP markets. It usually takes a few seconds.",
    keywordsFootnote:
      "Jobs and Not chips are editable. These only decide which passages the AI reads; they never create a signal on their own.",
    jobsCode: "Jobs",
    notCode: "Not",
    addJobTitle: "Job title",
    addTerm: "Term",
    regenerate: "Regenerate",
    cancel: "Cancel",
    create: "Save question",
    save: "Save changes",
    saving: "Saving…",
    turnOff: "Turn off question",
    turnOn: "Turn back on",
    noteCreate: "Companies pick up a new question on their next analysis.",
    noteWording: (companies: number) =>
      `Wording changes need a re-analysis of ${plural(companies, "company", "companies")}.`,
    noteWeight: "Weight changes re-score instantly with no AI calls.",
  },

  confirm: {
    turnOffTitle: (label: string) => `Turn off "${label}"?`,
    turnOffBody: "It stops counting in the ranking. Its evidence is kept.",
    turnOffAction: "Turn off",
    discardTitle: "Discard changes?",
    discardAction: "Discard",
    cancel: "Cancel",
  },

  validation: {
    text: "Write the question as a full sentence.",
    sources: "Pick at least one place to look.",
  },

  toasts: {
    saved: "Question saved. Search terms are generating.",
    savedPlain: "Question saved.",
    turnedOff: "Question turned off",
    turnedOn: "Question turned back on",
    regenerating: "Search terms are regenerating.",
    added: (questions: number, rules: number) =>
      `Added ${plural(questions, "question")} and ${plural(rules, "rule")}. Search terms are generating.`,
    addFailed: (count: number, reason: string) =>
      `${plural(count, "suggestion")} could not be added. ${reason}`,
    quota: "AI quota used up for today. Try again after the daily reset.",
    unavailable: "AI is unavailable right now. Try again in a minute.",
    noSuggestions:
      "No suggestions this time. Try adding more detail to the service description.",
  },

  suggestions: {
    title: "Suggested questions",
    intro:
      "Drafted from the service description and ICP. Nothing is saved until you add it.",
    loading: "Drafting questions… this can take up to 20 seconds.",
    questions: "Questions",
    rules: "Rules",
    needs: (label: string) => `Needs the question "${label}"`,
    selected: (count: number) => `${count} selected`,
    add: (count: number, service: string) => `Add ${count} to ${service}`,
    adding: "Adding…",
  },
}

export const polarityCopy = {
  positive: { mark: "✓ +", option: "✓ Buying signal", name: "Buying signal" },
  negative: { mark: "⚠ −", option: "⚠ Blocker", name: "Blocker" },
} as const

export const weightOrder: Weight[] = ["high", "medium", "low"]
export const weightNames: Record<Weight, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
}
export const weightLetters: Record<Weight, string> = {
  high: "H",
  medium: "M",
  low: "L",
}

/** Sources an admin can pick; `derived` and `manual` are set by the system only. */
export const selectableSources = [
  "news",
  "website",
  "jobs",
  "report",
  "registry",
  "incident",
] as const satisfies readonly SourceType[]
type SelectableSource = (typeof selectableSources)[number]

export const sourceLongLabels: Record<SelectableSource, string> = {
  news: "News",
  website: "Company website",
  jobs: "Job postings",
  report: "Annual reports",
  registry: "Registries",
  incident: "Incident databases",
}

export const sourceShortLabels: Record<SelectableSource, string> = {
  news: "News",
  website: "Website",
  jobs: "Jobs",
  report: "Reports",
  registry: "Registries",
  incident: "Incidents",
}

export function isSelectableSource(
  source: SourceType
): source is SelectableSource {
  return selectableSources.some((item) => item === source)
}

export const windowOptions = [
  { value: 30, label: "1 month" },
  { value: 90, label: "3 months" },
  { value: 180, label: "6 months" },
  { value: 365, label: "12 months" },
  { value: 540, label: "18 months" },
  { value: 730, label: "24 months" },
]
