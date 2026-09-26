/**
 * Leads (backend core/modules/leads/router.py + outreach): ranked list with filters and sort, CSV export,
 * the lead card and async outreach drafts.
 */
import { HttpResponse } from "msw"

import type {
  CompanyOut,
  LeadCardScore,
  LeadDetail,
  LeadListItem,
  OutreachGenerateIn,
  OutreachJobOut,
  PaginatedResponseLeadListItem,
  QuestionRef,
  QuestionSignals,
  ScoreHistoryPoint,
  ServiceOut,
  SignalItem,
  SignalQuestionOut,
  SignalVerdict,
} from "@/api/generated/model"

import { nextId } from "../data/ids"
import { isoNow } from "../data/time"
import { db } from "../db"
import { activeQuestions, currentScore, signalStats } from "../engine/scoring"
import { startOutreachJob } from "../sim/outreach"
import type { OutreachRequest, ScoreRecord } from "../types"
import { companyOrThrow } from "./accounts"
import {
  fail,
  json,
  paginate,
  pathUuid,
  queryBool,
  queryMulti,
  queryNumber,
  queryUuid,
  readJson,
  route,
  validateBody,
} from "./http"

const SORT_FIELDS = [
  "priority",
  "fit",
  "intent",
  "risk",
  "name",
  "last_signal_at",
  "signals_count",
]

interface Row {
  score: ScoreRecord
  company: CompanyOut
  signals_count: number
  new_signals_7d: number
  last_signal_at: string | null
}

export function scoreSummary(s: ScoreRecord) {
  return {
    priority: s.priority,
    tier: s.tier,
    fit: s.fit,
    intent: s.intent,
    risk: s.risk,
    disqualified: s.disqualified,
  }
}

/** Filters + sort shared by the list and the CSV export (`lead_filters`, `_leads_query`). */
function leadRows(url: URL): Row[] {
  const serviceId = queryUuid(url, "service_id")
  const tiers = queryMulti(url, "tier")
  const countries = queryMulti(url, "country").map((c) => c.toUpperCase())
  const industries = queryMulti(url, "industry")
  const minPriority = queryNumber(url, "min_priority")
  const hasNew = queryBool(url, "has_new")
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase()
  const now = new Date()

  const rows: Row[] = []
  for (const score of db.scores) {
    if (!score.is_current) continue
    if (serviceId && score.service_id !== serviceId) continue
    const company = db.companies.find((c) => c.id === score.company_id)
    if (!company) continue
    if (tiers.length && !tiers.includes(score.tier)) continue
    if (countries.length && !countries.includes(company.country_code ?? ""))
      continue
    if (
      industries.length &&
      !company.industry_ids.some((i) => industries.includes(i))
    )
      continue
    if (minPriority !== null && score.priority < minPriority) continue
    if (
      q &&
      !company.name.toLowerCase().includes(q) &&
      !company.domain.toLowerCase().includes(q)
    )
      continue
    const stats = signalStats(db, company.id, score.service_id, now)
    if (hasNew === true && stats.new_signals_7d === 0) continue
    if (hasNew === false && stats.new_signals_7d > 0) continue
    rows.push({ score, company, ...stats })
  }

  const [rawField, direction = ""] = (
    url.searchParams.get("sort") ?? "priority:desc"
  ).split(":")
  const field = SORT_FIELDS.includes(rawField) ? rawField : "priority"
  const descending =
    field === "name" ? direction === "desc" : direction !== "asc"
  const value = (r: Row): string | number | null => {
    switch (field) {
      case "name":
        return r.company.name.toLowerCase()
      case "last_signal_at":
        return r.last_signal_at
      case "signals_count":
        return r.signals_count
      default:
        return r.score[field as "priority" | "fit" | "intent" | "risk"]
    }
  }
  const cmp = (a: string | number, b: string | number) =>
    a < b ? -1 : a > b ? 1 : 0
  return rows.sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    if (va === null || vb === null) {
      if (va !== vb) return va === null ? 1 : -1 // NULLS LAST in both directions
    } else {
      const primary = descending ? cmp(vb, va) : cmp(va, vb)
      if (primary) return primary
    }
    return (
      b.score.intent - a.score.intent ||
      b.score.fit - a.score.fit ||
      cmp(a.company.name.toLowerCase(), b.company.name.toLowerCase()) ||
      cmp(a.score.id, b.score.id)
    )
  })
}

function listItem(r: Row): LeadListItem {
  return {
    company: r.company,
    service_id: r.score.service_id,
    score: scoreSummary(r.score),
    top_reasons: r.score.why_now,
    flags: r.score.flags,
    signals_count: r.signals_count,
    new_signals_7d: r.new_signals_7d,
    last_signal_at: r.last_signal_at,
    analyzed_at: r.company.last_analyzed_at,
  }
}

// --- CSV export (Python csv.writer: minimal quoting, \r\n) ----------------------------------------------

