import { Link } from "react-router"
import { cn } from "cn"

import type { LeadListItem } from "@/api/generated/model"
import { StatTile } from "@/components/common/chips"
import { ReasonList } from "@/components/common/reasons"
import { TierBadge } from "@/components/common/tier"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { withService } from "@/hooks/use-current-service"
import { score } from "@/lib/format"
import { matrixCopy } from "@/features/prospects/copy"
import { selectedMeta } from "@/features/prospects/lib/format"

const cardClass =
  "flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
const eyebrowClass =
  "text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase"

/** Why the clicked company sits where it does: its scores and why-now reasons. */
export function SelectedCard({
  lead,
  serviceId,
  industryLabel,
}: {
  lead: LeadListItem
  serviceId: string
  industryLabel: (id: string) => string
}) {
  const { company, score: scores } = lead
  const meta = selectedMeta(company, industryLabel)
  const tiles = [
    { label: matrixCopy.priority, value: scores.priority },
    { label: matrixCopy.fit, value: scores.fit },
    { label: matrixCopy.signals, value: scores.intent },
    { label: matrixCopy.blockers, value: scores.risk },
  ]
  return (
    <section aria-label={matrixCopy.selected} className={cardClass}>
      <div className={eyebrowClass}>{matrixCopy.selected}</div>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-xl font-bold">{company.name}</span>
        <TierBadge tier={scores.tier} />
      </div>
      {meta ? (
        <div className="text-[13px] text-muted-foreground">{meta}</div>
      ) : null}
      <div className="grid grid-cols-4 gap-2">
        {tiles.map((tile) => (
          <StatTile
            key={tile.label}
            label={tile.label}
            value={score(tile.value)}
          />
        ))}
      </div>
      {lead.top_reasons.length || scores.disqualified ? (
        <ReasonList
          reasons={lead.top_reasons}
          excludedBy={scores.disqualified ? lead.flags : undefined}
          max={4}
          className="text-sm leading-[1.5]"
        />
      ) : (
        <p className="m-0 text-sm leading-[1.5] text-muted-foreground">
          {matrixCopy.noReasons}
        </p>
      )}
      <Link
        to={withService(`/companies/${company.id}`, serviceId)}
        className={cn(buttonVariants({ variant: "black" }), "self-start")}
      >
        {matrixCopy.openCompany}
      </Link>
    </section>
  )
}

export function SelectedCardSkeleton() {
  return (
    <div className={cardClass} aria-busy="true">
      <div className={eyebrowClass}>{matrixCopy.selected}</div>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-56" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-[58px] rounded-sm" />
        ))}
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  )
}
