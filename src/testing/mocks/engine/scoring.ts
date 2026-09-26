/**
 * Port of the backend scoring engine (ai/scoring/engine.py, fit.py, rules.py, explain.py) over the mock's
 * stored signals. Pure functions of the state; persisting a new score is `rescoreLead`.
 *
 *   value_e  = strength_values[strength] × confidence × factor           (factor = reliability × freshness)
 *   s_q      = 1 − Π_{top-k}(1 − value_e)                                (noisy-OR, k = max_evidence_per_question)
 *   points_q = weights[q.weight] × s_q
 *   Intent   = 100 × (1 − e^(−Σ points⁺ / tau_intent)),  Risk = 100 × (1 − e^(−Σ points⁻ / tau_risk))
 *   Priority = 100 × (Fit/100)^fit_exponent × (Intent/100)^intent_exponent × (1 − risk_penalty × Risk/100)
 *   Rules: exclude → disqualified (priority 0) · cap → min(priority, cap) · flag → warning only.
 */
import type {
  CompanyOut,
  Contribution,
  Criterion,
  DisqualificationRuleOut,
  FirmographicCondition,
  FitCriterion,
  ICPProfileOut,
  LeadCardScore,
  ListCondition,
  Reason,
  RuleHit,
  ScoringParams,
  SignalCondition,
  SignalQuestionOut,
  Tier,
} from "@/api/generated/model"

import { nextId } from "../data/ids"
import { iso, ymd } from "../data/time"
import type { DbState, ScoreRecord, SignalRecord } from "../types"
import { tierChangedEvent } from "./activity"

