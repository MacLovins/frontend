import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

import { copy } from "../copy"

/** Black bar under the table; sticks to the bottom of the window so it stays reachable in a 50-row list. */
export function SelectionBar({
  count,
  note,
  pending,
  progress,
  onAdd,
}: {
  count: number
  note: string
  pending: boolean
  progress: { done: number; total: number }
  onAdd: () => void
}) {
  return (
    <div className="sticky bottom-5 flex items-center gap-3 rounded-lg bg-black px-4 py-3.5 text-white">
      <span className="shrink-0 text-sm">
        <strong>{count}</strong> {copy.selection.selected}
      </span>
      <span className="min-w-0 text-[13px] text-white/80">{note}</span>
      <Button
        className="ml-auto"
        disabled={count === 0 || pending}
        onClick={onAdd}
      >
        {pending ? (
          <>
            <Spinner />
            {copy.selection.adding(progress.done, progress.total)}
          </>
        ) : (
          copy.selection.add
        )}
      </Button>
    </div>
  )
}
