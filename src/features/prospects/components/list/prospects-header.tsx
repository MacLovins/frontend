import { PlayIcon } from "@phosphor-icons/react"
import { cn } from "cn"

import { leadsExportUrl } from "@/api/leads-export"
import type { ListLeadsParams } from "@/api/generated/model"
import { PageHeader } from "@/components/common/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { prospectsCopy } from "@/features/prospects/copy"
import { PrecisionBadge } from "@/features/prospects/components/list/precision-badge"
import { ServiceTabs } from "@/features/prospects/components/list/service-tabs"

function ExportCsvButton({
  params,
  disabled,
}: {
  params: Omit<ListLeadsParams, "page" | "page_size">
  disabled: boolean
}) {
  if (disabled) {
    return (
      <Button variant="outline" className="border-border" disabled>
        {prospectsCopy.exportCsv}
      </Button>
    )
  }
  // The export answers with a CSV attachment, so it is a plain same-origin download link.
  return (
    <a
      href={leadsExportUrl(params)}
      download
      className={cn(
        buttonVariants({ variant: "outline" }),
        "border-border no-underline hover:text-black"
      )}
    >
      {prospectsCopy.exportCsv}
    </a>
  )
}

export function ProspectsHeader({
  serviceId,
  exportParams,
  canExport,
  onAnalyze,
}: {
  serviceId: string
  exportParams: Omit<ListLeadsParams, "page" | "page_size">
  canExport: boolean
  onAnalyze: () => void
}) {
  return (
    <PageHeader
      title={prospectsCopy.title}
      actions={
        <>
          <PrecisionBadge serviceId={serviceId} />
          <ExportCsvButton params={exportParams} disabled={!canExport} />
          <Button onClick={onAnalyze}>
            <PlayIcon size={16} aria-hidden="true" />
            {prospectsCopy.analyze}
          </Button>
        </>
      }
    >
      <ServiceTabs />
    </PageHeader>
  )
}
