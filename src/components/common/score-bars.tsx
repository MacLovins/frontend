import { cn } from "cn"

import { score } from "@/lib/format"
import { metricShortLabels } from "@/lib/labels"

export type Metric = "fit" | "intent" | "risk"

const fills: Record<Metric, string> = {
  fit: "bg-metric-fit",
  intent: "bg-metric-intent",
  risk: "bg-metric-risk",
}

/** A 0–100 value as a bar: thin 6 px in lists, 10 px in the score breakdown. */
export function ScoreBar({
  value,
  metric,
  size = "sm",
  className,
}: {
  value: number
  metric: Metric
  size?: "sm" | "lg"
  className?: string
}) {
  const width = `${Math.max(0, Math.min(100, value))}%`
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block overflow-hidden",
        size === "sm" ? "h-1.5 rounded-[3px] bg-subtle" : "h-2.5 rounded-sm bg-muted",
        className,
      )}
    >
      <span className={cn("block h-full", size === "lg" && "rounded-sm", fills[metric])} style={{ width }} />
    </span>
  )
}

/** Fit, Buying signals and Blockers as three labelled mini-bars (prospect rows). */
export function SubScoreBars({ fit, intent, risk }: Record<Metric, number>) {
  const rows: [Metric, number][] = [
    ["fit", fit],
    ["intent", intent],
    ["risk", risk],
  ]
  return (
    <span className="flex flex-col gap-[5px] text-2xs text-muted-foreground">
      {rows.map(([metric, value]) => (
        <span key={metric} className="flex items-center gap-1.5">
          <span className="w-11 shrink-0">{metricShortLabels[metric]}</span>
          <ScoreBar value={value} metric={metric} className="flex-1" />
          <span className="w-5 shrink-0 text-right font-mono text-black">{score(value)}</span>
        </span>
      ))}
    </span>
  )
}
