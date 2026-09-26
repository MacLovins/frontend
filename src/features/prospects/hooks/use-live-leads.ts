import { useListRuns } from "@/api/generated/runs/runs"
import { isRunActive, useRunEvents } from "@/hooks/use-run-events"

/**
 * While an analysis runs, follow its event stream so each `company.done` refreshes the ranked leads
 * (useRunEvents invalidates the /leads cache). Shares the sidebar's runs query.
 */
export function useLiveLeads() {
  const runs = useListRuns({ limit: 10 })
  const activeRun = runs.data?.find((run) => isRunActive(run.status))
  useRunEvents(activeRun?.id)
}
