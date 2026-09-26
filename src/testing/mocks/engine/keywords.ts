/** Keyword generation of the simulated `expand_question` worker task (pure). */
import type { SignalQuestionOut } from "@/api/generated/model"

import { CATEGORY_KEYWORDS, STOPWORDS } from "../data/templates"

export const HIRING_NOISE = [
  "internship",
  "intern",
  "Praktikum",
  "Werkstudent",
  "apprenticeship",
  "Ausbildung",
]

export const unique = (values: string[]) => {
  const seen = new Set<string>()
  return values.filter((v) => {
    const key = v.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Salient phrases of the question text: 1–2 word chunks without stop words. */
function phrasesFrom(text: string): string[] {
  const words = text
    .replace(/\([^)]*\)/g, " ")
    .split(/[^A-Za-zÀ-ÿ0-9/&+-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()))
  const out: string[] = []
  for (let i = 0; i < words.length && out.length < 6; i += 2) {
    const pair = words.slice(i, i + 2).join(" ")
    if (pair) out.push(/^[A-Z0-9/]+$/.test(pair) ? pair : pair.toLowerCase())
  }
  return out
}

/** {en, de, fr, …seed languages}: the seed terms first, then generated ones (max 12 per language). */
export function expandedKeywords(
  question: Pick<SignalQuestionOut, "text" | "category">,
  seed: Record<string, string[]> | null
): Record<string, string[]> {
  const vocab = CATEGORY_KEYWORDS[question.category]
  const result: Record<string, string[]> = {}
  const langs = new Set(["en", "de", "fr", ...Object.keys(seed ?? {})])
  for (const lang of langs) {
    const seeded = seed?.[lang] ?? []
    const generated =
      lang === "en"
        ? [...phrasesFrom(question.text), ...vocab.en]
        : lang === "de" || lang === "fr"
          ? vocab[lang]
          : []
    const merged = unique([...seeded, ...generated]).slice(0, 12)
    if (merged.length) result[lang] = merged
  }
  return result
}
