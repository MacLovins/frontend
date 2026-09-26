import { WarningIcon } from "@phosphor-icons/react"
import { useId } from "react"
import { Link } from "react-router"

import type { ServiceOut } from "@/api/generated/model"
import { errorMessage } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useSelectService } from "@/hooks/use-current-service"
import { useMe } from "@/hooks/use-session"

import { copy } from "../copy"
import { useCatalog } from "../hooks/use-catalog"
import { useIcpDefaults } from "../hooks/use-icp-defaults"
import { fieldClass, SearchForm, type SearchQuery } from "./search-form"

function ServiceSelect({
  serviceId,
  services,
}: {
  serviceId: string
  services: ServiceOut[]
}) {
  const id = useId()
  const selectService = useSelectService()
  const items = services.map((service) => ({
    value: service.id,
    label: service.name,
  }))

  return (
    <div className={fieldClass}>
      <label htmlFor={id}>{copy.panel.service}</label>
      <Select
        items={items}
        value={serviceId}
        onValueChange={(value) => value && selectService(value)}
      >
        <SelectTrigger id={id} className="w-full rounded-sm px-2 font-normal">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function MissingIcpNote({ serviceId }: { serviceId: string }) {
  const isAdmin = useMe().data?.role === "admin"
  return (
    <p className="m-0 text-[13px] leading-[1.45] text-text-secondary">
      {copy.panel.noIcp}{" "}
      {isAdmin ? (
        <Button
          variant="link"
          className="text-[13px]"
          nativeButton={false}
          render={<Link to={`/settings/${serviceId}/icp`} />}
        >
          {copy.panel.setUpIcp}
        </Button>
      ) : (
        copy.panel.askAdmin
      )}
    </p>
  )
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-10" />
        </div>
      ))}
      <Skeleton className="h-11 rounded-md" />
    </div>
  )
}

function PanelError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-md bg-negative-surface p-3 text-[13px] text-negative-strong"
    >
      <span className="flex items-start gap-2">
        <WarningIcon className="mt-px size-4 shrink-0" aria-hidden />
        {errorMessage(error)}
      </span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {copy.results.tryAgain}
      </Button>
    </div>
  )
}

/** The left card: service, the ICP-derived query (editable for this search only) and the Search button. */
export function SearchPanel({
  serviceId,
  services,
  searching,
  onSearch,
}: {
  serviceId: string
  services: ServiceOut[]
  searching: boolean
  onSearch: (query: SearchQuery) => void
}) {
  const icp = useIcpDefaults(serviceId)
  const catalog = useCatalog()
  const error = icp.error ?? catalog.error

  return (
    <section className="flex w-[340px] shrink-0 flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <h2 className="m-0 text-[15px] font-bold">{copy.panel.title}</h2>
      <ServiceSelect serviceId={serviceId} services={services} />
      {icp.missing ? <MissingIcpNote serviceId={serviceId} /> : null}
      {icp.isLoading || catalog.isLoading ? (
        <PanelSkeleton />
      ) : error ? (
        <PanelError
          error={error}
          onRetry={() => {
            if (icp.error) void icp.refetch()
            catalog.refetch()
          }}
        />
      ) : (
        <SearchForm
          defaults={icp.defaults}
          catalog={catalog}
          searching={searching}
          onSearch={onSearch}
        />
      )}
    </section>
  )
}
