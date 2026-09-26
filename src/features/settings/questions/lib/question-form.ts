import { z } from "zod"

import {
  Polarity,
  SignalCategory,
  SourceType,
  Weight,
  type SignalQuestionCreate,
  type SignalQuestionOut,
  type SignalQuestionUpdate,
} from "@/api/generated/model"

import { copy } from "@/features/settings/questions/copy"

export const questionSchema = z.object({
  text: z
    .string()
    .trim()
    .min(10, copy.validation.text)
    .max(500, copy.validation.text),
  category: z.enum(SignalCategory),
  polarity: z.enum(Polarity),
  weight: z.enum(Weight),
  recency_days: z.number().int().positive(),
  source_types: z.array(z.enum(SourceType)).min(1, copy.validation.sources),
  job_titles: z.array(z.string()),
  negative_terms: z.array(z.string()),
})

export type QuestionFormValues = z.infer<typeof questionSchema>

export const newQuestionValues: QuestionFormValues = {
  text: "",
  category: "ai_automation",
  polarity: "positive",
  weight: "medium",
  recency_days: 365,
  source_types: ["news", "website", "jobs"],
  job_titles: [],
  negative_terms: [],
}

export function toFormValues(question: SignalQuestionOut): QuestionFormValues {
  return {
    text: question.text,
    category: question.category,
    polarity: question.polarity,
    weight: question.weight,
    recency_days: question.recency_days,
    source_types: question.source_types,
    job_titles: question.job_titles,
    negative_terms: question.negative_terms,
  }
}

export function toCreateBody(
  values: QuestionFormValues
): Omit<SignalQuestionCreate, "key"> {
  return {
    text: values.text.trim(),
    category: values.category,
    polarity: values.polarity,
    weight: values.weight,
    source_types: values.source_types,
    recency_days: values.recency_days,
  }
}

const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((item) => b.includes(item))
const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((item, index) => item === b[index])

/** Only the keys that changed: the backend 500s on nulls and bumps the version on any meaning key it receives changed. */
export function diffQuestion(
  question: SignalQuestionOut,
  values: QuestionFormValues
): SignalQuestionUpdate {
  const patch: SignalQuestionUpdate = {}
  const text = values.text.trim()
  if (text !== question.text) patch.text = text
  if (values.category !== question.category) patch.category = values.category
  if (values.polarity !== question.polarity) patch.polarity = values.polarity
  if (values.weight !== question.weight) patch.weight = values.weight
  if (values.recency_days !== question.recency_days)
    patch.recency_days = values.recency_days
  if (!sameSet(values.source_types, question.source_types))
    patch.source_types = values.source_types
  if (!sameList(values.job_titles, question.job_titles))
    patch.job_titles = values.job_titles
  if (!sameList(values.negative_terms, question.negative_terms))
    patch.negative_terms = values.negative_terms
  return patch
}

const meaningKeys = [
  "text",
  "category",
  "polarity",
  "source_types",
  "recency_days",
] as const satisfies readonly (keyof SignalQuestionUpdate)[]

/** A meaning change makes the backend bump the version and regenerate search terms (config/router.py:42). */
export function changesMeaning(patch: SignalQuestionUpdate) {
  return meaningKeys.some((key) => key in patch)
}
