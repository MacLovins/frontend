import { Link } from "react-router"
import { cn } from "cn"

import { EmptyState, ErrorState } from "@/components/common/states"
import { buttonVariants } from "@/components/ui/button"
import { withService } from "@/hooks/use-current-service"

import { emptyFeedTitles, type FeedFilter } from "../copy"
import type { FeedLookups } from "../hooks/use-feed-lookups"
import type { FeedEntry } from "../lib/feed"
import { FeedEntryItem } from "./feed-entries"
import { FeedItemSkeleton } from "./feed-item"

const panel = "rounded-lg border border-border bg-card"

export function FeedList({
  entries,
  filter,
  error,
  onRetry,
  now,
  lookups,
  serviceId,
}: {
  /** undefined while the first load is pending. */
  entries: FeedEntry[] | undefined
  filter: FeedFilter
  error: unknown
  onRetry: () => void
  now: number
  lookups: FeedLookups
  serviceId: string | undefined
}) {
  if (!entries && error) {
    return (
      <ErrorState
        className={panel}
        title="Could not load the activity feed."
        error={error}
        onRetry={onRetry}
      />
    )
  }
  if (!entries) {
    return Array.from({ length: 6 }, (_, index) => (
      <FeedItemSkeleton key={index} />
    ))
  }
  if (entries.length === 0) {
    return filter === "all" ? (
      <EmptyState
        className={panel}
        title={emptyFeedTitles.all}
        actions={
          <Link
            to={withService("/accounts", serviceId)}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Go to accounts
          </Link>
        }
      >
        New signals, tier changes and finished runs show up here after an
        analysis.
      </EmptyState>
    ) : (
      <EmptyState className={panel} title={emptyFeedTitles[filter]} />
    )
  }
  return entries.map((entry) => (
    <FeedEntryItem
      key={entry.id}
      entry={entry}
      now={now}
      lookups={lookups}
      serviceId={serviceId}
    />
  ))
}
