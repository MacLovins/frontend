import type { MouseEvent } from "react"
import { Link, useNavigate } from "react-router"

import type { LeadListItem } from "@/api/generated/model"
import { CompanyLogo } from "@/components/common/company-logo"
import { NewBadge } from "@/components/common/chips"
import { ReasonList } from "@/components/common/reasons"
import { SubScoreBars } from "@/components/common/score-bars"
import { TierBadge } from "@/components/common/tier"
import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"
import { withService } from "@/hooks/use-current-service"
import { score } from "@/lib/format"
import { prospectsCopy } from "@/features/prospects/copy"
import { FlagChip } from "@/features/prospects/components/list/flag-chip"
import { rowMeta } from "@/features/prospects/lib/format"

export function LeadRow({
  lead,
  rank,
  serviceId,
  industryLabel,
}: {
  lead: LeadListItem
  rank: number
  serviceId: string
  industryLabel: (id: string) => string
}) {
  const navigate = useNavigate()
  const { company, score: scores } = lead
  const href = withService(`/companies/${company.id}`, serviceId)

  // The whole row opens the company; the name is the real link for keyboard and middle-click.
  const openRow = (event: MouseEvent<HTMLTableRowElement>) => {
    if (event.target instanceof Element && event.target.closest("a, button"))
      return
    if (window.getSelection()?.toString()) return
    void navigate(href)
  }

  return (
    <TableRow onClick={openRow} className="cursor-pointer">
      <TableCell className="pt-3.5 pr-0 pl-4 font-mono text-[13px] text-muted-foreground">
        {rank}
      </TableCell>
      <TableCell className="px-0">
        <div className="flex items-start gap-2.5 pr-3">
          <CompanyLogo name={company.name} domain={company.domain} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              to={href}
              className="rounded-[2px] text-sm leading-tight font-semibold text-black no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              {company.name}
            </Link>
            <span
              className="text-xs leading-tight text-muted-foreground"
              title={
                company.industry_ids.length > 1
                  ? company.industry_ids.map(industryLabel).join(", ")
                  : undefined
              }
            >
              {rowMeta(company, industryLabel)}
            </span>
            <FlagChip flags={lead.flags} />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-0">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[22px] leading-none font-semibold">
            {score(scores.priority)}
          </span>
          <TierBadge tier={scores.tier} />
        </div>
      </TableCell>
      <TableCell className="pr-4 pl-0">
        <SubScoreBars
          fit={scores.fit}
          intent={scores.intent}
          risk={scores.risk}
        />
      </TableCell>
      <TableCell className="pr-3 pl-0">
        {lead.top_reasons.length || scores.disqualified ? (
          <ReasonList
            reasons={lead.top_reasons}
            excludedBy={scores.disqualified ? lead.flags : undefined}
          />
        ) : (
          <span className="text-[13px] text-muted-foreground">
            {prospectsCopy.noSignals}
          </span>
        )}
      </TableCell>
      <TableCell className="pr-4 pl-0">
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono text-[15px] font-semibold">
            {lead.signals_count}
          </span>
          {lead.new_signals_7d > 0 ? (
            <NewBadge count={lead.new_signals_7d} />
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function LeadRowSkeleton() {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell className="pt-4 pr-0 pl-4">
        <Skeleton className="h-3 w-4" />
      </TableCell>
      <TableCell className="px-0">
        <div className="flex items-start gap-2.5 pr-3">
          <Skeleton className="size-8 shrink-0 rounded-sm" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-44 max-w-full" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-0">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-[22px] w-8" />
          <Skeleton className="h-5 w-12" />
        </div>
      </TableCell>
      <TableCell className="pr-4 pl-0">
        <div className="flex flex-col gap-[9px] pt-1">
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-1.5 w-full" />
        </div>
      </TableCell>
      <TableCell className="pr-3 pl-0">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </TableCell>
      <TableCell className="pr-4 pl-0">
        <Skeleton className="ml-auto h-4 w-5" />
      </TableCell>
    </TableRow>
  )
}
