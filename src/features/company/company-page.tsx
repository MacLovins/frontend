import type { ReactNode } from "react"

import { useGetScoringProfile } from "@/api/generated/config/config"
import type {
  LeadCardScore,
  LeadDetail,
  LeadService,
} from "@/api/generated/model"
import { withService } from "@/hooks/use-current-service"

import { ActivityCard } from "./components/activity-card"
import { CompanyError } from "./components/company-error"
import {
  CompanyHeader,
  CompanyHeaderFallback,
  CompanyHeaderSkeleton,
} from "./components/company-header"
import {
  LeftColumnSkeleton,
  RightColumnSkeleton,
} from "./components/company-skeletons"
import { DecisionMakersCard } from "./components/decision-makers-card"
import { EvidenceCard } from "./components/evidence-card"
import { NoServiceCard, NotScoredCard } from "./components/not-scored-card"
import { NotesCard } from "./components/notes-card"
import { RuleHitsNotice } from "./components/rule-hits-notice"
import { ScoreBreakdownCard } from "./components/score-breakdown-card"
import { ScoreCard } from "./components/score-card"
import { WhatWasScannedCard } from "./components/what-was-scanned-card"
import { WhyNowCard } from "./components/why-now-card"
import { useCompanyCard } from "./hooks/use-company-card"
import { useReanalyze } from "./hooks/use-reanalyze"
import { useServiceTabs } from "./hooks/use-service-tabs"
import { hasService, isScored, questionIndex } from "./lib/lead-card"
import {
  explainParams,
  type ScoringExplainParams,
} from "./lib/scoring-defaults"

function PageBody({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid items-start gap-6 px-8 py-6 xl:grid-cols-[minmax(0,772px)_minmax(320px,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">{left}</div>
      <div className="flex min-w-0 flex-col gap-5">{right}</div>
    </div>
  )
}

function ScoredColumn({
  detail,
  scoreData,
  service,
  params,
  sourcesHref,
}: {
  detail: LeadDetail
  scoreData: LeadCardScore
  service: LeadService
  params: ScoringExplainParams
  sourcesHref: string
}) {
  return (
    <>
      <RuleHitsNotice hits={scoreData.rule_hits} />
      <ScoreCard
        detail={detail}
        scoreData={scoreData}
        serviceId={service.id}
        params={params}
      />
      <WhyNowCard reasons={scoreData.why_now} sourcesHref={sourcesHref} />
      <ScoreBreakdownCard
        scoreData={scoreData}
        questions={questionIndex(detail)}
        serviceId={service.id}
        params={params}
      />
      <EvidenceCard
        detail={detail}
        companyId={detail.company.id}
        serviceId={service.id}
        sourcesHref={sourcesHref}
      />
    </>
  )
}

export function CompanyPage() {
  const { companyId, serviceId, card } = useCompanyCard()
  const detail = card.data
  const current = detail && !card.isPlaceholderData ? detail : undefined
  const scoreData =
    current && isScored(current.score) ? current.score : undefined
  const tabs = useServiceTabs(companyId, serviceId, current)
  // Any role may read the profile; without a stored row (404) the backend scores with its defaults.
  const profile = useGetScoringProfile(serviceId ?? "", {
    query: { enabled: !!serviceId && !!scoreData, staleTime: 5 * 60_000 },
  })
  const analysis = useReanalyze({
    company: detail?.company,
    serviceId,
    priority: scoreData?.priority,
  })

  if (card.error && !detail) {
    return (
      <>
        <CompanyHeaderFallback />
        <CompanyError
          error={card.error}
          companyId={companyId}
          onRetry={() => void card.refetch()}
        />
      </>
    )
  }
  if (!detail) {
    return (
      <>
        <CompanyHeaderSkeleton />
        <PageBody
          left={<LeftColumnSkeleton />}
          right={<RightColumnSkeleton />}
        />
      </>
    )
  }

  const sourcesHref = withService(`/companies/${companyId}/sources`, serviceId)
  const service = hasService(detail.service) ? detail.service : undefined
  const left = !current ? (
    <LeftColumnSkeleton />
  ) : !service ? (
    <NoServiceCard />
  ) : scoreData ? (
    <ScoredColumn
      detail={current}
      scoreData={scoreData}
      service={service}
      params={explainParams(profile.data?.params)}
      sourcesHref={sourcesHref}
    />
  ) : (
    <NotScoredCard serviceName={service.name} analysis={analysis} />
  )

  return (
    <>
      <CompanyHeader
        detail={detail}
        serviceId={serviceId}
        tabs={tabs}
        scored={!!scoreData}
        analysis={analysis}
      />
      <PageBody
        left={left}
        right={
          <>
            <DecisionMakersCard
              titles={detail.decision_makers}
              companyName={detail.company.name}
            />
            <NotesCard key={detail.company.id} company={detail.company} />
            <WhatWasScannedCard
              summary={detail.sources_summary}
              sourcesHref={sourcesHref}
            />
            <ActivityCard history={current?.history ?? []} />
          </>
        }
      />
    </>
  )
}
