/**
 * Simulated keyword expansion: `keywords_status` goes pending → ready ~3 s after a question is created, its
 * meaning changes or POST /questions/{id}/expand is called. Expansion overwrites keywords, job titles and
 * negative terms (seeds kept first). A question that is inactive by then stays pending, like the backend.
 */
import { iso } from "../data/time"
import { db } from "../db"
import { expandedKeywords, HIRING_NOISE, unique } from "../engine/keywords"
import { schedule } from "../settings"

export const EXPANSION_MS = 3000

export function enqueueExpansion(questionId: string): void {
  const question = db.questions.find((q) => q.id === questionId)
  if (!question) return
  question.keywords_status = "pending"
  schedule(() => {
    const q = db.questions.find((item) => item.id === questionId)
    if (!q || !q.is_active || q.keywords_status !== "pending") return
    q.keywords = expandedKeywords(q, q.keywords)
    if (q.category === "hiring")
      q.negative_terms = unique([...q.negative_terms, ...HIRING_NOISE])
    q.keywords_status = "ready"
    q.updated_at = iso(Date.now())
    const cheap = db.usage.find((m) => m.pool === "cheap")
    if (cheap) {
      cheap.calls += 1
      cheap.input_tokens += 900
      cheap.output_tokens += 260
    }
  }, EXPANSION_MS)
}
