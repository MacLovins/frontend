import { useState, type ReactNode } from "react"

import type { DiscoverySearchIn, ServiceOut } from "@/api/generated/model"
import { EmptyState } from "@/components/common/states"

import { analysedFor, copy } from "../copy"
import { useAddAndAnalyze } from "../hooks/use-add-and-analyze"
import { useCatalog } from "../hooks/use-catalog"
import { useDiscoverySearch } from "../hooks/use-discovery-search"
import { CandidatesTable, CandidatesTableSkeleton } from "./candidates-table"
import { SearchError } from "./search-error"
import { SearchPanel } from "./search-panel"
import { SelectionBar } from "./selection-bar"

const LIMIT = 50

const dashedBox = "rounded-lg border border-dashed border-input bg-card p-10"

function Summary({ children }: { children: ReactNode }) {
  return (
    <div aria-live="polite" className="flex min-h-5 items-center gap-3 text-sm">
      {children}
    </div>
  )
}

/** Search panel and results for one service; the page remounts it when the service changes (fresh form, no results). */
export function DiscoveryWorkspace({
  serviceId,
  services,
}: {
  serviceId: string
  services: ServiceOut[]
}) {
  const search = useDiscoverySearch()
  const add = useAddAndAnalyze(serviceId)
  const { industryLabel } = useCatalog()
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const runSearch = (body: DiscoverySearchIn) => {
    setSelected(new Set())
    search.mutate(body)
  }

  const candidates = search.data?.items ?? []
  const picked = candidates.filter(
    (candidate) => !candidate.already_tracked && selected.has(candidate.domain)
  )
  const trackedCount = candidates.filter(
    (candidate) => candidate.already_tracked
  ).length
  const canSelect = candidates.length > trackedCount
  const activeNames = services
    .filter((service) => service.is_active)
    .map((service) => service.name)

  return (
    <div className="flex items-start gap-5 px-8 py-5">
      <SearchPanel
        serviceId={serviceId}
        services={services}
        searching={search.isPending}
        onSearch={(query) =>
          runSearch({ service_id: serviceId, limit: LIMIT, ...query })
        }
      />
      <section className="flex min-w-0 flex-1 flex-col gap-3">
        {search.isIdle ? (
          <EmptyState title={copy.results.intro.title} className={dashedBox}>
            {copy.results.intro.body}
          </EmptyState>
        ) : search.isPending ? (
          <>
            <Summary>
              <span className="text-muted-foreground">
                {copy.results.searching}
              </span>
            </Summary>
            <CandidatesTableSkeleton />
          </>
        ) : search.isError ? (
          <SearchError
            error={search.error}
            onRetry={() => runSearch(search.variables)}
          />
        ) : candidates.length === 0 ? (
          <EmptyState title={copy.results.empty.title} className={dashedBox}>
            {copy.results.empty.body}
          </EmptyState>
        ) : (
          <>
            <Summary>
              <strong>{copy.results.candidates(search.data.total)}</strong>
              <span className="text-muted-foreground">
                {copy.results.sorted(trackedCount)}
              </span>
            </Summary>
            <CandidatesTable
              candidates={candidates}
              industryLabel={industryLabel}
              selected={selected}
              onSelectedChange={setSelected}
            />
            {canSelect ? (
              <SelectionBar
                count={picked.length}
                note={copy.selection.note(analysedFor(activeNames))}
                pending={add.isPending}
                progress={{
                  done: add.added,
                  total: add.variables?.length ?? picked.length,
                }}
                onAdd={() => add.mutate(picked)}
              />
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
