/**
 * Service configuration (backend core/modules/config/router.py + suggest_router.py): services, presets,
 * questions, ICP, disqualification rules and scoring profiles. Writes that the backend rescores
 * synchronously (question weight/is_active, question delete, ICP, rules, scoring profile) rescore here too.
 */
import type {
  Criterion,
  DisqualificationRuleCreate,
  DisqualificationRuleOut,
  DisqualificationRuleUpdate,
  ExpandQuestionOut,
  FirmographicCondition,
  ICPProfileIn,
  ICPProfileOut,
  QuestionSuggestionsOut,
  RescoreResult,
  RuleCondition,
  ScoringParams,
  ScoringProfileIn,
  ScoringProfileOut,
  ServiceCreate,
  ServiceOut,
  ServiceUpdate,
  SignalQuestionCreate,
  SignalQuestionOut,
  SignalQuestionUpdate,
  SourceType,
} from "@/api/generated/model"

import { nextId, ORG_ID } from "../data/ids"
import { SIGNAL_CATEGORIES, SOURCE_TYPES } from "../data/meta"
import { PRESETS } from "../data/presets"
import { isoNow } from "../data/time"
import { db } from "../db"
import { DEFAULT_PARAMS, rescoreService } from "../engine/scoring"
import { suggestQuestions } from "../engine/suggest"
import { processingDelay } from "../settings"
import { enqueueExpansion } from "../sim/expansion"
import {
  ApiFailure,
  fail,
  has,
  json,
  noContent,
  pathUuid,
  readJson,
  route,
  validateBody,
  type FieldSpec,
  type ValidationItem,
} from "./http"

const admin = { role: "admin" } as const

function service(id: string): ServiceOut {
  const found = db.services.find((s) => s.id === id)
  if (!found) throw fail.notFound("Service not found")
  return found
}

/** Engine (ai contract) validation → 422 with the HTTP reason phrase (config/router.py `_unprocessable`). */
function engineError(
  msg: string,
  input: unknown,
  loc: (string | number)[] = []
): ApiFailure {
  return new ApiFailure(422, "validation_error", "Unprocessable Content", {
    errors: [{ type: "value_error", loc, msg: `Value error, ${msg}`, input }],
  })
}

/** Writes into NOT NULL columns with an explicit null fail like the backend (IntegrityError → 500). */
function rejectNulls(body: object, keys: string[]): void {
  for (const key of keys)
    if ((body as Record<string, unknown>)[key] === null) throw fail.internal()
}

// --- services ------------------------------------------------------------------------------------------

const serviceFields: Record<string, FieldSpec> = {
  name: { type: "string", min: 1, max: 255, nullable: true },
  description: { type: "string", nullable: true },
  value_proposition: { type: "string", nullable: true },
  decision_makers: { type: "list", items: "string", nullable: true },
  is_active: { type: "bool", nullable: true },
}

// --- questions -----------------------------------------------------------------------------------------

const categoryError = (
  value: unknown,
  loc: (string | number)[]
): ValidationItem => ({
  loc,
  msg: `Value error, unknown category '${String(value)}', expected one of [${SIGNAL_CATEGORIES.map((c) => `'${c}'`).join(", ")}]`,
  type: "value_error",
})

function checkCategory(body: Record<string, unknown>): void {
  if (
    has(body, "category") &&
    body.category !== null &&
    !SIGNAL_CATEGORIES.includes(body.category as never)
  )
    throw fail.validation([categoryError(body.category, ["body", "category"])])
}

const questionFields = (create: boolean): Record<string, FieldSpec> => ({
  ...(create
    ? { key: { type: "string", min: 1, max: 128, required: true } as FieldSpec }
    : {}),
  text: { type: "string", min: 1, required: create, nullable: !create },
  category: { type: "string", nullable: !create },
  polarity: {
    type: "string",
    enum: ["positive", "negative"],
    nullable: !create,
  },
  weight: {
    type: "string",
    enum: ["high", "medium", "low"],
    nullable: !create,
  },
  source_types: {
    type: "list",
    items: { enum: SOURCE_TYPES },
    minItems: 1,
    nullable: !create,
  },
  recency_days: { type: "int", gt: 0, nullable: !create },
  job_titles: { type: "list", items: "string", nullable: !create },
  negative_terms: { type: "list", items: "string", nullable: !create },
  ...(create
    ? {}
    : { is_active: { type: "bool", nullable: true } as FieldSpec }),
})

