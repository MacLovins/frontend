import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const rows = (count: number) =>
  Array.from({ length: count }, (_, index) => index)

export function LeftColumnSkeleton() {
  return (
    <>
      <Skeleton className="h-[132px] rounded-lg" />
      <Card className="gap-3.5">
        <Skeleton className="h-5 w-24" />
        {rows(3).map((row) => (
          <div key={row} className="flex items-start gap-3">
            <Skeleton className="size-6 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </Card>
      <Card>
        <Skeleton className="h-5 w-36" />
        {rows(5).map((row) => (
          <Skeleton key={row} className="h-2.5" />
        ))}
      </Card>
      <Card className="gap-4">
        <Skeleton className="h-5 w-44" />
        {rows(4).map((row) => (
          <Skeleton key={row} className="h-[120px] rounded-md" />
        ))}
      </Card>
    </>
  )
}

export function RightColumnSkeleton() {
  return (
    <>
      {["h-[260px]", "h-[220px]", "h-[160px]", "h-[140px]"].map((height) => (
        <Skeleton key={height} className={`${height} rounded-lg`} />
      ))}
    </>
  )
}
