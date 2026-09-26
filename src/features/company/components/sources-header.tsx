import type { ReactNode } from "react"

import type { LeadDetail, SourceType } from "@/api/generated/model"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLabels } from "@/hooks/use-labels"

import { sourceTypeTabOrder, sourceTypeTabs } from "../lib/copy"
import { sumOfSources } from "../lib/lead-card"
import { plural, relativeShort } from "../lib/text"
import { CompanyCrumbs } from "./company-crumbs"

const ALL = "all"

function Frame({ children }: { children: ReactNode }) {
  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-card pt-5 pr-20 pl-8">
      {children}
    </header>
  )
}

/** Tabs for the source types that have documents, in a fixed order; unknown types go last. */
function typeTabs(summary: LeadDetail["sources_summary"]) {
  const present = Object.keys(summary).filter((type) => summary[type] > 0)
  const known = sourceTypeTabOrder.filter((type) => present.includes(type))
  const unknown = present.filter(
    (type) => !(sourceTypeTabOrder as string[]).includes(type)
  )
  return [...known, ...unknown]
}

export function SourcesHeader({
  detail,
  serviceId,
  type,
  onType,
}: {
  detail: LeadDetail
  serviceId: string | undefined
  type: string | undefined
  onType: (type: string | undefined) => void
}) {
  const label = useLabels()
  const { company, sources_summary: summary } = detail
  const total = sumOfSources(summary)
  const analyzed = company.last_analyzed_at
    ? `last analyzed ${relativeShort(company.last_analyzed_at)}`
    : "not analyzed yet"
  const tabLabel = (key: string) =>
    key in sourceTypeTabs
      ? sourceTypeTabs[key as SourceType]
      : label("source_types", key)

  return (
    <Frame>
      <CompanyCrumbs
        serviceId={serviceId}
        trail={[
          { label: company.name, to: `/companies/${company.id}` },
          { label: "Sources" },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0 text-2xl font-bold tracking-[-0.01em]">
          What LeadRadar read about {company.name}
        </h1>
        <span className="ml-auto text-[13px] text-muted-foreground">
          {plural(total, "document")} · {analyzed}
        </span>
      </div>
      <Tabs
        value={type ?? ALL}
        onValueChange={(value) =>
          onType(value === ALL ? undefined : String(value))
        }
        className="gap-0"
      >
        <TabsList variant="line" aria-label="Type" className="flex-wrap">
          <TabsTrigger value={ALL}>All {total}</TabsTrigger>
          {typeTabs(summary).map((key) => (
            <TabsTrigger key={key} value={key}>
              {tabLabel(key)} {summary[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </Frame>
  )
}

export function SourcesHeaderSkeleton() {
  return (
    <Frame>
      <CompanyCrumbs
        serviceId={undefined}
        trail={[null, { label: "Sources" }]}
      />
      <Skeleton className="h-8 w-96" />
      <div className="flex gap-1">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-11 w-28 rounded-none" />
        ))}
      </div>
    </Frame>
  )
}
