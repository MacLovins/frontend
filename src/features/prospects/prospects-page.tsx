import { useQuery } from "@tanstack/react-query"
import { useNavigate, useSearchParams } from "react-router"

import { api } from "@/api/client"
import type { Tier } from "@/api/types"
import { Button } from "@/features/components/ui/button"
import { Input } from "@/features/components/ui/input"
import { useServiceId } from "@/lib/use-service"
import { faviconUrl, relativeDate } from "@/lib/format"
import { labels, tiers } from "@/lib/labels"
import { cn } from "cn"

export function ProspectsPage() {
  const serviceId = useServiceId()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const query = {
    serviceId,
    q: params.get("q") ?? "",
    country: params.get("country") ?? "",
    industry: params.get("industry") ?? "",
    tier: params.get("tier") ?? "",
    onlyNew: params.get("new") === "1",
    minPriority: Number(params.get("min") ?? "0"),
  }
  const prospects = useQuery({
    queryKey: ["prospects", query],
    queryFn: () => api.prospects(query),
    staleTime: 30_000,
  })

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    next.set("service", serviceId)
    setParams(next)
  }

  const rows = prospects.data ?? []
  const counts = {
    hot: rows.filter((row) => row.tier === "hot").length,
    warm: rows.filter((row) => row.tier === "warm").length,
    cold: rows.filter((row) => row.tier === "cold").length,
    disqualified: rows.filter((row) => row.tier === "disqualified").length,
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p>
          {tiers.hot} {counts.hot} · {tiers.warm} {counts.warm} · {tiers.cold} {counts.cold} ·{" "}
          {tiers.disqualified} {counts.disqualified}
        </p>
        <p className="text-muted-foreground">
          {labels.precision} 86% (124)
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search…"
          value={query.q}
          onChange={(event) => setParam("q", event.target.value)}
        />
        <FilterSelect label="Country" value={query.country} options={["Germany", "Romania"]} onChange={(value) => setParam("country", value)} />
        <FilterSelect label="Industry" value={query.industry} options={["Logistics", "Industrial", "Food"]} onChange={(value) => setParam("industry", value)} />
        <FilterSelect label="Tier" value={query.tier} options={["hot", "warm", "cold", "disqualified"]} onChange={(value) => setParam("tier", value)} />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={query.onlyNew}
            onChange={(event) => setParam("new", event.target.checked ? "1" : "")}
          />
          New signals
        </label>
        <label className="flex items-center gap-2 text-sm">
          Min priority
          <input
            type="range"
            min={0}
            max={80}
            value={query.minPriority}
            onChange={(event) => setParam("min", event.target.value === "0" ? "" : event.target.value)}
          />
        </label>
      </div>
      {prospects.isLoading ? <p className="text-sm text-muted-foreground">{labels.loading}</p> : null}
      {prospects.isError ? (
        <Button variant="outline" onClick={() => void prospects.refetch()}>
          {labels.retry}
        </Button>
      ) : null}
      {!prospects.isLoading && rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          {query.q || query.country || query.tier ? labels.emptyFilters : labels.emptyLeads}
        </div>
      ) : null}
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">{labels.priority}</th>
                <th className="px-3 py-2">{labels.fit} · {labels.signals} · {labels.blockers}</th>
                <th className="px-3 py-2">{labels.whyNow}</th>
                <th className="px-3 py-2">Signals</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={0}
                  className="cursor-pointer border-t border-border hover:bg-muted/40"
                  onClick={() => navigate(`/companies/${row.id}?service=${serviceId}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      navigate(`/companies/${row.id}?service=${serviceId}`)
                    }
                  }}
                >
                  <td className="px-3 py-3">{row.rank}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      <img alt="" src={faviconUrl(row.domain)} className="size-4" />
                      {row.name} <span className="text-muted-foreground">{row.countryCode}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.domain} · {row.industry}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {row.priority} <TierBadge tier={row.tier} />
                  </td>
                  <td className="px-3 py-3">
                    <MiniBars fit={row.fit} signals={row.signals} blockers={row.blockers} />
                  </td>
                  <td className="px-3 py-3">
                    <ul className="max-w-sm space-y-1">
                      {row.whyNow.map((item) => (
                        <li key={item.text}>
                          {item.positive ? "✓" : "⚠"} {item.text}
                          <span className="text-muted-foreground"> · {item.source} · {relativeDate(item.date)}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-3">
                    {row.signalCount} {row.newCount > 0 ? <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs">{row.newCount} {labels.new}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs",
        tier === "hot" && "bg-primary/15 text-primary",
        tier === "warm" && "bg-chart-2/20",
        tier === "cold" && "bg-muted text-muted-foreground",
        tier === "disqualified" && "bg-destructive/10 text-destructive",
      )}
    >
      {tier === "hot" ? "🔥 " : tier === "disqualified" ? "⊘ " : ""}
      {tiers[tier]}
    </span>
  )
}

function MiniBars({ fit, signals, blockers }: { fit: number; signals: number; blockers: number }) {
  return (
    <div className="flex w-36 flex-col gap-1" title={`${labels.fit} ${fit}, ${labels.signals} ${signals}, ${labels.blockers} ${blockers}`}>
      <Bar value={fit} />
      <Bar value={signals} />
      <Bar value={blockers} />
    </div>
  )
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-1.5 rounded bg-muted">
      <div className="h-1.5 rounded bg-primary" style={{ width: `${value}%` }} />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  return (
    <select
      aria-label={label}
      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
