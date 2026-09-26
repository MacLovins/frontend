import type { ReactNode } from "react"

import type { LeadCardScore, LeadDetail } from "@/api/generated/model"
import { InfoTip } from "@/components/common/info-tip"
import { ScoreBar, type Metric } from "@/components/common/score-bars"
import { TierBadge } from "@/components/common/tier"
import { Card } from "@/components/ui/card"
import { useLabels } from "@/hooks/use-labels"
import { score } from "@/lib/format"
import { metricHelp, metricLabels } from "@/lib/labels"

import { useLeadRank } from "../hooks/use-lead-rank"
import { priorityHelp } from "../lib/copy"
import type { ScoringExplainParams } from "../lib/scoring-defaults"
import {
  blockersSentence,
  fitChecklist,
  signalsSentence,
  trendText,
} from "../lib/score-explain"
import { PrioritySparkline } from "./priority-sparkline"

function FitChecklist({ scoreData }: { scoreData: LeadCardScore }) {
  const items = fitChecklist(scoreData.fit_details.criteria)
  if (!items.length) return <>No ICP criteria set for this service</>
  return (
    <>
      {items.map((item, index) => (
        <span key={`${item.title}-${index}`}>
          {index ? " · " : ""}
          <span title={item.title}>
            {item.mark} {item.text}
          </span>
        </span>
      ))}
    </>
  )
}

function SubScore({
  metric,
  value,
  children,
}: {
  metric: Metric
  value: number
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        {metricLabels[metric]}
        <InfoTip label={metricLabels[metric]}>{metricHelp[metric]}</InfoTip>
      </div>
      <div className="font-mono text-[32px] leading-[normal] font-semibold">
        {score(value)}
      </div>
      <ScoreBar value={value} metric={metric} />
      <div className="text-xs leading-[1.4] text-text-secondary">
        {children}
      </div>
    </div>
  )
}

export function ScoreCard({
  detail,
  scoreData,
  serviceId,
  params,
}: {
  detail: LeadDetail
  scoreData: LeadCardScore
  serviceId: string
  params: ScoringExplainParams
}) {
  const label = useLabels()
  const rank = useLeadRank(serviceId, scoreData.priority)
  const trend = trendText(detail.history, scoreData.priority)
  const rankLine = [rank ? `#${rank.rank} of ${rank.total}` : null, trend]
    .filter(Boolean)
    .join(" · ")
  const blockerLabels = [
    ...new Set(
      detail.signals_by_question
        .filter(
          (group) =>
            group.question.polarity === "negative" && group.signals.length
        )
        .map((group) => label("categories", group.question.category))
    ),
  ]

  return (
    <Card className="flex-row items-stretch gap-6">
      <div className="flex w-[200px] shrink-0 flex-col gap-1.5 border-r border-subtle pr-6">
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          {metricLabels.priority}
          <InfoTip label={metricLabels.priority}>{priorityHelp}</InfoTip>
        </div>
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[56px] leading-none font-semibold">
            {score(scoreData.priority)}
          </span>
          <TierBadge tier={scoreData.tier} size="lg" />
        </div>
        {rankLine ? (
          <div className="text-[13px] text-muted-foreground">{rankLine}</div>
        ) : null}
        <PrioritySparkline
          points={[...detail.history].reverse()}
          hotThreshold={params.tiers.hot}
        />
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-5">
        <SubScore metric="fit" value={scoreData.fit}>
          <FitChecklist scoreData={scoreData} />
        </SubScore>
        <SubScore metric="intent" value={scoreData.intent}>
          {signalsSentence(detail)}
        </SubScore>
        <SubScore metric="risk" value={scoreData.risk}>
          {blockersSentence(scoreData, blockerLabels, params.risk_penalty)}
        </SubScore>
      </div>
    </Card>
  )
}
