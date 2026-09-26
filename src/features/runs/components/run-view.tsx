import { useMemo, useState } from "react"

import { useListServices } from "@/api/generated/config/config"
import type { RunOut } from "@/api/generated/model"
import { useCurrentService } from "@/hooks/use-current-service"
import { isRunActive, type useRunEvents } from "@/hooks/use-run-events"
import { useMe } from "@/hooks/use-session"

import { copy } from "../copy"
import { useRunCompanies } from "../hooks/use-run-companies"
import { useRunFinishedToast } from "../hooks/use-run-finished-toast"
import { runSubtitle, shortId } from "../lib/run-format"
import { streamedStatus } from "../lib/run-status"
import { CompanyList } from "./company-list"
import { EventLog } from "./event-log"
import { LiveIndicator } from "./live-indicator"
import { RecentRunsCard } from "./recent-runs-card"
import { RunActions } from "./run-actions"
import { RunBody } from "./run-body"
import { RunHeader } from "./run-header"
import { RunProgressCard } from "./run-progress-card"
import { StartAnalysisDialog } from "./start-analysis-dialog"
import { StepGlossaryCard } from "./step-glossary-card"

/** Company cards are drawn 50 at a time, which keeps the per-company name lookups bounded. */
const PAGE = 50

type RunEvents = ReturnType<typeof useRunEvents>

export function RunView({
  run: fetched,
  events,
}: {
  run: RunOut
  events: RunEvents
}) {
  const status = streamedStatus(fetched.status, events.log, events.transport)
  const run = status === fetched.status ? fetched : { ...fetched, status }
  const { serviceId } = useCurrentService()
  const services = useListServices({ query: { staleTime: 5 * 60_000 } })
  const isAdmin = useMe().data?.role === "admin"
  const [shown, setShown] = useState(PAGE)
  const [starting, setStarting] = useState(false)
  useRunFinishedToast(run, events.transport)

  const ids = useMemo(
    () => [...new Set(run.params.company_ids)],
    [run.params.company_ids]
  )
  const visible = ids.slice(0, shown)
  const names = useRunCompanies(visible)

  return (
    <div className="flex flex-col">
      <RunHeader
        title={
          <>
            {copy.run} <span className="font-mono">{shortId(run.id)}</span>
          </>
        }
        subtitle={runSubtitle(run, services.data ?? [])}
        status={
          <LiveIndicator status={run.status} transport={events.transport} />
        }
        actions={<RunActions run={run} reconnect={events.reconnect} />}
      />
      <RunBody
        main={
          <>
            <RunProgressCard
              progress={run.progress}
              active={isRunActive(run.status)}
            />
            <CompanyList
              run={run}
              visible={visible}
              hidden={Math.min(PAGE, ids.length - visible.length)}
              onShowMore={() => setShown((count) => count + PAGE)}
              names={names}
              companies={events.companies}
              log={events.log}
              services={services.data ?? []}
              serviceId={serviceId}
            />
          </>
        }
        aside={
          <>
            <StepGlossaryCard />
            <RecentRunsCard
              currentId={run.id}
              serviceId={serviceId}
              onStart={() => setStarting(true)}
            />
            {isAdmin ? (
              <EventLog
                log={events.log}
                domainOf={(companyId) => names.companies.get(companyId)?.domain}
              />
            ) : null}
          </>
        }
      />
      <StartAnalysisDialog open={starting} onOpenChange={setStarting} />
    </div>
  )
}
