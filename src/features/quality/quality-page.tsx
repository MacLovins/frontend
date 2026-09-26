import { keepPreviousData } from "@tanstack/react-query"
import { useMemo } from "react"
import { cn } from "cn"

import { useGetQuality } from "@/api/generated/feedback/feedback"
import { useGetUsage } from "@/api/generated/meta/meta"
import { PageHeader } from "@/components/common/page-header"
import { useLabels } from "@/hooks/use-labels"

import { PrecisionCard } from "./components/precision-card"
import { RejectedCard } from "./components/rejected-card"
import { ReviewCard } from "./components/review-card"
import { ScopeTabs } from "./components/scope-tabs"
import { StatTiles } from "./components/stat-tiles"
import { UsageCard } from "./components/usage-card"
import { qualityCopy, sourceLabels } from "./copy"
import { useQualityScope } from "./hooks/use-quality-scope"
import { byPrecision } from "./lib/quality-metrics"

export function QualityPage() {
  const scope = useQualityScope()
  const label = useLabels()

  // No params for all services: the same cache entry as the sidebar's precision badge.
  const quality = useGetQuality(
    scope.serviceId ? { service_id: scope.serviceId } : undefined,
    {
      query: { staleTime: 30_000, placeholderData: keepPreviousData },
    }
  )
  const usage = useGetUsage({
    query: { refetchInterval: 60_000, refetchOnWindowFocus: true },
  })

  const categoryRows = useMemo(
    () =>
      quality.data?.by_category
        .map((row) => ({
          key: row.category,
          label: label("categories", row.category),
          ...row,
        }))
        .sort(byPrecision),
    [quality.data, label]
  )
  const sourceRows = useMemo(
    () =>
      quality.data?.by_source
        .map((row) => ({
          key: row.source_type,
          label:
            sourceLabels[row.source_type] ??
            label("source_types", row.source_type),
          ...row,
        }))
        .sort(byPrecision),
    [quality.data, label]
  )
  const retryQuality = () => void quality.refetch()

  return (
    <>
      <PageHeader title={qualityCopy.title} subtitle={qualityCopy.subtitle}>
        <ScopeTabs
          tabs={scope.tabs}
          value={scope.serviceId}
          isLoading={scope.isLoading}
          onChange={scope.setScope}
        />
      </PageHeader>
      <div
        className={cn(
          "flex min-w-0 flex-col gap-4 px-8 py-5 transition-opacity",
          quality.isPlaceholderData && "opacity-60"
        )}
        aria-busy={quality.isPlaceholderData || undefined}
      >
        <StatTiles quality={quality} usage={usage} />
        <div className="flex items-start gap-4">
          <div className="flex w-[560px] max-w-[50%] shrink-0 flex-col gap-4">
            <PrecisionCard
              title={qualityCopy.byCategoryTitle}
              rows={categoryRows}
              skeletonRows={6}
              showBelowTarget
              isPending={quality.isPending}
              error={quality.error}
              onRetry={retryQuality}
            />
            <PrecisionCard
              title={qualityCopy.bySourceTitle}
              rows={sourceRows}
              skeletonRows={4}
              isPending={quality.isPending}
              error={quality.error}
              onRetry={retryQuality}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <ReviewCard serviceId={scope.serviceId} />
            <RejectedCard quality={quality} />
            <UsageCard usage={usage} />
          </div>
        </div>
      </div>
    </>
  )
}
