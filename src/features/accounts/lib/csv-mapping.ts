import type { ImportCompaniesCsvMapping } from "@/api/generated/model"

/**
 * Preview only: mirrors backend importer.py (`IMPORT_FIELDS`, `DEFAULT_MAPPING`, `CRUNCHBASE_MAPPING`,
 * `resolve_columns`). The server stays authoritative and answers `missing_columns` if this drifts.
 */
export type ImportField =
  | "name"
  | "domain"
  | "country"
  | "industry"
  | "employees"
  | "revenue"
  | "hq_city"
  | "homepage_url"
  | "linkedin_url"
  | "careers_url"
  | "newsroom_url"
  | "crunchbase_url"
  | "notes"
  | "tags"

type AliasTable = Partial<Record<ImportField, string[]>>

const defaultAliases: AliasTable = {
  name: [
    "name",
    "company",
    "company name",
    "organization name",
    "account name",
  ],
  domain: ["domain", "website", "url", "homepage", "company domain"],
  country: ["country", "country code", "country_code", "hq country"],
  industry: ["industry", "industries", "industry id", "industry_ids", "sector"],
  employees: [
    "employees",
    "employee count",
    "number of employees",
    "headcount",
    "size",
  ],
  revenue: ["revenue", "revenue eur", "revenue_eur", "annual revenue"],
  hq_city: ["hq city", "hq_city", "city", "headquarters"],
  homepage_url: ["homepage url", "homepage_url"],
  linkedin_url: ["linkedin", "linkedin url", "linkedin_url"],
  careers_url: ["careers", "careers url", "careers_url", "jobs url"],
  newsroom_url: ["newsroom", "newsroom url", "newsroom_url", "press url"],
  crunchbase_url: ["crunchbase url", "crunchbase_url"],
  notes: ["notes", "note", "description"],
  tags: ["tags", "tag", "labels"],
}

const crunchbaseAliases: AliasTable = {
  name: ["organization name"],
  domain: ["website"],
  country: ["headquarters location"],
  industry: ["industries", "industry groups"],
  employees: ["number of employees"],
  revenue: ["estimated revenue range"],
  hq_city: ["headquarters location"],
  linkedin_url: ["linkedin"],
  crunchbase_url: ["organization name url"],
  notes: ["description"],
}

/** What each field becomes, shown on the right of "Header → Field". */
export const fieldDescriptions: Record<ImportField, string> = {
  name: "Name",
  domain: "Domain (cleaned: no www, no path)",
  country: "Country (ISO code)",
  industry: "Industry (closest match in our list)",
  employees: "Employees (lower bound of the range)",
  revenue: "Revenue (lower bound of the range)",
  hq_city: "HQ city",
  homepage_url: "Homepage URL",
  linkedin_url: "LinkedIn URL",
  careers_url: "Careers URL",
  newsroom_url: "Newsroom URL",
  crunchbase_url: "Crunchbase URL",
  notes: "Notes",
  tags: "Tags",
}

const requiredFields = ["name", "domain"] as const satisfies ImportField[]

/** Fields offered for "Custom columns", in this order. */
export const customFields: { field: ImportField; label: string }[] = [
  { field: "name", label: "Name*" },
  { field: "domain", label: "Domain*" },
  { field: "country", label: "Country" },
  { field: "industry", label: "Industry" },
  { field: "employees", label: "Employees" },
  { field: "revenue", label: "Revenue" },
  { field: "hq_city", label: "HQ city" },
  { field: "linkedin_url", label: "LinkedIn URL" },
  { field: "careers_url", label: "Careers URL" },
  { field: "newsroom_url", label: "Newsroom URL" },
  { field: "notes", label: "Notes" },
  { field: "tags", label: "Tags" },
]

export type ColumnMap = Partial<Record<ImportField, string>>

/** Header matching is case- and punctuation-insensitive ("Company Name" == "company_name"). */
function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

/** Field → the file header a built-in mapping will read it from. */
export function matchColumns(
  headers: string[],
  mapping: Exclude<ImportCompaniesCsvMapping, "custom">
): ColumnMap {
  const byNormalized = new Map(
    headers.filter(Boolean).map((header) => [normalizeHeader(header), header])
  )
  const table = mapping === "crunchbase" ? crunchbaseAliases : defaultAliases
  const matched: ColumnMap = {}
  for (const [field, aliases] of Object.entries(table) as [
    ImportField,
    string[],
  ][]) {
    const header = aliases
      .map((alias) => byNormalized.get(normalizeHeader(alias)))
      .find(Boolean)
    if (header) matched[field] = header
  }
  return matched
}

/** Starting point for "Custom columns": whatever the LeadRadar template would match, limited to the offered fields. */
export function customDefaults(headers: string[]): ColumnMap {
  const matched = matchColumns(headers, "default")
  return Object.fromEntries(
    customFields.flatMap(({ field }) =>
      matched[field] ? [[field, matched[field]]] : []
    )
  )
}

export function missingRequired(columns: ColumnMap) {
  return requiredFields.filter((field) => !columns[field])
}
