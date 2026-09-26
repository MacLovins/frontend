import { useCallback, useEffect, useMemo, useState } from "react"

import { useListQuestions } from "@/api/generated/config/config"
import {
  hasPendingKeywords,
  sortQuestions,
} from "@/features/settings/questions/lib/question-utils"

const POLL_INTERVAL_MS = 3_000
// Pending can be terminal (quota used up, worker down; backend worker/tasks.py), so polling gives up and
// offers Regenerate instead.
const POLL_LIMIT_MS = 2 * 60_000

/** The service's questions, sorted, polled every 3 s while search terms are generating. */
export function useQuestionList(serviceId: string) {
  // Each stretch of pending search terms (and each restart after an admin action) gets a fresh budget.
  const [round, setRound] = useState(0)
  const [expiredRound, setExpiredRound] = useState<number | null>(null)
  const expired = expiredRound === round

  const query = useListQuestions(serviceId, {
    query: {
      refetchInterval: (current) =>
        !expired && hasPendingKeywords(current.state.data)
          ? POLL_INTERVAL_MS
          : false,
    },
  })
  const pending = hasPendingKeywords(query.data)

  const [wasPending, setWasPending] = useState(pending)
  if (pending !== wasPending) {
    setWasPending(pending)
    if (pending) setRound((value) => value + 1)
  }

  useEffect(() => {
    if (!pending) return
    const timer = window.setTimeout(() => setExpiredRound(round), POLL_LIMIT_MS)
    return () => window.clearTimeout(timer)
  }, [pending, round])

  const questions = useMemo(() => sortQuestions(query.data ?? []), [query.data])
  const restartPolling = useCallback(() => setRound((value) => value + 1), [])

  return {
    query,
    questions,
    keywordsStalled: pending && expired,
    restartPolling,
  }
}
