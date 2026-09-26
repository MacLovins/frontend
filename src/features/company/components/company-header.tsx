import { CircleNotchIcon } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { Link } from "react-router"

import type { LeadDetail } from "@/api/generated/model"
import { CompanyLogo } from "@/components/common/company-logo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { withService } from "@/hooks/use-current-service"

import type { ServiceTab } from "../hooks/use-service-tabs"
import { sumOfSources } from "../lib/lead-card"
import { CompanyCrumbs } from "./company-crumbs"
import { ExternalLink } from "./external-link"
import { MetaChips } from "./meta-chips"
import { ServiceTabs } from "./service-tabs"

export type Analysis = { busy: boolean; label: string; start: () => void }

function HeaderFrame({ children }: { children: ReactNode }) {
  return (
    <header className="flex shrink-0 flex-col gap-4 border-b border-border bg-card pt-5 pr-20 pl-8">
      {children}
    </header>
  )
}

function DraftOutreach({ href, enabled }: { href: string; enabled: boolean }) {
  if (enabled) {
    return (
      <Button nativeButton={false} render={<Link to={href} />}>
        Draft outreach
      </Button>
    )
  }
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span tabIndex={0} className="inline-flex rounded-md" />}
      >
        <Button disabled>Draft outreach</Button>
      </TooltipTrigger>
      <TooltipContent>Analyze the company first</TooltipContent>
    </Tooltip>
  )
}

export function CompanyHeader({
  detail,
  serviceId,
  tabs,
  scored,
  analysis,
}: {
  detail: LeadDetail
  serviceId: string | undefined
  tabs: ServiceTab[]
  scored: boolean
  analysis: Analysis
}) {
  const { company } = detail
  return (
    <HeaderFrame>
      <CompanyCrumbs serviceId={serviceId} trail={[{ label: company.name }]} />
      <div className="flex items-start gap-4">
        <CompanyLogo name={company.name} domain={company.domain} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="m-0 text-[28px] leading-[normal] font-bold tracking-[-0.01em]">
              {company.name}
            </h1>
            <ExternalLink
              href={company.homepage_url ?? `https://${company.domain}`}
              className="text-sm text-muted-foreground hover:text-link-hover"
            >
              {company.domain} ↗
            </ExternalLink>
          </div>
          <MetaChips company={company} />
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            onClick={analysis.start}
            disabled={analysis.busy}
            aria-live="polite"
          >
            {analysis.busy ? (
              <CircleNotchIcon
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : null}
            {analysis.label}
          </Button>
          <DraftOutreach
            enabled={scored}
            href={withService(`/companies/${company.id}/outreach`, serviceId)}
          />
        </div>
      </div>
      <ServiceTabs
        companyId={company.id}
        serviceId={serviceId}
        tabs={tabs}
        sourcesCount={sumOfSources(detail.sources_summary)}
      />
    </HeaderFrame>
  )
}

export function CompanyHeaderSkeleton() {
  return (
    <HeaderFrame>
      <CompanyCrumbs serviceId={undefined} trail={[null]} />
      <div className="flex items-start gap-4">
        <Skeleton className="size-14 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-60" />
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-[22px] w-24" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <Skeleton className="h-11 w-56 rounded-none" />
        <Skeleton className="h-11 w-56 rounded-none" />
      </div>
    </HeaderFrame>
  )
}

/** The breadcrumb-only header shown above not-found and error states. */
export function CompanyHeaderFallback() {
  return (
    <HeaderFrame>
      <div className="pb-5">
        <CompanyCrumbs serviceId={undefined} trail={[{ label: "Company" }]} />
      </div>
    </HeaderFrame>
  )
}
