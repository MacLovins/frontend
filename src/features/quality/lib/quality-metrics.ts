import type {
  ModelUsageOut,
  UsageOut,
  VerifierStats,
} from "@/api/generated/model"

import { poolLabels, qualityCopy } from "../copy"

/** Mirrors the backend eval gate (ai/evals/report.py:8). */
const PRECISION_TARGET = 0.8
/** Fewer labels than this make a precision number noise, so the row is never flagged. */
const MIN_LABELS_FOR_TARGET = 5

export type PrecisionRow = {
  key: string
  label: string
  labeled: number
  precision: number
}
export type PrecisionStatus = "ok" | "below" | "few"

export function precisionStatus(row: PrecisionRow): PrecisionStatus {
  if (row.labeled < MIN_LABELS_FOR_TARGET) return "few"
  return row.precision < PRECISION_TARGET ? "below" : "ok"
}

/** The API sorts by labels; the design ranks by precision, ties by labels. */
export function byPrecision(a: PrecisionRow, b: PrecisionRow) {
  return b.precision - a.precision || b.labeled - a.labeled
}

export function rejectedRows(verifier: VerifierStats) {
  const rows = Object.entries(verifier.rejected)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
  const total = rows.reduce((sum, [, count]) => sum + count, 0)
  const pct =
    verifier.evidence_total > 0
      ? Math.round((total / verifier.evidence_total) * 100)
      : 0
  return { rows, total, pct }
}

export type UsageRow = { key: string; label: string; model: ModelUsageOut }

/** Pool models always show; other models only once they were called. A second model in a pool is its fallback. */
export function usageRows(models: ModelUsageOut[]): UsageRow[] {
  const seenPools = new Set<string>()
  return models
    .filter((model) => model.pool || model.calls > 0)
    .map((model) => {
      if (!model.pool) return { key: model.model, label: model.model, model }
      const base = poolLabels[model.pool] ?? model.model
      const label = seenPools.has(model.pool)
        ? `${base}${qualityCopy.usageFallback}`
        : base
      seenPools.add(model.pool)
      return { key: model.model, label, model }
    })
}

export function cachePercent(usage: UsageOut) {
  const calls = usage.models.reduce((sum, model) => sum + model.calls, 0)
  const hits = usage.models.reduce((sum, model) => sum + model.cache_hits, 0)
  return calls > 0 ? Math.round((hits / calls) * 100) : 0
}

export function topDocumentSources(usage: UsageOut, limit = 3) {
  return Object.entries(usage.documents_by_source)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
}

const clock = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

/** The quota day resets at midnight Pacific; show it in the viewer's time. */
export function resetTime(iso: string) {
  return clock.format(new Date(iso))
}
