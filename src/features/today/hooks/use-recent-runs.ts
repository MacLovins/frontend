import { useListRuns } from "@/api/generated/runs/runs"

/** Newest runs first; `run.finished` events carry no run kind or services, so the feed joins them from here. */
export function useRecentRuns() {
  return useListRuns({ limit: 100 }, { query: { refetchInterval: 60_000 } })
}
