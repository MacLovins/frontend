import { cn } from "cn"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { copy } from "@/features/settings/scoring/copy"

function Stat({
  value,
  label,
  help,
  accent,
}: {
  value: number
  label: string
  help: string
  accent?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            tabIndex={0}
            className="shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          />
        }
      >
        <div
          className={cn(
            "font-mono text-[28px] leading-tight font-semibold",
            accent && "text-primary"
          )}
        >
          {value}
        </div>
        <div className="text-xs leading-tight text-sidebar-foreground">
          {label}
        </div>
      </TooltipTrigger>
      <TooltipContent>{help}</TooltipContent>
    </Tooltip>
  )
}

export function PreviewSummaryBar({
  tierChanges,
  moved,
  note,
}: {
  tierChanges: number
  moved: number
  note: string
}) {
  return (
    <div className="flex items-center gap-6 rounded-lg bg-black px-5 py-4 text-white">
      <Stat
        value={tierChanges}
        label={copy.summary.tierChanges}
        help={copy.summary.tierChangesHelp}
        accent
      />
      <Stat
        value={moved}
        label={copy.summary.moved}
        help={copy.summary.movedHelp}
      />
      {/* Re-scoring reads stored signals only; the backend asserts no LLM calls (test_ai_integration.py:327). */}
      <Stat
        value={0}
        label={copy.summary.aiCalls}
        help={copy.summary.aiCallsHelp}
      />
      <p className="m-0 ml-auto max-w-[260px] min-w-0 text-[13px] leading-[1.4] text-sidebar-foreground">
        {note}
      </p>
    </div>
  )
}
