import type { RunStatus } from "@/api/generated/model"
import {
  isRunActive,
  type RunLogEntry,
  type RunTransport,
} from "@/hooks/use-run-events"

/**
 * The run's status as the stream last described it. A retried run replays its old `run.finished` before the
 * `run.progress` ("retrying") that re-opened it, and the progress hook keeps the finished status until the
 * stream ends. A `run.progress` after a `run.finished` therefore means the run is working again. Once the
 * hook has re-read the run (`closed`) or polls it, the fetched status is the truth.
 */
export function streamedStatus(
  status: RunStatus,
  log: RunLogEntry[],
  transport: RunTransport
): RunStatus {
  if (isRunActive(status) || transport === "closed" || transport === "polling")
    return status
  let reopened = false
  for (let index = log.length - 1; index >= 0; index--) {
    const { event } = log[index]
    if (event.event === "run.finished") return reopened ? "running" : status
    if (event.event === "run.progress") reopened = true
  }
  return status
}
