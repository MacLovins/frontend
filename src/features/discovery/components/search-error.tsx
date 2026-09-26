import { WarningIcon } from "@phosphor-icons/react"

import { ApiError, errorMessage } from "@/api/mutator"
import { Button } from "@/components/ui/button"

import { copy } from "../copy"

function searchErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === "discovery_timeout") return copy.errors.timeout
    if (error.code === "discovery_unavailable") return copy.errors.unavailable
    if (error.code === "discovery_query_incomplete")
      return copy.errors.incomplete
  }
  return errorMessage(error)
}

export function SearchError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-md bg-negative-surface p-3 text-[13px] text-negative-strong"
    >
      <WarningIcon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">{searchErrorMessage(error)}</span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {copy.results.tryAgain}
      </Button>
    </div>
  )
}
