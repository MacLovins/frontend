import {
  ArrowLineDownIcon,
  FlagIcon,
  ProhibitIcon,
  type Icon,
} from "@phosphor-icons/react"
import { cn } from "cn"

import { copy } from "@/features/settings/rules/copy"

const icons: Record<
  (typeof copy.tiles)[number]["key"],
  { icon: Icon; className: string }
> = {
  exclude: { icon: ProhibitIcon, className: "bg-subtle text-black" },
  cap: {
    icon: ArrowLineDownIcon,
    className: "bg-negative-surface text-negative-strong",
  },
  flag: {
    icon: FlagIcon,
    className: "bg-warning-surface text-warning-foreground",
  },
}

/** Exclude / Cap / Flag: what each action does to a lead. */
export function ExplainerTiles() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {copy.tiles.map((tile) => {
        const { icon: TileIcon, className } = icons[tile.key]
        return (
          <div
            key={tile.key}
            className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3.5"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md",
                className
              )}
            >
              <TileIcon aria-hidden weight="bold" className="size-[18px]" />
            </span>
            <div>
              <div className="text-sm font-bold">{tile.title}</div>
              <div className="text-[13px] leading-[1.4] text-muted-foreground">
                {tile.text}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
