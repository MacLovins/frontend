import type { LeadListItem } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { prospectsCopy } from "@/features/prospects/copy"
import { IndustryFilter } from "@/features/prospects/components/list/industry-filter"
import { MarketFilter } from "@/features/prospects/components/list/market-filter"
import { MinPriorityFilter } from "@/features/prospects/components/list/min-priority-filter"
import { SearchBox } from "@/features/prospects/components/list/search-box"
import { compactSince, latestAnalyzedAt } from "@/features/prospects/lib/format"
import {
  hasRefinements,
  sortFieldLabels,
  splitSort,
  type ProspectFilters,
} from "@/features/prospects/lib/params"

type FilterActions = {
  setQuery: (q: string) => void
  setCountries: (codes: string[]) => void
  setIndustries: (ids: string[]) => void
  setOnlyNew: (onlyNew: boolean) => void
  setMinPriority: (min: number) => void
  clearFilters: () => void
}

function SortSummary({
  filters,
  items,
}: {
  filters: ProspectFilters
  items: LeadListItem[] | undefined
}) {
  const latest = items ? latestAnalyzedAt(items) : null
  return (
    <span className="ml-auto text-[13px] text-muted-foreground">
      Sorted by {sortFieldLabels[splitSort(filters.sort).field]}
      {latest !== null ? ` · updated ${compactSince(latest)} ago` : null}
    </span>
  )
}

export function FilterBar({
  filters,
  items,
  actions,
}: {
  filters: ProspectFilters
  items: LeadListItem[] | undefined
  actions: FilterActions
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SearchBox value={filters.q} onCommit={actions.setQuery} />
      <MarketFilter
        selected={filters.countries}
        onChange={actions.setCountries}
      />
      <IndustryFilter
        selected={filters.industries}
        onChange={actions.setIndustries}
      />
      <Tooltip>
        <TooltipTrigger
          render={
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-white px-3 text-sm" />
          }
        >
          <Checkbox
            checked={filters.onlyNew}
            onCheckedChange={(checked) => actions.setOnlyNew(checked)}
          />
          {prospectsCopy.newThisWeek}
        </TooltipTrigger>
        <TooltipContent>{prospectsCopy.newThisWeekTip}</TooltipContent>
      </Tooltip>
      <MinPriorityFilter
        value={filters.minPriority}
        disabled={filters.tier === "disqualified"}
        onCommit={actions.setMinPriority}
      />
      {hasRefinements(filters) ? (
        <Button variant="ghost" size="sm" onClick={actions.clearFilters}>
          {prospectsCopy.clearFilters}
        </Button>
      ) : null}
      <SortSummary filters={filters} items={items} />
    </div>
  )
}
