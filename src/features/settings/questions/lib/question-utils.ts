import type { SignalQuestionOut } from "@/api/generated/model"

const DAY_MS = 24 * 60 * 60_000

/** The list endpoint has no ORDER BY; the engine orders by creation, then key. */
export function sortQuestions(questions: readonly SignalQuestionOut[]) {
  return [...questions].sort(
    (a, b) =>
      Date.parse(a.created_at) - Date.parse(b.created_at) ||
      a.key.localeCompare(b.key)
  )
}

/** 365 → "12 mo", 90 → "3 mo", 14 → "14 d". */
export function formatWindow(days: number) {
  return days < 30 ? `${days} d` : `${Math.round(days / 30.4)} mo`
}

/** "New · ready": search terms are ready and the question was created in the last 24 hours. */
export function isFreshlyReady(question: SignalQuestionOut, now: number) {
  return (
    question.keywords_status === "ready" &&
    now - Date.parse(question.created_at) < DAY_MS
  )
}

export function hasPendingKeywords(
  questions: readonly SignalQuestionOut[] | undefined
) {
  return (
    questions?.some(
      (question) => question.is_active && question.keywords_status === "pending"
    ) ?? false
  )
}

/** Questions have no short label in the API (backend gap), so dialogs quote a shortened text. */
export function shortText(text: string, max = 80) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}
