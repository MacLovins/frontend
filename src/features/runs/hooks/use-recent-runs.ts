import { useListRuns } from "@/api/generated/runs/runs"
import { isRunActive } from "@/hooks/use-run-events"

const RECENT_RUNS = { limit: 20 }
const ACTIVE_REFRESH_MS = 10_000

/** GET /runs?limit=20, newest first; refreshed every 10 s while any run is active. */
export function useRecentRuns() {
  return useListRuns(RECENT_RUNS, {
    query: {
      refetchInterval: (query) =>
        query.state.data?.some((run) => isRunActive(run.status))
          ? ACTIVE_REFRESH_MS
          : false,
    },
  })
}
