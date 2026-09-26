import { useMemo } from "react"

import { useGetIcp } from "@/api/generated/config/config"
import type { ICPProfileOut } from "@/api/generated/model"
import { ApiError } from "@/api/mutator"

export type SearchDefaults = {
  countries: string[]
  industries: string[]
  employeesMin: number | null
}

const none: SearchDefaults = {
  countries: [],
  industries: [],
  employeesMin: null,
}

// Same fallback as the backend query builder (discovery/service.py build_discovery_query): no must-have
// industries → the values of the nice-to-have `industry_in` criteria.
function toDefaults(icp: ICPProfileOut | undefined): SearchDefaults {
  if (!icp) return none
  const industries = icp.industries_any.length
    ? icp.industries_any
    : (icp.nice_to_have?.criteria ?? [])
        .filter((criterion) => criterion.kind === "industry_in")
        .flatMap((criterion) => criterion.values.map(String))
  return {
    countries: icp.countries,
    industries: [...new Set(industries)],
    employeesMin: icp.employees_min,
  }
}

/** The service ICP as the search form's starting point. A 404 means the service has no ICP yet, not an error. */
export function useIcpDefaults(serviceId: string) {
  const icp = useGetIcp(serviceId)
  const missing = icp.error instanceof ApiError && icp.error.status === 404
  const defaults = useMemo(() => toDefaults(icp.data), [icp.data])

  return {
    defaults,
    missing,
    isLoading: icp.isLoading,
    // A failed background refetch keeps the loaded ICP, so the form (and the user's edits) stay.
    error: missing || icp.data ? null : icp.error,
    refetch: icp.refetch,
  }
}
