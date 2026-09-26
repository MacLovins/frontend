import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { api } from "@/api/client"
import { Button } from "@/features/components/ui/button"
import { Input } from "@/features/components/ui/input"
import { useSession } from "@/features/session/session"
import { labels } from "@/lib/labels"
import { useServiceId } from "@/lib/use-service"

export function AccountsPage() {
  const { me } = useSession()
  const queryClient = useQueryClient()
  const serviceId = useServiceId()
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: api.companies })
  const countries = useQuery({ queryKey: ["countries"], queryFn: api.countries, staleTime: 60_000 })
  const industries = useQuery({ queryKey: ["industries"], queryFn: api.industries, staleTime: 60_000 })
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [country, setCountry] = useState("")
  const [industry, setIndustry] = useState("")
  const countryName = new Map((countries.data ?? []).map((item) => [item.code, item.name]))
  const industryName = new Map((industries.data ?? []).map((item) => [item.id, item.label]))
  const add = useMutation({
    mutationFn: () =>
      api.addCompany({
        name,
        domain,
        country_code: country || null,
        industry_ids: industry ? [industry] : [],
        tags: [],
      }),
    onSuccess: () => {
      toast.success("Company added")
      void queryClient.invalidateQueries({ queryKey: ["accounts"] })
      void queryClient.invalidateQueries({ queryKey: ["prospects"] })
      setName("")
      setDomain("")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not add this company"),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteCompany(id),
    onSuccess: () => {
      toast.success("Company removed")
      void queryClient.invalidateQueries({ queryKey: ["accounts"] })
    },
  })
  const analyze = useMutation({
    mutationFn: (ids: string[]) =>
      api.startRun({ kind: "analyze", company_ids: ids, service_ids: serviceId ? [serviceId] : [] }),
    onSuccess: () => toast.success("Analysis started"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not start analysis"),
  })

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-medium">{labels.accounts}</h1>
      <form
        className="grid gap-2 sm:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault()
          add.mutate()
        }}
      >
        <Input placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} required />
        <Input placeholder="domain.com" value={domain} onChange={(event) => setDomain(event.target.value)} required />
        <Select
          label="Country"
          value={country}
          options={(countries.data ?? []).map((item) => ({ value: item.code, label: item.name }))}
          onChange={setCountry}
        />
        <Select
          label="Industry"
          value={industry}
          options={(industries.data ?? []).map((item) => ({ value: item.id, label: item.label }))}
          onChange={setIndustry}
        />
        <Button type="submit">{labels.add}</Button>
      </form>
      <label className="text-sm">
        Import CSV
        <input
          className="mt-1 block text-sm"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) {
              return
            }
            void api.importCsv(file).then((report) => {
              toast.success(`Added ${report.created}, skipped ${report.skipped}`)
              void queryClient.invalidateQueries({ queryKey: ["accounts"] })
            })
          }}
        />
      </label>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Country</th>
              <th className="px-3 py-2">Industry</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {(accounts.data?.items ?? []).map((account) => (
              <tr key={account.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <div className="font-medium">{account.name}</div>
                  <div className="text-xs text-muted-foreground">{account.domain}</div>
                </td>
                <td className="px-3 py-2">{countryName.get(account.country_code ?? "") ?? account.country_code}</td>
                <td className="px-3 py-2">
                  {account.industry_ids.map((id) => industryName.get(id) ?? id).join(", ")}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button size="sm" variant="outline" onClick={() => analyze.mutate([account.id])}>
                    {labels.analyze}
                  </Button>
                  {me?.role === "admin" ? (
                    <Button size="sm" variant="destructive" className="ml-2" onClick={() => remove.mutate(account.id)}>
                      {labels.delete}
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function DiscoveryPage() {
  const serviceId = useServiceId()
  const [country, setCountry] = useState("")
  const [keywords, setKeywords] = useState("")
  const [search, setSearch] = useState({ country: "", keywords: [] as string[] })
  const [selected, setSelected] = useState<string[]>([])
  const queryClient = useQueryClient()
  const countries = useQuery({ queryKey: ["countries"], queryFn: api.countries, staleTime: 60_000 })
  const countryName = new Map((countries.data ?? []).map((item) => [item.code, item.name]))
  const discovery = useQuery({
    queryKey: ["discovery", serviceId, search],
    enabled: Boolean(serviceId),
    queryFn: () =>
      api.discover({
        service_id: serviceId,
        country: search.country || null,
        limit: 10,
        keywords: search.keywords,
      }),
  })
  const candidates = discovery.data?.items ?? []
  const allSelected = candidates.length > 0 && selected.length === candidates.length

  function acceptBody(item: (typeof candidates)[number]) {
    return {
      name: item.name,
      domain: item.domain,
      country_code: item.country_code,
      industry_ids: item.industry_ids,
      employees: item.employees,
      tags: [],
      service_id: serviceId || null,
    }
  }

  const addSelected = useMutation({
    mutationFn: async () => {
      const chosen = candidates.filter((item) => selected.includes(item.domain))
      return Promise.all(chosen.map((item) => api.acceptDiscovery(acceptBody(item))))
    },
    onSuccess: (added) => {
      toast.success(`Added ${added.length} companies to accounts`)
      void queryClient.invalidateQueries({ queryKey: ["accounts"] })
      void queryClient.invalidateQueries({ queryKey: ["prospects"] })
      void queryClient.invalidateQueries({ queryKey: ["discovery"] })
      setSelected([])
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not add companies"),
  })

  const analyzeSelected = useMutation({
    mutationFn: async () => {
      const chosen = candidates.filter((item) => selected.includes(item.domain))
      const added = await Promise.all(chosen.map((item) => api.acceptDiscovery(acceptBody(item))))
      return api.startRun({
        kind: "analyze",
        company_ids: added.map((item) => item.id),
        service_ids: serviceId ? [serviceId] : [],
      })
    },
    onSuccess: () => {
      toast.success("Analysis started for selected companies")
      void queryClient.invalidateQueries({ queryKey: ["accounts"] })
      void queryClient.invalidateQueries({ queryKey: ["runs"] })
      setSelected([])
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not start analysis"),
  })

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl font-medium">{labels.discover}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find and track high-fit target accounts across international corporate registries.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          label="Country"
          value={country}
          options={(countries.data ?? []).map((item) => ({ value: item.code, label: item.name }))}
          onChange={(value) => {
            setCountry(value)
            setSelected([])
          }}
        />
        <Input
          placeholder="Keywords, comma separated"
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          className="max-w-md flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSelected([])
            setSearch({
              country,
              keywords: keywords
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }}
          disabled={!serviceId || discovery.isFetching}
        >
          {discovery.isFetching ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="flex items-center justify-between border-b border-border pb-2 text-sm">
        <span className="font-medium text-foreground">
          {!serviceId
            ? "Choose a service to search."
            : discovery.isLoading
              ? "Scanning registries..."
              : `Found ${candidates.length} target accounts`}
        </span>
        {candidates.length > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(allSelected ? [] : candidates.map((item) => item.domain))}
            className="h-7 text-xs"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </Button>
        ) : null}
      </div>

      {candidates.length === 0 && !discovery.isLoading ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No companies found.
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {candidates.map((candidate) => {
            const isChecked = selected.includes(candidate.domain)
            return (
              <div
                key={candidate.domain}
                onClick={() => {
                  setSelected((current) =>
                    isChecked ? current.filter((domain) => domain !== candidate.domain) : [...current, candidate.domain],
                  )
                }}
                className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                  isChecked
                    ? "border-primary/60 bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-border hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="size-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <img
                    alt=""
                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(candidate.domain)}&sz=32`}
                    className="size-6 rounded-md bg-muted/60 p-0.5"
                  />
                  <div>
                    <div className="font-medium text-foreground group-hover:text-primary">{candidate.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{candidate.domain}</span>
                      <span>·</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
                        {countryName.get(candidate.country_code ?? "") ?? candidate.country_code ?? "—"}
                      </span>
                      {candidate.already_tracked ? <span>Tracked</span> : null}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">Fit {candidate.fit_score}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
        <span className="text-xs text-muted-foreground">
          {selected.length} of {candidates.length} companies selected
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={selected.length === 0 || addSelected.isPending}
            onClick={() => addSelected.mutate()}
          >
            {addSelected.isPending ? "Adding..." : `Add to Accounts (${selected.length})`}
          </Button>
          <Button
            size="sm"
            disabled={selected.length === 0 || analyzeSelected.isPending}
            onClick={() => analyzeSelected.mutate()}
          >
            {analyzeSelected.isPending ? "Starting..." : `${labels.analyze} (${selected.length})`}
          </Button>
        </div>
      </div>
    </section>
  )
}

function Select({
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