const csvCell = (value: string | number | boolean) => {
  const text =
    typeof value === "boolean" ? (value ? "True" : "False") : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
const pyFloat = (x: number) => (Number.isInteger(x) ? x.toFixed(1) : String(x))

function exportCsv(rows: Row[]): string {
  const header = [
    "Company Name",
    "Domain",
    "Country",
    "Employees",
    "Tier",
    "Priority",
    "Fit Score",
    "Intent Score",
    "Risk Score",
    "Disqualified",
    "Top Reasons",
    "Last Analyzed",
    "Flags",
    "Signals",
    "New Signals 7d",
    "Last Signal",
  ]
  const lines = [header.map(csvCell).join(",")]
  for (const r of rows) {
    lines.push(
      [
        r.company.name,
        r.company.domain,
        r.company.country_code ?? "",
        r.company.employees || "",
        r.score.tier,
        pyFloat(r.score.priority),
        pyFloat(r.score.fit),
        pyFloat(r.score.intent),
        pyFloat(r.score.risk),
        r.score.disqualified,
        r.score.why_now.map((w) => w.text).join("; "),
        r.company.last_analyzed_at ?? "",
        r.score.flags.join("; "),
        r.signals_count,
        r.new_signals_7d,
        r.last_signal_at ?? "",
      ]
        .map(csvCell)
        .join(",")
    )
  }
  return `${lines.join("\r\n")}\r\n`
}

// --- lead card ---------------------------------------------------------------------------------------

/** The requested service, else the one where the company ranks best, else the first active one by slug. */
function resolveService(
  companyId: string,
  serviceId: string | null
): ServiceOut | null {
  if (serviceId) {
    const service = db.services.find((s) => s.id === serviceId)
    if (!service) throw fail.notFound("Service not found")
    return service
  }
  const scored = db.scores
    .filter((s) => s.company_id === companyId && s.is_current)
    .map((s) => ({
      s,
      service: db.services.find((x) => x.id === s.service_id),
    }))
    .filter((x): x is { s: ScoreRecord; service: ServiceOut } =>
      Boolean(x.service)
    )
    .sort(
      (a, b) =>
        Number(b.service.is_active) - Number(a.service.is_active) ||
        b.s.priority - a.s.priority ||
        b.s.intent - a.s.intent ||
        b.s.fit - a.s.fit ||
        a.service.slug.localeCompare(b.service.slug)
    )
  if (scored.length) return scored[0].service
  return (
    [...db.services]
      .filter((s) => s.is_active)
      .sort((a, b) => a.slug.localeCompare(b.slug))[0] ?? null
  )
}

const questionRef = (q: SignalQuestionOut): QuestionRef => ({
  id: q.id,
  key: q.key,
  text: q.text,
  category: q.category,
  polarity: q.polarity,
  weight: q.weight,
})

function cardScore(s: ScoreRecord): LeadCardScore {
  return {
    ...scoreSummary(s),
    fit_details: s.fit_details,
    rule_hits: s.rule_hits,
    flags: s.flags,
    data_gaps: s.data_gaps,
    breakdown: s.breakdown,
    why_now: s.why_now,
    scoring_profile_version: s.scoring_profile_version,
    computed_at: s.computed_at,
  }
}

function leadDetail(
  companyId: string,
  serviceIdParam: string | null,
  userId: string
): LeadDetail {
  const company = companyOrThrow(companyId)
  const service = resolveService(companyId, serviceIdParam)
  const sources: Record<string, number> = {}
  for (const d of db.documents)
    if (d.company_id === companyId)
      sources[d.source_type] = (sources[d.source_type] ?? 0) + 1
  if (!service)
    return {
      company,
      service: {},
      score: {},
      signals_by_question: [],
      questions_without_evidence: [],
      my_feedback: null,
      decision_makers: [],
      history: [],
      sources_summary: sources,
    }

  const score = currentScore(db, companyId, service.id)
  const signals = db.signals
    .filter(
      (s) =>
        s.company_id === companyId &&
        s.service_id === service.id &&
        s.status === "active"
    )
    .sort(
      (a, b) =>
        b.confidence - a.confidence ||
        b.detected_at.localeCompare(a.detected_at)
    )

  // my votes by signal id, and by evidence key for older copies (latest vote wins)
  const byId = new Map<string, SignalVerdict>()
  const byKey = new Map<string, SignalVerdict>()
  for (const fb of [...db.feedback].sort((a, b) =>
    a.updated_at.localeCompare(b.updated_at)
  )) {
    if (fb.user_id !== userId || fb.target_type !== "signal") continue
    const sig = db.signals.find((s) => s.id === fb.target_id)
    if (!sig || sig.company_id !== companyId || sig.service_id !== service.id)
      continue
    byId.set(sig.id, fb.verdict as SignalVerdict)
    byKey.set(sig.evidence_key, fb.verdict as SignalVerdict)
  }
  const contributions = new Map(
    (score?.breakdown ?? []).map((c) => [c.question_id, c])
  )
  const groups: QuestionSignals[] = []
  const withoutEvidence: QuestionRef[] = []
  for (const q of activeQuestions(db, service.id)) {
    const list = signals.filter((s) => s.question_id === q.id)
    if (!list.length) {
      withoutEvidence.push(questionRef(q))
      continue
    }
    const c = contributions.get(q.id)
    groups.push({
      question: questionRef(q),
      strength: c?.strength ?? 0,
      points: c?.points ?? 0,
      signals: list.map((s): SignalItem => ({
        id: s.id,
        quote: s.quote,
        summary: s.summary,
        strength: s.strength,
        confidence: s.confidence,
        url: s.url,
        source_name: s.source_name,
        source_type: s.source_type,
        event_date: s.event_date,
        flags: [...s.flags].sort(),
        my_feedback: byId.get(s.id) ?? byKey.get(s.evidence_key) ?? null,
      })),
    })
  }
  groups.sort((a, b) => b.points - a.points)

  const myLead = db.feedback.find(
    (f) =>
      f.user_id === userId &&
      f.target_type === "lead" &&
      f.target_id === companyId &&
      f.service_id === service.id
  )
  const history: ScoreHistoryPoint[] = db.scores
    .filter((s) => s.company_id === companyId && s.service_id === service.id)
    .sort((a, b) => b.computed_at.localeCompare(a.computed_at))
    .slice(0, 10)
    .map((s) => ({
      computed_at: s.computed_at,
      priority: s.priority,
      tier: s.tier,
      is_current: s.is_current,
    }))

  return {
    company,
    service: { id: service.id, name: service.name },
    score: score ? cardScore(score) : {},
    signals_by_question: groups,
    questions_without_evidence: withoutEvidence,
    my_feedback: myLead ? (myLead.verdict as "good_fit" | "bad_fit") : null,
    decision_makers: service.decision_makers.length
      ? service.decision_makers
      : ["CIO", "COO", "Head of Digital Transformation"],
    history: score ? history : [],
    sources_summary: sources,
  }
}

// --- outreach ------------------------------------------------------------------------------------------

function outreachService(
  companyId: string,
  requested: string | null | undefined
): string {
  if (requested) {
    if (!db.services.some((s) => s.id === requested.toLowerCase()))
      throw fail.notFound("Service not found")
    return requested.toLowerCase()
  }
  const best = db.scores
    .filter((s) => s.company_id === companyId && s.is_current)
    .sort((a, b) => b.priority - a.priority)[0]
  if (best) return best.service_id
  const active = db.services.find((s) => s.is_active)
  if (!active) throw fail.notFound("No active service configured")
  return active.id
}

export const leadHandlers = [
  route("get", "/leads", ({ url }) => {
    const rows = leadRows(url)
    const page = paginate(rows, url)
    return json<PaginatedResponseLeadListItem>({
      ...page,
      items: page.items.map(listItem),
    })
  }),

  route("get", "/leads/export.csv", ({ url }) => {
    const csv = exportCsv(leadRows(url))
    return new HttpResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="leads_export.csv"',
      },
    })
  }),

  route("get", "/leads/:companyId", (ctx) => {
    const companyId = pathUuid(ctx, "companyId")
    const serviceId = queryUuid(ctx.url, "service_id")
    return json<LeadDetail>(leadDetail(companyId, serviceId, ctx.user.id))
  }),

  route("post", "/leads/:companyId/outreach", async (ctx) => {
    const companyId = pathUuid(ctx, "companyId")
    const body = validateBody<OutreachGenerateIn>(await readJson(ctx.request), {
      service_id: { type: "uuid", nullable: true },
      channel: { type: "string" },
      language: { type: "string" },
      tone: { type: "string" },
      sender_name: { type: "string", nullable: true },
      sender_title: { type: "string", nullable: true },
      sender_company: { type: "string" },
    })
    companyOrThrow(companyId)
    const serviceId = outreachService(companyId, body.service_id)
    const request: OutreachRequest = {
      service_id: serviceId,
      channel:
        body.channel === "linkedin_inmail" || body.channel === "call_script"
          ? body.channel
          : "email",
      language: body.language ?? "en",
      tone:
        body.tone === "conversational" || body.tone === "direct"
          ? body.tone
          : "professional",
      sender_name: body.sender_name ?? null,
      sender_title: body.sender_title ?? null,
      sender_company: body.sender_company ?? "LeadRadar",
    }
    const job: OutreachJobOut = {
      id: nextId(db),
      company_id: companyId,
      service_id: serviceId,
      status: "queued",
      draft: null,
      error: null,
      created_at: isoNow(),
      finished_at: null,
    }
    const record = { job, request }
    db.outreachJobs.push(record)
    startOutreachJob(record)
    return json<OutreachJobOut>({ ...job }, 202)
  }),

  route("get", "/leads/:companyId/outreach/:jobId", (ctx) => {
    const companyId = pathUuid(ctx, "companyId")
    const jobId = pathUuid(ctx, "jobId")
    const record = db.outreachJobs.find(
      (j) => j.job.id === jobId && j.job.company_id === companyId
    )
    if (!record) throw fail.notFound("Outreach job not found")
    return json<OutreachJobOut>(record.job)
  }),
]
