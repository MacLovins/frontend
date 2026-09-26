import { cn } from "cn"
import { Link } from "react-router"

import type { RunOut } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { withService } from "@/hooks/use-current-service"

import {
  copy,
  kindLabels,
  plural,
  runStatusLabels,
  runStatusText,
} from "../copy"
import { useRecentRuns } from "../hooks/use-recent-runs"
import { runTime, shortId } from "../lib/run-format"
import { RunCard } from "./run-card"

const SHOWN = 5

function RecentRunRow({
  run,
  serviceId,
}: {
  run: RunOut
  serviceId: string | undefined
}) {
  const { done, failed, paused, total } = run.progress
  return (
    <Link
      to={withService(`/runs/${run.id}`, serviceId)}
      className="-mx-2 flex gap-2.5 rounded-sm px-2 py-1 text-black hover:bg-canvas focus-visible:outline-2 focus-visible:outline-black"
    >
      <span className="font-mono text-muted-foreground">{shortId(run.id)}</span>
      <span className="min-w-0 flex-1">
        {kindLabels[run.kind]} · {plural(total, "company", "companies")}
        <br />
        <span className="text-muted-foreground">
          {done} done · {failed} failed · {paused} paused ·{" "}
          {runTime(run.finished_at ?? run.created_at)}
        </span>
      </span>
      <span className={cn("font-semibold", runStatusText[run.status])}>
        {runStatusLabels[run.status]}
      </span>
    </Link>
  )
}

export function RecentRunsCard({
  currentId,
  serviceId,
  onStart,
}: {
  currentId: string
  serviceId: string | undefined
  onStart: () => void
}) {
  const runs = useRecentRuns()
  const others = (runs.data ?? [])
    .filter((run) => run.id !== currentId)
    .slice(0, SHOWN)

  return (
    <RunCard
      title={copy.recentTitle}
      action={
        <Button variant="link" className="text-[13px]" onClick={onStart}>
          {copy.startAnalysis}
        </Button>
      }
    >
      <div className="flex flex-col gap-0.5 text-[13px]">
        {runs.isPending ? (
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="my-1 h-9" />
          ))
        ) : runs.isError && !runs.data ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            {copy.recentError}
            <Button
              variant="link"
              className="text-[13px]"
              onClick={() => void runs.refetch()}
            >
              {copy.tryAgain}
            </Button>
          </div>
        ) : others.length === 0 ? (
          <p className="m-0 text-muted-foreground">{copy.recentEmpty}</p>
        ) : (
          others.map((run) => (
            <RecentRunRow key={run.id} run={run} serviceId={serviceId} />
          ))
        )}
      </div>
    </RunCard>
  )
}
