import { Card } from "@/components/ui/card"
import { linkedinSearchUrl } from "@/lib/linkedin"

import { ExternalLink } from "./external-link"

/** Service roles as LinkedIn people searches; LeadRadar never calls LinkedIn itself. */
export function DecisionMakersCard({
  titles,
  companyName,
}: {
  titles: string[]
  companyName: string
}) {
  return (
    <Card>
      <h2 className="m-0 text-base font-bold">Decision makers to validate</h2>
      <p className="m-0 text-[13px] leading-[1.4] text-muted-foreground">
        Roles come from the service settings. Links open a LinkedIn search in a
        new tab; LeadRadar itself never contacts LinkedIn.
      </p>
      <div className="flex flex-col">
        {titles.map((title) => (
          <ExternalLink
            key={title}
            href={linkedinSearchUrl(title, companyName)}
            className="group flex h-11 items-center justify-between gap-3 border-b border-subtle text-sm no-underline last:border-b-0"
          >
            <span className="truncate group-hover:text-link-hover">
              {title}
            </span>
            <span className="shrink-0 text-[13px] text-muted-foreground group-hover:text-link-hover">
              Find on LinkedIn ↗
            </span>
          </ExternalLink>
        ))}
      </div>
    </Card>
  )
}
