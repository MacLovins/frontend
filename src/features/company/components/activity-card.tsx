import { format, parseISO } from "date-fns"

import type { ScoreHistoryPoint } from "@/api/generated/model"
import { Card } from "@/components/ui/card"

import { activityItems } from "../lib/score-explain"
import { formatDateShort } from "../lib/text"

/** Score changes only: the API has no company-scoped feed of votes, profile changes or CRM pushes. */
export function ActivityCard({ history }: { history: ScoreHistoryPoint[] }) {
  const items = activityItems(history)
  if (!items.length) return null
  return (
    <Card className="gap-2.5">
      <h2 className="m-0 text-base font-bold">Activity</h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13px] leading-[1.45]">
        {items.map((item) => (
          <li key={item.key}>
            <strong>{item.strong}</strong>
            {item.rest}
            {item.at ? (
              <div className="text-muted-foreground">
                {formatDateShort(item.at)} ·{" "}
                {format(parseISO(item.at), "HH:mm")}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  )
}
