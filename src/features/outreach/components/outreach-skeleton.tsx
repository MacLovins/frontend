import { Skeleton } from "@/components/ui/skeleton"
import { OutreachLayout } from "@/features/outreach/components/outreach-layout"

function CardSkeleton({ lines }: { lines: number }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-[18px]">
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  )
}

export function OutreachSkeleton() {
  return (
    <OutreachLayout
      side={
        <div aria-busy="true" aria-label="Loading" className="contents">
          <CardSkeleton lines={1} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </div>
      }
      main={
        <div className="min-w-0 flex-1 rounded-lg border border-border bg-card">
          <div className="flex h-12 items-center gap-6 border-b border-border px-[30px]">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex min-h-[420px] flex-col gap-2.5 px-6 py-5">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-[92%]" />
            <Skeleton className="h-3.5 w-[85%]" />
            <Skeleton className="h-3.5 w-[40%]" />
          </div>
        </div>
      }
    />
  )
}
