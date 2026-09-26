import { CheckCommand } from "@/features/settings/icp/components/check-command"
import { copy } from "@/features/settings/icp/copy"
import type {
  CountryCatalog,
  IndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"
import {
  hasAll,
  regions,
  toggleCode,
  toggleRegion,
} from "@/features/settings/icp/lib/regions"

type ListProps = { value: string[]; onChange: (value: string[]) => void }

const regionValue = (key: string) => `region:${key}`
const regionOf = (value: string) =>
  regions.find((region) => regionValue(region.key) === value)

/** Country multi-select list with a "Regions" group of one-click shortcuts. */
export function CountryCommand({
  value,
  onChange,
  countries,
}: ListProps & { countries: CountryCatalog }) {
  return (
    <CheckCommand
      placeholder={copy.pickers.searchCountries}
      groups={[
        {
          heading: copy.pickers.regions,
          options: regions.map((region) => ({
            value: regionValue(region.key),
            label: region.name,
          })),
        },
        { heading: copy.pickers.countries, options: countries.options(value) },
      ]}
      isChecked={(item) => {
        const region = regionOf(item)
        return region ? hasAll(value, region.codes) : value.includes(item)
      }}
      onToggle={(item) => {
        const region = regionOf(item)
        onChange(
          region ? toggleRegion(value, region.codes) : toggleCode(value, item)
        )
      }}
    />
  )
}

/** Industry multi-select list (GET /meta/industries). */
export function IndustryCommand({
  value,
  onChange,
  industries,
}: ListProps & { industries: IndustryCatalog }) {
  return (
    <CheckCommand
      placeholder={copy.pickers.searchIndustries}
      groups={[{ options: industries.options(value) }]}
      isChecked={(item) => value.includes(item)}
      onToggle={(item) => onChange(toggleCode(value, item))}
    />
  )
}
