import {
  useQueries,
  useQueryClient,
  type QueryObserverResult,
} from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import { useFeedbackSignal } from "@/api/generated/feedback/feedback"
import {
  getGetLeadDetailQueryKey,
  getGetLeadDetailQueryOptions,
  getListLeadsQueryKey,
  useListLeads,
} from "@/api/generated/leads/leads"
import type {
  LeadDetail,
  LeadListItem,
  QuestionRef,
  SignalItem,
  SignalVerdict,
} from "@/api/generated/model"

import { qualityCopy } from "../copy"

/** The queue is built from the top leads' cards: there is no backend endpoint for signals that need review. */
const QUEUE_LEADS = 20
const LOW_CONFIDENCE = 0.7
/** A burst of votes refetches the metrics once. */
const REFRESH_DELAY = 1_000

export type ReviewItem = {
  signal: SignalItem
  question: QuestionRef
  companyId: string
  companyName: string
  serviceId: string
  priority: number
}

function needsReview(signal: SignalItem) {
  return (
    signal.my_feedback == null &&
    signal.confidence < LOW_CONFIDENCE &&
    !signal.flags.includes("derived")
  )
}

function reviewItems(lead: LeadListItem, detail: LeadDetail): ReviewItem[] {
  return detail.signals_by_question.flatMap(({ question, signals }) =>
    signals.filter(needsReview).map((signal) => ({
      signal,
      question,
      companyId: lead.company.id,
      companyName: detail.company.name,
      serviceId: lead.service_id,
      priority: lead.score.priority,
    }))
  )
}

function combineDetails(results: QueryObserverResult<LeadDetail>[]) {
  return {
    data: results.map((result) => result.data),
    isPending: results.some((result) => result.isPending),
    allFailed: results.length > 0 && results.every((result) => result.isError),
    error: results.find((result) => result.isError)?.error ?? null,
    refetchFailed: () =>
      results
        .filter((result) => result.isError)
        .forEach((result) => void result.refetch()),
  }
}

function withVerdict(
  detail: LeadDetail,
  signalId: string,
  verdict: SignalVerdict
): LeadDetail {
  return {
    ...detail,
    signals_by_question: detail.signals_by_question.map((group) => ({
      ...group,
      signals: group.signals.map((signal) =>
        signal.id === signalId ? { ...signal, my_feedback: verdict } : signal
      ),
    })),
  }
}

/**
 * "Needs a human look": unlabelled signals below 70% confidence in the top leads, least confident first.
 * Votes advance optimistically; Skip moves the item to the end for this visit only.
 */
export function useReviewQueue(
  serviceId: string | undefined,
  enabled: boolean
) {
  const queryClient = useQueryClient()
  const leads = useListLeads(
    {
      ...(serviceId ? { service_id: serviceId } : {}),
      sort: "priority:desc",
      page_size: QUEUE_LEADS,
    },
    { query: { enabled } }
  )
  const items = leads.data?.items
  const details = useQueries({
    queries: (items ?? []).map((lead) =>
      getGetLeadDetailQueryOptions(lead.company.id, {
        service_id: lead.service_id,
      })
    ),
    combine: combineDetails,
  })

  const candidates = useMemo(() => {
    const byId = new Map<string, ReviewItem>()
    items?.forEach((lead, index) => {
      const detail = details.data[index]
      if (detail)
        reviewItems(lead, detail).forEach((item) =>
          byId.set(item.signal.id, item)
        )
    })
    return [...byId.values()].sort(
      (a, b) =>
        a.signal.confidence - b.signal.confidence || b.priority - a.priority
    )
  }, [items, details.data])

  const [voted, setVoted] = useState<ReadonlySet<string>>(() => new Set())
  const [skipped, setSkipped] = useState<readonly string[]>([])

  const { queue, left } = useMemo(() => {
    const open = candidates.filter((item) => !voted.has(item.signal.id))
    const later = new Set(skipped)
    const fresh = open.filter((item) => !later.has(item.signal.id))
    const skippedItems = skipped.flatMap((id) =>
      open.filter((item) => item.signal.id === id)
    )
    return { queue: [...fresh, ...skippedItems], left: fresh.length }
  }, [candidates, voted, skipped])

  // Show the queue only once every card of this scope has loaded, so the first item does not jump around.
  const scopeKey = serviceId ?? "all"
  const [settledScope, setSettledScope] = useState<string | null>(null)
  if (settledScope !== scopeKey && leads.isSuccess && !details.isPending)
    setSettledScope(scopeKey)

  const refresh = useCallback(
    () => invalidateApi(queryClient, apiPaths.quality, apiPaths.activity),
    [queryClient]
  )
  const refreshTimer = useRef<{ id?: number }>({})
  useEffect(() => {
    const timer = refreshTimer.current
    return () => {
      if (timer.id === undefined) return
      window.clearTimeout(timer.id)
      void refresh()
    }
  }, [refresh])

  const scheduleRefresh = () => {
    const timer = refreshTimer.current
    window.clearTimeout(timer.id)
    timer.id = window.setTimeout(() => {
      timer.id = undefined
      void refresh()
    }, REFRESH_DELAY)
  }

  const feedback = useFeedbackSignal({
    mutation: { meta: { errorToast: false } },
  })

  const setVote = (signalId: string, on: boolean) =>
    setVoted((current) => {
      const next = new Set(current)
      if (on) next.add(signalId)
      else next.delete(signalId)
      return next
    })

  async function vote(item: ReviewItem, verdict: SignalVerdict) {
    const signalId = item.signal.id
    setVote(signalId, true)
    try {
      await feedback.mutateAsync({
        id: signalId,
        data: { verdict, service_id: item.serviceId },
      })
      queryClient.setQueryData<LeadDetail>(
        getGetLeadDetailQueryKey(item.companyId, {
          service_id: item.serviceId,
        }),
        (detail) => detail && withVerdict(detail, signalId, verdict)
      )
      if (verdict === "incorrect") {
        // The backend drops the signal from scoring and rescores the company in the same request.
        void queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() })
        void queryClient.invalidateQueries({
          queryKey: getGetLeadDetailQueryKey(item.companyId),
        })
      }
      scheduleRefresh()
    } catch {
      setVote(signalId, false)
      toast.error(qualityCopy.voteError)
    }
  }

  function skip(item: ReviewItem) {
    setSkipped((current) => [
      ...current.filter((id) => id !== item.signal.id),
      item.signal.id,
    ])
  }

  const isError = leads.isError || details.allFailed
  const retry = () => {
    if (leads.isError) void leads.refetch()
    details.refetchFailed()
  }

  return {
    status: isError
      ? ("error" as const)
      : settledScope === scopeKey
        ? ("ready" as const)
        : ("loading" as const),
    error: leads.error ?? details.error,
    current: queue.at(0),
    left,
    vote,
    skip,
    retry,
  }
}
