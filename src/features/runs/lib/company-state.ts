import { format, parseISO } from "date-fns"

import type { RunStatus } from "@/api/generated/model"
import type {
  CompanyDoneData,
  CompanyStageData,
  StageName,
} from "@/api/run-events"
import type { CompanyProgress, RunLogEntry } from "@/hooks/use-run-events"
import { runStages, type RunStage } from "@/lib/labels"

import { copy } from "../copy"

/** How a company's row looks: the pill and the colour of the current step. */
export type CompanyTone =
  "queued" | "running" | "paused" | "failed" | "cancelled" | "done"

export type CompanyView = {
  tone: CompanyTone
  /** Index of the highlighted step; steps before it are complete. `null`: all complete (done) or all pending. */
  current: number | null
}

const LAST_STEP = runStages.length - 1
/** Shortlist: the first step that runs per service, in parallel for every service. */
const FIRST_SERVICE_STEP = runStages.indexOf("prefiltering")

function stageIndex(stage: StageName | string) {
  return runStages.indexOf(stage as RunStage)
}

type LogFacts = {
  /**
   * Per-service failures and quota pauses arrive as `stage: "failed" | "paused"` with the stage that stopped in
   * `data.step` (backend ai/pipeline/nodes.py). The progress hook keeps only the stage, so the step is read from
   * the log: `{ companyId: { serviceId: stepIndex } }`.
   */
  stopped: Record<string, Record<string, number>>
  /**
   * Companies whose latest event is a stage event: a retried company works again, and the `company.done` of
   * its previous attempt, which the progress hook keeps, no longer describes it.
   */
  working: Set<string>
}

export function logFacts(log: RunLogEntry[]): LogFacts {
  const stopped: LogFacts["stopped"] = {}
  const latestIsStage = new Map<string, boolean>()
  for (const { event } of log) {
    if (event.event === "company.done") {
      latestIsStage.set(event.data.company_id, false)
      continue
    }
    if (event.event !== "company.stage") continue
    const {
      company_id: companyId,
      service_id: serviceId,
      stage,
      step,
    } = event.data
    latestIsStage.set(companyId, true)
    if (
      !serviceId ||
      (stage !== "failed" && stage !== "paused") ||
      typeof step !== "string"
    )
      continue
    const index = stageIndex(step)
    if (index >= 0)
      stopped[companyId] = { ...stopped[companyId], [serviceId]: index }
  }
  const working = new Set<string>()
  latestIsStage.forEach((isStage, companyId) => {
    if (isStage) working.add(companyId)
  })
  return { stopped, working }
}

/** A failed service's message starts with the failing stage: "extracting: …" (backend ai/pipeline/nodes.py). */
function stepFromMessage(message: string) {
  const stage = /^([a-z]+):/.exec(message)?.[1]
  const index = stage ? stageIndex(stage) : -1
  return index >= 0 ? index : undefined
}

/**
 * The first step the company has not passed (SPEC reducer): Resolve, Collect and Index are company-level; from
 * Shortlist on every service moves on its own and the company is as far as its slowest service. Services without
 * events yet count as waiting at Shortlist. Skipped steps (incremental mode, "Nothing new to check") are passed
 * over because a service's latest stage only moves forward.
 */
function progressStep(
  company: CompanyProgress,
  serviceCount: number,
  stopped: Record<string, number> = {}
) {
  const services = Object.values(company.services)
  if (services.length === 0) {
    const index = company.stage ? stageIndex(company.stage) : -1
    if (index < 0) return 0
    return Math.min(index + (company.status === "done" ? 1 : 0), LAST_STEP)
  }
  const steps = services.map((service) => {
    if (service.stage === "failed" || service.stage === "paused") {
      return (
        stopped[service.serviceId] ??
        stepFromMessage(service.message) ??
        FIRST_SERVICE_STEP
      )
    }
    const index =
      stageIndex(service.stage) + (service.status === "done" ? 1 : 0)
    return Math.max(index, FIRST_SERVICE_STEP)
  })
  if (services.length < serviceCount) steps.push(FIRST_SERVICE_STEP)
  return Math.min(Math.min(...steps), LAST_STEP)
}

