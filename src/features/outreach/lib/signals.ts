import type {
  LeadDetail,
  LeadService,
  SignalCategory,
  SignalItem,
} from "@/api/generated/model"

import {
  atsCollectors,
  collectorLabels,
  siteCollectors,
} from "@/features/outreach/copy"

/** The outreach worker writes from the top 5 active signals by confidence (backend outreach/service.py:121-137). */
const WORKER_SIGNAL_LIMIT = 5

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

/** "Workday careers", "dhl.com", "Google News", or the raw name (derived "NIS2 scope (firmographics)"). */
export function sourceLabel(signal: Pick<SignalItem, "source_name" | "url">) {
  const name = signal.source_name
  if (atsCollectors.has(name)) return `${collectorLabels[name]} careers`
  if (siteCollectors.has(name) && signal.url) return hostname(signal.url)
  return collectorLabels[name] ?? name
}

/** The card's service, or undefined when the org has none (the API then sends `{}`). */
export function cardService(detail: LeadDetail): LeadService | undefined {
  const { id, name } = detail.service
  return typeof id === "string" && typeof name === "string"
    ? { id, name }
    : undefined
}

export function allSignals(detail: LeadDetail) {
  return detail.signals_by_question.flatMap((group) => group.signals)
}

/** The evidence the worker will use, in the same order it picks it. */
export function workerEvidence(detail: LeadDetail) {
  return [...allSignals(detail)]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, WORKER_SIGNAL_LIMIT)
}

/** Categories of the blocker questions that have evidence on this card. */
export function blockerCategories(detail: LeadDetail): SignalCategory[] {
  const categories = detail.signals_by_question
    .filter(
      (group) =>
        group.question.polarity === "negative" && group.signals.length > 0
    )
    .map((group) => group.question.category)
  return [...new Set(categories)]
}
