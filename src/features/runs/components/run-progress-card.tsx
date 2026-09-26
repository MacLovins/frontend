import type { RunProgress } from "@/api/generated/model"

import { copy } from "../copy"

const share = (count: number, total: number) =>
  `${total > 0 ? (count / total) * 100 : 0}%`

/** Done, failed and paused companies as segments of one bar. */
function StackedProgress({ progress }: { progress: RunProgress }) {
  const { done, failed, paused, total } = progress
  return (
    <div
      role="progressbar"
      aria-label={copy.progress.aria}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className="flex h-2.5 overflow-hidden rounded-[5px] bg-subtle"
    >
      <span
        className="block h-full bg-black transition-[width] duration-300"
        style={{ width: share(done, total) }}
      />
      <span
        className="block h-full bg-destructive transition-[width] duration-300"
        style={{ width: share(failed, total) }}
      />
      <span
        className="block h-full bg-warning transition-[width] duration-300"
        style={{ width: share(paused, total) }}
      />
    </div>
  )
}

export function RunProgressCard({
  progress,
  active,
}: {
  progress: RunProgress
  active: boolean
}) {
  return (
    <section className="flex flex-col gap-2.5 rounded-lg border border-border bg-card px-5 py-[18px]">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        <span className="font-mono text-[28px] font-semibold">
          {progress.done} / {progress.total}
        </span>
        <span>{copy.progress.done}</span>
        <span className="text-muted-foreground">
          {copy.progress.counts(progress.failed, progress.paused)}
        </span>
        {active ? (
          <span className="ml-auto text-muted-foreground">
            {copy.progress.leave}
          </span>
        ) : null}
      </div>
      <StackedProgress progress={progress} />
    </section>
  )
}
