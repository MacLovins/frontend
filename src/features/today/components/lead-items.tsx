import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  PlusIcon,
  WarningIcon,
  type Icon,
} from "@phosphor-icons/react"

import type {
  LeadTierChangedEvent,
  SignalDetectedEvent,
} from "@/api/generated/model"
import { withService } from "@/hooks/use-current-service"
import { useLabels } from "@/hooks/use-labels"
import { score } from "@/lib/format"
import { tierLabels } from "@/lib/labels"

import { tierMove, type TierMove } from "../lib/feed"
import { formatWhen } from "../lib/format"
import {
  ActionLink,
  CompanyName,
  EventIcon,
  EvidenceQuote,
  FeedItem,
  type EventTone,
} from "./feed-item"

const companyPath = (companyId: string, serviceId: string) =>
  withService(`/companies/${companyId}`, serviceId)
const outreachPath = (companyId: string, serviceId: string) =>
  withService(`/companies/${companyId}/outreach`, serviceId)

function DraftAndOpen({
  companyId,
  company,
  serviceId,
  canDraft,
}: {
  companyId: string
  company: string
  serviceId: string
  canDraft: boolean
}) {
  return (
    <>
      {canDraft ? (
        <ActionLink
          to={outreachPath(companyId, serviceId)}
          label={`Draft outreach to ${company}`}
          primary
        >
          Draft
        </ActionLink>
      ) : null}
      <ActionLink
        to={companyPath(companyId, serviceId)}
        label={`Open ${company}`}
      >
        Open
      </ActionLink>
    </>
  )
}

const tierIcons: Record<TierMove, { icon: Icon; tone: EventTone }> = {
  up: { icon: ArrowUpIcon, tone: "primary" },
  down: { icon: ArrowDownIcon, tone: "negative" },
  neutral: { icon: PlusIcon, tone: "neutral" },
}

export function TierChangeItem({
  event,
  now,
}: {
  event: LeadTierChangedEvent
  now: number
}) {
  const payload = event.payload
  const move = tierMove(payload.tier_before, payload.tier_after)
  const tier = tierLabels[payload.tier_after]
  const priority = score(payload.priority)
  const text = payload.disqualified
    ? "is now Disqualified."
    : move === "down"
      ? `dropped to ${tier} (${priority}).`
      : `is now ${tier} (${priority}).`
  // The payload has no rule hits or causing signals; the first "why now" reason is the honest explanation.
  const reason = payload.why_now.at(0)

  return (
    <FeedItem
      icon={<EventIcon {...tierIcons[move]} />}
      kind={
        payload.tier_before
          ? `${tierLabels[payload.tier_before]} → ${tier}`
          : `New lead · ${tier}`
      }
      service={payload.service_name}
      when={formatWhen(event.created_at, now)}
      createdAt={event.created_at}
      evidence={
        reason ? (
          <EvidenceQuote
            variant="reason"
            text={reason.text}
            source={reason.source_name}
            url={reason.url}
          />
        ) : null
      }
      actions={
        <DraftAndOpen
          companyId={payload.company_id}
          company={payload.company_name}
          serviceId={payload.service_id}
          canDraft={
            !payload.disqualified &&
            (payload.tier_after === "hot" || payload.tier_after === "warm")
          }
        />
      }
    >
      <CompanyName
        name={payload.company_name}
        to={companyPath(payload.company_id, payload.service_id)}
      />{" "}
      {text}
    </FeedItem>
  )
}

export function SignalItem({
  event,
  now,
}: {
  event: SignalDetectedEvent
  now: number
}) {
  const label = useLabels()
  const payload = event.payload
  const positive = payload.polarity === "positive"

  return (
    <FeedItem
      icon={
        <EventIcon
          icon={positive ? CheckIcon : WarningIcon}
          tone={positive ? "positive" : "negative"}
        />
      }
      kind={`New signal · ${label("categories", payload.category)}`}
      service={payload.service_name}
      when={formatWhen(event.created_at, now)}
      createdAt={event.created_at}
      evidence={
        payload.quote ? (
          <EvidenceQuote
            text={payload.quote}
            source={payload.source_name}
            url={payload.url}
          />
        ) : null
      }
      actions={
        <DraftAndOpen
          companyId={payload.company_id}
          company={payload.company_name}
          serviceId={payload.service_id}
          canDraft={positive}
        />
      }
    >
      {/* The summary is a full sentence that may start with the company name, so it is not glued to it. */}
      <CompanyName
        name={payload.company_name}
        to={companyPath(payload.company_id, payload.service_id)}
      />{" "}
      — {payload.summary}
    </FeedItem>
  )
}
