import type { ScoringParams } from "@/api/generated/model"

/**
 * The backend's own defaults (ai/contracts.py ScoringProfile), used when a service has no scoring profile
 * row yet (GET /services/{id}/scoring-profile answers 404). Explanatory text only: scores come from the API.
 */
export const scoringDefaults = {
  weights: { high: 3, medium: 2, low: 1 },
  fit_exponent: 0.4,
  intent_exponent: 0.6,
  risk_penalty: 0.5,
  tiers: { hot: 65, warm: 40 },
} satisfies Partial<ScoringParams>

export type ScoringExplainParams = typeof scoringDefaults

export function explainParams(
  params: ScoringParams | undefined
): ScoringExplainParams {
  return {
    weights: params?.weights ?? scoringDefaults.weights,
    fit_exponent: params?.fit_exponent ?? scoringDefaults.fit_exponent,
    intent_exponent: params?.intent_exponent ?? scoringDefaults.intent_exponent,
    risk_penalty: params?.risk_penalty ?? scoringDefaults.risk_penalty,
    tiers: params?.tiers ?? scoringDefaults.tiers,
  }
}
