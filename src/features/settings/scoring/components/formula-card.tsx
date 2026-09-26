import { format, parseISO } from "date-fns"

import type { ScoringParams } from "@/api/generated/model"
import { copy } from "@/features/settings/scoring/copy"
import { formatParam } from "@/features/settings/scoring/lib/params"

/**
 * The current version with its save date, then the two before it by number only: profiles have no author or note
 * and there is no history endpoint (CONFIG-API D31), but versions are max+1 from v1 so they exist.
 */
function VersionRow({
  version,
  createdAt,
}: {
  version: number
  createdAt: string
}) {
  const older = Array.from(
    { length: Math.min(2, version - 1) },
    (_, index) => version - 1 - index
  )
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-subtle pt-1.5 text-xs text-muted-foreground">
      <span>
        <strong className="text-foreground">v{version}</strong> ·{" "}
        {format(parseISO(createdAt), "d MMM")}
      </span>
      {older.map((number) => (
        <span key={number}>v{number}</span>
      ))}
    </div>
  )
}

export function FormulaCard({
  params,
  profile,
}: {
  params: ScoringParams
  profile: { version: number; created_at: string } | null
}) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-border bg-card px-5 py-4">
      <h2 className="m-0 text-sm font-bold">{copy.formula.title}</h2>
      <p className="m-0 font-mono text-[13px] leading-[1.6] text-text-secondary">
        {copy.formula.priority(
          formatParam(params.fit_exponent),
          formatParam(params.intent_exponent),
          formatParam(params.risk_penalty)
        )}
      </p>
      <p className="m-0 text-xs leading-normal text-muted-foreground">
        {copy.formula.signals(formatParam(params.tau_intent))}
      </p>
      {profile ? (
        <VersionRow version={profile.version} createdAt={profile.created_at} />
      ) : null}
    </section>
  )
}
