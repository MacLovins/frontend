import type { CriterionKind } from "@/api/generated/model"
import { formatNumber } from "@/lib/format"

export const copy = {
  title: "Ideal customer profile",
  subtitle: (service: string, version: number | null) =>
    version === null
      ? `${service} · not set yet`
      : `${service} · version ${version}`,
  findSimilar: "Find companies like this",
  save: "Save and re-score",
  saving: "Saving…",
  saved: (version: number) =>
    `ICP saved as version ${version}. Ranking re-scored with no AI calls.`,
  loadError: "Could not load the ICP.",
  notFound: { title: "Service not found", action: "Back to services" },
  discard: {
    title: "Discard unsaved ICP changes?",
    body: "Your edits to the ICP have not been saved.",
    keep: "Keep editing",
    discard: "Discard changes",
  },
  mustHave: {
    title: "Must have",
    description:
      "A company that fails any of these gets ICP fit 0 and drops out of the ranking. Unknown values pass and are listed as data gaps.",
    markets: "Markets",
    addCountry: "+ country",
    addCountryLabel: "Add countries",
    removeMarket: (name: string) => `Remove ${name}`,
    addRegion: (name: string) => `Add ${name}`,
    helper: (count: number) =>
      `${count === 0 ? "Any country." : `${count} ${count === 1 ? "country" : "countries"} selected.`} Region buttons add their countries in one click.`,
    employeesMin: "Employees, at least",
    employeesMax: "Employees, at most",
    revenueMin: "Revenue, at least (€)",
    noLimit: "No limit",
    any: "Any",
    industries: "Industries",
    industriesHint: " (empty means any industry)",
    anyIndustry: "Any industry",
    chooseIndustries: "Choose industries",
    maxBelowMin: "At most must be larger than at least.",
  },
  niceToHave: {
    title: "Nice to have",
    description:
      "Each match adds to ICP fit in proportion to its weight. More criteria give a finer ranking.",
    weight: "Weight",
    add: "+ Add criterion: country, industry, size, revenue or tag",
    remove: "Remove criterion",
    edit: (title: string) => `Edit criterion: ${title}`,
    pickValue: "Pick at least one value.",
    atLeast: "At least",
    atMost: "At most (optional)",
    revenue: "Revenue, at least (€)",
    tag: "tag",
    kinds: {
      country_in: "Country",
      industry_in: "Industry",
      employees_between: "Company size",
      revenue_at_least: "Revenue",
      tag_in: "Tag",
    } satisfies Record<CriterionKind, string>,
    titles: {
      industry: "Priority industry",
      markets: (names: string) =>
        names ? `Focus markets: ${names}` : "Focus markets",
      employees: (min: number | undefined, max: number | undefined) => {
        if (min === undefined) return "Company size"
        if (max === undefined) return `${formatNumber(min)} or more employees`
        return `${formatNumber(min)} to ${formatNumber(max)} employees`
      },
      revenue: (min: number | undefined) =>
        min === undefined
          ? "Revenue"
          : `Revenue of €${formatNumber(min)} or more`,
      tags: (tags: string) => (tags ? `Tagged ${tags}` : "Tag"),
    },
  },
  pickers: {
    searchCountries: "Search countries…",
    searchIndustries: "Search industries…",
    regions: "Regions",
    countries: "Countries",
    noMatch: "No matches.",
  },
  preview: {
    overline: (count: number) =>
      `Current ICP on your ${formatNumber(count)} scored accounts`,
    pass: "pass must-haves",
    fail: "fail",
    distribution: "ICP fit distribution",
    buckets: ["0–24", "25–49", "50–74", "75–99", "100"],
    hint: (distinct: number) =>
      `ICP fit takes ${distinct} distinct ${distinct === 1 ? "value" : "values"} with these weights. More criteria spread the matrix and make the ranking finer.`,
    noAccounts:
      "No accounts are scored for this service yet. Run an analysis to see how they split.",
    unavailable: "Preview unavailable.",
    failTitle: "Would fail the must-haves",
    more: (count: number) => `+ ${formatNumber(count)} more`,
  },
}

/** "a or b", "a, b or c". */
export function joinOr(items: string[]) {
  if (items.length < 2) return items.join("")
  return `${items.slice(0, -1).join(", ")} or ${items[items.length - 1]}`
}
