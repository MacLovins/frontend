/**
 * The single fetch used by every generated hook. Errors follow the backend envelope
 * `{"error": {"code", "message", "details"}}` (backend core/errors.py).
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.details = details
  }
}

// Orval picks this up as the error type of every generated hook.
export type ErrorType<_Error> = ApiError

async function readError(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === "object" && "error" in body) {
      const error = (body as { error: { code?: unknown; message?: unknown; details?: unknown } }).error
      return new ApiError(
        response.status,
        typeof error.code === "string" ? error.code : "request_failed",
        typeof error.message === "string" ? error.message : response.statusText,
        error.details && typeof error.details === "object" ? (error.details as Record<string, unknown>) : {},
      )
    }
  } catch {
    // Not JSON (proxy error page, empty body): fall through to the status text.
  }
  return new ApiError(response.status, "request_failed", response.statusText || "Request failed")
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      credentials: "same-origin",
      headers: { Accept: "application/json", ...options.headers },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error
    throw new ApiError(0, "network", "Cannot reach the server. Check your connection and try again.")
  }

  if (!response.ok) throw await readError(response)
  if (response.status === 204) return undefined as T

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/** Field errors of a 422 `validation_error`, keyed by the body field path (`["body", "name"]` → `name`). */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || error.code !== "validation_error") return {}
  const errors = Array.isArray(error.details.errors) ? error.details.errors : []
  const result: Record<string, string> = {}
  for (const item of errors as { loc?: unknown[]; msg?: unknown }[]) {
    if (!Array.isArray(item.loc) || typeof item.msg !== "string") continue
    const path = item.loc[0] === "body" ? item.loc.slice(1) : item.loc
    const key = path.join(".")
    if (key && !(key in result)) result[key] = item.msg.replace(/^Value error, /, "")
  }
  return result
}

/** A message a person can act on, for toasts and inline form errors. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Something went wrong. Please try again."
  if (error.code === "validation_error") {
    const errors = Array.isArray(error.details.errors) ? (error.details.errors as { msg?: unknown }[]) : []
    const first = errors.find((item) => typeof item.msg === "string")
    if (first) return String(first.msg).replace(/^Value error, /, "")
  }
  if (error.code === "origin_not_allowed") return "The server rejected this request's origin. Reload the page and try again."
  if (error.status >= 500) return "The server had a problem. Please try again in a moment."
  return error.message
}
