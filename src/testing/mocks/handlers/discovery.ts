/** Discovery (backend core/modules/discovery): search the registry by ICP, accept candidates as accounts. */
import type {
  CompanyOut,
  DiscoveryAcceptIn,
  DiscoverySearchIn,
  DiscoverySearchOut,
} from "@/api/generated/model"

import { nextId, ORG_ID } from "../data/ids"
import { isoNow } from "../data/time"
import { db } from "../db"
import { normalizeDomain } from "../engine/csv"
import { buildQuery, QueryIncomplete, search } from "../engine/discovery"
import { processingDelay } from "../settings"
import { fail, json, readJson, route, validateBody } from "./http"

export const discoveryHandlers = [
  route("post", "/discovery/search", async ({ request }) => {
    const body = validateBody<DiscoverySearchIn>(await readJson(request), {
      service_id: { type: "uuid", required: true },
      limit: { type: "int", ge: 1, le: 100 },
      countries: { type: "list", items: "string", nullable: true },
      industries: { type: "list", items: "string", nullable: true },
      employees_min: { type: "int", ge: 0, nullable: true },
      employees_max: { type: "int", ge: 0, nullable: true },
      country: { type: "string", nullable: true },
      industry: { type: "string", nullable: true },
      keywords: { type: "list", items: "string" },
    })
    const serviceId = body.service_id.toLowerCase()
    if (!db.services.some((s) => s.id === serviceId))
      throw fail.notFound("Service not found")
    const icp = db.icps.find((i) => i.service_id === serviceId)
    let query
    try {
      query = buildQuery(icp, body)
    } catch (error) {
      if (error instanceof QueryIncomplete)
        throw fail.domain(
          422,
          "discovery_query_incomplete",
          "Discovery needs at least one country and one industry: set them in the service ICP or pass countries / industries in the request",
          { countries: error.countries, industries: error.industries }
        )
      throw error
    }
    await processingDelay(1200)
    const items = search(db.candidates, icp, query, db.companies)
    return json<DiscoverySearchOut>({ items, total: items.length, query })
  }),

  route("post", "/discovery/accept", async ({ request }) => {
    const body = validateBody<DiscoveryAcceptIn>(await readJson(request), {
      name: { type: "string", required: true },
      domain: { type: "string", required: true },
      country_code: { type: "string", nullable: true },
      industry_ids: { type: "list", items: "string" },
      employees: { type: "int", nullable: true },
      revenue_eur: { type: "number", nullable: true },
      wikidata_qid: { type: "string", nullable: true },
      lei: { type: "string", nullable: true },
      crunchbase_id: { type: "string", nullable: true },
      notes: { type: "string", nullable: true },
      tags: { type: "list", items: "string" },
      service_id: { type: "uuid", nullable: true },
    })
    const domain = normalizeDomain(body.domain)
    if (!domain) throw fail.badRequest("Invalid domain")
    const existing = db.companies.find((c) => c.domain === domain)
    if (existing) {
      existing.is_tracked = true
      existing.updated_at = isoNow()
      return json<CompanyOut>(existing, 201)
    }
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
      revenue_eur: body.revenue_eur ?? null,
      hq_city: null,
      wikidata_qid: body.wikidata_qid ?? null,
      lei: body.lei ?? null,
      crunchbase_id: body.crunchbase_id ?? null,
      homepage_url: `https://${domain}`,
      careers_url: null,
      newsroom_url: null,
      ats: null,
      linkedin_url: null,
      notes: body.notes ?? null,
      tags: body.tags ?? [],
      origin: "discovery",
      is_tracked: true,
      resolved_at: null,
      last_analyzed_at: null,
      created_at: now,
      updated_at: now,
    }
    db.companies.push(company)
    return json<CompanyOut>(company, 201)
  }),
]
