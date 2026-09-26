import { useId } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Chip } from "@/features/settings/icp/components/chip"
import { CountryCommand } from "@/features/settings/icp/components/pickers"
import { copy } from "@/features/settings/icp/copy"
import type { CountryCatalog } from "@/features/settings/icp/hooks/use-catalogs"
import {
  eu27,
  hasAll,
  regionChips,
  toggleRegion,
} from "@/features/settings/icp/lib/regions"

const strings = copy.mustHave

/** Must-have markets: selected chips (a complete EU as one "EU 27 ✓"), region shortcuts, "+ country" picker. */
export function MarketsField({
  value,
  onChange,
  countries,
}: {
  value: string[]
  onChange: (value: string[]) => void
  countries: CountryCatalog
}) {
  const titleId = useId()
  const fullEu = hasAll(value, eu27.codes)
  const others = fullEu
    ? value.filter((code) => !eu27.codes.includes(code))
    : value

  return (
    <div className="flex flex-col gap-2">
      <div id={titleId} className="text-[13px] font-semibold">
        {strings.markets}
      </div>
      <div
        role="group"
        aria-labelledby={titleId}
        className="flex flex-wrap gap-1.5"
      >
        {fullEu ? (
          <Chip
            variant="selected"
            aria-label={strings.removeMarket(eu27.name)}
            onClick={() => onChange(others)}
          >
            {eu27.name} ✓
          </Chip>
        ) : null}
        {others.map((code) => (
          <Chip
            key={code}
            variant="selected"
            aria-label={strings.removeMarket(countries.name(code))}
            onClick={() => onChange(value.filter((item) => item !== code))}
          >
            {countries.name(code)} ✓
          </Chip>
        ))}
        {regionChips
          .filter((region) => !(fullEu && region === eu27))
          .map((region) => (
            <Chip
              key={region.key}
              variant="outline"
              aria-label={strings.addRegion(region.name)}
              disabled={hasAll(value, region.codes)}
              onClick={() => onChange(toggleRegion(value, region.codes))}
            >
              + {region.name}
            </Chip>
          ))}
        <Popover>
          <PopoverTrigger
            render={
              <Chip variant="dashed" aria-label={strings.addCountryLabel} />
            }
          >
            {strings.addCountry}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 gap-0 p-0">
            <CountryCommand
              value={value}
              onChange={onChange}
              countries={countries}
            />
          </PopoverContent>
        </Popover>
      </div>
      <p className="m-0 text-xs text-muted-foreground">
        {strings.helper(value.length)}
      </p>
    </div>
  )
}
