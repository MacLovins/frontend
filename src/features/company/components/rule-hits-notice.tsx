import {
  ArrowLineDownIcon,
  FlagIcon,
  ProhibitIcon,
  WarningIcon,
  type Icon,
} from "@phosphor-icons/react"

import type { RuleHit } from "@/api/generated/model"

type Notice = { order: number; icon: Icon; iconClass: string; text: string }

function describe(hit: RuleHit): Notice {
  if (hit.action === "exclude") {
    return {
      order: 0,
      icon: ProhibitIcon,
      iconClass: "text-muted-foreground",
      text: `Disqualified by rule “${hit.name}”. Priority is set to 0.`,
    }
  }
  if (hit.action === "cap") {
    return {
      order: 1,
      icon: ArrowLineDownIcon,
      iconClass: "text-negative-strong",
      text: `Priority capped at ${hit.cap_value ?? "a lower value"} by rule “${hit.name}”.`,
    }
  }
  // ICP must-have misses already read "Outside ICP: …".
  if (hit.kind === "icp")
    return {
      order: 2,
      icon: WarningIcon,
      iconClass: "text-negative-strong",
      text: hit.name,
    }
  return {
    order: 3,
    icon: FlagIcon,
    iconClass: "text-muted-foreground",
    text: `Flagged: ${hit.name}`,
  }
}

/** Rules that fired on this lead: exclusions, caps, ICP misses, then plain flags. */
export function RuleHitsNotice({ hits }: { hits: RuleHit[] }) {
  if (!hits.length) return null
  const notices = hits
    .map((hit) => ({ hit, ...describe(hit) }))
    .sort((a, b) => a.order - b.order)
  return (
    <div className="flex flex-col gap-2">
      {notices.map(({ hit, icon: NoticeIcon, iconClass, text }) => (
        <div
          key={`${hit.rule_id}-${hit.name}`}
          className="flex items-center gap-2.5 rounded-md border border-border bg-card px-3.5 py-2.5 text-[13px] text-text-secondary"
        >
          <NoticeIcon
            className={`size-4 shrink-0 ${iconClass}`}
            aria-hidden="true"
          />
          {text}
        </div>
      ))}
    </div>
  )
}
