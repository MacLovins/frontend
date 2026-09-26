import { useCallback } from "react"
import { toast } from "sonner"

import { errorMessage } from "@/api/mutator"
import { copy, MAX_RUN_COMPANIES } from "@/features/accounts/copy"
import { useStartAnalysis } from "@/features/accounts/hooks/use-start-analysis"
import { newestCompanyIds } from "@/features/accounts/lib/new-company-ids"

/** Starts one run for the companies an import just created (at most 500). Resolves to the run id or null. */
export function useAnalyzeNew() {
  const { start, runPath } = useStartAnalysis()

  const analyzeNew = useCallback(
    async (created: number) => {
      try {
        const ids = await newestCompanyIds(Math.min(created, MAX_RUN_COMPANIES))
        const run = await start(ids)
        if (run && created > MAX_RUN_COMPANIES)
          toast(copy.import.partialRun(created))
        return run?.id ?? null
      } catch (error) {
        toast.error(errorMessage(error))
        return null
      }
    },
    [start]
  )

  return { analyzeNew, runPath }
}
