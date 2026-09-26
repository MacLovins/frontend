import { type QueryClient, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getGetServiceQueryKey, getListServicesQueryKey, useUpdateService } from "@/api/generated/config/config"
import type { ServiceOut } from "@/api/generated/model"

import { copy } from "@/features/settings/services/copy"

const listKey = getListServicesQueryKey()

/** Puts a saved service into the cached list (the sidebar switcher reads the same key), then refetches. */
export function storeService(queryClient: QueryClient, service: ServiceOut) {
  queryClient.setQueryData<ServiceOut[]>(listKey, (list) =>
    list?.some((item) => item.id === service.id)
      ? list.map((item) => (item.id === service.id ? service : item))
      : [...(list ?? []), service],
  )
  queryClient.setQueryData(getGetServiceQueryKey(service.id), service)
  return queryClient.invalidateQueries({ queryKey: listKey })
}

/** The Active checkbox: an immediate, optimistic `PATCH {is_active}` that reverts on error. */
export function useToggleServiceActive() {
  const queryClient = useQueryClient()
  const mutation = useUpdateService({
    mutation: {
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: listKey })
        const previous = queryClient.getQueryData<ServiceOut[]>(listKey)
        queryClient.setQueryData<ServiceOut[]>(listKey, (list) =>
          list?.map((item) => (item.id === id ? { ...item, is_active: data.is_active ?? item.is_active } : item)),
        )
        return { previous }
      },
      onError: (_error, _variables, context) => {
        if (context?.previous) queryClient.setQueryData(listKey, context.previous)
      },
      onSuccess: (service) => {
        toast.success(service.is_active ? copy.toast.activated : copy.toast.deactivated)
        return storeService(queryClient, service)
      },
    },
  })
  return {
    toggle: (id: string, isActive: boolean) => mutation.mutate({ id, data: { is_active: isActive } }),
    isPending: mutation.isPending,
  }
}
