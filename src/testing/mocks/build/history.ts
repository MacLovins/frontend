/** Seed: feedback votes, the activity feed and four past runs whose events replay over SSE. */
import type { RunOut, SourceType, Tier } from "@/api/generated/model"

import { COMPANIES } from "../data/companies"
import {
  G,
  ORG_ID,
  SERVICE_CYBER_ID,
  SERVICE_IA_ID,
  USER_ADMIN_ID,
  USER_SALES_ID,
  uuid,
} from "../data/ids"
import { hash } from "../data/prng"
import { agoMs, iso, MS } from "../data/time"
import {
  feedbackCreatedEvent,
  runFinishedEvent,
  signalDetectedEvent,
  tierChangedEvent,
} from "../engine/activity"
import { sourcesOf } from "../engine/evidence"
import { currentScore } from "../engine/scoring"
import {
  companyTimeline,
  pyFloat,
  runStatusOf,
  type EmitSpec,
  type TimelineHooks,
} from "../engine/timeline"
import type { DbState, FeedbackRecord, RunEventRecord } from "../types"
import { companyId, seededSignal } from "./evidence"

export const RECENT_RUN_ID = uuid(G.run, 4)

// --- feedback --------------------------------------------------------------------------------------

function vote(
  state: DbState,
  n: number,
  user: string,
  target: { type: "signal" | "lead"; id: string; service: string },
  verdict: FeedbackRecord["verdict"],
  reason: string | null,
  atMs: number
): FeedbackRecord {
  const fb: FeedbackRecord = {
    id: uuid(G.feedback, n),
    user_id: user,
    target_type: target.type,
    target_id: target.id,
    service_id: target.service,
    verdict,
    reason,
    created_at: iso(atMs),
    updated_at: iso(atMs),
  }
  state.feedback.push(fb)
  state.events.push(feedbackCreatedEvent(state, fb, new Date(atMs), true))
  return fb
}

function seedFeedback(state: DbState, now: Date): void {
  state.feedback = []
  const sig = (company: string, quote: string) => {
    const s = seededSignal(state, company, quote)
    return { type: "signal" as const, id: s.id, service: s.service_id }
  }
  const lead = (company: string, service: string) => ({
    type: "lead" as const,
    id: companyId(company),
    service,
  })

  vote(
    state,
    1,
    USER_ADMIN_ID,
    sig("dhl", "DHL eCommerce and a robotics"),
    "incorrect",
    "About a customer, not DHL's own operations",
    agoMs(now, { d: 23 })
  )
  vote(
    state,
    2,
    USER_ADMIN_ID,
    sig("dhl", "Concrete business processes"),
    "correct",
    null,
    agoMs(now, { d: 5, h: 2 })
  )
  vote(
    state,
    3,
    USER_ADMIN_ID,
    lead("dhl", SERVICE_IA_ID),
    "good_fit",
    "GBS team in Prague is a warm contact",
    agoMs(now, { d: 5, h: 1 })
  )
  vote(
    state,
    4,
    USER_SALES_ID,
    sig("nordhavn", "RPA Developer (UiPath)"),
    "correct",
    null,
    agoMs(now, { h: 20 })
  )
  vote(
    state,
    5,
    USER_SALES_ID,
    lead("nordhavn", SERVICE_IA_ID),
    "good_fit",
    null,
    agoMs(now, { d: 1, h: 1 })
  )
  vote(
    state,
    6,
    USER_SALES_ID,
    sig("castellane", "Castellane’s IT supplier"),
    "incorrect",
    "About another insurer",
    agoMs(now, { h: 14, m: 32 })
  )
  vote(
    state,
    7,
    USER_SALES_ID,
    sig("alpenrail", "Die Konzern-IT"),
    "incorrect",
    "Refers to the parent holding",
    agoMs(now, { h: 14, m: 31 })
  )
  vote(
    state,
    8,
    USER_SALES_ID,
    sig("meridian", "Meridian's former parent"),
    "incorrect",
    "About the former parent company",
    agoMs(now, { h: 14, m: 30 })
  )
  vote(
    state,
    9,
    USER_SALES_ID,
    lead("meridian", SERVICE_IA_ID),
    "bad_fit",
    "Hiring freeze, no budget this year",
    agoMs(now, { h: 9 })
  )
}

