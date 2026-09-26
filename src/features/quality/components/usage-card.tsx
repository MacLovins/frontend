import type { UseQueryResult } from "@tanstack/react-query"
import { cn } from "cn"

import type { UsageOut } from "@/api/generated/model"
import type { ApiError } from "@/api/mutator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { qualityCopy } from "../copy"
import { resetTime, usageRows, type UsageRow } from "../lib/quality-metrics"
import { CardError, CardNote, QualityCard, SkeletonRows } from "./quality-card"

/** Today's model calls against the daily quota. Org-wide: the API has no service filter. */
export function UsageCard({
  usage,
}: {
  usage: UseQueryResult<UsageOut, ApiError>
}) {
  return (
    <QualityCard
      title={qualityCopy.usageTitle}
      titleHint={qualityCopy.allServices}
    >
      {usage.isPending ? (
        <SkeletonRows count={2} className="h-4" />
      ) : usage.isError ? (
        <CardError
          title={qualityCopy.usageError}
          error={usage.error}
          onRetry={() => void usage.refetch()}
        />
      ) : (
        <UsageBody usage={usage.data} />
      )}
    </QualityCard>
  )
}

function UsageBody({ usage }: { usage: UsageOut }) {
  const rows = usageRows(usage.models)
  return (
    <>
      {rows.length ? (
        <div className="grid grid-cols-[170px_minmax(0,1fr)_90px] items-center gap-x-2.5 gap-y-2 text-[13px]">
          {rows.map((row) => (
            <UsageBar key={row.key} row={row} />
          ))}
        </div>
      ) : (
        <CardNote>{qualityCopy.usageEmpty}</CardNote>
      )}
      <p className="m-0 text-xs text-muted-foreground">
        {usage.resets_at
          ? `${qualityCopy.usageResets(resetTime(usage.resets_at))} `
          : null}
        {qualityCopy.usageFooter}
      </p>
    </>
  )
}

function UsageBar({ row }: { row: UsageRow }) {
  const { model, label } = row
  const limit = model.rpd_limit
  const pct = limit ? Math.min(100, (model.quota_calls / limit) * 100) : 0
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              tabIndex={0}
              className="truncate focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            />
          }
        >
          {label}
        </TooltipTrigger>
        <TooltipContent>
          {qualityCopy.usageRowHelp(
            model.model,
            model.calls,
            model.cache_hits,
            model.errors
          )}
        </TooltipContent>
      </Tooltip>
      {limit ? (
        <span
          role="meter"
          aria-label={qualityCopy.usageMeterLabel(label)}
          aria-valuenow={model.quota_calls}
          aria-valuemin={0}
          aria-valuemax={limit}
          className="block h-2 rounded bg-subtle"
        >
          <span
            className={cn(
              "block h-2 rounded",
              model.remaining === 0 ? "bg-destructive" : "bg-chart-2"
            )}
            style={{ width: `${pct}%` }}
          />
        </span>
      ) : (
        <span />
      )}
      <span className="text-right font-mono whitespace-nowrap">
        {limit ? `${model.quota_calls} / ${limit}` : model.quota_calls}
      </span>
    </>
  )
}
