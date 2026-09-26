import type { KeyboardEvent } from "react"
import { cn } from "cn"
import { Link, useNavigate } from "react-router"

import type { CompanyOut } from "@/api/generated/model"
import { Checkbox } from "@/components/ui/checkbox"
import { copy, originLabels } from "@/features/accounts/copy"
import { accountsGrid } from "@/features/accounts/components/accounts-grid"
import { RowActions } from "@/features/accounts/components/row-actions"
import { SourcesFound } from "@/features/accounts/components/sources-found"
import { shortRelative } from "@/features/accounts/lib/format"
import { formatDateTime, formatNumber } from "@/lib/format"
import { humanize } from "@/lib/labels"

function Industry({
  ids,
  names,
}: {
  ids: string[]
  names: ReadonlyMap<string, string> | undefined
}) {
  const [first, ...rest] = ids.map((id) => names?.get(id) ?? humanize(id))
  if (!first) return <span className="text-text-secondary">—</span>
  return (
    <span
      className="flex min-w-0 items-baseline gap-1 text-text-secondary"
      title={[first, ...rest].join(", ")}
    >
      <span className="truncate">{first}</span>
      {rest.length > 0 ? (
        <span className="shrink-0 text-muted-foreground">+{rest.length}</span>
      ) : null}
    </span>
  )
}

export function AccountRow({
  company,
  industryNames,
  href,
  selected,
  onSelectedChange,
  canDelete,
  onDeleted,
}: {
  company: CompanyOut
  industryNames: ReadonlyMap<string, string> | undefined
  href: string
  selected: boolean
  onSelectedChange: (id: string, selected: boolean) => void
  canDelete: boolean
  onDeleted: (id: string) => void
}) {
  const navigate = useNavigate()

  const openOnEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && event.target === event.currentTarget)
      void navigate(href)
  }

  return (
    <div
      role="row"
      tabIndex={0}
      onKeyDown={openOnEnter}
      className={cn(
        accountsGrid,
        "h-[52px] border-b border-subtle text-sm outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black",
        selected ? "bg-primary-surface-subtle" : "hover:bg-canvas"
      )}
    >
      <span role="cell" className="flex">
        <Checkbox
          aria-label={copy.selectRow(company.name)}
          checked={selected}
          onCheckedChange={(checked) => onSelectedChange(company.id, checked)}
        />
      </span>
      <span role="cell" className="flex min-w-0 flex-col pr-3">
        <Link
          to={href}
          className="truncate font-semibold text-black no-underline hover:text-link-hover"
        >
          {company.name}
        </Link>
        <span className="flex min-w-0 items-baseline gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{company.domain}</span>
          {company.is_tracked ? null : (
            <span className="shrink-0 text-2xs">{copy.notMonitored}</span>
          )}
        </span>
      </span>
      <span role="cell">{company.country_code ?? "—"}</span>
      <span role="cell" className="min-w-0 pr-3">
        <Industry ids={company.industry_ids} names={industryNames} />
      </span>
      <span role="cell" className="font-mono">
        {company.employees === null ? "—" : formatNumber(company.employees)}
      </span>
      <span role="cell" className="text-xs">
        <span className="rounded bg-muted px-2 py-0.5">
          {originLabels[company.origin]}
        </span>
      </span>
      <span role="cell">
        <SourcesFound companyId={company.id} />
      </span>
      <span role="cell" className="text-[13px] text-text-secondary">
        {company.last_analyzed_at ? (
          <time
            dateTime={company.last_analyzed_at}
            title={formatDateTime(company.last_analyzed_at)}
          >
            {shortRelative(company.last_analyzed_at)}
          </time>
        ) : (
          copy.never
        )}
      </span>
      <span role="cell" className="flex justify-end">
        <RowActions
          company={company}
          href={href}
          canDelete={canDelete}
          onDeleted={onDeleted}
        />
      </span>
    </div>
  )
}
