import { useMemo, useState } from "react"
import { useSearchParams } from "react-router"

import { useListActivity } from "@/api/generated/activity/activity"
import type { UserOut } from "@/api/generated/model"
import { PageHeader } from "@/components/common/page-header"
import { useCurrentService } from "@/hooks/use-current-service"
import { useMe } from "@/hooks/use-session"

import type { FeedFilter } from "./copy"
import { CallListCard } from "./components/call-list-card"
import { FeedList } from "./components/feed-list"
import { FeedTabs } from "./components/feed-tabs"
import { MonitoringCard } from "./components/monitoring-card"
import { useFeedLookups } from "./hooks/use-feed-lookups"
import { useLastVisit } from "./hooks/use-last-visit"
import { buildFeed, feedSubtitle, matchesFilter, parseFilter } from "./lib/feed"

export function TodayPage() {
  const { data: me } = useMe()
  return me ? <Today me={me} /> : null
}

function Today({ me }: { me: UserOut }) {
  const lastVisit = useLastVisit(me.id)
  const [openedAt] = useState(() => Date.now())
  const [params, setParams] = useSearchParams()
  const filter = parseFilter(params.get("filter"))
  const { serviceId } = useCurrentService()

  // Same params as the sidebar badge, so both read one cached list. The backend has no cursor; 100 is its maximum.
  const activity = useListActivity(
    { limit: 100 },
    { query: { refetchInterval: 60_000 } }
  )
  const feed = useMemo(
    () => (activity.data ? buildFeed(activity.data) : undefined),
    [activity.data]
  )
  const lookups = useFeedLookups(me, feed ?? [])
  // Relative times follow the last refetch, so "Yesterday" stays right on a page left open overnight.
  const now = Math.max(openedAt, activity.dataUpdatedAt)

  const setFilter = (next: FeedFilter) => {
    setParams(
      (current) => {
        const search = new URLSearchParams(current)
        if (next === "all") search.delete("filter")
        else search.set("filter", next)
        return search
      },
      { replace: true }
    )
  }

  const subtitle = feedSubtitle(now, lastVisit, feed)

  return (
    <>
      <PageHeader
        title="Today"
        className="sticky top-0 z-10"
        actions={<FeedTabs value={filter} onChange={setFilter} />}
      >
        {/* PageHeader's own subtitle slot cannot shrink; this one truncates so the header stays one line at 1280 px. */}
        <span
          title={subtitle}
          className="min-w-0 flex-1 truncate text-sm text-muted-foreground"
        >
          {subtitle}
        </span>
      </PageHeader>
      <div className="flex items-start gap-6 px-8 py-6">
        <section
          aria-label="Changes"
          className="flex max-w-[760px] min-w-0 flex-[1_1_760px] flex-col gap-2.5"
        >
          <FeedList
            entries={feed?.filter((entry) => matchesFilter(entry, filter))}
            filter={filter}
            error={activity.error}
            onRetry={() => void activity.refetch()}
            now={now}
            lookups={lookups}
            serviceId={serviceId}
          />
        </section>
        <aside className="flex w-[344px] shrink-0 grow flex-col gap-4">
          <CallListCard />
          <MonitoringCard now={now} serviceId={serviceId} />
        </aside>
      </div>
    </>
  )
}
