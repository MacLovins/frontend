import { ShieldCheckIcon } from "@phosphor-icons/react"
import { Link } from "react-router"

import { useGetQuality } from "@/api/generated/feedback/feedback"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { withService } from "@/hooks/use-current-service"
import { formatNumber } from "@/lib/format"
import { prospectsCopy } from "@/features/prospects/copy"

/** "Signal precision 86% · 124 labels": team feedback on extracted signals, links to Quality. */
export function PrecisionBadge({ serviceId }: { serviceId: string }) {
  // Org-wide, like the sidebar's Quality figure (same query, same cache entry).
  const quality = useGetQuality(undefined, { query: { staleTime: 60_000 } })
  const data = quality.data
  const labeled = data && data.labeled > 0 ? data.labeled : 0

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={withService("/quality", serviceId)}
            className="flex h-10 items-center gap-2 rounded-md border border-border bg-white px-3 text-[13px] text-black hover:text-link-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          />
        }
      >
        <ShieldCheckIcon
          size={16}
          className="shrink-0 text-positive"
          aria-hidden="true"
        />
        {quality.isPending ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          <>
            <span>
              {prospectsCopy.precision}{" "}
              <strong>
                {labeled && data ? `${Math.round(data.precision * 100)}%` : "—"}
              </strong>
            </span>
            {data ? (
              <span className="text-muted-foreground">
                {labeled
                  ? `${formatNumber(labeled)} ${prospectsCopy.labelsSuffix}`
                  : prospectsCopy.noLabels}
              </span>
            ) : null}
          </>
        )}
      </TooltipTrigger>
      <TooltipContent>{prospectsCopy.precisionTip}</TooltipContent>
    </Tooltip>
  )
}
