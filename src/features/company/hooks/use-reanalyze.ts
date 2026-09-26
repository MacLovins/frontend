import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import type { CompanyOut, RunStatus } from "@/api/generated/model"
import { useCreateRun, useListRuns } from "@/api/generated/runs/runs"
import { ApiError, errorMessage } from "@/api/mutator"
import type { CompanyDoneData, StageName } from "@/api/run-events"
import { withService } from "@/hooks/use-current-service"
import { useLabels } from "@/hooks/use-labels"
import { isRunActive, useRunEvents } from "@/hooks/use-run-events"
import { score } from "@/lib/format"
import { tierLabels } from "@/lib/labels"

type Outcome = CompanyDoneData["status"]

// When progress comes from polling there is no company.done event: read the outcome from the run instead.
const outcomeOfRun: Partial<Record<RunStatus, Outcome>> = {
  succeeded: "done",
  failed: "failed",
  cancelled: "cancelled",
  partial: "paused",
}

// One service can fail or pause while another is still working: those are not a stage to show as progress.
const terminalStages = new Set<StageName>(["done", "failed", "paused"])

/**
 * "Re-analyze" / "Analyze now": POST /runs for this company and every active service, then follow the run
 * inline (SSE via useRunEvents). A run already active for the company when the page opens is picked up too.
 */
export function useReanalyze({
  company,
  serviceId,
  priority,
}: {
  company: CompanyOut | undefined
  serviceId: string | undefined
  priority: number | undefined
}) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const label = useLabels()
  const companyId = company?.id
  const [startedRunId, setStartedRunId] = useState<string>()
  const baseline = useRef<{ runId?: string; priority?: number }>({})
  const handled = useRef(new Set<string>())

  const runs = useListRuns(
    { limit: 20 },
    { query: { enabled: !!companyId, staleTime: 0 } }
  )
  const resumed = runs.data?.find(
    (run) =>
      isRunActive(run.status) &&
      !!companyId &&
      run.params.company_ids.includes(companyId)
  )
  const runId = startedRunId ?? resumed?.id

  const events = useRunEvents(runId)
  const runStatus = events.run.data?.status
  // useRunEvents clears its per-company state in an effect, so right after a new run starts the previous
  // run's outcome is still there for one render. The run query is keyed by id and cannot be stale, so the
  // events are trusted only once it has loaded.
  const progress =
    companyId && runStatus ? events.companies[companyId] : undefined
  const outcome =
    progress?.outcome?.status ??
    (runStatus ? outcomeOfRun[runStatus] : undefined)
  const finished = !!outcome

  const viewRun = useCallback(
    (id: string) => ({
      label: "View run",
      onClick: () => void navigate(withService(`/runs/${id}`, serviceId)),
    }),
    [navigate, serviceId]
  )

  const createRun = useCreateRun({
    mutation: {
      meta: { errorToast: false },
      onSuccess: (run) => {
        baseline.current = { runId: run.id, priority }
        setStartedRunId(run.id)
        toast("Analysis started", { action: viewRun(run.id) })
      },
      onError: (error) =>
        toast.error(
          error instanceof ApiError
            ? errorMessage(error)
            : "Couldn't start the analysis"
        ),
    },
  })

  useEffect(() => {
    if (runId && baseline.current.runId !== runId)
      baseline.current = { runId, priority }
  }, [priority, runId])

  useEffect(() => {
    if (!runId || !company || !finished || handled.current.has(runId)) return
    handled.current.add(runId)
    void invalidateApi(
      queryClient,
      apiPaths.leads,
      apiPaths.companies,
      apiPaths.runs
    )

    if (outcome === "done") {
      const mine = progress?.outcome?.scores?.find(
        (item) => item.service_id === serviceId
      )
      const before =
        baseline.current.runId === runId ? baseline.current.priority : undefined
      const change = mine
        ? ` · Priority ${before === undefined ? "" : `${score(before)} → `}${score(mine.priority)} (${tierLabels[mine.tier]})`
        : ""
      toast.success(`${company.name} re-analyzed${change}`)
    } else if (outcome === "failed") {
      toast.error("Analysis failed", { action: viewRun(runId) })
    } else if (outcome === "paused") {
      toast("Analysis paused", {
        description: progress?.outcome?.message || undefined,
        action: viewRun(runId),
      })
    } else {
      toast("Analysis cancelled", { action: viewRun(runId) })
    }
  }, [
    company,
    finished,
    outcome,
    progress,
    queryClient,
    runId,
    serviceId,
    viewRun,
  ])

  const busy = createRun.isPending || (!!runId && !finished)
  const stage = progress?.stage
  const working = stage && !terminalStages.has(stage) ? stage : null

  return {
    busy,
    label: !busy
      ? "Re-analyze"
      : working
        ? `Analyzing · ${label("stages", working)}`
        : "Analyzing…",
    start: () => {
      if (!companyId || busy) return
      createRun.mutate({
        data: {
          kind: "analyze",
          mode: "incremental",
          company_ids: [companyId],
          service_ids: [],
        },
      })
    },
  }
}
