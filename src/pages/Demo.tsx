import { useState } from "react"

import { AppSidebar, type SidebarPage } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LightningIcon } from "@phosphor-icons/react"

const DEFAULT_PAGE: SidebarPage = {
  section: "Prospects",
  title: "Leaderboard",
  url: "#/prospects",
}

const QUIPS = [
  "Your leads called. They want to be contacted.",
  "Scores are fake, vibes are real.",
  "Nobody has ever regretted writing to a 97.",
  "Coffee first, cold outreach second.",
  "The radar is spinning. Probably.",
]

const LEADS = [
  { name: "Acme Corp", why: "Hiring 12 roadrunner specialists", score: 97 },
  { name: "Initech", why: "Replacing every TPS report with AI", score: 91 },
  {
    name: "Umbrella",
    why: "New lab opened, security budget unclear",
    score: 88,
  },
  { name: "Globex", why: "CEO posted about “synergy” three times", score: 74 },
  { name: "Hooli", why: "Rebranding. Again.", score: 61 },
  { name: "Soylent", why: "Supply chain is… people", score: 23 },
]

const STATS = [
  { label: "Hot", value: 3 },
  { label: "Warm", value: 2 },
  { label: "Meh", value: 1 },
]

export const Demo = () => {
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [quip, setQuip] = useState(0)

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar activeUrl={page.url} onNavigate={setPage} />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="my-4 mr-2" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  {page.section}
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{page.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>

          <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl font-semibold">
                  {page.title}
                </h1>
                <p className="text-sm text-muted-foreground">{QUIPS[quip]}</p>
              </div>
              <Button onClick={() => setQuip((quip + 1) % QUIPS.length)}>
                <LightningIcon data-icon="inline-start" />
                Analyze
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-xl border bg-card p-4">
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                  <div className="font-heading text-3xl font-semibold">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <ul className="divide-y rounded-xl border bg-card">
              {LEADS.map((lead) => (
                <li key={lead.name} className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{lead.name}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {lead.why}
                    </div>
                  </div>
                  <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-muted sm:block">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${lead.score}%` }}
                    />
                  </div>
                  <div className="w-8 text-right font-heading font-semibold tabular-nums">
                    {lead.score}
                  </div>
                </li>
              ))}
            </ul>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