// --- activity ---------------------------------------------------------------------------------------

function seedActivity(state: DbState, now: Date): void {
  // Every signal detected in the last 7 days announced itself (signal.detected).
  const week = now.getTime() - 7 * MS.DAY
  for (const s of state.signals) {
    const at = new Date(s.detected_at).getTime()
    if (s.status === "active" && s.source_type !== "derived" && at >= week) {
      state.events.push(
        signalDetectedEvent(
          state,
          s,
          new Date(at),
          at < now.getTime() - 2 * MS.MINUTE
        )
      )
    }
  }
  const tier = (
    company: string,
    serviceId: string,
    before: Tier | null,
    ago: Parameters<typeof agoMs>[1],
    priority?: number
  ) => {
    const score = currentScore(state, companyId(company), serviceId)
    if (!score) return
    const at = new Date(agoMs(now, ago))
    const snapshot =
      priority === undefined
        ? score
        : {
            ...score,
            priority,
            tier:
              priority >= 65
                ? ("hot" as const)
                : priority >= 40
                  ? ("warm" as const)
                  : ("cold" as const),
          }
    state.events.push(tierChangedEvent(state, snapshot, before, at, true))
  }
  tier("nordhavn", SERVICE_IA_ID, "warm", { h: 2, m: 2 })
  tier("meridian", SERVICE_IA_ID, "warm", { h: 10 })
  tier("vistula", SERVICE_CYBER_ID, "warm", { d: 1, h: 3 }, 84.1)
  tier("dhl", SERVICE_IA_ID, "warm", { d: 12 }, 66.2)
  tier("dhl", SERVICE_IA_ID, "hot", { d: 29 }, 64.0)
}

// --- runs ---------------------------------------------------------------------------------------------

interface ReplayCompany {
  key: string
  newDocs?: Partial<Record<SourceType, number>>
  /** Services that went through the LLM; the others were "Nothing new to check". */
  extract?: string[]
  fail?: boolean
}

function pushEvent(state: DbState, runId: string, spec: EmitSpec): void {
  state.runEventSeq += 1
  const record: RunEventRecord = {
    id: state.runEventSeq,
    run_id: runId,
    company_id: spec.company_id,
    event: spec.event,
    data: spec.data,
  }
  state.runEvents.push(record)
}

function scoreAt(
  state: DbState,
  cid: string,
  serviceId: string,
  atMs: number
): { priority: number; tier: Tier } {
  const candidates = state.scores
    .filter(
      (s) =>
        s.company_id === cid &&
        s.service_id === serviceId &&
        new Date(s.computed_at).getTime() <= atMs + MS.HOUR
    )
    .sort((a, b) => b.computed_at.localeCompare(a.computed_at))
  const hit = candidates[0] ?? currentScore(state, cid, serviceId)
  return { priority: hit?.priority ?? 0, tier: hit?.tier ?? "cold" }
}

function dryHooks(
  state: DbState,
  cid: string,
  serviceIds: string[],
  plan: ReplayCompany,
  atMs: number
): TimelineHooks {
  const company = state.companies.find((c) => c.id === cid)
  const docs = state.documents.filter((d) => d.company_id === cid).length
  const newDocs = Object.fromEntries(
    Object.entries(plan.newDocs ?? {}).filter(([, n]) => (n ?? 0) > 0)
  ) as Record<string, number>
  const fresh = Object.values(newDocs).reduce((a, b) => a + b, 0)
  return {
    resolve: () => ({
      domain: company?.domain ?? "",
      own_domains: company?.own_domains ?? [],
    }),
    sources: () => sourcesOf(state, serviceIds),
    collect: () => newDocs,
    index: () => ({ documents: fresh, snippets: fresh * 7 }),
    prefilter: (s) => {
      const loaded = docs * 6
      const selected = Math.min(40, Math.round(loaded * 0.35))
      return {
        loaded,
        after_entity_filter: Math.round(loaded * 0.72),
        candidates_before_budget: Math.round(loaded * 0.45),
        selected,
        estimated_tokens: selected * 185,
        skip: plan.extract ? !plan.extract.includes(s) : false,
      }
    },
    extract: () => ({ llm_calls: 1, blocked: false }),
    verify: (s) => ({
      verified: state.signals.filter(
        (x) =>
          x.company_id === cid && x.service_id === s && x.status === "active"
      ).length,
      rejected: hash(`${cid}${s}`) % 3,
    }),
    score: (s) => scoreAt(state, cid, s, atMs),
  }
}

