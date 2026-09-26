import type { QueryClient } from "@tanstack/react-query"

import { getListCompaniesQueryKey } from "@/api/generated/accounts/accounts"

/**
 * Company lists and header counts only. `invalidateApi(apiPaths.companies)` would also refetch the per-row
 * document counts that share the path prefix (50 requests per page).
 */
export function invalidateCompanyLists(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() })
}
