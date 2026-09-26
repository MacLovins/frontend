import { CheckIcon } from "@phosphor-icons/react"
import { cn } from "cn"

import type { SignalItem } from "@/api/generated/model"
import { SideCard } from "@/features/outreach/components/outreach-layout"
import { sourceLabel } from "@/features/outreach/lib/signals"
import { formatDate } from "@/lib/format"

/**
 * Read-only: the API takes no evidence selection, the worker always writes from the top 5 signals by
 * confidence (backend outreach/service.py:121-137). Rows show which of them the current draft cites.
 */
export function EvidenceCard({
  evidence,
  cited,
  blockers,
}: {
  evidence: SignalItem[]
  cited: string[]
  blockers: string[]
}) {
  return (
    <SideCard title="Evidence to use">
      {evidence.length ? (
        <>
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {evidence.map((signal) => {
              const index = cited.indexOf(signal.id)
              return (
                <EvidenceRow
                  key={signal.id}
                  signal={signal}
                  citation={index >= 0 ? index + 1 : null}
                />
              )
            })}
          </ul>
          <p className="m-0 text-xs leading-[1.4] text-muted-foreground">
            The draft uses the strongest evidence for this service. Mark wrong
            signals on the company page to keep them out.
          </p>
        </>
      ) : (
        <p className="m-0 text-[13px] leading-[1.4] text-muted-foreground">
          No verified evidence yet. The draft will be generic; re-analyze the
          company first.
        </p>
      )}
      {blockers.length ? (
        // The prompt carries no blocker instruction (ai/outreach/generator.py), so this advises the seller instead.
        <p className="m-0 rounded-sm bg-negative-surface px-3 py-2.5 text-xs leading-[1.45] text-negative-foreground">
          <strong>Blocker to keep in mind:</strong> {blockers.join(", ")}.
          Position your offer next to it, not against it.
        </p>
      ) : null}
    </SideCard>
  )
}

function EvidenceRow({
  signal,
  citation,
}: {
  signal: SignalItem
  citation: number | null
}) {
  const meta = [
    sourceLabel(signal),
    signal.event_date ? formatDate(signal.event_date) : null,
  ].filter(Boolean)

  return (
    <li className="flex gap-2.5 text-[13px] leading-[1.4]">
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-[3px]",
          citation ? "bg-primary text-white" : "border border-input bg-card"
        )}
      >
        {citation ? <CheckIcon weight="bold" className="size-3" /> : null}
      </span>
      <span className="min-w-0">
        {citation ? <strong>[{citation}] </strong> : null}
        {signal.summary}
        <span className="block text-muted-foreground">{meta.join(" · ")}</span>
      </span>
    </li>
  )
}
