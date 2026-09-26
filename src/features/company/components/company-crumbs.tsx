import { Fragment } from "react"
import { Link } from "react-router"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { withService } from "@/hooks/use-current-service"

type Crumb = { label: string; to?: string }

/** "Prospects / DHL Group" (/ "Sources"); every link keeps the service. */
export function CompanyCrumbs({
  serviceId,
  trail,
}: {
  serviceId: string | undefined
  trail: (Crumb | null)[]
}) {
  const crumbs: (Crumb | null)[] = [
    { label: "Prospects", to: "/prospects" },
    ...trail,
  ]
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={index}>
            {index > 0 ? <BreadcrumbSeparator>/</BreadcrumbSeparator> : null}
            <BreadcrumbItem>
              {!crumb ? (
                <Skeleton className="h-4 w-24" />
              ) : crumb.to ? (
                <BreadcrumbLink
                  className="underline"
                  render={<Link to={withService(crumb.to, serviceId)} />}
                >
                  {crumb.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
