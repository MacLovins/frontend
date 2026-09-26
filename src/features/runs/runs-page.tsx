import { useState } from "react"
import { Link, Navigate, useLocation } from "react-router"

import { EmptyState, ErrorState } from "@/components/common/states"
import { PageHeader } from "@/components/common/page-header"
import { Button } from "@/components/ui/button"
import { useCurrentService, withService } from "@/hooks/use-current-service"
import { isRunActive } from "@/hooks/use-run-events"

import { RunPageSkeleton } from "./components/run-page-skeleton"
import { StartAnalysisDialog } from "./components/start-analysis-dialog"
import { copy } from "./copy"
import { useRecentRuns } from "./hooks/use-recent-runs"

/** `/runs` has no list of its own: it opens the newest active run, else the newest run. */
export function RunsPage() {
  const runs = useRecentRuns()
  const { search } = useLocation()
  const { serviceId } = useCurrentService()
  const [starting, setStarting] = useState(false)

  if (runs.isPending) return <RunPageSkeleton />

  const target =
    runs.data?.find((run) => isRunActive(run.status)) ?? runs.data?.[0]
  if (target)
    return <Navigate to={{ pathname: `/runs/${target.id}`, search }} replace />

  return (
    <div className="flex flex-col">
      <PageHeader title={copy.runs} />
      {runs.isError ? (
        <ErrorState error={runs.error} onRetry={() => void runs.refetch()} />
      ) : (
        <EmptyState
          title={copy.empty.title}
          actions={
            <>
              <Button onClick={() => setStarting(true)}>
                {copy.startAnalysis}
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link to={withService("/accounts", serviceId)} />}
              >
                {copy.empty.accounts}
              </Button>
            </>
          }
        >
          {copy.empty.body}
        </EmptyState>
      )}
      <StartAnalysisDialog open={starting} onOpenChange={setStarting} />
    </div>
  )
}
