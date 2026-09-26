import { cn } from "cn"
import type { ReactNode } from "react"

import type {
  SuggestedQuestionOut,
  SuggestedRuleOut,
} from "@/api/generated/model"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  copy,
  polarityCopy,
  weightNames,
} from "@/features/settings/questions/copy"
import {
  describeAction,
  describeCondition,
  type RuleNames,
} from "@/features/settings/questions/lib/describe-rule"
import { formatWindow } from "@/features/settings/questions/lib/question-utils"
import { useLabels } from "@/hooks/use-labels"

const rowClass = "flex gap-2.5 rounded-md border border-subtle p-3"

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-2xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
      {children}
    </span>
  )
}

export function QuestionDraftRow({
  draft,
  checked,
  onCheckedChange,
}: {
  draft: SuggestedQuestionOut
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const label = useLabels()
  return (
    <label className={cn(rowClass, "cursor-pointer")}>
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5"
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold">{draft.label}</span>
        <span className="text-[13px] leading-[1.35] text-muted-foreground">
          {draft.text}
        </span>
        <span className="text-xs text-muted-foreground">
          {[
            label("categories", draft.category),
            polarityCopy[draft.polarity].option,
            weightNames[draft.weight],
            formatWindow(draft.recency_days),
          ].join(" · ")}
        </span>
      </span>
    </label>
  )
}

export function RuleDraftRow({
  rule,
  names,
  checked,
  blockedBy,
  onCheckedChange,
}: {
  rule: SuggestedRuleOut
  names: RuleNames
  checked: boolean
  /** Label of the unchecked draft question this signal rule needs. */
  blockedBy?: string
  onCheckedChange: (checked: boolean) => void
}) {
  const row = (
    <label
      className={cn(
        rowClass,
        blockedBy ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      )}
    >
      <Checkbox
        checked={checked && !blockedBy}
        disabled={!!blockedBy}
        onCheckedChange={onCheckedChange}
        className="mt-0.5"
      />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-semibold">{rule.name}</span>
        <span className="text-[13px] leading-[1.35] text-muted-foreground">
          {describeCondition(rule.condition, names)}
        </span>
        <span className="text-[13px] font-semibold">
          {describeAction(rule)}
        </span>
      </span>
    </label>
  )
  if (!blockedBy) return row
  return (
    <Tooltip>
      <TooltipTrigger render={<div />}>{row}</TooltipTrigger>
      <TooltipContent>{copy.suggestions.needs(blockedBy)}</TooltipContent>
    </Tooltip>
  )
}
