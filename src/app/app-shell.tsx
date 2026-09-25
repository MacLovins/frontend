import {
  BuildingsIcon,
  CrosshairIcon,
  FireIcon,
  GearIcon,
  LightningIcon,
  ShieldIcon,
  TargetIcon,
} from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { api } from "@/api/client"
import { AppSidebar } from "@/components/app-sidebar"
import type { NavItem } from "@/components/nav-main"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/features/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useLogout, useSession } from "@/features/session/session"
import { labels } from "@/lib/labels"

export function AppShell() {
  const { me } = useSession()
  const [params, setParams] = useSearchParams()
  const { pathname } = useLocation()
  const services = useQuery({ queryKey: ["services"], queryFn: api.services, staleTime: 30_000 })
  const serviceId = params.get("service") ?? services.data?.[0]?.id ?? "ia"
  const prospects = useQuery({
    queryKey: ["prospects", "sidebar", serviceId],
    queryFn: () =>
      api.prospects({
        serviceId,
        q: "",
        country: "",
        industry: "",
        tier: "",
        onlyNew: false,
        minPriority: 0,
      }),
    staleTime: 30_000,
  })
  const navigate = useNavigate()
  const logout = useLogout()
  const [analyzeOpen, setAnalyzeOpen] = useState(false)
  const crumb = crumbFor(pathname)

  function setService(next: string) {
    const updated = new URLSearchParams(params)
    updated.set("service", next)
    setParams(updated)
  }

  const withService = (path: string) => `${path}?service=${serviceId}`
  const items: NavItem[] = [
    {
      title: labels.prospects,
      url: "/prospects",
      icon: <CrosshairIcon />,
      items: [{ title: "Leaderboard", url: "/prospects" }],
    },
    {
      title: labels.runs,
      url: "/runs",
      icon: <LightningIcon />,
      items: [{ title: "Live", url: "/runs" }],
    },
    {
      title: labels.accounts,
      url: "/accounts",
      icon: <BuildingsIcon />,
      items: [
        { title: "All companies", url: "/accounts" },
        { title: labels.discover, url: "/accounts/discover" },
      ],
    },
  ]
  if (me?.role === "admin") {
    items.push({
      title: labels.settings,
      url: "/settings/services",
      icon: <GearIcon />,
      items: [
        { title: labels.services, url: "/settings/services" },
        { title: labels.questions, url: `/settings/${serviceId}/questions` },
        { title: labels.icp, url: `/settings/${serviceId}/icp` },
        { title: labels.rules, url: `/settings/${serviceId}/rules` },
        { title: labels.scoring, url: `/settings/${serviceId}/scoring` },
      ],
    })
  }

  const teams = (services.data ?? []).map((service) => ({
    id: service.id,
    name: service.name,
    plan: service.preset === "cyber" ? "Security" : "Automation",
    logo: service.preset === "cyber" ? <ShieldIcon /> : <TargetIcon />,
  }))

  const projects = (prospects.data ?? []).slice(0, 3).map((row) => ({
    name: `${row.name} · ${row.priority}`,
    url: withService(`/companies/${row.id}`),
    icon: <FireIcon />,
  }))

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          items={items.map((item) => ({
            ...item,
            items: item.items?.map((sub) => ({ ...sub, url: withService(sub.url) })),
          }))}
          teams={teams}
          activeServiceId={serviceId}
          onServiceChange={setService}
          projects={projects}
          user={{ email: me?.email ?? "", role: me?.role ?? "sales" }}
          onSignOut={() => {
            logout.mutate(undefined, { onSuccess: () => navigate("/login") })
          }}
        />
        <SidebarInset>
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="my-4 mr-2" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">{crumb.section}</BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button className="ml-auto" onClick={() => setAnalyzeOpen(true)}>
              <LightningIcon data-icon="inline-start" />
              {labels.analyze}
            </Button>
          </header>
          <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
        {analyzeOpen ? (
          <AnalyzeDialog
            serviceId={serviceId}
            onClose={() => setAnalyzeOpen(false)}
            onStarted={(id) => {
              setAnalyzeOpen(false)
              toast.success("Analysis started")
              void navigate(withService(`/runs/${id}`))
            }}
          />
        ) : null}
      </SidebarProvider>
    </TooltipProvider>
  )
}

function crumbFor(pathname: string) {
  if (pathname.startsWith("/companies/")) {
    return { section: labels.prospects, title: "Company" }
  }
  if (pathname.startsWith("/runs")) {
    return { section: labels.runs, title: pathname === "/runs" ? "Live" : "Run" }
  }
  if (pathname.startsWith("/accounts/discover")) {
    return { section: labels.accounts, title: labels.discover }
  }
  if (pathname.startsWith("/accounts")) {
    return { section: labels.accounts, title: "All companies" }
  }
  if (pathname.includes("/questions")) {
    return { section: labels.settings, title: labels.questions }
  }
  if (pathname.includes("/icp")) {
    return { section: labels.settings, title: labels.icp }
  }
  if (pathname.includes("/rules")) {
    return { section: labels.settings, title: labels.rules }
  }
  if (pathname.includes("/scoring")) {
    return { section: labels.settings, title: labels.scoring }
  }
  if (pathname.startsWith("/settings")) {
    return { section: labels.settings, title: labels.services }
  }
  if (pathname === "/403") {
    return { section: "Access", title: "403" }
  }
  return { section: labels.prospects, title: "Leaderboard" }
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
