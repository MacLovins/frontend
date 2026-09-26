import type { FeedLookups } from "../hooks/use-feed-lookups"
import type { FeedEntry } from "../lib/feed"
import { SignalItem, TierChangeItem } from "./lead-items"
import { FeedbackItem, RunItem } from "./system-items"

export function FeedEntryItem({
  entry,
  now,
  lookups,
  serviceId,
}: {
  entry: FeedEntry
  now: number
  lookups: FeedLookups
  serviceId: string | undefined
}) {
  switch (entry.type) {
    case "tier":
      return <TierChangeItem event={entry.event} now={now} />
    case "signal":
      return <SignalItem event={entry.event} now={now} />
    case "run":
      return (
        <RunItem
          event={entry.event}
          now={now}
          lookups={lookups}
          serviceId={serviceId}
        />
      )
    case "feedback":
      return (
        <FeedbackItem
          event={entry.event}
          count={entry.count}
          now={now}
          lookups={lookups}
        />
      )
  }
}
