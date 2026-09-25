import { CaretDown, Play, SignOut } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { NavLink, Outlet, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { api } from "@/api/client"
import { Button } from "@/features/components/ui/button"
import { useLogout, useSession } from "@/features/session/session"
import { labels } from "@/lib/labels"
import { cn } from "cn"

const links = [
  { to: "/prospects", label: labels.prospects },
  { to: "/runs", label: labels.runs },
  { to: "/accounts", label: labels.accounts },
  { to: "/accounts/discover", label: labels.discover },
]

export function AppShell() {
  const { me } = useSession()
  const [params, setParams] = useSearchParams()
  const services = useQuery({ queryKey: ["services"], queryFn: api.services, staleTime: 30_000 })
  const serviceId = params.get("service") ?? services.data?.[0]?.id ?? "ia"
  const navigate = useNavigate()
  const logout = useLogout()
  const [analyzeOpen, setAnalyzeOpen] = useState(false)

  function setService(next: string) {
    const updated = new URLSearchParams(params)
    updated.set("service", next)
    setParams(updated)
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <select
            className="h-9 rounded-lg border border-input bg-background px-2"
            value={serviceId}
            onChange={(event) => setService(event.target.value)}
          >
            {(services.data ?? []).map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          <CaretDown className="size-4 text-muted-foreground" />
        </label>
        <nav className="flex flex-1 items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={`${link.to}?service=${serviceId}`}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-1.5 text-sm text-muted-foreground",
                  isActive && "bg-muted text-foreground",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          {me?.role === "admin" ? (
            <NavLink
              to={`/settings/services?service=${serviceId}`}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-1.5 text-sm text-muted-foreground",
                  isActive && "bg-muted text-foreground",
                )
              }
            >
              {labels.settings}
            </NavLink>
          ) : null}
        </nav>
        <Button size="lg" onClick={() => setAnalyzeOpen(true)}>
          <Play />
          {labels.analyze}
        </Button>
        <UserMenu
          email={me?.email ?? ""}
          role={me?.role ?? "sales"}
          onSignOut={() => {
            logout.mutate(undefined, {
              onSuccess: () => navigate("/login"),
            })
          }}
        />
      </header>
      <main className="mx-auto w-full max-w-7xl p-6">
        <Outlet context={{ serviceId }} />
      </main>
      {analyzeOpen ? (
        <AnalyzeDialog
          serviceId={serviceId}
          onClose={() => setAnalyzeOpen(false)}
          onStarted={(id) => {
            setAnalyzeOpen(false)
            toast.success("Analysis started")
            void navigate(`/runs/${id}?service=${serviceId}`)
          }}
        />
      ) : null}
    </div>
  )
}

function UserMenu({
  email,
  role,
  onSignOut,
}: {
  email: string
  role: string
  onSignOut: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-sm"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {email.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{email}</span>
      </button>
      {open ? (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-popover p-2 text-sm shadow-sm">
          <p className="px-2 py-1 text-muted-foreground">{role}</p>
          <button type="button" className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted" onClick={onSignOut}>
            <SignOut />
            {labels.signOut}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function AnalyzeDialog({
  serviceId,
  onClose,
  onStarted,
}: {
  serviceId: string
  onClose: () => void
  onStarted: (id: string) => void
}) {
  const [pending, setPending] = useState(false)
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-medium">Start analysis</h2>
        <p className="mt-1 text-sm text-muted-foreground">Run the current service across demo accounts.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              setPending(true)
              void api.startRun(serviceId, []).then((run) => onStarted(run.id))
            }}
          >
            {labels.analyze}
          </Button>
        </div>
      </div>
    </div>
  )
}
