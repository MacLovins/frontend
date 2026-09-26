import type { ReactNode } from "react"
import { cn } from "cn"

import type { CompanyOut } from "@/api/generated/model"
import { InfoTip } from "@/components/common/info-tip"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AccountRow } from "@/features/accounts/components/account-row"
import { accountsGrid } from "@/features/accounts/components/accounts-grid"
import { PageCheckbox } from "@/features/accounts/components/page-checkbox"
import { copy } from "@/features/accounts/copy"
import { useIndustryNames } from "@/features/accounts/hooks/use-meta-names"

const SKELETON_ROWS = 12

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {children}
    </div>
  )
}

function HeaderRow({ selectAll }: { selectAll?: ReactNode }) {
  return (
    <div role="rowgroup">
      <div
        role="row"
        className={cn(
          accountsGrid,
          "h-10 border-b border-border bg-muted text-xs font-semibold text-muted-foreground"
        )}
      >
        <span role="columnheader" className="flex">
          {selectAll}
        </span>
        <span role="columnheader">{copy.columns.company}</span>
        <span role="columnheader">{copy.columns.country}</span>
        <span role="columnheader">{copy.columns.industry}</span>
        <span role="columnheader">{copy.columns.employees}</span>
        <span role="columnheader">{copy.columns.origin}</span>
        <span role="columnheader" className="flex items-center gap-1.5">
          {copy.columns.sources}
          <InfoTip label={copy.columns.sources}>{copy.sourcesHelp}</InfoTip>
        </span>
        <span role="columnheader">{copy.columns.lastAnalysed}</span>
        <span role="columnheader" className="sr-only">
          {copy.columns.actions}
        </span>
      </div>
    </div>
  )
}

export function AccountsTableSkeleton() {
  return (
    <div role="table" aria-label={copy.title} aria-busy>
      <HeaderRow />
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div
          key={index}
          aria-hidden
          className={cn(accountsGrid, "h-[52px] border-b border-subtle")}
        >
          <Skeleton className="size-4" />
          <span className="flex flex-col gap-1.5 pr-3">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-3 w-24 max-w-full" />
          </span>
          <Skeleton className="h-3.5 w-6" />
          <Skeleton className="mr-3 h-3.5 w-20" />
          <Skeleton className="h-3.5 w-12" />
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-1.5 w-[60px]" />
          <Skeleton className="h-3.5 w-14" />
          <span />
        </div>
      ))}
    </div>
  )
}

export function AccountsTable({
  companies,
  selection,
  onSelectionChange,
  hrefOf,
  canDelete,
  fetching,
}: {
  companies: CompanyOut[]
  selection: ReadonlySet<string>
  onSelectionChange: (ids: string[], selected: boolean) => void
  hrefOf: (companyId: string) => string
  canDelete: boolean
  fetching: boolean
}) {
  const industryNames = useIndustryNames()
  const selectedOnPage = companies.filter((company) =>
    selection.has(company.id)
  ).length
  const allSelected =
    companies.length > 0 && selectedOnPage === companies.length

  return (
    <div
      role="table"
      aria-label={copy.title}
      className={cn("transition-opacity", fetching && "opacity-60")}
    >
      <HeaderRow
        selectAll={
          <PageCheckbox
            label={copy.columns.select}
            checked={allSelected}
            indeterminate={selectedOnPage > 0 && !allSelected}
            onCheckedChange={() =>
              onSelectionChange(
                companies.map((company) => company.id),
                !allSelected
              )
            }
          />
        }
      />
      <div role="rowgroup">
        {companies.map((company) => (
          <AccountRow
            key={company.id}
            company={company}
            industryNames={industryNames}
            href={hrefOf(company.id)}
            selected={selection.has(company.id)}
            onSelectedChange={(id, selected) =>
              onSelectionChange([id], selected)
            }
            canDelete={canDelete}
            onDeleted={(id) => onSelectionChange([id], false)}
          />
        ))}
      </div>
    </div>
  )
}

export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}) {
  const from = Math.min((page - 1) * pageSize + 1, total)
  const to = Math.min(page * pageSize, total)
  return (
    <nav
      aria-label={copy.pagination}
      className="flex h-12 items-center gap-2 px-4 text-[13px] text-muted-foreground"
    >
      <span>{copy.range(from, to, total)}</span>
      <div className="ml-auto flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {copy.previous}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={to >= total}
          onClick={() => onPageChange(page + 1)}
        >
          {copy.next}
        </Button>
      </div>
    </nav>
  )
}
