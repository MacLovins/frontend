import type { ICPProfileOut, ServiceOut } from "@/api/generated/model"
import { formatNumber } from "@/lib/format"

import { copy } from "@/features/settings/services/copy"

const EU_27 = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]
const MAX_LISTED_MARKETS = 4

const marketCode = (code: string) => (code === "GB" ? "UK" : code)

function marketsSummary(countries: readonly string[]) {
  if (countries.length === 0) return copy.card.anyMarket
  const codes = new Set(countries.map((code) => code.toUpperCase()))
  if (EU_27.every((code) => codes.has(code))) {
    const rest = [...codes].filter((code) => !EU_27.includes(code)).map(marketCode)
    return rest.length ? `EU + ${rest.join("/")}` : "EU"
  }
  if (codes.size > MAX_LISTED_MARKETS) return `${codes.size} markets`
  return [...codes].map(marketCode).join("/")
}

function sizeSummary(min: number | null, max: number | null) {
  if (min !== null && max !== null) return `${formatNumber(min)}–${formatNumber(max)}`
  if (min !== null) return `${formatNumber(min)}+`
  if (max !== null) return `≤ ${formatNumber(max)}`
  return null
}

/** "EU + UK/CH/NO · 1,000+": markets, then the employee range when one is set. */
export function icpSummary(icp: ICPProfileOut) {
  const size = sizeSummary(icp.employees_min, icp.employees_max)
  const markets = marketsSummary(icp.countries)
  return size ? `${markets} · ${size}` : markets
}

/** The backend does not order services; creation order keeps cards still when one is (de)activated. */
export function sortServices(services: readonly ServiceOut[]) {
  return [...services].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.name.localeCompare(b.name))
}

/**
 * The backend has no slug rule and answers a duplicate slug with a 500 (config/router.py:122-133),
 * so the client derives a snake_case slug and makes it unique against the loaded list.
 */
export function uniqueSlug(name: string, services: readonly ServiceOut[]) {
  const taken = new Set(services.map((service) => service.slug))
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/^(\d)/, "s_$1")
      .slice(0, 120) || "service"
  let slug = base
  for (let suffix = 2; taken.has(slug); suffix += 1) slug = `${base}_${suffix}`
  return slug
}
