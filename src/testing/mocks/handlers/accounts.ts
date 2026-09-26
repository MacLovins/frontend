/** Accounts (backend core/modules/accounts/router.py): companies, CSV import and scanned documents. */
import type {
  CompanyCreate,
  CompanyImportReport,
  CompanyOut,
  CompanyUpdate,
  DocumentOut,
  PaginatedResponseCompanyOut,
  PaginatedResponseDocumentOut,
} from "@/api/generated/model"

import { nextId, ORG_ID } from "../data/ids"
import { isoNow } from "../data/time"
import { db } from "../db"
import { ImportFormatError, normalizeDomain, parseCsv } from "../engine/csv"
import {
  fail,
  has,
  json,
  noContent,
  paginate,
  pathUuid,
  queryBool,
  readJson,
  route,
  validateBody,
  type FieldSpec,
} from "./http"

const MAX_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 5000

export function companyOrThrow(id: string): CompanyOut {
  const company = db.companies.find((c) => c.id === id)
  if (!company) throw fail.notFound("Company not found")
  return company
}

const optionalText: FieldSpec = { type: "string", nullable: true }

const editableFields: Record<string, FieldSpec> = {
  country_code: optionalText,
  industry_ids: { type: "list", items: "string", nullable: true },
  employees: { type: "int", nullable: true },
  revenue_eur: { type: "any" },
  hq_city: optionalText,
  homepage_url: optionalText,
  careers_url: optionalText,
  newsroom_url: optionalText,
  linkedin_url: optionalText,
  notes: optionalText,
  tags: { type: "list", items: "string", nullable: true },
}

function revenue(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === "string" ? Number(value) : value
  if (typeof n !== "number" || Number.isNaN(n))
    throw fail.validation([
      {
        loc: ["body", "revenue_eur"],
        msg: "Input should be a valid decimal",
        type: "decimal_parsing",
      },
    ])
  return n
}

/** `country_code` is String(2) in the database: longer values are a 500 in the backend. */
function checkCountry(code: string | null | undefined): void {
  if (code && code.length > 2) throw fail.internal()
}

/** Fills only empty fields (CSV merge semantics: never overwrite, never rename, never re-track). */
function mergeEmpty(
  company: CompanyOut,
  fields: Record<string, unknown>
): boolean {
  let changed = false
  const record = company as unknown as Record<string, unknown>
  for (const [key, value] of Object.entries(fields)) {
    const current = record[key]
    const empty =
      current === null ||
      current === undefined ||
      current === "" ||
      (Array.isArray(current) && current.length === 0)
    if (empty) {
      record[key] = value
      changed = true
    }
  }
  return changed
}

