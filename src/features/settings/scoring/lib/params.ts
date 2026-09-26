import type { ScoringParams } from "@/api/generated/model"

/**
 * What presets and auto-created profiles store; used when the service has no profile yet (GET 404).
 * Backend: ai/contracts.py:158-210.
 */
export const DEFAULT_PARAMS: ScoringParams = {
  weights: { high: 3, medium: 2, low: 1 },
  strength_values: { weak: 0.35, moderate: 0.65, strong: 1 },
  reliability: {
    website: 1,
    report: 1,
    jobs: 0.9,
    incident: 0.9,
    registry: 0.9,
    news: 0.8,
    derived: 0.7,
    headline_only: 0.6,
  },
  half_life_days: {
    jobs: 45,
    news: 120,
    website: 240,
    report: 365,
    incident: 270,
    registry: null,
    derived: null,
  },
  tau_intent: 5,
  tau_risk: 2,
  fit_exponent: 0.4,
  intent_exponent: 0.6,
  risk_penalty: 0.5,
  tiers: { hot: 65, warm: 40 },
  min_confidence: 0.5,
  max_evidence_per_question: 3,
  fit_floor: 20,
  undated_age_days: 90,
}

/**
 * The stored params are saved verbatim and may be partial; the engine merges them over its defaults
 * shallowly, nested objects replaced whole (core/adapters/mapping.py:169-178).
 */
export function effectiveParams(
  stored: Partial<ScoringParams> | undefined
): ScoringParams {
  return { ...DEFAULT_PARAMS, ...stored }
}

export const HALF_LIFE_KEYS = [
  "jobs",
  "news",
  "website",
  "report",
  "incident",
] as const
export type HalfLifeKey = (typeof HALF_LIFE_KEYS)[number]

export const HALF_LIFE_MIN = 1
export const HALF_LIFE_MAX = 3650

/** Whole days in range, or null for anything the backend would reject. */
export function parseHalfLife(text: string): number | null {
  if (!/^\d+$/.test(text.trim())) return null
  const days = Number(text)
  return days >= HALF_LIFE_MIN && days <= HALF_LIFE_MAX ? days : null
}

export function round1(value: number) {
  return Math.round(value * 10) / 10
}

/** Params numbers as people read them: 0.4, 2.5, 65 — no float noise, no trailing zeros. */
export function formatParam(value: number) {
  return String(Math.round(value * 100) / 100)
}

/** Share of the priority that ICP fit decides (the "ICP fit vs buying signals" slider). */
export function fitShare(params: ScoringParams) {
  const sum = params.fit_exponent + params.intent_exponent
  return sum > 0 ? params.fit_exponent / sum : 0.5
}

/** Buying signals from one fresh strong High signal on a website (reliability 1) at a typical 0.9 confidence. */
export function oneStrongSignalIntent(params: ScoringParams) {
  const points = params.weights.high * params.strength_values.strong * 0.9
  return Math.round(100 * (1 - Math.exp(-points / params.tau_intent)))
}

function sameRecord(
  a: Record<string, number | null>,
  b: Record<string, number | null>
) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return [...keys].every((key) => a[key] === b[key])
}

export function sameParams(a: ScoringParams, b: ScoringParams) {
  return (
    sameRecord(a.weights, b.weights) &&
    sameRecord(a.strength_values, b.strength_values) &&
    sameRecord(a.reliability, b.reliability) &&
    sameRecord(a.half_life_days, b.half_life_days) &&
    sameRecord(a.tiers, b.tiers) &&
    a.tau_intent === b.tau_intent &&
    a.tau_risk === b.tau_risk &&
    a.fit_exponent === b.fit_exponent &&
    a.intent_exponent === b.intent_exponent &&
    a.risk_penalty === b.risk_penalty &&
    a.min_confidence === b.min_confidence &&
    a.max_evidence_per_question === b.max_evidence_per_question &&
    a.fit_floor === b.fit_floor &&
    a.undated_age_days === b.undated_age_days
  )
}
