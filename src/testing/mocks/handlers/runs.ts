/**
 * Runs (backend core/modules/runs): list/create/get/cancel/retry-failed and the SSE event stream
 * (GET and POST /runs/{id}/events are identical). The stream replays stored events after Last-Event-ID,
 * then — for an active run — forwards live events, sends `: keep-alive` every 15 s and closes right after
 * a live `run.finished`. For a terminal run it sends a synthetic id-less `run.finished` when the replay did
 * not end with one, then closes.
 */
import { HttpResponse } from "msw"

import type { RunCreate, RunOut } from "@/api/generated/model"

import { nextId, ORG_ID } from "../data/ids"
import { isoNow } from "../data/time"
import { db, emitRunEvent, registerStream, subscribeRun } from "../db"
import { formatSse, KEEP_ALIVE } from "../engine/sse"
import { cancelRun, enqueueCompanies, isTerminal } from "../sim/worker"
import {
  fail,
  json,
  pathUuid,
  queryInt,
  readJson,
  route,
  validateBody,
  type AuthedCtx,
} from "./http"

const KEEP_ALIVE_MS = 15_000

function runOrThrow(id: string): RunOut {
  const run = db.runs.find((r) => r.id === id)
  if (!run) throw fail.notFound("Run not found")
  return run
}

function lastEventId(ctx: AuthedCtx): number | null {
  const header = ctx.request.headers.get("Last-Event-ID")
  const query = ctx.url.searchParams.get("last_event_id")
  const check = (raw: string, loc: string[]) => {
    if (!/^-?\d+$/.test(raw.trim()))
      throw fail.validation([
        {
          loc,
          msg: "Input should be a valid integer, unable to parse string as an integer",
          type: "int_parsing",
        },
      ])
    return Number(raw)
  }
  const fromHeader =
    header !== null ? check(header, ["header", "Last-Event-ID"]) : null
  const fromQuery =
    query !== null ? check(query, ["query", "last_event_id"]) : null
  return fromHeader ?? fromQuery
}

function eventStream(ctx: AuthedCtx): Response {
  const run = runOrThrow(pathUuid(ctx))
  const after = lastEventId(ctx) ?? 0
  const encoder = new TextEncoder()
  let closed = false
  let cleanup = () => {}

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (text: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(text))
        } catch {
          closed = true
        }
      }
      const close = () => {
        if (closed) return
        closed = true
        cleanup()
        try {
          controller.close()
        } catch {
          // already closed or cancelled by the reader
        }
      }

      let highest = after
      let lastWasFinished = false
      for (const row of db.runEvents
        .filter((e) => e.run_id === run.id && e.id > highest)
        .sort((a, b) => a.id - b.id)) {
        highest = row.id
        send(formatSse(row.event, row.data, row.id))
        lastWasFinished = row.event === "run.finished"
      }
      if (isTerminal(run.status)) {
        if (!lastWasFinished)
          send(formatSse("run.finished", { status: run.status }))
        close()
        return
      }

      const unsubscribe = subscribeRun(run.id, (row) => {
        if (row.id <= highest) return
        highest = row.id
        send(formatSse(row.event, row.data, row.id))
        if (row.event === "run.finished") close()
      })
      const keepAlive = setInterval(() => send(KEEP_ALIVE), KEEP_ALIVE_MS)
      const unregister = registerStream(close)
      const onAbort = () => close()
      ctx.request.signal.addEventListener("abort", onAbort)
      cleanup = () => {
        unsubscribe()
        clearInterval(keepAlive)
        unregister()
        ctx.request.signal.removeEventListener("abort", onAbort)
      }
    },
    cancel() {
      closed = true
      cleanup()
    },
  })

  return new HttpResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  })
}

