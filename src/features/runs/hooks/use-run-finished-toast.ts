import { useEffect, useRef } from "react"
import { toast } from "sonner"

import type { RunOut } from "@/api/generated/model"
import { isRunActive, type RunTransport } from "@/hooks/use-run-events"

import { copy } from "../copy"

/**
 * Announces the end of a run the user watched finish (not one that was already over when the page opened).
 * It waits until the progress hook has re-read the run (`closed`) or polls it: a replayed stream passes through
 * the old `run.finished` of a retried run on its way to the present.
 */
export function useRunFinishedToast(run: RunOut, transport: RunTransport) {
  const watched = useRef(isRunActive(run.status))
  const { status, progress, error } = run
  const settled = transport === "closed" || transport === "polling"

  useEffect(() => {
    if (isRunActive(status)) {
      watched.current = true
      return
    }
    if (!watched.current || !settled) return
    watched.current = false
    if (status === "succeeded")
      toast.success(copy.finished.succeeded(progress.done))
    else if (status === "partial")
      toast(
        copy.finished.partial(progress.done, progress.paused, progress.failed)
      )
    else if (status === "failed")
      toast.error(copy.finished.failed, { description: error ?? undefined })
    else if (status === "cancelled") toast(copy.finished.cancelled)
  }, [status, progress, error, settled])
}
