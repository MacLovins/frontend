import { createQuestion } from "@/api/generated/config/config"
import type { SignalQuestionCreate } from "@/api/generated/model"
import { ApiError } from "@/api/mutator"

const MAX_KEY_LENGTH = 40
const MAX_ATTEMPTS = 5

const STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "been",
  "by",
  "can",
  "companies",
  "company",
  "did",
  "do",
  "does",
  "for",
  "from",
  "has",
  "have",
  "in",
  "into",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "there",
  "this",
  "to",
  "was",
  "were",
  "which",
  "with",
])

/** snake_case of the first five significant words: "Is the company hiring RPA developers?" → "hiring_rpa_developers". */
export function questionKeyBase(text: string) {
  const words = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOP_WORDS.has(word))
  const key = words.slice(0, 5).join("_")
  const prefixed = /^[a-z]/.test(key) ? key : `q_${key}`
  return prefixed.slice(0, MAX_KEY_LENGTH).replace(/_+$/, "")
}

/** `base`, else `base_2`, `base_3`… within the length limit. */
function uniqueKey(base: string, taken: ReadonlySet<string>) {
  if (!taken.has(base)) return base
  for (let n = 2; ; n++) {
    const suffix = `_${n}`
    const key = `${base.slice(0, MAX_KEY_LENGTH - suffix.length)}${suffix}`
    if (!taken.has(key)) return key
  }
}

/**
 * Keys are unique per service including turned-off questions, which keep their key (409 otherwise,
 * backend config/router.py create_question). `taken` holds every known key and grows on each conflict.
 */
export async function createWithUniqueKey(
  serviceId: string,
  base: string,
  body: Omit<SignalQuestionCreate, "key">,
  taken: Set<string>
) {
  for (let attempt = 1; ; attempt++) {
    const key = uniqueKey(base, taken)
    try {
      const created = await createQuestion(serviceId, { ...body, key })
      taken.add(created.key)
      return created
    } catch (error) {
      const conflict = error instanceof ApiError && error.status === 409
      if (!conflict || attempt === MAX_ATTEMPTS) throw error
      taken.add(key)
    }
  }
}
