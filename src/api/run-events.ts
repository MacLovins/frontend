/**
 * Server-sent events of an analysis run: POST /api/v1/runs/{id}/events (backend core/modules/runs/router.py).
 * POST, not GET, so proxies that buffer GET streams (Cloudflare) pass it through. The server replays every
 * stored event after `Last-Event-ID`, streams live ones, sends a comment every ≤15 s and closes the stream
 * itself once the run is terminal. It is not described in OpenAPI, so it is read here by hand.
 */
import { createParser } from "eventsource-parser"

import type { RunProgress, Tier } from "@/api/generated/model"
import { ApiError } from "@/api/mutator"

export type StageName =
  | "resolving"
  | "collecting"
  | "indexing"
  | "prefiltering"
  | "extracting"
  | "verifying"
  | "scoring"
  | "done"
  | "failed"
  | "paused"

export type StageStatus = "started" | "progress" | "done" | "failed" | "paused"

export type ServiceScore = { service_id: string; priority: number; tier: Tier }

/** Stage-specific keys (counts, priority, tier…) are flattened into the same object by the backend. */
export type CompanyStageData = {
  company_id: string
  service_id: string | null
  stage: StageName
  status: StageStatus
  message: string
  [key: string]: unknown
}

export type CompanyDoneData = {
  company_id: string
  status: "done" | "failed" | "paused" | "cancelled" | "resuming"
  message: string
  scores?: ServiceScore[]
}

export type RunFinishedData = Partial<RunProgress> & {
  status: "succeeded" | "partial" | "failed" | "cancelled"
}

export type RunEvent =
  | { id: number | null; event: "run.progress"; data: RunProgress }
  | { id: number | null; event: "run.finished"; data: RunFinishedData }
  | { id: number | null; event: "company.stage"; data: CompanyStageData }
  | { id: number | null; event: "company.done"; data: CompanyDoneData }

const EVENT_NAMES = new Set([
  "run.progress",
  "run.finished",
  "company.stage",
  "company.done",
])

export type ReadRunEventsOptions = {
  lastEventId?: number | null
  signal?: AbortSignal
  onEvent: (event: RunEvent) => void
  /** Any bytes from the server, keep-alive comments included: proof the stream is alive. */
  onActivity?: () => void
}

/** Reads the stream until the server closes it. Rejects with ApiError when the request itself fails. */
export async function readRunEvents(
  runId: string,
  options: ReadRunEventsOptions
) {
  const headers: Record<string, string> = { Accept: "text/event-stream" }
  if (options.lastEventId != null)
    headers["Last-Event-ID"] = String(options.lastEventId)

  let response: Response
  try {
    response = await fetch(`/api/v1/runs/${runId}/events`, {
      method: "POST",
      headers,
      credentials: "same-origin",
      signal: options.signal,
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError(
      0,
      "network",
      "Lost connection to the live progress stream."
    )
  }

  // Auth and "run not found" fail before streaming, as ordinary JSON errors.
  if (
    !response.ok ||
    !response.body ||
    !response.headers.get("content-type")?.includes("text/event-stream")
  ) {
    throw new ApiError(
      response.status,
      "stream_unavailable",
      "Live progress is unavailable."
    )
  }

  const parser = createParser({
    onComment: () => options.onActivity?.(),
    onEvent: (message) => {
      options.onActivity?.()
      if (!message.event || !EVENT_NAMES.has(message.event)) return
      let data: unknown
      try {
        data = JSON.parse(message.data)
      } catch {
        return
      }
      const id = message.id ? Number(message.id) : null
      options.onEvent({
        id: Number.isFinite(id) ? id : null,
        event: message.event,
        data,
      } as RunEvent)
    },
  })

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  try {
    for (;;) {
      const { done, value } = await readChunk(reader, options.signal)
      if (done) return
      options.onActivity?.()
      parser.feed(value)
    }
  } finally {
    reader.releaseLock()
  }
}

function abortError(signal: AbortSignal) {
  return signal.reason instanceof Error
    ? signal.reason
    : new DOMException("The operation was aborted.", "AbortError")
}

/** `fetch` abort does not always reject a body that has already started, so cancel the reader explicitly. */
function readChunk(
  reader: ReadableStreamDefaultReader<string>,
  signal: AbortSignal | undefined,
) {
  if (!signal) return reader.read()
  if (signal.aborted) return Promise.reject(abortError(signal))

  return new Promise<ReadableStreamReadResult<string>>((resolve, reject) => {
    const onAbort = () => {
      void reader.cancel().catch(() => undefined)
      reject(abortError(signal))
    }
    signal.addEventListener("abort", onAbort, { once: true })
    reader.read().then(
      (chunk) => {
        signal.removeEventListener("abort", onAbort)
        if (signal.aborted) reject(abortError(signal))
        else resolve(chunk)
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort)
        reject(signal.aborted ? abortError(signal) : error)
      },
    )
  })
}
