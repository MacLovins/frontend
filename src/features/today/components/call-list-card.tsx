import { useMemo } from "react"
import { Link } from "react-router"

import { useListLeads } from "@/api/generated/leads/leads"
import type { LeadListItem, ServiceOut } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentService, withService } from "@/hooks/use-current-service"
import { score } from "@/lib/format"

import { serviceShortLabels } from "../copy"

const CALL_LIST_SIZE = 5

type CallListRow = {
  key: string
  to: string
  priority: number
  name: string
  service: string
}

/**
 * Without `service_id` the API returns every service's current score, sorted by priority. One company can be a
 * lead for several services; the first (highest priority) row is the service to lead with.
 */
function pickCallList(
  leads: LeadListItem[],
  activeServices: ServiceOut[]
): CallListRow[] {
  const services = new Map(
    activeServices.map((service) => [service.id, service])
  )
  const seen = new Set<string>()
  const rows: CallListRow[] = []
  for (const lead of leads) {
    const service = services.get(lead.service_id)
    if (!service || seen.has(lead.company.id)) continue
    seen.add(lead.company.id)
    rows.push({
      key: lead.company.id,
      to: withService(`/companies/${lead.company.id}`, service.id),
      priority: score(lead.score.priority),
      name: lead.company.name,
      service: serviceShortLabels[service.slug] ?? service.name,
    })
    if (rows.length === CALL_LIST_SIZE) break
  }
  return rows
}

export function CallListCard() {
  const {
    services,
    isLoading: servicesLoading,
    error: servicesError,
    refetch: refetchServices,
  } = useCurrentService()
  const leads = useListLeads(
    { tier: ["hot"], sort: "priority:desc", page_size: 50 },
    { query: { staleTime: 60_000 } }
  )
  const rows = useMemo(
    () => pickCallList(leads.data?.items ?? [], services),
    [leads.data, services]
  )
  // A failed background refetch keeps the rows already shown.
  const leadsFailed = !leads.data && leads.isError
  const servicesFailed = services.length === 0 && !!servicesError

  return (
    <section
      aria-labelledby="call-list-title"
      className="flex flex-col gap-3 rounded-lg bg-black p-5 text-white"
    >
      <h2
        id="call-list-title"
        className="m-0 text-xs font-semibold tracking-[0.06em] text-primary uppercase"
      >
        Your call list this week
      </h2>
      {leadsFailed || servicesFailed ? (
        <div className="flex flex-col items-start gap-2 text-sm text-sidebar-subtle">
          Could not load the call list.
          <Button
            variant="link"
            className="text-[13px] text-white hover:text-white"
            onClick={() => {
              if (leadsFailed) void leads.refetch()
              if (servicesFailed) void refetchServices()
            }}
          >
            Try again
          </Button>
        </div>
      ) : leads.isPending || servicesLoading ? (
        <div className="flex flex-col gap-2" aria-hidden>
          {Array.from({ length: CALL_LIST_SIZE }, (_, index) => (
            <Skeleton key={index} className="h-5 bg-white/10" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="m-0 text-sm text-sidebar-subtle">No Hot accounts yet.</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
          {rows.map((row) => (
            <li key={row.key}>
              <Link
                to={row.to}
                className="group flex items-center gap-2.5 text-white no-underline"
              >
                <span className="w-7 shrink-0 font-mono">{row.priority}</span>
                <span className="min-w-0 flex-1 truncate group-hover:underline">
                  {row.name}
                </span>
                <span className="shrink-0 text-xs text-sidebar-foreground">
                  {row.service}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p className="m-0 text-xs leading-[1.4] text-sidebar-subtle">
        Hot accounts across {services.length === 2 ? "both" : "all"} services,
        best service first. One company can be a lead for more than one service;
        the list shows the one to lead with.
      </p>
    </section>
  )
}
