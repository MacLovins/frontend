import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"

import { apiPaths, invalidateApi } from "@/api/cache"
import { useCreateRun } from "@/api/generated/runs/runs"
import { useCurrentService, withService } from "@/hooks/use-current-service"

/** `POST /runs` for the given companies on every active service. Resolves to null on failure (already toasted). */
export function useStartAnalysis() {
  const queryClient = useQueryClient()
  const { serviceId } = useCurrentService()
  const { mutateAsync, isPending } = useCreateRun({
    mutation: { onSuccess: () => invalidateApi(queryClient, apiPaths.runs) },
  })

  const start = useCallback(
    (companyIds: string[]) =>
      mutateAsync({
        data: { kind: "analyze", company_ids: companyIds, service_ids: [] },
      }).catch(() => null),
    [mutateAsync]
  )
  const runPath = useCallback(
    (runId: string) => withService(`/runs/${runId}`, serviceId),
    [serviceId]
  )

  return { start, runPath, isPending }
}
