import {
  ArrowsClockwiseIcon,
  CheckIcon,
  ProhibitIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react"

import type {
  FeedbackCreatedEvent,
  FeedbackCreatedPayload,
  RunFinishedEvent,
} from "@/api/generated/model"
import { withService } from "@/hooks/use-current-service"

import { plural, runKindPrefix, runOutcome, verdictText } from "../copy"
import type { FeedLookups } from "../hooks/use-feed-lookups"
import { formatWhen } from "../lib/format"
import { ActionLink, EventIcon, FeedItem } from "./feed-item"

function runServices(serviceIds: string[], lookups: FeedLookups) {
  if (serviceIds.length === 0)
    return lookups.activeServiceCount === 2 ? "Both services" : "All services"
  if (serviceIds.length === 1) return lookups.serviceName(serviceIds[0])
  return `${serviceIds.length} services`
}

export function RunItem({
  event,
  now,
  lookups,
  serviceId,
}: {
  event: RunFinishedEvent
  now: number
  lookups: FeedLookups
  serviceId: string | undefined
}) {
  const { run_id: runId, status, progress } = event.payload
  // The event has no run kind or services; both come from the recent runs list when the run is still in it.
  const run = lookups.runs.get(runId)
  const prefix = (run && runKindPrefix[run.kind]) ?? "Run"

  return (
    <FeedItem
      icon={<EventIcon icon={ArrowsClockwiseIcon} tone="neutral" />}
      kind={`${prefix} ${runOutcome[status]}`}
      service={run ? runServices(run.params.service_ids, lookups) : undefined}
      when={formatWhen(event.created_at, now)}
      createdAt={event.created_at}
      actions={
        <ActionLink to={withService(`/runs/${runId}`, serviceId)}>
          View run
        </ActionLink>
      }
    >
      <strong>
        {progress.total} {plural(progress.total, "account", "accounts")}
      </strong>{" "}
      checked: {progress.done} done, {progress.failed} failed, {progress.paused}{" "}
      paused.
    </FeedItem>
  )
}

const verdictIcons: Record<FeedbackCreatedPayload["verdict"], Icon> = {
  correct: CheckIcon,
  incorrect: XIcon,
  irrelevant: ProhibitIcon,
  good_fit: ThumbsUpIcon,
  bad_fit: ThumbsDownIcon,
}

export function FeedbackItem({
  event,
  count,
  now,
  lookups,
}: {
  event: FeedbackCreatedEvent
  count: number
  now: number
  lookups: FeedLookups
}) {
  const payload = event.payload
  const verdict = verdictText[payload.verdict]
  const text =
    payload.target_type === "lead"
      ? count === 1
        ? `marked a lead as ${verdict}.`
        : `marked ${count} leads as ${verdict}.`
      : `marked ${count} ${plural(count, "signal", "signals")} as ${verdict}.`

  return (
    <FeedItem
      icon={<EventIcon icon={verdictIcons[payload.verdict]} tone="neutral" />}
      kind="Feedback"
      service={lookups.serviceName(payload.service_id)}
      when={formatWhen(event.created_at, now)}
      createdAt={event.created_at}
      actions={
        <ActionLink to={withService("/quality", payload.service_id)}>
          Quality
        </ActionLink>
      }
    >
      <strong>{lookups.actorName(payload.user_id)}</strong> {text}
    </FeedItem>
  )
}
