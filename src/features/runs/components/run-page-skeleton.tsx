import { cn } from "cn"

import { Skeleton } from "@/components/ui/skeleton"

import { RunBody } from "./run-body"
import { RunHeader } from "./run-header"

const COMPANY_CARDS = 4
const STEPS = 8
// Spans, not <Skeleton> divs: they sit inside the header's <h1> and subtitle <span>.
const pulse = "block animate-pulse rounded-sm bg-subtle"

export function RunPageSkeleton() {
  return (
    <div aria-busy className="flex flex-col">
      <RunHeader
        title={<span className={cn(pulse, "h-7 w-[120px]")} />}
        subtitle={<span className={cn(pulse, "h-4 w-72")} />}
      />
      <RunBody
        main={
          <>
            <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card px-5 py-[18px]">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-2.5 w-full rounded-[5px]" />
            </div>
            {Array.from({ length: COMPANY_CARDS }, (_, card) => (
              <div
                key={card}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card px-5 py-4"
              >
                <Skeleton className="h-5 w-56" />
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: STEPS }, (_, step) => (
                    <span
                      key={step}
                      className="block h-1.5 rounded-[3px] bg-subtle"
                    />
                  ))}
                </div>
                <Skeleton className="h-4 w-80" />
              </div>
            ))}
          </>
        }
        aside={<Skeleton className="h-64 rounded-lg" />}
      />
    </div>
  )
}
