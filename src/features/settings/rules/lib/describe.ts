import type {
  DisqualificationRuleOut,
  LeadListItem,
  SignalQuestionOut,
} from "@/api/generated/model"
import { copy } from "@/features/settings/rules/copy"

const QUESTION_MAX = 48

/** Questions have no short label in the API (backend gap), so long texts are cut for selects and sentences. */
export function shortQuestion(text: string) {
  return text.length > QUESTION_MAX
    ? `${text.slice(0, QUESTION_MAX - 1).trimEnd()}…`
    : text
}

export function questionText(
  questions: SignalQuestionOut[] | undefined,
  key: string
) {
  return questions?.find((question) => question.key === key)?.text ?? key
}

/** weak / moderate / strong for a stored min_strength (thresholds from the design spec). */
export function strengthWord(value: number) {
  if (value < 0.5) return "weak"
  if (value < 0.85) return "moderate"
  return "strong"
}

/**
 * "Affects now" without a per-rule count in the API: GET /leads `flags` lists the names of the rules that
 * fired (leads/router.py _flags), so the count is by rule name. Inactive rules are not evaluated.
 */
export function affectsNow(
  rule: DisqualificationRuleOut,
  leads: LeadListItem[]
) {
  if (!rule.is_active) return copy.affects.inactive
  const hits = leads.filter((lead) => lead.flags.includes(rule.name))
  if (hits.length === 0) return copy.affects.none
  if (hits.length === 1)
    return copy.affects.one(hits[0].company.name.split(/\s+/)[0])
  return copy.affects.many(hits.length)
}
