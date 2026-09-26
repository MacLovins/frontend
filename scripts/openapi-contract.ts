/**
 * Narrows the backend OpenAPI snapshot to what the backend code actually returns.
 *
 * FastAPI types many fields as `dict` / `str`, so the snapshot has untyped objects and plain strings
 * where the code uses enums and fixed shapes. `openapi.json` stays a verbatim copy of the backend file;
 * these patches run in memory during `npm run gen:api`. Every patch cites the backend code it mirrors
 * (paths relative to MacLovins/backend).
 */

type Schema = Record<string, unknown>
type Operation = {
  parameters?: { name: string; in: string; schema?: Schema }[]
  requestBody?: { content?: Record<string, { schema?: Schema }> }
  responses?: Record<string, { content?: Record<string, { schema?: Schema }> }>
}
export type OpenApiSpec = {
  paths: Record<string, Record<string, Operation>>
  components: { schemas: Record<string, Schema> }
}

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const nullable = (schema: Schema) => ({ anyOf: [schema, { type: "null" }] })
const str = { type: "string" }
const int = { type: "integer" }
const num = { type: "number" }
const bool = { type: "boolean" }
const uuid = { type: "string", format: "uuid" }
const date = { type: "string", format: "date" }
const dateTime = { type: "string", format: "date-time" }
const arrayOf = (items: Schema) => ({ type: "array", items })
const enumOf = (...values: string[]) => ({ type: "string", enum: values })
const object = (
  properties: Record<string, Schema>,
  optional: string[] = []
) => ({
  type: "object",
  properties,
  required: Object.keys(properties).filter((key) => !optional.includes(key)),
  additionalProperties: false,
})

// Endpoints the SPA does not call through generated hooks:
// SSE is read by src/api/run-events.ts, the CSV export is a plain download link, /auth/token is the
// OAuth2 form for Swagger, and health probes are for the load balancer.
const EXCLUDED_PATHS = [
  "/api/v1/runs/{id}/events",
  "/api/v1/leads/export.csv",
  "/api/v1/auth/token",
  "/health",
  "/health/ready",
]

const ENUMS: Record<string, Schema> = {
  // ai/contracts.py:14-34, ai/presets/loader.py:28-43
  Tier: enumOf("hot", "warm", "cold", "disqualified"),
  Strength: enumOf("weak", "moderate", "strong"),
  Polarity: enumOf("positive", "negative"),
  Weight: enumOf("high", "medium", "low"),
  SourceType: enumOf(
    "news",
    "website",
    "jobs",
    "report",
    "registry",
    "incident",
    "derived",
    "manual"
  ),
  SignalFlag: enumOf(
    "fuzzy_quote",
    "headline_only",
    "undated",
    "corroborated",
    "derived"
  ),
  RejectReason: enumOf(
    "quote_not_found",
    "wrong_subject",
    "stale",
    "below_confidence",
    "no_evidence_for_yes"
  ),
  SignalCategory: enumOf(
    "cost_efficiency",
    "digital_transformation",
    "ai_automation",
    "hiring",
    "leadership_change",
    "shared_services",
    "tech_stack",
    "tech_partners",
    "incident",
    "compliance",
    "investment",
    "expansion",
    "internal_capability",
    "distress"
  ),
  // core/modules/config/models.py:54-56, schemas.py:14-15
  KeywordsStatus: enumOf("pending", "ready", "failed"),
  RuleKind: enumOf("firmographic", "signal", "list"),
  RuleAction: enumOf("exclude", "cap", "flag"),
  // core/modules/runs/models.py:21-24; `pending` comes from worker/scheduled.py:95
  RunKind: enumOf("analyze", "refresh", "discover", "rescore"),
  RunStatus: enumOf(
    "queued",
    "running",
    "pending",
    "succeeded",
    "partial",
    "failed",
    "cancelled"
  ),
  RunMode: enumOf("incremental", "full"),
  // core/modules/accounts/models.py:45
  CompanyOrigin: enumOf("manual", "csv", "discovery"),
  // core/modules/outreach/models.py:10, ai/contracts.py:441-442
  OutreachStatus: enumOf("queued", "running", "succeeded", "failed"),
  OutreachChannel: enumOf("email", "linkedin_inmail", "call_script"),
  OutreachTone: enumOf("professional", "conversational", "direct"),
  SignalVerdict: enumOf("correct", "incorrect", "irrelevant"),
  LeadVerdict: enumOf("good_fit", "bad_fit"),
}

