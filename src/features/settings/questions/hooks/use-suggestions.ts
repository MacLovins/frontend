import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import {
  getListQuestionsQueryKey,
  getListRulesQueryKey,
  suggestServiceQuestions,
} from "@/api/generated/config/config"
import type { SuggestedQuestionOut } from "@/api/generated/model"
import { ApiError, errorMessage } from "@/api/mutator"
import { copy } from "@/features/settings/questions/copy"
import { useQuestionsContext } from "@/features/settings/questions/hooks/questions-context"
import {
  addSuggestions,
  type RuleDraft,
} from "@/features/settings/questions/lib/add-suggestions"

// One synchronous LLM call without a server timeout (backend suggest_router.py).
const SUGGEST_TIMEOUT_MS = 60_000

/**
 * Drafts for the open service. Nothing is saved; a fresh call on every open (the LLM gateway caches unchanged
 * config) so drafts never repeat questions added since.
 */
export function useSuggestions(serviceId: string) {
  return useQuery({
    queryKey: ["suggestServiceQuestions", serviceId],
    queryFn: async ({ signal }) => {
      const timeout = AbortSignal.timeout(SUGGEST_TIMEOUT_MS)
      try {
        return await suggestServiceQuestions(serviceId, {
          signal: AbortSignal.any([signal, timeout]),
        })
      } catch (error) {
        // apiFetch reports an aborted fetch as a network failure; a timeout is the AI taking too long.
        if (timeout.aborted) throw new ApiError(504, "timeout", "Timed out")
        throw error
      }
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

export function suggestErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return errorMessage(error)
  if (error.status === 429) return copy.toasts.quota
  if (error.status === 503 || error.status === 504)
    return copy.toasts.unavailable
  return errorMessage(error)
}

export function useAddSuggestions() {
  const queryClient = useQueryClient()
  const { serviceId, takenKeys, markChanged, restartPolling } =
    useQuestionsContext()
  return useMutation({
    mutationFn: ({
      drafts,
      rules,
      earlierKeys,
    }: {
      drafts: SuggestedQuestionOut[]
      rules: RuleDraft[]
      earlierKeys: ReadonlyMap<string, string>
    }) => addSuggestions(serviceId, takenKeys, drafts, rules, earlierKeys),
    meta: { errorToast: false },
    onSuccess: (result) => {
      const questionsAdded = result.createdQuestionIds.length
      if (questionsAdded || result.rulesAdded) {
        toast.success(copy.toasts.added(questionsAdded, result.rulesAdded))
      }
      if (result.failed) {
        toast.error(
          copy.toasts.addFailed(result.failed, errorMessage(result.error))
        )
      }
      if (questionsAdded) {
        markChanged(result.createdQuestionIds)
        restartPolling()
        void queryClient.invalidateQueries({
          queryKey: getListQuestionsQueryKey(serviceId),
        })
      }
      if (result.rulesAdded) {
        void queryClient.invalidateQueries({
          queryKey: getListRulesQueryKey(serviceId),
        })
        // Rule writes re-score the service synchronously.
        void invalidateApi(queryClient, apiPaths.leads, apiPaths.activity)
      }
    },
  })
}
