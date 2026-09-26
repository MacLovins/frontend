import { keepPreviousData } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"

import { useListLeads } from "@/api/generated/leads/leads"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button, buttonVariants } from "@/components/ui/button"
import { withService } from "@/hooks/use-current-service"
import { prospectsCopy } from "@/features/prospects/copy"
import { AnalyzeDialog } from "@/features/prospects/components/analyze-dialog"
import { ViewSwitch } from "@/features/prospects/components/view-switch"
import { FilterBar } from "@/features/prospects/components/list/filter-bar"
import { LeadRow } from "@/features/prospects/components/list/lead-row"
import {
  LeadsFooter,
  LeadsTable,
} from "@/features/prospects/components/list/leads-table"
import { ProspectsHeader } from "@/features/prospects/components/list/prospects-header"
import { TierChips } from "@/features/prospects/components/list/tier-chips"
import { useIndustryLabel } from "@/features/prospects/hooks/use-industry-label"
import { useProspectsParams } from "@/features/prospects/hooks/use-prospects-params"
import { useTierCounts } from "@/features/prospects/hooks/use-tier-counts"
import {
  hasRefinements,
  leadFilterParams,
  PAGE_SIZE,
} from "@/features/prospects/lib/params"

/** The ranked list: who to contact today and why. */
export function ListView({
  serviceId,
  serviceName,
}: {
  serviceId: string
  serviceName: string
}) {
  const {
    filters,
    setTier,
    setSort,
    setPage,
    clearFilters,
    setQuery,
    setCountries,
    setIndustries,
    setOnlyNew,
    setMinPriority,
  } = useProspectsParams()
  const [analyzeOpen, setAnalyzeOpen] = useState(false)
  const industryLabel = useIndustryLabel()
  const counts = useTierCounts(serviceId)

  const filterParams = useMemo(
    () => leadFilterParams(serviceId, filters),
    [serviceId, filters]
  )
  const leads = useListLeads(
    { ...filterParams, page: filters.page, page_size: PAGE_SIZE },
    { query: { placeholderData: keepPreviousData, staleTime: 30_000 } }
  )

  const data = leads.data
  const pageCount = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const settled = !!data && !leads.isPlaceholderData

  // A shared link or a shrinking result can point past the last page; land on the last real one.
  useEffect(() => {
    if (settled && filters.page > pageCount) setPage(pageCount, true)
  }, [settled, filters.page, pageCount, setPage])

  const empty = settled && data.total === 0
  const filtered = filters.tier !== null || hasRefinements(filters)
  const openAnalyze = () => setAnalyzeOpen(true)

  let state = null
  if (leads.isError) {
    state = (
      <ErrorState
        title={prospectsCopy.loadError}
        error={leads.error}
        onRetry={() => void leads.refetch()}
      />
    )
  } else if (empty && (!filtered || counts.all.total === 0)) {
    state = (
      <EmptyState
        title={prospectsCopy.noLeadsTitle}
        actions={
          <>
            <Button onClick={openAnalyze}>
              {prospectsCopy.analyzeAccounts}
            </Button>
            <Link
              to={withService("/accounts", serviceId)}
              className={buttonVariants({ variant: "outline" })}
            >
              {prospectsCopy.addAccounts}
            </Link>
          </>
        }
      >
        {prospectsCopy.noLeadsBody}
      </EmptyState>
    )
  } else if (empty) {
    state = (
      <EmptyState
        title={prospectsCopy.noMatches}
        actions={
          <Button
            variant="ghost"
            onClick={() => clearFilters({ includeTier: true })}
          >
            {prospectsCopy.clearFilters}
          </Button>
        }
      />
    )
  }

  // Rank by the page the rows came from: while the next page loads, the previous rows stay on screen.
  const firstRank = data ? (data.page - 1) * data.page_size + 1 : 1
  const changePage = (page: number) => {
    setPage(page)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <ProspectsHeader
        serviceId={serviceId}
        exportParams={filterParams}
        canExport={!!data && data.total > 0}
        onAnalyze={openAnalyze}
      />
      <div className="flex flex-col gap-4 px-8 pt-5">
        <div className="flex flex-wrap gap-3">
          <TierChips tier={filters.tier} counts={counts} onChange={setTier} />
          <ViewSwitch current="list" className="ml-auto self-center" />
        </div>
        <FilterBar
          filters={filters}
          items={data?.items}
          actions={{
            setQuery,
            setCountries,
            setIndustries,
            setOnlyNew,
            setMinPriority,
            clearFilters: () => clearFilters(),
          }}
        />
      </div>
      <LeadsTable
        sort={filters.sort}
        onSortChange={setSort}
        loading={!data}
        refreshing={leads.isPlaceholderData}
        state={state}
        rows={data?.items.map((lead, index) => (
          <LeadRow
            key={lead.company.id}
            lead={lead}
            rank={firstRank + index}
            serviceId={serviceId}
            industryLabel={industryLabel}
          />
        ))}
        footer={
          data ? (
            <LeadsFooter
              shown={data.items.length}
              total={data.total}
              page={filters.page}
              pageCount={pageCount}
              disabled={leads.isPlaceholderData}
              onPageChange={changePage}
            />
          ) : null
        }
      />
      <AnalyzeDialog
        open={analyzeOpen}
        onOpenChange={setAnalyzeOpen}
        serviceId={serviceId}
        serviceName={serviceName}
      />
    </>
  )
}
