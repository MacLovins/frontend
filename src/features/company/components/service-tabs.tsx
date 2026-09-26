import { Link } from "react-router"

import { TierBadge } from "@/components/common/tier"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSelectService, withService } from "@/hooks/use-current-service"
import { score } from "@/lib/format"

import type { ServiceTab } from "../hooks/use-service-tabs"

function TabScore({ value }: { value: ServiceTab["score"] }) {
  if (value === undefined) return <Skeleton className="h-4 w-14" />
  if (value === null)
    return <span className="font-mono text-muted-foreground">—</span>
  return (
    <>
      <span className="font-mono">{score(value.priority)}</span>
      <TierBadge tier={value.tier} size="sm" />
    </>
  )
}

/** One underline tab per service with the company's priority and tier for it; "Sources scanned · N" on the right. */
export function ServiceTabs({
  companyId,
  serviceId,
  tabs,
  sourcesCount,
}: {
  companyId: string
  serviceId: string | undefined
  tabs: ServiceTab[]
  sourcesCount: number
}) {
  const selectService = useSelectService()
  return (
    <div className="flex min-w-0 items-end">
      <Tabs
        value={serviceId ?? null}
        onValueChange={(value) => selectService(String(value))}
        className="min-w-0 gap-0"
      >
        <TabsList variant="line" aria-label="Service" className="flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2.5 px-4">
              {tab.name}
              <TabScore value={tab.score} />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Link
        to={withService(`/companies/${companyId}/sources`, serviceId)}
        className="ml-auto flex h-11 shrink-0 items-center px-3 text-sm text-text-secondary no-underline hover:text-link-hover"
      >
        Sources scanned · {sourcesCount}
      </Link>
    </div>
  )
}
