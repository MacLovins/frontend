import { useState } from "react"
import { cn } from "cn"

import { Slider } from "@/components/ui/slider"
import { prospectsCopy } from "@/features/prospects/copy"

const first = (value: number | readonly number[]) =>
  typeof value === "number" ? value : (value[0] ?? 0)

/** "Min priority" slider: shows the value while dragging, writes the URL on release. */
export function MinPriorityFilter({
  value,
  disabled,
  onCommit,
}: {
  value: number
  disabled: boolean
  onCommit: (value: number) => void
}) {
  const [draft, setDraft] = useState<number | null>(null)
  const shown = draft ?? value
  return (
    <label
      className={cn(
        "flex h-10 items-center gap-2 rounded-md border border-input bg-white px-3 text-sm",
        disabled && "text-muted-foreground"
      )}
    >
      {prospectsCopy.minPriority}
      <Slider
        className="w-[110px]"
        min={0}
        max={100}
        step={5}
        value={[shown]}
        disabled={disabled}
        onValueChange={(next) => setDraft(first(next))}
        onValueCommitted={(next) => {
          setDraft(null)
          onCommit(first(next))
        }}
      />
      <span className="min-w-6 text-right font-mono">{shown}</span>
    </label>
  )
}
