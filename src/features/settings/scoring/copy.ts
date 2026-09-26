import type { HalfLifeKey } from "@/features/settings/scoring/lib/params"

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? "" : "s"}`

export const copy = {
  title: "Scoring",
  subtitle: (service: string, version: number | null) =>
    version === null
      ? `${service} · default profile (not saved yet)`
      : `${service} · profile v${version} (current)`,
  reset: (version: number | null) =>
    version === null ? "Reset to defaults" : `Reset to v${version}`,
  save: (version: number | null) =>
    `Save as v${(version ?? 0) + 1} and re-score`,
  saving: "Re-scoring…",
  notFound: { title: "Service not found", action: "Back to services" },
  loadError: "Couldn't load the scoring profile",
  weights: {
    title: "How much each importance level counts",
    rows: { high: "High", medium: "Medium", low: "Low" },
    ratio: (ratio: string) => `A High question counts ${ratio}× a Low one.`,
    valueText: (value: number) => `${value} points`,
  },
  priority: {
    title: "How the priority is built",
    balance: "ICP fit vs buying signals",
    balanceHelp:
      "Left: signals decide. Right: fit decides. Both always matter, because the score multiplies them.",
    penalty: "Blocker penalty",
    penaltyHelp: (pct: number) =>
      `A company with maximum blockers loses up to ${pct}% of its priority.`,
    tau: "Signals needed for a high score",
    tauHelp: (intent: number) =>
      `One strong High signal alone gives Buying signals ${intent}. Higher values need more independent evidence before a company looks hot.`,
    confidence: "Minimum AI confidence",
    confidenceHelp: "Signals the AI is less sure about than this are ignored.",
  },
  tiers: { title: "Tiers", hot: "Hot from", warm: "Warm from" },
  halfLife: {
    title: "How fast evidence gets old",
    unit: "d",
    labels: {
      jobs: "Job postings",
      news: "News",
      website: "Website",
      report: "Reports",
      incident: "Incidents",
    },
    help: {
      jobs: (days: number) => `after ${days} days a job ad counts half`,
      news: (days: number) => `after ${days} days a news item counts half`,
      website: () => "strategy pages age slowly",
      report: (days: number) =>
        days === 365
          ? "an annual report lasts a year"
          : `after ${days} days a report counts half`,
      incident: () => "a breach keeps budgets open for months",
    } satisfies Record<HalfLifeKey, (days: number) => string>,
    inputLabel: (label: string) => `${label} half-life in days`,
  },
  notPreviewed: "Not included in the preview. Save to see the effect.",
  summary: {
    tierChanges: "tier changes",
    moved: "priorities moved",
    aiCalls: "AI calls needed",
    tierChangesHelp:
      "Companies whose tier would change if you save these settings.",
    movedHelp: "Companies whose priority would change by at least one point.",
    aiCallsHelp: "Re-scoring uses the signals already stored. No new AI calls.",
    estimate: (sample: number, total: number) =>
      `Estimated on ${sample} sample accounts. Saving re-scores all ${total} from stored signals, in under a second.`,
    empty:
      "Nothing to re-score yet. These settings apply to the next analysis.",
  },
  table: {
    label: "Ranking with these settings",
    rank: "#",
    company: "Company",
    saved: "Saved",
    preview: "Preview",
    delta: "Δ",
    tier: "Tier",
    savedHelp: (version: number | null) =>
      version === null
        ? "Priority with the default profile."
        : `Priority with the current profile v${version}.`,
    previewHelp:
      "Priority with the settings on the left, not saved yet. Estimated from stored signal strengths.",
    loadError: "Couldn't load the preview",
    empty: {
      title: "No scored companies yet",
      body: "Analyze accounts to see how these settings rank them.",
      action: "Go to Accounts",
    },
  },
  formula: {
    title: "The formula, in one line",
    priority: (fit: string, intent: string, penalty: string) =>
      `Priority = 100 × Fit^${fit} × Signals^${intent} × (1 − ${penalty} × Blockers)`,
    signals: (tau: string) =>
      `Signals = 100 × (1 − e^(−points / ${tau})), points = Σ weight × strength × confidence × source reliability × freshness. Rules apply after scoring.`,
  },
  toast: {
    rescored: (rescored: number, durationMs: number, tierChanges: number) =>
      `Rescored ${rescored} ${rescored === 1 ? "company" : "companies"} in ${(durationMs / 1000).toFixed(1)} s, ${plural(tierChanges, "tier change")}`,
    savedEmpty: (version: number) =>
      `Saved v${version}. No scored companies yet.`,
    serverError: "Couldn't save. Nothing was changed.",
  },
  leave: {
    title: "Discard unsaved changes?",
    body: "Your scoring changes haven't been saved.",
    keep: "Keep editing",
    discard: "Discard",
  },
}
