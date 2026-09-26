/** Discovery search (backend core/modules/discovery/service.py) over the mock's candidate registry. Pure. */
import type {
  CompanyOut,
  DiscoveredCompany,
  DiscoveryQuery,
  DiscoverySearchIn,
  FitCriterion,
  ICPProfileOut,
} from "@/api/generated/model"

import type { DiscoveryCandidate } from "../types"
import { matchCountry, matchIndustry, normalizeDomain } from "./csv"
import { computeFit, EMPTY_ICP, type FitResult } from "./scoring"

const CRITERION_NAMES: Record<string, string> = {
  countries: "country",
  country_in: "country",
  industries_any: "industry",
  industry_in: "industry",
  employees_min: "size",
  employees_max: "size",
  employees_between: "size",
  revenue_min_eur: "revenue",
  revenue_at_least: "revenue",
  tag_in: "tags",
}

export class QueryIncomplete extends Error {
  readonly countries: string[]
  readonly industries: string[]

  constructor(countries: string[], industries: string[]) {
    super("Discovery needs at least one country and one industry")
    this.countries = countries
    this.industries = industries
  }
}

const uniq = (values: (string | null)[]) =>
  values.filter((v, i, all): v is string => v !== null && all.indexOf(v) === i)

export function buildQuery(
  icp: ICPProfileOut | undefined,
  input: DiscoverySearchIn
): DiscoveryQuery {
  const base = icp ?? { ...EMPTY_ICP, nice_to_have: null }
  let countries: string[] = [...base.countries]
  if (input.countries?.length) countries = [...input.countries]
  else if (input.country) countries = [input.country]
  let industries: string[] = [...base.industries_any]
  if (input.industries?.length) industries = [...input.industries]
  else if (input.industry) industries = [input.industry]
  else if (!industries.length)
    industries = (base.nice_to_have?.criteria ?? [])
      .filter((c) => c.kind === "industry_in")
      .flatMap((c) => c.values.map(String))
  const normCountries = uniq(countries.map(matchCountry))
  const normIndustries = uniq(industries.map(matchIndustry))
  if (!normCountries.length || !normIndustries.length)
    throw new QueryIncomplete(normCountries, normIndustries)
  return {
    countries: normCountries,
    industries: normIndustries,
    employees_min: input.employees_min ?? base.employees_min ?? null,
    employees_max: input.employees_max ?? base.employees_max ?? null,
    limit: input.limit ?? 20,
  }
}

function reason(fit: FitResult): string {
  const matched: string[] = []
  const failed: string[] = []
  for (const d of fit.details) {
    const name = CRITERION_NAMES[d.criterion] ?? d.criterion
    if (
      (d.status === "pass" || d.status === "match") &&
      !matched.includes(name)
    )
      matched.push(name)
    else if (
      (d.status === "fail" || d.status === "no_match") &&
      !failed.includes(name)
    )
      failed.push(name)
  }
  const parts: string[] = []
  if (matched.length) parts.push(`Matches ICP on ${matched.join(", ")}`)
  if (failed.length)
    parts.push(
      `${fit.must_have_passed ? "misses" : "fails"} ${failed.join(", ")}`
    )
  if (fit.data_gaps.length) parts.push(`unknown ${fit.data_gaps.join(", ")}`)
  return parts.join("; ") || "Matches the service ICP"
}

/** Registry query (countries × industries × size), fit against the service ICP (floor 0), ranking. */
export function search(
  pool: DiscoveryCandidate[],
  icp: ICPProfileOut | undefined,
  query: DiscoveryQuery,
  companies: CompanyOut[]
): DiscoveredCompany[] {
  const tracked = new Set(
    companies.filter((c) => c.is_tracked).map((c) => c.domain)
  )
  const found = pool.filter((c) => {
    if (!c.country_code || !query.countries.includes(c.country_code))
      return false
    if (!c.industry_ids.some((i) => query.industries.includes(i))) return false
    if (c.employees !== null) {
      if (query.employees_min !== null && c.employees < query.employees_min)
        return false
      if (query.employees_max !== null && c.employees > query.employees_max)
        return false
    }
    return true
  })
  const items = new Map<string, DiscoveredCompany>()
  for (const c of found) {
    const domain = normalizeDomain(c.domain)
    if (!domain || !c.name.trim() || items.has(domain)) continue
    const profile = {
      country_code: c.country_code,
      industry_ids: c.industry_ids,
      employees: c.employees,
      revenue_eur: c.revenue_eur,
      tags: [] as string[],
    } as CompanyOut
    const fit = computeFit(profile, icp ?? EMPTY_ICP, 0)
    items.set(domain, {
      name: c.name,
      domain,
      country_code: c.country_code,
      industry_ids: [...c.industry_ids],
      employees: c.employees,
      revenue_eur: c.revenue_eur,
      wikidata_qid: c.wikidata_qid,
      lei: c.lei,
      crunchbase_id: c.crunchbase_id,
      fit_score: Math.round(fit.fit * 10) / 10,
      must_have_passed: fit.must_have_passed,
      fit_details: fit.details as FitCriterion[],
      data_gaps: fit.data_gaps,
      already_tracked: tracked.has(domain),
      reason: reason(fit),
    })
  }
  return [...items.values()]
    .sort(
      (a, b) =>
        b.fit_score - a.fit_score ||
        (b.employees ?? 0) - (a.employees ?? 0) ||
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )
    .slice(0, query.limit)
}