function replayRun(
  state: DbState,
  run: RunOut,
  serviceIds: string[],
  companies: ReplayCompany[],
  failMessage: string
): void {
  const progress = { done: 0, total: companies.length, failed: 0, paused: 0 }
  pushEvent(state, run.id, {
    event: "run.progress",
    company_id: null,
    data: { ...progress },
  })
  const atMs = new Date(run.finished_at ?? run.created_at).getTime()
  for (const c of companies) {
    const cid = companyId(c.key)
    const gen = companyTimeline(
      { companyId: cid, serviceIds, fail: c.fail ?? false, failMessage },
      dryHooks(state, cid, serviceIds, c, atMs)
    )
    let step = gen.next()
    while (!step.done) {
      pushEvent(state, run.id, step.value)
      step = gen.next()
    }
    if (step.value.status === "failed") progress.failed += 1
    else progress.done += 1
    pushEvent(state, run.id, {
      event: "run.progress",
      company_id: null,
      data: { ...progress },
    })
  }
  const status = runStatusOf(progress)
  pushEvent(state, run.id, {
    event: "run.finished",
    company_id: null,
    data: { status, ...progress },
  })
  run.progress = { ...progress }
  run.status = status
}

function seedRuns(state: DbState, now: Date): void {
  state.runs = []
  state.runEvents = []
  state.runEventSeq = 2000
  const tracked = state.companies
    .filter((c) => c.is_tracked && c.last_analyzed_at)
    .map((c) => c.id)
  const keyOf = (id: string) =>
    COMPANIES.find((c) => uuid(G.company, c.n) === id)?.key ?? ""

  const run = (
    n: number,
    kind: RunOut["kind"],
    createdMs: number,
    durationMin: number,
    params: RunOut["params"],
    started: boolean
  ): RunOut => ({
    id: uuid(G.run, n),
    org_id: ORG_ID,
    kind,
    status: "succeeded",
    params,
    progress: {
      done: 0,
      total: params.company_ids.length,
      failed: 0,
      paused: 0,
    },
    error: null,
    started_at: started ? iso(createdMs + 4000) : null,
    finished_at: iso(createdMs + durationMin * MS.MINUTE),
    created_at: iso(createdMs),
  })

  // R1 — the rescore after scoring profile v3 (28 Aug in the design).
  const r1Companies = state.scores
    .filter(
      (s) =>
        s.service_id === SERVICE_IA_ID &&
        !s.is_current &&
        s.scoring_profile_version === 3
    )
    .map((s) => s.company_id)
    .filter((id, i, all) => all.indexOf(id) === i)
  const r1 = run(
    1,
    "rescore",
    agoMs(now, { d: 29, m: 2 }),
    1,
    { company_ids: r1Companies, service_ids: [SERVICE_IA_ID] },
    true
  )
  {
    const progress = {
      done: 0,
      total: r1Companies.length,
      failed: 0,
      paused: 0,
    }
    pushEvent(state, r1.id, {
      event: "run.progress",
      company_id: null,
      data: { ...progress },
    })
    for (const cid of r1Companies) {
      const sc = scoreAt(state, cid, SERVICE_IA_ID, agoMs(now, { d: 29 }))
      const base = {
        company_id: cid,
        service_id: SERVICE_IA_ID,
        stage: "scoring",
      }
      pushEvent(state, r1.id, {
        event: "company.stage",
        company_id: cid,
        data: { ...base, status: "started", message: "" },
      })
      pushEvent(state, r1.id, {
        event: "company.stage",
        company_id: cid,
        data: {
          ...base,
          status: "done",
          message: `Priority ${pyFloat(sc.priority)} (${sc.tier})`,
          priority: sc.priority,
          tier: sc.tier,
        },
      })
      pushEvent(state, r1.id, {
        event: "company.done",
        company_id: cid,
        data: {
          company_id: cid,
          status: "done",
          message: "",
          scores: [{ service_id: SERVICE_IA_ID, ...sc }],
        },
      })
      progress.done += 1
      pushEvent(state, r1.id, {
        event: "run.progress",
        company_id: null,
        data: { ...progress },
      })
    }
    pushEvent(state, r1.id, {
      event: "run.finished",
      company_id: null,
      data: { status: "succeeded", ...progress },
    })
    r1.progress = progress
  }

  const both = [SERVICE_IA_ID, SERVICE_CYBER_ID]
  const failMessage =
    "LLM output failed validation: the response was not valid JSON"

  // R2 — analysis of five accounts; Lemanic Pharma failed at extracting (retry-failed is demoable).
  const r2 = run(
    2,
    "analyze",
    agoMs(now, { d: 3, h: 1 }),
    6,
    {
      company_ids: [
        "castellane",
        "alpenrail",
        "vistula",
        "brabant",
        "lemanic",
      ].map(companyId),
      service_ids: [],
      mode: "incremental",
    },
    true
  )
  replayRun(
    state,
    r2,
    both,
    [
      { key: "castellane", newDocs: { jobs: 2, news: 1 } },
      { key: "alpenrail", newDocs: { news: 1 } },
      { key: "vistula", newDocs: { jobs: 1 } },
      { key: "brabant", newDocs: { jobs: 2 } },
      { key: "lemanic", newDocs: { website: 1 }, fail: true },
    ],
    failMessage
  )
  r2.error = `extracting: ${failMessage}`

  // R3 — full re-analysis of DHL and Lufthansa.
  const r3 = run(
    3,
    "analyze",
    agoMs(now, { d: 1, h: 0, m: 20 }),
    4,
    {
      company_ids: ["dhl", "lufthansa"].map(companyId),
      service_ids: [],
      mode: "full",
    },
    true
  )
  replayRun(
    state,
    r3,
    both,
    [
      { key: "dhl", newDocs: { jobs: 3, news: 2, website: 1 } },
      { key: "lufthansa", newDocs: { jobs: 2, news: 1 } },
    ],
    failMessage
  )

  // R4 — the scheduler's monitoring run two hours ago: 14 new documents, 3 AI calls.
  const r4 = run(
    4,
    "refresh",
    agoMs(now, { h: 2, m: 17 }),
    18,
    { company_ids: tracked, service_ids: [], trigger: "scheduler" },
    false
  )
  const r4Extract: Record<string, string[]> = {
    dhl: [SERVICE_IA_ID],
    vistula: [SERVICE_CYBER_ID],
    nordhavn: [SERVICE_IA_ID],
  }
  const r4Docs: Record<string, Partial<Record<SourceType, number>>> = {
    dhl: { jobs: 4, news: 2 },
    vistula: { jobs: 3, news: 1 },
    nordhavn: { jobs: 3, news: 1 },
  }
  replayRun(
    state,
    r4,
    both,
    tracked.map((id) => ({
      key: keyOf(id),
      newDocs: r4Docs[keyOf(id)] ?? {},
      extract: r4Extract[keyOf(id)] ?? [],
    })),
    failMessage
  )

  state.runs = [r4, r3, r2, r1]
  for (const r of [r1, r2, r3, r4]) {
    if (
      r.status === "succeeded" ||
      r.status === "partial" ||
      r.status === "failed" ||
      r.status === "cancelled"
    )
      state.events.push(
        runFinishedEvent(
          state,
          r.id,
          r.status,
          r.progress,
          new Date(r.finished_at ?? r.created_at),
          true
        )
      )
  }
}

export function seedHistory(state: DbState, now: Date): void {
  state.events = []
  seedFeedback(state, now)
  seedActivity(state, now)
  seedRuns(state, now)
}

export const SEEDED_RUN_IDS = [1, 2, 3, 4].map((n) => uuid(G.run, n))
