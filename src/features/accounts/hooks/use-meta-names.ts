import { useGetIndustries } from "@/api/generated/meta/meta"
import type { IndustryOut } from "@/api/generated/model"

const toNames = (industries: IndustryOut[]) =>
  new Map(industries.map((industry) => [industry.id, industry.label]))

/** Industry id → label from GET /meta/industries (static taxonomy, cached for the session). */
export function useIndustryNames() {
  return useGetIndustries({ query: { staleTime: Infinity, select: toNames } })
    .data
}
