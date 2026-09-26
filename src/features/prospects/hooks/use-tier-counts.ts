import { useQueries } from "@tanstack/react-query"

import { getListLeadsQueryOptions } from "@/api/generated/leads/leads"
import type { Tier } from "@/api/generated/model"
import { tierOrder } from "@/lib/labels"

export type TierKey = Tier | "all"
export type TierCount = {
  total: number | undefined
  isPending: boolean
  isError: boolean
}

const keys: TierKey[] = ["all", ...tierOrder]

/**
 * Service-level lead counts per tier. The API has no facets, so each chip reads `total` of a one-row page
 * (api-leads-quality.md §2.1). "All tiers" uses the sidebar's exact params to share its cache entry.
 */
export function useTierCounts(serviceId: string) {
  const results = useQueries({
    queries: keys.map((key) =>
      getListLeadsQueryOptions(
        key === "all"
          ? { service_id: serviceId, page_size: 1 }
          : { service_id: serviceId, page_size: 1, tier: [key] },
        { query: { staleTime: 30_000 } }
      )
    ),
  })
  return Object.fromEntries(
    keys.map((key, index) => {
      const result = results[index]
      return [
        key,
        {
          total: result.data?.total,
          isPending: result.isPending,
          isError: result.isError,
        },
      ]
    })
  ) as Record<TierKey, TierCount>
}
