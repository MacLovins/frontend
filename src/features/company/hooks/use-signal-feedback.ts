import { useMutationState, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { toast } from "sonner"

import { apiPaths, invalidateApi } from "@/api/cache"
import {
  getFeedbackSignalMutationKey,
  getWithdrawSignalFeedbackMutationKey,
  useFeedbackSignal,
  useWithdrawSignalFeedback,
} from "@/api/generated/feedback/feedback"
import type {
  LeadDetail,
  QuestionRef,
  ScoreSummary,
  SignalItem,
  SignalVerdict,
} from "@/api/generated/model"
import { score } from "@/lib/format"

import { isScored } from "../lib/lead-card"
import { leadCardKey, patchLeadCard } from "./lead-card-cache"
import {
  forgetRejected,
  getRejected,
  rememberRejected,
} from "./rejected-signals"

const VOTE_ERROR = "Couldn't save your vote. Try again."

type Verdict = SignalVerdict | null

function pendingId(variables: unknown) {
  return typeof variables === "object" && variables && "id" in variables
    ? String(variables.id)
    : null
}

/**
 * ✓ Correct / ✕ Wrong / ⊘ Not relevant on a signal: optimistic, one active verdict, clicking it again
 * withdraws it. Only "Wrong" changes the score; the backend rescores in the same request.
 */
export function useSignalFeedback(companyId: string, serviceId: string) {
  const queryClient = useQueryClient()
  const vote = useFeedbackSignal({ mutation: { meta: { errorToast: false } } })
  const withdraw = useWithdrawSignalFeedback({
    mutation: { meta: { errorToast: false } },
  })

  const pendingVotes = useMutationState({
    filters: { mutationKey: getFeedbackSignalMutationKey(), status: "pending" },
    select: (mutation) => pendingId(mutation.state.variables),
  })
  const pendingWithdrawals = useMutationState({
    filters: {
      mutationKey: getWithdrawSignalFeedbackMutationKey(),
      status: "pending",
    },
    select: (mutation) => pendingId(mutation.state.variables),
  })
  const pending = new Set([...pendingVotes, ...pendingWithdrawals])
  const inFlight = useRef(new Set<string>())

  const key = leadCardKey(companyId, serviceId)

  const setMine = (signalId: string, verdict: Verdict) => {
    patchLeadCard(queryClient, companyId, serviceId, (detail) => ({
      ...detail,
      signals_by_question: detail.signals_by_question.map((group) => ({
        ...group,
        signals: group.signals.map((signal) =>
          signal.id === signalId ? { ...signal, my_feedback: verdict } : signal
        ),
      })),
    }))
    const snapshot = getRejected(companyId, serviceId, signalId)
    if (snapshot)
      rememberRejected(companyId, serviceId, {
        ...snapshot,
        signal: { ...snapshot.signal, my_feedback: verdict },
      })
  }

  const applyScore = (summary: ScoreSummary | null) => {
    if (!summary) return
    patchLeadCard(queryClient, companyId, serviceId, (detail) =>
      isScored(detail.score)
        ? { ...detail, score: { ...detail.score, ...summary } }
        : detail
    )
  }

  // The card's groups, why-now and breakdown can all change after a vote, and so can the list and quality.
  const refresh = () =>
    invalidateApi(
      queryClient,
      apiPaths.leads,
      apiPaths.quality,
      apiPaths.activity
    )

  /** A signal voted back from Wrong returns with the refetch: its snapshot is dropped only then, so it never blinks out. */
  const refreshThenForget = async (signalId: string) => {
    if (!getRejected(companyId, serviceId, signalId)) {
      void refresh()
      return
    }
    await refresh()
    forgetRejected(companyId, serviceId, signalId)
  }

  const currentPriority = () => {
    const detail = queryClient.getQueryData<LeadDetail>(key)
    return detail && isScored(detail.score) ? detail.score.priority : undefined
  }

  async function castVote(
    signal: SignalItem,
    question: QuestionRef,
    verdict: SignalVerdict
  ) {
    const before = currentPriority()
    try {
      const result = await vote.mutateAsync({
        id: signal.id,
        data: { verdict, service_id: serviceId },
      })
      applyScore(result.score)
      if (verdict !== "incorrect") {
        toast.success(
          verdict === "correct" ? "Marked correct" : "Marked not relevant"
        )
        await refreshThenForget(signal.id)
        return
      }
      const rejected = { ...signal, my_feedback: verdict }
      rememberRejected(companyId, serviceId, { signal: rejected, question })
      const after = result.score?.priority
      const change =
        before !== undefined &&
        after !== undefined &&
        score(before) !== score(after)
          ? ` · Priority ${score(before)} → ${score(after)}`
          : ""
      toast.success(`Marked wrong and removed from the score${change}`, {
        action: {
          label: "Undo",
          onClick: () => void rate(rejected, question, null),
        },
      })
      void refresh()
    } catch {
      setMine(signal.id, signal.my_feedback)
      toast.error(VOTE_ERROR)
      void refresh()
    }
  }

  async function withdrawVote(signal: SignalItem) {
    try {
      const result = await withdraw.mutateAsync({ id: signal.id })
      if (!result.withdrawn) {
        // The vote belongs to an older copy of the same evidence (matched by evidence key), not to this id.
        setMine(signal.id, signal.my_feedback)
        toast(
          "This vote was made on an earlier analysis and can't be undone here"
        )
        return
      }
      applyScore(result.score)
      toast.success("Vote removed")
      await refreshThenForget(signal.id)
    } catch {
      setMine(signal.id, signal.my_feedback)
      toast.error(VOTE_ERROR)
    }
  }

  async function rate(
    signal: SignalItem,
    question: QuestionRef,
    verdict: Verdict
  ) {
    // The buttons disable only once the mutation is pending; a second click (or Undo) in between is dropped here.
    if (verdict === signal.my_feedback || inFlight.current.has(signal.id))
      return
    inFlight.current.add(signal.id)
    try {
      await queryClient.cancelQueries({ queryKey: key })
      setMine(signal.id, verdict)
      if (verdict) await castVote(signal, question, verdict)
      else await withdrawVote(signal)
    } finally {
      inFlight.current.delete(signal.id)
    }
  }

  return { rate, pending }
}
