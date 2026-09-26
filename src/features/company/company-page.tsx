import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useParams } from "react-router"
import { toast } from "sonner"

import { api } from "@/api/client"
import type { Feedback } from "@/api/types"
import { Button } from "@/features/components/ui/button"
import { Input } from "@/features/components/ui/input"
import { faviconUrl, relativeDate } from "@/lib/format"
import { labels, tiers } from "@/lib/labels"
import { linkedinSearchUrl } from "@/lib/linkedin"
import { useServiceId } from "@/lib/use-service"

export function CompanyPage() {
  const { id = "" } = useParams()
  const serviceId = useServiceId()
  const [tab, setTab] = useState<"score" | "sources">("score")
  const queryClient = useQueryClient()
  const company = useQuery({
    queryKey: ["company", id],
    queryFn: () => api.company(id),
  })
  const feedback = useMutation({
    mutationFn: (input: { signalId: string; feedback: Feedback }) =>
      api.feedback(id, serviceId, input.signalId, input.feedback),
    onSuccess: (next) => {
      queryClient.setQueryData(["company", id], next)
      void queryClient.invalidateQueries({ queryKey: ["prospects"] })
      toast.success("Feedback saved")
    },
  })
  const notes = useMutation({
    mutationFn: (value: string) => api.notes(id, value),
    onSuccess: () => toast.success("Notes saved"),
  })
  const rerun = useMutation({
    mutationFn: () => api.startRun(serviceId, [id]),
    onSuccess: () => toast.success("Re-analyze started"),
  })

  if (company.isLoading) {
    return <p className="text-sm text-muted-foreground">{labels.loading}</p>
  }
  if (company.isError || !company.data) {
    return <Button onClick={() => void company.refetch()}>{labels.retry}</Button>
  }

  const data = company.data
  const score = data.scores[serviceId]
  const reasons = data.whyNow[serviceId] ?? []
  const breakdown = data.breakdown[serviceId] ?? []
  const signals = data.signals[serviceId] ?? []

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-medium">
            <img alt="" src={faviconUrl(data.domain)} className="size-5" />
            {data.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            <a className="underline" href={`https://${data.domain}`} target="_blank" rel="noreferrer">
              {data.domain}
            </a>{" "}
            · {data.country} · {data.industry} · {data.employees}
          </p>
        </div>
        <Button disabled={rerun.isPending} onClick={() => rerun.mutate()}>
          {labels.reanalyze}
        </Button>
      </header>
      <div className="flex gap-2 text-sm">
        <button type="button" className="rounded-lg bg-muted px-3 py-1" onClick={() => setTab("score")}>
          Score
        </button>
        <button type="button" className="rounded-lg px-3 py-1" onClick={() => setTab("sources")}>
          {labels.sources}
        </button>
      </div>
      {tab === "sources" ? (
        <ul className="flex flex-col gap-2 text-sm">
          {data.sources.length === 0 ? <li className="text-muted-foreground">Nothing scanned yet.</li> : null}
          {data.sources.map((source) => (
            <li key={source.url + source.title}>
              <a className="underline" href={source.url} target="_blank" rel="noreferrer">
                {source.title}
              </a>{" "}
              · {source.type} · {relativeDate(source.date)}
            </li>
          ))}
        </ul>
      ) : (
        <>
          {score ? (
            <p className="text-sm">
              {labels.priority} {score.priority} · {tiers[score.tier]} · {labels.fit} {score.fit} · {labels.signals}{" "}
              {score.signals} · {labels.blockers} {score.blockers}
            </p>
          ) : null}
          <section>
            <h2 className="font-medium">{labels.whyNow}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {reasons.map((item) => (
                <li key={item.text}>
                  {item.positive ? "✓" : "⚠"} {item.text} — {item.source} · {relativeDate(item.date)}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-medium">Score breakdown</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {breakdown.map((row) => (
                <li key={row.label} className="grid grid-cols-[1fr_8rem_4rem] items-center gap-2">
                  <span>
                    {row.label} ({row.weight})
                  </span>
                  <span className="h-2 rounded bg-muted">
                    <span className="block h-2 rounded bg-primary" style={{ width: `${row.width}%` }} />
                  </span>
                  <span>{row.delta > 0 ? `+${row.delta}` : row.delta}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="font-medium">Evidence by question</h2>
            {signals.map((signal) => (
              <article key={signal.id} className="rounded-xl border border-border p-4 text-sm">
                <h3 className="font-medium">{signal.question}</h3>
                <p className="mt-2">“{signal.quote}”</p>
                <p className="mt-1 text-muted-foreground">
                  {signal.source} · {relativeDate(signal.date)} · {signal.strength} · {signal.confidence}%
                </p>
                <div className="mt-3 flex gap-2">
                  {(["correct", "wrong", "irrelevant"] as const).map((value) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={signal.feedback === value ? "default" : "outline"}
                      onClick={() => feedback.mutate({ signalId: signal.id, feedback: value })}
                    >
                      {value === "correct" ? labels.correct : value === "wrong" ? labels.wrong : labels.irrelevant}
                    </Button>
                  ))}
                </div>
              </article>
            ))}
          </section>
          <section>
            <h2 className="font-medium">Decision makers to validate</h2>
            <ul className="mt-2 flex flex-wrap gap-3 text-sm">
              {data.decisionMakers.map((title) => (
                <li key={title}>
                  <a className="underline" href={linkedinSearchUrl(title, data.name)} target="_blank" rel="noreferrer">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <NotesForm initial={data.notes} onSave={(value) => notes.mutate(value)} />
        </>
      )}
    </article>
  )
}

function NotesForm({ initial, onSave }: { initial: string; onSave: (value: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(value)
      }}
    >
      <label className="text-sm font-medium">
        Notes / LinkedIn URL
        <Input className="mt-1" value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <Button type="submit" variant="outline" className="self-start">
        {labels.save}
      </Button>
    </form>
  )
}
