import { ChartBarIcon } from "@phosphor-icons/react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useMe } from "@/hooks/use-session"

import type { Analysis } from "./company-header"
import { IconEmptyState } from "./icon-empty-state"

const icon = (
  <ChartBarIcon className="size-8 text-muted-foreground" aria-hidden="true" />
)

/** Replaces the whole left column when the company has no score for the service. */
export function NotScoredCard({
  serviceName,
  analysis,
}: {
  serviceName: string
  analysis: Analysis
}) {
  return (
    <Card className="p-0">
      <IconEmptyState
        icon={icon}
        title={`Not analyzed for ${serviceName} yet`}
        actions={
          <Button onClick={analysis.start} disabled={analysis.busy}>
            {analysis.busy ? analysis.label : "Analyze now"}
          </Button>
        }
      >
        LeadRadar hasn't scored this company for this service. Run an analysis
        to collect sources and score it.
      </IconEmptyState>
    </Card>
  )
}

/** The organisation has no service at all, so nothing can be scored. */
export function NoServiceCard() {
  const { data: me } = useMe()
  return (
    <Card className="p-0">
      <IconEmptyState
        icon={icon}
        title="No active service"
        actions={
          me?.role === "admin" ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to="/settings/services" />}
            >
              Open services
            </Button>
          ) : undefined
        }
      >
        An admin needs to set up a service before companies can be scored.
      </IconEmptyState>
    </Card>
  )
}
