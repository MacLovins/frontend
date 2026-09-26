import type {
  LeadCardScore,
  LeadDetail,
  LeadService,
  QuestionRef,
  SignalItem,
  Strength,
} from "@/api/generated/model"

/** The card answers `score: {}` when the company has no current score for the service. */
export const isScored = (score: LeadDetail["score"]): score is LeadCardScore =>
  "priority" in score

/** `service: {}` when the organisation has no service at all. */
export const hasService = (
  service: LeadDetail["service"]
): service is LeadService => "id" in service

export function questionIndex(detail: LeadDetail) {
  const questions = new Map<string, QuestionRef>()
  for (const group of detail.signals_by_question)
    questions.set(group.question.id, group.question)
  for (const question of detail.questions_without_evidence)
    questions.set(question.id, question)
  return questions
}

const strengthRank: Record<Strength, number> = {
  weak: 1,
  moderate: 2,
  strong: 3,
}

export function strongest(signals: SignalItem[]) {
  return signals.reduce<Strength | null>(
    (best, signal) =>
      !best || strengthRank[signal.strength] > strengthRank[best]
        ? signal.strength
        : best,
    null
  )
}

export const sumOfSources = (summary: LeadDetail["sources_summary"]) =>
  Object.values(summary).reduce((total, count) => total + count, 0)

export type RejectedSignal = { signal: SignalItem; question: QuestionRef }

/** `points` is null for a group rebuilt from this session's rejected signals: the API no longer returns it. */
export type EvidenceGroup = {
  question: QuestionRef
  points: number | null
  signals: SignalItem[]
}

/** Buying signals first, then blockers; within each, the most points first. */
export function byPolarityThenPoints<
  T extends { polarity: QuestionRef["polarity"]; points: number | null },
>(a: T, b: T) {
  if (a.polarity !== b.polarity) return a.polarity === "positive" ? -1 : 1
  return (b.points ?? -1) - (a.points ?? -1)
}

/**
 * Evidence groups with this session's "Wrong" votes merged back in. A signal marked wrong becomes
 * `rejected_by_user` and is gone from the next card fetch (backend leads/router.py lists active signals
 * only), but the user must still see it greyed out with an undo.
 */
export function evidenceGroups(
  detail: LeadDetail,
  rejected: ReadonlyMap<string, RejectedSignal>
) {
  const groups: EvidenceGroup[] = detail.signals_by_question.map((group) => ({
    question: group.question,
    points: group.points,
    signals: [...group.signals],
  }))
  const present = new Set(
    groups.flatMap((group) => group.signals.map((signal) => signal.id))
  )
  for (const { signal, question } of rejected.values()) {
    if (present.has(signal.id)) continue
    let group = groups.find((item) => item.question.id === question.id)
    if (!group) {
      group = { question, points: null, signals: [] }
      groups.push(group)
    }
    group.signals.push(signal)
  }
  return groups
    .map((group) => ({
      group,
      polarity: group.question.polarity,
      points: group.points,
    }))
    .sort(byPolarityThenPoints)
    .map(({ group }) => group)
}
