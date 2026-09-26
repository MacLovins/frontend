import type { DocumentOut, LeadDetail } from "@/api/generated/model"

import type { RejectedSignal } from "./lead-card"
import { normalizeUrl } from "./text"

type Tally = { active: number; rejected: number; irrelevant: number }

export type SignalTallies = ReadonlyMap<string, Tally>

export type DocumentUsage =
  | { kind: "signals"; count: number }
  | { kind: "rejected" }
  | { kind: "irrelevant" }
  | { kind: "firmographics" }
  | { kind: "none" }

/**
 * Signals of the selected service per normalized URL. Documents carry no signal count in the API, so
 * "Used" is derived by matching signal URLs to the document's URL or canonical URL.
 */
export function signalTallies(
  detail: LeadDetail,
  rejected: ReadonlyMap<string, RejectedSignal>
): SignalTallies {
  const signals = new Map(
    detail.signals_by_question.flatMap((group) =>
      group.signals.map((signal) => [signal.id, signal] as const)
    )
  )
  for (const { signal } of rejected.values()) signals.set(signal.id, signal)

  const tallies = new Map<string, Tally>()
  for (const signal of signals.values()) {
    if (!signal.url) continue
    const key = normalizeUrl(signal.url)
    const tally = tallies.get(key) ?? { active: 0, rejected: 0, irrelevant: 0 }
    if (signal.my_feedback === "incorrect") tally.rejected += 1
    else if (signal.my_feedback === "irrelevant") tally.irrelevant += 1
    else tally.active += 1
    tallies.set(key, tally)
  }
  return tallies
}

export function documentUsage(
  document: DocumentOut,
  tallies: SignalTallies
): DocumentUsage {
  const keys = new Set([
    normalizeUrl(document.url),
    normalizeUrl(document.canonical_url),
  ])
  const total: Tally = { active: 0, rejected: 0, irrelevant: 0 }
  for (const key of keys) {
    const tally = tallies.get(key)
    if (!tally) continue
    total.active += tally.active
    total.rejected += tally.rejected
    total.irrelevant += tally.irrelevant
  }
  if (total.active) return { kind: "signals", count: total.active }
  if (total.rejected) return { kind: "rejected" }
  if (total.irrelevant) return { kind: "irrelevant" }
  if (document.source_type === "registry") return { kind: "firmographics" }
  return { kind: "none" }
}
