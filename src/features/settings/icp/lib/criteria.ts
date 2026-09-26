import type { Criterion } from "@/api/generated/model"
import { copy, joinOr } from "@/features/settings/icp/copy"
import type {
  CountryCatalog,
  IndustryCatalog,
} from "@/features/settings/icp/hooks/use-catalogs"
import { marketNames } from "@/features/settings/icp/lib/regions"

const titles = copy.niceToHave.titles

function numberAt(values: Criterion["values"], index: number) {
  const value = values[index]
  if (value === undefined) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

/** The row title, e.g. "Focus markets: DACH, Nordics" or "5,000 or more employees". */
export function criterionTitle(
  criterion: Criterion,
  countries: CountryCatalog
) {
  const strings = criterion.values.map(String)
  switch (criterion.kind) {
    case "industry_in":
      return titles.industry
    case "country_in":
      return titles.markets(marketNames(strings, countries.name).join(", "))
    case "employees_between":
      return titles.employees(
        numberAt(criterion.values, 0),
        numberAt(criterion.values, 1)
      )
    case "revenue_at_least":
      return titles.revenue(numberAt(criterion.values, 0))
    case "tag_in":
      return titles.tags(joinOr(strings))
  }
}

/** Value chips under the title: only industries list their values separately. */
export function criterionChips(
  criterion: Criterion,
  industries: IndustryCatalog
) {
  return criterion.kind === "industry_in"
    ? criterion.values.map((id) => industries.label(String(id)))
    : []
}
