import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { RunOut } from "@/api/generated/model"
import { POLL_INTERVAL_MS, STREAM_SILENCE_MS, useRunEvents } from "@/hooks/use-run-events"
import { server } from "@/testing/server"

const RUN_ID = "11111111-1111-4111-8111-111111111111"
const COMPANY_ID = "22222222-2222-4222-8222-222222222222"
const SERVICE_ID = "33333333-3333-4333-8333-333333333333"

function run(status: RunOut["status"]): RunOut {
  return {
    id: RUN_ID,
    org_id: "44444444-4444-4444-8444-444444444444",
    kind: "analyze",
    status,
    params: { company_ids: [COMPANY_ID], service_ids: [] },
    progress: { done: status === "succeeded" ? 1 : 0, total: 1, failed: 0, paused: 0 },
    error: null,
    started_at: null,
    finished_at: null,
    created_at: "2026-09-26T08:00:00Z",
  }
}

function sse(chunks: string[], { close = true } = {}) {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      if (close) controller.close()
    },
  })
  return new HttpResponse(stream, { headers: { "Content-Type": "text/event-stream" } })
}

const frame = (event: string, data: unknown, id?: number) =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n${id === undefined ? "" : `id: ${id}\n`}\n`

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

afterEach(() => {
  vi.useRealTimers()
})

describe("useRunEvents", () => {
  it("applies streamed events and stops once the run is finished", async () => {
    const lastEventIds: (string | null)[] = []
    server.use(
      http.post("/api/v1/runs/:id/events", ({ request }) => {
        lastEventIds.push(request.headers.get("Last-Event-ID"))
        return sse([
          frame("company.stage", {
            company_id: COMPANY_ID,
            service_id: SERVICE_ID,
            stage: "scoring",
            status: "done",
            message: "Priority 72.5 (hot)",
            priority: 72.5,
            tier: "hot",
          }, 7),
          ": keep-alive\n\n",
          frame("company.done", { company_id: COMPANY_ID, status: "done", message: "", scores: [] }, 8),
          frame("run.finished", { status: "succeeded", done: 1, total: 1, failed: 0, paused: 0 }, 9),
        ])
      }),
      http.get("/api/v1/runs/:id", () => HttpResponse.json(run("succeeded"))),
    )

    const { result } = renderHook(() => useRunEvents(RUN_ID), { wrapper })

    await waitFor(() => expect(result.current.transport).toBe("closed"))
    const company = result.current.companies[COMPANY_ID]
    expect(company.services[SERVICE_ID]).toMatchObject({ stage: "scoring", priority: 72.5, tier: "hot" })
    expect(company.outcome?.status).toBe("done")
    expect(result.current.run.data?.status).toBe("succeeded")
    expect(lastEventIds).toEqual([null])
  })

  it("resumes from the last event id while the run is still active", async () => {
    const lastEventIds: (string | null)[] = []
    let status: RunOut["status"] = "running"
    server.use(
      http.post("/api/v1/runs/:id/events", ({ request }) => {
        lastEventIds.push(request.headers.get("Last-Event-ID"))
        if (lastEventIds.length === 1) {
          return sse([frame("run.progress", { done: 0, total: 1, failed: 0, paused: 0 }, 41)])
        }
        status = "succeeded"
        return sse([frame("run.finished", { status: "succeeded", done: 1, total: 1, failed: 0, paused: 0 }, 42)])
      }),
      http.get("/api/v1/runs/:id", () => HttpResponse.json(run(status))),
    )

    const { result } = renderHook(() => useRunEvents(RUN_ID), { wrapper })

    await waitFor(() => expect(result.current.transport).toBe("closed"), { timeout: 5_000 })
    expect(lastEventIds).toEqual([null, "41"])
  })

  it("falls back to polling when the stream goes silent", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let polls = 0
    server.use(
      // Headers arrive, then nothing: no events, no keep-alive comments.
      http.post("/api/v1/runs/:id/events", () => sse([], { close: false })),
      http.get("/api/v1/runs/:id", () => {
        polls += 1
        return HttpResponse.json(run("running"))
      }),
    )

    const { result } = renderHook(() => useRunEvents(RUN_ID), { wrapper })
    await waitFor(() => expect(result.current.run.data?.status).toBe("running"))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(STREAM_SILENCE_MS + 100)
    })
    expect(result.current.transport).toBe("polling")

    const before = polls
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2 + 100)
    })
    expect(polls).toBeGreaterThanOrEqual(before + 2)
  })

  it("falls back to polling after two failed connections", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let attempts = 0
    server.use(
      http.post("/api/v1/runs/:id/events", () => {
        attempts += 1
        return HttpResponse.json({ error: { code: "service_unavailable", message: "down", details: {} } }, { status: 503 })
      }),
      http.get("/api/v1/runs/:id", () => HttpResponse.json(run("running"))),
    )

    const { result } = renderHook(() => useRunEvents(RUN_ID), { wrapper })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    await waitFor(() => expect(result.current.transport).toBe("polling"))
    expect(attempts).toBe(2)
  })
})
