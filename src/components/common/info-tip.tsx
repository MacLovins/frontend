import type { ReactNode } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** The small "i" next to a number: every number explains what it means and how it is counted. */
export function InfoTip({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`What is ${label}?`}
            className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-faint text-[10px] leading-none text-muted-foreground"
          />
        }
      >
        i
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  )
}