const OBJECTS: Record<string, Schema> = {
  // ai/contracts.py:335-341
  Reason: object({
    text: str,
    polarity: enumOf("positive", "negative", "fit", "data_gap"),
    signal_id: nullable(uuid),
    source_name: nullable(str),
    url: nullable(str),
    date: nullable(date),
  }),
  // ai/contracts.py:324-332
  Contribution: object({
    question_id: uuid,
    key: str,
    label: str,
    polarity: ref("Polarity"),
    weight: num,
    strength: num,
    points: num,
    signal_ids: arrayOf(uuid),
  }),
  // ai/scoring/rules.py:83-91, ai/scoring/engine.py:93-100
  RuleHit: object({
    rule_id: str,
    name: str,
    kind: enumOf("firmographic", "signal", "list", "icp"),
    action: ref("RuleAction"),
    cap_value: nullable(num),
  }),
  // ai/scoring/fit.py:111-131
  FitCriterion: object(
    {
      criterion: str,
      required: bool,
      status: enumOf("pass", "fail", "unknown", "match", "no_match"),
      label: str,
      weight: num,
    },
    ["weight"]
  ),
  FitDetails: object({ criteria: arrayOf(ref("FitCriterion")) }),
  // core/modules/leads/router.py:381-393, core/adapters/mapping.py:307-326
  LeadCardScore: object({
    priority: num,
    tier: ref("Tier"),
    fit: num,
    intent: num,
    risk: num,
    disqualified: bool,
    fit_details: ref("FitDetails"),
    rule_hits: arrayOf(ref("RuleHit")),
    flags: arrayOf(str),
    data_gaps: arrayOf(str),
    breakdown: arrayOf(ref("Contribution")),
    why_now: arrayOf(ref("Reason")),
    scoring_profile_version: nullable(int),
    computed_at: nullable(dateTime),
  }),
  // The card returns `{}` for `service` and `score` when the company has none (leads/router.py:363-364)
  EmptyObject: { type: "object", properties: {}, additionalProperties: false },
  LeadService: object({ id: uuid, name: str }),
  // core/modules/leads/router.py:307-315
  QuestionRef: object({
    id: uuid,
    key: str,
    text: str,
    category: ref("SignalCategory"),
    polarity: ref("Polarity"),
    weight: ref("Weight"),
  }),
  // core/modules/leads/router.py:490-498
  ScoreHistoryPoint: object({
    computed_at: nullable(dateTime),
    priority: num,
    tier: ref("Tier"),
    is_current: bool,
  }),
  // core/modules/runs/service.py:55-60, worker/scheduled.py:96-100
  RunParams: object(
    {
      company_ids: arrayOf(uuid),
      service_ids: arrayOf(uuid),
      mode: ref("RunMode"),
      trigger: enumOf("scheduler"),
    },
    ["mode", "trigger"]
  ),
  RunProgress: object({ done: int, total: int, failed: int, paused: int }),
  // parser/contracts.py:7-21
  AtsRef: object(
    {
      kind: enumOf(
        "greenhouse",
        "lever",
        "workday",
        "personio",
        "ashby",
        "smartrecruiters",
        "workable",
        "recruitee"
      ),
      token: str,
      host: nullable(str),
      site: nullable(str),
    },
    ["host", "site"]
  ),
  // core/modules/discovery/service.py:195-201
  DiscoveryQuery: object({
    countries: arrayOf(str),
    industries: arrayOf(str),
    employees_min: nullable(int),
    employees_max: nullable(int),
    limit: int,
  }),
  // core/modules/feedback/router.py:300-303
  VerifierStats: object({
    evidence_total: int,
    rejected: { type: "object", additionalProperties: int },
  }),
  // core/modules/config/router.py:324-331
  ExpandQuestionOut: object({
    question_id: uuid,
    status: enumOf("enqueued", "pending"),
  }),
  // ai/contracts.py:82-87
  Criterion: object({
    kind: enumOf(
      "country_in",
      "industry_in",
      "employees_between",
      "revenue_at_least",
      "tag_in"
    ),
    values: arrayOf({ anyOf: [str, num] }),
    weight: num,
  }),
  NiceToHave: object({ criteria: arrayOf(ref("Criterion")) }),
  // ai/contracts.py:108-155
  FirmographicCondition: object({
    field: enumOf(
      "employees",
      "revenue_eur",
      "country_code",
      "industry_ids",
      "domain",
      "tags"
    ),
    op: enumOf("lt", "gt", "eq", "in", "not_in", "intersects"),
    value: { anyOf: [num, str, arrayOf({ anyOf: [str, num] })] },
  }),
  SignalCondition: object({ question_key: str, min_strength: num }),
  ListCondition: object({ domains: arrayOf(str) }),
  RuleCondition: {
    anyOf: [
      ref("FirmographicCondition"),
      ref("SignalCondition"),
      ref("ListCondition"),
    ],
  },
  // ai/contracts.py:158-210
  ScoringParams: object({
    weights: object({ high: num, medium: num, low: num }),
    strength_values: object({ weak: num, moderate: num, strong: num }),
    reliability: { type: "object", additionalProperties: num },
    half_life_days: { type: "object", additionalProperties: nullable(num) },
    tau_intent: num,
    tau_risk: num,
    fit_exponent: num,
    intent_exponent: num,
    risk_penalty: num,
    tiers: object({ hot: num, warm: num }),
    min_confidence: num,
    max_evidence_per_question: int,
    fit_floor: num,
    undated_age_days: int,
  }),
  // core/modules/activity/events.py:85-159
  SignalDetectedPayload: object({
    signal_id: uuid,
    company_id: uuid,
    company_name: str,
    domain: str,
    service_id: uuid,
    service_name: str,
    run_id: nullable(str),
    question_id: uuid,
    question_key: str,
    weight: ref("Weight"),
    category: ref("SignalCategory"),
    polarity: ref("Polarity"),
    strength: ref("Strength"),
    confidence: num,
    summary: str,
    quote: str,
    url: nullable(str),
    source_name: str,
  }),
  LeadTierChangedPayload: object({
    company_id: uuid,
    company_name: str,
    domain: str,
    service_id: uuid,
    service_name: str,
    tier_before: nullable(ref("Tier")),
    tier_after: ref("Tier"),
    priority: num,
    fit: num,
    intent: num,
    risk: num,
    disqualified: bool,
    why_now: arrayOf(ref("Reason")),
  }),
  RunFinishedPayload: object({
    run_id: uuid,
    status: enumOf("succeeded", "partial", "failed", "cancelled"),
    progress: ref("RunProgress"),
  }),
  FeedbackCreatedPayload: object({
    feedback_id: uuid,
    user_id: uuid,
    target_type: enumOf("signal", "lead"),
    target_id: uuid,
    service_id: uuid,
    verdict: { anyOf: [ref("SignalVerdict"), ref("LeadVerdict")] },
    reason: nullable(str),
  }),
}

