import { useMemo } from "react"
import { useSearchParams } from "react-router"

import { useListServices } from "@/api/generated/config/config"
import { useGetPresets } from "@/api/generated/meta/meta"
import { PageHeader } from "@/components/common/page-header"
import { EmptyState, ErrorState } from "@/components/common/states"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentService } from "@/hooks/use-current-service"
import { storageKeys, writeStorage } from "@/lib/storage"

import { DescribeCard } from "@/features/settings/services/components/describe-card"
import { PresetsCard } from "@/features/settings/services/components/presets-card"
import { ServiceCard } from "@/features/settings/services/components/service-card"
import { ServiceDetails } from "@/features/settings/services/components/service-details"
import { copy } from "@/features/settings/services/copy"
import { sortServices } from "@/features/settings/services/lib/service-summary"

const NEW_PARAM = "new"

export function ServicesPage() {
  const [params, setParams] = useSearchParams()
  const services = useListServices()
  const presets = useGetPresets({ query: { staleTime: Infinity } })
  const { serviceId } = useCurrentService()

  const sorted = useMemo(() => sortServices(services.data ?? []), [services.data])
  const selected = sorted.find((service) => service.id === serviceId) ?? sorted[0]
  const creating = params.get(NEW_PARAM) === "1"

  // `?service=` is the global service param, so selecting a card also switches the app's service.
  const select = (id: string) => {
    writeStorage(storageKeys.service, id)
    setParams({ service: id })
  }
  const startCreating = () =>
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.set(NEW_PARAM, "1")
      return next
    })
  const stopCreating = () =>
    setParams((current) => {
      const next = new URLSearchParams(current)
      next.delete(NEW_PARAM)
      return next
    })

  const presetFor = (slug: string) => presets.data?.find((preset) => preset.key === slug)
  const showDetails = creating || selected !== undefined

  return (
    <>
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          <Button onClick={startCreating} disabled={creating}>
            {copy.newService}
          </Button>
        }
      />
      <div className="flex flex-col gap-5 px-8 py-6">
        {services.isPending ? (
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-[172px] rounded-lg" />
            ))}
          </div>
        ) : services.isError ? (
          <div className="rounded-lg border border-border bg-card">
            <ErrorState title={copy.loadError} error={services.error} onRetry={() => void services.refetch()} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-lg border border-border bg-card">
            <EmptyState title={copy.empty} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {sorted.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                preset={presetFor(service.slug)}
                selected={!creating && service.id === selected?.id}
                onSelect={() => select(service.id)}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-[minmax(0,700px)_minmax(300px,1fr)] items-start gap-5">
          {services.isPending ? (
            <Skeleton className="h-[520px] rounded-lg" />
          ) : showDetails ? (
            <ServiceDetails
              key={creating ? NEW_PARAM : selected?.id}
              service={creating ? undefined : selected}
              services={sorted}
              onCreated={select}
              onCancel={stopCreating}
            />
          ) : (
            <div />
          )}
          <div className="flex min-w-0 flex-col gap-4">
            <PresetsCard services={sorted} onApplied={select} />
            <DescribeCard services={sorted} />
          </div>
        </div>
      </div>
    </>
  )
}
