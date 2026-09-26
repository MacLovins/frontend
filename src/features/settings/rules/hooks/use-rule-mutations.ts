import { useMutationState, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import {
  getListRulesQueryKey,
  getUpdateRuleMutationKey,
  useCreateRule,
  useDeleteRule,
  useUpdateRule,
  type UpdateRuleMutationVariables,
} from "@/api/generated/config/config"
import type { DisqualificationRuleOut } from "@/api/generated/model"
import type { ApiError } from "@/api/mutator"
import { copy } from "@/features/settings/rules/copy"

/**
 * Every rule write re-scores the service synchronously (config/router.py), so each one refreshes the rule
 * list and the leads/activity that the re-score changed.
 */
function useRefresh(serviceId: string) {
  const queryClient = useQueryClient()
  const listKey = getListRulesQueryKey(serviceId)
  const refreshList = () => queryClient.invalidateQueries({ queryKey: listKey })
  const refreshLeads = () =>
    invalidateApi(queryClient, apiPaths.leads, apiPaths.activity)
  return { queryClient, listKey, refreshList, refreshLeads }
}

/**
 * Create / edit / delete from the editor; saves show 422s inline under the sentence, so no global toast.
 * The refresh is not awaited: the editor closes right away instead of waiting for every leads page, and a
 * deleted rule leaving the list cannot unmount the editor before its success callback runs.
 */
export function useRuleWrites(serviceId: string) {
  const { refreshList, refreshLeads } = useRefresh(serviceId)
  const onSuccess = () => {
    void refreshList()
    void refreshLeads()
  }
  const create = useCreateRule({
    mutation: { meta: { errorToast: false }, onSuccess },
  })
  const update = useUpdateRule({
    mutation: { meta: { errorToast: false }, onSuccess },
  })
  const remove = useDeleteRule({ mutation: { onSuccess } })
  return { create, update, remove }
}

/** Ids of rules with a PATCH in flight (switch or editor), so a switch is not flipped again mid-request. */
export function usePendingRuleIds() {
  return useMutationState({
    filters: { mutationKey: getUpdateRuleMutationKey(), status: "pending" },
    select: (mutation) =>
      (mutation.state.variables as UpdateRuleMutationVariables | undefined)?.id,
  })
}

/** The table's Active switch: optimistic; a failure puts back only that rule, other switches may be in flight. */
export function useRuleToggle(serviceId: string) {
  const { queryClient, listKey, refreshList, refreshLeads } =
    useRefresh(serviceId)
  const setActive = (id: string, active: boolean) =>
    queryClient.setQueryData<DisqualificationRuleOut[]>(listKey, (rules) =>
      rules?.map((rule) =>
        rule.id === id ? { ...rule, is_active: active } : rule
      )
    )
  return useUpdateRule<ApiError, { wasActive?: boolean }>({
    mutation: {
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: listKey })
        const wasActive = queryClient
          .getQueryData<DisqualificationRuleOut[]>(listKey)
          ?.find((rule) => rule.id === id)?.is_active
        if (typeof data.is_active === "boolean") setActive(id, data.is_active)
        return { wasActive }
      },
      onError: (_error, { id }, context) => {
        if (context?.wasActive !== undefined) setActive(id, context.wasActive)
      },
      onSuccess: (rule) => {
        toast.success(rule.is_active ? copy.toasts.on : copy.toasts.off)
      },
      // Pending until the list is fresh, so the switch cannot flip back and forth; the leads refetch
      // (every page, for "Affects now") runs in the background.
      onSettled: () => {
        void refreshLeads()
        return refreshList()
      },
    },
  })
}
