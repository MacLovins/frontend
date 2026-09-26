import { describe, expect, it } from "vitest"

import type {
  Contribution,
  RuleHit,
  ScoringParams,
  Weight,
} from "@/api/generated/model"
import { DEFAULT_PARAMS } from "@/features/settings/scoring/lib/params"
import {
  buildPreview,
  estimatePriority,
  type SampleLead,
} from "@/features/settings/scoring/lib/scoring-estimate"

const contribution = (
  question_id: string,
  polarity: Contribution["polarity"],
  weight: number,
  strength: number
): Contribution => ({
  question_id,
  key: question_id,
  label: question_id,
  polarity,
  weight,
  strength,
  points: weight * strength,
  signal_ids: [],
})

const levels = new Map<string, Weight>([
  ["q_high", "high"],
  ["q_medium", "medium"],
  ["q_blocker", "medium"],
])

// Engine numbers for the defaults: points 3·0.8 + 2·0.5 = 3.4 → Intent 49.3; blockers 2·0.5 = 1 → Risk 39.3;
// Priority = 100 · 1^0.4 · 0.4934^0.6 · (1 − 0.5 · 0.3935) = 52.6 (warm).
const lead = (overrides: Partial<SampleLead> = {}): SampleLead => ({
  companyId: "c1",
  name: "Nordhavn Freight A/S",
  score: {
    priority: 52.6,
    tier: "warm",
    fit: 100,
    intent: 49.3,
    risk: 39.3,
    disqualified: false,
  },
  breakdown: [
    contribution("q_high", "positive", 3, 0.8),
    contribution("q_medium", "positive", 2, 0.5),
    contribution("q_blocker", "negative", 2, 0.5),
  ],
  ruleHits: [],
  ...overrides,
})

const hit = (
  action: RuleHit["action"],
  cap_value: number | null = null
): RuleHit => ({
  rule_id: "r1",
  name: "rule",
  kind: "firmographic",
  action,
  cap_value,
})

const withParams = (patch: Partial<ScoringParams>): ScoringParams => ({
  ...DEFAULT_PARAMS,
  ...patch,
})

describe("estimatePriority", () => {
  it("reproduces the engine priority from the stored breakdown", () => {
    // A different saved Low weight forces the recompute; no question here is Low.
    const saved = withParams({ weights: { high: 3, medium: 2, low: 0.5 } })
    expect(estimatePriority(lead(), levels, DEFAULT_PARAMS, saved)).toBe(52.6)
  })

  it("recomputes Buying signals when a weight changes", () => {
    const draft = withParams({ weights: { high: 5, medium: 2, low: 1 } })
    // points 5·0.8 + 2·0.5 = 5 → Intent 63.2 → Priority 100 · 0.632^0.6 · 0.803 = 61.0
    expect(estimatePriority(lead(), levels, draft, DEFAULT_PARAMS)).toBe(61)
  })

  it("keeps an excluded company at 0 whatever the weights", () => {
    const sample = lead({ ruleHits: [hit("exclude")] })
    expect(
      estimatePriority(
        sample,
        levels,
        withParams({ fit_exponent: 0.1 }),
        DEFAULT_PARAMS
      )
    ).toBe(0)
  })

  it("applies caps after scoring", () => {
    const sample = lead({ ruleHits: [hit("cap", 35), hit("flag")] })
    expect(
      estimatePriority(sample, levels, DEFAULT_PARAMS, DEFAULT_PARAMS)
    ).toBe(35)
  })
})

describe("buildPreview", () => {
  it("shows no movement while the draft equals the saved profile", () => {
    const preview = buildPreview(
      [lead()],
      levels,
      DEFAULT_PARAMS,
      DEFAULT_PARAMS
    )
    expect(preview.rows[0]).toMatchObject({
      saved: 53,
      preview: 53,
      delta: 0,
      savedTier: "warm",
      previewTier: "warm",
    })
    expect(preview).toMatchObject({ tierChanges: 0, moved: 0 })
  })

  it("changes the tier when a threshold moves across the saved priority", () => {
    const preview = buildPreview(
      [lead()],
      levels,
      DEFAULT_PARAMS,
      withParams({ tiers: { hot: 50, warm: 30 } })
    )
    expect(preview.rows[0]).toMatchObject({
      delta: 0,
      savedTier: "warm",
      previewTier: "hot",
    })
    expect(preview).toMatchObject({ tierChanges: 1, moved: 0 })
  })

  it("ranks by the preview priority", () => {
    const low = lead({
      companyId: "c2",
      name: "Alpenrail AG",
      score: {
        priority: 45,
        tier: "warm",
        fit: 100,
        intent: 30,
        risk: 0,
        disqualified: false,
      },
      breakdown: [contribution("q_high", "positive", 3, 0.48)],
    })
    const preview = buildPreview(
      [low, lead()],
      levels,
      DEFAULT_PARAMS,
      withParams({ risk_penalty: 1 })
    )
    expect(preview.rows.map((row) => row.companyId)).toEqual(["c2", "c1"])
    // Priority 100 · 0.4934^0.6 · (1 − 0.3935) = 39.7
    expect(preview.rows[1]).toMatchObject({
      saved: 53,
      preview: 40,
      delta: -13,
      previewTier: "cold",
    })
    expect(preview.moved).toBe(1)
  })
})
