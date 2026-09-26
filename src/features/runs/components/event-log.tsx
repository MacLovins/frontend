import { useEffect, useRef } from "react"

import type { RunEvent } from "@/api/run-events"
import type { RunLogEntry } from "@/hooks/use-run-events"

import { copy } from "../copy"
import { shortId } from "../lib/run-format"

const VISIBLE_LINES = 50

function formatLine(
  event: RunEvent,
  domainOf: (companyId: string) => string | undefined
) {
  const id = event.id === null ? "" : `id=${event.id} `
  switch (event.event) {
    case "run.progress": {
      const { done, total, paused } = event.data
      return `${id}run.progress done=${done} total=${total} paused=${paused}`
    }
    case "run.finished":
      return `${id}run.finished ${event.data.status}`
    case "company.stage":
    case "company.done": {
      const { company_id: companyId, status } = event.data
      const where = domainOf(companyId) ?? shortId(companyId)
      const stage =
        event.event === "company.stage" ? `${event.data.stage} ` : ""
      return `${id}${event.event} ${where} ${stage}${status}`
    }
  }
}

/** Raw SSE events for admins, newest at the bottom; follows new lines unless the reader scrolled up. */
export function EventLog({
  log,
  domainOf,
}: {
  log: RunLogEntry[]
  domainOf: (companyId: string) => string | undefined
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const following = useRef(true)

  useEffect(() => {
    const element = scroller.current
    if (element && following.current) element.scrollTop = element.scrollHeight
  }, [log])

  return (
    <section
      aria-label="Event stream"
      className="flex flex-col gap-1 rounded-lg bg-console px-4 py-3.5 font-mono text-2xs leading-[1.5] text-border"
    >
      <div className="text-faint">{copy.eventLogTitle}</div>
      <div
        ref={scroller}
        onScroll={(event) => {
          const element = event.currentTarget
          following.current =
            element.scrollHeight - element.scrollTop - element.clientHeight < 8
        }}
        className="flex max-h-[220px] flex-col gap-1 overflow-y-auto break-all"
      >
        {log.slice(-VISIBLE_LINES).map((entry) => (
          <div key={entry.key}>{formatLine(entry.event, domainOf)}</div>
        ))}
      </div>
    </section>
  )
}
