/**
 * Simulated analysis worker (backend core/worker/tasks.py + ai/pipeline). Up to 3 companies at a time;
 * every company walks resolving → collecting → indexing → prefiltering → extracting → verifying →
 * scoring → done with one event every ~400–700 ms. Roughly 1 analysis in 8 fails at extracting (never a
 * retried one). Scoring really rescores the lead, so the leads list, the card and the activity feed change.
 */
import type { DocumentOut, RunOut, SourceType } from "@/api/generated/model"

import { fillerDocuments } from "../data/documents"
import { nextId } from "../data/ids"
import {
  EU_COUNTRIES,
  NIS2_ANNEX,
  DORA_INDUSTRIES,
  REJECT_REASONS,
} from "../data/meta"
import { between, hash, pick, prng } from "../data/prng"
import { CATEGORY_TEMPLATES, fill, QUESTION_TEMPLATES } from "../data/templates"
import { iso } from "../data/time"
import { db, emitRunEvent } from "../db"
import { runFinishedEvent, signalDetectedEvent } from "../engine/activity"
import { derivedTexts, evidenceKey, sourcesOf } from "../engine/evidence"
import {
  activeQuestions,
  currentScore,
  effectiveParams,
  rescoreLead,
} from "../engine/scoring"
import {
  companyTimeline,
  runStatusOf,
  type CompanyOutcome,
  type TimelineHooks,
} from "../engine/timeline"
import { schedule } from "../settings"
import type { SignalRecord } from "../types"

export const WORKER_CONCURRENCY = 3
export const FAIL_MESSAGE =
  "LLM output failed validation: the response was not valid JSON"

const ACTIVE = ["queued", "running", "pending"]

export function isTerminal(status: string): boolean {
  return !ACTIVE.includes(status)
}

function findRun(runId: string): RunOut | undefined {
  return db.runs.find((r) => r.id === runId)
}

/** Queues the companies of a run (new run or retry) and starts free worker slots. */
export function enqueueCompanies(
  run: RunOut,
  companyIds: string[],
  opts: { mode: "incremental" | "full"; retried?: boolean }
): void {
  const rt = (db.runtime[run.id] ??= {
    pending: [],
    active: [],
    mode: opts.mode,
    serviceIds: [...run.params.service_ids],
    retried: [],
  })
  rt.mode = opts.mode
  rt.pending.push(...companyIds)
  if (opts.retried) rt.retried.push(...companyIds)
  pump(run.id)
}

function pump(runId: string): void {
  const rt = db.runtime[runId]
  if (!rt) return
  while (rt.active.length < WORKER_CONCURRENCY && rt.pending.length) {
    const companyId = rt.pending.shift() as string
    rt.active.push(companyId)
    schedule(
      () => startCompany(runId, companyId),
      300 + (hash(runId + companyId) % 400)
    )
  }
}

function release(runId: string, companyId: string): void {
  const rt = db.runtime[runId]
  if (rt) rt.active = rt.active.filter((id) => id !== companyId)
}

