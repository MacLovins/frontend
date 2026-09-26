import type { UseQueryResult } from "@tanstack/react-query"

import type { QualityMetricsOut } from "@/api/generated/model"
import type { ApiError } from "@/api/mutator"
import { useLabels } from "@/hooks/use-labels"
import { formatNumber } from "@/lib/format"

import { qualityCopy, rejectReasonLabels } from "../copy"
import { rejectedRows } from "../lib/quality-metrics"
import { CardError, CardNote, QualityCard, SkeletonRows } from "./quality-card"

/** Evidence the code verifier threw away before scoring, by reason. */
export function RejectedCard({
  quality,
}: {
  quality: UseQueryResult<QualityMetricsOut, ApiError>
}) {
  const label = useLabels()

  return (
    <QualityCard title={qualityCopy.rejectedTitle}>
      {quality.isPending ? (
        <SkeletonRows count={4} className="h-4" />
      ) : quality.isError ? (
        <CardError
          title={qualityCopy.rejectedError}
          error={quality.error}
          onRetry={() => void quality.refetch()}
        />
      ) : (
        <RejectedBody
          verifier={quality.data.verifier}
          reasonLabel={(key) =>
            rejectReasonLabels[key] ?? label("reject_reasons", key)
          }
        />
      )}
    </QualityCard>
  )
}

function RejectedBody({
  verifier,
  reasonLabel,
}: {
  verifier: QualityMetricsOut["verifier"]
  reasonLabel: (key: string) => string
}) {
  const { rows, total, pct } = rejectedRows(verifier)
  if (!rows.length) return <CardNote>{qualityCopy.rejectedEmpty}</CardNote>
  return (
    <>
      <dl className="m-0 grid grid-cols-[minmax(0,1fr)_50px] gap-y-2 text-[13px]">
        {rows.map(([reason, count]) => (
          <div key={reason} className="contents">
            <dt>{reasonLabel(reason)}</dt>
            <dd className="m-0 text-right font-mono">{formatNumber(count)}</dd>
          </div>
        ))}
      </dl>
      <p className="m-0 text-xs text-muted-foreground">
        {qualityCopy.rejectedFooter(
          formatNumber(total),
          formatNumber(verifier.evidence_total),
          pct
        )}
      </p>
    </>
  )
}
