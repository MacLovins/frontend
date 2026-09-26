import { format, isSameDay } from "date-fns"

import type {
  DomainEventOut,
  FeedbackCreatedEvent,
  LeadTierChangedEvent,
  RunFinishedEvent,
  SignalDetectedEvent,
  Tier,
} from "@/api/generated/model"

import { feedFilters, plural, type FeedFilter } from "../copy"
import { formatLastVisit } from "./format"

type Base = { id: string; createdAt: string }

export type FeedEntry =
  | (Base & { type: "signal"; event: SignalDetectedEvent })
  | (Base & { type: "tier"; event: LeadTierChangedEvent })
  | (Base & { type: "run"; event: RunFinishedEvent })
  /** `event` is the newest vote of the group, `count` the number of grouped votes. */
  | (Base & { type: "feedback"; event: FeedbackCreatedEvent; count: number })

const DAY_MS = 24 * 60 * 60_000

const sameVote = (a: FeedbackCreatedEvent, b: FeedbackCreatedEvent) =>
  a.payload.user_id === b.payload.user_id &&
  a.payload.service_id === b.payload.service_id &&
  a.payload.verdict === b.payload.verdict &&
  a.payload.target_type === b.payload.target_type &&
  isSameDay(new Date(a.created_at), new Date(b.created_at))

/**
 * Events arrive newest first. Consecutive votes of one person with the same verdict, target type and service on
 * the same day read as one item ("marked 3 signals as wrong"). Event types the UI does not know are skipped.
 */
export function buildFeed(events: DomainEventOut[]): FeedEntry[] {
  const feed: FeedEntry[] = []
  for (const event of events) {
    const base = { id: event.id, createdAt: event.created_at }
    switch (event.type) {
      case "signal.detected":
        feed.push({ ...base, type: "signal", event })
        break
      case "lead.tier_changed":
        feed.push({ ...base, type: "tier", event })
        break
      case "run.finished":
        feed.push({ ...base, type: "run", event })
        break
      case "feedback.created": {
        const previous = feed.at(-1)
        if (previous?.type === "feedback" && sameVote(previous.event, event))
          previous.count += 1
        else feed.push({ ...base, type: "feedback", event, count: 1 })
        break
      }
    }
  }
  return feed
}

const entryFilter: Record<FeedEntry["type"], Exclude<FeedFilter, "all">> = {
  signal: "signal",
  tier: "tier",
  run: "system",
  feedback: "system",
}

export function matchesFilter(entry: FeedEntry, filter: FeedFilter) {
  return filter === "all" || entryFilter[entry.type] === filter
}

export function parseFilter(value: string | null): FeedFilter {
  return feedFilters.find((filter) => filter === value) ?? "all"
}

const tierRank: Record<Tier, number> = {
  disqualified: 0,
  cold: 1,
  warm: 2,
  hot: 3,
}

export type TierMove = "up" | "down" | "neutral"

export function tierMove(before: Tier | null, after: Tier): TierMove {
  const from = before ? tierRank[before] : -1
  const to = tierRank[after]
  if (to < from) return "down"
  if (to > from && (after === "hot" || after === "warm")) return "up"
  return "neutral"
}

/**
 * "Friday, 26 September · 9 changes since your last visit (yesterday, 17:40)". Without a stored last visit the count
 * covers the last 24 hours, the same window the sidebar badge uses.
 */
export function feedSubtitle(
  now: number,
  lastVisit: number | null,
  feed: FeedEntry[] | undefined
) {
  const date = format(now, "EEEE, d MMMM")
  if (!feed) return date
  const since = lastVisit ?? now - DAY_MS
  const count = feed.filter(
    (entry) => Date.parse(entry.createdAt) > since
  ).length
  const noun = plural(count, "change", "changes")
  if (lastVisit === null)
    return `${date} · ${count ? `${count} recent ${noun}` : "No recent changes"}`
  return `${date} · ${count ? `${count} ${noun}` : "No changes"} since your last visit (${formatLastVisit(lastVisit, now)})`
}
