import { cn } from "cn"

import type { SignalItem, SignalVerdict } from "@/api/generated/model"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatDate, percent } from "@/lib/format"

import { signalFlags, sourceLabel, sourceTypeChip } from "../lib/copy"
import { ExternalLink } from "./external-link"
import { FeedbackButtons } from "./feedback-buttons"

const chip = "rounded bg-muted px-1.5 py-px text-text-secondary"

function FlagChip({ flag }: { flag: string }) {
  const known =
    flag in signalFlags
      ? signalFlags[flag as keyof typeof signalFlags]
      : undefined
  const className =
    "rounded border border-dashed border-faint px-1.5 py-px text-text-secondary"
  if (!known) return <span className={className}>{flag}</span>
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className={className} />}>
        {known.label}
      </TooltipTrigger>
      <TooltipContent>{known.tip}</TooltipContent>
    </Tooltip>
  )
}

/** A quote with its English summary, provenance chips and the feedback buttons. */
export function SignalCard({
  signal,
  pending,
  onRate,
}: {
  signal: SignalItem
  pending: boolean
  onRate: (verdict: SignalVerdict | null) => void
}) {
  const wrong = signal.my_feedback === "incorrect"
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border border-subtle px-3.5 py-3",
        wrong ? "bg-muted opacity-75" : "bg-card"
      )}
    >
      <p className="m-0 text-sm leading-[1.5] italic">“{signal.quote}”</p>
      <p className="m-0 text-[13px] leading-[1.4] text-text-secondary">
        {signal.summary}
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          {sourceLabel(signal.source_name, signal.url)}
        </span>
        {signal.event_date ? (
          <span>· {formatDate(signal.event_date)}</span>
        ) : null}
        <span className={chip}>{sourceTypeChip[signal.source_type]}</span>
        <span className={chip}>
          {signal.strength} · {percent(signal.confidence)}
        </span>
        {signal.flags.map((flag) => (
          <FlagChip key={flag} flag={flag} />
        ))}
        {signal.url ? (
          <ExternalLink
            href={signal.url}
            className="text-muted-foreground underline"
          >
            open ↗
          </ExternalLink>
        ) : null}
        <FeedbackButtons
          value={signal.my_feedback}
          onChange={onRate}
          pending={pending}
        />
      </div>
      {wrong ? (
        <p className="m-0 text-xs font-semibold text-negative-strong">
          Removed from the score. The company was re-scored and the label counts
          toward signal precision.
        </p>
      ) : null}
    </div>
  )
}