/** `outcome`: the company's `company.done` in this run, `null` while it (again) works. */
export function companyView(
  company: CompanyProgress | undefined,
  outcome: CompanyDoneData | null,
  serviceCount: number,
  stopped: Record<string, number> | undefined,
  runStatus: RunStatus
): CompanyView {
  if (!company)
    return {
      tone: runStatus === "cancelled" ? "cancelled" : "queued",
      current: null,
    }

  const current = progressStep(company, serviceCount, stopped)
  switch (outcome?.status) {
    case "done":
      return { tone: "done", current: null }
    case "paused":
    case "failed":
    case "cancelled":
      return { tone: outcome.status, current }
  }
  // Workers stop a cancelled run's companies without a `company.done` when they had not started a new step.
  return { tone: runStatus === "cancelled" ? "cancelled" : "running", current }
}

export type MessageContext = {
  sourceLabel: (source: string) => string
  serviceLabel: (serviceId: string) => string
  tierLabel: (tier: string) => string
}

/** The backend message, or one built from the event's own fields when the backend leaves it empty. */
function stageMessage(data: CompanyStageData, context: MessageContext): string {
  // The backend writes "Priority 72.5 (hot)"; the UI rounds scores and names tiers.
  if (
    data.status === "done" &&
    data.stage === "scoring" &&
    typeof data.priority === "number" &&
    typeof data.tier === "string"
  ) {
    return copy.message.priority(
      Math.round(data.priority),
      context.tierLabel(data.tier)
    )
  }
  if (data.message) return data.message
  if (
    data.status === "done" &&
    data.stage === "resolving" &&
    typeof data.domain === "string"
  ) {
    return copy.message.resolved(
      data.domain,
      Array.isArray(data.own_domains) ? data.own_domains.length : 0
    )
  }
  if (
    data.status === "started" &&
    data.stage === "collecting" &&
    Array.isArray(data.sources)
  ) {
    const sources = data.sources.filter(
      (source): source is string => typeof source === "string"
    )
    return sources.length > 0
      ? copy.message.collecting(sources.map(context.sourceLabel).join(", "))
      : ""
  }
  if (
    data.status === "done" &&
    data.stage === "extracting" &&
    typeof data.llm_calls === "number"
  ) {
    return copy.message.aiCalls(data.llm_calls)
  }
  return ""
}

/** Latest stage message per company, service-level ones prefixed with the service ("IA · 37 snippets selected"). */
export function latestMessages(log: RunLogEntry[], context: MessageContext) {
  const messages: Record<string, string> = {}
  for (const { event } of log) {
    if (event.event !== "company.stage") continue
    const text = stageMessage(event.data, context)
    if (!text) continue
    const serviceId = event.data.service_id
    messages[event.data.company_id] = serviceId
      ? `${context.serviceLabel(serviceId)} · ${text}`
      : text
  }
  return messages
}

/** The line under a company's stepper. `resetsAt`: when the daily AI quota comes back (GET /meta/usage). */
export function companyMessage(
  company: CompanyProgress | undefined,
  outcome: CompanyDoneData | null,
  latest: string | undefined,
  tone: CompanyTone,
  context: MessageContext,
  resetsAt: string | null | undefined
) {
  if (!company)
    return tone === "cancelled" ? copy.message.notStarted : copy.message.queued
  const fallback = latest ?? company.message
  if (outcome?.status === "done") {
    const scores = (outcome.scores ?? []).map(
      (item) =>
        `${context.serviceLabel(item.service_id)} ${Math.round(item.priority)} ${context.tierLabel(item.tier)}`
    )
    return scores.length > 0
      ? copy.message.result(scores.join(" · "))
      : fallback
  }
  if (outcome?.status === "paused") {
    return resetsAt
      ? copy.message.pausedUntil(format(parseISO(resetsAt), "HH:mm"))
      : copy.message.pausedAuto
  }
  return outcome?.message || fallback
}
