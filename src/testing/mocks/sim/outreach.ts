/** Simulated `generate_outreach` worker job: queued → running (~0.8 s) → succeeded (~2.5 s). */
import { iso } from "../data/time"
import { db } from "../db"
import { buildDraft } from "../engine/outreach"
import { schedule } from "../settings"
import type { OutreachJobRecord } from "../types"

export const OUTREACH_RUNNING_MS = 800
export const OUTREACH_DONE_MS = 2500

export function startOutreachJob(record: OutreachJobRecord): void {
  const jobId = record.job.id
  schedule(() => {
    const current = db.outreachJobs.find((j) => j.job.id === jobId)
    if (current && current.job.status === "queued")
      current.job.status = "running"
  }, OUTREACH_RUNNING_MS)
  schedule(() => {
    const current = db.outreachJobs.find((j) => j.job.id === jobId)
    if (!current) return
    const company = db.companies.find((c) => c.id === current.job.company_id)
    const service = db.services.find((s) => s.id === current.request.service_id)
    current.job.finished_at = iso(Date.now())
    if (!company || !service) {
      current.job.status = "failed"
      current.job.error = "LookupError: Company or service no longer exists"
      return
    }
    // top 5 active signals by confidence (backend outreach/service.py)
    const questions = new Set(
      db.questions
        .filter(
          (q) =>
            q.service_id === service.id &&
            q.is_active &&
            q.polarity === "positive"
        )
        .map((q) => q.id)
    )
    const signals = db.signals
      .filter(
        (s) =>
          s.company_id === company.id &&
          s.service_id === service.id &&
          s.status === "active" &&
          questions.has(s.question_id) &&
          s.source_type !== "derived"
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
    const main = db.usage.find((m) => m.pool === "main")
    if (main) {
      main.calls += 1
      main.input_tokens += 3100
      main.output_tokens += 520
    }
    current.job.draft = buildDraft(
      company,
      service,
      signals,
      current.request,
      new Date()
    )
    current.job.status = "succeeded"
  }, OUTREACH_DONE_MS)
}