export const DEFAULT_PARAMS: ScoringParams = {
  weights: { high: 3, medium: 2, low: 1 },
  strength_values: { weak: 0.35, moderate: 0.65, strong: 1.0 },
  reliability: {
    website: 1.0,
    report: 1.0,
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
  tau_intent: 5.0,
  tau_risk: 2.0,
  fit_exponent: 0.4,
  intent_exponent: 0.6,
  risk_penalty: 0.5,
  tiers: { hot: 65, warm: 40 },
  min_confidence: 0.5,
  max_evidence_per_question: 3,
  fit_floor: 20.0,
  undated_age_days: 90,
}

const r1 = (x: number) => Math.round(x * 10) / 10
const r2 = (x: number) => Math.round(x * 100) / 100

/** Stored params are verbatim (possibly partial): missing keys fall back to the engine defaults. */
export function effectiveParams(
  state: DbState,
  serviceId: string
): { params: ScoringParams; version: number | null } {
  const profile = state.profiles.find(
    (p) => p.service_id === serviceId && p.is_current
  )
  if (!profile) return { params: DEFAULT_PARAMS, version: null }
  return {
    params: { ...DEFAULT_PARAMS, ...profile.params },
    version: profile.version,
  }
}

export function activeQuestions(
  state: DbState,
  serviceId: string
): SignalQuestionOut[] {
  return state.questions
    .filter((q) => q.service_id === serviceId && q.is_active)
    .sort(
      (a, b) =>
        a.created_at.localeCompare(b.created_at) || a.key.localeCompare(b.key)
    )
}

export function signalValue(
  signal: SignalRecord,
  params: ScoringParams
): number {
  return (
    params.strength_values[signal.strength] * signal.confidence * signal.factor
  )
}

// --- fit (ai/scoring/fit.py) ----------------------------------------------------------------------

type Tri = boolean | null

const upper = (values: (string | number)[]) =>
  new Set(values.map((v) => String(v).toUpperCase()))

function countryIn(company: CompanyOut, values: (string | number)[]): Tri {
  if (!company.country_code) return null
  return upper(values).has(company.country_code.toUpperCase())
}

function industryIn(company: CompanyOut, values: (string | number)[]): Tri {
  if (company.industry_ids.length === 0) return null
  const wanted = new Set(values.map(String))
  return company.industry_ids.some((i) => wanted.has(i))
}

function employeesBetween(
  company: CompanyOut,
  values: (string | number)[]
): Tri {
  if (company.employees === null) return null
  const lo = values.length ? Number(values[0]) : 0
  const hi = values.length > 1 ? Number(values[1]) : null
  return company.employees >= lo && (hi === null || company.employees <= hi)
}

function revenueAtLeast(company: CompanyOut, values: (string | number)[]): Tri {
  if (company.revenue_eur === null) return null
  return company.revenue_eur >= Number(values[0])
}

function tagIn(company: CompanyOut, values: (string | number)[]): Tri {
  const wanted = new Set(values.map(String))
  return company.tags.some((t) => wanted.has(t))
}

const NICE: Record<
  Criterion["kind"],
  [(c: CompanyOut, v: (string | number)[]) => Tri, string | null]
> = {
  country_in: [countryIn, "country_code"],
  industry_in: [industryIn, "industry_ids"],
  employees_between: [employeesBetween, "employees"],
  revenue_at_least: [revenueAtLeast, "revenue_eur"],
  tag_in: [tagIn, null],
}

const thousands = (n: number) => n.toLocaleString("en-US")

function niceLabel(c: Criterion): string {
  const values = c.values.map(String).join(", ")
  switch (c.kind) {
    case "country_in":
      return `Country in ${values}`
    case "industry_in":
      return `Industry in ${values}`
    case "employees_between":
      return `Employees between ${values.replace(/, /g, " and ")}`
    case "revenue_at_least":
      return `Revenue at least €${values}`
    default:
      return `Tagged ${values}`
  }
}

export interface FitResult {
  fit: number
  must_have_passed: boolean
  details: FitCriterion[]
  data_gaps: string[]
}

type IcpLike = Pick<
  ICPProfileOut,
  | "countries"
  | "industries_any"
  | "employees_min"
  | "employees_max"
  | "revenue_min_eur"
  | "nice_to_have"
>

export const EMPTY_ICP: IcpLike = {
  countries: [],
  industries_any: [],
  employees_min: null,
  employees_max: null,
  revenue_min_eur: null,
  nice_to_have: null,
}

export function computeFit(
  company: CompanyOut,
  icp: IcpLike,
  floor: number
): FitResult {
  const details: FitCriterion[] = []
  const gaps: string[] = []
  const gap = (field: string | null) => {
    if (field && !gaps.includes(field)) gaps.push(field)
  }
  const checks: [string, string, Tri, string][] = []
  if (icp.countries.length)
    checks.push([
      "countries",
      "country_code",
      countryIn(company, icp.countries),
      `Country in ${icp.countries.join(", ")}`,
    ])
  if (icp.industries_any.length)
    checks.push([
      "industries_any",
      "industry_ids",
      industryIn(company, icp.industries_any),
      `Industry in ${icp.industries_any.join(", ")}`,
    ])
  if (icp.employees_min !== null)
    checks.push([
      "employees_min",
      "employees",
      company.employees === null
        ? null
        : company.employees >= icp.employees_min,
      `At least ${thousands(icp.employees_min)} employees`,
    ])
  if (icp.employees_max !== null)
    checks.push([
      "employees_max",
      "employees",
      company.employees === null
        ? null
        : company.employees <= icp.employees_max,
      `At most ${thousands(icp.employees_max)} employees`,
    ])
  if (icp.revenue_min_eur !== null)
    checks.push([
      "revenue_min_eur",
      "revenue_eur",
      company.revenue_eur === null
        ? null
        : company.revenue_eur >= icp.revenue_min_eur,
      `Revenue at least €${thousands(Math.trunc(icp.revenue_min_eur))}`,
    ])

  let passed = true
  for (const [criterion, field, result, label] of checks) {
    details.push({
      criterion,
      required: true,
      status: result === null ? "unknown" : result ? "pass" : "fail",
      label,
    })
    if (result === null) gap(field)
    else if (!result) passed = false
  }

  let total = 0
  let matched = 0
  for (const c of icp.nice_to_have?.criteria ?? []) {
    const [check, field] = NICE[c.kind]
    const result = check(company, c.values)
    details.push({
      criterion: c.kind,
      required: false,
      status: result === null ? "unknown" : result ? "match" : "no_match",
      label: niceLabel(c),
      weight: c.weight,
    })
    total += c.weight
    if (result === null) {
      matched += 0.5 * c.weight
      gap(field)
    } else if (result) {
      matched += c.weight
    }
  }
  const fit = !passed
    ? 0
    : total === 0
      ? 100
      : floor + ((100 - floor) * matched) / total
  return { fit, must_have_passed: passed, details, data_gaps: gaps }
}

// --- rules (ai/scoring/rules.py) ------------------------------------------------------------------

const normDomain = (d: string) =>
  d
    .trim()
    .toLowerCase()
    .replace(/^www\./, "")

type Scalar = string | number

function firmographicFires(
  company: CompanyOut,
  cond: FirmographicCondition
): boolean {
  const raw = company[cond.field] as Scalar | Scalar[] | null
  if (raw === null || raw === undefined) return false
  const fold = (v: Scalar) => (typeof v === "string" ? v.toLowerCase() : v)
  const expected = Array.isArray(cond.value)
    ? cond.value.map(fold)
    : fold(cond.value)
  if (Array.isArray(raw)) {
    const values = new Set(raw.map((v) => String(v).toLowerCase()))
    if (values.size === 0) return false
    const wanted = Array.isArray(expected) ? expected : [expected]
    const overlap = wanted.some((w) => values.has(String(w)))
    if (cond.op === "in" || cond.op === "intersects" || cond.op === "eq")
      return overlap
    if (cond.op === "not_in") return !overlap
    return false
  }
  const actual = fold(raw)
  switch (cond.op) {
    case "lt":
      return typeof actual === "number" && actual < Number(expected)
    case "gt":
      return typeof actual === "number" && actual > Number(expected)
    case "eq":
      return actual === expected
    case "in":
    case "intersects":
      return Array.isArray(expected) && expected.includes(actual)
    case "not_in":
      return Array.isArray(expected) && !expected.includes(actual)
  }
  return false
}

export function evaluateRules(
  company: CompanyOut,
  rules: DisqualificationRuleOut[],
  strengths: Record<string, number>
): RuleHit[] {
  const hits: RuleHit[] = []
  for (const rule of rules) {
    let fired: boolean
    if (rule.kind === "firmographic")
      fired = firmographicFires(
        company,
        rule.condition as FirmographicCondition
      )
    else if (rule.kind === "list") {
      const listed = new Set(
        ((rule.condition as ListCondition).domains ?? []).map(normDomain)
      )
      const own = [company.domain, ...company.own_domains].map(normDomain)
      fired = own.some((d) => listed.has(d))
    } else {
      const cond = rule.condition as SignalCondition
      fired = (strengths[cond.question_key] ?? 0) >= cond.min_strength
    }
    if (fired)
      hits.push({
        rule_id: rule.id,
        name: rule.name,
        kind: rule.kind,
        action: rule.action,
        cap_value: rule.cap_value,
      })
  }
  return hits
}

export function ruleFlags(hits: RuleHit[]): string[] {
  return [...new Set(hits.map((h) => h.name).filter(Boolean))]
}

// --- score ----------------------------------------------------------------------------------------

export function assignTier(
  priority: number,
  disqualified: boolean,
  params: ScoringParams
): Tier {
  if (disqualified) return "disqualified"
  if (priority >= params.tiers.hot) return "hot"
  if (priority >= params.tiers.warm) return "warm"
  return "cold"
}

function signalReason(
  signal: SignalRecord,
  polarity: "positive" | "negative"
): Reason {
  const date =
    signal.event_date ??
    (signal.published_at ? signal.published_at.slice(0, 10) : null)
  return {
    text: signal.summary,
    polarity,
    signal_id: signal.id,
    source_name: signal.source_name,
    url: signal.url,
    date,
  }
}

/** Computes (does not store) the lead score of a company for a service. */
export function computeScore(
  state: DbState,
  companyId: string,
  serviceId: string,
  now: Date
): LeadCardScore {
  const company = state.companies.find((c) => c.id === companyId)
  if (!company) throw new Error(`Unknown company ${companyId}`)
  const { params, version } = effectiveParams(state, serviceId)
  const questions = activeQuestions(state, serviceId)
  const icp = state.icps.find((i) => i.service_id === serviceId) ?? EMPTY_ICP
  const rules = state.rules.filter(
    (r) => r.service_id === serviceId && r.is_active
  )

  const byQuestion = new Map<string, SignalRecord[]>()
  for (const s of state.signals) {
    if (s.company_id !== companyId || s.service_id !== serviceId) continue
    if (s.status !== "active" || s.confidence < params.min_confidence) continue
    const list = byQuestion.get(s.question_id) ?? []
    list.push(s)
    byQuestion.set(s.question_id, list)
  }

  const breakdown: Contribution[] = []
  const strengths: Record<string, number> = {}
  const strongest: Record<string, SignalRecord> = {}
  let positive = 0
  let negative = 0
  for (const q of questions) {
    const valued = (byQuestion.get(q.id) ?? [])
      .map((s) => ({ s, v: signalValue(s, params) }))
      .sort(
        (a, b) => b.v - a.v || b.s.detected_at.localeCompare(a.s.detected_at)
      )
      .slice(0, Math.max(1, params.max_evidence_per_question))
    const strength =
      1 - valued.reduce((p, { v }) => p * (1 - Math.min(Math.max(v, 0), 1)), 1)
    const weight = params.weights[q.weight]
    const points = weight * strength
    strengths[q.key] = strength
    if (valued.length && valued[0].v > 0) strongest[q.key] = valued[0].s
    if (q.polarity === "positive") positive += points
    else negative += points
    breakdown.push({
      question_id: q.id,
      key: q.key,
      label: q.text,
      polarity: q.polarity,
      weight,
      strength: r2(strength),
      points: r2(points),
      signal_ids: valued.map(({ s }) => s.id),
    })
  }
  breakdown.sort((a, b) => b.points - a.points)

  const fit = computeFit(company, icp, params.fit_floor)
  const intent = 100 * (1 - Math.exp(-positive / params.tau_intent))
  const risk = 100 * (1 - Math.exp(-negative / params.tau_risk))
  let priority =
    100 *
    Math.pow(fit.fit / 100, params.fit_exponent) *
    Math.pow(intent / 100, params.intent_exponent) *
    (1 - (params.risk_penalty * risk) / 100)

  const ruleHits = evaluateRules(company, rules, strengths)
  const failed = fit.details
    .filter((d) => d.required && d.status === "fail")
    .map((d) => d.label)
  if (failed.length)
    ruleHits.push({
      rule_id: "icp:must_have",
      name: `Outside ICP: ${failed.join("; ")}`,
      kind: "icp",
      action: "flag",
      cap_value: null,
    })
  const disqualified = ruleHits.some((h) => h.action === "exclude")
  const caps = ruleHits
    .filter((h) => h.action === "cap" && h.cap_value !== null)
    .map((h) => h.cap_value as number)
  if (disqualified) priority = 0
  else if (caps.length) priority = Math.min(priority, ...caps)
  priority = r1(priority)

  // why now (ai/scoring/explain.py)
  const whyNow: Reason[] = []
  breakdown
    .filter(
      (c) => c.polarity === "positive" && c.points > 0 && strongest[c.key]
    )
    .slice(0, 3)
    .forEach((c) => whyNow.push(signalReason(strongest[c.key], "positive")))
  if (risk >= 20) {
    const neg = breakdown.find(
      (c) => c.polarity === "negative" && c.points > 0 && strongest[c.key]
    )
    if (neg) whyNow.push(signalReason(strongest[neg.key], "negative"))
  }
  for (const d of fit.details)
    if (d.required && d.status === "fail")
      whyNow.push({
        text: `Outside ICP: ${d.label}`,
        polarity: "fit",
        signal_id: null,
        source_name: null,
        url: null,
        date: null,
      })
  if (fit.data_gaps.length)
    whyNow.push({
      text: `Unknown: ${fit.data_gaps.join(", ")}`,
      polarity: "data_gap",
      signal_id: null,
      source_name: null,
      url: null,
      date: null,
    })

  return {
    priority,
    tier: assignTier(priority, disqualified, params),
    fit: r1(fit.fit),
    intent: r1(intent),
    risk: r1(risk),
    disqualified,
    fit_details: { criteria: fit.details },
    rule_hits: ruleHits,
    flags: ruleFlags(ruleHits),
    data_gaps: fit.data_gaps,
    breakdown,
    why_now: whyNow,
    scoring_profile_version: version ?? 1,
    computed_at: iso(now),
  }
}

export function currentScore(
  state: DbState,
  companyId: string,
  serviceId: string
): ScoreRecord | undefined {
  return state.scores.find(
    (s) =>
      s.company_id === companyId && s.service_id === serviceId && s.is_current
  )
}

/** Creates the default v1 profile the backend auto-creates on the first rescore/analysis of a service. */
export function ensureProfile(
  state: DbState,
  serviceId: string,
  now: Date
): void {
  if (state.profiles.some((p) => p.service_id === serviceId && p.is_current))
    return
  const at = iso(now)
  state.profiles.push({
    id: nextId(state),
    service_id: serviceId,
    version: 1,
    params: structuredClone(DEFAULT_PARAMS),
    is_current: true,
    created_at: at,
    updated_at: at,
  })
}

/**
 * Recomputes and stores a new current score (the previous one stays in the history). Emits
 * `lead.tier_changed` when asked and the tier changed (feedback rescoring does not emit it).
 */
export function rescoreLead(
  state: DbState,
  companyId: string,
  serviceId: string,
  now: Date,
  opts: { tierEvent: boolean; runId?: string | null }
): {
  score: ScoreRecord
  before: ScoreRecord | undefined
  tierChanged: boolean
} {
  ensureProfile(state, serviceId, now)
  const before = currentScore(state, companyId, serviceId)
  const computed = computeScore(state, companyId, serviceId, now)
  if (before) before.is_current = false
  const score: ScoreRecord = {
    ...computed,
    id: nextId(state),
    company_id: companyId,
    service_id: serviceId,
    is_current: true,
    computed_at: iso(now),
  }
  state.scores.push(score)
  const tierChanged = before?.tier !== score.tier
  if (opts.tierEvent && tierChanged)
    state.events.push(tierChangedEvent(state, score, before?.tier ?? null, now))
  return { score, before, tierChanged }
}

/** Synchronous rescore of every company that already has a current score for the service. */
export function rescoreService(
  state: DbState,
  serviceId: string,
  now: Date
): { rescored: number; tier_changes: number } {
  const companyIds = state.scores
    .filter((s) => s.service_id === serviceId && s.is_current)
    .map((s) => s.company_id)
  let changes = 0
  for (const companyId of companyIds) {
    if (
      rescoreLead(state, companyId, serviceId, now, { tierEvent: true })
        .tierChanged
    )
      changes += 1
  }
  return { rescored: companyIds.length, tier_changes: changes }
}

/** Active signals of active questions for a lead (the list's signals_count / new_signals_7d / last_signal_at). */
export function signalStats(
  state: DbState,
  companyId: string,
  serviceId: string,
  now: Date
) {
  const active = new Set(
    state.questions
      .filter((q) => q.service_id === serviceId && q.is_active)
      .map((q) => q.id)
  )
  const cutoff = now.getTime() - 7 * 86_400_000
  let count = 0
  let fresh = 0
  let last: string | null = null
  for (const s of state.signals) {
    if (
      s.company_id !== companyId ||
      s.service_id !== serviceId ||
      s.status !== "active" ||
      !active.has(s.question_id)
    )
      continue
    count += 1
    if (new Date(s.detected_at).getTime() >= cutoff) fresh += 1
    const date =
      s.event_date ??
      (s.published_at
        ? s.published_at.slice(0, 10)
        : ymd(new Date(s.detected_at)))
    if (!last || date > last) last = date
  }
  return { signals_count: count, new_signals_7d: fresh, last_signal_at: last }
}
