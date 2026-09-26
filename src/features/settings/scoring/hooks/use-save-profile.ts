import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiPaths, invalidateApi, meQueryKey } from "@/api/cache"
import {
  getGetScoringProfileQueryKey,
  usePutScoringProfile,
} from "@/api/generated/config/config"
import type { ScoringParams } from "@/api/generated/model"
import { errorMessage } from "@/api/mutator"
import { copy } from "@/features/settings/scoring/copy"

/** PUT stores a new immutable version and re-scores every company in the same transaction (CONFIG-API §5.7-5.8). */
export function useSaveProfile(serviceId: string) {
  const queryClient = useQueryClient()
  const mutation = usePutScoringProfile({
    mutation: {
      // Own toasts: a failed rescore rolls the whole save back, and the copy says so.
      meta: { errorToast: false },
      onSuccess: (result) => {
        toast.success(
          result.rescored === 0
            ? copy.toast.savedEmpty(result.version)
            : copy.toast.rescored(
                result.rescored,
                result.duration_ms,
                result.tier_changes
              )
        )
        void queryClient.invalidateQueries({
          queryKey: getGetScoringProfileQueryKey(serviceId),
        })
        void invalidateApi(queryClient, apiPaths.leads, apiPaths.activity)
      },
      onError: (error) => {
        if (error.status === 401) {
          queryClient.setQueryData(meQueryKey, null)
          return
        }
        toast.error(
          error.status >= 500 ? copy.toast.serverError : errorMessage(error)
        )
      },
    },
  })

  return {
    // The backend stores params verbatim and fills missing keys from engine defaults, so always send them all.
    save: (params: ScoringParams) =>
      mutation.mutate({ id: serviceId, data: { params } }),
    isPending: mutation.isPending,
  }
}
