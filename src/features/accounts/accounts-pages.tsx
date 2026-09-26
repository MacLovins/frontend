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
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: api.accounts })
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [country, setCountry] = useState("Germany")
  const [industry, setIndustry] = useState("Logistics")
  const serviceId = useServiceId()
  const add = useMutation({
    mutationFn: () => api.addAccount({ name, domain, country, industry }),
    onSuccess: () => {
      toast.success("Company added")
      void queryClient.invalidateQueries({ queryKey: ["accounts"] })
      void queryClient.invalidateQueries({ queryKey: ["prospects"] })
      setName("")
      setDomain("")
    },
    onError: () => toast.error("Could not add this company"),
  })
  const remove = useMutation({
    mutationFn: (id: string) => api.deleteAccount(id),
    onSuccess: () => {
      toast.success("Company removed")
      void queryClient.invalidateQueries({ queryKey: ["accounts"] })
    },
  })
  const analyze = useMutation({
    mutationFn: (ids: string[]) => api.startRun(serviceId, ids),
    onSuccess: () => toast.success("Analysis started"),
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
        <Input value={country} onChange={(event) => setCountry(event.target.value)} />
        <Input value={industry} onChange={(event) => setIndustry(event.target.value)} />
        <Button type="submit">{labels.add}</Button>
      </form>
      <label className="text-sm">
        Import CSV (name,domain,country,industry)
        <input
          className="mt-1 block text-sm"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) {
              return
            }
            void file.text().then((text) =>
              api.importCsv(text).then((report) => {
                toast.success(`Added ${report.added}, skipped ${report.skipped}`)
                void queryClient.invalidateQueries({ queryKey: ["accounts"] })
              }),
            )
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
            {(accounts.data ?? []).map((account) => (
              <tr key={account.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <div className="font-medium">{account.name}</div>
                  <div className="text-xs text-muted-foreground">{account.domain}</div>
                </td>
                <td className="px-3 py-2">{account.country}</td>
                <td className="px-3 py-2">{account.industry}</td>
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

const POPULAR_COUNTRIES = [
  { id: "Germany", label: "🇩🇪 Germany" },
  { id: "Switzerland", label: "🇨🇭 Switzerland" },
  { id: "Denmark", label: "🇩🇰 Denmark" },
  { id: "Netherlands", label: "🇳🇱 Netherlands" },
  { id: "France", label: "🇫🇷 France" },
  { id: "United States", label: "🇺🇸 USA" },
  { id: "all", label: "🌍 All Countries" },
]

export function DiscoveryPage() {
  const serviceId = useServiceId()
  const [country, setCountry] = useState("Germany")
  const [selected, setSelected] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { data: candidates = [], isLoading, isFetching } = useQuery({
    queryKey: ["discovery", country],
    queryFn: () => api.discover(country),
    staleTime: 30_000,
  })

  const allSelected = candidates.length > 0 && selected.length === candidates.length

  const handleSelectAll = () => {
    if (allSelected) {
      setSelected([])
    } else {
      setSelected(candidates.map((c) => c.id))
    }
  }

  const addSelected = useMutation({
    mutationFn: async () => {
      const chosen = candidates.filter((item) => selected.includes(item.id))
      return Promise.all(
        chosen.map((item) =>
          api.addAccount({
            name: item.name,
            domain: item.domain,
            country: item.country,
            industry: "Enterprise",
          }),
        ),
      )
    },
    onSuccess: (added) => {
      toast.success(`Added ${added.length} companies to accounts`)
      void queryClient.invalidateQueries({ queryKey: ["accounts"] })
      void queryClient.invalidateQueries({ queryKey: ["prospects"] })
      setSelected([])
    },
  })

  const analyzeSelected = useMutation({
    mutationFn: async () => {
      const chosen = candidates.filter((item) => selected.includes(item.id))
      await Promise.all(
        chosen.map((item) =>
          api
            .addAccount({
              name: item.name,
              domain: item.domain,
              country: item.country,
              industry: "Enterprise",
            })
            .catch(() => null),
        ),
      )
      return api.startRun(serviceId, chosen.map((item) => item.id))
    },
    onSuccess: () => {
      toast.success("Analysis started for selected companies")
      void queryClient.invalidateQueries({ queryKey: ["runs"] })
    },
  })

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl font-medium">{labels.discover}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Find and track high-fit target accounts across international corporate registries.
        </p>
      </div>

      {/* Country quick-select chips */}
      <div className="flex flex-wrap gap-2">
        {POPULAR_COUNTRIES.map((chip) => {
          const isActive = country.toLowerCase() === chip.id.toLowerCase()
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setCountry(chip.id === "all" ? "" : chip.id)
                setSelected([])
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Filter by country, company name, or domain (e.g. Germany, Switzerland, Siemens)..."
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void queryClient.invalidateQueries({ queryKey: ["discovery"] })
          }}
          disabled={isLoading || isFetching}
        >
          {isLoading || isFetching ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Results Header and Select All */}
      <div className="flex items-center justify-between border-b border-border pb-2 text-sm">
        <span className="font-medium text-foreground">
          {isLoading ? (
            "Scanning registries..."
          ) : (
            `Found ${candidates.length} target accounts ${country ? `for "${country}"` : ""}`
          )}
        </span>
        {candidates.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleSelectAll} className="h-7 text-xs">
            {allSelected ? "Deselect all" : "Select all"}
          </Button>
        )}
      </div>

      {/* Candidate List */}
      {candidates.length === 0 && !isLoading ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No companies found matching &ldquo;{country}&rdquo;.
          <div className="mt-2 text-xs">
            Try clicking one of the country chips above or search for &ldquo;Germany&rdquo;, &ldquo;Switzerland&rdquo;, or &ldquo;All&rdquo;.
          </div>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {candidates.map((candidate) => {
            const isChecked = selected.includes(candidate.id)
            const isHighFit = candidate.fit >= 88
            return (
              <div
                key={candidate.id}
                onClick={() => {
                  setSelected((curr) =>
                    isChecked ? curr.filter((id) => id !== candidate.id) : [...curr, candidate.id],
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
                    <div className="font-medium text-foreground group-hover:text-primary">
                      {candidate.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{candidate.domain}</span>
                      <span>·</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-medium">{candidate.country}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Fit</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                        isHighFit
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {candidate.fit}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Action Footer */}
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
