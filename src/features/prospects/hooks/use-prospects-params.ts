import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

import type { Tier } from "@/api/generated/model"
import {
  DEFAULT_SORT,
  readFilters,
  type SortOption,
} from "@/features/prospects/lib/params"

type ParamKey =
  | "tier"
  | "q"
  | "country"
  | "industry"
  | "new"
  | "min"
  | "sort"
  | "page"
  | "selected"
type Patch = Partial<Record<ParamKey, string | null>>

/**
 * Prospects keeps every filter, the sort and the page in the URL so a view can be shared.
 * Any filter or sort change goes back to page 1.
 */
export function useProspectsParams() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])

  const update = useCallback(
    (
      patch: Patch,
      {
        replace = false,
        resetPage = true,
      }: { replace?: boolean; resetPage?: boolean } = {}
    ) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(patch)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          if (resetPage && !("page" in patch)) next.delete("page")
          return next
        },
        { replace }
      )
    },
    [setParams]
  )

  const actions = useMemo(
    () => ({
      setTier: (tier: Tier | null) => update({ tier }),
      setQuery: (q: string) => update({ q }, { replace: true }),
      setCountries: (codes: string[]) =>
        update({ country: codes.join(",") }, { replace: true }),
      setIndustries: (ids: string[]) =>
        update({ industry: ids.join(",") }, { replace: true }),
      setOnlyNew: (onlyNew: boolean) => update({ new: onlyNew ? "1" : null }),
      setMinPriority: (min: number) =>
        update({ min: min ? String(min) : null }, { replace: true }),
      setSort: (sort: SortOption) =>
        update({ sort: sort === DEFAULT_SORT ? null : sort }),
      setPage: (page: number, replace = false) =>
        update({ page: page > 1 ? String(page) : null }, { replace }),
      setSelected: (companyId: string) =>
        update({ selected: companyId }, { replace: true, resetPage: false }),
      clearFilters: ({ includeTier = false }: { includeTier?: boolean } = {}) =>
        update({
          q: null,
          country: null,
          industry: null,
          new: null,
          min: null,
          ...(includeTier ? { tier: null } : {}),
        }),
    }),
    [update]
  )

  return { params, filters, ...actions }
}
