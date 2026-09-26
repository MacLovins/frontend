/**
 * Feedback and quality (backend core/modules/feedback/router.py) and the activity feed
 * (core/modules/activity/router.py).
 *
 * A signal vote is an upsert per (user, target). The signal's status follows every user's votes on the same
 * evidence: any "incorrect" → rejected_by_user (it disappears from the card) and the company is rescored in
 * the same request (no lead.tier_changed event for feedback rescoring).
 */
import type {
  CategoryQuality,
  DomainEventOut,
  FeedbackOut,
  FeedbackWithdrawOut,
  LeadFeedbackIn,
  QualityMetricsOut,
  ScoreSummary,
  SignalFeedbackIn,
  SourceQuality,
} from "@/api/generated/model"

import { nextId } from "../data/ids"
import { isoNow } from "../data/time"
import { db } from "../db"
import { feedbackCreatedEvent } from "../engine/activity"
import { currentScore, rescoreLead } from "../engine/scoring"
import type { AuthedCtx } from "./http"
import type { FeedbackRecord, SignalRecord } from "../types"
import { companyOrThrow } from "./accounts"
import {
  fail,
  json,
  pathUuid,
  queryInt,
  queryUuid,
  readJson,
  route,
  validateBody,
} from "./http"
import { scoreSummary } from "./leads"

function signalOrThrow(id: string): SignalRecord {
  const signal = db.signals.find((s) => s.id === id)
  if (!signal) throw fail.notFound("Signal not found")
  return signal
}

function summaryOf(companyId: string, serviceId: string): ScoreSummary | null {
  const score = currentScore(db, companyId, serviceId)
  return score ? scoreSummary(score) : null
}

function upsert(
  ctx: AuthedCtx,
  targetType: "signal" | "lead",
  targetId: string,
  serviceId: string,
  verdict: FeedbackRecord["verdict"],
  reason: string | null
): FeedbackRecord {
  const now = isoNow()
  const existing = db.feedback.find(
    (f) =>
      f.user_id === ctx.user.id &&
      f.target_type === targetType &&
      f.target_id === targetId
  )
  if (existing) {
    Object.assign(existing, {
      verdict,
      reason,
      service_id: serviceId,
      updated_at: now,
    })
    return existing
  }
  const created: FeedbackRecord = {
    id: nextId(db),
    user_id: ctx.user.id,
    target_type: targetType,
    target_id: targetId,
    service_id: serviceId,
    verdict,
    reason,
    created_at: now,
    updated_at: now,
  }
  db.feedback.push(created)
  return created
}

/** Status follows the votes on the same evidence; rescore when something changed. */
function syncAndScore(signal: SignalRecord): ScoreSummary | null {
  const same = db.signals.filter(
    (s) =>
      s.company_id === signal.company_id &&
      s.service_id === signal.service_id &&
      s.evidence_key === signal.evidence_key
  )
  const ids = new Set(same.map((s) => s.id))
  const rejected = db.feedback.some(
    (f) =>
      f.target_type === "signal" &&
      f.verdict === "incorrect" &&
      ids.has(f.target_id)
  )
  const status = rejected ? "rejected_by_user" : "active"
  let changed = false
  for (const s of same) {
    if (
      (s.status === "active" || s.status === "rejected_by_user") &&
      s.status !== status
    ) {
      s.status = status
      changed = true
    }
  }
  if (changed && currentScore(db, signal.company_id, signal.service_id)) {
    const { score } = rescoreLead(
      db,
      signal.company_id,
      signal.service_id,
      new Date(),
      { tierEvent: false }
    )
    return scoreSummary(score)
  }
  return summaryOf(signal.company_id, signal.service_id)
}

function feedbackOut(
  fb: FeedbackRecord,
  score: ScoreSummary | null
): FeedbackOut {
  return {
    id: fb.id,
    user_id: fb.user_id,
    target_type: fb.target_type,
    target_id: fb.target_id,
    service_id: fb.service_id,
    verdict: fb.verdict,
    reason: fb.reason,
    score,
  }
}

const precision = (correct: number, labeled: number) =>
  labeled ? Math.round((correct / labeled) * 100) / 100 : 0

