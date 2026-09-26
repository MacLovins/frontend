/**
 * Plain-language explanations built from API values. Nothing here recomputes a score (SPEC §4): the numbers
 * are the API's, the sentences only describe them.
 */
import { differenceInCalendarDays, parseISO, subDays } from "date-fns"

import type {
  Contribution,
  FitCriterion,
  LeadCardScore,
  LeadDetail,
  ScoreHistoryPoint,
  Tier,
} from "@/api/generated/model"
import { formatNumber, score } from "@/lib/format"
import { tierLabels } from "@/lib/labels"

import { formatDateShort } from "./text"

const DAY_MS = 86_400_000

/** "up from 64 last week", "down from 70 on 14 Sep", "unchanged since last week", or null. */
export function trendText(
  history: ScoreHistoryPoint[],
  priority: number,
  now = new Date()
) {
  const weekAgo = now.getTime() - 7 * DAY_MS
  const reference = history.find(
    (point) =>
      point.computed_at && parseISO(point.computed_at).getTime() <= weekAgo
  )
  const direction = (from: number) => (priority > from ? "up" : "down")

  if (reference?.computed_at) {
    const delta = priority - reference.priority
    // History is not bucketed by week: an older reference is named by its date, not as "last week".
    const lastWeek =
      weekAgo - parseISO(reference.computed_at).getTime() < 7 * DAY_MS
    if (Math.abs(delta) < 0.5)
      return lastWeek ? "unchanged since last week" : null
    const when = lastWeek
      ? "last week"
      : `on ${formatDateShort(reference.computed_at)}`
    return `${direction(reference.priority)} from ${score(reference.priority)} ${when}`
  }
  const previous = history[1]
  if (!previous?.computed_at || Math.abs(priority - previous.priority) < 0.5)
    return null
  return `${direction(previous.priority)} from ${score(previous.priority)} on ${formatDateShort(previous.computed_at)}`
}

const numbersIn = (label: string) => {
  const numbers = label.match(/\d[\d,.]*/g) ?? []
  return numbers.map((value) => Number(value.replace(/,/g, "")))
}

function criterionLabel(criterion: FitCriterion) {
  switch (criterion.criterion) {
    case "countries":
    case "country_in":
      return "ICP country"
    case "industries_any":
    case "industry_in":
      return "Priority industry"
    case "employees_min":
    case "employees_between": {
      const numbers = numbersIn(criterion.label)
      const single =
        criterion.criterion === "employees_min"
          ? numbers.length >= 1
          : numbers.length === 1
      return single && Number.isFinite(numbers[0])
        ? `${formatNumber(numbers[0])}+ employees`
        : criterion.label
    }
    default:
      return criterion.label
  }
}

const criterionMarks: Record<FitCriterion["status"], string> = {
  pass: "✓",
  match: "✓",
  fail: "✕",
  no_match: "✕",
  unknown: "?",
}

export function fitChecklist(criteria: FitCriterion[]) {
  return criteria.map((criterion) => ({
    mark: criterionMarks[criterion.status],
    text: criterionLabel(criterion),
    title: criterion.label,
  }))
}

export function signalsSentence(detail: LeadDetail, today = new Date()) {
  const answered = detail.signals_by_question.filter(
    (group) => group.question.polarity === "positive"
  )
  const asked =
    answered.length +
    detail.questions_without_evidence.filter(
      (question) => question.polarity === "positive"
    ).length
  if (answered.length === 0) return "No buying signals found yet"
  const monthAgo = subDays(today, 30)
  const recent = answered.filter((group) =>
    group.signals.some(
      (signal) =>
        signal.event_date &&
        differenceInCalendarDays(parseISO(signal.event_date), monthAgo) >= 0
    )
  ).length
  const base = `${answered.length} of ${asked} buying questions answered with evidence`
  return recent ? `${base}, ${recent} of them from the last 30 days` : base
}

export function blockersSentence(
  scoreData: LeadCardScore,
  blockerLabels: string[],
  riskPenalty: number
) {
  if (scoreData.disqualified) {
    const rule = scoreData.rule_hits.find((hit) => hit.action === "exclude")
    return rule
      ? `Excluded by rule “${rule.name}”.`
      : "Excluded by a disqualification rule."
  }
  if (scoreData.risk < 0.5) return "No blockers found."
  const lowers = `Lowers priority by ${Math.round(riskPenalty * scoreData.risk)}%; it doesn't rule the company out.`
  if (!blockerLabels.length) return lowers
  const names = blockerLabels.join(", ")
  return `${names[0].toUpperCase()}${names.slice(1)}. ${lowers}`
}

export function pointSums(breakdown: Contribution[]) {
  let positive = 0
  let negative = 0
  for (const row of breakdown) {
    if (row.polarity === "positive") positive += row.points
    else negative += row.points
  }
  return { positive, negative }
}

type ActivityItem = {
  key: string
  strong: string
  rest: string
  at: string | null
}

const HISTORY_LIMIT = 10

/** Score changes from the card's history (newest first, capped at 10 by the API), unchanged rescoring skipped. */
export function activityItems(history: ScoreHistoryPoint[], max = 5) {
  const items: ActivityItem[] = []
  const tier = (value: Tier) => tierLabels[value]
  history.forEach((next, index) => {
    const previous = history[index + 1]
    const key = `${next.computed_at ?? "unknown"}-${index}`
    if (!previous) {
      if (history.length < HISTORY_LIMIT) {
        items.push({
          key,
          strong: "First scored",
          rest: ` ${tier(next.tier)} · priority ${score(next.priority)}`,
          at: next.computed_at,
        })
      }
      return
    }
    const change = `${score(previous.priority)} → ${score(next.priority)}`
    if (previous.tier !== next.tier) {
      items.push({
        key,
        strong: `${tier(previous.tier)} → ${tier(next.tier)}`,
        rest: `, priority ${change}`,
        at: next.computed_at,
      })
    } else if (Math.abs(next.priority - previous.priority) >= 0.5) {
      items.push({
        key,
        strong: `Priority ${change}`,
        rest: "",
        at: next.computed_at,
      })
    }
  })
  return items.slice(0, max)
}