const dedupe = <T>(values: T[]) =>
  values.filter((v, i) => values.indexOf(v) === i)

function question(id: string): SignalQuestionOut {
  const found = db.questions.find((q) => q.id === id)
  if (!found) throw fail.notFound("Question not found")
  return found
}

// --- ICP -------------------------------------------------------------------------------------------------

const CRITERION_KINDS = [
  "country_in",
  "industry_in",
  "employees_between",
  "revenue_at_least",
  "tag_in",
] as const

function validateIcp(body: unknown): ICPProfileIn {
  const icp = validateBody<ICPProfileIn>(
    body,
    {
      countries: { type: "list", items: "string" },
      industries_any: { type: "list", items: "string" },
      employees_min: { type: "int", ge: 0, nullable: true },
      employees_max: { type: "int", ge: 0, nullable: true },
      revenue_min_eur: { type: "number", ge: 0, nullable: true },
      nice_to_have: { type: "object", nullable: true },
    },
    { forbidExtra: true }
  )
  if (icp.nice_to_have) {
    const errors: ValidationItem[] = []
    const nice = icp.nice_to_have as unknown as Record<string, unknown>
    for (const key of Object.keys(nice))
      if (key !== "criteria")
        errors.push({
          loc: ["body", "nice_to_have", key],
          msg: "Extra inputs are not permitted",
          type: "extra_forbidden",
        })
    const criteria = nice.criteria
    if (criteria !== undefined && !Array.isArray(criteria))
      errors.push({
        loc: ["body", "nice_to_have", "criteria"],
        msg: "Input should be a valid list",
        type: "list_type",
      })
    if (Array.isArray(criteria))
      criteria.forEach((c: unknown, i) => {
        const loc = ["body", "nice_to_have", "criteria", i]
        const item = (c ?? {}) as Record<string, unknown>
        if (!CRITERION_KINDS.includes(item.kind as never))
          errors.push({
            loc: [...loc, "kind"],
            msg: `Input should be ${CRITERION_KINDS.slice(0, -1)
              .map((k) => `'${k}'`)
              .join(", ")} or 'tag_in'`,
            type: "literal_error",
          })
        if (!Array.isArray(item.values))
          errors.push({
            loc: [...loc, "values"],
            msg: "Field required",
            type: "missing",
          })
        if (
          item.weight !== undefined &&
          !(typeof item.weight === "number" && item.weight > 0)
        )
          errors.push({
            loc: [...loc, "weight"],
            msg: "Input should be greater than 0",
            type: "greater_than",
          })
        for (const key of Object.keys(item))
          if (!["kind", "values", "weight"].includes(key))
            errors.push({
              loc: [...loc, key],
              msg: "Extra inputs are not permitted",
              type: "extra_forbidden",
            })
      })
    if (errors.length) throw fail.validation(errors)
  }
  if (
    icp.employees_min != null &&
    icp.employees_max != null &&
    icp.employees_min > icp.employees_max
  )
    throw engineError("employees_min must be <= employees_max", icp)
  return icp
}

// --- rules ----------------------------------------------------------------------------------------------

const FIELDS = [
  "employees",
  "revenue_eur",
  "country_code",
  "industry_ids",
  "domain",
  "tags",
]
const OPS = ["lt", "gt", "eq", "in", "not_in", "intersects"]

