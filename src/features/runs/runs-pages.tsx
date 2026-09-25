import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"

import { advanceRun } from "@/api/mock"
import { api, mockEnabled } from "@/api/client"
import { Button } from "@/features/components/ui/button"
import { labels, stageLabels, stages } from "@/lib/labels"
import { useServiceId } from "@/lib/use-service"
import { cn } from "cn"

export function RunsPage() {
  const serviceId = useServiceId()
  const runs = useQuery({ queryKey: ["runs"], queryFn: api.runs, refetchInterval: 3000 })

  return (
    <section>
      <h1 className="font-heading text-2xl font-medium">{labels.runs}</h1>
      <ul className="mt-4 flex flex-col gap-2 text-sm">
        {(runs.data ?? []).length === 0 ? <li className="text-muted-foreground">No runs yet. Use Analyze.</li> : null}
        {(runs.data ?? []).map((run) => (
          <li key={run.id}>
            <Link className="underline" to={`/runs/${run.id}?service=${serviceId}`}>
              {run.id}
            </Link>{" "}
            · {run.status} · {run.companies.length} companies
          </li>
        ))}
      </ul>
    </section>
  )
}

export function RunDetailPage() {
  const { id = "" } = useParams()
  const run = useQuery({
    queryKey: ["run", id],
    queryFn: async () => {
      if (mockEnabled) {
        advanceRun(id)
      }
      return api.run(id)
    },
    refetchInterval: (query) => (query.state.data?.status === "finished" ? false : 2000),
  })

  if (run.isLoading) {
    return <p className="text-sm text-muted-foreground">{labels.loading}</p>
  }
  if (run.isError || !run.data) {
    return <Button onClick={() => void run.refetch()}>{labels.retry}</Button>
  }

  const data = run.data
  const done = data.companies.filter((company) => company.stage === "done").length

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium">{data.id}</h1>
        <Button
          variant="outline"
          onClick={() => {
            void api.retryFailed(id).then(() => run.refetch())
          }}
        >
          Retry failed
        </Button>
      </header>
      <p className="text-sm text-muted-foreground">
        {done} / {data.companies.length} · {data.status}
      </p>
      <div className="h-2 rounded bg-muted">
        <div
          className="h-2 rounded bg-primary"
          style={{ width: `${data.companies.length ? (done / data.companies.length) * 100 : 0}%` }}
        />
      </div>
      <ul className="flex flex-col gap-3">
        {data.companies.map((company) => (
          <li key={company.companyId} className="rounded-xl border border-border p-3 text-sm">
            <p className="font-medium">{company.name}</p>
            <p className="text-muted-foreground">{company.message}</p>
            <ol className="mt-2 flex flex-wrap gap-1">
              {stages.map((stage) => (
                <li
                  key={stage}
                  className={cn(
                    "rounded px-1.5 py-0.5 text-xs",
                    stages.indexOf(stage) <= stages.indexOf(company.stage) ? "bg-primary/15" : "bg-muted text-muted-foreground",
                  )}
                >
                  {stageLabels[stage]}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
    </section>
  )
}