export const accountHandlers = [
  route("get", "/companies", ({ url }) => {
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase()
    const tracked = queryBool(url, "is_tracked")
    const items = db.companies
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q)
      )
      .filter((c) => tracked === null || c.is_tracked === tracked)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    return json<PaginatedResponseCompanyOut>(paginate(items, url))
  }),

  route("post", "/companies", async ({ request }) => {
    const body = validateBody<CompanyCreate>(
      await readJson(request),
      {
        name: { type: "string", min: 1, max: 255, required: true },
        domain: { type: "string", min: 1, max: 255, required: true },
        ...editableFields,
      },
      { forbidExtra: true }
    )
    const domain = normalizeDomain(body.domain)
    if (!domain) throw fail.badRequest("Invalid domain")
    if (db.companies.some((c) => c.domain === domain))
      throw fail.conflict(`Company with domain '${domain}' already exists`)
    checkCountry(body.country_code)
    const now = isoNow()
    const company: CompanyOut = {
      id: nextId(db),
      org_id: ORG_ID,
      name: body.name,
      domain,
      aliases: [],
      own_domains: [],
      country_code: body.country_code ?? null,
      industry_ids: body.industry_ids ?? [],
      employees: body.employees ?? null,
      revenue_eur: revenue(body.revenue_eur),
      hq_city: body.hq_city ?? null,
      wikidata_qid: null,
      lei: null,
      crunchbase_id: null,
      homepage_url: body.homepage_url ?? `https://${domain}`,
      careers_url: body.careers_url ?? null,
      newsroom_url: body.newsroom_url ?? null,
      ats: null,
      linkedin_url: body.linkedin_url ?? null,
      notes: body.notes ?? null,
      tags: body.tags ?? [],
      origin: "manual",
      is_tracked: true,
      resolved_at: null,
      last_analyzed_at: null,
      created_at: now,
      updated_at: now,
    }
    db.companies.push(company)
    return json<CompanyOut>(company, 201)
  }),

  route("post", "/companies/import", async ({ request, url }) => {
    const mapping = url.searchParams.get("mapping") ?? "default"
    const onDuplicate = url.searchParams.get("on_duplicate") ?? "merge"
    if (!["default", "crunchbase", "custom"].includes(mapping))
      throw fail.validation([
        {
          loc: ["query", "mapping"],
          msg: "Input should be 'default', 'crunchbase' or 'custom'",
          type: "enum",
        },
      ])
    if (onDuplicate !== "merge" && onDuplicate !== "skip")
      throw fail.validation([
        {
          loc: ["query", "on_duplicate"],
          msg: "Input should be 'merge' or 'skip'",
          type: "enum",
        },
      ])
    let form: FormData
    try {
      form = await request.formData()
    } catch {
      throw fail.validation([
        { loc: ["body", "file"], msg: "Field required", type: "missing" },
      ])
    }
    const file = form.get("file")
    if (file === null || typeof file === "string")
      throw fail.validation([
        { loc: ["body", "file"], msg: "Field required", type: "missing" },
      ])
    const bytes = await file.arrayBuffer()
    if (bytes.byteLength > MAX_BYTES)
      throw fail.domain(
        413,
        "payload_too_large",
        `CSV is larger than ${MAX_BYTES} bytes`,
        { max_bytes: MAX_BYTES }
      )
    let text: string
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes)
    } catch {
      throw fail.domain(422, "invalid_encoding", "CSV must be UTF-8 encoded")
    }
    let columnMap: Record<string, string> | null = null
    const rawMap = form.get("column_map")
    if (typeof rawMap === "string" && rawMap.trim()) {
      try {
        const parsed: unknown = JSON.parse(rawMap)
        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed) ||
          Object.values(parsed).some((v) => typeof v !== "string")
        )
          throw new Error("not a string map")
        columnMap = parsed as Record<string, string>
      } catch {
        throw fail.domain(
          422,
          "invalid_column_map",
          "column_map must be a JSON object of target field → CSV column"
        )
      }
    }
    let result
    try {
      result = parseCsv(text, {
        mapping,
        columnMap,
        onDuplicate,
        maxRows: MAX_ROWS,
      })
    } catch (error) {
      if (error instanceof ImportFormatError)
        throw fail.domain(422, error.code, error.message, error.details)
      throw error
    }
    const report: CompanyImportReport = {
      created: 0,
      updated: 0,
      skipped: result.skipped,
      errors: result.errors,
      total_rows: result.total_rows,
      warnings: result.warnings,
      duplicates: result.duplicates,
    }
    const now = isoNow()
    for (const row of result.rows) {
      const existing = db.companies.find((c) => c.domain === row.domain)
      if (existing) {
        if (mergeEmpty(existing, row.fields)) {
          existing.updated_at = now
          report.updated += 1
        } else report.skipped += 1
        continue
      }
      const f = row.fields
      db.companies.push({
        id: nextId(db),
        org_id: ORG_ID,
        name: row.name,
        domain: row.domain,
        aliases: [],
        own_domains: [],
        country_code: (f.country_code as string | undefined) ?? null,
        industry_ids: (f.industry_ids as string[] | undefined) ?? [],
        employees: (f.employees as number | undefined) ?? null,
        revenue_eur: (f.revenue_eur as number | undefined) ?? null,
        hq_city: (f.hq_city as string | undefined) ?? null,
        wikidata_qid: null,
        lei: null,
        crunchbase_id: (f.crunchbase_id as string | undefined) ?? null,
        homepage_url:
          (f.homepage_url as string | undefined) ?? `https://${row.domain}`,
        careers_url: (f.careers_url as string | undefined) ?? null,
        newsroom_url: (f.newsroom_url as string | undefined) ?? null,
        ats: null,
        linkedin_url: (f.linkedin_url as string | undefined) ?? null,
        notes: (f.notes as string | undefined) ?? null,
        tags: (f.tags as string[] | undefined) ?? [],
        origin: "csv",
        is_tracked: true,
        resolved_at: null,
        last_analyzed_at: null,
        created_at: now,
        updated_at: now,
      })
      report.created += 1
    }
    return json<CompanyImportReport>(report)
  }),

  route("get", "/companies/:id", (ctx) =>
    json<CompanyOut>(companyOrThrow(pathUuid(ctx)))
  ),

  route("patch", "/companies/:id", async (ctx) => {
    const id = pathUuid(ctx)
    const body = validateBody<CompanyUpdate>(
      await readJson(ctx.request),
      {
        name: { type: "string", min: 1, max: 255, nullable: true },
        ...editableFields,
        is_tracked: { type: "bool", nullable: true },
      },
      { forbidExtra: true }
    )
    const company = companyOrThrow(id)
    for (const key of ["name", "industry_ids", "tags", "is_tracked"] as const)
      if (has(body, key) && body[key] === null) throw fail.internal()
    checkCountry(body.country_code)
    const record = company as unknown as Record<string, unknown>
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue
      record[key] = key === "revenue_eur" ? revenue(value) : value
    }
    company.updated_at = isoNow()
    return json<CompanyOut>(company)
  }),

  route(
    "delete",
    "/companies/:id",
    (ctx) => {
      const id = pathUuid(ctx)
      if (db.companies.some((c) => c.id === id)) {
        db.companies = db.companies.filter((c) => c.id !== id)
        db.documents = db.documents.filter((d) => d.company_id !== id)
        db.signals = db.signals.filter((s) => s.company_id !== id)
        db.scores = db.scores.filter((s) => s.company_id !== id)
        db.outreachJobs = db.outreachJobs.filter((j) => j.job.company_id !== id)
        for (const e of db.runEvents)
          if (e.company_id === id) e.company_id = null
      }
      return noContent()
    },
    { role: "admin" }
  ),

  route("get", "/companies/:id/documents", (ctx) => {
    const id = pathUuid(ctx)
    companyOrThrow(id)
    const type = ctx.url.searchParams.get("source_type")
    const items: DocumentOut[] = db.documents
      .filter(
        (d) => d.company_id === id && (type === null || d.source_type === type)
      )
      .sort(
        (a, b) =>
          b.fetched_at.localeCompare(a.fetched_at) || a.id.localeCompare(b.id)
      )
    return json<PaginatedResponseDocumentOut>(paginate(items, ctx.url))
  }),
]
