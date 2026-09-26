import { keepPreviousData } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { toast } from "sonner"

import { useListCompanies } from "@/api/generated/accounts/accounts"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import {
  AccountsTable,
  AccountsTableSkeleton,
  TableCard,
  TablePagination,
} from "@/features/accounts/components/accounts-table"
import { AddCompanyDialog } from "@/features/accounts/components/add-company-dialog"
import { FilterBar } from "@/features/accounts/components/filter-bar"
import { CsvImportDialog } from "@/features/accounts/components/import/csv-import-dialog"
import { copy } from "@/features/accounts/copy"
import { useAccountsParams } from "@/features/accounts/hooks/use-accounts-params"
import { useStartAnalysis } from "@/features/accounts/hooks/use-start-analysis"
import { useCurrentService, withService } from "@/hooks/use-current-service"
import { useMe } from "@/hooks/use-session"

const PAGE_SIZE = 50

type OpenDialog = "add" | "import" | null

/** "58 companies · 56 monitored": two `page_size=1` reads of `total`; undefined until both arrive. */
function useSubtitle() {
  const all = useListCompanies({ page_size: 1 })
  const tracked = useListCompanies({ is_tracked: true, page_size: 1 })
  if (!all.data || !tracked.data) return undefined
  return copy.subtitle(all.data.total, tracked.data.total)
}

export function AccountsPage() {
  const subtitle = useSubtitle()
  const { q, tracked, page, setQuery, setTracked, setPage } =
    useAccountsParams()
  const { serviceId } = useCurrentService()
  const { data: me } = useMe()
  const navigate = useNavigate()
  const { start, runPath, isPending: analyzing } = useStartAnalysis()
  const [selection, setSelection] = useState<ReadonlySet<string>>(
    () => new Set()
  )
  const [dialog, setDialog] = useState<OpenDialog>(null)

  const list = useListCompanies(
    {
      page,
      page_size: PAGE_SIZE,
      ...(q ? { q } : {}),
      ...(tracked === "all" ? {} : { is_tracked: tracked === "yes" }),
    },
    { query: { placeholderData: keepPreviousData } }
  )

  // Past the last page (after deletes, or a bookmarked page of a shorter list): go to the last one.
  const total = list.data?.total ?? 0
  const pastEnd =
    !list.isPlaceholderData && list.data?.items.length === 0 && page > 1
  useEffect(() => {
    if (pastEnd) setPage(Math.max(1, Math.ceil(total / PAGE_SIZE)))
  }, [pastEnd, total, setPage])

  const hrefOf = useCallback(
    (companyId: string) => withService(`/companies/${companyId}`, serviceId),
    [serviceId]
  )
  const discoverHref = withService("/accounts/discover", serviceId)

  const changeSelection = useCallback((ids: string[], selected: boolean) => {
    setSelection((current) => {
      const next = new Set(current)
      for (const id of ids) {
        if (selected) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }, [])

  const analyzeSelected = async () => {
    const ids = [...selection]
    const run = await start(ids)
    if (!run) return
    toast.success(copy.analysisStarted(ids.length))
    setSelection(new Set())
    void navigate(runPath(run.id))
  }

  const importAction = (
    <Button variant="outline" onClick={() => setDialog("import")}>
      {copy.importCsv}
    </Button>
  )
  const discoverAction = (
    <Button nativeButton={false} render={<Link to={discoverHref} />}>
      {copy.discover}
    </Button>
  )

  let content
  if (list.isPending) {
    content = <AccountsTableSkeleton />
  } else if (list.isError) {
    content = (
      <ErrorState
        title={copy.loadError}
        error={list.error}
        onRetry={() => void list.refetch()}
      />
    )
  } else if (list.data.total === 0 && !q && tracked === "all") {
    content = (
      <EmptyState
        title={copy.empty.title}
        actions={
          <>
            {importAction}
            {discoverAction}
          </>
        }
      >
        {copy.empty.body}
      </EmptyState>
    )
  } else if (list.data.total === 0) {
    content = (
      <EmptyState
        title={q ? copy.empty.noMatch(q) : copy.empty.noFilterMatch}
        actions={
          <Button
            variant="link"
            onClick={() => (q ? setQuery("") : setTracked("all"))}
          >
            {q ? copy.empty.clearSearch : copy.empty.clearFilter}
          </Button>
        }
      />
    )
  } else {
    content = (
      <>
        <AccountsTable
          companies={list.data.items}
          selection={selection}
          onSelectionChange={changeSelection}
          hrefOf={hrefOf}
          canDelete={me?.role === "admin"}
          fetching={list.isPlaceholderData}
        />
        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={list.data.total}
          onPageChange={setPage}
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={copy.title}
        subtitle={subtitle}
        className="sticky top-0 z-10"
        actions={
          <>
            <Button variant="outline" onClick={() => setDialog("add")}>
              {copy.addCompany}
            </Button>
            {importAction}
            {discoverAction}
          </>
        }
      />
      <div className="flex flex-col gap-3.5 px-8 py-5">
        <FilterBar
          query={q}
          onQueryChange={setQuery}
          monitoring={tracked}
          onMonitoringChange={setTracked}
          selectedCount={selection.size}
          analyzing={analyzing}
          onAnalyze={() => void analyzeSelected()}
        />
        <TableCard>{content}</TableCard>
      </div>

      <AddCompanyDialog
        open={dialog === "add"}
        onOpenChange={(open) => setDialog(open ? "add" : null)}
      />
      <CsvImportDialog
        open={dialog === "import"}
        onOpenChange={(open) => setDialog(open ? "import" : null)}
      />
    </>
  )
}
