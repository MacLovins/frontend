/** Seed: companies, scanned documents, signals and lead scores (current + history). */
import type {
  CompanyOut,
  DocumentOut,
  SourceType,
  Tier,
} from "@/api/generated/model"

import { COMPANIES, EXTRA_DOCUMENTS, type CompanySpec } from "../data/companies"
import { fillerDocuments } from "../data/documents"
import { G, ORG_ID, SERVICE_CYBER_ID, SERVICE_IA_ID, uuid } from "../data/ids"
import { LEADS, type DerivedSpec, type SignalSpec } from "../data/leads"
import { prng } from "../data/prng"
import { agoMs, iso, MS, ymd } from "../data/time"
import { derivedTexts, evidenceKey } from "../engine/evidence"
import { DEFAULT_PARAMS, computeScore } from "../engine/scoring"
import type { DbState, ScoreRecord, SignalRecord } from "../types"

export const companyId = (key: string) => {
  const spec = COMPANIES.find((c) => c.key === key)
  if (!spec) throw new Error(`Unknown company ${key}`)
  return uuid(G.company, spec.n)
}

export const serviceIdOf = (service: "ia" | "cyber") =>
  service === "ia" ? SERVICE_IA_ID : SERVICE_CYBER_ID

function companyRow(spec: CompanySpec, now: Date): CompanyOut {
  const created = agoMs(now, { m: spec.createdMin })
  const analyzed =
    spec.analyzedHours === null ? null : agoMs(now, { h: spec.analyzedHours })
  return {
    id: uuid(G.company, spec.n),
    org_id: ORG_ID,
    name: spec.name,
    domain: spec.domain,
    aliases: [],
    own_domains: analyzed === null ? [] : [...(spec.ownDomains ?? [])],
    country_code: spec.country,
    industry_ids: [...spec.industries],
    employees: spec.employees,
    revenue_eur: spec.revenue,
    hq_city: spec.city,
    wikidata_qid: null,
    lei: null,
    crunchbase_id: null,
    homepage_url: `https://${spec.domain}`,
    careers_url: spec.careersUrl ?? null,
    newsroom_url: spec.newsroomUrl ?? null,
    ats: analyzed === null ? null : (spec.ats ?? null),
    linkedin_url: spec.linkedinUrl ?? null,
    notes: spec.notes ?? null,
    tags: [...(spec.tags ?? [])],
    origin: spec.origin,
    is_tracked: spec.tracked,
    resolved_at: analyzed === null ? null : iso(created + MS.HOUR),
    last_analyzed_at: analyzed === null ? null : iso(analyzed),
    created_at: iso(created),
    updated_at: iso(analyzed ?? created),
  }
}

const DOC_SOURCE: Partial<Record<SourceType, string>> = {
  jobs: "careers_page",
  news: "google_news",
  website: "website",
  report: "annual_report",
  registry: "wikidata",
}

/** Documents fetched by the monitoring run two hours ago ("14 new documents"). */
const RECENT_FETCH: Record<string, Partial<Record<SourceType, number>>> = {
  dhl: { jobs: 4, news: 2 },
  vistula: { jobs: 3, news: 1 },
  nordhavn: { jobs: 3, news: 1 },
}

function isDerived(spec: SignalSpec | DerivedSpec): spec is DerivedSpec {
  return "derived" in spec
}

