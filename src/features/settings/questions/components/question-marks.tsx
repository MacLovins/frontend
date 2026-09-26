import { cn } from "cn"

import type {
  Polarity,
  SignalQuestionOut,
  SourceType,
} from "@/api/generated/model"
import {
  copy,
  isSelectableSource,
  polarityCopy,
  sourceShortLabels,
} from "@/features/settings/questions/copy"
import { useLabels } from "@/hooks/use-labels"

/** "✓ +" / "⚠ −": glyph and sign, never colour alone. */
export function PolarityMark({ polarity }: { polarity: Polarity }) {
  return (
    <span
      className={cn(
        "font-bold whitespace-nowrap",
        polarity === "positive"
          ? "text-positive-strong"
          : "text-negative-strong"
      )}
    >
      <span aria-hidden>{polarityCopy[polarity].mark}</span>
      <span className="sr-only">{polarityCopy[polarity].name}</span>
    </span>
  )
}

export function SourceChip({ source }: { source: SourceType }) {
  const label = useLabels()
  return (
    <span className="rounded bg-muted px-1.5 py-0.5 text-2xs text-text-secondary">
      {isSelectableSource(source)
        ? sourceShortLabels[source]
        : label("source_types", source)}
    </span>
  )
}

/** Search-term generation state of one question in the table. */
export function KeywordStatus({
  question,
  fresh,
  stalled,
}: {
  question: SignalQuestionOut
  fresh: boolean
  stalled: boolean
}) {
  const base = "text-xs font-semibold"
  if (question.keywords_status === "failed") {
    return (
      <span className={cn(base, "text-negative-strong")}>
        {copy.keywordStatus.failed}
      </span>
    )
  }
  if (question.keywords_status === "pending") {
    // A turned-off question is skipped by the worker and stays pending; the status means nothing there.
    if (!question.is_active) return <span className={base}>—</span>
    return (
      <span className={cn(base, "text-warning-strong")}>
        {stalled ? copy.keywordStatus.stalled : copy.keywordStatus.pending}
      </span>
    )
  }
  if (fresh) {
    return (
      <span className="justify-self-start rounded bg-primary px-1.5 py-0.5 text-xs font-bold text-black">
        {copy.keywordStatus.fresh}
      </span>
    )
  }
  return (
    <span className={cn(base, "text-positive-strong")}>
      {copy.keywordStatus.ready}
    </span>
  )
}
