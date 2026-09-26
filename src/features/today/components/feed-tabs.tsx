import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { feedFilters, feedTabLabels, type FeedFilter } from "../copy"
import { parseFilter } from "../lib/feed"

export function FeedTabs({
  value,
  onChange,
}: {
  value: FeedFilter
  onChange: (filter: FeedFilter) => void
}) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(parseFilter(String(next)))}
    >
      <TabsList aria-label="Filter">
        {/* The shared trigger's active shadow is emitted after shadow-none, so only `!` removes it (the mock has none). */}
        {feedFilters.map((filter) => (
          <TabsTrigger
            key={filter}
            value={filter}
            className="px-3 text-[13px] not-data-active:hover:bg-white/60 data-active:shadow-none!"
          >
            {feedTabLabels[filter]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
