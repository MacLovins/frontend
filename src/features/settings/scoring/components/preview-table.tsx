import type { ReactNode } from "react"
import { Link } from "react-router"
import { cn } from "cn"

import type { Tier } from "@/api/generated/model"
import { EmptyState, ErrorState } from "@/components/common/states"
import { TierBadge } from "@/components/common/tier"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { withService } from "@/hooks/use-current-service"
import { copy } from "@/features/settings/scoring/copy"
import type { PreviewRow } from "@/features/settings/scoring/lib/scoring-estimate"

// The mock's columns at 1440; narrower fixed columns below that so nothing overflows at 1280.
const GRID =
  "grid grid-cols-[28px_minmax(0,1fr)_56px_64px_44px_120px] items-center gap-x-1 px-4 min-[1440px]:grid-cols-[36px_minmax(0,1fr)_80px_80px_64px_190px] min-[1440px]:gap-x-0"
const SKELETON_ROWS = 10

type PreviewTableProps = {
  serviceId: string
  savedVersion: number | null
  rows: PreviewRow[]
  total: number
  isPending: boolean
  isFetching: boolean
  error: unknown
  onRetry: () => void
}

function HeaderTip({ children, help }: { children: ReactNode; help: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} className="w-fit rounded-sm" />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{help}</TooltipContent>
    </Tooltip>
  )
}

function DeltaText({ delta }: { delta: number }) {
  if (delta === 0)
    return <span className="font-mono font-semibold text-faint">·</span>
  return (
    <span
      className={cn(
        "font-mono font-semibold",
        delta > 0 ? "text-positive-strong" : "text-negative-strong"
      )}
    >
      {delta > 0 ? `+${delta}` : String(delta)}
    </span>
  )
}

function TierChange({ from, to }: { from: Tier; to: Tier }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <TierBadge tier={from} />
      {to === from ? null : (
        <>
          <span className="font-bold">→</span>
          <TierBadge tier={to} />
        </>
      )}
    </span>
  )
}

/** A state (loading, empty, error) spanning the whole table body. */
function StateRow({ children }: { children: ReactNode }) {
  return (
    <div role="row">
      <div role="cell">{children}</div>
    </div>
  )
}

function SkeletonRows() {
  return Array.from({ length: SKELETON_ROWS }, (_, index) => (
    <div
      key={index}
      aria-hidden="true"
      className={cn(GRID, "h-[50px] border-b border-subtle")}
    >
      <Skeleton className="h-3.5 w-5" />
      <Skeleton className="h-3.5 w-[140px] max-w-full" />
      <Skeleton className="h-3.5 w-7" />
      <Skeleton className="h-3.5 w-7" />
      <Skeleton className="h-3.5 w-5" />
      <Skeleton className="h-5 w-[60px]" />
    </div>
  ))
}

function Body({
  serviceId,
  rows,
  total,
  isPending,
  isFetching,
  error,
  onRetry,
}: Omit<PreviewTableProps, "savedVersion">) {
  if (isPending) return <SkeletonRows />
  if (error) {
    return (
      <StateRow>
        <ErrorState
          title={copy.table.loadError}
          error={error}
          onRetry={onRetry}
        />
      </StateRow>
    )
  }
  if (total === 0 || rows.length === 0) {
    return (
      <StateRow>
        <EmptyState
          title={copy.table.empty.title}
          actions={
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to={withService("/accounts", serviceId)} />}
            >
              {copy.table.empty.action}
            </Button>
          }
        >
          {copy.table.empty.body}
        </EmptyState>
      </StateRow>
    )
  }
  return (
    <div
      role="rowgroup"
      className={cn("transition-opacity", isFetching && "opacity-60")}
    >
      {rows.map((row, index) => (
        <div
          key={row.companyId}
          role="row"
          className={cn(GRID, "h-[50px] border-b border-subtle text-sm")}
        >
          <span role="cell" className="font-mono text-muted-foreground">
            {index + 1}
          </span>
          <span role="cell" title={row.name} className="truncate font-semibold">
            {row.name}
          </span>
          <span role="cell" className="font-mono text-muted-foreground">
            {row.saved}
          </span>
          <span role="cell" className="font-mono font-bold">
            {row.preview}
          </span>
          <span role="cell">
            <DeltaText delta={row.delta} />
          </span>
          <span role="cell">
            <TierChange from={row.savedTier} to={row.previewTier} />
          </span>
        </div>
      ))}
    </div>
  )
}

function TableFrame({
  savedVersion,
  children,
}: {
  savedVersion: number | null
  children: ReactNode
}) {
  return (
    <div
      role="table"
      aria-label={copy.table.label}
      className="overflow-hidden rounded-lg border border-border bg-card"
    >
      <div role="rowgroup">
        <div
          role="row"
          className={cn(
            GRID,
            "h-10 border-b border-border bg-muted text-xs font-semibold text-muted-foreground"
          )}
        >
          <span role="columnheader">{copy.table.rank}</span>
          <span role="columnheader">{copy.table.company}</span>
          <span role="columnheader">
            <HeaderTip help={copy.table.savedHelp(savedVersion)}>
              {copy.table.saved}
            </HeaderTip>
          </span>
          <span role="columnheader">
            <HeaderTip help={copy.table.previewHelp}>
              {copy.table.preview}
            </HeaderTip>
          </span>
          <span role="columnheader">{copy.table.delta}</span>
          <span role="columnheader">{copy.table.tier}</span>
        </div>
      </div>
      {children}
    </div>
  )
}

export function PreviewTableSkeleton() {
  return (
    <TableFrame savedVersion={null}>
      <SkeletonRows />
    </TableFrame>
  )
}

export function PreviewTable({ savedVersion, ...body }: PreviewTableProps) {
  return (
    <TableFrame savedVersion={savedVersion}>
      <Body {...body} />
    </TableFrame>
  )
}
