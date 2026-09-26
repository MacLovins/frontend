import { PageHeader } from "@/components/common/page-header"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentService } from "@/hooks/use-current-service"

import { DiscoveryWorkspace } from "./components/discovery-workspace"
import { copy } from "./copy"

export function DiscoveryPage() {
  const { serviceId, service, services, isLoading, error, refetch } =
    useCurrentService()
  // Discovery also works for an inactive service opened by link (backend: 404 only outside the org).
  const options =
    service && !services.some((item) => item.id === service.id)
      ? [...services, service]
      : services

  return (
    <>
      <PageHeader
        className="sticky top-0 z-10"
        title={copy.title}
        subtitle={copy.subtitle}
      />
      {isLoading ? (
        <div className="flex items-start gap-5 px-8 py-5" aria-busy>
          <Skeleton className="h-[520px] w-[340px] shrink-0 rounded-lg" />
          <Skeleton className="h-[180px] min-w-0 flex-1 rounded-lg" />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : serviceId ? (
        <DiscoveryWorkspace
          key={serviceId}
          serviceId={serviceId}
          services={options}
        />
      ) : (
        <EmptyState title={copy.noService.title}>
          {copy.noService.body}
        </EmptyState>
      )}
    </>
  )
}
