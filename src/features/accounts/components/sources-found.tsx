import { cn } from "cn"

import { useGetCompanyDocuments } from "@/api/generated/accounts/accounts"
import type { PaginatedResponseDocumentOut } from "@/api/generated/model"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/format"

const toTotal = (page: PaginatedResponseDocumentOut) => page.total

/** No coverage metric exists: the bar shows the document count and is full at 100. */
function CoverageBar({ count }: { count: number }) {
  const tone =
    count < 20 ? "bg-destructive" : count < 50 ? "bg-warning" : "bg-live"
  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden
        className="h-1.5 w-[60px] shrink-0 overflow-hidden rounded-[3px] bg-subtle"
      >
        {count > 0 ? (
          <span
            className={cn("block h-full rounded-[3px]", tone)}
            style={{ width: `${Math.min(count, 100)}%` }}
          />
        ) : null}
      </span>
      <span className="font-mono text-[13px]">
        {count > 0 ? formatNumber(count) : "—"}
      </span>
    </span>
  )
}

/** `CompanyOut` has no document count (backend gap): one `page_size=1` request per visible row reads `total`. */
export function SourcesFound({ companyId }: { companyId: string }) {
  const count = useGetCompanyDocuments(
    companyId,
    { page_size: 1 },
    { query: { staleTime: 5 * 60_000, select: toTotal } }
  )
  if (count.isPending) return <Skeleton className="h-1.5 w-[60px]" />
  if (count.isError)
    return (
      <span className="font-mono text-[13px] text-muted-foreground">—</span>
    )
  return <CoverageBar count={count.data} />
}
