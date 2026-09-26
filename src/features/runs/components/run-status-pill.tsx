import { cn } from "cn"

import { Badge } from "@/components/ui/badge"

import { stepLabels } from "../copy"
import type { CompanyView, CompanyTone } from "../lib/company-state"

const toneStyles: Record<CompanyTone, string> = {
  running: "bg-primary-surface text-black",
  done: "bg-positive-surface text-positive-strong",
  paused: "bg-warning-surface text-warning-foreground",
  queued: "bg-subtle text-text-secondary",
  failed: "bg-negative-surface text-negative-strong",
  cancelled: "bg-subtle text-muted-foreground",
}

const toneLabels: Record<Exclude<CompanyTone, "running">, string> = {
  done: "Done",
  paused: "Paused",
  queued: "Queued",
  failed: "Failed",
  cancelled: "Cancelled",
}

/** A company's state in the run; while it runs, the pill names the current step. */
export function RunStatusPill({
  view,
  className,
}: {
  view: CompanyView
  className?: string
}) {
  const label =
    view.tone === "running"
      ? stepLabels[view.current ?? 0]
      : toneLabels[view.tone]
  return (
    <Badge
      size="md"
      className={cn("font-bold", toneStyles[view.tone], className)}
    >
      {label}
    </Badge>
  )
}
