import { createContext, useContext } from "react"

export type QuestionsContextValue = {
  serviceId: string
  serviceName: string
  /** Scored companies of the service: every one was analysed with the wording before a change. */
  companyCount: number
  /** Keys of every question of the service, turned-off ones included (they keep their key). */
  takenKeys: ReadonlySet<string>
  /** Search-term polling gave up while some are still pending. */
  keywordsStalled: boolean
  /** Page-load time, for the 24-hour "New · ready" badge. */
  now: number
  markChanged: (questionIds: string[]) => void
  restartPolling: () => void
  showRescored: () => void
}

export const QuestionsContext = createContext<QuestionsContextValue | null>(
  null
)

export function useQuestionsContext() {
  const value = useContext(QuestionsContext)
  if (!value) throw new Error("useQuestionsContext needs QuestionsContext")
  return value
}
