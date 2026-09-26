import { WarningCircleIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useOverdue } from "@/features/outreach/hooks/use-overdue"

// The job stays queued forever when no worker runs; after this the copy stops promising a quick draft.
const SLOW_JOB_MS = 90_000

const lineWidths = ["92%", "100%", "85%", "100%", "70%", "96%", "40%"]

export function DraftWriting({
  signalCount,
  createdAt,
}: {
  signalCount: number
  createdAt: string | null
}) {
  const slow = useOverdue(createdAt, SLOW_JOB_MS)

  return (
    <div
      className="flex min-h-[360px] flex-col gap-2.5 px-6 py-5"
      aria-busy="true"
    >
      {lineWidths.map((width, index) => (
        <Skeleton key={index} className="h-3.5" style={{ width }} />
      ))}
      <p role="status" className="m-0 mt-2 text-[13px] text-muted-foreground">
        {slow
          ? "This is taking longer than usual. The draft will appear here when it's ready."
          : signalCount
            ? `Writing the draft from ${signalCount} verified signal${signalCount === 1 ? "" : "s"}…`
            : "Writing the draft…"}
      </p>
    </div>
  )
}

export function DraftFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex min-h-[360px] flex-col items-center justify-center gap-2 px-6 py-10 text-center"
    >
      <WarningCircleIcon
        aria-hidden="true"
        className="size-8 text-negative-strong"
      />
      <h3 className="m-0 text-base font-bold">
        The draft could not be written
      </h3>
      <p className="m-0 max-w-[420px] text-[13px] leading-[1.45] text-muted-foreground">
        Try again. If it keeps failing, the company or service may have been
        removed.
      </p>
      <Button variant="outline" className="mt-2" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
