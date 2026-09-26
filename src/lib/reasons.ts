import type { Reason } from "@/api/generated/model"
import { compactAge } from "@/lib/format"

export type MarkTone = "positive" | "negative" | "neutral"

export const toneOf = (polarity: Reason["polarity"]): MarkTone =>
  polarity === "positive"
    ? "positive"
    : polarity === "negative"
      ? "negative"
      : "neutral"

export function reasonSource(reason: Pick<Reason, "source_name" | "date">) {
  return [reason.source_name, reason.date ? compactAge(reason.date) : null]
    .filter(Boolean)
    .join(" · ")
}

/**
 * Up to `max` reasons in the engine's spirit: positives first, but a real blocker is never pushed out,
 * then ICP-fit and data-gap notes fill what is left.
 */
export function pickReasons(reasons: Reason[], max = 3) {
  const positives = reasons.filter((reason) => reason.polarity === "positive")
  const negatives = reasons.filter((reason) => reason.polarity === "negative")
  const notes = reasons.filter(
    (reason) => reason.polarity === "fit" || reason.polarity === "data_gap"
  )
  const picked = [
    ...positives.slice(0, negatives.length ? max - 1 : max),
    ...negatives.slice(0, 1),
  ]
  return [...picked, ...notes].slice(0, max)
}
