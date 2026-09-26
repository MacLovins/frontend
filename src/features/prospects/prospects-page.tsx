import { useQuery } from "@tanstack/react-query"
import { useNavigate, useSearchParams } from "react-router"

import { api } from "@/api/client"
import { Button } from "@/features/components/ui/button"
import { Input } from "@/features/components/ui/input"
import { faviconUrl } from "@/lib/format"
import { labels, tiers } from "@/lib/labels"
import { useServiceId } from "@/lib/use-service"
import { cn } from "cn"

export function ProspectsPage() {
  const serviceId = useServiceId()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const countries = useQuery({ queryKey: ["countries"], queryFn: api.countries, staleTime: 60_000 })
  const industries = useQuery({ queryKey: ["industries"], queryFn: api.industries, staleTime: 60_000 })
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
    queryFn: () => api.leads(query),
    enabled: Boolean(serviceId),
    staleTime: 30_000,
  })

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }
    if (serviceId) {
      next.set("service", serviceId)
    }
    setParams(next)
  }

  const rows = prospects.data?.items ?? []
  const counts = {
    hot: rows.filter((row) => row.score.tier === "hot").length,
    warm: rows.filter((row) => row.score.tier === "warm").length,
    cold: rows.filter((row) => row.score.tier === "cold").length,
    disqualified: rows.filter((row) => row.score.tier === "disqualified" || row.score.disqualified).length,
  }

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm">
        {tiers.hot} {counts.hot} · {tiers.warm} {counts.warm} · {tiers.cold} {counts.cold} · {tiers.disqualified}{" "}
        {counts.disqualified}
        {prospects.data ? <span className="text-muted-foreground"> · {prospects.data.total} total</span> : null}
      </p>
      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="Search…"
          value={query.q}
          onChange={(event) => setParam("q", event.target.value)}
        />
        <FilterSelect
          label="Country"
          value={query.country}
          options={(countries.data ?? []).map((country) => ({ value: country.code, label: country.name }))}
          onChange={(value) => setParam("country", value)}
        />
        <FilterSelect
          label="Industry"
          value={query.industry}
          options={(industries.data ?? []).map((industry) => ({ value: industry.id, label: industry.label }))}
          onChange={(value) => setParam("industry", value)}
        />
        <FilterSelect
          label="Tier"
          value={query.tier}
          options={["hot", "warm", "cold", "disqualified"].map((tier) => ({ value: tier, label: tiers[tier as keyof typeof tiers] }))}
          onChange={(value) => setParam("tier", value)}
        />
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
            max={100}
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
      {!prospects.isLoading && !prospects.isError && rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          {query.q || query.country || query.tier ? labels.emptyFilters : labels.emptyLeads}
        </div>
      ) : null}
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">{labels.priority}</th>
                <th className="px-3 py-2">{labels.fit} · intent · risk</th>
                <th className="px-3 py-2">{labels.whyNow}</th>
                <th className="px-3 py-2">Signals</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.company.id}
                  tabIndex={0}
                  className="cursor-pointer border-t border-border hover:bg-muted/40"
                  onClick={() => navigate(`/companies/${row.company.id}?service=${serviceId}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      navigate(`/companies/${row.company.id}?service=${serviceId}`)
                    }
                  }}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 font-medium">
                      <img alt="" src={faviconUrl(row.company.domain)} className="size-4" />
                      {row.company.name}{" "}
                      <span className="text-muted-foreground">{row.company.country_code}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{row.company.domain}</div>
                  </td>
                  <td className="px-3 py-3">
                    {row.score.priority} <TierBadge tier={row.score.tier} disqualified={row.score.disqualified} />
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {row.score.fit} · {row.score.intent} · {row.score.risk}
                  </td>
                  <td className="px-3 py-3">
                    <ul className="max-w-sm space-y-1">
                      {row.top_reasons.map((item, index) => (
                        <li key={index}>{recordText(item)}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-3 py-3">
                    {row.signals_count}{" "}
                    {row.new_signals_7d > 0 ? (
                      <span className="rounded bg-primary/15 px-1.5 py-0.5 text-xs">
                        {row.new_signals_7d} {labels.new}
                      </span>
                    ) : null}
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

function TierBadge({ tier, disqualified }: { tier: string; disqualified: boolean }) {
  const key = disqualified ? "disqualified" : tier
  const label = key in tiers ? tiers[key as keyof typeof tiers] : tier
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs",
        key === "hot" && "bg-primary/15 text-primary",
        key === "warm" && "bg-chart-2/20",
        key === "cold" && "bg-muted text-muted-foreground",
        key === "disqualified" && "bg-destructive/10 text-destructive",
      )}
    >
      {label}
    </span>
  )
}

function recordText(value: { [key: string]: unknown }) {
  for (const key of ["text", "summary", "reason", "label"]) {
    const item = value[key]
    if (typeof item === "string" && item) {
      return item
    }
  }
  const compact = JSON.stringify(value)
  return compact === "{}" ? "" : compact
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
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
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
