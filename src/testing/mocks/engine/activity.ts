/** Builders of the four outbox events of GET /activity (backend core/modules/activity/events.py). */
import type {
  FeedbackCreatedEvent,
  LeadTierChangedEvent,
  RunFinishedEvent,
  RunFinishedPayloadStatus,
  RunProgress,
  SignalDetectedEvent,
  Tier,
} from "@/api/generated/model"

import { nextId } from "../data/ids"
import { iso } from "../data/time"
import type {
  DbState,
  FeedbackRecord,
  ScoreRecord,
  SignalRecord,
} from "../types"

const r2 = (x: number) => Math.round(x * 100) / 100

function names(state: DbState, companyId: string, serviceId: string) {
  const company = state.companies.find((c) => c.id === companyId)
  const service = state.services.find((s) => s.id === serviceId)
  return {
    company_name: company?.name ?? "",
    domain: company?.domain ?? "",
    service_name: service?.name ?? "",
  }
}

export function tierChangedEvent(
  state: DbState,
  score: ScoreRecord,
  tierBefore: Tier | null,
  at: Date,
  processed = false
): LeadTierChangedEvent {
  const n = names(state, score.company_id, score.service_id)
  return {
    id: nextId(state),
    type: "lead.tier_changed",
    created_at: iso(at),
    processed_at: processed ? iso(at.getTime() + 60_000) : null,
    payload: {
      company_id: score.company_id,
      company_name: n.company_name,
      domain: n.domain,
      service_id: score.service_id,
      service_name: n.service_name,
      tier_before: tierBefore,
      tier_after: score.tier,
      priority: r2(score.priority),
      fit: r2(score.fit),
      intent: r2(score.intent),
      risk: r2(score.risk),
      disqualified: score.disqualified,
      why_now: score.why_now.slice(0, 3),
    },
  }
}

export function signalDetectedEvent(
  state: DbState,
  signal: SignalRecord,
  at: Date,
  processed = false
): SignalDetectedEvent {
  const n = names(state, signal.company_id, signal.service_id)
  const question = state.questions.find((q) => q.id === signal.question_id)
  return {
    id: nextId(state),
    type: "signal.detected",
    created_at: iso(at),
    processed_at: processed ? iso(at.getTime() + 60_000) : null,
    payload: {
      signal_id: signal.id,
      company_id: signal.company_id,
      company_name: n.company_name,
      domain: n.domain,
      service_id: signal.service_id,
      service_name: n.service_name,
      run_id: signal.run_id,
      question_id: signal.question_id,
      question_key: question?.key ?? "",
      weight: question?.weight ?? "medium",
      category: signal.category,
      polarity: question?.polarity ?? "positive",
      strength: signal.strength,
      confidence: r2(signal.confidence),
      summary: signal.summary,
      quote: signal.quote,
      url: signal.url,
      source_name: signal.source_name,
    },
  }
}

export function runFinishedEvent(
  state: DbState,
  runId: string,
  status: RunFinishedPayloadStatus,
  progress: RunProgress,
  at: Date,
  processed = false
): RunFinishedEvent {
  return {
    id: nextId(state),
    type: "run.finished",
    created_at: iso(at),
    processed_at: processed ? iso(at.getTime() + 60_000) : null,
    payload: { run_id: runId, status, progress: { ...progress } },
  }
}

export function feedbackCreatedEvent(
  state: DbState,
  fb: FeedbackRecord,
  at: Date,
  processed = false
): FeedbackCreatedEvent {
  return {
    id: nextId(state),
    type: "feedback.created",
    created_at: iso(at),
    processed_at: processed ? iso(at.getTime() + 60_000) : null,
    payload: {
      feedback_id: fb.id,
      user_id: fb.user_id,
      target_type: fb.target_type,
      target_id: fb.target_id,
      service_id: fb.service_id,
      verdict: fb.verdict,
      reason: fb.reason,
    },
  }
}
