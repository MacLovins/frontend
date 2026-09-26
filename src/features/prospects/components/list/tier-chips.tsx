import type { Tier } from "@/api/generated/model"
import { TierSwatch } from "@/components/common/tier"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatNumber } from "@/lib/format"
import { tierChipLabels, tierOrder } from "@/lib/labels"
import { prospectsCopy } from "@/features/prospects/copy"
import type {
  TierCount,
  TierKey,
} from "@/features/prospects/hooks/use-tier-counts"

const ALL = "all"

function ChipCount({ count }: { count: TierCount }) {
  if (count.isPending) return <Skeleton className="h-[26px] w-10" />
  return (
    <span className="font-mono text-[22px] leading-[1.2] font-semibold">
      {count.isError || count.total === undefined
        ? "—"
        : formatNumber(count.total)}
    </span>
  )
}

/** Five counters that double as the tier filter. Counts are for the whole service and ignore other filters. */
export function TierChips({
  tier,
  counts,
  onChange,
}: {
  tier: Tier | null
  counts: Record<TierKey, TierCount>
  onChange: (tier: Tier | null) => void
}) {
  const items: { key: TierKey; label: string }[] = [
    { key: ALL, label: prospectsCopy.allTiers },
    ...tierOrder.map((key) => ({ key, label: tierChipLabels[key] })),
  ]
  return (
    <ToggleGroup
      aria-label={prospectsCopy.tierFilterLabel}
      value={[tier ?? ALL]}
      // Pressing the active chip again would empty the group; fall back to "All tiers" instead.
      onValueChange={(values) => {
        const next = tierOrder.find((key) => key === values[0]) ?? null
        if (next !== tier) onChange(next)
      }}
      spacing={3}
      className="flex-wrap not-data-[variant=outline]:bg-transparent not-data-[variant=outline]:p-0"
    >
      {items.map((item) => (
        <ToggleGroupItem
          key={item.key}
          value={item.key}
          className="m-px h-auto min-w-[132px] flex-col items-start justify-start gap-0.5 rounded-lg border border-border bg-white px-3.5 py-2.5 text-left text-black hover:border-faint hover:text-black data-pressed:m-0 data-pressed:border-2 data-pressed:border-black data-pressed:bg-white data-pressed:font-normal hover:data-pressed:border-black min-[1440px]:min-w-[150px]"
        >
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            {item.key === ALL ? null : <TierSwatch tier={item.key} />}
            {item.label}
          </span>
          <ChipCount count={counts[item.key]} />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
