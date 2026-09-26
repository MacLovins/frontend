import type {
  FirmographicConditionField,
  SuggestedRuleOut,
} from "@/api/generated/model"
import { formatNumber } from "@/lib/format"

export type RuleNames = {
  industry: (id: string) => string
  country: (code: string) => string
  question: (key: string) => string
}

const fieldNames: Record<FirmographicConditionField, string> = {
  employees: "Employees",
  revenue_eur: "Revenue (€)",
  country_code: "Country",
  industry_ids: "Industry",
  domain: "Domain",
  tags: "Tags",
}

function joinOr(items: string[]) {
  if (items.length < 2) return items.join("")
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`
}

function strengthWord(value: number) {
  if (value < 0.5) return "weak"
  if (value < 0.85) return "moderate"
  return "strong"
}

/** The condition as one plain sentence, e.g. "Employees less than 500" or `Signal "Distress" is at least moderate`. */
export function describeCondition(
  condition: SuggestedRuleOut["condition"],
  names: RuleNames
) {
  if ("domains" in condition) {
    return `Domain is in a list of ${formatNumber(condition.domains.length)}`
  }
  if ("question_key" in condition) {
    return `Signal "${names.question(condition.question_key)}" is at least ${strengthWord(condition.min_strength)}`
  }
  const { field, op, value } = condition
  const values = (Array.isArray(value) ? value : [value]).map((item) => {
    if (field === "industry_ids") return names.industry(String(item))
    if (field === "country_code") return names.country(String(item))
    return typeof item === "number" ? formatNumber(item) : item
  })
  const label = fieldNames[field]
  if (op === "lt") return `${label} less than ${values[0]}`
  if (op === "gt") return `${label} more than ${values[0]}`
  if (field === "tags") {
    return `${op === "not_in" ? "Not tagged" : "Tagged"} ${joinOr(values)}`
  }
  if (op === "not_in") return `${label} is not ${joinOr(values)}`
  return `${label} is ${joinOr(values)}`
}

export function describeAction(rule: SuggestedRuleOut) {
  if (rule.action === "exclude") return "⊘ Exclude"
  if (rule.action === "cap") return `⤓ Cap at ${rule.cap_value ?? 0}`
  return "⚑ Flag"
}
