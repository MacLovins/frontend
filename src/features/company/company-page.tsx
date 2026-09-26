import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useParams } from "react-router"
import { toast } from "sonner"

import { api } from "@/api/client"
import { Button } from "@/features/components/ui/button"
import { Input } from "@/features/components/ui/input"
import { faviconUrl, relativeDate } from "@/lib/format"
import { labels } from "@/lib/labels"
import { linkedinSearchUrl } from "@/lib/linkedin"
import { useServiceId } from "@/lib/use-service"

export function CompanyPage() {
  const { id = "" } = useParams()
  const serviceId = useServiceId()
  const [tab, setTab] = useState<"score" | "sources">("score")
  const queryClient = useQueryClient()
  const lead = useQuery({
    queryKey: ["lead", id, serviceId],
    queryFn: () => api.lead(id, serviceId),
    enabled: Boolean(id && serviceId),
  })
  const feedback = useMutation({
    mutationFn: (input: { signalId: string; verdict: string }) =>
      api.feedback(input.signalId, { verdict: input.verdict, service_id: serviceId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["lead", id, serviceId] })
      void queryClient.invalidateQueries({ queryKey: ["prospects"] })
      toast.success("Feedback saved")
    },
  })
  const notes = useMutation({
    mutationFn: (value: string) => api.notes(id, { notes: value }),
    onSuccess: () => toast.success("Notes saved"),
  })
  const rerun = useMutation({
    mutationFn: () => api.startRun({ kind: "analyze", company_ids: [id], service_ids: [serviceId] }),
    onSuccess: () => toast.success("Re-analyze started"),
  })

  if (!serviceId || lead.isLoading) {
    return <p className="text-sm text-muted-foreground">{labels.loading}</p>
  }
  if (lead.isError || !lead.data) {
    return <Button onClick={() => void lead.refetch()}>{labels.retry}</Button>
  }

  const data = lead.data
  const company = data.company

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-medium">
            <img alt="" src={faviconUrl(company.domain)} className="size-5" />
            {company.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            <a className="underline" href={company.homepage_url || `https://${company.domain}`} target="_blank" rel="noreferrer">
              {company.domain}
            </a>
            {company.country_code ? ` · ${company.country_code}` : ""}
            {company.employees != null ? ` · ${company.employees}` : ""}
          </p>
        </div>
        <Button disabled={rerun.isPending || !serviceId} onClick={() => rerun.mutate()}>
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
          {Object.keys(data.sources_summary).length === 0 ? (
            <li className="text-muted-foreground">Nothing scanned yet.</li>
          ) : null}
          {Object.entries(data.sources_summary).map(([source, count]) => (
            <li key={source}>
              {source} · {count}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <dl className="grid gap-1 text-sm">
            {scalarEntries(data.score).map(([key, value]) => (
              <div key={key}>
                <span className="text-muted-foreground">{key}</span> {String(value)}
              </div>
            ))}
          </dl>
          <section className="flex flex-col gap-3">
            <h2 className="font-medium">Evidence by question</h2>
            {data.signals_by_question.map((group, index) => (
              <article key={index} className="rounded-xl border border-border p-4 text-sm">
                <h3 className="font-medium">{recordLabel(group.question) || "Question"}</h3>
                <p className="mt-1 text-muted-foreground">
                  Strength {group.strength} · points {group.points}
                </p>
                <ul className="mt-3 flex flex-col gap-3">
                  {group.signals.map((signal) => (
                    <li key={signal.id}>
                      <p>“{signal.quote}”</p>
                      <p className="mt-1 text-muted-foreground">
                        {signal.source_name} · {signal.source_type}
                        {signal.event_date ? ` · ${relativeDate(signal.event_date)}` : ""} · {signal.strength} ·{" "}
                        {signal.confidence}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {(["correct", "wrong", "irrelevant"] as const).map((value) => (
                          <Button
                            key={value}
                            size="sm"
                            variant="outline"
                            onClick={() => feedback.mutate({ signalId: signal.id, verdict: value })}
                          >
                            {value === "correct" ? labels.correct : value === "wrong" ? labels.wrong : labels.irrelevant}
                          </Button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>
          <section>
            <h2 className="font-medium">Decision makers to validate</h2>
            <ul className="mt-2 flex flex-wrap gap-3 text-sm">
              {data.decision_makers.map((title) => (
                <li key={title}>
                  <a className="underline" href={linkedinSearchUrl(title, company.name)} target="_blank" rel="noreferrer">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
          <NotesForm initial={company.notes ?? ""} onSave={(value) => notes.mutate(value)} />
        </>
      )}
    </article>
  )
}

function scalarEntries(value: { [key: string]: unknown }) {
  return Object.entries(value).filter(
    ([, item]) => typeof item === "string" || typeof item === "number" || typeof item === "boolean",
  )
}

function recordLabel(value: { [key: string]: unknown }) {
  for (const key of ["text", "label", "key", "name"]) {
    const item = value[key]
    if (typeof item === "string" && item) {
      return item
    }
  }
  return ""
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
        Notes
        <Input className="mt-1" value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <Button type="submit" variant="outline" className="self-start">
        {labels.save}
      </Button>
    </form>
  )
}