const event = (type: string, payload: string) =>
  object({
    id: uuid,
    type: enumOf(type),
    payload: ref(payload),
    created_at: dateTime,
    processed_at: nullable(dateTime),
  })

/** Property-level narrowing: schema name → property → replacement schema. */
const PROPERTIES: Record<string, Record<string, Schema>> = {
  ScoreSummary: { tier: ref("Tier") },
  LeadListItem: {
    top_reasons: arrayOf(ref("Reason")),
    last_signal_at: nullable(date),
  },
  LeadDetail: {
    service: { anyOf: [ref("LeadService"), ref("EmptyObject")] },
    score: { anyOf: [ref("LeadCardScore"), ref("EmptyObject")] },
    questions_without_evidence: arrayOf(ref("QuestionRef")),
    history: arrayOf(ref("ScoreHistoryPoint")),
    my_feedback: nullable(ref("LeadVerdict")),
  },
  QuestionSignals: { question: ref("QuestionRef") },
  SignalItem: {
    strength: ref("Strength"),
    source_type: ref("SourceType"),
    flags: arrayOf(ref("SignalFlag")),
    event_date: nullable(date),
    my_feedback: nullable(ref("SignalVerdict")),
  },
  FeedbackOut: {
    verdict: { anyOf: [ref("SignalVerdict"), ref("LeadVerdict")] },
  },
  QualityMetricsOut: { verifier: ref("VerifierStats") },
  CompanyOut: { origin: ref("CompanyOrigin"), ats: nullable(ref("AtsRef")) },
  DocumentOut: { source_type: ref("SourceType") },
  DiscoveredCompany: { fit_details: arrayOf(ref("FitCriterion")) },
  DiscoverySearchOut: { query: ref("DiscoveryQuery") },
  RunOut: {
    kind: ref("RunKind"),
    status: ref("RunStatus"),
    params: ref("RunParams"),
    progress: ref("RunProgress"),
  },
  OutreachJobOut: { status: ref("OutreachStatus") },
  OutreachDraftOut: { channel: ref("OutreachChannel") },
  OutreachGenerateIn: {
    channel: ref("OutreachChannel"),
    tone: ref("OutreachTone"),
  },
  SignalQuestionOut: {
    category: ref("SignalCategory"),
    polarity: ref("Polarity"),
    weight: ref("Weight"),
    source_types: arrayOf(ref("SourceType")),
    keywords: nullable({ type: "object", additionalProperties: arrayOf(str) }),
    keywords_status: ref("KeywordsStatus"),
  },
  SignalQuestionCreate: { category: ref("SignalCategory") },
  SignalQuestionUpdate: { category: nullable(ref("SignalCategory")) },
  SuggestedQuestionOut: {
    category: ref("SignalCategory"),
    polarity: ref("Polarity"),
    weight: ref("Weight"),
    source_types: arrayOf(ref("SourceType")),
  },
  SuggestedRuleOut: {
    kind: ref("RuleKind"),
    condition: ref("RuleCondition"),
    action: ref("RuleAction"),
  },
  DisqualificationRuleOut: {
    kind: ref("RuleKind"),
    condition: ref("RuleCondition"),
    action: ref("RuleAction"),
  },
  DisqualificationRuleCreate: {
    condition: ref("RuleCondition"),
    cap_value: nullable(num),
  },
  DisqualificationRuleUpdate: {
    condition: nullable(ref("RuleCondition")),
    cap_value: nullable(num),
  },
  ICPProfileOut: { nice_to_have: nullable(ref("NiceToHave")) },
  ICPProfileIn: {
    nice_to_have: nullable(ref("NiceToHave")),
    revenue_min_eur: nullable(num),
  },
  ScoringProfileOut: { params: ref("ScoringParams") },
  ScoringProfileIn: { params: ref("ScoringParams") },
  IndustryOut: { nis2: nullable(enumOf("annex_i", "annex_ii")) },
  LoginResponse: { role: nullable(enumOf("admin", "sales")) },
  PresetOut: { categories: arrayOf(ref("SignalCategory")) },
}

