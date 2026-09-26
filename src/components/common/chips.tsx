import type { ReactNode } from "react"
import { cn } from "cn"

import type { Weight } from "@/api/generated/model"

const weightStyles: Record<Weight, string> = {
  high: "bg-black text-white",
  medium: "bg-muted-foreground text-white",
  low: "bg-border text-black",
}

const weightLetters: Record<Weight, string> = { high: "H", medium: "M", low: "L" }
const weightNames: Record<Weight, string> = { high: "High weight", medium: "Medium weight", low: "Low weight" }

/** Static H / M / L importance chip. */
export function WeightChip({ weight, className }: { weight: Weight; className?: string }) {
  return (
    <span
      title={weightNames[weight]}
      aria-label={weightNames[weight]}
      className={cn(
        "inline-flex w-9 shrink-0 items-center justify-center rounded py-0.5 text-2xs font-bold",
        weightStyles[weight],
        className,
      )}
    >
      {weightLetters[weight]}
    </span>
  )
}

/** Small grey label value tile, used in 4-column stat grids. */
export function StatTile({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5 rounded-sm bg-muted p-2.5", className)}>
      <span className="text-2xs text-muted-foreground">{label}</span>
      <span className="font-mono text-xl font-semibold">{value}</span>
    </div>
  )
}

/** "NEW" or "NEW 3": fresh evidence from the last 7 days. */
export function NewBadge({ count }: { count?: number }) {
  return (
    <span className="inline-flex w-fit items-center rounded bg-black px-1.5 py-px text-2xs font-bold text-white">
      NEW{count ? ` ${count}` : ""}
    </span>
  )
}
