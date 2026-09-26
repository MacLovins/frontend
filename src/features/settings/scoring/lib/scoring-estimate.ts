import type {
  Contribution,
  Polarity,
  RuleHit,
  ScoreSummary,
  ScoringParams,
  Tier,
  Weight,
} from "@/api/generated/model"

import { round1 } from "@/features/settings/scoring/lib/params"

/*
 * The backend has no scoring dry-run (core/modules/config/router.py only has GET/PUT scoring-profile), so the
 * what-if preview is a labelled client estimate on a sample. It mirrors ai/scoring/engine.py:37-60,103-185 for the
 * parameters that do not need per-signal data: weights, tau, exponents, blocker penalty and tiers. Each question's
 * strength s_q comes from the stored breakdown, so half-lives and min confidence cannot be previewed here.
 */

export type SampleLead = {
  companyId: string
  name: string
  score: ScoreSummary
  breakdown: Contribution[]
  ruleHits: RuleHit[]
}

export type PreviewRow = {
  companyId: string
  name: string
  saved: number
  preview: number
  delta: number
  savedTier: Tier
  previewTier: Tier
}

export type Preview = { rows: PreviewRow[]; tierChanges: number; moved: number }

type WeightLevels = ReadonlyMap<string, Weight>

function questionPoints(
  sample: SampleLead,
  polarity: Polarity,
  levels: WeightLevels,
  params: ScoringParams
) {
  return sample.breakdown
    .filter((contribution) => contribution.polarity === polarity)
    .reduce((sum, contribution) => {
      const level = levels.get(contribution.question_id)
      // A question deleted since scoring keeps the numeric weight it was scored with.
      const weight = level ? params.weights[level] : contribution.weight
      return sum + weight * contribution.strength
    }, 0)
}

function saturate(points: number, tau: number) {
  return 100 * (1 - Math.exp(-points / tau))
}

/** Estimated priority (one decimal, as the engine rounds it) of one sampled company under `params`. */
export function estimatePriority(
  sample: SampleLead,
  levels: WeightLevels,
  params: ScoringParams,
  saved: ScoringParams
) {
  if (
    sample.score.disqualified ||
    sample.ruleHits.some((hit) => hit.action === "exclude")
  )
    return 0

  const weightsChanged =
    params.weights.high !== saved.weights.high ||
    params.weights.medium !== saved.weights.medium ||
    params.weights.low !== saved.weights.low
  const intent =
    weightsChanged || params.tau_intent !== saved.tau_intent
      ? saturate(
          questionPoints(sample, "positive", levels, params),
          params.tau_intent
        )
      : sample.score.intent
  const risk =
    weightsChanged || params.tau_risk !== saved.tau_risk
      ? saturate(
          questionPoints(sample, "negative", levels, params),
          params.tau_risk
        )
      : sample.score.risk

  const priority =
    100 *
    Math.pow(sample.score.fit / 100, params.fit_exponent) *
    Math.pow(intent / 100, params.intent_exponent) *
    (1 - (params.risk_penalty * risk) / 100)
  const caps = sample.ruleHits.flatMap((hit) =>
    hit.action === "cap" && hit.cap_value !== null ? [hit.cap_value] : []
  )
  return round1(Math.min(priority, ...caps))
}

export function tierFor(
  priority: number,
  disqualified: boolean,
  tiers: ScoringParams["tiers"]
): Tier {
  if (disqualified) return "disqualified"
  if (priority >= tiers.hot) return "hot"
  return priority >= tiers.warm ? "warm" : "cold"
}

/**
 * Anchors every row on the stored score and applies only the estimated change (draft − saved, both estimated
 * the same way), so the 2-dp rounding of the stored strengths never shows up as movement.
 */
export function buildPreview(
  samples: SampleLead[],
  levels: WeightLevels,
  saved: ScoringParams,
  draft: ScoringParams
): Preview {
  const rows = samples.map((sample): PreviewRow => {
    const change =
      estimatePriority(sample, levels, draft, saved) -
      estimatePriority(sample, levels, saved, saved)
    const priority = Math.min(100, Math.max(0, sample.score.priority + change))
    const disqualified =
      sample.score.disqualified || sample.score.tier === "disqualified"
    const savedPriority = Math.round(sample.score.priority)
    const preview = Math.round(priority)
    return {
      companyId: sample.companyId,
      name: sample.name,
      saved: savedPriority,
      preview,
      delta: preview - savedPriority,
      savedTier: sample.score.tier,
      previewTier: tierFor(priority, disqualified, draft.tiers),
    }
  })
  rows.sort(
    (a, b) =>
      b.preview - a.preview || b.saved - a.saved || a.name.localeCompare(b.name)
  )
  return {
    rows,
    tierChanges: rows.filter((row) => row.previewTier !== row.savedTier).length,
    moved: rows.filter((row) => row.delta !== 0).length,
  }
}
