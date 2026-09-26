import { useQueries } from "@tanstack/react-query"

import { getGetLeadDetailQueryOptions } from "@/api/generated/leads/leads"
import type { LeadCardScore, LeadDetail } from "@/api/generated/model"
import { useCurrentService } from "@/hooks/use-current-service"

import { hasService, isScored } from "../lib/lead-card"

export type ServiceTab = {
  id: string
  name: string
  /** null: not scored for this service; undefined: still loading. */
  score: LeadCardScore | null | undefined
}

/**
 * One tab per active service with the company's score for it. There is no multi-service endpoint, so the
 * other services' cards are fetched too; they are the same queries a tab switch needs.
 */
export function useServiceTabs(
  companyId: string,
  serviceId: string | undefined,
  detail: LeadDetail | undefined
) {
  const { services } = useCurrentService()
  const others = services.filter((service) => service.id !== serviceId)
  const cards = useQueries({
    queries: others.map((service) =>
      getGetLeadDetailQueryOptions(
        companyId,
        { service_id: service.id },
        { query: { staleTime: 30_000 } }
      )
    ),
  })

  const current =
    detail && hasService(detail.service) ? detail.service : undefined
  const tabs: ServiceTab[] = services.map((service) => {
    if (service.id === serviceId) {
      return {
        id: service.id,
        name: service.name,
        score: detail && (isScored(detail.score) ? detail.score : null),
      }
    }
    const card = cards[others.indexOf(service)]?.data
    return {
      id: service.id,
      name: service.name,
      score: card && (isScored(card.score) ? card.score : null),
    }
  })
  // An inactive service can still be opened by link; it keeps its own tab while it is the one shown.
  if (
    current &&
    !services.some((service) => service.id === current.id) &&
    detail
  ) {
    tabs.push({
      id: current.id,
      name: current.name,
      score: isScored(detail.score) ? detail.score : null,
    })
  }
  return tabs
}
