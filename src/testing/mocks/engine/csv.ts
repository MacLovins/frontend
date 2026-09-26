/**
 * CSV → company rows (backend core/modules/accounts/importer.py): header detection for the default,
 * Crunchbase and custom mappings, value normalization and in-file de-duplication. Pure.
 */
import {
  COUNTRIES,
  COUNTRY_ALIASES,
  INDUSTRIES,
  INDUSTRY_ALIASES,
} from "../data/meta"

export const IMPORT_FIELDS = [
  "name",
  "domain",
  "country",
  "industry",
  "employees",
  "revenue",
  "hq_city",
  "homepage_url",
  "linkedin_url",
  "careers_url",
  "newsroom_url",
  "crunchbase_url",
  "notes",
  "tags",
] as const

const DEFAULT_MAPPING: Record<string, string[]> = {
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

const CRUNCHBASE_MAPPING: Record<string, string[]> = {
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

export class ImportFormatError extends Error {
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(
    code: string,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message)
    this.code = code
    this.details = details
  }
}

export interface ParsedRow {
  row: number
  name: string
  domain: string
  fields: Record<string, string | number | string[]>
}

export interface ParseResult {
  rows: ParsedRow[]
  total_rows: number
  skipped: number
  errors: string[]
  warnings: string[]
  duplicates: {
    row: number
    first_row: number
    domain: string
    action: "merge" | "skip"
  }[]
}

/** Lowercase, no scheme, no `www.`, no port or path (backend utils/domain.py). */
export function normalizeDomain(value: string): string {
  let d = value.trim().toLowerCase()
  d = d.replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
  d = d.split(/[/?#]/)[0]
  d = d.replace(/^[^@]*@/, "")
  d = d.split(":")[0]
  d = d.replace(/^www\./, "").replace(/\.$/, "")
  return d
}

const normHeader = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
const normLabel = (v: string) =>
  v
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/_/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

/** RFC 4180 parser (quotes, escaped quotes, newlines in quotes). */
export function parseCsvText(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else quoted = false
      } else field += ch
      continue
    }
    if (ch === '"') quoted = true
    else if (ch === delimiter) {
      row.push(field)
      field = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ""
    } else field += ch
  }
  if (quoted)
    throw new ImportFormatError(
      "invalid_csv",
      "Malformed CSV: unexpected end of data"
    )
  if (field !== "" || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

export function matchCountry(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null
  const candidates = raw.includes(",")
    ? [raw, raw.split(",").at(-1) ?? ""]
    : [raw]
  for (const candidate of candidates) {
    const key = candidate.trim().toUpperCase()
    const byCode = COUNTRIES.find((c) => c.code === key)
    if (byCode) return byCode.code
    const byName = COUNTRIES.find((c) => c.name.toUpperCase() === key)
    if (byName) return byName.code
    if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key]
    if (/^[A-Z]{2}$/.test(key)) return key
  }
  return null
}

export function matchIndustry(value: string): string | null {
  const raw = value.trim()
  if (!raw) return null
  if (INDUSTRIES.some((i) => i.id === raw.toLowerCase()))
    return raw.toLowerCase()
  const key = normLabel(raw)
  if (!key) return null
  for (const i of INDUSTRIES)
    if (normLabel(i.label) === key || normLabel(i.id) === key) return i.id
  if (INDUSTRY_ALIASES[key]) return INDUSTRY_ALIASES[key]
  // loose match instead of rapidfuzz: same letters ignoring spaces, or one label contains the other
  const compact = key.replace(/ /g, "")
  for (const i of INDUSTRIES) {
    const label = normLabel(i.label).replace(/ /g, "")
    if (
      label === compact ||
      (compact.length >= 5 &&
        (label.startsWith(compact) || compact.startsWith(label)))
    )
      return i.id
  }
  return null
}

const MULTIPLIERS: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  m: 1e6,
  mn: 1e6,
  mm: 1e6,
  million: 1e6,
  b: 1e9,
  bn: 1e9,
  billion: 1e9,
  t: 1e12,
  trillion: 1e12,
}

