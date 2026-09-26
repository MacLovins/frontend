import { cn } from "cn"

import { stepLabels } from "../copy"
import type { CompanyTone, CompanyView } from "../lib/company-state"

const currentBar: Record<CompanyTone, string> = {
  running: "bg-primary",
  paused: "bg-warning",
  failed: "bg-destructive",
  cancelled: "bg-input",
  // Never highlighted: done has no current step, queued has none yet.
  done: "bg-black",
  queued: "bg-subtle",
}

function stateOf(view: CompanyView, index: number) {
  if (view.tone === "done") return "complete"
  if (view.current === null) return "pending"
  if (index < view.current) return "complete"
  return index === view.current ? "current" : "pending"
}

function ariaLabel(view: CompanyView) {
  const total = stepLabels.length
  if (view.tone === "done") return `Stage ${total} of ${total}: Done`
  if (view.current === null) return `Stage 0 of ${total}: Not started`
  return `Stage ${view.current + 1} of ${total}: ${stepLabels[view.current]}`
}

/** Eight pipeline steps, Resolve → Done, as bars with a label under each. */
export function StageStepper({ view }: { view: CompanyView }) {
  return (
    <div
      role="img"
      aria-label={ariaLabel(view)}
      className="grid grid-cols-8 gap-1"
    >
      {stepLabels.map((label, index) => {
        const state = stateOf(view, index)
        return (
          <div key={label} aria-hidden className="flex min-w-0 flex-col gap-1">
            <span
              className={cn(
                "block h-1.5 rounded-[3px] transition-colors",
                state === "complete" && "bg-black",
                state === "current" && currentBar[view.tone],
                state === "pending" && "bg-subtle"
              )}
            />
            <span
              className={cn(
                "truncate text-2xs",
                state === "complete" && "text-text-secondary",
                state === "current" && "font-bold text-black",
                state === "pending" && "text-faint"
              )}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
