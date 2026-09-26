import { useMemo } from "react"

import type { ScoringParams, ScoringProfileOut } from "@/api/generated/model"
import { FormulaCard } from "@/features/settings/scoring/components/formula-card"
import { PreviewSummaryBar } from "@/features/settings/scoring/components/preview-summary-bar"
import { PreviewTable } from "@/features/settings/scoring/components/preview-table"
import { SummaryBarSkeleton } from "@/features/settings/scoring/components/scoring-layout"
import { copy } from "@/features/settings/scoring/copy"
import { usePreviewSample } from "@/features/settings/scoring/hooks/use-preview-sample"
import { buildPreview } from "@/features/settings/scoring/lib/scoring-estimate"

/** Right column: the estimated effect of the draft on a sample of the top accounts, and the formula it feeds. */
export function PreviewPanel({
  serviceId,
  profile,
  saved,
  draft,
}: {
  serviceId: string
  profile: ScoringProfileOut | null
  saved: ScoringParams
  draft: ScoringParams
}) {
  const sample = usePreviewSample(serviceId)
  const preview = useMemo(
    () => buildPreview(sample.samples, sample.levels, saved, draft),
    [sample.samples, sample.levels, saved, draft]
  )

  const note =
    sample.total === 0
      ? copy.summary.empty
      : copy.summary.estimate(sample.samples.length, sample.total)

  return (
    <>
      {sample.isPending ? (
        <SummaryBarSkeleton />
      ) : sample.error ? null : (
        <PreviewSummaryBar
          tierChanges={preview.tierChanges}
          moved={preview.moved}
          note={note}
        />
      )}
      <PreviewTable
        serviceId={serviceId}
        savedVersion={profile?.version ?? null}
        rows={preview.rows}
        total={sample.total}
        isPending={sample.isPending}
        isFetching={sample.isFetching}
        error={sample.error}
        onRetry={sample.retry}
      />
      <FormulaCard params={draft} profile={profile} />
    </>
  )
}
