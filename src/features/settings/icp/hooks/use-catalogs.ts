import { useMemo } from "react"

import { useGetCountries, useGetIndustries } from "@/api/generated/meta/meta"
import { regionCodes } from "@/features/settings/icp/lib/regions"

const catalogQuery = { query: { staleTime: Infinity, gcTime: Infinity } }

export type Option = { value: string; label: string }

function regionDisplayNames() {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" })
  } catch {
    return null
  }
}

const intlNames = regionDisplayNames()

function intlName(code: string) {
  try {
    return intlNames?.of(code)
  } catch {
    return undefined
  }
}

/**
 * Country names from GET /meta/countries. The catalog has 20 countries while presets use more ISO codes
 * (backend parser/data/countries.yaml), so unknown codes fall back to Intl names, then to the code itself.
 */
export function useCountryCatalog() {
  const { data } = useGetCountries(catalogQuery)
  return useMemo(() => {
    const names = new Map(
      (data ?? []).map((country) => [country.code, country.name])
    )
    const fullName = (code: string) => names.get(code) ?? intlName(code) ?? code
    /** Short form for chips and sentences: GB reads "UK". */
    const name = (code: string) => (code === "GB" ? "UK" : fullName(code))
    /** Catalog ∪ region codes ∪ `extra` (already selected codes), sorted by name. */
    const options = (extra: readonly string[]): Option[] =>
      [...new Set([...names.keys(), ...regionCodes, ...extra])]
        .map((code) => ({ value: code, label: fullName(code) }))
        .sort((a, b) => a.label.localeCompare(b.label))
    return { name, options }
  }, [data])
}

/** Industry labels from GET /meta/industries (taxonomy order); unknown ids render as the id. */
export function useIndustryCatalog() {
  const { data } = useGetIndustries(catalogQuery)
  return useMemo(() => {
    const labels = new Map(
      (data ?? []).map((industry) => [industry.id, industry.label])
    )
    const label = (id: string) => labels.get(id) ?? id
    const options = (extra: readonly string[]): Option[] => {
      const known = (data ?? []).map((industry) => ({
        value: industry.id,
        label: industry.label,
      }))
      const unknown = extra
        .filter((id) => !labels.has(id))
        .map((id) => ({ value: id, label: id }))
      return [...known, ...unknown]
    }
    return { label, options }
  }, [data])
}

export type CountryCatalog = ReturnType<typeof useCountryCatalog>
export type IndustryCatalog = ReturnType<typeof useIndustryCatalog>
