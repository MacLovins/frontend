import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useReducer, useState } from "react"

import { apiPaths, invalidateApi } from "@/api/cache"
import { getGetRunQueryKey, getRun, useGetRun } from "@/api/generated/runs/runs"
import type { RunOut, RunStatus, Tier } from "@/api/generated/model"
import {
  readRunEvents,
  type CompanyDoneData,
  type RunEvent,
  type StageName,
  type StageStatus,
} from "@/api/run-events"

/** SPEC FE-07: 20 s without bytes (the server comments every ≤15 s) or two failures in a row → polling. */
export const STREAM_SILENCE_MS = 20_000
export const POLL_INTERVAL_MS = 3_000
const RECONNECT_MS = 1_500
const LOG_LIMIT = 300

const ACTIVE_STATUSES: RunStatus[] = ["queued", "running", "pending"]
export const isRunActive = (status: RunStatus | undefined) => !!status && ACTIVE_STATUSES.includes(status)

export type ServiceProgress = {
  serviceId: string
  stage: StageName
  status: StageStatus
  message: string
  priority?: number
  tier?: Tier
}

export type CompanyProgress = {
  companyId: string
  /** Stage and status of the latest event for this company (company- or service-level). */
  stage: StageName | null
  status: StageStatus | null
  message: string
  services: Record<string, ServiceProgress>
  /** Set by `company.done`: the company's final state in this run. */
  outcome: CompanyDoneData | null
}

export type RunLogEntry = { key: number; receivedAt: number; event: RunEvent }

export type RunTransport = "connecting" | "live" | "polling" | "closed"

type State = {
  companies: Record<string, CompanyProgress>
  companyOrder: string[]
  log: RunLogEntry[]
  transport: RunTransport
}

type Action = { type: "reset" } | { type: "transport"; transport: RunTransport } | { type: "event"; event: RunEvent }

const initialState: State = { companies: {}, companyOrder: [], log: [], transport: "connecting" }

function companyOf(state: State, companyId: string): CompanyProgress {
  return (
    state.companies[companyId] ?? { companyId, stage: null, status: null, message: "", services: {}, outcome: null }
  )
}

function reduce(state: State, action: Action): State {
  if (action.type === "reset") return initialState
  if (action.type === "transport") {
    return state.transport === action.transport ? state : { ...state, transport: action.transport }
  }

  const { event } = action
  const previous = state.log[state.log.length - 1]
  const log = [...state.log.slice(-(LOG_LIMIT - 1)), { key: (previous?.key ?? 0) + 1, receivedAt: Date.now(), event }]
  if (event.event !== "company.stage" && event.event !== "company.done") return { ...state, log }

  const companyId = event.data.company_id
  const company = companyOf(state, companyId)
  let next: CompanyProgress
  if (event.event === "company.stage") {
    const { service_id: serviceId, stage, status, message } = event.data
    const services = serviceId
      ? {
          ...company.services,
          [serviceId]: {
            serviceId,
            stage,
            status,
            message,
            priority: typeof event.data.priority === "number" ? event.data.priority : company.services[serviceId]?.priority,
            tier: (event.data.tier as Tier | undefined) ?? company.services[serviceId]?.tier,
          },
        }
      : company.services
    next = { ...company, stage, status, message: message || company.message, services }
  } else {
    // A retried company starts over; "resuming" rows come from the scheduler after an LLM quota pause.
    const finished = event.data.status !== "resuming"
    next = { ...company, outcome: finished ? event.data : null, message: event.data.message || company.message }
  }

  return {
    ...state,
    log,
    companies: { ...state.companies, [companyId]: next },
    companyOrder: state.companyOrder.includes(companyId) ? state.companyOrder : [...state.companyOrder, companyId],
  }
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * Live progress of a run: SSE with `Last-Event-ID` resume, reconnect while the run is active, and a
 * fallback to polling GET /runs/{id} every 3 s when the stream goes silent or fails twice (SPEC FE-07).
 * `company.done` refreshes the leads and company caches; run progress is patched into the run query.
 */
export function useRunEvents(runId: string | undefined) {
  const queryClient = useQueryClient()
  const [state, dispatch] = useReducer(reduce, initialState)
  const [generation, setGeneration] = useState(0)

  const run = useGetRun(runId ?? "", {
    query: {
      enabled: !!runId,
      refetchInterval: (query) =>
        state.transport === "polling" && isRunActive(query.state.data?.status) ? POLL_INTERVAL_MS : false,
    },
  })

  useEffect(() => {
    if (!runId) return
    const runKey = getGetRunQueryKey(runId)
    const lifetime = new AbortController()
    let lastEventId: number | null = null
    let failures = 0
    dispatch({ type: "reset" })

    const patchRun = (patch: (run: RunOut) => RunOut) =>
      queryClient.setQueryData<RunOut>(runKey, (current) => (current ? patch(current) : current))

    const apply = (event: RunEvent) => {
      if (event.id != null) lastEventId = event.id
      dispatch({ type: "event", event })
      if (event.event === "run.progress") {
        const progress = event.data
        patchRun((current) => ({ ...current, progress, status: current.status === "queued" ? "running" : current.status }))
      } else if (event.event === "run.finished") {
        const { status, ...progress } = event.data
        patchRun((current) => ({ ...current, status, progress: { ...current.progress, ...progress } }))
      } else if (event.event === "company.stage" && event.data.stage !== "done") {
        patchRun((current) => (current.status === "queued" ? { ...current, status: "running" } : current))
      } else if (event.event === "company.done") {
        void invalidateApi(queryClient, apiPaths.leads, apiPaths.companies, apiPaths.activity)
      }
    }

    const connect = async () => {
      while (!lifetime.signal.aborted) {
        const attempt = new AbortController()
        const stop = () => attempt.abort()
        lifetime.signal.addEventListener("abort", stop)
        let silence = 0
        let silent = false
        const arm = () => {
          window.clearTimeout(silence)
          silence = window.setTimeout(() => {
            silent = true
            attempt.abort()
          }, STREAM_SILENCE_MS)
        }

        dispatch({ type: "transport", transport: "connecting" })
        arm()
        try {
          await readRunEvents(runId, {
            lastEventId,
            signal: attempt.signal,
            onActivity: () => {
              arm()
              dispatch({ type: "transport", transport: "live" })
            },
            onEvent: apply,
          })
          failures = 0
        } catch {
          if (lifetime.signal.aborted) return
          failures = silent ? 2 : failures + 1
        } finally {
          window.clearTimeout(silence)
          lifetime.signal.removeEventListener("abort", stop)
        }

        if (failures >= 2) {
          dispatch({ type: "transport", transport: "polling" })
          return
        }

        // The server closes the stream when the run is terminal, or right after a replay when it has no live
        // channel. Ask the run itself whether to keep listening.
        const current = await queryClient
          .fetchQuery({ queryKey: runKey, queryFn: ({ signal }) => getRun(runId, { signal }), staleTime: 0 })
          .catch(() => undefined)
        if (lifetime.signal.aborted) return
        if (current && !isRunActive(current.status)) {
          dispatch({ type: "transport", transport: "closed" })
          void invalidateApi(queryClient, apiPaths.runs, apiPaths.leads, apiPaths.activity)
          return
        }
        await sleep(RECONNECT_MS, lifetime.signal)
      }
    }

    void connect()
    return () => lifetime.abort()
  }, [queryClient, runId, generation])

  /** Re-open the stream, e.g. after retry-failed re-activates a finished run. */
  const reconnect = useCallback(() => setGeneration((value) => value + 1), [])

  return { run, ...state, reconnect }
}