function validateCondition(kind: string, condition: unknown): RuleCondition {
  if (
    typeof condition !== "object" ||
    condition === null ||
    Array.isArray(condition)
  )
    throw engineError("condition must be an object", condition, ["condition"])
  const c = condition as Record<string, unknown>
  const allowed =
    kind === "firmographic"
      ? ["field", "op", "value"]
      : kind === "signal"
        ? ["question_key", "min_strength"]
        : ["domains"]
  for (const key of Object.keys(c))
    if (!allowed.includes(key))
      throw engineError(
        `unexpected key '${key}' in a ${kind} condition`,
        condition,
        ["condition", key]
      )
  if (kind === "firmographic") {
    if (!FIELDS.includes(String(c.field)))
      throw engineError(`unknown field '${String(c.field)}'`, condition, [
        "condition",
        "field",
      ])
    if (!OPS.includes(String(c.op)))
      throw engineError(`unknown op '${String(c.op)}'`, condition, [
        "condition",
        "op",
      ])
    if (c.value === undefined)
      throw engineError("value is required", condition, ["condition", "value"])
    if (
      (c.op === "lt" || c.op === "gt") &&
      (typeof c.value !== "number" ||
        !["employees", "revenue_eur"].includes(String(c.field)))
    )
      throw engineError(
        `op '${String(c.op)}' needs a numeric value and field employees or revenue_eur`,
        condition,
        ["condition"]
      )
    if (
      ["in", "not_in", "intersects"].includes(String(c.op)) &&
      !Array.isArray(c.value)
    )
      throw engineError(`op '${String(c.op)}' needs a list value`, condition, [
        "condition",
      ])
    return { field: c.field, op: c.op, value: c.value } as FirmographicCondition
  }
  if (kind === "signal") {
    if (typeof c.question_key !== "string" || !c.question_key)
      throw engineError("question_key is required", condition, [
        "condition",
        "question_key",
      ])
    if (
      typeof c.min_strength !== "number" ||
      c.min_strength < 0 ||
      c.min_strength > 1
    )
      throw engineError("min_strength must be between 0 and 1", condition, [
        "condition",
        "min_strength",
      ])
    return { question_key: c.question_key, min_strength: c.min_strength }
  }
  if (
    !Array.isArray(c.domains) ||
    c.domains.length === 0 ||
    c.domains.some((d) => typeof d !== "string")
  )
    throw engineError(
      "domains must be a non-empty list of domains",
      condition,
      ["condition", "domains"]
    )
  return { domains: c.domains as string[] }
}

function checkRule(
  rule: Pick<
    DisqualificationRuleOut,
    "kind" | "condition" | "action" | "cap_value"
  >
): void {
  if (rule.action === "cap" && rule.cap_value === null)
    throw engineError("action 'cap' requires cap_value", rule)
}

const ruleFields = (create: boolean): Record<string, FieldSpec> => ({
  name: { type: "string", min: 1, required: create, nullable: !create },
  ...(create
    ? {
        kind: {
          type: "string",
          enum: ["firmographic", "signal", "list"],
          required: true,
        } as FieldSpec,
      }
    : {}),
  condition: { type: "object", required: create, nullable: !create },
  action: {
    type: "string",
    enum: ["exclude", "cap", "flag"],
    required: create,
    nullable: !create,
  },
  cap_value: { type: "number", ge: 0, le: 100, nullable: true },
  is_active: { type: "bool", nullable: !create },
})

// --- scoring profile --------------------------------------------------------------------------------

function validateParams(params: Record<string, unknown>): void {
  const known = Object.keys(DEFAULT_PARAMS)
  const unknown = Object.keys(params).filter((k) => !known.includes(k))
  if (unknown.length)
    throw fail.unprocessable(
      `Unknown scoring parameters: [${unknown.map((k) => `'${k}'`).join(", ")}]`
    )
  const exactKeys = (name: string, keys: string[]) => {
    const value = params[name]
    if (value === undefined) return
    const obj = value as Record<string, unknown>
    if (
      typeof value !== "object" ||
      value === null ||
      Object.keys(obj).sort().join() !== [...keys].sort().join()
    )
      throw engineError(
        `${name} must define exactly ${keys.join(", ")}`,
        value,
        [name]
      )
    for (const k of keys)
      if (typeof obj[k] !== "number")
        throw engineError(`${name}.${k} must be a number`, value, [name, k])
  }
  exactKeys("weights", ["high", "medium", "low"])
  exactKeys("strength_values", ["weak", "moderate", "strong"])
  exactKeys("tiers", ["hot", "warm"])
  const tiers = params.tiers as { hot: number; warm: number } | undefined
  if (tiers && tiers.hot < tiers.warm)
    throw engineError("tiers must define hot >= warm", tiers, ["tiers"])
  const num = (
    name: string,
    check: (v: number) => boolean,
    msg: string,
    int = false
  ) => {
    const v = params[name]
    if (v === undefined) return
    if (typeof v !== "number" || (int && !Number.isInteger(v)) || !check(v))
      throw engineError(`${name} ${msg}`, v, [name])
  }
  num("tau_intent", (v) => v > 0, "must be greater than 0")
  num("tau_risk", (v) => v > 0, "must be greater than 0")
  num("fit_exponent", (v) => v >= 0, "must be greater than or equal to 0")
  num("intent_exponent", (v) => v >= 0, "must be greater than or equal to 0")
  num("risk_penalty", (v) => v >= 0 && v <= 1, "must be between 0 and 1")
  num("min_confidence", (v) => v >= 0 && v <= 1, "must be between 0 and 1")
  num(
    "max_evidence_per_question",
    (v) => v >= 1,
    "must be an integer >= 1",
    true
  )
  num("fit_floor", (v) => v >= 0 && v < 100, "must be in [0, 100)")
  num("undated_age_days", (v) => v >= 0, "must be an integer >= 0", true)
  for (const name of ["reliability", "half_life_days"]) {
    const v = params[name]
    if (
      v !== undefined &&
      (typeof v !== "object" || v === null || Array.isArray(v))
    )
      throw engineError(`${name} must be a mapping`, v, [name])
  }
  const halfLife = params.half_life_days as Record<string, unknown> | undefined
  for (const [k, v] of Object.entries(halfLife ?? {}))
    if (v !== null && !(typeof v === "number" && v > 0))
      throw engineError("half-life must be > 0 or null", v, [
        "half_life_days",
        k,
      ])
}