function quality(serviceId: string | null): QualityMetricsOut {
  const byCategory = new Map<string, [number, number]>()
  const bySource = new Map<string, [number, number]>()
  let labeled = 0
  let correct = 0
  const add = (category: string, source: string, n: number, c: number) => {
    labeled += n
    correct += c
    for (const [map, key] of [
      [byCategory, category],
      [bySource, source],
    ] as const) {
      const bucket = map.get(key) ?? [0, 0]
      bucket[0] += n
      bucket[1] += c
      map.set(key, bucket)
    }
  }
  for (const cell of db.qualityBaseline)
    if (!serviceId || cell.service_id === serviceId)
      add(cell.category, cell.source_type, cell.labeled, cell.correct)
  for (const fb of db.feedback) {
    if (
      fb.target_type !== "signal" ||
      (serviceId && fb.service_id !== serviceId)
    )
      continue
    const signal = db.signals.find((s) => s.id === fb.target_id)
    if (!signal) continue
    const doc = signal.document_id
      ? db.documents.find((d) => d.id === signal.document_id)
      : undefined
    add(
      signal.category,
      doc?.source_type ?? signal.source_type,
      1,
      fb.verdict === "correct" ? 1 : 0
    )
  }
  const leads = db.feedback.filter(
    (f) =>
      f.target_type === "lead" && (!serviceId || f.service_id === serviceId)
  )

  const rejected: Record<string, number> = {}
  for (const [sid, reasons] of Object.entries(db.rejectedEvidence)) {
    if (serviceId && sid !== serviceId) continue
    for (const [reason, n] of Object.entries(reasons))
      rejected[reason] = (rejected[reason] ?? 0) + n
  }
  const rejectedTotal = Object.values(rejected).reduce((a, b) => a + b, 0)
  const stored = db.signals.filter(
    (s) => !serviceId || s.service_id === serviceId
  ).length
  const historic = Object.entries(db.historicEvidence)
    .filter(([sid]) => !serviceId || sid === serviceId)
    .reduce((a, [, n]) => a + n, 0)
  const evidenceTotal = stored + historic + rejectedTotal

  const categories: CategoryQuality[] = [...byCategory]
    .map(([category, [n, c]]) => ({
      category,
      labeled: n,
      precision: precision(c, n),
    }))
    .sort(
      (a, b) => b.labeled - a.labeled || a.category.localeCompare(b.category)
    )
  const sources: SourceQuality[] = [...bySource]
    .map(([source_type, [n, c]]) => ({
      source_type,
      labeled: n,
      precision: precision(c, n),
    }))
    .sort(
      (a, b) =>
        b.labeled - a.labeled || a.source_type.localeCompare(b.source_type)
    )
  return {
    labeled,
    precision: precision(correct, labeled),
    by_category: categories,
    by_source: sources,
    leads: {
      labeled: leads.length,
      good_fit: leads.filter((f) => f.verdict === "good_fit").length,
      bad_fit: leads.filter((f) => f.verdict === "bad_fit").length,
    },
    verifier: { evidence_total: evidenceTotal, rejected },
    hallucination_rate: evidenceTotal
      ? Math.round(((rejected.quote_not_found ?? 0) / evidenceTotal) * 10000) /
        10000
      : 0,
  }
}

export const feedbackHandlers = [
  route("post", "/signals/:id/feedback", async (ctx) => {
    const id = pathUuid(ctx)
    const body = validateBody<SignalFeedbackIn>(
      await readJson(ctx.request),
      {
        verdict: {
          type: "string",
          enum: ["correct", "incorrect", "irrelevant"],
          required: true,
        },
        service_id: { type: "uuid", nullable: true },
        reason: { type: "string", nullable: true },
      },
      { forbidExtra: true }
    )
    const signal = signalOrThrow(id)
    if (body.service_id && body.service_id.toLowerCase() !== signal.service_id)
      throw fail.unprocessable("service_id does not match the signal's service")
    const fb = upsert(
      ctx,
      "signal",
      signal.id,
      signal.service_id,
      body.verdict,
      body.reason ?? null
    )
    const score = syncAndScore(signal)
    db.events.push(feedbackCreatedEvent(db, fb, new Date()))
    return json<FeedbackOut>(feedbackOut(fb, score), 201)
  }),

  route("delete", "/signals/:id/feedback", (ctx) => {
    const signal = signalOrThrow(pathUuid(ctx))
    const index = db.feedback.findIndex(
      (f) =>
        f.user_id === ctx.user.id &&
        f.target_type === "signal" &&
        f.target_id === signal.id
    )
    const withdrawn = index >= 0
    if (withdrawn) db.feedback.splice(index, 1)
    const score = syncAndScore(signal)
    return json<FeedbackWithdrawOut>({ signal_id: signal.id, withdrawn, score })
  }),

  route("post", "/leads/:companyId/feedback", async (ctx) => {
    const companyId = pathUuid(ctx, "companyId")
    const body = validateBody<LeadFeedbackIn>(
      await readJson(ctx.request),
      {
        verdict: {
          type: "string",
          enum: ["good_fit", "bad_fit"],
          required: true,
        },
        service_id: { type: "uuid", required: true },
        reason: { type: "string", nullable: true },
      },
      { forbidExtra: true }
    )
    companyOrThrow(companyId)
    const serviceId = body.service_id.toLowerCase()
    if (!db.services.some((s) => s.id === serviceId))
      throw fail.notFound("Service not found")
    // one lead verdict per user and company: voting for another service moves it (backend caveat)
    const fb = upsert(
      ctx,
      "lead",
      companyId,
      serviceId,
      body.verdict,
      body.reason ?? null
    )
    db.events.push(feedbackCreatedEvent(db, fb, new Date()))
    return json<FeedbackOut>(
      feedbackOut(fb, summaryOf(companyId, serviceId)),
      201
    )
  }),

  route("get", "/quality", ({ url }) =>
    json<QualityMetricsOut>(quality(queryUuid(url, "service_id")))
  ),

  route("get", "/activity", ({ url }) => {
    const limit = queryInt(url, "limit", 50, { ge: 1, le: 100 })
    const events = [...db.events]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit)
    return json<DomainEventOut[]>(events)
  }),
]
