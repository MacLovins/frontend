import { useListLeads } from "@/api/generated/leads/leads"

/**
 * "#2 of 56": the API has no rank field, so it is counted with two page_size=1 list calls. Priorities are
 * stored with one decimal, so `priority + 0.05` counts the leads strictly above (competition ranking).
 * The total uses the sidebar's exact params to share its cache.
 */
export function useLeadRank(
  serviceId: string | undefined,
  priority: number | undefined
) {
  const enabled = !!serviceId && priority !== undefined
  const all = useListLeads(
    { service_id: serviceId, page_size: 1 },
    { query: { enabled } }
  )
  const above = useListLeads(
    {
      service_id: serviceId,
      min_priority: Math.round(((priority ?? 0) + 0.05) * 100) / 100,
      page_size: 1,
    },
    { query: { enabled } }
  )
  if (!enabled || !all.data || !above.data) return null
  return { rank: above.data.total + 1, total: all.data.total }
}
