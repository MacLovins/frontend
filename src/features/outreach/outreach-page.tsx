import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { Link, useParams, useSearchParams } from "react-router"

import {
  getGetLeadDetailQueryKey,
  useGetLeadDetail,
} from "@/api/generated/leads/leads"
import type { OutreachChannel } from "@/api/generated/model"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { OutreachHeader } from "@/features/outreach/components/outreach-header"
import { OutreachSkeleton } from "@/features/outreach/components/outreach-skeleton"
import { OutreachWorkspace } from "@/features/outreach/components/outreach-workspace"
import { parseChannel } from "@/features/outreach/lib/draft"
import { cardService } from "@/features/outreach/lib/signals"
import { useMe } from "@/hooks/use-session"

export function OutreachPage() {
  const { companyId = "" } = useParams()
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const me = useMe()

  const requestedService = params.get("service") ?? undefined
  const channel = parseChannel(params.get("channel"))
  const detail = useGetLeadDetail(companyId, { service_id: requestedService })
  const card = detail.data
  const service = card ? cardService(card) : undefined

  // Without ?service= the card resolves the company's best service; pin it in the URL (and the cache key it
  // implies) so links, reloads and the saved drafts all refer to the same service.
  const resolvedServiceId = service?.id
  useEffect(() => {
    if (requestedService || !card || !resolvedServiceId) return
    queryClient.setQueryData(
      getGetLeadDetailQueryKey(companyId, { service_id: resolvedServiceId }),
      card
    )
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("service", resolvedServiceId)
        return next
      },
      { replace: true }
    )
  }, [
    card,
    companyId,
    queryClient,
    requestedService,
    resolvedServiceId,
    setParams,
  ])

  const selectChannel = (next: OutreachChannel) =>
    setParams(
      (prev) => {
        const search = new URLSearchParams(prev)
        if (next === "email") search.delete("channel")
        else search.set("channel", next)
        return search
      },
      { replace: true }
    )

  const renderBody = () => {
    if (detail.isPending) return <OutreachSkeleton />
    if (detail.isError) {
      return (
        <ErrorState
          title="Couldn't load the company"
          error={detail.error}
          onRetry={() => void detail.refetch()}
        />
      )
    }
    if (!service) {
      return (
        <EmptyState
          title="No active service"
          actions={
            me.data?.role === "admin" ? (
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link to="/settings/services" />}
              >
                Open services
              </Button>
            ) : null
          }
        >
          An admin needs to set up a service before companies can be scored.
        </EmptyState>
      )
    }
    return (
      <OutreachWorkspace
        key={`${companyId}:${service.id}`}
        detail={detail.data}
        service={service}
        channel={channel}
        onChannelChange={selectChannel}
      />
    )
  }

  return (
    <>
      <OutreachHeader
        companyId={companyId}
        serviceId={resolvedServiceId ?? requestedService}
        companyName={card?.company.name}
        serviceName={service?.name}
        loading={detail.isPending}
      />
      {renderBody()}
    </>
  )
}
