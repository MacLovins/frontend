import { Link } from "react-router"

import type { CompanyOut } from "@/api/generated/model"
import { Skeleton } from "@/components/ui/skeleton"
import { withService } from "@/hooks/use-current-service"

import { copy } from "../copy"
import type { CompanyView } from "../lib/company-state"
import { RunStatusPill } from "./run-status-pill"
import { StageStepper } from "./stage-stepper"

export function CompanyRunCard({
  companyId,
  company,
  isLoading,
  view,
  message,
  serviceId,
}: {
  companyId: string
  company: CompanyOut | undefined
  isLoading: boolean
  view: CompanyView
  message: string
  serviceId: string | undefined
}) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-card px-5 py-4">
      <div className="flex min-w-0 items-center gap-2.5">
        {company ? (
          <>
            <Link
              to={withService(`/companies/${companyId}`, serviceId)}
              className="truncate text-[15px] font-bold text-black underline-offset-4 hover:text-link-hover hover:underline"
            >
              {company.name}
            </Link>
            <span className="truncate text-xs text-muted-foreground">
              {company.domain}
            </span>
          </>
        ) : isLoading ? (
          <Skeleton className="h-5 w-48" />
        ) : (
          // Deleted after the run started (GET /companies/{id} → 404) or the lookup failed.
          <span className="truncate text-[15px] font-bold text-muted-foreground">
            {copy.companyUnavailable}
          </span>
        )}
        <RunStatusPill view={view} className="ml-auto" />
      </div>
      <StageStepper view={view} />
      {message ? (
        <p
          className="m-0 truncate text-[13px] text-text-secondary"
          title={message}
        >
          {message}
        </p>
      ) : null}
    </article>
  )
}
