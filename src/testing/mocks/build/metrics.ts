/**
 * Seed: signal-quality baseline (Quality artboard: 124 labels, by category and by source), verifier
 * rejections (540 pieces of evidence, 12 quotes not found) and today's LLM usage.
 */
import { SERVICE_CYBER_ID, SERVICE_IA_ID } from "../data/ids"
import type { DbState, ModelUsageCounters, QualityCell } from "../types"

type Cell = [
  service: "ia" | "cyber",
  category: string,
  source: string,
  labeled: number,
  correct: number,
]

/** Historic signal labels whose signals are no longer stored individually. */
const BASELINE: Cell[] = [
  ["ia", "hiring", "jobs", 22, 21],
  ["ia", "ai_automation", "website", 12, 12],
  ["ia", "ai_automation", "news", 14, 11],
  ["ia", "leadership_change", "news", 10, 8],
  ["ia", "leadership_change", "jobs", 3, 3],
  ["ia", "cost_efficiency", "news", 12, 9],
  ["ia", "cost_efficiency", "report", 6, 5],
  ["ia", "cost_efficiency", "website", 2, 2],
  ["ia", "internal_capability", "website", 11, 9],
  ["ia", "internal_capability", "news", 4, 1],
  ["cyber", "hiring", "jobs", 8, 7],
  ["cyber", "compliance", "report", 3, 3],
  ["cyber", "compliance", "website", 6, 5],
  ["cyber", "compliance", "news", 6, 5],
  ["cyber", "leadership_change", "news", 5, 4],
]

const REJECTED: Record<string, Record<string, number>> = {
  [SERVICE_IA_ID]: {
    wrong_subject: 22,
    below_confidence: 14,
    quote_not_found: 8,
    stale: 6,
  },
  [SERVICE_CYBER_ID]: {
    wrong_subject: 9,
    below_confidence: 6,
    quote_not_found: 4,
    stale: 2,
  },
}

const EVIDENCE_TOTAL: Record<string, number> = {
  [SERVICE_IA_ID]: 380,
  [SERVICE_CYBER_ID]: 160,
}

export function seedMetrics(state: DbState): void {
  const cells: QualityCell[] = BASELINE.map(
    ([service, category, source_type, labeled, correct]) => ({
      service_id: service === "ia" ? SERVICE_IA_ID : SERVICE_CYBER_ID,
      category,
      source_type,
      labeled,
      correct,
    })
  )
  // The seeded votes on stored signals are part of the design's 124 labels: take them out of the baseline.
  for (const fb of state.feedback) {
    if (fb.target_type !== "signal") continue
    const signal = state.signals.find((s) => s.id === fb.target_id)
    if (!signal) continue
    const doc = signal.document_id
      ? state.documents.find((d) => d.id === signal.document_id)
      : undefined
    const source = doc?.source_type ?? signal.source_type
    const cell = cells.find(
      (c) =>
        c.service_id === fb.service_id &&
        c.category === signal.category &&
        c.source_type === source
    )
    const correct = fb.verdict === "correct" ? 1 : 0
    if (
      cell &&
      cell.labeled > 0 &&
      cell.correct >= correct &&
      cell.labeled - 1 >= cell.correct - correct
    ) {
      cell.labeled -= 1
      cell.correct -= correct
    }
  }
  state.qualityBaseline = cells
  state.rejectedEvidence = structuredClone(REJECTED)
  state.historicEvidence = {}
  for (const [serviceId, total] of Object.entries(EVIDENCE_TOTAL)) {
    const stored = state.signals.filter(
      (s) => s.service_id === serviceId
    ).length
    const rejected = Object.values(REJECTED[serviceId]).reduce(
      (a, b) => a + b,
      0
    )
    state.historicEvidence[serviceId] = Math.max(0, total - stored - rejected)
  }
}

/** "Main model (extraction) 38 / 250", "Light model (keywords) 12 / 1000", 41% cache hits. */
export function seedUsage(): ModelUsageCounters[] {
  return [
    {
      model: "gemini-2.5-flash",
      pool: "main",
      calls: 65,
      cache_hits: 27,
      errors: 1,
      input_tokens: 486_200,
      output_tokens: 41_350,
      rpd_limit: 250,
      rpm_limit: 10,
    },
    {
      model: "gemini-2.5-flash-lite",
      pool: "cheap",
      calls: 20,
      cache_hits: 8,
      errors: 0,
      input_tokens: 18_400,
      output_tokens: 5_120,
      rpd_limit: 1000,
      rpm_limit: 30,
    },
  ]
}