export function seedEvidence(
  state: DbState,
  now: Date,
  recentRunId: string
): void {
  state.companies = COMPANIES.map((spec) => companyRow(spec, now))
  const documents: DocumentOut[] = []
  const signals: SignalRecord[] = []
  let docSeq = 0
  let sigSeq = 0
  const nextDoc = () => uuid(G.document, ++docSeq)

  for (const lead of LEADS) {
    const company = state.companies.find(
      (c) => c.id === companyId(lead.company)
    )
    if (!company) continue
    const serviceId = serviceIdOf(lead.service)
    const questionOf = (key: string) => {
      const q = state.questions.find(
        (item) => item.service_id === serviceId && item.key === key
      )
      if (!q) throw new Error(`Unknown question ${key}`)
      return q
    }
    const complianceKey = lead.service === "cyber" ? "cy_compliance" : "ia_cost"

    // Split each question's target strength over its signals (noisy-OR by share).
    const live = lead.signals.filter((s) => isDerived(s) || !s.rejected)
    const sharesByQ = new Map<string, number>()
    for (const s of live) {
      const key = isDerived(s) ? complianceKey : s.q
      sharesByQ.set(key, (sharesByQ.get(key) ?? 0) + (s.share ?? 1))
    }

    for (const spec of lead.signals) {
      const key = isDerived(spec) ? complianceKey : spec.q
      const question = questionOf(key)
      const target = lead.targets[key] ?? 0
      const share = spec.share ?? 1
      const value = 1 - Math.pow(1 - target, share / (sharesByQ.get(key) ?? 1))
      sigSeq += 1
      if (isDerived(spec)) {
        const t = derivedTexts(company, spec.derived)
        const detected = agoMs(now, { d: 40 })
        signals.push({
          id: uuid(G.signal, sigSeq),
          company_id: company.id,
          service_id: serviceId,
          question_id: question.id,
          category: question.category,
          document_id: null,
          quote: t.quote,
          summary: t.summary,
          strength: t.strength,
          confidence: 0.8,
          url: t.url,
          source_name: t.source,
          source_type: "derived",
          event_date: null,
          published_at: null,
          flags: ["derived"],
          status: "active",
          detected_at: iso(detected),
          evidence_key: evidenceKey(key, t.quote, t.url),
          factor: value / (DEFAULT_PARAMS.strength_values[t.strength] * 0.8),
          run_id: null,
        })
        continue
      }
      const pubDays = spec.pub ?? spec.date ?? 30
      const publishedMs = agoMs(now, { d: pubDays, h: 3 })
      const detectedMs =
        spec.detH !== undefined
          ? agoMs(now, { h: spec.detH })
          : agoMs(now, { d: spec.det ?? Math.max(0, pubDays - 1) })
      let doc = documents.find(
        (d) => d.company_id === company.id && d.url === spec.url
      )
      if (!doc) {
        const docType: SourceType =
          spec.type === "derived" || spec.type === "manual"
            ? "website"
            : spec.type
        doc = {
          id: nextDoc(),
          company_id: company.id,
          source_type: docType,
          source_name: spec.doc ?? DOC_SOURCE[docType] ?? "website",
          url: spec.url,
          canonical_url: spec.url,
          title: spec.title ?? spec.quote.slice(0, 120),
          published_at: iso(publishedMs),
          fetched_at: iso(
            Math.min(detectedMs - 10 * MS.MINUTE, now.getTime() - 5 * MS.MINUTE)
          ),
          language: spec.lang ?? "en",
        }
        documents.push(doc)
      }
      signals.push({
        id: uuid(G.signal, sigSeq),
        company_id: company.id,
        service_id: serviceId,
        question_id: question.id,
        category: question.category,
        document_id: doc.id,
        quote: spec.quote,
        summary: spec.summary,
        strength: spec.strength,
        confidence: spec.conf,
        url: spec.url,
        source_name: spec.src,
        source_type: spec.type,
        event_date:
          spec.date === null ? null : ymd(agoMs(now, { d: spec.date })),
        published_at: iso(publishedMs),
        flags: [...(spec.flags ?? [])].sort(),
        status: spec.rejected ? "rejected_by_user" : "active",
        detected_at: iso(detectedMs),
        evidence_key: evidenceKey(key, spec.quote, spec.url),
        factor: spec.rejected
          ? 0.5
          : value / (DEFAULT_PARAMS.strength_values[spec.strength] * spec.conf),
        run_id: spec.detH !== undefined && spec.detH <= 3 ? recentRunId : null,
      })
    }
  }

  // Fill every company up to its "Sources scanned" counts.
  for (const spec of COMPANIES) {
    const id = uuid(G.company, spec.n)
    for (const extra of EXTRA_DOCUMENTS[spec.key] ?? []) {
      const publishedMs =
        extra.days === null ? null : agoMs(now, { d: extra.days, h: 5 })
      documents.push({
        id: nextDoc(),
        company_id: id,
        source_type: extra.type,
        source_name: extra.source,
        url: extra.url,
        canonical_url: extra.url,
        title: extra.title,
        published_at: publishedMs === null ? null : iso(publishedMs),
        fetched_at: iso((publishedMs ?? agoMs(now, { d: 30 })) + 6 * MS.HOUR),
        language: extra.lang,
      })
    }
    for (const type of [
      "jobs",
      "news",
      "website",
      "report",
      "registry",
    ] as const) {
      const have = documents.filter(
        (d) => d.company_id === id && d.source_type === type
      ).length
      const missing = spec.docs[type] - have
      if (missing <= 0) continue
      documents.push(
        ...fillerDocuments(
          {
            companyId: id,
            name: spec.name,
            domain: spec.domain,
            city: spec.city,
            lang: spec.lang,
            atsKind: spec.ats?.kind ?? null,
            nextId: nextDoc,
            now,
            recentFetch: RECENT_FETCH[spec.key]?.[type] ?? 0,
            recentHours: 2.2,
          },
          type,
          missing
        )
      )
    }
  }

  state.documents = documents
  state.signals = signals
  seedScores(state, now)
}

