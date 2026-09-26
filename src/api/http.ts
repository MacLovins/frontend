import createClient from "openapi-fetch"
import type { components, paths } from "@maclovins/leadradar-api"

type Schemas = components["schemas"]

export type LoginIn = Schemas["LoginIn"]
export type CompanyCreate = Schemas["CompanyCreate"]
export type CompanyImportReport = Schemas["CompanyImportReport"]
export type CompanyUpdate = Schemas["CompanyUpdate"]
export type DiscoveryAcceptIn = Schemas["DiscoveryAcceptIn"]
export type DiscoverySearchIn = Schemas["DiscoverySearchIn"]
export type DisqualificationRuleCreate = Schemas["DisqualificationRuleCreate"]
export type FeedbackIn = Schemas["FeedbackIn"]
export type ICPProfileIn = Schemas["ICPProfileIn"]
export type RescoreResult = Schemas["RescoreResult"]
export type RunCreate = Schemas["RunCreate"]
export type ScoringProfileIn = Schemas["ScoringProfileIn"]
export type SignalQuestionCreate = Schemas["SignalQuestionCreate"]
export type SignalQuestionUpdate = Schemas["SignalQuestionUpdate"]
export type UserCreate = Schemas["UserCreate"]
export type UserOut = Schemas["UserOut"]
export type DiscoveredCompany = Schemas["DiscoveredCompany"]

// Paths in the published spec already start with /api/v1, which the Vite proxy forwards.
export const http = createClient<paths>({
  baseUrl: "",
  credentials: "include",
})

type CallResult<T> = {
  data?: T
  error?: unknown
  response: Response
}

export async function unwrap<T>(pending: Promise<CallResult<T>>): Promise<T> {
  const result = await pending
  if (result.response.status === 401) {
    throw new ApiError(401, "unauthorized")
  }
  if (!result.response.ok) {
    throw new ApiError(result.response.status, errorMessage(result.error))
  }
  return result.data as T
}

function errorMessage(error: unknown) {
  if (!error || typeof error !== "object" || !("detail" in error)) {
    return "request_failed"
  }
  const detail = error.detail
  if (typeof detail === "string" && detail) {
    return detail
  }
  if (Array.isArray(detail)) {
    const first = detail.find((item) => item && typeof item === "object" && "msg" in item) as { msg?: unknown } | undefined
    if (typeof first?.msg === "string" && first.msg) {
      return first.msg
    }
  }
  return "request_failed"
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}
