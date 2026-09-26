import type { ReactNode } from "react"
import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"
import { copy } from "@/features/settings/icp/copy"
import { useServiceLeads } from "@/features/settings/icp/hooks/use-service-leads"
import {
  icpSplit,
  type FailingCompany,
} from "@/features/settings/icp/lib/preview"
import { formatNumber } from "@/lib/format"

const strings = copy.preview
const MAX_FAILING = 8
const MAX_BAR = 86

function SideCard({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-border bg-card p-5",
        className
      )}
    >
      {children}
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-mono text-[32px] leading-[1.2] font-semibold">
        {formatNumber(value)}
      </div>
      <div className="text-[13px] text-muted-foreground">{label}</div>
    </div>
  )
}

function MiniHistogram({ buckets }: { buckets: number[] }) {
  const max = Math.max(...buckets, 1)
  return (
    <div>
      <div className="flex h-[120px] items-end gap-1.5 border-b border-black pb-1">
        {buckets.map((count, index) => (
          <div
            key={strings.buckets[index]}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span className="font-mono text-2xs">{count}</span>
            <div
              className={cn(
                "w-full rounded-t-[3px]",
                index === 4 ? "bg-primary" : "bg-metric-fit"
              )}
              style={{ height: Math.round((count / max) * MAX_BAR) }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3.5 flex gap-1.5">
        {strings.buckets.map((label) => (
          <span
            key={label}
            className="flex-1 text-center text-2xs text-muted-foreground"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function FailingList({ failing }: { failing: FailingCompany[] }) {
  const shown = failing.slice(0, MAX_FAILING)
  return (
    <SideCard>
      <div className="text-sm font-bold">{strings.failTitle}</div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 text-[13px]">
        {shown.map((company) => (
          <div key={company.id} className="contents">
            <span className="truncate">{company.name}</span>
            <span
              className="max-w-[220px] truncate text-right text-muted-foreground"
              title={company.reason}
            >
              {company.reason}
            </span>
          </div>
        ))}
      </div>
      {failing.length > shown.length ? (
        <span className="text-xs text-muted-foreground">
          {strings.more(failing.length - shown.length)}
        </span>
      ) : null}
    </SideCard>
  )
}

function PreviewSkeleton() {
  return (
    <SideCard className="gap-3.5">
      <Skeleton className="h-4 w-56" />
      <div className="flex gap-5">
        <Skeleton className="h-14 w-24" />
        <Skeleton className="h-14 w-16" />
      </div>
      <Skeleton className="h-[120px] w-full" />
      <Skeleton className="h-8 w-full" />
    </SideCard>
  )
}

/**
 * Right column. No endpoint previews an ICP draft (backend gap), so it shows how the SAVED ICP splits the
 * scored accounts and refreshes after "Save and re-score".
 */
export function PreviewPanel({ serviceId }: { serviceId: string }) {
  const leads = useServiceLeads(serviceId)

  if (leads.isPending) return <PreviewSkeleton />
  if (leads.isError) {
    return (
      <SideCard>
        <p className="m-0 text-[13px] text-muted-foreground">
          {strings.unavailable}
        </p>
      </SideCard>
    )
  }

  const split = icpSplit(leads.data)
  return (
    <>
      <SideCard
        className={cn(
          "gap-3.5 transition-opacity",
          leads.isFetching && "opacity-60"
        )}
      >
        <div className="text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          {strings.overline(split.total)}
        </div>
        {split.total === 0 ? (
          <p className="m-0 text-[13px] leading-[1.45] text-muted-foreground">
            {strings.noAccounts}
          </p>
        ) : (
          <>
            <div className="flex gap-5">
              <Stat value={split.passing} label={strings.pass} />
              <Stat value={split.failing.length} label={strings.fail} />
            </div>
            <div className="text-[13px] font-semibold">
              {strings.distribution}
            </div>
            <MiniHistogram buckets={split.buckets} />
            <p className="m-0 text-xs leading-[1.45] text-muted-foreground">
              {strings.hint(split.distinct)}
            </p>
          </>
        )}
      </SideCard>
      {split.failing.length ? <FailingList failing={split.failing} /> : null}
    </>
  )
}
