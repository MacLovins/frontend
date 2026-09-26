import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import {
  getListRulesQueryKey,
  useCreateRule,
  useDeleteRule,
  useUpdateRule,
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
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: listKey }),
      invalidateApi(queryClient, apiPaths.leads, apiPaths.activity),
    ])
  return { queryClient, listKey, refresh }
}

/** Create / edit / delete from the editor; saves show 422s inline under the sentence, so no global toast. */
export function useRuleWrites(serviceId: string) {
  const { refresh } = useRefresh(serviceId)
  const create = useCreateRule({
    mutation: { meta: { errorToast: false }, onSuccess: refresh },
  })
  const update = useUpdateRule({
    mutation: { meta: { errorToast: false }, onSuccess: refresh },
  })
  const remove = useDeleteRule({ mutation: { onSuccess: refresh } })
  return { create, update, remove }
}

/** The table's Active switch: optimistic, rolled back on error. */
export function useRuleToggle(serviceId: string) {
  const { queryClient, listKey, refresh } = useRefresh(serviceId)
  return useUpdateRule<ApiError, { previous?: DisqualificationRuleOut[] }>({
    mutation: {
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: listKey })
        const previous =
          queryClient.getQueryData<DisqualificationRuleOut[]>(listKey)
        queryClient.setQueryData<DisqualificationRuleOut[]>(listKey, (rules) =>
          rules?.map((rule) =>
            rule.id === id
              ? { ...rule, is_active: data.is_active ?? rule.is_active }
              : rule
          )
        )
        return { previous }
      },
      onError: (_error, _variables, context) => {
        if (context?.previous)
          queryClient.setQueryData(listKey, context.previous)
      },
      onSuccess: (rule) => {
        toast.success(rule.is_active ? copy.toasts.on : copy.toasts.off)
      },
      onSettled: refresh,
    },
  })
}
