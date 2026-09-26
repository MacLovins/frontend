/**
 * Every /api/v1 endpoint of the LeadRadar backend (openapi.json), served from the in-memory mock db.
 * Order matters where paths overlap: `/leads/export.csv` is registered before `/leads/:companyId`.
 * Unknown /api/v1 paths answer 404 (405 for a known path with another method) instead of reaching the
 * network, so `dev:mock` never talks to a real backend.
 */
import { http, matchRequestUrl } from "msw"

import { accountHandlers } from "./handlers/accounts"
import { authHandlers } from "./handlers/auth"
import { configHandlers } from "./handlers/config"
import { discoveryHandlers } from "./handlers/discovery"
import { feedbackHandlers } from "./handlers/feedback"
import { API, ApiFailure, errorResponse } from "./handlers/http"
import { leadHandlers } from "./handlers/leads"
import { metaHandlers } from "./handlers/meta"
import { runHandlers } from "./handlers/runs"

const apiHandlers = [
  ...authHandlers,
  ...metaHandlers,
  ...configHandlers,
  ...accountHandlers,
  ...discoveryHandlers,
  ...runHandlers,
  ...leadHandlers,
  ...feedbackHandlers,
]

const fallback = http.all(`${API}/*`, ({ request }) => {
  const url = new URL(request.url)
  const known = apiHandlers.some(
    (h) =>
      typeof h.info.path === "string" &&
      matchRequestUrl(url, h.info.path).matches
  )
  return errorResponse(
    known
      ? new ApiFailure(405, "method_not_allowed", "Method Not Allowed")
      : new ApiFailure(404, "not_found", "Not Found")
  )
})

export const handlers = [...apiHandlers, fallback]
