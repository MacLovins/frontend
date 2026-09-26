import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"

import { apiPaths, invalidateApi } from "@/api/cache"
import { listLeads } from "@/api/generated/leads/leads"
import { createRun } from "@/api/generated/runs/runs"
import type { RunOut } from "@/api/generated/model"
import { withService } from "@/hooks/use-current-service"

const PAGE_SIZE = 100
const RUN_CHUNK = 500

// Name order, not the default priority order: a re-score while paging would move companies between pages.
async function serviceCompanyIds(serviceId: string) {
  const ids = new Set<string>()
  for (let page = 1; ; page++) {
    const result = await listLeads({
      service_id: serviceId,
      sort: "name",
      page,
      page_size: PAGE_SIZE,
    })
    result.items.forEach((item) => ids.add(item.company.id))
    if (!result.items.length || page * PAGE_SIZE >= result.total) {
      return [...ids]
    }
  }
}

/**
 * Re-analyses every scored company of the service. Incremental is enough: a changed question version changes
 * the extraction fingerprint, so only this service re-extracts.
 */
export function useReanalyze(serviceId: string, onStarted: () => void) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async () => {
      const ids = await serviceCompanyIds(serviceId)
      const runs: RunOut[] = []
      for (let start = 0; start < ids.length; start += RUN_CHUNK) {
        runs.push(
          await createRun({
            kind: "analyze",
            mode: "incremental",
            company_ids: ids.slice(start, start + RUN_CHUNK),
            service_ids: [serviceId],
          })
        )
      }
      return runs
    },
    onSuccess: (runs) => {
      if (!runs.length) return
      onStarted()
      void invalidateApi(queryClient, apiPaths.runs)
      const path = runs.length === 1 ? `/runs/${runs[0].id}` : "/runs"
      void navigate(withService(path, serviceId))
    },
  })
}
