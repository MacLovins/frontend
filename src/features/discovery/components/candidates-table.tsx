import { cn } from "cn"

import type { DiscoveredCompany } from "@/api/generated/model"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatNumber, score } from "@/lib/format"

import { copy } from "../copy"

const grid =
  "grid grid-cols-[44px_minmax(0,1fr)_70px_130px_100px_80px_minmax(0,1fr)] items-center px-4"
const headers = copy.results.columns

type SelectAll = { checked: boolean; onChange: (checked: boolean) => void }

function HeaderRow({ selectAll }: { selectAll?: SelectAll }) {
  return (
    <div
      role="row"
      className={cn(
        grid,
        "h-10 border-b border-border bg-muted text-xs font-semibold text-muted-foreground"
      )}
    >
      <span role="columnheader">
        {selectAll ? (
          <Checkbox
            className="size-[18px]"
            checked={selectAll.checked}
            onCheckedChange={(checked) => selectAll.onChange(checked)}
            aria-label={copy.results.selectAll}
          />
        ) : null}
      </span>
      <span role="columnheader">{headers.company}</span>
      <span role="columnheader">{headers.country}</span>
      <span role="columnheader">{headers.industry}</span>
      <span role="columnheader">{headers.employees}</span>
      <span role="columnheader">{headers.fit}</span>
      <span role="columnheader">{headers.why}</span>
    </div>
  )
}

function CandidateRow({
  candidate,
  industryLabel,
  selected,
  onToggle,
}: {
  candidate: DiscoveredCompany
  industryLabel: (id: string) => string
  selected: boolean
  onToggle: () => void
}) {
  const tracked = candidate.already_tracked
  const [industry, ...otherIndustries] = candidate.industry_ids

  return (
    <div
      role="row"
      onClick={tracked ? undefined : onToggle}
      className={cn(
        grid,
        "h-[54px] border-b border-subtle text-sm last:border-b-0",
        tracked
          ? "bg-muted"
          : selected
            ? "cursor-pointer bg-primary-surface-subtle"
            : "cursor-pointer bg-card hover:bg-canvas"
      )}
    >
      <span role="cell">
        {tracked ? (
          <span className="text-2xs text-muted-foreground">
            {copy.results.inList}
          </span>
        ) : (
          <Checkbox
            className="size-[18px]"
            checked={selected}
            onCheckedChange={onToggle}
            onClick={(event) => event.stopPropagation()}
            aria-label={candidate.name}
          />
        )}
      </span>
      <span role="cell" className="flex min-w-0 flex-col pr-3">
        <span className="truncate font-semibold">{candidate.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {candidate.domain}
        </span>
      </span>
      <span role="cell">{candidate.country_code ?? "—"}</span>
      <span role="cell" className="truncate pr-3 text-text-secondary">
        {industry
          ? `${industryLabel(industry)}${otherIndustries.length ? ` +${otherIndustries.length}` : ""}`
          : "—"}
      </span>
      <span role="cell" className="font-mono">
        {candidate.employees === null ? "—" : formatNumber(candidate.employees)}
      </span>
      <span role="cell" className="font-mono font-bold">
        {score(candidate.fit_score)}
      </span>
      <span
        role="cell"
        className="min-w-0 text-xs leading-[1.4] text-text-secondary"
      >
        {tracked ? (
          copy.results.alreadyTracked
        ) : candidate.reason ? (
          <Tooltip>
            <TooltipTrigger render={<span className="line-clamp-2" />}>
              {candidate.reason}
            </TooltipTrigger>
            <TooltipContent>{candidate.reason}</TooltipContent>
          </Tooltip>
        ) : (
          "—"
        )}
      </span>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div
      role="row"
      className={cn(grid, "h-[54px] border-b border-subtle last:border-b-0")}
    >
      <Skeleton className="size-[18px] rounded-[4px]" />
      <span className="flex flex-col gap-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </span>
      <Skeleton className="h-3.5 w-6" />
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3.5 w-12" />
      <Skeleton className="h-3.5 w-6" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

const cardClass = "overflow-hidden rounded-lg border border-border bg-card"

/** Eight placeholder rows while the registry search runs. */
export function CandidatesTableSkeleton() {
  return (
    <div role="table" aria-busy className={cardClass}>
      <HeaderRow />
      {Array.from({ length: 8 }, (_, index) => (
        <SkeletonRow key={index} />
      ))}
    </div>
  )
}

export function CandidatesTable({
  candidates,
  industryLabel,
  selected,
  onSelectedChange,
}: {
  candidates: DiscoveredCompany[]
  industryLabel: (id: string) => string
  selected: ReadonlySet<string>
  onSelectedChange: (selected: ReadonlySet<string>) => void
}) {
  const selectable = candidates.filter(
    (candidate) => !candidate.already_tracked
  )
  const allSelected =
    selectable.length > 0 &&
    selectable.every((candidate) => selected.has(candidate.domain))

  const toggle = (domain: string) => {
    const next = new Set(selected)
    if (next.has(domain)) next.delete(domain)
    else next.add(domain)
    onSelectedChange(next)
  }

  return (
    <div role="table" className={cardClass}>
      <HeaderRow
        selectAll={
          selectable.length
            ? {
                checked: allSelected,
                onChange: (all) =>
                  onSelectedChange(
                    new Set(
                      all ? selectable.map((candidate) => candidate.domain) : []
                    )
                  ),
              }
            : undefined
        }
      />
      {candidates.map((candidate) => (
        <CandidateRow
          key={candidate.domain}
          candidate={candidate}
          industryLabel={industryLabel}
          selected={selected.has(candidate.domain)}
          onToggle={() => toggle(candidate.domain)}
        />
      ))}
    </div>
  )
}
