import { z } from "zod"

import {
  FirmographicConditionField,
  FirmographicConditionOp,
  RuleAction,
  RuleKind,
  type DisqualificationRuleCreate,
  type DisqualificationRuleOut,
  type DisqualificationRuleUpdate,
  type RuleCondition,
} from "@/api/generated/model"
import { copy } from "@/features/settings/rules/copy"
import {
  normalizeDomain,
  parseDomains,
} from "@/features/settings/rules/lib/domains"

type Field = FirmographicConditionField
type Op = FirmographicConditionOp

/** Operators the builder offers per field (lt/gt only on numbers, list ops on lists: ai contracts). */
export const fieldOps: Record<Field, Op[]> = {
  employees: ["lt", "gt", "eq"],
  revenue_eur: ["lt", "gt", "eq"],
  country_code: ["in", "not_in"],
  industry_ids: ["intersects", "not_in"],
  tags: ["intersects", "not_in"],
  domain: ["eq", "in", "not_in"],
}

export const isNumericField = (field: Field) =>
  field === "employees" || field === "revenue_eur"
/** `domain is x.com` is the one free-text value; every other non-numeric condition takes a list. */
export const isTextValue = (field: Field, op: Op) =>
  field === "domain" && op === "eq"

export const ruleSchema = z
  .object({
    name: z.string().trim().min(1, copy.errors.name),
    kind: z.enum(RuleKind),
    action: z.enum(RuleAction),
    cap: z.number().nullable(),
    field: z.enum(FirmographicConditionField),
    op: z.enum(FirmographicConditionOp),
    amount: z.number().nullable(),
    text: z.string(),
    items: z.array(z.string()),
    questionKey: z.string(),
    minStrength: z
      .number()
      .gt(0, copy.errors.strength)
      .max(1, copy.errors.strength),
    domains: z.string(),
  })
  .superRefine((draft, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message })
    if (draft.action === "cap" && (draft.cap === null || draft.cap > 100))
      issue("cap", copy.errors.cap)
    if (draft.kind === "list" && parseDomains(draft.domains).length === 0)
      issue("domains", copy.errors.domains)
    if (draft.kind === "signal" && !draft.questionKey)
      issue("questionKey", copy.errors.question)
    if (draft.kind !== "firmographic") return
    if (isNumericField(draft.field)) {
      if (draft.amount === null) issue("amount", copy.errors.number)
    } else if (isTextValue(draft.field, draft.op)) {
      if (!normalizeDomain(draft.text)) issue("text", copy.errors.domain)
    } else if (draft.items.length === 0) {
      issue("items", copy.errors.values)
    }
  })

export type RuleDraft = z.infer<typeof ruleSchema>

const DEFAULT_STRENGTH = 0.6

export const emptyDraft: RuleDraft = {
  name: "",
  kind: "firmographic",
  action: "exclude",
  cap: null,
  field: "employees",
  op: "lt",
  amount: null,
  text: "",
  items: [],
  questionKey: "",
  minStrength: DEFAULT_STRENGTH,
  domains: "",
}

/** Stored ops outside the builder's list: the engine treats eq/in on list fields as "any overlap". */
function builderOp(field: Field, op: Op): Op {
  const ops = fieldOps[field]
  if (ops.includes(op)) return op
  return ops.includes("intersects") && (op === "eq" || op === "in")
    ? "intersects"
    : ops[0]
}

export function toDraft(rule: DisqualificationRuleOut): RuleDraft {
  const draft: RuleDraft = {
    ...emptyDraft,
    name: rule.name,
    kind: rule.kind,
    action: rule.action,
    cap: rule.cap_value,
  }
  const condition = rule.condition
  if ("domains" in condition)
    return { ...draft, domains: condition.domains.join("\n") }
  if ("question_key" in condition) {
    return {
      ...draft,
      questionKey: condition.question_key,
      minStrength: condition.min_strength,
    }
  }
  const values = Array.isArray(condition.value)
    ? condition.value
    : [condition.value]
  const op = builderOp(condition.field, condition.op)
  const first = Number(values[0])
  return {
    ...draft,
    field: condition.field,
    op,
    amount:
      isNumericField(condition.field) && Number.isFinite(first) ? first : null,
    text: isTextValue(condition.field, op) ? String(values[0] ?? "") : "",
    items: values.map(String),
  }
}

/** Condition JSON exactly as the ai contracts expect (extra keys are rejected with 422). */
export function toCondition(draft: RuleDraft): RuleCondition {
  if (draft.kind === "list") return { domains: parseDomains(draft.domains) }
  if (draft.kind === "signal")
    return { question_key: draft.questionKey, min_strength: draft.minStrength }
  const { field, op } = draft
  if (isNumericField(field)) return { field, op, value: draft.amount ?? 0 }
  if (isTextValue(field, op))
    return { field, op, value: normalizeDomain(draft.text) }
  return { field, op, value: draft.items }
}

const capValue = (draft: RuleDraft) =>
  draft.action === "cap" ? draft.cap : null

export function toCreate(draft: RuleDraft): DisqualificationRuleCreate {
  return {
    name: draft.name.trim(),
    kind: draft.kind,
    condition: toCondition(draft),
    action: draft.action,
    cap_value: capValue(draft),
    is_active: true,
  }
}

/** PATCH with the changed keys only; `kind` is immutable (DisqualificationRuleUpdate has no kind). */
export function toUpdate(
  draft: RuleDraft,
  rule: DisqualificationRuleOut
): DisqualificationRuleUpdate {
  const update: DisqualificationRuleUpdate = {}
  const name = draft.name.trim()
  if (name !== rule.name) update.name = name
  const condition = toCondition(draft)
  if (JSON.stringify(condition) !== JSON.stringify(rule.condition))
    update.condition = condition
  if (draft.action !== rule.action) update.action = draft.action
  const cap = capValue(draft)
  if (cap !== rule.cap_value) update.cap_value = cap
  return update
}
