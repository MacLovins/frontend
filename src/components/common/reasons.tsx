import { cn } from "cn"

import type { Reason } from "@/api/generated/model"
import { pickReasons, reasonSource, toneOf, type MarkTone } from "@/lib/reasons"

const glyphs: Record<MarkTone, string> = { positive: "✓", negative: "⚠", neutral: "⊘" }
const glyphLabels: Record<MarkTone, string> = { positive: "Positive", negative: "Blocker", neutral: "Note" }

const inlineColors: Record<MarkTone, string> = {
  positive: "text-positive",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
}

const circleColors: Record<MarkTone, string> = {
  positive: "bg-positive-surface text-positive-strong",
  negative: "bg-negative-surface text-negative-strong",
  neutral: "bg-muted text-muted-foreground",
}

/** ✓ positive, ⚠ blocker, ⊘ rule or note. Colour is never the only carrier: each tone has its own glyph. */
export function ReasonMark({
  tone,
  variant = "inline",
  className,
}: {
  tone: MarkTone
  variant?: "inline" | "circle"
  className?: string
}) {
  return (
    <span
      role="img"
      aria-label={glyphLabels[tone]}
      className={cn(
        "shrink-0 font-bold",
        variant === "inline"
          ? inlineColors[tone]
          : "flex size-6 items-center justify-center rounded-full text-[13px]",
        variant === "circle" && circleColors[tone],
        className,
      )}
    >
      {glyphs[tone]}
    </span>
  )
}

/** Why-now lines of a prospect row: mark, text and "· source · age". */
export function ReasonList({
  reasons,
  excludedBy,
  max = 3,
  className,
}: {
  reasons: Reason[]
  /** Names of the rules that disqualified the lead, when it is disqualified. */
  excludedBy?: string[]
  max?: number
  className?: string
}) {
  const lines = pickReasons(reasons, excludedBy ? max - 1 : max)
  return (
    <ul className={cn("flex flex-col gap-1 text-[13px] leading-[1.35]", className)}>
      {excludedBy ? (
        <li className="flex gap-1.5">
          <ReasonMark tone="neutral" />
          <span>
            {excludedBy.length === 1 ? `Excluded by rule "${excludedBy[0]}"` : "Excluded by a disqualification rule"}{" "}
            <span className="text-muted-foreground">· Rules</span>
          </span>
        </li>
      ) : null}
      {lines.map((reason, index) => {
        const source = reasonSource(reason)
        return (
          <li key={`${reason.signal_id ?? reason.text}-${index}`} className="flex gap-1.5">
            <ReasonMark tone={toneOf(reason.polarity)} />
            <span>
              {reason.text}
              {source ? <span className="text-muted-foreground"> · {source}</span> : null}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
