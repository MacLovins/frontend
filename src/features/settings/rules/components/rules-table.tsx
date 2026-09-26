import type { ReactNode } from "react"
import { cn } from "cn"
import { Link } from "react-router"

import type {
  DisqualificationRuleOut,
  LeadListItem,
} from "@/api/generated/model"
import { Skeleton } from "@/components/ui/skeleton"
import { ActiveSwitch } from "@/features/settings/rules/components/active-switch"
import { copy } from "@/features/settings/rules/copy"
import { affectsNow } from "@/features/settings/rules/lib/describe"
import { describeAction } from "@/features/settings/questions/lib/describe-rule"

const grid =
  "grid grid-cols-[36px_minmax(0,1fr)_150px_120px_150px_80px] items-center px-4"

export function RulesTableCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div
        role="presentation"
        className={cn(
          grid,
          "h-10 border-b border-border bg-muted text-xs font-semibold text-muted-foreground"
        )}
      >
        {copy.table.heads.map((head) => (
          <span key={head}>{head}</span>
        ))}
      </div>
      {children}
    </div>
  )
}

function RuleRow({
  rule,
  index,
  sentence,
  selected,
  leads,
  toggling,
  onToggle,
}: {
  rule: DisqualificationRuleOut
  index: number
  sentence: string
  selected: boolean
  /** undefined while loading; null when the leads could not be read. */
  leads: LeadListItem[] | null | undefined
  toggling: boolean
  onToggle: (active: boolean) => void
}) {
  return (
    <div
      className={cn(
        grid,
        "relative min-h-[60px] border-b border-subtle py-1.5 text-[13px] last:border-b-0",
        selected ? "bg-primary-surface-subtle" : "hover:bg-canvas"
      )}
    >
      <span className="font-mono text-muted-foreground">{index}</span>
      <span className="min-w-0">
        {/* The name link covers the whole row, so a click anywhere (or Enter on the link) opens the editor. */}
        <Link
          to={`?rule=${rule.id}`}
          replace
          preventScrollReset
          aria-current={selected || undefined}
          className="block truncate text-sm font-semibold text-black no-underline outline-none after:absolute after:inset-0 hover:text-black focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-black"
        >
          {rule.name}
        </Link>
        <span className="block truncate text-muted-foreground" title={sentence}>
          {sentence}
        </span>
      </span>
      <span>{copy.table.basedOn[rule.kind]}</span>
      <span className="font-semibold">{describeAction(rule)}</span>
      <span className="truncate">
        {leads === undefined && rule.is_active ? (
          <Skeleton className="h-4 w-24" />
        ) : (
          affectsNow(rule, leads ?? [])
        )}
      </span>
      <span className="relative z-10 flex">
        <ActiveSwitch
          checked={rule.is_active}
          disabled={toggling}
          onCheckedChange={onToggle}
          aria-label={copy.table.toggle(rule.name)}
        />
      </span>
    </div>
  )
}

export function RulesTable({
  rules,
  selectedId,
  describe,
  leads,
  togglingId,
  onToggle,
}: {
  rules: DisqualificationRuleOut[]
  selectedId: string | null
  describe: (rule: DisqualificationRuleOut) => string
  leads: LeadListItem[] | null | undefined
  togglingId: string | undefined
  onToggle: (rule: DisqualificationRuleOut, active: boolean) => void
}) {
  return (
    <RulesTableCard>
      {rules.map((rule, index) => (
        <RuleRow
          key={rule.id}
          rule={rule}
          index={index + 1}
          sentence={describe(rule)}
          selected={rule.id === selectedId}
          leads={leads}
          toggling={togglingId === rule.id}
          onToggle={(active) => onToggle(rule, active)}
        />
      ))}
    </RulesTableCard>
  )
}

export function RulesTableSkeleton() {
  return (
    <RulesTableCard>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className={cn(
            grid,
            "min-h-[60px] border-b border-subtle py-1.5 last:border-b-0"
          )}
        >
          <Skeleton className="h-4 w-3" />
          <span className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-3.5 w-40" />
          </span>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-[22px] w-10 rounded-full" />
        </div>
      ))}
    </RulesTableCard>
  )
}
