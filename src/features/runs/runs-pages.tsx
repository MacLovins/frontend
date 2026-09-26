import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"

import { api } from "@/api/client"
import { Button } from "@/features/components/ui/button"
import { labels } from "@/lib/labels"
import { useServiceId } from "@/lib/use-service"

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
              {run.kind}
            </Link>{" "}
            · {run.status} · {run.created_at}
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
    queryFn: () => api.run(id),
    refetchInterval: (query) => (query.state.data?.status === "finished" ? false : 2000),
  })

  if (run.isLoading) {
    return <p className="text-sm text-muted-foreground">{labels.loading}</p>
  }
  if (run.isError || !run.data) {
    return <Button onClick={() => void run.refetch()}>{labels.retry}</Button>
  }

  const data = run.data
  const progress = Object.entries(data.progress).filter(
    ([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean",
  )

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-medium">{data.kind}</h1>
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
        {data.status}
        {data.error ? ` · ${data.error}` : ""}
      </p>
      <dl className="grid gap-1 text-sm">
        {progress.map(([key, value]) => (
          <div key={key}>
            <span className="text-muted-foreground">{key}</span> {String(value)}
          </div>
        ))}
      </dl>
    </section>
  )
}
