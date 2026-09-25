const API_BASE = import.meta.env.VITE_API_BASE ?? "/api/v1"

export class ApiError extends Error {
  readonly code: number
  readonly reason: string

  constructor(code: number, reason: string) {
    super(reason)
    this.name = "ApiError"
    this.code = code
    this.reason = reason
  }
}

type RequestOptions = {
  method: "POST"
  body?: unknown
  accessToken?: string
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method,
      headers: {
        Accept: "application/json",
        ...(options.body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
        ...(options.accessToken
          ? { Authorization: `Bearer ${options.accessToken}` }
          : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(0, "network")
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    throw await readError(response)
  }

  return (await response.json()) as T
}

async function readError(response: Response): Promise<ApiError> {
  try {
    const body: unknown = await response.json()
    if (
      typeof body === "object" &&
      body !== null &&
      "code" in body &&
      "reason" in body &&
      typeof body.code === "number" &&
      typeof body.reason === "string"
    ) {
      return new ApiError(body.code, body.reason)
    }
  } catch {
    // Fall through to a generic status error.
  }

  return new ApiError(response.status, "unknown")
}
