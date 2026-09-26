import { cn } from "cn"

import { Badge } from "@/components/ui/badge"

import { copy } from "@/features/settings/services/copy"

/** Active (green) or Draft (yellow) — the design's 12 px service status pill. */
export function StatusPill({ active, className }: { active: boolean; className?: string }) {
  return (
    <Badge
      size="md"
      variant={active ? "success" : "default"}
      className={cn("rounded font-semibold", !active && "bg-warning text-black", className)}
    >
      {active ? copy.card.active : copy.card.draft}
    </Badge>
  )
}
