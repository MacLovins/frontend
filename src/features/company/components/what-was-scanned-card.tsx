import { Link } from "react-router"

import type { LeadDetail, SourceType } from "@/api/generated/model"
import { Card } from "@/components/ui/card"
import { useLabels } from "@/hooks/use-labels"

import { sourceTypePlural } from "../lib/copy"

/** Documents collected per source type, most first. */
export function WhatWasScannedCard({
  summary,
  sourcesHref,
}: {
  summary: LeadDetail["sources_summary"]
  sourcesHref: string
}) {
  const label = useLabels()
  const rows = Object.entries(summary)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
  const name = (type: string) =>
    type in sourceTypePlural
      ? sourceTypePlural[type as SourceType]
      : label("source_types", type)

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="m-0 text-base font-bold">What was scanned</h2>
        <Link
          to={sourcesHref}
          className="text-[13px] text-foreground underline"
        >
          All sources
        </Link>
      </div>
      {rows.length ? (
        <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-y-2 text-sm">
          {rows.map(([type, count]) => (
            <div key={type} className="contents">
              <span>{name(type)}</span>
              <span className="text-right font-mono">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="m-0 text-[13px] text-muted-foreground">
          Nothing collected yet.
        </p>
      )}
    </Card>
  )
}
