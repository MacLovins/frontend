import { useMemo } from "react"

import { useGetCountries } from "@/api/generated/meta/meta"
import type { CountryOut } from "@/api/generated/model"
import { prospectsCopy } from "@/features/prospects/copy"
import {
  MultiSelectFilter,
  type FilterPreset,
} from "@/features/prospects/components/list/multi-select-filter"

const regions: { id: string; label: string; codes: string[] }[] = [
  { id: "dach", label: "DACH", codes: ["DE", "AT", "CH"] },
  { id: "nordics", label: "Nordics", codes: ["DK", "FI", "IS", "NO", "SE"] },
  { id: "benelux", label: "Benelux", codes: ["BE", "NL", "LU"] },
]

function euCodes(countries: CountryOut[]) {
  return countries
    .filter((country) => country.is_eu)
    .map((country) => country.code)
}

function summary(selected: string[], countries: CountryOut[]) {
  if (!selected.length) return "All"
  const eu = euCodes(countries)
  if (
    eu.length &&
    eu.length === selected.length &&
    eu.every((code) => selected.includes(code))
  )
    return "EU"
  if (selected.length === 1)
    return (
      countries.find((country) => country.code === selected[0])?.name ??
      selected[0]
    )
  if (selected.length <= 3) return selected.join(", ")
  return `${selected.length} countries`
}

/** "Market: …" country filter with EU and regional presets. */
export function MarketFilter({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (codes: string[]) => void
}) {
  const countries = useGetCountries({
    query: { staleTime: Infinity, gcTime: Infinity },
  })

  const { options, presets } = useMemo(() => {
    const list = countries.data ?? []
    const known = new Set(list.map((country) => country.code))
    const eu = euCodes(list)
    const presetList: FilterPreset[] = [
      ...(eu.length
        ? [{ id: "eu", label: "EU member states", values: eu }]
        : []),
      ...regions
        .map((region) => ({
          id: region.id,
          label: region.label,
          values: region.codes.filter((code) => known.has(code)),
        }))
        .filter((region) => region.values.length),
    ]
    return {
      options: list.map((country) => ({
        value: country.code,
        label: country.name,
        hint: country.code,
      })),
      presets: presetList,
    }
  }, [countries.data])

  return (
    <MultiSelectFilter
      label={`${prospectsCopy.market}: ${summary(selected, countries.data ?? [])}`}
      searchPlaceholder="Search countries"
      heading="Countries"
      options={options}
      presets={presets}
      selected={selected}
      onChange={onChange}
      isLoading={countries.isPending}
    />
  )
}
