import { getListLeadsUrl } from "@/api/generated/leads/leads"
import type { ListLeadsParams } from "@/api/generated/model"

/**
 * GET /leads/export.csv takes the list's filters and sort (backend leads/router.py:202-261) and answers with
 * a CSV attachment, so it is a plain download link rather than a generated JSON hook. GET is not
 * origin-checked, so the session cookie is enough.
 */
export function leadsExportUrl(params: Omit<ListLeadsParams, "page" | "page_size">) {
  return getListLeadsUrl(params).replace(/^\/api\/v1\/leads/, "/api/v1/leads/export.csv")
}
