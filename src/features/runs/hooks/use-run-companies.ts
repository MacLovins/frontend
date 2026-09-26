import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"

import {
  getGetCompanyQueryOptions,
  useListCompanies,
} from "@/api/generated/accounts/accounts"
import type { CompanyOut } from "@/api/generated/model"

const LIST_PARAMS = { page_size: 100 }

/**
 * Names and domains of the companies in a run. `RunOut` carries only ids (backend gap), so one page of the
 * newest companies covers most runs and the rest are fetched one by one.
 */
export function useRunCompanies(ids: string[]) {
  const list = useListCompanies(LIST_PARAMS, {
    query: { staleTime: 5 * 60_000 },
  })
  const listed = useMemo(
    () =>
      new Map((list.data?.items ?? []).map((company) => [company.id, company])),
    [list.data]
  )
  const missing = list.isPending ? [] : ids.filter((id) => !listed.has(id))

  const lookups = useQueries({
    queries: missing.map((id) =>
      getGetCompanyQueryOptions(id, { query: { staleTime: Infinity } })
    ),
  })

  const companies = new Map<string, CompanyOut>(listed)
  lookups.forEach((lookup, index) => {
    if (lookup.data) companies.set(missing[index], lookup.data)
  })
  const isLoading = list.isPending || lookups.some((lookup) => lookup.isPending)
  return { companies, isLoading }
}
