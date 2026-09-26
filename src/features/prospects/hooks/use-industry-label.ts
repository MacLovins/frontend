import { useCallback, useMemo } from "react"

import { useGetIndustries } from "@/api/generated/meta/meta"
import { humanize } from "@/lib/labels"

/** Industry id → label from GET /meta/industries (static reference data). */
export function useIndustryLabel() {
  const { data } = useGetIndustries({
    query: { staleTime: Infinity, gcTime: Infinity },
  })
  const labels = useMemo(
    () =>
      new Map((data ?? []).map((industry) => [industry.id, industry.label])),
    [data]
  )
  return useCallback((id: string) => labels.get(id) ?? humanize(id), [labels])
}
