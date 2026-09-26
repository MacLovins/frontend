import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useParams, useSearchParams } from "react-router"

import { useGetLeadDetail } from "@/api/generated/leads/leads"

import { hasService } from "../lib/lead-card"
import { leadCardKey, leadCardParams } from "./lead-card-cache"

/**
 * The lead card of the company in the route, for `?service=`. Without the param the API picks the company's
 * best-scored service; that choice is then written into the URL so links and tabs keep it.
 */
export function useCompanyCard() {
  const { companyId = "" } = useParams()
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const requested = params.get("service") ?? undefined

  const card = useGetLeadDetail(companyId, leadCardParams(requested), {
    query: {
      staleTime: 30_000,
      // A service switch keeps the header on screen; the body shows skeletons until the new card arrives.
      placeholderData: (previous) =>
        previous?.company.id === companyId ? previous : undefined,
    },
  })
  const resolvedId =
    card.data && hasService(card.data.service)
      ? card.data.service.id
      : undefined

  useEffect(() => {
    if (requested || !resolvedId || !card.data || card.isPlaceholderData) return
    queryClient.setQueryData(leadCardKey(companyId, resolvedId), card.data)
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set("service", resolvedId)
        return next
      },
      { replace: true }
    )
  }, [
    card.data,
    card.isPlaceholderData,
    companyId,
    queryClient,
    requested,
    resolvedId,
    setParams,
  ])

  return { companyId, serviceId: requested ?? resolvedId, card }
}