function rescored(serviceId: string): void {
  rescoreService(db, serviceId, new Date())
}

// --- handlers ---------------------------------------------------------------------------------------

export const configHandlers = [
  route("get", "/services", () => json<ServiceOut[]>(db.services)),

  route(
    "post",
    "/services",
    async ({ request }) => {
      const body = validateBody<ServiceCreate>(
        await readJson(request),
        {
          ...serviceFields,
          name: { type: "string", min: 1, max: 255, required: true },
          slug: { type: "string", min: 1, max: 128, required: true },
          description: { type: "string" },
          value_proposition: { type: "string" },
          decision_makers: { type: "list", items: "string" },
          is_active: { type: "bool" },
        },
        { forbidExtra: true }
      )
      // Unique (org_id, slug) is not mapped to 409 by the backend: IntegrityError → 500.
      if (db.services.some((s) => s.slug === body.slug)) throw fail.internal()
      const now = isoNow()
      const created: ServiceOut = {
        id: nextId(db),
        org_id: ORG_ID,
        name: body.name,
        slug: body.slug,
        description: body.description ?? "",
        value_proposition: body.value_proposition ?? "",
        decision_makers: body.decision_makers ?? [],
        is_active: body.is_active ?? true,
        created_at: now,
        updated_at: now,
      }
      db.services.push(created)
      return json<ServiceOut>(created, 201)
    },
    admin
  ),

  route("get", "/services/:id", (ctx) =>
    json<ServiceOut>(service(pathUuid(ctx)))
  ),

  route(
    "patch",
    "/services/:id",
    async (ctx) => {
      const id = pathUuid(ctx)
      const body = validateBody<ServiceUpdate>(
        await readJson(ctx.request),
        serviceFields,
        { forbidExtra: true }
      )
      const target = service(id)
      rejectNulls(body, [
        "name",
        "description",
        "value_proposition",
        "decision_makers",
        "is_active",
      ])
      if (has(body, "name") && body.name) target.name = body.name
      if (has(body, "description") && body.description != null)
        target.description = body.description
      if (has(body, "value_proposition") && body.value_proposition != null)
        target.value_proposition = body.value_proposition
      if (has(body, "decision_makers") && body.decision_makers)
        target.decision_makers = [...body.decision_makers]
      if (has(body, "is_active") && body.is_active != null)
        target.is_active = body.is_active
      target.updated_at = isoNow()
      return json<ServiceOut>(target)
    },
    admin
  ),

  route(
    "post",
    "/presets/:key/apply",
    (ctx) => {
      const key = ctx.params.key ?? ""
      const preset = PRESETS.find((p) => p.key === key)
      if (!preset) throw fail.notFound(`Unknown preset '${key}'`)
      const existing = db.services.find((s) => s.slug === key)
      if (existing) return json<ServiceOut>(existing)
      const now = isoNow()
      const created: ServiceOut = {
        id: nextId(db),
        org_id: ORG_ID,
        name: preset.name,
        slug: preset.key,
        description: preset.description,
        value_proposition: preset.value_proposition,
        decision_makers: [...preset.decision_makers],
        is_active: true,
        created_at: now,
        updated_at: now,
      }
      db.services.push(created)
      for (const pq of preset.questions) {
        const q: SignalQuestionOut = {
          id: nextId(db),
          org_id: ORG_ID,
          service_id: created.id,
          key: pq.key,
          text: pq.text,
          category: pq.category,
          polarity: pq.polarity,
          weight: pq.weight,
          source_types: [...pq.source_types],
          recency_days: pq.recency_days,
          keywords: structuredClone(pq.keywords_seed),
          job_titles: [...pq.job_titles],
          negative_terms: [...pq.negative_terms],
          keywords_status: "pending",
          version: 1,
          is_active: true,
          created_at: now,
          updated_at: now,
        }
        db.questions.push(q)
        enqueueExpansion(q.id)
      }
      db.icps.push({
        id: nextId(db),
        service_id: created.id,
        countries: [...preset.icp.countries],
        industries_any: [],
        employees_min: preset.icp.employees_min,
        employees_max: null,
        revenue_min_eur: null,
        nice_to_have: { criteria: structuredClone(preset.icp.nice_to_have) },
        version: 1,
        created_at: now,
        updated_at: now,
      })
      for (const rule of preset.rules)
        db.rules.push({
          id: nextId(db),
          service_id: created.id,
          ...structuredClone(rule),
          is_active: true,
          created_at: now,
          updated_at: now,
        })
      db.profiles.push({
        id: nextId(db),
        service_id: created.id,
        version: 1,
        params: structuredClone(DEFAULT_PARAMS),
        is_current: true,
        created_at: now,
        updated_at: now,
      })
      return json<ServiceOut>(created)
    },
    admin
  ),

  // --- questions ---
  route("get", "/services/:id/questions", (ctx) => {
    const id = pathUuid(ctx)
    return json<SignalQuestionOut[]>(
      db.questions.filter((q) => q.service_id === id)
    )
  }),

  route(
    "post",
    "/services/:id/questions",
    async (ctx) => {
      const id = pathUuid(ctx)
      const raw = await readJson(ctx.request)
      const body = validateBody<SignalQuestionCreate>(
        raw,
        questionFields(true),
        { forbidExtra: true }
      )
      checkCategory(raw as Record<string, unknown>)
      service(id)
      if (db.questions.some((q) => q.service_id === id && q.key === body.key))
        throw fail.conflict(
          `Question key '${body.key}' already exists in this service (deleted questions keep their key)`
        )
      const now = isoNow()
      const created: SignalQuestionOut = {
        id: nextId(db),
        org_id: ORG_ID,
        service_id: id,
        key: body.key,
        text: body.text,
        category: body.category ?? "ai_automation",
        polarity: body.polarity ?? "positive",
        weight: body.weight ?? "medium",
        source_types: dedupe(
          (body.source_types ?? ["website", "news", "jobs"]) as SourceType[]
        ),
        recency_days: body.recency_days ?? 180,
        keywords: null,
        job_titles: body.job_titles ?? [],
        negative_terms: body.negative_terms ?? [],
        keywords_status: "pending",
        version: 1,
        is_active: true,
        created_at: now,
        updated_at: now,
      }
      db.questions.push(created)
      enqueueExpansion(created.id)
      return json<SignalQuestionOut>(created, 201)
    },
    admin
  ),

  route(
    "patch",
    "/questions/:id",
    async (ctx) => {
      const id = pathUuid(ctx)
      const raw = await readJson(ctx.request)
      const body = validateBody<SignalQuestionUpdate>(
        raw,
        questionFields(false),
        { forbidExtra: true }
      )
      checkCategory(raw as Record<string, unknown>)
      const q = question(id)
      rejectNulls(body, [
        "text",
        "category",
        "polarity",
        "weight",
        "source_types",
        "recency_days",
        "job_titles",
        "negative_terms",
        "is_active",
      ])
      let meaning = false
      let scoring = false
      if (has(body, "text") && body.text && body.text !== q.text) {
        q.text = body.text
        meaning = true
      }
      if (
        has(body, "category") &&
        body.category &&
        body.category !== q.category
      ) {
        q.category = body.category
        meaning = true
      }
      if (
        has(body, "polarity") &&
        body.polarity &&
        body.polarity !== q.polarity
      ) {
        q.polarity = body.polarity
        meaning = true
      }
      if (has(body, "source_types") && body.source_types) {
        const next = dedupe(body.source_types)
        if (next.join() !== q.source_types.join()) {
          q.source_types = next
          meaning = true
        }
      }
      if (
        has(body, "recency_days") &&
        body.recency_days != null &&
        body.recency_days !== q.recency_days
      ) {
        q.recency_days = body.recency_days
        meaning = true
      }
      if (has(body, "weight") && body.weight && body.weight !== q.weight) {
        q.weight = body.weight
        scoring = true
      }
      if (
        has(body, "is_active") &&
        body.is_active != null &&
        body.is_active !== q.is_active
      ) {
        q.is_active = body.is_active
        scoring = true
      }
      if (has(body, "job_titles") && body.job_titles)
        q.job_titles = [...body.job_titles]
      if (has(body, "negative_terms") && body.negative_terms)
        q.negative_terms = [...body.negative_terms]
      q.updated_at = isoNow()
      if (meaning) {
        q.version += 1
        enqueueExpansion(q.id)
      }
      if (scoring) rescored(q.service_id)
      return json<SignalQuestionOut>(q)
    },
    admin
  ),

  route(
    "delete",
    "/questions/:id",
    (ctx) => {
      const id = pathUuid(ctx)
      const q = db.questions.find((item) => item.id === id)
      if (q?.is_active) {
        q.is_active = false
        q.updated_at = isoNow()
        rescored(q.service_id)
      }
      return noContent()
    },
    admin
  ),

  route(
    "post",
    "/questions/:id/expand",
    (ctx) => {
      const q = question(pathUuid(ctx))
      enqueueExpansion(q.id)
      return json<ExpandQuestionOut>(
        { status: "enqueued", question_id: q.id },
        202
      )
    },
    admin
  ),

  route(
    "post",
    "/services/:id/questions/suggest",
    async (ctx) => {
      const target = service(pathUuid(ctx))
      await processingDelay(1500)
      const cheap = db.usage.find((m) => m.pool === "cheap")
      if (cheap) {
        cheap.calls += 1
        cheap.input_tokens += 2400
        cheap.output_tokens += 1100
      }
      return json<QuestionSuggestionsOut>(
        suggestQuestions(target, db.questions)
      )
    },
    admin
  ),

  // --- ICP ---
  route("get", "/services/:id/icp", (ctx) => {
    const id = pathUuid(ctx)
    const icp = db.icps.find((i) => i.service_id === id)
    if (!icp) throw fail.notFound("ICP not configured")
    return json<ICPProfileOut>(icp)
  }),

  route(
    "put",
    "/services/:id/icp",
    async (ctx) => {
      const id = pathUuid(ctx)
      const body = validateIcp(await readJson(ctx.request))
      if (!db.services.some((s) => s.id === id)) throw fail.internal()
      const now = isoNow()
      const criteria: Criterion[] = (body.nice_to_have?.criteria ?? []).map(
        (c) => ({
          kind: c.kind,
          values: [...c.values],
          weight: c.weight ?? 1,
        })
      )
      const fields = {
        countries: [...(body.countries ?? [])],
        industries_any: [...(body.industries_any ?? [])],
        employees_min: body.employees_min ?? null,
        employees_max: body.employees_max ?? null,
        revenue_min_eur:
          body.revenue_min_eur === null || body.revenue_min_eur === undefined
            ? null
            : Number(body.revenue_min_eur),
        nice_to_have: body.nice_to_have ? { criteria } : null,
      }
      let icp = db.icps.find((i) => i.service_id === id)
      if (icp)
        Object.assign(icp, fields, {
          version: icp.version + 1,
          updated_at: now,
        })
      else {
        icp = {
          id: nextId(db),
          service_id: id,
          ...fields,
          version: 1,
          created_at: now,
          updated_at: now,
        }
        db.icps.push(icp)
      }
      rescored(id)
      return json<ICPProfileOut>(icp)
    },
    admin
  ),

  // --- rules ---
  route("get", "/services/:id/rules", (ctx) => {
    const id = pathUuid(ctx)
    return json<DisqualificationRuleOut[]>(
      db.rules.filter((r) => r.service_id === id)
    )
  }),

  route(
    "post",
    "/services/:id/rules",
    async (ctx) => {
      const id = pathUuid(ctx)
      const body = validateBody<DisqualificationRuleCreate>(
        await readJson(ctx.request),
        ruleFields(true),
        { forbidExtra: true }
      )
      const condition = validateCondition(body.kind, body.condition)
      const rule: DisqualificationRuleOut = {
        id: "",
        service_id: id,
        name: body.name,
        kind: body.kind,
        condition,
        action: body.action,
        cap_value: body.cap_value ?? null,
        is_active: body.is_active ?? true,
        created_at: isoNow(),
        updated_at: isoNow(),
      }
      checkRule(rule)
      // No existence check in the backend: the FK error surfaces as 500.
      if (!db.services.some((s) => s.id === id)) throw fail.internal()
      rule.id = nextId(db)
      db.rules.push(rule)
      rescored(id)
      return json<DisqualificationRuleOut>(rule, 201)
    },
    admin
  ),

  route(
    "patch",
    "/rules/:id",
    async (ctx) => {
      const id = pathUuid(ctx)
      const body = validateBody<DisqualificationRuleUpdate>(
        await readJson(ctx.request),
        ruleFields(false),
        { forbidExtra: true }
      )
      const rule = db.rules.find((r) => r.id === id)
      if (!rule) throw fail.notFound("Rule not found")
      const merged: DisqualificationRuleOut = {
        ...rule,
        name: has(body, "name") && body.name ? body.name : rule.name,
        condition:
          has(body, "condition") && body.condition
            ? validateCondition(rule.kind, body.condition)
            : rule.condition,
        action: has(body, "action") && body.action ? body.action : rule.action,
        cap_value: has(body, "cap_value")
          ? (body.cap_value ?? null)
          : rule.cap_value,
        is_active:
          has(body, "is_active") && body.is_active != null
            ? body.is_active
            : rule.is_active,
      }
      checkRule(merged)
      Object.assign(rule, merged, { updated_at: isoNow() })
      rescored(rule.service_id)
      return json<DisqualificationRuleOut>(rule)
    },
    admin
  ),

  route(
    "delete",
    "/rules/:id",
    (ctx) => {
      const id = pathUuid(ctx)
      const index = db.rules.findIndex((r) => r.id === id)
      if (index >= 0) {
        const [rule] = db.rules.splice(index, 1)
        rescored(rule.service_id)
      }
      return noContent()
    },
    admin
  ),

  // --- scoring profile ---
  route("get", "/services/:id/scoring-profile", (ctx) => {
    const id = pathUuid(ctx)
    const profile = db.profiles.find((p) => p.service_id === id && p.is_current)
    if (!profile) throw fail.notFound("Scoring profile not found")
    return json<ScoringProfileOut>(profile)
  }),

  route(
    "put",
    "/services/:id/scoring-profile",
    async (ctx) => {
      const id = pathUuid(ctx)
      const body = validateBody<ScoringProfileIn>(
        await readJson(ctx.request),
        { params: { type: "object", required: true } },
        { forbidExtra: true }
      )
      validateParams(body.params as unknown as Record<string, unknown>)
      if (!db.services.some((s) => s.id === id)) throw fail.internal()
      const versions = db.profiles.filter((p) => p.service_id === id)
      for (const p of versions) p.is_current = false
      const now = isoNow()
      const version =
        versions.reduce((max, p) => Math.max(max, p.version), 0) + 1
      db.profiles.push({
        id: nextId(db),
        service_id: id,
        version,
        // stored verbatim (a partial object stays partial; missing keys fall back to engine defaults)
        params: structuredClone(body.params) as ScoringParams,
        is_current: true,
        created_at: now,
        updated_at: now,
      })
      const result = rescoreService(db, id, new Date())
      return json<RescoreResult>({
        version,
        rescored: result.rescored,
        tier_changes: result.tier_changes,
        // deterministic stand-in for the backend's measured time (≈ 2 s per 1,000 companies)
        duration_ms: 12 + result.rescored * 3,
      })
    },
    admin
  ),
]
