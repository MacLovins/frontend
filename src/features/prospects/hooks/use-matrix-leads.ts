import { useQuery } from "@tanstack/react-query"

import { apiPaths } from "@/api/cache"
import { listLeads } from "@/api/generated/leads/leads"

const MATRIX_PAGE_SIZE = 100
const MATRIX_MAX_PAGES = 5

/**
 * Every scored lead of the service for the scatter, best first: page_size is capped at 100 by the API,
 * so the pages are fetched in a loop, up to 500 points. The key starts with the /leads path so live
 * run updates refresh it too.
 */
export function useMatrixLeads(serviceId: string) {
  return useQuery({
    queryKey: [apiPaths.leads, { service_id: serviceId, view: "matrix" }],
    queryFn: async ({ signal }) => {
      const params = {
        service_id: serviceId,
        sort: "priority:desc",
        page_size: MATRIX_PAGE_SIZE,
      }
      const first = await listLeads({ ...params, page: 1 }, { signal })
      const pageCount = Math.min(
        Math.ceil(first.total / MATRIX_PAGE_SIZE),
        MATRIX_MAX_PAGES
      )
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
          listLeads({ ...params, page: index + 2 }, { signal })
        )
      )
      return {
        items: [first, ...rest].flatMap((page) => page.items),
        total: first.total,
      }
    },
    staleTime: 30_000,
  })
}
