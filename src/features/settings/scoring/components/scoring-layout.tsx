import type { ReactNode } from "react"
import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"
import { PreviewTableSkeleton } from "@/features/settings/scoring/components/preview-table"

/** Settings on the left (520 at 1440, narrower below so the preview keeps its room), preview on the right. */
export function ScoringColumns({
  left,
  right,
}: {
  left: ReactNode
  right: ReactNode
}) {
  return (
    <div className="flex items-start gap-5 px-8 py-5">
      <div className="flex w-[440px] shrink-0 flex-col gap-3.5 min-[1440px]:w-[520px]">
        {left}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3.5">{right}</div>
    </div>
  )
}

export function SummaryBarSkeleton() {
  return <Skeleton className="h-[72px] rounded-lg" />
}

const CARD_HEIGHTS = ["h-[186px]", "h-[300px]", "h-[104px]", "h-[200px]"]

export function ScoringBodySkeleton() {
  return (
    <ScoringColumns
      left={CARD_HEIGHTS.map((height) => (
        <Skeleton key={height} className={cn(height, "rounded-lg")} />
      ))}
      right={
        <>
          <SummaryBarSkeleton />
          <PreviewTableSkeleton />
          <Skeleton className="h-[120px] rounded-lg" />
        </>
      }
    />
  )
}
