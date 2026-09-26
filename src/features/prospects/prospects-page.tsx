import { useSearchParams } from "react-router"

import { PageHeader } from "@/components/common/page-header"
import { ErrorState } from "@/components/common/states"
import { useCurrentService } from "@/hooks/use-current-service"
import { matrixCopy, prospectsCopy } from "@/features/prospects/copy"
import { NoServices } from "@/features/prospects/components/no-services"
import { ListView } from "@/features/prospects/components/list/list-view"
import { ServiceTabs } from "@/features/prospects/components/list/service-tabs"
import { MatrixView } from "@/features/prospects/components/matrix/matrix-view"
import { useLiveLeads } from "@/features/prospects/hooks/use-live-leads"

/** `/prospects`: the ranked list, or the Fit × Signals matrix with `?view=matrix`. */
export function ProspectsPage() {
  const [params] = useSearchParams()
  const isMatrix = params.get("view") === "matrix"
  const { serviceId, service, services, isLoading, error, refetch } =
    useCurrentService()
  useLiveLeads()

  if (!serviceId || error) {
    return (
      <>
        <PageHeader title={isMatrix ? matrixCopy.title : prospectsCopy.title}>
          {isMatrix ? null : <ServiceTabs />}
        </PageHeader>
        {error ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : !isLoading && !services.length ? (
          <NoServices />
        ) : null}
      </>
    )
  }

  const serviceName = service?.name ?? ""
  return isMatrix ? (
    <MatrixView
      key={serviceId}
      serviceId={serviceId}
      serviceName={serviceName}
    />
  ) : (
    <ListView key={serviceId} serviceId={serviceId} serviceName={serviceName} />
  )
}