// POST /questions/{id}/expand returns a fixed object, not a string map (config/router.py:324-331)
const RESPONSES: Record<string, Record<string, Schema>> = {
  "/api/v1/questions/{id}/expand": { post: ref("ExpandQuestionOut") },
}

// Repeatable filters of GET /leads take enum values (leads/router.py:53-72)
const PARAMETERS: Record<string, Record<string, Record<string, Schema>>> = {
  "/api/v1/leads": { get: { tier: nullable(arrayOf(ref("Tier"))) } },
  "/api/v1/companies/{id}/documents": {
    get: { source_type: nullable(ref("SourceType")) },
  },
}

function collectRefs(node: unknown, into: Set<string>) {
  if (Array.isArray(node)) {
    node.forEach((item) => collectRefs(item, into))
    return
  }
  if (!node || typeof node !== "object") return
  for (const [key, value] of Object.entries(node)) {
    if (key === "$ref" && typeof value === "string")
      into.add(value.split("/").pop()!)
    else collectRefs(value, into)
  }
}

function closure(roots: Set<string>, schemas: Record<string, Schema>) {
  const seen = new Set<string>()
  const queue = [...roots]
  while (queue.length) {
    const name = queue.pop()!
    if (seen.has(name) || !schemas[name]) continue
    seen.add(name)
    const refs = new Set<string>()
    collectRefs(schemas[name], refs)
    queue.push(...refs)
  }
  return seen
}