export const runHandlers = [
  route("get", "/runs", ({ url }) => {
    const limit = queryInt(url, "limit", 20, { ge: 1, le: 100 })
    return json<RunOut[]>(
      [...db.runs]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit)
    )
  }),

  route("post", "/runs", async ({ request }) => {
    const body = validateBody<RunCreate>(
      await readJson(request),
      {
        kind: { type: "string", enum: ["analyze", "refresh"] },
        mode: { type: "string", enum: ["incremental", "full"] },
        company_ids: {
          type: "list",
          items: "uuid",
          minItems: 1,
          maxItems: 500,
          required: true,
        },
        service_ids: { type: "list", items: "uuid" },
      },
      { forbidExtra: true }
    )
    const companyIds = [
      ...new Set(body.company_ids.map((id) => id.toLowerCase())),
    ]
    const serviceIds = [
      ...new Set((body.service_ids ?? []).map((id) => id.toLowerCase())),
    ]
    const unknownCompanies = companyIds.filter(
      (id) => !db.companies.some((c) => c.id === id)
    )
    if (unknownCompanies.length)
      throw fail.unprocessable("Unknown company ids", {
        company_ids: unknownCompanies,
      })
    const unknownServices = serviceIds.filter(
      (id) => !db.services.some((s) => s.id === id)
    )
    if (unknownServices.length)
      throw fail.unprocessable("Unknown service ids", {
        service_ids: unknownServices,
      })
    const mode = body.mode ?? "incremental"
    const run: RunOut = {
      id: nextId(db),
      org_id: ORG_ID,
      kind: body.kind ?? "analyze",
      status: "queued",
      params: { company_ids: companyIds, service_ids: serviceIds, mode },
      progress: { done: 0, total: companyIds.length, failed: 0, paused: 0 },
      error: null,
      started_at: null,
      finished_at: null,
      created_at: isoNow(),
    }
    db.runs.push(run)
    // Stored (replayed as run.progress) but not published live, like the backend.
    db.runEventSeq += 1
    db.runEvents.push({
      id: db.runEventSeq,
      run_id: run.id,
      company_id: null,
      event: "run.progress",
      data: { ...run.progress },
    })
    enqueueCompanies(run, companyIds, { mode })
    return json<RunOut>(run, 201)
  }),

  route("get", "/runs/:id", (ctx) => json<RunOut>(runOrThrow(pathUuid(ctx)))),

  route("post", "/runs/:id/cancel", (ctx) => {
    const run = runOrThrow(pathUuid(ctx))
    if (run.status !== "queued" && run.status !== "running")
      throw fail.conflict(`Run is already ${run.status}`, {
        status: run.status,
      })
    cancelRun(run)
    return json<RunOut>(run)
  }),

  route("post", "/runs/:id/retry-failed", (ctx) => {
    const run = runOrThrow(pathUuid(ctx))
    if (run.status === "cancelled")
      throw fail.conflict("A cancelled run cannot be retried", {
        status: "cancelled",
      })
    const last = new Map<string, string>()
    for (const e of db.runEvents)
      if (e.run_id === run.id && e.event === "company.done")
        last.set(String(e.data.company_id), String(e.data.status))
    const failed = [...last]
      .filter(([, status]) => status === "failed")
      .map(([id]) => id)
    const paused = [...last]
      .filter(([, status]) => status === "paused")
      .map(([id]) => id)
    const retry = [...failed, ...paused].filter((id) =>
      db.companies.some((c) => c.id === id)
    )
    if (!retry.length) return json<RunOut>(run)
    run.progress = {
      ...run.progress,
      failed: Math.max(0, run.progress.failed - failed.length),
      paused: Math.max(0, run.progress.paused - paused.length),
    }
    run.status = run.status === "running" ? "running" : "queued"
    run.finished_at = null
    emitRunEvent(run.id, {
      event: "run.progress",
      company_id: null,
      data: { ...run.progress },
    })
    enqueueCompanies(run, retry, { mode: "incremental", retried: true })
    return json<RunOut>(run)
  }),

  route("get", "/runs/:id/events", eventStream),
  route("post", "/runs/:id/events", eventStream),
]
