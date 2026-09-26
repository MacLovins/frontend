import { useQuery } from "@tanstack/react-query"

import {
  getListCompaniesQueryKey,
  listCompanies,
} from "@/api/generated/accounts/accounts"

const PAGE_SIZE = 100
/** POST /runs takes 1..500 company ids (backend runs/schemas.py). */
const MAX_RUN_COMPANIES = 500

/** Ids of the tracked accounts an analysis run should cover, fetched only while the dialog is open. */
export function useTrackedCompanyIds(enabled: boolean) {
  const params = { is_tracked: true, page_size: PAGE_SIZE }
  return useQuery({
    queryKey: [...getListCompaniesQueryKey(params), "ids"],
    queryFn: async ({ signal }) => {
      const first = await listCompanies({ ...params, page: 1 }, { signal })
      const pageCount = Math.min(
        Math.ceil(first.total / PAGE_SIZE),
        MAX_RUN_COMPANIES / PAGE_SIZE
      )
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
          listCompanies({ ...params, page: index + 2 }, { signal })
        )
      )
      return {
        ids: [first, ...rest].flatMap((page) =>
          page.items.map((company) => company.id)
        ),
        total: first.total,
      }
    },
    enabled,
  })
}
