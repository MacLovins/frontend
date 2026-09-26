import { Link } from "react-router"

import type { Reason } from "@/api/generated/model"
import { Card } from "@/components/ui/card"
import { formatDate } from "@/lib/format"

import { sourceLabel } from "../lib/copy"
import { ExternalLink } from "./external-link"
import { PolarityMark } from "./polarity-mark"

function ReasonRow({ reason }: { reason: Reason }) {
  const meta = [
    reason.source_name ? sourceLabel(reason.source_name, reason.url) : null,
    reason.date ? formatDate(reason.date) : null,
  ].filter(Boolean)
  return (
    <div className="flex items-start gap-3">
      <PolarityMark kind={reason.polarity} />
      <div className="flex-1 text-[15px] leading-[1.4]">
        {reason.polarity === "negative"
          ? `Blocker: ${reason.text}`
          : reason.text}
        {meta.length || reason.url ? (
          <div className="mt-0.5 text-[13px] text-muted-foreground">
            {meta.join(" · ")}
            {meta.length && reason.url ? " · " : null}
            {reason.url ? (
              <ExternalLink
                href={reason.url}
                className="text-foreground underline"
              >
                open source ↗
              </ExternalLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

/** The engine's "why now" lines in API order: buying signals, one blocker, then ICP and missing-data notes. */
export function WhyNowCard({
  reasons,
  sourcesHref,
}: {
  reasons: Reason[]
  sourcesHref: string
}) {
  return (
    <Card className="gap-3.5">
      <h2 className="m-0 text-lg font-bold">Why now</h2>
      {reasons.length ? (
        reasons.map((reason, index) => (
          <ReasonRow
            key={`${reason.signal_id ?? reason.text}-${index}`}
            reason={reason}
          />
        ))
      ) : (
        <p className="m-0 text-[13px] text-muted-foreground">
          No recent evidence yet. Re-analyze, or add a newsroom or careers page
          on the{" "}
          <Link to={sourcesHref} className="text-foreground underline">
            sources page
          </Link>
          .
        </p>
      )}
    </Card>
  )
}
