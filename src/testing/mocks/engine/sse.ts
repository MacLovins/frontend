/**
 * SSE wire format of GET|POST /runs/{id}/events (FastAPI `format_sse_event`): `event`, `data`, `id` lines
 * and a blank line. `data` is Python `json.dumps` output: one line, `", "` / `": "` separators, non-ASCII
 * escaped as \uXXXX.
 */

function pyString(value: string): string {
  return JSON.stringify(value).replace(
    /[\u0080-\uffff]/g,
    (ch) => `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`
  )
}

function pyNumber(value: number): string {
  if (!Number.isFinite(value)) return "null"
  return String(value)
}

/** `json.dumps(value)` with Python's default separators and ensure_ascii. */
export function pyJson(value: unknown): string {
  if (value === null || value === undefined) return "null"
  if (typeof value === "string") return pyString(value)
  if (typeof value === "number") return pyNumber(value)
  if (typeof value === "boolean") return value ? "true" : "false"
  if (Array.isArray(value)) return `[${value.map(pyJson).join(", ")}]`
  if (typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${pyString(k)}: ${pyJson(v)}`)
      .join(", ")}}`
  return "null"
}

export function formatSse(event: string, data: unknown, id?: number): string {
  return `event: ${event}\ndata: ${pyJson(data)}\n${id === undefined ? "" : `id: ${id}\n`}\n`
}

export const KEEP_ALIVE = ": keep-alive\n\n"
