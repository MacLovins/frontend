import { useMemo } from "react"

import { useGetIndustries } from "@/api/generated/meta/meta"
import { prospectsCopy } from "@/features/prospects/copy"
import { useIndustryLabel } from "@/features/prospects/hooks/use-industry-label"
import { MultiSelectFilter } from "@/features/prospects/components/list/multi-select-filter"

/** "Industry ▾" filter over GET /meta/industries. */
export function IndustryFilter({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const industries = useGetIndustries({
    query: { staleTime: Infinity, gcTime: Infinity },
  })
  const industryLabel = useIndustryLabel()
  const options = useMemo(
    () =>
      (industries.data ?? []).map((industry) => ({
        value: industry.id,
        label: industry.label,
      })),
    [industries.data]
  )
  const label =
    selected.length === 0
      ? prospectsCopy.industry
      : selected.length === 1
        ? `${prospectsCopy.industry}: ${industryLabel(selected[0])}`
        : `${prospectsCopy.industry}: ${selected.length}`

  return (
    <MultiSelectFilter
      label={label}
      searchPlaceholder="Search industries"
      heading="Industries"
      options={options}
      selected={selected}
      onChange={onChange}
      isLoading={industries.isPending}
    />
  )
}
