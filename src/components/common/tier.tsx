import { cn } from "cn"

import type { Tier } from "@/api/generated/model"
import { tierLabels } from "@/lib/labels"

const badgeColors: Record<Tier, string> = {
  hot: "bg-tier-hot text-black",
  warm: "bg-tier-warm text-black",
  cold: "bg-tier-cold-surface text-black",
  disqualified: "bg-tier-dq-surface text-tier-dq-foreground",
}

const swatchColors: Record<Tier, string> = {
  hot: "bg-tier-hot",
  warm: "bg-tier-warm",
  cold: "bg-tier-cold",
  disqualified: "bg-tier-dq",
}

const badgeSizes = {
  sm: "px-[7px] py-px text-xs",
  md: "px-2 py-0.5 text-xs",
  lg: "px-[9px] py-[3px] text-[13px]",
}

export function TierBadge({
  tier,
  size = "md",
  className,
}: {
  tier: Tier
  size?: keyof typeof badgeSizes
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded font-bold whitespace-nowrap",
        badgeColors[tier],
        badgeSizes[size],
        className,
      )}
    >
      {tierLabels[tier]}
    </span>
  )
}

/** Tier colour key: a 10 px square in chips, a 12 px dot in legends. */
export function TierSwatch({ tier, shape = "square" }: { tier: Tier; shape?: "square" | "dot" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block shrink-0",
        shape === "square" ? "size-2.5 rounded-[2px]" : "size-3 rounded-full",
        swatchColors[tier],
      )}
    />
  )
}
