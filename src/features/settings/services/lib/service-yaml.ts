import type {
  DisqualificationRuleOut,
  ICPProfileOut,
  ScoringProfileOut,
  ServiceOut,
  SignalQuestionOut,
} from "@/api/generated/model"

type ExportSource = {
  service: ServiceOut
  questions: SignalQuestionOut[]
  rules: DisqualificationRuleOut[]
  icp: ICPProfileOut | null
  scoring: ScoringProfileOut | null
  /** Short question name; the API stores none yet, so the caller passes the category label. */
  questionLabel: (question: SignalQuestionOut) => string
}

/** The service in the ai preset format (ai/presets/<key>.yaml), active questions and rules only. */
export function serviceToPreset({
  service,
  questions,
  rules,
  icp,
  scoring,
  questionLabel,
}: ExportSource) {
  return {
    key: service.slug,
    name: service.name,
    description: service.description,
    value_proposition: service.value_proposition,
    decision_makers: service.decision_makers,
    ...(icp && {
      icp: {
        countries: icp.countries,
        industries_any: icp.industries_any,
        employees_min: icp.employees_min,
        employees_max: icp.employees_max,
        revenue_min_eur: icp.revenue_min_eur,
        nice_to_have: icp.nice_to_have,
      },
    }),
    rules: rules
      .filter((rule) => rule.is_active)
      .map(({ name, kind, condition, action, cap_value }) => ({
        name,
        kind,
        condition,
        action,
        cap_value,
      })),
    ...(scoring && { scoring: { params: scoring.params } }),
    questions: questions
      .filter((question) => question.is_active)
      .map((question) => ({
        key: question.key,
        label: questionLabel(question),
        text: question.text,
        category: question.category,
        polarity: question.polarity,
        weight: question.weight,
        source_types: question.source_types,
        recency_days: question.recency_days,
        keywords_seed: question.keywords,
        job_titles: question.job_titles,
        negative_terms: question.negative_terms,
      })),
  }
}

const PLAIN = /^[A-Za-z_][\w .,/()&+'-]*$/
const RESERVED = /^(true|false|null|yes|no|on|off|y|n)$/i

function scalar(value: unknown): string {
  if (value === null || value === undefined) return "null"
  if (typeof value === "string") {
    const plain =
      PLAIN.test(value) && value.trimEnd() === value && !RESERVED.test(value)
    // A JSON string literal is a valid YAML double-quoted scalar.
    return plain ? value : JSON.stringify(value)
  }
  return String(value)
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isBlock = (value: unknown) =>
  (Array.isArray(value) && value.length > 0) ||
  (isRecord(value) && Object.keys(value).length > 0)

function inline(value: unknown) {
  if (Array.isArray(value)) return "[]"
  if (isRecord(value)) return "{}"
  return scalar(value)
}

function blockLines(value: unknown, indent: string): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (!isBlock(item)) return [`${indent}- ${inline(item)}`]
      const [first = "", ...rest] = blockLines(item, `${indent}  `)
      return [`${indent}- ${first.trimStart()}`, ...rest]
    })
  }
  if (!isRecord(value)) return [`${indent}${inline(value)}`]
  return Object.entries(value).flatMap(([key, item]) =>
    isBlock(item)
      ? [`${indent}${scalar(key)}:`, ...blockLines(item, `${indent}  `)]
      : [`${indent}${scalar(key)}: ${inline(item)}`]
  )
}

/** Block-style YAML for plain JSON data (objects, arrays, strings, numbers, booleans, null). */
export function toYaml(value: unknown) {
  return `${blockLines(value, "").join("\n")}\n`
}

export function downloadText(fileName: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  // Revoking in the same tick can cancel the download in Firefox.
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