function toNumber(digits: string): number | null {
  let s = digits.trim().replace(/[\s']/g, "")
  if (!s) return null
  if (s.includes(",") && s.includes("."))
    s =
      s.lastIndexOf(".") > s.lastIndexOf(",")
        ? s.replace(/,/g, "")
        : s.replace(/\./g, "").replace(",", ".")
  else if (s.includes(","))
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".")
  else if ((s.match(/\./g) ?? []).length > 1) s = s.replace(/\./g, "")
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** First (lower-bound) amount: "590,000", "$1B to $10B", "€81.8bn", "10001+". */
export function parseAmount(value: string): number | null {
  const match =
    /(\d[\d,.\s']*)\s*(k|m|mn|mm|b|bn|t|thousand|million|billion|trillion)?\b/i.exec(
      value.trim()
    )
  if (!match) return null
  const n = toNumber(match[1])
  if (n === null) return null
  return n * (MULTIPLIERS[(match[2] ?? "").toLowerCase()] ?? 1)
}

function url(value: string): string | null {
  let raw = value.trim()
  if (!raw) return null
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`
  try {
    const host = new URL(raw).host
    return host.includes(".") ? raw : null
  } catch {
    return null
  }
}

function resolveColumns(
  headers: string[],
  mapping: string,
  columnMap: Record<string, string> | null
): Record<string, string> {
  const byNorm = new Map(headers.filter(Boolean).map((h) => [normHeader(h), h]))
  let resolved: Record<string, string> = {}
  if (mapping === "custom") {
    if (!columnMap)
      throw new ImportFormatError(
        "missing_column_map",
        "mapping=custom requires a column_map (target field → CSV column)"
      )
    const unknown = Object.keys(columnMap)
      .filter((k) => !(IMPORT_FIELDS as readonly string[]).includes(k))
      .sort()
    if (unknown.length)
      throw new ImportFormatError(
        "invalid_column_map",
        `Unknown target fields in column_map: ${unknown.join(", ")}`,
        {
          allowed_fields: [...IMPORT_FIELDS],
        }
      )
    const missing = Object.values(columnMap).filter(
      (col) => !byNorm.has(normHeader(col))
    )
    if (missing.length)
      throw new ImportFormatError(
        "unknown_columns",
        `Columns not found in CSV: ${missing.join(", ")}`,
        { columns: headers }
      )
    resolved = Object.fromEntries(
      Object.entries(columnMap).map(([target, col]) => [
        target,
        byNorm.get(normHeader(col)) ?? col,
      ])
    )
  } else {
    const table =
      mapping === "crunchbase" ? CRUNCHBASE_MAPPING : DEFAULT_MAPPING
    for (const [target, aliases] of Object.entries(table)) {
      const hit = aliases.find((a) => byNorm.has(normHeader(a)))
      if (hit) resolved[target] = byNorm.get(normHeader(hit)) ?? hit
    }
  }
  const missingRequired = ["name", "domain"].filter((f) => !resolved[f])
  if (missingRequired.length)
    throw new ImportFormatError(
      "missing_columns",
      `CSV must have columns for: ${missingRequired.join(", ")} (mapping=${mapping})`,
      {
        columns: headers,
        mapping,
      }
    )
  return resolved
}

function rowFields(
  get: Record<string, string>,
  mapping: string,
  rowNo: number,
  warnings: string[]
) {
  const out: Record<string, string | number | string[]> = {}
  if (get.country) {
    const code = matchCountry(get.country)
    if (code) out.country_code = code
    else warnings.push(`Row ${rowNo}: unknown country '${get.country}'`)
  }
  if (get.industry) {
    const ids: string[] = []
    const unmatched: string[] = []
    for (const part of get.industry
      .split(/[;,|/]/)
      .map((p) => p.trim())
      .filter(Boolean)) {
      const id = matchIndustry(part)
      if (!id) unmatched.push(part)
      else if (!ids.includes(id)) ids.push(id)
    }
    if (ids.length) out.industry_ids = ids
    if (unmatched.length)
      warnings.push(
        `Row ${rowNo}: industry not in taxonomy: ${unmatched.join(", ")}`
      )
  }
  if (get.employees) {
    const n = parseAmount(get.employees)
    if (n === null || n < 0)
      warnings.push(`Row ${rowNo}: cannot parse employees '${get.employees}'`)
    else out.employees = Math.trunc(n)
  }
  if (get.revenue) {
    const n = parseAmount(get.revenue)
    if (n === null)
      warnings.push(`Row ${rowNo}: cannot parse revenue '${get.revenue}'`)
    else out.revenue_eur = Math.round(n * 100) / 100
  }
  if (get.hq_city)
    out.hq_city =
      mapping === "crunchbase"
        ? get.hq_city.split(",")[0].trim()
        : get.hq_city.trim()
  for (const key of [
    "homepage_url",
    "linkedin_url",
    "careers_url",
    "newsroom_url",
  ]) {
    if (!get[key]) continue
    const u = url(get[key])
    if (u) out[key] = u
    else warnings.push(`Row ${rowNo}: invalid ${key} '${get[key]}'`)
  }
  if (get.crunchbase_url) {
    const m = /crunchbase\.com\/organization\/([^/?#\s]+)/.exec(
      get.crunchbase_url
    )
    if (m) out.crunchbase_id = m[1]
  }
  if (get.notes) out.notes = get.notes.trim()
  if (get.tags) {
    const tags = get.tags
      .split(/[;,|]/)
      .map((t) => t.trim())
      .filter(Boolean)
    if (tags.length) out.tags = tags
  }
  return out
}

export function parseCsv(
  content: string,
  opts: {
    mapping: string
    columnMap: Record<string, string> | null
    onDuplicate: "merge" | "skip"
    maxRows: number
  }
): ParseResult {
  const text = content.replace(/^\uFEFF/, "")
  if (!text.trim())
    throw new ImportFormatError("empty_file", "CSV file is empty")
  const headerLine = text.split(/\r?\n/)[0]
  const delimiter = [",", ";", "\t"].reduce(
    (best, d) =>
      headerLine.split(d).length > headerLine.split(best).length ? d : best,
    ","
  )
  const table = parseCsvText(text, delimiter)
  const headers = (table[0] ?? []).map((h) => h.trim())
  const columns = resolveColumns(headers, opts.mapping, opts.columnMap)
  const result: ParseResult = {
    rows: [],
    total_rows: 0,
    skipped: 0,
    errors: [],
    warnings: [],
    duplicates: [],
  }
  const firstByDomain = new Map<string, ParsedRow>()
  // csv.DictReader skips empty lines entirely (a line of only delimiters is a blank row and counts).
  const dataRows = table
    .slice(1)
    .filter((cells) => !(cells.length === 1 && cells[0] === ""))
  dataRows.forEach((cells, index) => {
    const rowNo = index + 1
    if (rowNo > opts.maxRows)
      throw new ImportFormatError(
        "too_many_rows",
        `CSV has more than ${opts.maxRows} data rows`,
        { max_rows: opts.maxRows }
      )
    result.total_rows = rowNo
    const get: Record<string, string> = {}
    for (const [target, col] of Object.entries(columns)) {
      const value = (cells[headers.indexOf(col)] ?? "").trim()
      if (value) get[target] = value
    }
    if (Object.keys(get).length === 0) {
      result.skipped += 1
      return
    }
    const name = get.name ?? ""
    const domainRaw = get.domain ?? ""
    if (!name || !domainRaw) {
      result.skipped += 1
      result.errors.push(`Row ${rowNo}: missing ${!name ? "name" : "domain"}`)
      return
    }
    const domain = normalizeDomain(domainRaw)
    if (!domain || !domain.includes(".") || domain.includes(" ")) {
      result.skipped += 1
      result.errors.push(`Row ${rowNo}: invalid domain '${domainRaw}'`)
      return
    }
    const fields = rowFields(get, opts.mapping, rowNo, result.warnings)
    if (!fields.homepage_url && /^https?:\/\//i.test(domainRaw)) {
      const u = new URL(domainRaw)
      fields.homepage_url = `${u.protocol}//${u.host.toLowerCase()}`
    }
    const parsed: ParsedRow = {
      row: rowNo,
      name: name.slice(0, 255),
      domain,
      fields,
    }
    const first = firstByDomain.get(domain)
    if (!first) {
      firstByDomain.set(domain, parsed)
      result.rows.push(parsed)
      return
    }
    result.duplicates.push({
      row: rowNo,
      first_row: first.row,
      domain,
      action: opts.onDuplicate,
    })
    if (opts.onDuplicate === "merge")
      for (const [k, v] of Object.entries(fields))
        if (!(k in first.fields)) first.fields[k] = v
    result.skipped += 1
  })
  return result
}