function tierFor(priority: number, dq: boolean): Tier {
  if (dq) return "disqualified"
  return priority >= 65 ? "hot" : priority >= 40 ? "warm" : "cold"
}

function seedScores(state: DbState, now: Date): void {
  const scores: ScoreRecord[] = []
  let seq = 0
  for (const lead of LEADS) {
    const cid = companyId(lead.company)
    const company = state.companies.find((c) => c.id === cid)
    if (!company?.last_analyzed_at) continue
    const serviceId = serviceIdOf(lead.service)
    const analyzedAt = new Date(company.last_analyzed_at)
    const current = computeScore(state, cid, serviceId, analyzedAt)
    const createdMs = new Date(company.created_at).getTime()

    let history = lead.history
    if (!history) {
      const rand = prng(`${lead.company}:${lead.service}`)
      let p = current.priority
      history = [1, 3, 7, 12, 20, 29, 45].map((d) => {
        p = Math.max(0, Math.min(100, p - 3 + rand() * 6.5))
        return [d, current.disqualified ? 0 : Math.round(p * 10) / 10] as [
          number,
          number,
        ]
      })
    }
    const older = history.filter(
      ([d]) =>
        agoMs(now, { d }) > createdMs &&
        agoMs(now, { d }) < analyzedAt.getTime()
    )
    for (const [d, priority] of [...older].reverse()) {
      seq += 1
      scores.push({
        ...current,
        id: uuid(G.score, seq),
        company_id: cid,
        service_id: serviceId,
        priority,
        tier: tierFor(priority, current.disqualified),
        is_current: false,
        computed_at: iso(agoMs(now, { d })),
        scoring_profile_version: d > 29 ? 2 : 3,
      })
    }
    seq += 1
    scores.push({
      ...current,
      id: uuid(G.score, seq),
      company_id: cid,
      service_id: serviceId,
      is_current: true,
      computed_at: iso(analyzedAt),
    })
  }
  state.scores = scores
}

/** Finds a seeded signal by company key and the start of its quote. */
export function seededSignal(
  state: DbState,
  company: string,
  quoteStart: string
): SignalRecord {
  const cid = companyId(company)
  const signal = state.signals.find(
    (s) => s.company_id === cid && s.quote.startsWith(quoteStart)
  )
  if (!signal)
    throw new Error(`Seed signal not found: ${company} "${quoteStart}"`)
  return signal
}
