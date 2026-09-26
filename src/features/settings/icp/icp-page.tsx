import { Link, useParams } from "react-router"

import { useGetIcp, useGetService } from "@/api/generated/config/config"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { IcpEditor } from "@/features/settings/icp/components/icp-editor"
import { copy } from "@/features/settings/icp/copy"

export function IcpPage() {
  const { serviceId } = useParams()
  if (!serviceId) return null
  // Keyed so that switching the service starts from a clean form.
  return <IcpScreen key={serviceId} serviceId={serviceId} />
}

function IcpSkeleton() {
  return (
    <>
      <PageHeader title={copy.title}>
        <Skeleton className="h-4 w-[220px]" />
      </PageHeader>
      <div className="flex items-start gap-5 px-8 py-6" aria-busy="true">
        <div className="flex w-[720px] min-w-0 shrink flex-col gap-5">
          <Skeleton className="h-[360px] rounded-lg" />
          <Skeleton className="h-[260px] rounded-lg" />
        </div>
        <Skeleton className="h-[330px] min-w-[300px] flex-1 rounded-lg" />
      </div>
    </>
  )
}

function IcpScreen({ serviceId }: { serviceId: string }) {
  const service = useGetService(serviceId)
  const icp = useGetIcp(serviceId)
  // 404 "ICP not configured": services created without a preset have no ICP until the first save.
  const notConfigured = icp.error?.status === 404

  if (service.error?.status === 404) {
    return (
      <>
        <PageHeader title={copy.title} />
        <EmptyState
          title={copy.notFound.title}
          actions={
            <Button
              nativeButton={false}
              render={<Link to="/settings/services" />}
            >
              {copy.notFound.action}
            </Button>
          }
        />
      </>
    )
  }

  const error = service.error ?? (notConfigured ? null : icp.error)
  if (error) {
    return (
      <>
        <PageHeader title={copy.title} />
        <ErrorState
          title={copy.loadError}
          error={error}
          onRetry={() => {
            if (service.error) void service.refetch()
            if (icp.error) void icp.refetch()
          }}
        />
      </>
    )
  }

  if (!service.data || (!icp.data && !notConfigured)) return <IcpSkeleton />

  const profile = notConfigured ? null : (icp.data ?? null)
  return (
    <IcpEditor
      key={profile?.version ?? "new"}
      serviceId={serviceId}
      serviceName={service.data.name}
      profile={profile}
    />
  )
}