function startCompany(runId: string, companyId: string): void {
  const run = findRun(runId)
  const rt = db.runtime[runId]
  if (!run || !rt) return
  if (run.status === "cancelled") {
    release(runId, companyId) // not started yet: skipped silently
    return
  }
  if (run.status === "queued") {
    run.status = "running"
    run.started_at ??= iso(Date.now())
  }
  const company = db.companies.find((c) => c.id === companyId)
  const serviceIds = rt.serviceIds.length
    ? rt.serviceIds.filter((id) => db.services.some((s) => s.id === id))
    : db.services.filter((s) => s.is_active).map((s) => s.id)
  if (!company || !serviceIds.length) {
    const message = company
      ? "LookupError: No active services to analyze"
      : `LookupError: Company ${companyId} not found`
    emitRunEvent(runId, {
      event: "company.done",
      company_id: company ? companyId : null,
      data: { company_id: companyId, status: "failed", message, scores: [] },
    })
    complete(runId, companyId, { status: "failed", message, scores: [] })
    return
  }

  db.analysisSeq += 1
  const fail = !rt.retried.includes(companyId) && db.analysisSeq % 8 === 5
  const gen = companyTimeline(
    { companyId, serviceIds, fail, failMessage: FAIL_MESSAGE },
    liveHooks(runId, companyId, serviceIds, rt.mode, fail)
  )
  const rand = prng(`${runId}:${companyId}:${db.analysisSeq}`)
  const tick = () => {
    const current = findRun(runId)
    if (!current) return
    if (current.status === "cancelled") {
      // The worker notices the cancel at the next stage event (visible on replay only).
      emitRunEvent(runId, {
        event: "company.done",
        company_id: companyId,
        data: {
          company_id: companyId,
          status: "cancelled",
          message: "Run cancelled",
          scores: [],
        },
      })
      release(runId, companyId)
      return
    }
    const step = gen.next()
    if (step.done) {
      complete(runId, companyId, step.value)
      return
    }
    if (
      step.value.event === "company.done" &&
      step.value.data.status === "done"
    ) {
      company.last_analyzed_at = iso(Date.now())
      company.updated_at = company.last_analyzed_at
    }
    emitRunEvent(runId, step.value)
    schedule(tick, between(rand, 400, 700))
  }
  schedule(tick, between(rand, 400, 700))
}

function complete(
  runId: string,
  companyId: string,
  outcome: CompanyOutcome
): void {
  release(runId, companyId)
  const run = findRun(runId)
  if (!run || run.status === "cancelled") return
  const progress = { ...run.progress }
  if (outcome.status === "failed") {
    progress.failed += 1
    run.error ??= outcome.message
  } else progress.done += 1
  run.progress = progress
  emitRunEvent(runId, {
    event: "run.progress",
    company_id: null,
    data: { ...progress },
  })
  if (
    progress.done + progress.failed + progress.paused >= progress.total &&
    !isTerminal(run.status)
  ) {
    const status = runStatusOf(progress)
    run.status = status
    run.finished_at = iso(Date.now())
    db.events.push(runFinishedEvent(db, run.id, status, progress, new Date()))
    emitRunEvent(runId, {
      event: "run.finished",
      company_id: null,
      data: { status, ...progress },
    })
    delete db.runtime[runId]
    return
  }
  pump(runId)
}

/** Cancels an active run: run.finished {status: cancelled} now, running companies stop at their next step. */
export function cancelRun(run: RunOut): void {
  run.status = "cancelled"
  run.finished_at = iso(Date.now())
  const rt = db.runtime[run.id]
  if (rt) rt.pending = []
  db.events.push(
    runFinishedEvent(db, run.id, "cancelled", run.progress, new Date())
  )
  emitRunEvent(run.id, {
    event: "run.finished",
    company_id: null,
    data: { status: "cancelled", ...run.progress },
  })
}

// --- what the worker "finds" ------------------------------------------------------------------------------

interface PlannedSignal {
  record: SignalRecord
}

