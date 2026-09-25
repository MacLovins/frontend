import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link, useParams } from "react-router"
import { toast } from "sonner"

import { api } from "@/api/client"
import type { Question, Rule, Scoring, Weight } from "@/api/types"
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
            <p className="text-muted-foreground">Preset {service.preset}</p>
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
    queryFn: () => api.questions(serviceId),
    refetchInterval: (query) =>
      query.state.data?.some((item) => item.keywordStatus === "pending") ? 1000 : false,
  })
  const [draft, setDraft] = useState("")
  const save = useMutation({
    mutationFn: (question: Question) => api.saveQuestion(question),
    onSuccess: () => {
      toast.success("Question saved. Keywords are generating.")
      void queryClient.invalidateQueries({ queryKey: ["questions", serviceId] })
      setDraft("")
    },
  })
  const weight = useMutation({
    mutationFn: ({ id, value }: { id: string; value: Weight }) => api.setWeight(id, value),
    onSuccess: (result) => {
      toast.success(result.message)
      void queryClient.invalidateQueries({ queryKey: ["questions", serviceId] })
    },
  })
  const changed = (questions.data ?? []).filter((item) => item.keywordStatus === "pending").length

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
                    {question.category} · {question.polarity} · {question.keywordStatus}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={question.weight}
                    onChange={(event) =>
                      weight.mutate({ id: question.id, value: event.target.value as Weight })
                    }
                  >
                    <option>H</option>
                    <option>M</option>
                    <option>L</option>
                  </select>
                </td>
                <td className="px-3 py-2">{question.keywords.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate({
            id: `q-${Date.now()}`,
            serviceId,
            text: draft,
            category: "Automation & AI projects",
            polarity: "+",
            weight: "M",
            sources: ["web"],
            windowDays: 180,
            keywordStatus: "pending",
            keywords: [],
            active: true,
          })
        }}
      >
        <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="New question" required />
        <Button type="submit">{labels.save}</Button>
      </form>
    </section>
  )
}

export function IcpPage() {
  const icp = useQuery({ queryKey: ["icp"], queryFn: api.icp })
  const save = useMutation({
    mutationFn: () => {
      if (!icp.data) {
        throw new Error("missing")
      }
      return api.saveIcp({ ...icp.data, countries: ["Germany", "Romania", "Poland"] })
    },
    onSuccess: () => toast.success("ICP saved"),
  })
  const data = icp.data

  return (
    <section className="flex flex-col gap-3 text-sm">
      <h1 className="font-heading text-2xl font-medium">{labels.icp}</h1>
      {data ? (
        <>
          <p>Must-have countries: {data.countries.join(", ")}</p>
          <p>Industries: {data.industries.join(", ")}</p>
          <p>Headcount {data.headcount} · Revenue {data.revenue}</p>
          <ul>
            {data.nice.map((item) => (
              <li key={item.label}>
                {item.label} · weight {item.weight}
              </li>
            ))}
          </ul>
          <Button className="self-start" onClick={() => save.mutate()}>
            Apply region preset
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
  const rules = useQuery({ queryKey: ["rules", serviceId], queryFn: () => api.rules(serviceId) })
  const [name, setName] = useState("")
  const save = useMutation({
    mutationFn: () => {
      const rule: Rule = {
        id: `rule-${Date.now()}`,
        serviceId,
        name,
        kind: "domains",
        effect: "exclude",
        detail: name,
      }
      return api.saveRule(rule)
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
            {rule.name} · {rule.effect} · {rule.detail}
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
  const scoring = useQuery({ queryKey: ["scoring"], queryFn: api.scoring })
  const [draft, setDraft] = useState<Scoring | null>(null)
  const value = draft ?? scoring.data ?? null
  const save = useMutation({
    mutationFn: () => {
      if (!value) {
        throw new Error("missing")
      }
      return api.saveScoring(value)
    },
    onSuccess: (result) => toast.success(result.message),
  })

  if (!value) {
    return <p className="text-sm text-muted-foreground">{labels.loading}</p>
  }

  return (
    <form
      className="flex max-w-lg flex-col gap-3 text-sm"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
    >
      <h1 className="font-heading text-2xl font-medium">{labels.scoring}</h1>
      <NumberField
        label="Half-life for news: after this many days a news signal counts half as much"
        value={value.newsHalfLife}
        onChange={(newsHalfLife) => setDraft({ ...value, newsHalfLife })}
      />
      <NumberField
        label="How much ICP fit counts versus buying signals"
        value={value.fitBalance}
        onChange={(fitBalance) => setDraft({ ...value, fitBalance })}
      />
      <NumberField
        label="Penalty when blockers are high"
        value={value.riskPenalty}
        onChange={(riskPenalty) => setDraft({ ...value, riskPenalty })}
      />
      <NumberField label="Hot threshold" value={value.hot} onChange={(hot) => setDraft({ ...value, hot })} />
      <NumberField label="Warm threshold" value={value.warm} onChange={(warm) => setDraft({ ...value, warm })} />
      <NumberField
        label="Minimum confidence before a signal counts"
        value={value.minConfidence}
        onChange={(minConfidence) => setDraft({ ...value, minConfidence })}
      />
      <Button type="submit" className="self-start">
        {labels.save}
      </Button>
    </form>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      {label}
      <Input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}
