import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import {
  getListQuestionsQueryKey,
  useDeleteQuestion,
  useExpandQuestion,
  useUpdateQuestion,
} from "@/api/generated/config/config"
import type { SignalQuestionOut } from "@/api/generated/model"
import { copy } from "@/features/settings/questions/copy"
import { useQuestionsContext } from "@/features/settings/questions/hooks/questions-context"
import {
  changesMeaning,
  toCreateBody,
  type QuestionFormValues,
} from "@/features/settings/questions/lib/question-form"
import {
  createWithUniqueKey,
  questionKeyBase,
} from "@/features/settings/questions/lib/question-key"

function useQuestionCache() {
  const queryClient = useQueryClient()
  const { serviceId } = useQuestionsContext()
  return useMemo(() => {
    const listKey = getListQuestionsQueryKey(serviceId)
    const patchItem = (
      id: string,
      change: (item: SignalQuestionOut) => SignalQuestionOut
    ) =>
      queryClient.setQueryData<SignalQuestionOut[]>(listKey, (list) =>
        list?.map((item) => (item.id === id ? change(item) : item))
      )
    return {
      listKey,
      patchItem,
      replace: (saved: SignalQuestionOut) => patchItem(saved.id, () => saved),
      refreshList: () => queryClient.invalidateQueries({ queryKey: listKey }),
      // Weight and on/off changes re-score the service synchronously (backend intelligence/service.py).
      refreshRanking: () =>
        invalidateApi(queryClient, apiPaths.leads, apiPaths.activity),
    }
  }, [queryClient, serviceId])
}

/**
 * Inline H/M/L: optimistic, reverted on error (the global handler toasts it). Only the one question is
 * reverted, so a weight saved meanwhile on another row stays.
 */
export function useWeightChange() {
  const queryClient = useQueryClient()
  const cache = useQuestionCache()
  const { showRescored } = useQuestionsContext()
  return useUpdateQuestion({
    mutation: {
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: cache.listKey })
        const previous = queryClient
          .getQueryData<SignalQuestionOut[]>(cache.listKey)
          ?.find((item) => item.id === id)?.weight
        cache.patchItem(id, (item) => ({
          ...item,
          weight: data.weight ?? item.weight,
        }))
        return { previous }
      },
      onError: (_error, { id }, context) => {
        const previous = context?.previous
        if (previous)
          cache.patchItem(id, (item) => ({ ...item, weight: previous }))
      },
      onSuccess: (saved) => {
        cache.replace(saved)
        void cache.refreshRanking()
        showRescored()
      },
    },
  })
}

export function useCreateQuestionAction() {
  const { serviceId, takenKeys, markChanged, restartPolling } =
    useQuestionsContext()
  const cache = useQuestionCache()
  return useMutation({
    mutationFn: (values: QuestionFormValues) =>
      createWithUniqueKey(
        serviceId,
        questionKeyBase(values.text),
        toCreateBody(values),
        new Set(takenKeys)
      ),
    meta: { errorToast: false },
    onSuccess: (created) => {
      toast.success(copy.toasts.saved)
      markChanged([created.id])
      restartPolling()
      void cache.refreshList()
    },
  })
}

/**
 * Sheet save: PATCH with only the changed keys; errors are shown in the form. The side effects live here, not in
 * the caller's `mutate` callbacks, so they still run when the sheet is closed before the response arrives.
 */
export function useSaveQuestion() {
  const queryClient = useQueryClient()
  const { markChanged, restartPolling, showRescored } = useQuestionsContext()
  const cache = useQuestionCache()
  return useUpdateQuestion({
    mutation: {
      meta: { errorToast: false },
      onMutate: ({ id }) => ({
        version: queryClient
          .getQueryData<SignalQuestionOut[]>(cache.listKey)
          ?.find((item) => item.id === id)?.version,
      }),
      onSuccess: (saved, { data }, context) => {
        cache.replace(saved)
        void cache.refreshList()
        // The backend bumps the version only when a meaning field really changed (config/router.py:42).
        const meaningChanged =
          context?.version === undefined
            ? changesMeaning(data)
            : saved.version > context.version
        if (meaningChanged) {
          markChanged([saved.id])
          restartPolling()
          toast.success(copy.toasts.saved)
        }
        if ("weight" in data) {
          void cache.refreshRanking()
          showRescored()
        } else if (!meaningChanged) {
          toast.success(copy.toasts.savedPlain)
        }
      },
    },
  })
}

/** Soft delete: the question stops counting, its evidence stays. */
export function useTurnOffQuestion() {
  const cache = useQuestionCache()
  return useDeleteQuestion({
    mutation: {
      onSuccess: () => {
        toast.success(copy.toasts.turnedOff)
        void cache.refreshList()
        void cache.refreshRanking()
      },
    },
  })
}

export function useTurnOnQuestion() {
  const cache = useQuestionCache()
  return useUpdateQuestion({
    mutation: {
      onSuccess: (saved) => {
        toast.success(copy.toasts.turnedOn)
        cache.replace(saved)
        void cache.refreshList()
        void cache.refreshRanking()
      },
    },
  })
}

export function useRegenerateKeywords() {
  const { restartPolling } = useQuestionsContext()
  const cache = useQuestionCache()
  return useExpandQuestion({
    mutation: {
      onSuccess: () => {
        toast.success(copy.toasts.regenerating)
        restartPolling()
        void cache.refreshList()
      },
    },
  })
}
