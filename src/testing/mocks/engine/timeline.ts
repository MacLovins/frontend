/**
 * The per-company event sequence of an analysis (backend ai/pipeline/nodes.py + core/worker/tasks.py), as a
 * generator so the live worker can emit one event per timer tick and the seed can replay whole runs.
 * Hooks do the actual work: the live worker mutates the store, the seed only reads it.
 */
import type { Tier } from "@/api/generated/model"

import type { RunEventName } from "../types"

export interface EmitSpec {
  event: RunEventName
  company_id: string | null
  data: Record<string, unknown>
}

export interface PrefilterStats {
  loaded: number
  after_entity_filter: number
  candidates_before_budget: number
  selected: number
  estimated_tokens: number
  skip: boolean
}

export interface TimelineHooks {
  resolve(): { domain: string; own_domains: string[] }
  sources(): string[]
  collect(): Record<string, number>
  index(): { documents: number; snippets: number }
  prefilter(serviceId: string): PrefilterStats
  extract(serviceId: string): { llm_calls: number; blocked: boolean }
  verify(serviceId: string): { verified: number; rejected: number }
  score(serviceId: string): { priority: number; tier: Tier }
}

export interface CompanyPlan {
  companyId: string
  serviceIds: string[]
  /** Every service fails at extracting (the company then ends as failed). */
  fail: boolean
  failMessage: string
}

export interface CompanyOutcome {
  status: "done" | "failed"
  message: string
  scores: { service_id: string; priority: number; tier: Tier }[]
}

/** Python prints floats with at least one decimal: 72.5 → "72.5", 71 → "71.0". */
export function pyFloat(x: number): string {
  return Number.isInteger(x) ? x.toFixed(1) : String(x)
}

function describeCounts(counts: Record<string, number>): string {
  const parts = Object.keys(counts)
    .sort()
    .map((k) => `${counts[k]} ${k}`)
  return parts.join(", ") || "no new documents"
}

function stage(
  companyId: string,
  serviceId: string | null,
  name: string,
  status: string,
  message = "",
  extra: Record<string, unknown> = {}
): EmitSpec {
  return {
    event: "company.stage",
    company_id: companyId,
    data: {
      company_id: companyId,
      service_id: serviceId,
      stage: name,
      status,
      message,
      ...extra,
    },
  }
}

/**
 * Yields every company.stage event, then the company.done event; returns the outcome. Run-level events
 * (run.progress, run.finished) are the caller's job.
 */
export function* companyTimeline(
  plan: CompanyPlan,
  hooks: TimelineHooks
): Generator<EmitSpec, CompanyOutcome, void> {
  const id = plan.companyId
  yield stage(id, null, "resolving", "started")
  const resolved = hooks.resolve()
  yield stage(id, null, "resolving", "done", "", {
    domain: resolved.domain,
    own_domains: resolved.own_domains,
  })

  yield stage(id, null, "collecting", "started", "", {
    sources: hooks.sources(),
  })
  const counts = hooks.collect()
  yield stage(id, null, "collecting", "done", describeCounts(counts), counts)

  yield stage(id, null, "indexing", "started")
  const indexed = hooks.index()
  yield stage(
    id,
    null,
    "indexing",
    "done",
    `${indexed.documents} new documents, ${indexed.snippets} snippets`,
    {
      documents: indexed.documents,
      snippets: indexed.snippets,
    }
  )

  // Service-level stages run in parallel per service: their events interleave.
  const live = [...plan.serviceIds]
  const skipped = new Set<string>()
  const failed: string[] = []
  for (const s of live) yield stage(id, s, "prefiltering", "started")
  for (const s of live) {
    const pre = hooks.prefilter(s)
    if (pre.skip) skipped.add(s)
    const { skip, ...stats } = pre
    yield stage(
      id,
      s,
      "prefiltering",
      "done",
      skip ? "Nothing new to check" : `${pre.selected} snippets selected`,
      stats
    )
  }

  const extracting = live.filter((s) => !skipped.has(s))
  for (const s of extracting) yield stage(id, s, "extracting", "started")
  for (const s of extracting) {
    if (plan.fail) {
      failed.push(s)
      yield stage(
        id,
        s,
        "failed",
        "failed",
        `extracting: ${plan.failMessage}`,
        { step: "extracting" }
      )
      continue
    }
    const ex = hooks.extract(s)
    yield stage(id, s, "extracting", "done", "", {
      llm_calls: ex.llm_calls,
      blocked: ex.blocked,
    })
  }

  const verifying = extracting.filter((s) => !failed.includes(s))
  for (const s of verifying) yield stage(id, s, "verifying", "started")
  for (const s of verifying) {
    const v = hooks.verify(s)
    yield stage(
      id,
      s,
      "verifying",
      "done",
      `${v.verified} verified signals, ${v.rejected} rejected`
    )
  }

  const scoring = live.filter((s) => !failed.includes(s))
  const scores: CompanyOutcome["scores"] = []
  for (const s of scoring) yield stage(id, s, "scoring", "started")
  for (const s of scoring) {
    const sc = hooks.score(s)
    scores.push({ service_id: s, priority: sc.priority, tier: sc.tier })
    yield stage(
      id,
      s,
      "scoring",
      "done",
      `Priority ${pyFloat(sc.priority)} (${sc.tier})`,
      {
        priority: sc.priority,
        tier: sc.tier,
      }
    )
  }

  let summary = `${scores.length} services scored`
  if (failed.length) summary += `, ${failed.length} failed`
  yield stage(id, null, "done", "done", summary, {
    scores,
    failed_services: failed,
    paused_services: [],
  })

  const outcome: CompanyOutcome =
    failed.length && !scores.length
      ? {
          status: "failed",
          message: failed
            .map(() => `extracting: ${plan.failMessage}`)
            .join("; "),
          scores,
        }
      : { status: "done", message: "", scores }
  yield {
    event: "company.done",
    company_id: id,
    data: {
      company_id: id,
      status: outcome.status,
      message: outcome.message,
      scores: outcome.scores,
    },
  }
  return outcome
}

export function runStatusOf(progress: {
  done: number
  total: number
  failed: number
  paused: number
}) {
  if (progress.done === progress.total) return "succeeded" as const
  if (progress.done === 0 && progress.paused === 0) return "failed" as const
  return "partial" as const
}
