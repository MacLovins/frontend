/**
 * The one place for plain-language UI copy (SPEC §1.8). Enum labels (categories, source types, stages…)
 * come from GET /meta/labels via `useLabels`; this file holds wording the API does not serve.
 */
import type { SourceType, Tier } from "@/api/generated/model"

export const metricLabels = {
  fit: "ICP fit",
  intent: "Buying signals",
  risk: "Blockers",
  priority: "Priority",
} as const

export const metricShortLabels = {
  fit: "Fit",
  intent: "Signals",
  risk: "Blockers",
} as const

export const metricHelp = {
  fit: "How well the company matches the ideal customer profile for this service",
  intent: "Strength of recent evidence that the company needs this service; older evidence counts less",
  risk: "Evidence that makes a sale harder: in-house teams, incumbent partners, financial distress",
  priority: "ICP fit × Buying signals, lowered by Blockers. 0–100, higher means contact sooner",
} as const

export const tierLabels: Record<Tier, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
  disqualified: "Disqualified",
}

export const tierChipLabels: Record<Tier, string> = {
  hot: "Hot · contact now",
  warm: "Warm · nurture",
  cold: "Cold · watch",
  disqualified: "Disqualified",
}

export const tierOrder: Tier[] = ["hot", "warm", "cold", "disqualified"]

/** "What was scanned" names, plural (Company card and Sources tabs). */
export const sourceTypeNames: Record<SourceType, string> = {
  jobs: "Job postings",
  news: "News articles",
  website: "Company website pages",
  report: "Annual reports",
  registry: "Company registry",
  incident: "Security incidents",
  derived: "Derived from company data",
  manual: "Added by hand",
}

/** Pipeline stages in order, as the Runs stepper draws them. */
export const runStages = [
  "resolving",
  "collecting",
  "indexing",
  "prefiltering",
  "extracting",
  "verifying",
  "scoring",
  "done",
] as const
export type RunStage = (typeof runStages)[number]

export const roleLabels = { admin: "Admin", sales: "Sales" } as const

/** Last-resort label for an enum value the dictionary does not know: `rejected_by_user` → "Rejected by user". */
export function humanize(value: string) {
  const text = value.replace(/[_-]+/g, " ").trim()
  return text ? text[0].toUpperCase() + text.slice(1) : value
}
