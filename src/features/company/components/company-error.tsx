import { Link } from "react-router"

import { ApiError, fieldErrors } from "@/api/mutator"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"

/**
 * GET /leads/{id}?service_id= answers 404 "Company not found" / "Service not found", and 422 for an id that
 * is not a UUID (a mangled link): both are "not found" to the reader.
 */
function missing(error: unknown) {
  if (!(error instanceof ApiError)) return null
  if (error.status === 404)
    return error.message === "Service not found" ? "service" : "company"
  if (error.status !== 422) return null
  return "query.service_id" in fieldErrors(error) ? "service" : "company"
}

/** Not found → a way back; anything else → retry. */
export function CompanyError({
  error,
  companyId,
  onRetry,
}: {
  error: unknown
  companyId: string
  onRetry: () => void
}) {
  const what = missing(error)
  if (what === "service") {
    return (
      <EmptyState
        title="Service not found"
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to={`/companies/${companyId}`} />}
          >
            Open the company
          </Button>
        }
      >
        The service in this link doesn't exist, or it was deleted.
      </EmptyState>
    )
  }
  if (what === "company") {
    return (
      <EmptyState
        title="Company not found"
        actions={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/prospects" />}
          >
            Back to Prospects
          </Button>
        }
      >
        It may have been deleted, or the link is wrong.
      </EmptyState>
    )
  }
  return (
    <ErrorState
      title="Couldn't load this company"
      error={error}
      onRetry={onRetry}
    />
  )
}
