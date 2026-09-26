import { differenceInMinutes } from "date-fns"

import type { CompanyOut, LeadListItem } from "@/api/generated/model"
import { formatCompact } from "@/lib/format"

type IndustryLabel = (id: string) => string

/** "dhl.com · DE · Logistics · 590k" under the company name in a row. */
export function rowMeta(company: CompanyOut, industryLabel: IndustryLabel) {
  const [industry] = company.industry_ids
  return [
    company.domain,
    company.country_code,
    industry ? industryLabel(industry) : null,
    company.employees != null ? formatCompact(company.employees) : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

/** "DE · Logistics · 590k employees" on the matrix Selected card. */
export function selectedMeta(
  company: CompanyOut,
  industryLabel: IndustryLabel
) {
  const [industry] = company.industry_ids
  return [
    company.country_code,
    industry ? industryLabel(industry) : null,
    company.employees != null
      ? `${formatCompact(company.employees)} employees`
      : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

/** Newest `analyzed_at` of the shown rows, or null when none was analyzed. */
export function latestAnalyzedAt(items: LeadListItem[]) {
  let latest: number | null = null
  for (const item of items) {
    const time = item.analyzed_at ? Date.parse(item.analyzed_at) : NaN
    if (!Number.isNaN(time) && (latest === null || time > latest)) latest = time
  }
  return latest
}

/** "12 min", "3 h", "2 d": the list's "updated … ago". */
export function compactSince(time: number, now = new Date()) {
  const minutes = Math.max(1, differenceInMinutes(now, time))
  if (minutes < 60) return `${minutes} min`
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} h`
  return `${Math.floor(minutes / (24 * 60))} d`
}

const LEGAL_SUFFIXES = new Set([
  "a/s",
  "ag",
  "sa",
  "s.a.",
  "n.v.",
  "nv",
  "gmbh",
  "group",
  "ltd",
  "plc",
  "inc",
  "se",
  "s.p.a.",
  "oy",
  "ab",
  "asa",
  "b.v.",
])

/** Matrix dot label: the first word of the name once legal suffixes are gone ("DHL Group" → "DHL"). */
export function shortName(name: string) {
  const words = name
    .split(/\s+/)
    .filter(
      (word) =>
        word && !LEGAL_SUFFIXES.has(word.toLowerCase().replace(/,$/, ""))
    )
  return words[0] ?? name
}
