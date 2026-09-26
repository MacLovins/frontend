import { useId } from "react"

import type { SignalItem } from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { hasNamePlaceholder } from "@/features/outreach/lib/draft"
import { sourceLabel } from "@/features/outreach/lib/signals"
import { formatDate } from "@/lib/format"

export function DraftEditor({
  subject,
  body,
  showSubject,
  onChange,
  edited,
  onReset,
  referenced,
  signalsById,
  serviceName,
}: {
  subject: string
  body: string
  showSubject: boolean
  onChange: (edit: { subject: string; body: string }) => void
  edited: boolean
  onReset: () => void
  referenced: string[]
  signalsById: Map<string, SignalItem>
  serviceName: string
}) {
  const subjectId = useId()

  return (
    <div className="flex flex-col gap-3.5 px-6 py-5">
      {showSubject ? (
        <div className="flex items-baseline gap-3 border-b border-subtle pb-3">
          <label
            htmlFor={subjectId}
            className="w-[60px] shrink-0 text-[13px] text-muted-foreground"
          >
            Subject
          </label>
          <Input
            id={subjectId}
            value={subject}
            onChange={(event) =>
              onChange({ subject: event.target.value, body })
            }
            className="h-auto rounded-none border-0 bg-transparent p-0 text-base font-semibold focus-visible:underline"
          />
        </div>
      ) : null}
      <Textarea
        aria-label="Draft"
        value={body}
        onChange={(event) => onChange({ subject, body: event.target.value })}
        className="min-h-[360px] resize-none rounded-none border-0 bg-transparent p-0 text-[15px] leading-[1.65]"
      />
      <section className="flex flex-col gap-1 border-t border-subtle pt-3 text-xs text-muted-foreground">
        <div className="flex items-baseline gap-2">
          <h3 className="m-0 text-xs font-semibold text-black">
            Sources behind each claim
          </h3>
          {edited ? (
            <span className="ml-auto">
              Edited ·{" "}
              <Button
                variant="link"
                className="text-xs text-muted-foreground"
                onClick={onReset}
              >
                Reset
              </Button>
            </span>
          ) : null}
        </div>
        <ol className="m-0 flex list-none flex-col gap-1 p-0">
          {referenced.map((id, index) => (
            <SourceLine
              key={`${index}:${id}`}
              number={index + 1}
              signal={signalsById.get(id)}
            />
          ))}
          {/* The prompt always includes the service's value proposition, so it backs claims too. */}
          <li>
            [{referenced.length + 1}] {serviceName} value proposition, set by
            the admin
          </li>
        </ol>
      </section>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0 text-xs">
        {referenced.length ? (
          <li className="rounded bg-positive-surface px-2 py-1 text-positive-strong">
            ✓ Grounded in {referenced.length} verified signal
            {referenced.length === 1 ? "" : "s"}
          </li>
        ) : (
          <li className="rounded bg-negative-surface px-2 py-1 text-negative-strong">
            ⚠ No evidence cited · check every claim before sending
          </li>
        )}
        {hasNamePlaceholder(body) ? (
          <li className="rounded bg-muted px-2 py-1 text-text-secondary">
            Replace [First name] before sending
          </li>
        ) : null}
      </ul>
    </div>
  )
}

/** A cited id may be gone (voted wrong since) or be a derived NIS2/DORA signal that the card does not list. */
function SourceLine({
  number,
  signal,
}: {
  number: number
  signal: SignalItem | undefined
}) {
  if (!signal) return <li>[{number}] Evidence no longer active</li>
  const parts = [
    sourceLabel(signal),
    signal.summary,
    signal.event_date ? formatDate(signal.event_date) : null,
  ]

  return (
    <li>
      [{number}] {parts.filter(Boolean).join(" · ")}
      {signal.url ? (
        <>
          {" · "}
          <a
            href={signal.url}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            open<span className="sr-only"> source {number}</span>{" "}
            <span aria-hidden="true">↗</span>
          </a>
        </>
      ) : null}
    </li>
  )
}
