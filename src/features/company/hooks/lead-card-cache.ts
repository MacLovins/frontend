import type { QueryClient } from "@tanstack/react-query"

import { getGetLeadDetailQueryKey } from "@/api/generated/leads/leads"
import type { CompanyOut, LeadDetail } from "@/api/generated/model"

export const leadCardParams = (serviceId: string | undefined) =>
  serviceId ? { service_id: serviceId } : undefined

export const leadCardKey = (companyId: string, serviceId: string | undefined) =>
  getGetLeadDetailQueryKey(companyId, leadCardParams(serviceId))

export function patchLeadCard(
  queryClient: QueryClient,
  companyId: string,
  serviceId: string | undefined,
  patch: (detail: LeadDetail) => LeadDetail
) {
  queryClient.setQueryData<LeadDetail>(
    leadCardKey(companyId, serviceId),
    (detail) => detail && patch(detail)
  )
}

/** PATCH /companies answers the full company: put it into every cached service variant of the card. */
export function writeCompany(queryClient: QueryClient, company: CompanyOut) {
  queryClient.setQueriesData<LeadDetail>(
    { queryKey: getGetLeadDetailQueryKey(company.id) },
    (detail) => detail && { ...detail, company }
  )
}
