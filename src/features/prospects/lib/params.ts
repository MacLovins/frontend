import type { ListLeadsParams, Tier } from "@/api/generated/model"
import { tierOrder } from "@/lib/labels"

export const PAGE_SIZE = 50

const sortOptions = [
  "priority:desc",
  "priority:asc",
  "name:asc",
  "name:desc",
  "signals_count:desc",
  "signals_count:asc",
] as const
export type SortOption = (typeof sortOptions)[number]
export type SortField = "priority" | "name" | "signals_count"
export const DEFAULT_SORT: SortOption = "priority:desc"

export const sortFieldLabels: Record<SortField, string> = {
  priority: "priority",
  name: "name",
  signals_count: "signal count",
}

export type ProspectFilters = {
  tier: Tier | null
  q: string
  countries: string[]
  industries: string[]
  onlyNew: boolean
  minPriority: number
  sort: SortOption
  page: number
}

const csv = (value: string | null) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : []

export function readFilters(params: URLSearchParams): ProspectFilters {
  const tier = params.get("tier")
  const sort = params.get("sort")
  const min = Number(params.get("min"))
  const page = Number(params.get("page"))
  return {
    tier: tierOrder.find((item) => item === tier) ?? null,
    q: params.get("q") ?? "",
    countries: csv(params.get("country")),
    industries: csv(params.get("industry")),
    onlyNew: params.get("new") === "1",
    minPriority: Number.isFinite(min)
      ? Math.min(100, Math.max(0, Math.round(min / 5) * 5))
      : 0,
    sort: sortOptions.find((item) => item === sort) ?? DEFAULT_SORT,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

/** Filters that narrow the list besides the tier chips (the tier has its own control). */
export function hasRefinements(filters: ProspectFilters) {
  return Boolean(
    filters.q ||
    filters.countries.length ||
    filters.industries.length ||
    filters.onlyNew ||
    filters.minPriority
  )
}

export function splitSort(sort: SortOption) {
  const [field, direction] = sort.split(":") as [SortField, "asc" | "desc"]
  return { field, direction }
}

/** Filters and sort shared by GET /leads and the CSV export (backend leads/router.py lead_filters). */
export function leadFilterParams(
  serviceId: string,
  filters: ProspectFilters
): Omit<ListLeadsParams, "page" | "page_size"> {
  const q = filters.q.trim()
  return {
    service_id: serviceId,
    ...(filters.tier ? { tier: [filters.tier] } : {}),
    ...(filters.countries.length ? { country: filters.countries } : {}),
    ...(filters.industries.length ? { industry: filters.industries } : {}),
    ...(filters.onlyNew ? { has_new: true } : {}),
    // Disqualified leads all score priority 0, so a floor would hide every one of them.
    ...(filters.minPriority && filters.tier !== "disqualified"
      ? { min_priority: filters.minPriority }
      : {}),
    ...(q ? { q } : {}),
    sort: filters.sort,
  }
}