export function applyContract(input: unknown) {
  const spec = input as OpenApiSpec
  const schemas = spec.components.schemas

  for (const path of EXCLUDED_PATHS) delete spec.paths[path]

  Object.assign(schemas, ENUMS, OBJECTS)
  schemas.DomainEventOut = {
    oneOf: [
      ref("SignalDetectedEvent"),
      ref("LeadTierChangedEvent"),
      ref("RunFinishedEvent"),
      ref("FeedbackCreatedEvent"),
    ],
  }
  schemas.SignalDetectedEvent = event(
    "signal.detected",
    "SignalDetectedPayload"
  )
  schemas.LeadTierChangedEvent = event(
    "lead.tier_changed",
    "LeadTierChangedPayload"
  )
  schemas.RunFinishedEvent = event("run.finished", "RunFinishedPayload")
  schemas.FeedbackCreatedEvent = event(
    "feedback.created",
    "FeedbackCreatedPayload"
  )

  for (const [name, props] of Object.entries(PROPERTIES)) {
    const schema = schemas[name] as
      { properties?: Record<string, Schema> } | undefined
    if (!schema?.properties)
      throw new Error(`openapi-contract: schema ${name} is missing`)
    for (const [prop, replacement] of Object.entries(props)) {
      if (!(prop in schema.properties))
        throw new Error(`openapi-contract: ${name}.${prop} is missing`)
      const description = schema.properties[prop].description
      schema.properties[prop] = description
        ? { ...replacement, description }
        : replacement
    }
  }

  for (const [path, methods] of Object.entries(RESPONSES)) {
    for (const [method, schema] of Object.entries(methods)) {
      const responses = spec.paths[path]?.[method]?.responses ?? {}
      const success = Object.keys(responses).find((code) =>
        code.startsWith("2")
      )
      if (!success)
        throw new Error(
          `openapi-contract: ${method} ${path} has no success response`
        )
      responses[success].content = { "application/json": { schema } }
    }
  }

  for (const [path, methods] of Object.entries(PARAMETERS)) {
    for (const [method, params] of Object.entries(methods)) {
      for (const parameter of spec.paths[path]?.[method]?.parameters ?? []) {
        if (params[parameter.name]) parameter.schema = params[parameter.name]
      }
    }
  }

  // Pydantic serializes every field of a response model, defaults included, so each property of a
  // response-only schema is always present even when OpenAPI lists it as optional.
  const responseRoots = new Set<string>()
  const requestRoots = new Set<string>()
  for (const methods of Object.values(spec.paths)) {
    for (const operation of Object.values(methods)) {
      for (const response of Object.values(operation.responses ?? {}))
        collectRefs(response, responseRoots)
      collectRefs(operation.requestBody, requestRoots)
      collectRefs(operation.parameters, requestRoots)
    }
  }
  // Drop schemas that only excluded paths used (e.g. the OAuth2 form body).
  const reachable = closure(
    new Set([...responseRoots, ...requestRoots]),
    schemas
  )
  for (const name of Object.keys(schemas))
    if (!reachable.has(name)) delete schemas[name]

  const requestSchemas = closure(requestRoots, schemas)
  for (const name of closure(responseRoots, schemas)) {
    const schema = schemas[name] as {
      properties?: Record<string, Schema>
      required?: string[]
    }
    // Schemas defined above already declare their own optional keys.
    if (requestSchemas.has(name) || name in OBJECTS || !schema.properties)
      continue
    schema.required = Object.keys(schema.properties)
  }

  return spec
}
