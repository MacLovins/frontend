import { Link, useParams } from "react-router"

import {
  useGetScoringProfile,
  useGetService,
} from "@/api/generated/config/config"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScoringBodySkeleton } from "@/features/settings/scoring/components/scoring-layout"
import { ScoringEditor } from "@/features/settings/scoring/components/scoring-editor"
import { copy } from "@/features/settings/scoring/copy"

export function ScoringPage() {
  const { serviceId } = useParams()
  if (!serviceId) return null
  // Keyed so that switching the service starts from that service's saved profile.
  return <ScoringScreen key={serviceId} serviceId={serviceId} />
}

function ScoringScreen({ serviceId }: { serviceId: string }) {
  const service = useGetService(serviceId)
  const profile = useGetScoringProfile(serviceId)
  // 404 means no profile yet: the first rescore or analysis creates v1, until then the engine uses its defaults.
  const noProfile = profile.error?.status === 404

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

  const error = service.error ?? (noProfile ? null : profile.error)
  if (error) {
    return (
      <>
        <PageHeader title={copy.title} />
        <ErrorState
          title={copy.loadError}
          error={error}
          onRetry={() => {
            if (service.error) void service.refetch()
            if (profile.error) void profile.refetch()
          }}
        />
      </>
    )
  }

  if (!service.data || (!profile.data && !noProfile)) {
    return (
      <>
        <PageHeader title={copy.title}>
          <Skeleton className="h-4 w-[260px]" />
        </PageHeader>
        <ScoringBodySkeleton />
      </>
    )
  }

  return (
    <ScoringEditor
      key={profile.data?.version ?? "defaults"}
      serviceId={serviceId}
      serviceName={service.data.name}
      profile={profile.data ?? null}
    />
  )
}
