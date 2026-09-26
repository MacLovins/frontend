/**
 * Internal records of the in-memory mock backend. Everything the API returns is built from these and typed
 * with the generated models (`@/api/generated/model`) at the handler boundary.
 */
import type {
  CompanyOut,
  DisqualificationRuleOut,
  DocumentOut,
  DomainEventOut,
  ICPProfileOut,
  LeadCardScore,
  LeadVerdict,
  OutreachChannel,
  OutreachJobOut,
  OutreachTone,
  RunOut,
  ScoringProfileOut,
  ServiceOut,
  SignalCategory,
  SignalFlag,
  SignalQuestionOut,
  SignalVerdict,
  SourceType,
  Strength,
  UserOut,
} from "@/api/generated/model"

export type SignalStatus = "active" | "superseded" | "rejected_by_user"

export interface UserRecord extends UserOut {
  org_id: string
  password: string
  created_at: string
}

export interface SignalRecord {
  id: string
  company_id: string
  service_id: string
  question_id: string
  /** Category of the question when the signal was extracted (quality metrics group by it). */
  category: SignalCategory
  document_id: string | null
  quote: string
  summary: string
  strength: Strength
  confidence: number
  url: string | null
  source_name: string
  source_type: SourceType
  event_date: string | null
  published_at: string | null
  flags: SignalFlag[]
  status: SignalStatus
  detected_at: string
  /** Same evidence across runs (backend: sha256 of question key, normalized quote and URL). */
  evidence_key: string
  /**
   * Source reliability × freshness folded into one number, so the value of the evidence is
   * `strength_values[strength] × confidence × factor` (backend ai/scoring/decay.py).
   */
  factor: number
  run_id: string | null
}

export interface ScoreRecord extends LeadCardScore {
  id: string
  company_id: string
  service_id: string
  is_current: boolean
  computed_at: string
}

export interface FeedbackRecord {
  id: string
  user_id: string
  target_type: "signal" | "lead"
  target_id: string
  service_id: string
  verdict: SignalVerdict | LeadVerdict
  reason: string | null
  created_at: string
  updated_at: string
}

export type RunEventName =
  "run.progress" | "run.finished" | "company.stage" | "company.done"

export interface RunEventRecord {
  /** Global, strictly increasing across runs (backend run_event.id). */
  id: number
  run_id: string
  company_id: string | null
  event: RunEventName
  data: Record<string, unknown>
}

/** Worker state of an active run (which companies wait, which are being analyzed). */
export interface RunRuntime {
  pending: string[]
  active: string[]
  mode: "incremental" | "full"
  serviceIds: string[]
  /** Retried companies never fail again, so retry-failed is always demoable. */
  retried: string[]
}

export interface OutreachRequest {
  service_id: string
  channel: OutreachChannel
  language: string
  tone: OutreachTone
  sender_name: string | null
  sender_title: string | null
  sender_company: string
}

export interface OutreachJobRecord {
  job: OutreachJobOut
  request: OutreachRequest
}

/** Seeded, aggregated signal votes (historic labels not tied to stored signals). */
export interface QualityCell {
  service_id: string
  category: string
  source_type: string
  labeled: number
  correct: number
}

export interface DiscoveryCandidate {
  name: string
  domain: string
  country_code: string | null
  industry_ids: string[]
  employees: number | null
  revenue_eur: number | null
  wikidata_qid: string | null
  lei: string | null
  crunchbase_id: string | null
}

export interface ModelUsageCounters {
  model: string
  pool: "main" | "cheap"
  calls: number
  cache_hits: number
  errors: number
  input_tokens: number
  output_tokens: number
  rpd_limit: number
  rpm_limit: number
}

export interface DbState {
  org: { id: string; name: string }
  users: UserRecord[]
  /** The signed-in user (the backend keeps it in the httpOnly `lr_session` cookie). */
  sessionUserId: string | null
  /** Failed login timestamps (ms) per lower-cased e-mail, for the 5-per-minute limit. */
  loginFailures: Record<string, number[]>
  services: ServiceOut[]
  questions: SignalQuestionOut[]
  icps: ICPProfileOut[]
  rules: DisqualificationRuleOut[]
  /** Every version of every scoring profile; `is_current` marks the live one. */
  profiles: ScoringProfileOut[]
  companies: CompanyOut[]
  documents: DocumentOut[]
  signals: SignalRecord[]
  /** Every lead score ever computed; `is_current` marks the live one per (company, service). */
  scores: ScoreRecord[]
  feedback: FeedbackRecord[]
  /** Activity feed (outbox events), in insertion order. */
  events: DomainEventOut[]
  runs: RunOut[]
  runEvents: RunEventRecord[]
  runEventSeq: number
  runtime: Record<string, RunRuntime>
  outreachJobs: OutreachJobRecord[]
  candidates: DiscoveryCandidate[]
  qualityBaseline: QualityCell[]
  /** Evidence rejected by the verifier, per service and reason. */
  rejectedEvidence: Record<string, Record<string, number>>
  /** Historic signal rows (older runs) that are not stored individually, per service. */
  historicEvidence: Record<string, number>
  usage: ModelUsageCounters[]
  /** Sequence for ids created at runtime (deterministic across resets). */
  idSeq: number
  /** Company analyses started so far; every 8th one fails at extracting. */
  analysisSeq: number
}
