import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link, useParams } from "react-router"
import { toast } from "sonner"

import { api } from "@/api/client"
import { Button } from "@/features/components/ui/button"
import { Input } from "@/features/components/ui/input"
import { labels } from "@/lib/labels"
import { useServiceId } from "@/lib/use-service"

export function ServicesPage() {
  const serviceId = useServiceId()
  const services = useQuery({ queryKey: ["services"], queryFn: api.services })

  return (
    <section className="flex flex-col gap-3">
      <h1 className="font-heading text-2xl font-medium">{labels.services}</h1>
      <ul className="flex flex-col gap-2 text-sm">
        {(services.data ?? []).map((service) => (
          <li key={service.id} className="rounded-xl border border-border p-4">
            <p className="font-medium">{service.name}</p>
            <p className="text-muted-foreground">{service.slug}</p>
            {service.description ? <p className="text-muted-foreground">{service.description}</p> : null}
            <div className="mt-2 flex flex-wrap gap-3">
              <Link className="underline" to={`/settings/${service.id}/questions?service=${serviceId}`}>
                {labels.questions}
              </Link>
              <Link className="underline" to={`/settings/${service.id}/icp?service=${serviceId}`}>
                {labels.icp}
              </Link>
              <Link className="underline" to={`/settings/${service.id}/rules?service=${serviceId}`}>
                {labels.rules}
              </Link>
              <Link className="underline" to={`/settings/${service.id}/scoring?service=${serviceId}`}>
                {labels.scoring}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function QuestionsPage() {
  const params = useParams()
  const fromQuery = useServiceId()
  const serviceId = params.serviceId ?? fromQuery
  const queryClient = useQueryClient()
  const questions = useQuery({
    queryKey: ["questions", serviceId],
    enabled: Boolean(serviceId),
    queryFn: () => api.questions(serviceId),
    refetchInterval: (query) => (query.state.data?.some((item) => item.keywords_status === "pending") ? 1000 : false),
  })
  const labelsMeta = useQuery({ queryKey: ["labels"], queryFn: api.labels, staleTime: 60_000 })
  const weightOptions = Object.keys(labelsMeta.data?.weights ?? {})
  const [draft, setDraft] = useState("")
  const save = useMutation({
    mutationFn: (text: string) =>
      api.createQuestion(serviceId, {
        key: questionKey(text),
        text,
        category: "ai_automation",
        polarity: "positive",
        weight: "medium",
        source_types: ["website", "news", "jobs"],
        recency_days: 180,
        job_titles: [],
        negative_terms: [],
      }),
    onSuccess: () => {
      toast.success("Question saved. Keywords are generating.")
      void queryClient.invalidateQueries({ queryKey: ["questions", serviceId] })
      setDraft("")
    },
  })
  const weight = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => api.updateQuestion(id, { weight: value }),
    onSuccess: () => {
      toast.success("Ranking updated")
      void queryClient.invalidateQueries({ queryKey: ["questions", serviceId] })
    },
  })
  const changed = (questions.data ?? []).filter((item) => item.keywords_status === "pending").length

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-medium">{labels.questions}</h1>
      {changed > 0 ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">{changed} questions changed — re-analyze affected companies.</p>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Question</th>
              <th className="px-3 py-2">Weight</th>
              <th className="px-3 py-2">Keywords</th>
            </tr>
          </thead>
          <tbody>
            {(questions.data ?? []).map((question) => (
              <tr key={question.id} className="border-t border-border">
                <td className="px-3 py-2">
                  {question.text}
                  <div className="text-xs text-muted-foreground">
                    {question.category} · {question.polarity} · {question.keywords_status}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={question.weight}
                    onChange={(event) => weight.mutate({ id: question.id, value: event.target.value })}
                  >
                    {weightOptions.includes(question.weight) ? null : <option value={question.weight}>{question.weight}</option>}
                    {weightOptions.map((option) => (
                      <option key={option} value={option}>
                        {labelsMeta.data?.weights[option] ?? option}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">{keywordText(question.keywords)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate(draft)
        }}
      >
        <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="New question" required />
        <Button type="submit">{labels.save}</Button>
      </form>
    </section>
  )
}

export function IcpPage() {
  const params = useParams()
  const fromQuery = useServiceId()
  const serviceId = params.serviceId ?? fromQuery
  const queryClient = useQueryClient()
  const icp = useQuery({ queryKey: ["icp", serviceId], queryFn: () => api.icp(serviceId), enabled: Boolean(serviceId) })
  const save = useMutation({
    mutationFn: () => {
      if (!icp.data) {
        throw new Error("missing")
      }
      return api.saveIcp(serviceId, {
        countries: icp.data.countries,
        industries_any: icp.data.industries_any,
        employees_min: icp.data.employees_min,
        employees_max: icp.data.employees_max,
        revenue_min_eur: icp.data.revenue_min_eur,
        nice_to_have: icp.data.nice_to_have,
      })
    },
    onSuccess: () => {
      toast.success("ICP saved")
      void queryClient.invalidateQueries({ queryKey: ["icp", serviceId] })
    },
  })
  const data = icp.data

  return (
    <section className="flex flex-col gap-3 text-sm">
      <h1 className="font-heading text-2xl font-medium">{labels.icp}</h1>
      {data ? (
        <>
          <p>Countries: {data.countries.join(", ") || "—"}</p>
          <p>Industries: {data.industries_any.join(", ") || "—"}</p>
          <p>
            Employees {data.employees_min ?? "—"}–{data.employees_max ?? "—"} · Revenue {data.revenue_min_eur ?? "—"}
          </p>
          {data.nice_to_have ? <p>Nice to have: {JSON.stringify(data.nice_to_have)}</p> : null}
          <Button className="self-start" onClick={() => save.mutate()}>
            {labels.save}
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground">{labels.loading}</p>
      )}
    </section>
  )
}

export function RulesPage() {
  const params = useParams()
  const fromQuery = useServiceId()
  const serviceId = params.serviceId ?? fromQuery
  const queryClient = useQueryClient()
  const rules = useQuery({
    queryKey: ["rules", serviceId],
    queryFn: () => api.rules(serviceId),
    enabled: Boolean(serviceId),
  })
  const [name, setName] = useState("")
  const save = useMutation({
    mutationFn: () => {
      return api.saveRule(serviceId, {
        name,
        kind: "domains",
        condition: { domains: name.split(/[,\s]+/).filter(Boolean) },
        action: "disqualify",
        is_active: true,
      })
    },
    onSuccess: () => {
      toast.success("Rule saved")
      setName("")
      void queryClient.invalidateQueries({ queryKey: ["rules", serviceId] })
    },
  })

  return (
    <section className="flex flex-col gap-3">
      <h1 className="font-heading text-2xl font-medium">{labels.rules}</h1>
      <ul className="text-sm">
        {(rules.data ?? []).map((rule) => (
          <li key={rule.id}>
            {rule.name} · {rule.kind} · {rule.action} · {JSON.stringify(rule.condition)}
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate()
        }}
      >
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Exclude domain list" required />
        <Button type="submit">{labels.save}</Button>
      </form>
    </section>
  )
}

export function ScoringPage() {
  const params = useParams()
  const fromQuery = useServiceId()
  const serviceId = params.serviceId ?? fromQuery
  const scoring = useQuery({
    queryKey: ["scoring", serviceId],
    queryFn: () => api.scoring(serviceId),
    enabled: Boolean(serviceId),
  })
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null)
  const paramsValue = draft ?? scoring.data?.params ?? null
  const save = useMutation({
    mutationFn: () => {
      if (!paramsValue) {
        throw new Error("missing")
      }
      return api.saveScoring(serviceId, { params: paramsValue })
    },
    onSuccess: (result) =>
      toast.success(
        `Rescored ${result.rescored} companies in ${(result.duration_ms / 1000).toFixed(1)} s, ${result.tier_changes} tier changes`,
      ),
  })

  if (!paramsValue) {
    return <p className="text-sm text-muted-foreground">{labels.loading}</p>
  }

  const fields = Object.entries(paramsValue)

  return (
    <form
      className="flex max-w-lg flex-col gap-3 text-sm"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
    >
      <h1 className="font-heading text-2xl font-medium">{labels.scoring}</h1>
      {fields.length === 0 ? <p className="text-muted-foreground">No scoring parameters yet.</p> : null}
      {fields.map(([key, value]) =>
        typeof value === "number" ? (
          <label key={key} className="flex flex-col gap-1">
            {key}
            <Input
              type="number"
              value={value}
              onChange={(event) => setDraft({ ...paramsValue, [key]: Number(event.target.value) })}
            />
          </label>
        ) : (
          <p key={key}>
            <span className="text-muted-foreground">{key}</span> {JSON.stringify(value)}
          </p>
        ),
      )}
      <Button type="submit" className="self-start">
        {labels.save}
      </Button>
    </form>
  )
}

function questionKey(text: string) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 128)
  return slug || `q-${Date.now()}`
}

function keywordText(keywords: { [key: string]: unknown } | null | undefined) {
  if (!keywords) {
    return ""
  }
  return Object.entries(keywords)
    .map(([key, value]) => (typeof value === "string" ? value : key))
    .join(", ")
}
