import type { KeyboardEvent, MouseEvent, ReactNode } from "react"
import { Link } from "react-router"
import { cn } from "cn"

import type { PresetOut, ServiceOut } from "@/api/generated/model"
import { formatNumber } from "@/lib/format"

import { copy, countLabel } from "@/features/settings/services/copy"
import {
  type Loadable,
  useServiceStats,
} from "@/features/settings/services/hooks/use-service-stats"
import { icpSummary } from "@/features/settings/services/lib/service-summary"
import { StatusPill } from "@/features/settings/services/components/status-pill"

// Inner links navigate on their own; the card's click would also switch `?service=`.
const stop = (event: MouseEvent) => event.stopPropagation()

function Stat<T>({
  value,
  render,
  skeletonWidth = "w-24",
}: {
  value: Loadable<T>
  render: (value: T) => ReactNode
  skeletonWidth?: string
}) {
  if (value.status === "loading") {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-block h-3.5 animate-pulse rounded-sm bg-subtle align-middle",
          skeletonWidth
        )}
      />
    )
  }
  if (value.status === "error")
    return (
      <span className="text-muted-foreground">{copy.card.unavailable}</span>
    )
  return render(value.value)
}

function CardLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      onClick={stop}
      className="min-w-0 truncate text-black underline underline-offset-2 hover:text-link-hover"
    >
      {children}
    </Link>
  )
}

export function ServiceCard({
  service,
  preset,
  selected,
  onSelect,
}: {
  service: ServiceOut
  preset: PresetOut | undefined
  selected: boolean
  onSelect: () => void
}) {
  const stats = useServiceStats(service.id, preset)
  const base = `/settings/${service.id}`
  const hasQuestions =
    stats.questions.status === "ready" && stats.questions.value.total > 0
  const notScored = stats.scored.status === "ready" && stats.scored.value === 0

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.target !== event.currentTarget ||
      (event.key !== "Enter" && event.key !== " ")
    )
      return
    event.preventDefault()
    onSelect()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={selected ? "true" : undefined}
      aria-label={`${service.name}, ${service.is_active ? copy.card.active : copy.card.draft}`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "flex min-w-0 cursor-pointer flex-col gap-2.5 rounded-lg bg-card p-[18px] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
        selected
          ? "border-2 border-black p-[17px]"
          : service.is_active
            ? "border border-border"
            : "border border-dashed border-faint"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 truncate text-[17px] font-bold">
          {service.name}
        </span>
        <StatusPill active={service.is_active} className="ml-auto" />
      </div>
      {service.description ? (
        <p className="m-0 line-clamp-2 text-[13px] leading-[1.45] text-text-secondary">
          {service.description}
        </p>
      ) : null}

      {service.is_active || hasQuestions ? (
        <div className="grid grid-cols-2 gap-1.5 text-[13px]">
          <Stat
            value={stats.questions}
            render={({ total, blockers }) => (
              <CardLink to={`${base}/questions`}>
                {countLabel(total, "question")} ·{" "}
                {countLabel(blockers, "blocker")}
              </CardLink>
            )}
          />
          <Stat
            value={stats.rules}
            render={(rules) => (
              <CardLink to={`${base}/rules`}>
                {countLabel(rules, "rule")}
              </CardLink>
            )}
          />
          <Stat
            value={stats.icp}
            render={(icp) => (
              <CardLink to={`${base}/icp`}>
                {icp ? icpSummary(icp) : copy.card.icpMissing}
              </CardLink>
            )}
          />
          <Stat
            value={stats.scoringVersion}
            render={(version) => (
              <CardLink to={`${base}/scoring`}>
                {version === null
                  ? copy.card.defaultScoring
                  : copy.card.scoringProfile(version)}
              </CardLink>
            )}
          />
        </div>
      ) : stats.questions.status === "ready" ? (
        <Link
          to={`${base}/questions?suggest=1`}
          onClick={stop}
          className="self-start text-[13px] font-semibold text-black underline underline-offset-2 hover:text-link-hover"
        >
          {copy.card.reviewSuggestions}
        </Link>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-subtle pt-2.5 text-[13px]">
        {!service.is_active && notScored ? (
          <span className="text-muted-foreground">{copy.card.notScored}</span>
        ) : (
          <>
            <span>
              <Stat
                value={stats.scored}
                skeletonWidth="w-6"
                render={(total) => (
                  <strong className="font-mono">{formatNumber(total)}</strong>
                )}
              />{" "}
              {copy.card.scored}
            </span>
            <span>
              <Stat
                value={stats.hot}
                skeletonWidth="w-6"
                render={(total) => (
                  <strong className="font-mono">{formatNumber(total)}</strong>
                )}
              />{" "}
              {copy.card.hot}
            </span>
            {preset ? (
              <span className="text-muted-foreground">
                {stats.edited
                  ? `${copy.card.fromPreset} · ${copy.card.edited}`
                  : copy.card.fromPreset}
              </span>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
