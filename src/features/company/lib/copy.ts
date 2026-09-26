/**
 * Wording for the Company and Sources screens that the API does not serve. Enum names the API does serve
 * (categories, stages, source types) come from `useLabels`.
 */
import type {
  AtsRefKind,
  CompanyOrigin,
  SignalFlag,
  SourceType,
} from "@/api/generated/model"

import { hostname } from "./text"

export const atsLabels: Record<AtsRefKind, string> = {
  workday: "Workday",
  greenhouse: "Greenhouse",
  lever: "Lever",
  personio: "Personio",
  ashby: "Ashby",
  smartrecruiters: "SmartRecruiters",
  workable: "Workable",
  recruitee: "Recruitee",
}

/** Collector (adapter) ids as the parser stores them in `source_name`. */
const collectorLabels: Record<string, string> = {
  ...atsLabels,
  adzuna: "Adzuna",
  careers_html: "Careers page",
  google_news: "Google News",
  gdelt: "GDELT",
  newsapi: "NewsAPI",
  serpapi: "Google Search",
  rsshub: "RSS feeds",
  wikidata: "Wikidata",
  gleif: "GLEIF",
  crunchbase: "Crunchbase",
  hibp: "Have I Been Pwned",
}

// These collectors read the company's own site, so the host says more than the collector name.
const siteCollectors = new Set(["website", "playwright", "reports"])

const isAts = (sourceName: string): sourceName is AtsRefKind =>
  sourceName in atsLabels

/** Where a signal came from: "Workday careers", "dhl.com", "Google News", or the raw name for derived signals. */
export function sourceLabel(sourceName: string | null, url: string | null) {
  if (!sourceName) return url ? hostname(url) : ""
  if (isAts(sourceName)) return `${atsLabels[sourceName]} careers`
  if (siteCollectors.has(sourceName) && url) return hostname(url)
  return collectorLabels[sourceName] ?? sourceName
}

/** The Source column of the documents table: the collector name, or the host for the company's own site. */
export function collectorLabel(sourceName: string, url: string) {
  if (siteCollectors.has(sourceName)) return hostname(url)
  return collectorLabels[sourceName] ?? sourceName
}

export const originLabels: Partial<Record<CompanyOrigin, string>> = {
  csv: "Added from CSV",
  manual: "Added by hand",
  discovery: "Added from Discover",
}

/**
 * "What was scanned" rows. Generic on purpose: the report collector also reads quarterly statements, and
 * registry records come from Wikidata, GLEIF or Crunchbase.
 */
export const sourceTypePlural: Record<SourceType, string> = {
  jobs: "Job postings",
  news: "News articles",
  website: "Company website pages",
  report: "Company reports",
  registry: "Company registries",
  incident: "Security incident records",
  derived: "Derived from company facts",
  manual: "Added by hand",
}

/** Sources page tabs. */
export const sourceTypeTabs: Record<SourceType, string> = {
  jobs: "Job postings",
  news: "News",
  website: "Website",
  report: "Reports",
  registry: "Registry",
  incident: "Incidents",
  derived: "Derived",
  manual: "Added by hand",
}

export const sourceTypeTabOrder: SourceType[] = [
  "jobs",
  "news",
  "website",
  "report",
  "registry",
  "incident",
  "manual",
]

/** Document subtitle on the Sources page. */
export const sourceTypeSingular: Record<SourceType, string> = {
  jobs: "Job posting",
  news: "News article",
  website: "Website page",
  report: "Report",
  registry: "Registry record",
  incident: "Incident record",
  derived: "Derived from company facts",
  manual: "Added by hand",
}

/** Type chip on a signal card. */
export const sourceTypeChip: Record<SourceType, string> = {
  website: "Website",
  news: "News",
  jobs: "Job posting",
  report: "Report",
  registry: "Registry",
  incident: "Incident",
  derived: "Derived",
  manual: "Manual",
}

export const signalFlags: Record<SignalFlag, { label: string; tip: string }> = {
  fuzzy_quote: {
    label: "fuzzy quote",
    tip: "The quote matched the source text with small differences (punctuation or whitespace)",
  },
  corroborated: {
    label: "corroborated",
    tip: "The same event is reported by more than one independent source",
  },
  headline_only: {
    label: "headline only",
    tip: "Only the headline was available, so it counts for less",
  },
  undated: {
    label: "undated",
    tip: "The source has no date, so it is treated as older and counts for less",
  },
  derived: {
    label: "derived",
    tip: "Inferred from company facts (country, industry, size), not quoted from a document",
  },
}

export const weightWords = {
  high: "High",
  medium: "Medium",
  low: "Low",
} as const

export const priorityHelp =
  "Combines ICP fit, buying signals and blockers into one 0–100 ranking score for this service"