function liveHooks(
  runId: string,
  companyId: string,
  serviceIds: string[],
  mode: "incremental" | "full",
  fail: boolean
): TimelineHooks {
  const company = db.companies.find((c) => c.id === companyId)
  if (!company) throw new Error("company vanished")
  const firstTime = !company.last_analyzed_at
  const rand = prng(`${companyId}:${db.analysisSeq}`)
  const now = () => new Date()
  let newDocs: DocumentOut[] = []
  const planned = new Map<string, PlannedSignal[]>()
  const docSeq = () => nextId(db)

  const planSignal = (
    serviceId: string,
    questionKey: string,
    docType: SourceType,
    doc: DocumentOut,
    t: { quote: string; summary: string; strength: SignalRecord["strength"] }
  ) => {
    const question = activeQuestions(db, serviceId).find(
      (q) => q.key === questionKey
    )
    if (!question) return
    const { params } = effectiveParams(db, serviceId)
    const confidence = Math.round((0.62 + rand() * 0.3) * 100) / 100
    const reliability = params.reliability[docType] ?? 0.8
    const record: SignalRecord = {
      id: nextId(db),
      company_id: companyId,
      service_id: serviceId,
      question_id: question.id,
      category: question.category,
      document_id: doc.id,
      quote: t.quote,
      summary: t.summary,
      strength: t.strength,
      confidence,
      url: doc.url,
      source_name:
        docType === "jobs"
          ? "Careers page"
          : docType === "news"
            ? "Business press"
            : company.domain,
      source_type: docType,
      event_date: doc.published_at ? doc.published_at.slice(0, 10) : null,
      published_at: doc.published_at,
      flags: [],
      status: "active",
      detected_at: "",
      evidence_key: evidenceKey(question.key, t.quote, doc.url),
      factor: reliability * 0.92,
      run_id: runId,
    }
    const list = planned.get(serviceId) ?? []
    list.push({ record })
    planned.set(serviceId, list)
  }

  const docFor = (type: SourceType, title: string): DocumentOut => {
    const at = Date.now()
    const published =
      at - between(rand, 1, type === "jobs" ? 20 : 60) * 86_400_000
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60)
    const url =
      type === "jobs"
        ? `https://www.${company.domain}/careers/jobs/${slug}`
        : type === "news"
          ? `https://news.example.org/${company.domain}/${slug}`
          : `https://www.${company.domain}/${slug}`
    const doc: DocumentOut = {
      id: docSeq(),
      company_id: companyId,
      source_type: type,
      source_name:
        type === "jobs"
          ? (company.ats?.kind ?? "careers_page")
          : type === "news"
            ? "google_news"
            : type === "report"
              ? "annual_report"
              : "website",
      url,
      canonical_url: url,
      title,
      published_at: iso(published),
      fetched_at: iso(at),
      language: "en",
    }
    return doc
  }

  return {
    resolve: () => {
      if (!company.resolved_at) company.resolved_at = iso(Date.now())
      return { domain: company.domain, own_domains: [...company.own_domains] }
    },
    sources: () => sourcesOf(db, serviceIds),
    collect: () => {
      const counts: Partial<Record<SourceType, number>> = firstTime
        ? {
            jobs: between(rand, 8, 16),
            news: between(rand, 4, 10),
            website: between(rand, 3, 6),
            report: between(rand, 0, 1),
            registry: 1,
          }
        : {
            jobs: between(rand, 0, 3),
            news: between(rand, 0, 2),
            website: rand() < 0.3 ? 1 : 0,
          }
      const ctx = {
        companyId,
        name: company.name,
        domain: company.domain,
        city: company.hq_city,
        lang: "en",
        atsKind: company.ats?.kind ?? null,
        nextId: docSeq,
        now: now(),
        recentFetch: 99,
        recentHours: 0.02,
        maxAgeDays: firstTime ? 365 : 20,
        seed: String(db.analysisSeq),
      }
      newDocs = (Object.entries(counts) as [SourceType, number][]).flatMap(
        ([type, n]) => fillerDocuments(ctx, type, n)
      )
      // Evidence: a first analysis finds 2–4 signals per service; a re-check sometimes finds one new signal.
      for (const serviceId of serviceIds) {
        const had = currentScore(db, companyId, serviceId)
        const questions = activeQuestions(db, serviceId)
        const positives = questions.filter((q) => q.polarity === "positive")
        const wanted =
          firstTime || !had
            ? between(rand, 2, 4)
            : newDocs.length && rand() < 0.4
              ? 1
              : 0
        const chosen = [...positives]
          .sort(
            (a, b) =>
              hash(company.domain + a.key) - hash(company.domain + b.key)
          )
          .slice(0, wanted)
        if ((firstTime || !had) && rand() < 0.35) {
          const negatives = questions.filter((q) => q.polarity === "negative")
          if (negatives.length) chosen.push(pick(rand, negatives))
        }
        for (const q of chosen) {
          const templates = QUESTION_TEMPLATES[q.key] ?? [
            CATEGORY_TEMPLATES[q.category],
          ]
          const t = pick(rand, templates)
          const quote = fill(t.quote, company.name, company.hq_city)
          const summary = fill(t.summary, company.name, company.hq_city)
          if (
            db.signals.some(
              (s) =>
                s.company_id === companyId &&
                s.service_id === serviceId &&
                s.quote === quote
            )
          )
            continue
          const type: SourceType =
            t.type === "derived" || t.type === "manual" ? "website" : t.type
          const doc = docFor(
            type,
            type === "jobs" ? quote : (t.title ?? summary)
          )
          newDocs.push(doc)
          planSignal(serviceId, q.key, type, doc, {
            quote,
            summary,
            strength: t.strength,
          })
        }
        // NIS2 / DORA scope from firmographics (persisted with the extraction, backend verify node).
        const compliance = questions.find(
          (q) => q.category === "compliance" && q.polarity === "positive"
        )
        if (
          compliance &&
          (firstTime || !had) &&
          EU_COUNTRIES.includes(company.country_code ?? "")
        ) {
          const kinds: ("nis2" | "dora")[] = []
          if (
            company.industry_ids.some((i) => NIS2_ANNEX[i]) &&
            ((company.employees ?? 0) >= 50 ||
              (company.revenue_eur ?? 0) > 10_000_000)
          )
            kinds.push("nis2")
          if (company.industry_ids.some((i) => DORA_INDUSTRIES.includes(i)))
            kinds.push("dora")
          for (const kind of kinds) {
            const t = derivedTexts(company, kind)
            const record: SignalRecord = {
              id: nextId(db),
              company_id: companyId,
              service_id: serviceId,
              question_id: compliance.id,
              category: compliance.category,
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
              detected_at: "",
              evidence_key: evidenceKey(compliance.key, t.quote, t.url),
              factor: 0.7,
              run_id: runId,
            }
            const list = planned.get(serviceId) ?? []
            list.push({ record })
            planned.set(serviceId, list)
          }
        }
      }
      db.documents.push(...newDocs)
      const out: Record<string, number> = {}
      for (const d of newDocs)
        out[d.source_type] = (out[d.source_type] ?? 0) + 1
      return out
    },
    index: () => ({
      documents: newDocs.length,
      snippets: newDocs.length * 7 + between(rand, 0, 6),
    }),
    prefilter: (serviceId) => {
      const loaded =
        db.documents.filter((d) => d.company_id === companyId).length * 6
      const selected = Math.min(
        40,
        Math.max(newDocs.length ? 3 : 0, Math.round(loaded * 0.3))
      )
      return {
        loaded,
        after_entity_filter: Math.round(loaded * 0.72),
        candidates_before_budget: Math.round(loaded * 0.45),
        selected,
        estimated_tokens: selected * 185,
        skip:
          !fail &&
          mode === "incremental" &&
          newDocs.length === 0 &&
          !!currentScore(db, companyId, serviceId),
      }
    },
    extract: () => {
      const main = db.usage.find((m) => m.pool === "main")
      if (main) {
        main.calls += 1
        main.input_tokens += 7400
        main.output_tokens += 640
      }
      return { llm_calls: 1, blocked: false }
    },
    verify: (serviceId) => {
      const at = new Date()
      for (const { record } of planned.get(serviceId) ?? []) {
        record.detected_at = iso(at)
        db.signals.push(record)
        if (record.source_type !== "derived")
          db.events.push(signalDetectedEvent(db, record, at))
      }
      const rejected = between(rand, 0, 2)
      if (rejected) {
        const bucket = (db.rejectedEvidence[serviceId] ??= {})
        for (let i = 0; i < rejected; i += 1) {
          const reason = pick(rand, REJECT_REASONS.slice(0, 4))
          bucket[reason] = (bucket[reason] ?? 0) + 1
        }
      }
      const verified = db.signals.filter(
        (s) =>
          s.company_id === companyId &&
          s.service_id === serviceId &&
          s.status === "active"
      ).length
      return { verified, rejected }
    },
    score: (serviceId) => {
      const { score } = rescoreLead(db, companyId, serviceId, new Date(), {
        tierEvent: true,
        runId,
      })
      return { priority: score.priority, tier: score.tier }
    },
  }
}
