import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import { acceptDiscovery } from "@/api/generated/discovery/discovery"
import type {
  CompanyOut,
  DiscoveredCompany,
  DiscoveryAcceptIn,
} from "@/api/generated/model"
import { createRun } from "@/api/generated/runs/runs"
import { withService } from "@/hooks/use-current-service"

import { copy } from "../copy"

const PARALLEL = 4

function acceptBody(candidate: DiscoveredCompany): DiscoveryAcceptIn {
  return {
    name: candidate.name,
    domain: candidate.domain,
    country_code: candidate.country_code,
    industry_ids: candidate.industry_ids,
    employees: candidate.employees,
    revenue_eur: candidate.revenue_eur,
    wikidata_qid: candidate.wikidata_qid,
    lei: candidate.lei,
    crunchbase_id: candidate.crunchbase_id,
  }
}

/** `POST /discovery/accept` takes one company per call: run them 4 at a time and keep going past failures. */
async function acceptAll(
  candidates: DiscoveredCompany[],
  onSettled: () => void
) {
  const accepted: CompanyOut[] = []
  const failed: string[] = []
  for (let start = 0; start < candidates.length; start += PARALLEL) {
    const batch = candidates.slice(start, start + PARALLEL)
    const results = await Promise.all(
      batch.map((candidate) =>
        acceptDiscovery(acceptBody(candidate))
          .then(
            (company) => ({ candidate, company }),
            () => ({ candidate, company: null })
          )
          .finally(onSettled)
      )
    )
    for (const { candidate, company } of results) {
      if (company) accepted.push(company)
      else failed.push(candidate.name)
    }
  }
  return { accepted, failed }
}

/** Adds the picked candidates as accounts, then starts one analysis run for all active services and opens it. */
export function useAddAndAnalyze(serviceId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [added, setAdded] = useState(0)

  const mutation = useMutation({
    mutationFn: async (candidates: DiscoveredCompany[]) => {
      setAdded(0)
      const { accepted, failed } = await acceptAll(candidates, () =>
        setAdded((count) => count + 1)
      )
      if (accepted.length) void invalidateApi(queryClient, apiPaths.companies)
      if (failed.length) toast.error(copy.selection.failed(failed))
      if (!accepted.length) return null
      // `service_ids: []` = every active service at analysis time (runs/schemas.py RunCreate).
      const run = await createRun({
        kind: "analyze",
        company_ids: accepted.map((company) => company.id),
        service_ids: [],
      })
      return { run, count: accepted.length }
    },
    onSuccess: (result) => {
      if (!result) return
      void invalidateApi(queryClient, apiPaths.runs)
      toast.success(copy.selection.added(result.count))
      void navigate(withService(`/runs/${result.run.id}`, serviceId))
    },
  })

  return { ...mutation, added }
}
