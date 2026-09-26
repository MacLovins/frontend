import { useState } from "react"

import { useGetIcp } from "@/api/generated/config/config"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { score } from "@/lib/format"
import { matrixCopy, prospectsCopy } from "@/features/prospects/copy"
import { AnalyzeDialog } from "@/features/prospects/components/analyze-dialog"
import { ViewSwitch } from "@/features/prospects/components/view-switch"
import { MatrixLegend } from "@/features/prospects/components/matrix/matrix-legend"
import { MatrixPlot } from "@/features/prospects/components/matrix/matrix-plot"
import { QuadrantGuide } from "@/features/prospects/components/matrix/quadrant-guide"
import {
  SelectedCard,
  SelectedCardSkeleton,
} from "@/features/prospects/components/matrix/selected-card"
import { useIndustryLabel } from "@/features/prospects/hooks/use-industry-label"
import { useMatrixLeads } from "@/features/prospects/hooks/use-matrix-leads"
import { useProspectsParams } from "@/features/prospects/hooks/use-prospects-params"

/** Every scored account of the service as a Fit × Buying signals scatter. */
export function MatrixView({
  serviceId,
  serviceName,
}: {
  serviceId: string
  serviceName: string
}) {
  const { params, setSelected } = useProspectsParams()
  const [analyzeOpen, setAnalyzeOpen] = useState(false)
  const industryLabel = useIndustryLabel()
  const leads = useMatrixLeads(serviceId)
  const icp = useGetIcp(serviceId, { query: { staleTime: 5 * 60_000 } })

  const items = leads.data?.items ?? []
  const requested = params.get("selected")
  const selected =
    items.find((lead) => lead.company.id === requested) ?? items[0]
  const distinctFit = new Set(items.map((lead) => score(lead.score.fit))).size
  // A service created without an ICP answers 404 "ICP not configured" (config/router.py:344): no criteria.
  const niceToHave = icp.data
    ? (icp.data.nice_to_have?.criteria.length ?? 0)
    : icp.error?.status === 404
      ? 0
      : undefined

  let chart
  if (leads.isPending) {
    chart = <Skeleton className="h-[640px] w-[740px] rounded-sm" />
  } else if (leads.isError) {
    chart = (
      <ErrorState
        title={matrixCopy.loadError}
        error={leads.error}
        onRetry={() => void leads.refetch()}
      />
    )
  } else if (!items.length) {
    chart = (
      <EmptyState
        title={matrixCopy.emptyTitle}
        actions={
          <Button onClick={() => setAnalyzeOpen(true)}>
            {prospectsCopy.analyzeAccounts}
          </Button>
        }
      >
        {matrixCopy.emptyBody}
      </EmptyState>
    )
  } else {
    chart = (
      <>
        <MatrixPlot
          items={items}
          selectedId={selected?.company.id}
          onSelect={setSelected}
        />
        <MatrixLegend
          distinctFitValues={distinctFit}
          niceToHave={niceToHave}
          capped={(leads.data?.total ?? 0) > items.length}
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={matrixCopy.title}
        subtitle={[
          serviceName,
          leads.data ? `${leads.data.total} ${matrixCopy.accounts}` : null,
        ]
          .filter(Boolean)
          .join(" · ")}
        actions={<ViewSwitch current="matrix" />}
      />
      <div className="flex flex-wrap items-start gap-6 px-8 py-6">
        <section
          aria-label={matrixCopy.title}
          className="flex w-[780px] shrink-0 flex-col gap-3 rounded-lg border border-border bg-card p-5"
        >
          <p className="m-0 text-sm leading-[1.45] text-text-secondary">
            {matrixCopy.intro}
          </p>
          {chart}
        </section>
        <div className="flex min-w-[300px] flex-1 flex-col gap-4">
          {leads.isPending ? (
            <SelectedCardSkeleton />
          ) : selected ? (
            <SelectedCard
              lead={selected}
              serviceId={serviceId}
              industryLabel={industryLabel}
            />
          ) : null}
          <QuadrantGuide />
        </div>
      </div>
      <AnalyzeDialog
        open={analyzeOpen}
        onOpenChange={setAnalyzeOpen}
        serviceId={serviceId}
        serviceName={serviceName}
      />
    </>
  )
}
