import { Link } from "react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { withService } from "@/hooks/use-current-service"

export function OutreachHeader({
  companyId,
  serviceId,
  companyName,
  serviceName,
  loading,
}: {
  companyId: string
  serviceId: string | undefined
  companyName: string | undefined
  serviceName: string | undefined
  loading: boolean
}) {
  const companyPath = withService(`/companies/${companyId}`, serviceId)

  return (
    <header className="flex min-h-[72px] shrink-0 flex-wrap items-center gap-4 border-b border-border bg-card py-3 pr-20 pl-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link to={withService("/prospects", serviceId)} />}
            >
              Prospects
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {companyName || loading ? (
            <>
              <BreadcrumbItem>
                {companyName ? (
                  <BreadcrumbLink
                    className="max-w-60 truncate"
                    render={<Link to={companyPath} />}
                  >
                    {companyName}
                  </BreadcrumbLink>
                ) : (
                  <Skeleton className="h-4 w-24" />
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="m-0 text-2xl font-bold tracking-[-0.01em]">
        Outreach draft
      </h1>
      {serviceName ? (
        <span className="rounded bg-muted px-2 py-[3px] text-[13px] text-text-secondary">
          {serviceName}
        </span>
      ) : null}
      <Button
        variant="outline"
        className="ml-auto"
        nativeButton={false}
        render={<Link to={companyPath} />}
      >
        Close
      </Button>
    </header>
  )
}
