import { Link } from "react-router"
import { cn } from "cn"

import { useListCompanies } from "@/api/generated/accounts/accounts"
import { useGetUsage } from "@/api/generated/meta/meta"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { withService } from "@/hooks/use-current-service"
import { formatNumber } from "@/lib/format"

import { useRecentRuns } from "../hooks/use-recent-runs"
import { formatClock } from "../lib/format"

function KeyValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-[13px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="m-0 font-mono">{value}</dd>
    </div>
  )
}

// The refresh schedule and per-run document/AI-call counts are not exposed by the API, so the card states only
// what it can: tracked accounts, the last monitoring run and today's usage.
export function MonitoringCard({
  now,
  serviceId,
}: {
  now: number
  serviceId: string | undefined
}) {
  const tracked = useListCompanies(
    { is_tracked: true, page_size: 1 },
    { query: { staleTime: 60_000 } }
  )
  const usage = useGetUsage({ query: { refetchInterval: 60_000 } })
  const runs = useRecentRuns()
  // A failed background refetch keeps the last good numbers; the error shows only when nothing is loaded yet.
  const failed = [tracked, usage, runs].filter(
    (query) => query.isError && !query.data
  )

  const lastCheck = runs.data?.find((run) => run.kind === "refresh")

  return (
    <section
      aria-labelledby="monitoring-title"
      className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5"
    >
      <h2 id="monitoring-title" className="m-0 text-base font-bold">
        Monitoring
      </h2>
      {!tracked.data || !usage.data || !runs.data ? (
        failed.length > 0 ? (
          <div className="flex flex-col items-start gap-2 text-[13px] text-muted-foreground">
            Could not load the monitoring status.
            <Button
              variant="link"
              className="text-[13px]"
              onClick={() => failed.forEach((query) => void query.refetch())}
            >
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2" aria-hidden>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        )
      ) : (
        <>
          <p className="m-0 text-[13px] leading-normal text-text-secondary">
            {formatNumber(tracked.data.total)} tracked{" "}
            {tracked.data.total === 1 ? "account is" : "accounts are"}{" "}
            re-checked automatically. Only new text is sent to AI.
          </p>
          <dl className="m-0 flex flex-col gap-2">
            <KeyValueRow
              label="Last check"
              value={
                lastCheck
                  ? formatClock(
                      lastCheck.finished_at ?? lastCheck.created_at,
                      now
                    )
                  : "Never"
              }
            />
            <KeyValueRow
              label="AI calls today"
              value={formatNumber(usage.data.llm_calls_24h)}
            />
            <KeyValueRow
              label="Documents scanned today"
              value={formatNumber(usage.data.documents_scanned_24h)}
            />
          </dl>
          {lastCheck ? (
            <Link
              to={withService(`/runs/${lastCheck.id}`, serviceId)}
              className={cn(
                buttonVariants({ variant: "link" }),
                "self-start text-[13px]"
              )}
            >
              See the last run
            </Link>
          ) : null}
        </>
      )}
    </section>
  )
}
