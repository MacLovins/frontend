import { Link } from "react-router"

import type { LeadCardScore, QuestionRef } from "@/api/generated/model"
import { WeightChip } from "@/components/common/chips"
import { ScoreBar } from "@/components/common/score-bars"
import { Card } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useLabels } from "@/hooks/use-labels"
import { useMe } from "@/hooks/use-session"
import { formatDateTime, score } from "@/lib/format"

import { byPolarityThenPoints } from "../lib/lead-card"
import type { ScoringExplainParams } from "../lib/scoring-defaults"
import { pointSums } from "../lib/score-explain"
import { formatPoints } from "../lib/text"

const linkClass = "text-[13px] text-foreground underline"

function HowCalculated({
  serviceId,
  params,
}: {
  serviceId: string
  params: ScoringExplainParams
}) {
  const { data: me } = useMe()
  if (me?.role === "admin") {
    return (
      <Link to={`/settings/${serviceId}/scoring`} className={linkClass}>
        How is this calculated?
      </Link>
    )
  }
  const { high, medium, low } = params.weights
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={`${linkClass} cursor-pointer bg-transparent p-0`}
          />
        }
      >
        How is this calculated?
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-4 text-[13px] leading-[1.5]"
      >
        Each question adds points: weight (H = {high}, M = {medium}, L = {low})
        × how strong and recent its evidence is. Buying-signal points become
        Buying signals 0–100, blocker points become Blockers 0–100, and Priority
        combines them with ICP fit. Older evidence counts less.
      </PopoverContent>
    </Popover>
  )
}

function Formula({
  scoreData,
  params,
}: {
  scoreData: LeadCardScore
  params: ScoringExplainParams
}) {
  const sums = pointSums(scoreData.breakdown)
  const cap = scoreData.rule_hits.find((hit) => hit.action === "cap")
  const exclude = scoreData.disqualified
    ? scoreData.rule_hits.find((hit) => hit.action === "exclude")
    : undefined
  const footer = [
    scoreData.scoring_profile_version != null
      ? `Scoring profile v${scoreData.scoring_profile_version}`
      : null,
    scoreData.computed_at
      ? `computed ${formatDateTime(scoreData.computed_at)}`
      : null,
  ].filter(Boolean)

  return (
    <div className="rounded-sm bg-muted p-3 text-[13px] leading-[1.5] text-text-secondary">
      Signals {sums.positive.toFixed(2)} points →{" "}
      <strong>Buying signals {score(scoreData.intent)}</strong> · Blockers{" "}
      {sums.negative.toFixed(2)} points →{" "}
      <strong>Blockers {score(scoreData.risk)}</strong> · Priority = Fit
      <sup>{params.fit_exponent}</sup> × Signals
      <sup>{params.intent_exponent}</sup> × (1 − {params.risk_penalty} ×
      Blockers){" "}
      {scoreData.disqualified ? (
        <>
          = 0, because rule “{exclude?.name ?? "disqualification"}” excludes the
          company
        </>
      ) : (
        <>
          = <strong>{score(scoreData.priority)}</strong>
        </>
      )}
      .{cap ? ` Capped at ${cap.cap_value} by rule “${cap.name}”.` : null}
      {footer.length ? ` ${footer.join(" · ")}.` : null}
    </div>
  )
}

/** Points per question (weight × evidence strength), buying signals first, then the formula with the API's numbers. */
export function ScoreBreakdownCard({
  scoreData,
  questions,
  serviceId,
  params,
}: {
  scoreData: LeadCardScore
  questions: Map<string, QuestionRef>
  serviceId: string
  params: ScoringExplainParams
}) {
  const label = useLabels()
  const rows = scoreData.breakdown
    .filter((row) => row.points > 0)
    .sort(byPolarityThenPoints)

  return (
    <Card className="gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="m-0 text-lg font-bold">Score breakdown</h2>
        <HowCalculated serviceId={serviceId} params={params} />
      </div>
      {rows.length ? (
        <div className="grid grid-cols-[minmax(0,260px)_36px_minmax(0,1fr)_60px] items-center gap-x-3 gap-y-2.5 text-sm">
          {rows.map((row) => {
            const question = questions.get(row.question_id)
            const negative = row.polarity === "negative"
            return (
              <div key={row.question_id} className="contents">
                <span className="truncate" title={question?.text ?? row.label}>
                  {question
                    ? label("categories", question.category)
                    : row.label}
                </span>
                {question ? <WeightChip weight={question.weight} /> : <span />}
                <ScoreBar
                  value={row.strength * 100}
                  metric={negative ? "risk" : "intent"}
                  size="lg"
                />
                <span
                  className={`text-right font-mono font-semibold ${negative ? "text-negative-strong" : "text-positive-strong"}`}
                >
                  {formatPoints(row.points, row.polarity)}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="m-0 text-[13px] text-muted-foreground">
          No question has evidence yet, so the score comes from ICP fit only.
        </p>
      )}
      <Formula scoreData={scoreData} params={params} />
    </Card>
  )
}
