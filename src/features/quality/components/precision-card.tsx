import { cn } from "cn"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { percent } from "@/lib/format"

import { qualityCopy } from "../copy"
import {
  precisionStatus,
  type PrecisionRow,
  type PrecisionStatus,
} from "../lib/quality-metrics"
import { CardError, CardNote, QualityCard, SkeletonRows } from "./quality-card"

const fillStyles: Record<PrecisionStatus, string> = {
  ok: "bg-foreground",
  below: "bg-destructive",
  few: "bg-faint",
}

function PrecisionBars({ rows }: { rows: PrecisionRow[] }) {
  return (
    <div className="grid grid-cols-[180px_minmax(0,1fr)_44px_40px] items-center gap-x-2.5 gap-y-2 text-[13px]">
      {rows.map((row) => (
        <PrecisionBar key={row.key} row={row} />
      ))}
    </div>
  )
}

function PrecisionBar({ row }: { row: PrecisionRow }) {
  const pct = Math.round(row.precision * 100)
  return (
    <>
      <span className="truncate" title={row.label}>
        {row.label}
      </span>
      <span
        role="meter"
        aria-label={`${row.label} precision`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="block h-2.5 rounded-[2px] bg-subtle"
      >
        <span
          className={cn(
            "block h-2.5 rounded-[2px]",
            fillStyles[precisionStatus(row)]
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-right font-mono">{percent(row.precision)}</span>
      <Tooltip>
        <TooltipTrigger
          render={<span className="w-fit text-2xs text-muted-foreground" />}
        >
          <span aria-hidden>{row.labeled}</span>
          <span className="sr-only">
            {qualityCopy.labelledCount(row.labeled)}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {qualityCopy.labelledCount(row.labeled)}
        </TooltipContent>
      </Tooltip>
    </>
  )
}

/** "Precision by signal type" / "Precision by source": bars ranked by precision, red below the 80% target. */
export function PrecisionCard({
  title,
  rows,
  skeletonRows,
  showBelowTarget = false,
  isPending,
  error,
  onRetry,
}: {
  title: string
  rows: PrecisionRow[] | undefined
  skeletonRows: number
  showBelowTarget?: boolean
  isPending: boolean
  error: unknown
  onRetry: () => void
}) {
  const below = showBelowTarget
    ? (rows ?? []).filter((row) => precisionStatus(row) === "below")
    : []
  return (
    <QualityCard title={title}>
      {isPending ? (
        <SkeletonRows count={skeletonRows} className="h-2.5 rounded-[2px]" />
      ) : error ? (
        <CardError
          title={qualityCopy.precisionError}
          error={error}
          onRetry={onRetry}
        />
      ) : !rows?.length ? (
        <CardNote>{qualityCopy.precisionEmpty}</CardNote>
      ) : (
        <>
          <PrecisionBars rows={rows} />
          {below.length ? (
            <p className="m-0 text-xs text-negative-strong">
              {qualityCopy.belowTarget(below.map((row) => row.label))}
            </p>
          ) : null}
        </>
      )}
    </QualityCard>
  )
}
