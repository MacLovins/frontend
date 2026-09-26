import type { ReactNode } from "react"
import { cn } from "cn"

import { InfoTip } from "@/components/common/info-tip"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { metricHelp, metricLabels } from "@/lib/labels"
import { prospectsCopy } from "@/features/prospects/copy"
import { LeadRowSkeleton } from "@/features/prospects/components/list/lead-row"
import {
  splitSort,
  type SortField,
  type SortOption,
} from "@/features/prospects/lib/params"

const SKELETON_ROWS = 8

const defaultDirection: Record<SortField, "asc" | "desc"> = {
  priority: "desc",
  name: "asc",
  signals_count: "desc",
}

function SortableHead({
  field,
  label,
  sort,
  onSortChange,
  className,
}: {
  field: SortField
  label: string
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  className?: string
}) {
  const active = splitSort(sort)
  const isActive = active.field === field
  const direction = isActive
    ? active.direction === "asc"
      ? "desc"
      : "asc"
    : defaultDirection[field]
  return (
    <TableHead
      aria-sort={
        isActive
          ? active.direction === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
      className={className}
    >
      <button
        type="button"
        onClick={() => onSortChange(`${field}:${direction}` as SortOption)}
        className="rounded-[2px] font-semibold tracking-[0.02em] hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        {label}
        {isActive ? (active.direction === "asc" ? " ↑" : " ↓") : null}
      </button>
    </TableHead>
  )
}

function ScoresHead() {
  return (
    <TableHead className="px-0">
      <span className="inline-flex items-center gap-1.5">
        {prospectsCopy.colBars}
        <InfoTip label={prospectsCopy.colBars}>
          <span className="flex flex-col gap-1">
            {(["fit", "intent", "risk"] as const).map((metric) => (
              <span key={metric}>
                <strong>{metricLabels[metric]}:</strong> {metricHelp[metric]}
              </span>
            ))}
          </span>
        </InfoTip>
      </span>
    </TableHead>
  )
}

/** Ranked leads: the header row always shows; the body is rows, skeletons, or a state below the header. */
export function LeadsTable({
  sort,
  onSortChange,
  loading,
  refreshing,
  rows,
  state,
  footer,
}: {
  sort: SortOption
  onSortChange: (sort: SortOption) => void
  loading: boolean
  refreshing: boolean
  rows: ReactNode
  /** Empty or error state, shown under the header instead of rows. */
  state: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="mx-8 mt-4 mb-8 overflow-hidden rounded-lg border border-border bg-card">
      <Table className="table-fixed">
        <colgroup>
          <col className="w-[60px]" />
          <col className="w-[250px]" />
          <col className="w-[120px]" />
          <col className="w-[170px]" />
          <col />
          <col className="w-[112px]" />
        </colgroup>
        <TableHeader>
          <TableRow className="tracking-[0.02em]">
            <TableHead className="pr-0 pl-4">{prospectsCopy.colRank}</TableHead>
            <SortableHead
              field="name"
              label={prospectsCopy.colCompany}
              sort={sort}
              onSortChange={onSortChange}
              className="px-0"
            />
            <SortableHead
              field="priority"
              label={prospectsCopy.colPriority}
              sort={sort}
              onSortChange={onSortChange}
              className="px-0"
            />
            <ScoresHead />
            <TableHead className="px-0">{prospectsCopy.colWhy}</TableHead>
            <SortableHead
              field="signals_count"
              label={prospectsCopy.colSignals}
              sort={sort}
              onSortChange={onSortChange}
              className="pr-4 pl-0 text-right"
            />
          </TableRow>
        </TableHeader>
        {state ? null : (
          <TableBody
            aria-busy={loading || refreshing}
            className={cn("transition-opacity", refreshing && "opacity-60")}
          >
            {loading
              ? Array.from({ length: SKELETON_ROWS }, (_, index) => (
                  <LeadRowSkeleton key={index} />
                ))
              : rows}
          </TableBody>
        )}
      </Table>
      {state}
      {state || loading ? null : footer}
    </div>
  )
}

export function LeadsFooter({
  shown,
  total,
  page,
  pageCount,
  disabled,
  onPageChange,
}: {
  shown: number
  total: number
  page: number
  pageCount: number
  disabled: boolean
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex h-11 items-center justify-between gap-4 border-t border-subtle px-4 text-[13px] text-muted-foreground">
      <span>
        Showing {shown} of {total} · {prospectsCopy.perPage}
      </span>
      {pageCount > 1 ? (
        <nav aria-label="Pagination" className="flex items-center gap-2">
          <span>
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {prospectsCopy.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={disabled || page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            {prospectsCopy.next}
          </Button>
        </nav>
      ) : null}
    </div>
  )
}
