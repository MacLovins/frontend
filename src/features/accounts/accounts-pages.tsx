import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { api } from "@/api/client"
import type { Candidate } from "@/api/types"
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

export function DiscoveryPage() {
  const serviceId = useServiceId()
  const [country, setCountry] = useState("Germany")
  const [selected, setSelected] = useState<string[]>([])
  const [candidates, setCandidates] = useState<Candidate[] | null>(null)
  const queryClient = useQueryClient()

  return (
    <section className="flex flex-col gap-4">
      <h1 className="font-heading text-2xl font-medium">{labels.discover}</h1>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void api.discover(country).then(setCandidates)
        }}
      >
        <Input value={country} onChange={(event) => setCountry(event.target.value)} />
        <Button type="submit">Find</Button>
      </form>
      <ul className="flex flex-col gap-2 text-sm">
        {(candidates ?? []).map((candidate) => (
          <li key={candidate.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(candidate.id)}
                onChange={(event) => {
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, candidate.id]
                      : current.filter((id) => id !== candidate.id),
                  )
                }}
              />
              {candidate.name} · {candidate.domain} · Fit {candidate.fit}
            </label>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={selected.length === 0}
          onClick={() => {
            const chosen = (candidates ?? []).filter((item) => selected.includes(item.id))
            void Promise.all(
              chosen.map((item) =>
                api.addAccount({
                  name: item.name,
                  domain: item.domain,
                  country: item.country,
                  industry: "Unknown",
                }),
              ),
            ).then(() => {
              toast.success("Added to accounts")
              void queryClient.invalidateQueries({ queryKey: ["accounts"] })
            })
          }}
        >
          Add selected
        </Button>
        <Button
          disabled={selected.length === 0}
          onClick={() => {
            void api.startRun(serviceId, []).then(() => toast.success("Analysis started"))
          }}
        >
          {labels.analyze}
        </Button>
      </div>
    </section>
  )
}
