import { useMemo } from "react"

import { useGetCountries, useGetIndustries } from "@/api/generated/meta/meta"

const forever = { query: { staleTime: Infinity } }

/** Country and industry names. The backend caches both lists per process, so the client keeps them forever. */
export function useCatalog() {
  const countries = useGetCountries(forever)
  const industries = useGetIndustries(forever)

  const industryLabels = useMemo(
    () =>
      new Map(
        (industries.data ?? []).map((industry) => [industry.id, industry.label])
      ),
    [industries.data]
  )

  return {
    countries: countries.data ?? [],
    industries: industries.data ?? [],
    industryLabel: (id: string) => industryLabels.get(id) ?? id,
    isLoading: countries.isLoading || industries.isLoading,
    error:
      (countries.data ? null : countries.error) ??
      (industries.data ? null : industries.error),
    refetch: () => {
      if (countries.error) void countries.refetch()
      if (industries.error) void industries.refetch()
    },
  }
}

export type Catalog = ReturnType<typeof useCatalog>
