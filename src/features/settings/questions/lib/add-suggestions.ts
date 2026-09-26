import { createRule } from "@/api/generated/config/config"
import type {
  SuggestedQuestionOut,
  SuggestedRuleOut,
} from "@/api/generated/model"
import { createWithUniqueKey } from "@/features/settings/questions/lib/question-key"

export type RuleDraft = { id: string; rule: SuggestedRuleOut }

type AddSuggestionsResult = {
  /** Draft ids (question keys and rule ids) that were saved and leave the list. */
  addedDraftIds: string[]
  createdQuestionIds: string[]
  /** Draft key → the key the question was saved with, this attempt and earlier ones. */
  savedKeys: ReadonlyMap<string, string>
  rulesAdded: number
  failed: number
  error: unknown
}

/**
 * Saves the checked drafts one by one: questions first, then rules. `label` and `keywords` are dropped because
 * the create schema forbids extra keys (backend config/schemas.py). A suggested key can still collide with a
 * turned-off question, so keys are made unique and signal rules follow the key the question really got,
 * including questions saved by an earlier, partly failed attempt (`earlierKeys`).
 */
export async function addSuggestions(
  serviceId: string,
  takenKeys: ReadonlySet<string>,
  drafts: SuggestedQuestionOut[],
  rules: RuleDraft[],
  earlierKeys: ReadonlyMap<string, string>
): Promise<AddSuggestionsResult> {
  const taken = new Set(takenKeys)
  const savedKeys = new Map(earlierKeys)
  const failedKeys = new Set<string>()
  const result: AddSuggestionsResult = {
    addedDraftIds: [],
    createdQuestionIds: [],
    savedKeys,
    rulesAdded: 0,
    failed: 0,
    error: null,
  }
  const fail = (error: unknown) => {
    result.failed += 1
    result.error = error
  }

  for (const draft of drafts) {
    try {
      const created = await createWithUniqueKey(
        serviceId,
        draft.key,
        {
          text: draft.text,
          category: draft.category,
          polarity: draft.polarity,
          weight: draft.weight,
          source_types: draft.source_types,
          recency_days: draft.recency_days,
          job_titles: draft.job_titles,
          negative_terms: draft.negative_terms,
        },
        taken
      )
      savedKeys.set(draft.key, created.key)
      result.addedDraftIds.push(draft.key)
      result.createdQuestionIds.push(created.id)
    } catch (error) {
      failedKeys.add(draft.key)
      fail(error)
    }
  }

  for (const { id, rule } of rules) {
    let { condition } = rule
    if ("question_key" in condition) {
      if (failedKeys.has(condition.question_key)) {
        result.failed += 1
        continue
      }
      condition = {
        ...condition,
        question_key:
          savedKeys.get(condition.question_key) ?? condition.question_key,
      }
    }
    try {
      await createRule(serviceId, {
        name: rule.name,
        kind: rule.kind,
        condition,
        action: rule.action,
        cap_value: rule.cap_value,
      })
      result.addedDraftIds.push(id)
      result.rulesAdded += 1
    } catch (error) {
      fail(error)
    }
  }

  return result
}
