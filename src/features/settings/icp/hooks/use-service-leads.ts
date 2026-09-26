import { useQuery } from "@tanstack/react-query"

import { getListLeadsQueryKey, listLeads } from "@/api/generated/leads/leads"

const PAGE_SIZE = 100 // backend maximum (core/pagination.py)

/**
 * Every scored lead of the service (all pages). Stand-in for the missing ICP preview and per-rule
 * "affects now" endpoints: the screens read `flags` (fired rule names, "Outside ICP: …") and `score.fit`.
 * The key starts with the leads path, so invalidating leads after a re-score refreshes it too.
 */
export function useServiceLeads(serviceId: string) {
  const params = { service_id: serviceId, page_size: PAGE_SIZE }
  return useQuery({
    queryKey: [...getListLeadsQueryKey(params), "all-pages"],
    queryFn: async ({ signal }) => {
      const first = await listLeads({ ...params, page: 1 }, { signal })
      const pages = Math.ceil(first.total / PAGE_SIZE)
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
          listLeads({ ...params, page: index + 2 }, { signal })
        )
      )
      return [first, ...rest].flatMap((page) => page.items)
    },
  })
}
