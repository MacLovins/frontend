import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import type { RunOut } from "@/api/generated/model"
import {
  getGetRunQueryKey,
  useCancelRun,
  useRetryFailed,
} from "@/api/generated/runs/runs"

import { copy } from "../copy"

/**
 * Cancel and retry-failed for one run. Errors (409 "Run is already succeeded"…) use the global toast and
 * refetch the run, whose status the page had wrong.
 */
export function useRunActions(run: RunOut, reconnect: () => void) {
  const queryClient = useQueryClient()
  const runKey = getGetRunQueryKey(run.id)

  const settle = (next?: RunOut) => {
    if (next) queryClient.setQueryData(runKey, next)
    // Prefix match: refreshes this run and the recent-runs list.
    void invalidateApi(queryClient, apiPaths.runs)
  }

  const cancel = useCancelRun({
    mutation: { onSuccess: settle, onError: () => settle() },
  })
  const retry = useRetryFailed({ mutation: { onError: () => settle() } })

  const { failed, paused } = run.progress
  const retryLabel =
    failed > 0 && paused > 0
      ? copy.retry.both
      : failed > 0
        ? copy.retry.failed
        : copy.retry.paused

  return {
    // A scheduler run (`pending`) cannot be cancelled: the backend answers 409 (runs/service.py:85-96).
    canCancel: run.status === "queued" || run.status === "running",
    cancel: (options: { onSettled: () => void }) =>
      cancel.mutate({ id: run.id }, options),
    isCancelling: cancel.isPending,
    canRetry: failed + paused > 0 && run.status !== "cancelled",
    retryLabel,
    retry: () =>
      retry.mutate(
        { id: run.id },
        {
          onSuccess: (next) => {
            toast.success(copy.retry.started(failed + paused))
            settle(next)
            // The stream closed when the run finished; the retried companies report on a new one.
            reconnect()
          },
        }
      ),
    isRetrying: retry.isPending,
  }
}
