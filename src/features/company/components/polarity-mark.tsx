import { cn } from "cn"

import type { ReasonPolarity } from "@/api/generated/model"

const marks: Record<
  ReasonPolarity,
  { glyph: string; label: string; className: string }
> = {
  positive: {
    glyph: "✓",
    label: "Buying signal",
    className: "bg-positive-surface text-positive-strong",
  },
  negative: {
    glyph: "⚠",
    label: "Blocker",
    className: "bg-negative-surface text-negative-strong",
  },
  fit: {
    glyph: "⊘",
    label: "Outside ICP",
    className: "bg-subtle text-muted-foreground",
  },
  data_gap: {
    glyph: "?",
    label: "Missing data",
    className: "bg-muted text-muted-foreground",
  },
}

/** ✓ ⚠ ⊘ ? in a circle: the glyph, not only the colour, tells the kind apart. */
export function PolarityMark({
  kind,
  size = 24,
}: {
  kind: ReasonPolarity
  size?: 22 | 24
}) {
  const mark = marks[kind]
  return (
    <span
      role="img"
      aria-label={mark.label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        size === 24 ? "size-6 text-[13px]" : "size-[22px] text-xs",
        mark.className
      )}
    >
      {mark.glyph}
    </span>
  )
}
