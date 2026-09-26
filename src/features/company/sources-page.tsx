import { keepPreviousData } from "@tanstack/react-query"
import { useSearchParams } from "react-router"

import { useGetCompanyDocuments } from "@/api/generated/accounts/accounts"
import { SourceType } from "@/api/generated/model"
import { Skeleton } from "@/components/ui/skeleton"

import { AddSourceCard } from "./components/add-source-card"
import { CollectorsCard } from "./components/collectors-card"
import { CompanyError } from "./components/company-error"
import { CompanyHeaderFallback } from "./components/company-header"
import { DocumentsTable } from "./components/documents-table"
import { RejectedCard } from "./components/rejected-card"
import {
  SourcesHeader,
  SourcesHeaderSkeleton,
} from "./components/sources-header"
import { useRejectedSignals } from "./hooks/rejected-signals"
import { useCompanyCard } from "./hooks/use-company-card"
import { useReanalyze } from "./hooks/use-reanalyze"
import { signalTallies } from "./lib/document-usage"
import { hasService, isScored, sumOfSources } from "./lib/lead-card"

const PAGE_SIZE = 50

const isSourceType = (value: string | null): value is SourceType =>
  !!value && Object.values<string>(SourceType).includes(value)

/** Every document LeadRadar collected for the company, by type, with what fed the selected service's signals. */
export function SourcesPage() {
  const { companyId, serviceId, card } = useCompanyCard()
  const [params, setParams] = useSearchParams()
  const typeParam = params.get("type")
  const type = isSourceType(typeParam) ? typeParam : undefined
  const page = Math.max(1, Number(params.get("page")) || 1)

  const detail = card.data
  const rejected = useRejectedSignals(companyId, serviceId)
  const analysis = useReanalyze({
    company: detail?.company,
    serviceId,
    priority:
      detail && isScored(detail.score) ? detail.score.priority : undefined,
  })
  const documents = useGetCompanyDocuments(
    companyId,
    { page, page_size: PAGE_SIZE, ...(type ? { source_type: type } : {}) },
    { query: { staleTime: 30_000, placeholderData: keepPreviousData } }
  )

  const update = (change: (next: URLSearchParams) => void) =>
    setParams((current) => {
      const next = new URLSearchParams(current)
      change(next)
      return next
    })
  const selectType = (value: string | undefined) =>
    update((next) => {
      if (value) next.set("type", value)
      else next.delete("type")
      next.delete("page")
    })
  const selectPage = (value: number) =>
    update((next) => {
      if (value > 1) next.set("page", String(value))
      else next.delete("page")
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

  return (
    <>
      {detail ? (
        <SourcesHeader
          detail={detail}
          serviceId={serviceId}
          type={type}
          onType={selectType}
        />
      ) : (
        <SourcesHeaderSkeleton />
      )}
      <div className="grid items-start gap-5 px-8 py-5 xl:grid-cols-[minmax(0,780px)_minmax(300px,1fr)]">
        <DocumentsTable
          documents={documents.data}
          isLoading={documents.isLoading}
          isPlaceholder={documents.isPlaceholderData}
          error={documents.error}
          onRetry={() => void documents.refetch()}
          tallies={detail ? signalTallies(detail, rejected) : new Map()}
          serviceName={
            detail && hasService(detail.service)
              ? detail.service.name
              : undefined
          }
          collectedCount={detail ? sumOfSources(detail.sources_summary) : 0}
          pageSize={PAGE_SIZE}
          onPage={selectPage}
          analysis={analysis}
        />
        <div className="flex min-w-0 flex-col gap-3.5">
          {detail ? (
            <>
              <CollectorsCard
                company={detail.company}
                summary={detail.sources_summary}
              />
              <AddSourceCard company={detail.company} analysis={analysis} />
              <RejectedCard serviceId={serviceId} />
            </>
          ) : (
            ["h-[240px]", "h-[200px]", "h-[110px]"].map((height) => (
              <Skeleton key={height} className={`${height} rounded-lg`} />
            ))
          )}
        </div>
      </div>
    </>
  )
}
