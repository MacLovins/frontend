/** /meta/* (backend core/modules/meta). */
import type {
  CountryOut,
  IndustryOut,
  LabelsOut,
  ModelUsageOut,
  PresetOut,
  UsageOut,
} from "@/api/generated/model"

import { COUNTRIES, INDUSTRIES, LABELS } from "../data/meta"
import { PRESETS } from "../data/presets"
import { pacificDay } from "../data/time"
import { db } from "../db"
import { json, route } from "./http"

export function presetsOut(): PresetOut[] {
  return PRESETS.map((p) => ({
    key: p.key,
    name: p.name,
    description: p.description,
    questions_count: p.questions.length,
    categories: [...new Set(p.questions.map((q) => q.category))].sort(),
  }))
}

function usage(): UsageOut {
  const now = new Date()
  const day = pacificDay(now)
  const models: ModelUsageOut[] = db.usage.map((m) => {
    const quota = m.calls - m.cache_hits
    return {
      model: m.model,
      pool: m.pool,
      calls: m.calls,
      quota_calls: quota,
      cache_hits: m.cache_hits,
      errors: m.errors,
      input_tokens: m.input_tokens,
      output_tokens: m.output_tokens,
      rpd_limit: m.rpd_limit,
      rpm_limit: m.rpm_limit,
      remaining: Math.max(0, m.rpd_limit - quota),
    }
  })
  const bySource: Record<string, number> = {}
  let scanned = 0
  for (const d of db.documents) {
    if (new Date(d.fetched_at).getTime() < day.startMs) continue
    scanned += 1
    bySource[d.source_type] = (bySource[d.source_type] ?? 0) + 1
  }
  return {
    day_start: day.start,
    resets_at: day.resets,
    llm_calls_24h: models.reduce((a, m) => a + m.calls, 0),
    input_tokens_24h: models.reduce((a, m) => a + m.input_tokens, 0),
    output_tokens_24h: models.reduce((a, m) => a + m.output_tokens, 0),
    documents_scanned_24h: scanned,
    models,
    documents_by_source: bySource,
  }
}

export const metaHandlers = [
  route("get", "/meta/industries", () => json<IndustryOut[]>(INDUSTRIES)),
  route("get", "/meta/countries", () => json<CountryOut[]>(COUNTRIES)),
  route("get", "/meta/presets", () => json<PresetOut[]>(presetsOut())),
  route("get", "/meta/labels", () => json<LabelsOut>(LABELS)),
  route("get", "/meta/usage", () => json<UsageOut>(usage())),
]
