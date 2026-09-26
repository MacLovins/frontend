import { Link, useParams } from "react-router"

import { ApiError } from "@/api/mutator"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { useCurrentService, withService } from "@/hooks/use-current-service"
import { useRunEvents } from "@/hooks/use-run-events"

import { RunHeader } from "./components/run-header"
import { RunPageSkeleton } from "./components/run-page-skeleton"
import { RunView } from "./components/run-view"
import { copy } from "./copy"

/** `/runs/:runId`: one analysis run, live company by company and stage by stage. */
export function RunPage() {
  const { runId } = useParams()
  const { serviceId } = useCurrentService()
  const events = useRunEvents(runId)
  const { data: run, error, refetch } = events.run

  if (run) return <RunView key={run.id} run={run} events={events} />
  if (!error) return <RunPageSkeleton />
  // 422: the id in the URL is not a UUID, so no such run either.
  const notFound =
    error instanceof ApiError && (error.status === 404 || error.status === 422)

  return (
    <div className="flex flex-col">
      <RunHeader title={copy.run} />
      {notFound ? (
        <EmptyState
          title={copy.notFound}
          actions={
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to={withService("/runs", serviceId)} />}
            >
              {copy.allRuns}
            </Button>
          }
        />
      ) : (
        <ErrorState error={error} onRetry={() => void refetch()} />
      )}
    </div>
  )
}
