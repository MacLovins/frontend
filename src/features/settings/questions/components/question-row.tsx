import { cn } from "cn"
import type { KeyboardEvent, SyntheticEvent } from "react"

import type { SignalQuestionOut } from "@/api/generated/model"
import {
  KeywordStatus,
  PolarityMark,
  SourceChip,
} from "@/features/settings/questions/components/question-marks"
import { questionGrid } from "@/features/settings/questions/components/question-grid"
import { SegmentedWeight } from "@/features/settings/questions/components/segmented-weight"
import { useQuestionsContext } from "@/features/settings/questions/hooks/questions-context"
import { useWeightChange } from "@/features/settings/questions/hooks/use-question-mutations"
import {
  formatWindow,
  isFreshlyReady,
} from "@/features/settings/questions/lib/question-utils"
import { useLabels } from "@/hooks/use-labels"

// The weight control lives inside a clickable row: its clicks and keys must not open the sheet.
const stop = (event: SyntheticEvent) => event.stopPropagation()

export function QuestionRow({
  question,
  onOpen,
}: {
  question: SignalQuestionOut
  onOpen: (id: string) => void
}) {
  const label = useLabels()
  const { now, keywordsStalled } = useQuestionsContext()
  const weight = useWeightChange()
  const inactive = !question.is_active

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && event.target === event.currentTarget) {
      onOpen(question.id)
    }
  }

  return (
    <div
      role="row"
      tabIndex={0}
      onClick={() => onOpen(question.id)}
      onKeyDown={onKeyDown}
      className={cn(
        questionGrid,
        "min-h-14 cursor-pointer border-b border-subtle py-1.5 text-[13px] transition-colors outline-none hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black",
        inactive && "opacity-55"
      )}
    >
      <div role="cell" className="flex min-w-0 flex-col gap-0.5 pr-3">
        <span
          className="line-clamp-2 text-sm font-medium"
          title={question.text}
        >
          {question.text}
        </span>
      </div>
      <div role="cell" className="text-text-secondary">
        {label("categories", question.category)}
      </div>
      <div role="cell">
        <PolarityMark polarity={question.polarity} />
      </div>
      <div role="cell" onClick={stop} onKeyDown={stop}>
        <SegmentedWeight
          value={question.weight}
          disabled={inactive || weight.isPending}
          onChange={(next) =>
            weight.mutate({ id: question.id, data: { weight: next } })
          }
        />
      </div>
      <div role="cell" className="flex flex-wrap gap-1">
        {question.source_types.map((source) => (
          <SourceChip key={source} source={source} />
        ))}
      </div>
      <div role="cell" className="font-mono text-text-secondary">
        {formatWindow(question.recency_days)}
      </div>
      <div role="cell" className="grid">
        <KeywordStatus
          question={question}
          fresh={isFreshlyReady(question, now)}
          stalled={keywordsStalled}
        />
      </div>
    </div>
  )
}
