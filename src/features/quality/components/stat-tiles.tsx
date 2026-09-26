import type { UseQueryResult } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { cn } from "cn"

import type { ApiError } from "@/api/mutator"
import type { QualityMetricsOut, UsageOut } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useLabels } from "@/hooks/use-labels"
import { formatNumber, percent } from "@/lib/format"

import { qualityCopy, sourceLabels } from "../copy"
import { cachePercent, topDocumentSources } from "../lib/quality-metrics"

type Tone = "ink" | "plain"

const toneStyles: Record<
  Tone,
  { tile: string; label: string; value: string; sub: string }
> = {
  ink: {
    tile: "bg-foreground",
    label: "text-sidebar-foreground",
    value: "text-primary",
    sub: "text-sidebar-foreground",
  },
  plain: {
    tile: "border border-border bg-card",
    label: "text-muted-foreground",
    value: "",
    sub: "text-muted-foreground",
  },
}

function StatTileLarge({
  label,
  value,
  sub,
  help,
  tone = "plain",
}: {
  label: string
  value: string
  sub: ReactNode
  help?: string
  tone?: Tone
}) {
  const styles = toneStyles[tone]
  const className = cn(
    "flex min-w-0 flex-col gap-1 rounded-lg px-5 py-[18px] outline-offset-2 focus-visible:outline-2 focus-visible:outline-black",
    styles.tile
  )
  const content = (
    <>
      <div className={cn("text-[13px] leading-[1.3]", styles.label)}>
        {label}
      </div>
      <div
        className={cn(
          "truncate font-mono text-[40px] leading-[1.2] font-semibold",
          styles.value
        )}
      >
        {value}
      </div>
      <div className={cn("text-xs", styles.sub)}>{sub}</div>
    </>
  )
  if (!help) return <div className={className}>{content}</div>
  return (
    <Tooltip>
      <TooltipTrigger render={<div tabIndex={0} className={className} />}>
        {content}
      </TooltipTrigger>
      <TooltipContent>{help}</TooltipContent>
    </Tooltip>
  )
}

function TileSkeleton() {
  return <Skeleton className="h-[108px] rounded-lg" />
}

function TileError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <StatTileLarge
      label={label}
      value="—"
      sub={
        <span role="alert">
          {qualityCopy.tileError} ·{" "}
          <Button variant="link" className="text-xs" onClick={onRetry}>
            {qualityCopy.tryAgain}
          </Button>
        </span>
      }
    />
  )
}

function QualityTiles({
  quality,
}: {
  quality: UseQueryResult<QualityMetricsOut, ApiError>
}) {
  if (quality.isPending) {
    return (
      <>
        <TileSkeleton />
        <TileSkeleton />
      </>
    )
  }
  if (quality.isError) {
    const retry = () => void quality.refetch()
    return (
      <>
        <TileError label={qualityCopy.precisionLabel} onRetry={retry} />
        <TileError label={qualityCopy.inventedLabel} onRetry={retry} />
      </>
    )
  }
  const { labeled, precision, verifier, hallucination_rate } = quality.data
  const caught = verifier.rejected.quote_not_found ?? 0
  return (
    <>
      <StatTileLarge
        tone="ink"
        label={qualityCopy.precisionLabel}
        value={labeled > 0 ? percent(precision) : "—"}
        sub={
          labeled > 0
            ? qualityCopy.precisionSub(formatNumber(labeled))
            : qualityCopy.precisionEmptySub
        }
        help={qualityCopy.precisionHelp}
      />
      <StatTileLarge
        label={qualityCopy.inventedLabel}
        value={
          verifier.evidence_total > 0
            ? `${(hallucination_rate * 100).toFixed(1)}%`
            : "—"
        }
        sub={
          verifier.evidence_total > 0
            ? qualityCopy.inventedSub(
                formatNumber(caught),
                formatNumber(verifier.evidence_total)
              )
            : qualityCopy.inventedEmptySub
        }
        help={qualityCopy.inventedHelp}
      />
    </>
  )
}

/** The mock's "Test set" and "AI spend" tiles have no API source; these show today's real usage instead. */
function UsageTiles({ usage }: { usage: UseQueryResult<UsageOut, ApiError> }) {
  const label = useLabels()

  if (usage.isPending) {
    return (
      <>
        <TileSkeleton />
        <TileSkeleton />
      </>
    )
  }
  if (usage.isError) {
    const retry = () => void usage.refetch()
    return (
      <>
        <TileError label={qualityCopy.documentsLabel} onRetry={retry} />
        <TileError label={qualityCopy.callsLabel} onRetry={retry} />
      </>
    )
  }
  const { documents_scanned_24h: documents, llm_calls_24h: calls } = usage.data
  const sources = topDocumentSources(usage.data)
    .map(
      ([type, count]) =>
        `${formatNumber(count)} ${(sourceLabels[type] ?? label("source_types", type)).toLowerCase()}`
    )
    .join(" · ")
  return (
    <>
      <StatTileLarge
        label={qualityCopy.documentsLabel}
        value={formatNumber(documents)}
        sub={documents > 0 ? sources : qualityCopy.documentsEmptySub}
        help={qualityCopy.documentsHelp}
      />
      <StatTileLarge
        label={qualityCopy.callsLabel}
        value={formatNumber(calls)}
        sub={
          calls > 0
            ? qualityCopy.callsSub(cachePercent(usage.data))
            : qualityCopy.callsEmptySub
        }
        help={qualityCopy.callsHelp}
      />
    </>
  )
}

export function StatTiles({
  quality,
  usage,
}: {
  quality: UseQueryResult<QualityMetricsOut, ApiError>
  usage: UseQueryResult<UsageOut, ApiError>
}) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <QualityTiles quality={quality} />
      <UsageTiles usage={usage} />
    </div>
  )
}
