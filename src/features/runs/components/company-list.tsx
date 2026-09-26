import { useMemo } from "react"

import { useGetUsage } from "@/api/generated/meta/meta"
import type { CompanyOut, RunOut, ServiceOut } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import type { CompanyProgress, RunLogEntry } from "@/hooks/use-run-events"
import { useLabels } from "@/hooks/use-labels"
import { tierLabels } from "@/lib/labels"

import { copy } from "../copy"
import {
  companyMessage,
  companyView,
  latestMessages,
  logFacts,
  type MessageContext,
} from "../lib/company-state"
import { serviceShortLabel } from "../lib/run-format"
import { CompanyRunCard } from "./company-run-card"

export function CompanyList({
  run,
  visible,
  hidden,
  onShowMore,
  names,
  companies,
  log,
  services,
  serviceId,
}: {
  run: RunOut
  /** Company ids to draw, in the run's order. */
  visible: string[]
  /** How many more the "Show more" button reveals (0: no button). */
  hidden: number
  onShowMore: () => void
  names: { companies: Map<string, CompanyOut>; isLoading: boolean }
  companies: Record<string, CompanyProgress>
  log: RunLogEntry[]
  services: ServiceOut[]
  serviceId: string | undefined
}) {
  const label = useLabels()

  // `service_ids: []` means every active service at analysis time.
  const serviceCount =
    run.params.service_ids.length ||
    services.filter((service) => service.is_active).length
  const context = useMemo<MessageContext>(
    () => ({
      sourceLabel: (source) => label("source_types", source),
      serviceLabel: (id) =>
        serviceShortLabel(services.find((service) => service.id === id)),
      tierLabel: (tier) =>
        tierLabels[tier as keyof typeof tierLabels] ?? label("tiers", tier),
    }),
    [label, services]
  )
  const messages = useMemo(() => latestMessages(log, context), [log, context])
  const facts = useMemo(() => logFacts(log), [log])
  const outcomeOf = (companyId: string) =>
    facts.working.has(companyId)
      ? null
      : (companies[companyId]?.outcome ?? null)
  const anyPaused = visible.some(
    (companyId) => outcomeOf(companyId)?.status === "paused"
  )
  const usage = useGetUsage({
    query: { enabled: anyPaused, staleTime: 5 * 60_000 },
  })

  return (
    <>
      {visible.map((companyId) => {
        const progress = companies[companyId]
        const outcome = outcomeOf(companyId)
        const view = companyView(
          progress,
          outcome,
          serviceCount,
          facts.stopped[companyId],
          run.status
        )
        return (
          <CompanyRunCard
            key={companyId}
            companyId={companyId}
            company={names.companies.get(companyId)}
            isLoading={names.isLoading}
            view={view}
            message={companyMessage(
              progress,
              outcome,
              messages[companyId],
              view.tone,
              context,
              usage.data?.resets_at
            )}
            serviceId={serviceId}
          />
        )
      })}
      {hidden > 0 ? (
        <Button variant="outline" className="self-start" onClick={onShowMore}>
          {copy.showMore(hidden)}
        </Button>
      ) : null}
    </>
  )
}
