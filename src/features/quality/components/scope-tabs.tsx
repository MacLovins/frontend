import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { qualityCopy } from "../copy"
import type { ScopeTab } from "../hooks/use-quality-scope"

const ALL = "all"

/** [Both services] [Automation] [Cyber]: the metrics and the review queue follow the scope. */
export function ScopeTabs({
  tabs,
  value,
  isLoading,
  onChange,
}: {
  tabs: ScopeTab[]
  value: string | undefined
  isLoading: boolean
  onChange: (serviceId: string | undefined) => void
}) {
  if (isLoading) return <Skeleton className="ml-auto h-10 w-72 rounded-md" />
  // A single service has nothing to compare with.
  if (tabs.length < 2) return null

  return (
    <Tabs
      className="ml-auto"
      value={value ?? ALL}
      onValueChange={(next) =>
        onChange(next === ALL ? undefined : String(next))
      }
    >
      <TabsList aria-label={qualityCopy.scopeLabel}>
        <TabsTrigger value={ALL} className="px-3 text-[13px]">
          {tabs.length === 2
            ? qualityCopy.bothServices
            : qualityCopy.allServices}
        </TabsTrigger>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className="px-3 text-[13px]">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
