import { useQueryClient } from "@tanstack/react-query"

import {
  getListCompaniesQueryKey,
  useUpdateCompany,
} from "@/api/generated/accounts/accounts"

import { writeCompany } from "./lead-card-cache"

/**
 * PATCH /companies/{id} (no rescore, no run). The answer replaces the company on every cached card. Saves of
 * one company run one after another, so a fast series of tag edits cannot land out of order.
 */
export function useSaveCompany(companyId: string) {
  const queryClient = useQueryClient()
  return useUpdateCompany({
    mutation: {
      scope: { id: `company:${companyId}` },
      // Callers report failures themselves (inline or with their own toast).
      meta: { errorToast: false },
      onSuccess: (company) => {
        writeCompany(queryClient, company)
        void queryClient.invalidateQueries({
          queryKey: getListCompaniesQueryKey(),
        })
      },
    },
  })
}
