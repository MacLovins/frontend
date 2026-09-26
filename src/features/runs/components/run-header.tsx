import type { ReactNode } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { copy } from "../copy"

/** 72 px page bar with the "Runs /" breadcrumb; there is no runs list page, so the crumb is plain text. */
export function RunHeader({
  title,
  subtitle,
  status,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  status?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex h-[72px] shrink-0 items-center gap-4 border-b border-border bg-card pr-20 pl-8">
      <Breadcrumb className="shrink-0">
        <BreadcrumbList>
          <BreadcrumbItem>{copy.runs}</BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="m-0 shrink-0 text-2xl font-bold tracking-[-0.01em]">
        {title}
      </h1>
      {subtitle ? (
        <span className="min-w-0 truncate text-sm text-muted-foreground">
          {subtitle}
        </span>
      ) : null}
      {status}
      {actions ? (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
