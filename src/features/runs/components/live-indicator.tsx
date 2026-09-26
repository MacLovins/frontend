import { cn } from "cn"

import type { RunStatus } from "@/api/generated/model"
import { isRunActive, type RunTransport } from "@/hooks/use-run-events"

import { copy, runStatusLabels, runStatusText } from "../copy"

const transportStates: Record<RunTransport, { dot: string; label: string }> = {
  live: { dot: "bg-live", label: copy.live },
  polling: { dot: "bg-warning", label: copy.polling },
  connecting: { dot: "bg-faint", label: copy.connecting },
  // The stream closes once the run is over; until the run query catches up, it is reconnecting.
  closed: { dot: "bg-faint", label: copy.connecting },
}

/** How the page is getting updates while the run is active; the run's outcome once it is over. */
export function LiveIndicator({
  status,
  transport,
}: {
  status: RunStatus
  transport: RunTransport
}) {
  if (!isRunActive(status)) {
    return (
      <span
        className={cn(
          "shrink-0 text-[13px] font-semibold",
          runStatusText[status]
        )}
      >
        {runStatusLabels[status]}
      </span>
    )
  }
  const { dot, label } = transportStates[transport]
  return (
    <span
      role="status"
      className="flex shrink-0 items-center gap-1.5 text-[13px] font-semibold"
    >
      <span aria-hidden className={cn("size-2 rounded-full", dot)} />
      {label}
    </span>
  )
}
