import { useQueries, type UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"

import { useListQuestions } from "@/api/generated/config/config"
import {
  getGetLeadDetailQueryOptions,
  useListLeads,
} from "@/api/generated/leads/leads"
import type {
  LeadCardScore,
  LeadDetail,
  LeadListItem,
  Weight,
} from "@/api/generated/model"
import type { ApiError } from "@/api/mutator"
import type { SampleLead } from "@/features/settings/scoring/lib/scoring-estimate"

const SAMPLE_SIZE = 10
const NO_LEADS: LeadListItem[] = []

// The API returns `{}` when the company has no score for the service.
const isScored = (
  score: LeadDetail["score"] | undefined
): score is LeadCardScore => score !== undefined && "priority" in score

// Stable reference: TanStack Query then re-runs it only when a detail result changes.
function combineDetails(results: UseQueryResult<LeadDetail, ApiError>[]) {
  return {
    data: results.map((result) => result.data),
    isPending: results.some((result) => result.isPending),
    isFetching: results.some((result) => result.isFetching),
    error: results.find((result) => result.error)?.error ?? null,
    retry: () => {
      for (const result of results) if (result.error) void result.refetch()
    },
  }
}

/**
 * Inputs of the client-side what-if estimate: the top accounts with their stored breakdown and rule hits, the
 * current importance level of every question, and the number of companies a save re-scores.
 */
export function usePreviewSample(serviceId: string) {
  // Same params as the sidebar's count, so the request is shared.
  const total = useListLeads({ service_id: serviceId, page_size: 1 })
  const top = useListLeads({
    service_id: serviceId,
    sort: "priority:desc",
    page_size: SAMPLE_SIZE,
  })
  const questions = useListQuestions(serviceId)

  const leads = top.data?.items ?? NO_LEADS
  const details = useQueries({
    queries: leads.map((lead) =>
      getGetLeadDetailQueryOptions(lead.company.id, { service_id: serviceId })
    ),
    combine: combineDetails,
  })

  const levels = useMemo(
    () =>
      new Map<string, Weight>(
        (questions.data ?? []).map((question) => [question.id, question.weight])
      ),
    [questions.data]
  )

  const samples = useMemo(
    () =>
      leads.map((lead, index): SampleLead => {
        const score = details.data[index]?.score
        const scored = isScored(score) ? score : undefined
        return {
          companyId: lead.company.id,
          name: lead.company.name,
          score: lead.score,
          breakdown: scored?.breakdown ?? [],
          ruleHits: scored?.rule_hits ?? [],
        }
      }),
    [leads, details.data]
  )

  const lists = [total, top, questions]
  return {
    total: total.data?.total ?? 0,
    samples,
    levels,
    isPending: details.isPending || lists.some((query) => query.isPending),
    isFetching: details.isFetching || lists.some((query) => query.isFetching),
    error: lists.find((query) => query.error)?.error ?? details.error,
    retry: () => {
      for (const query of lists) if (query.error) void query.refetch()
      details.retry()
    },
  }
}
