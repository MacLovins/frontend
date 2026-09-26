import type { ReactNode } from "react"
import { cn } from "cn"

/** The 72 px white bar at the top of every app page: H1, optional subtitle or tabs, actions on the right. */
export function PageHeader({
  title,
  subtitle,
  children,
  actions,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  /** Controls placed right after the title, e.g. service tabs. */
  children?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        "flex min-h-[72px] shrink-0 flex-wrap items-center gap-4 border-b border-border bg-card py-3 pr-20 pl-8",
        className,
      )}
    >
      <h1 className="m-0 text-2xl font-bold tracking-[-0.01em]">{title}</h1>
      {subtitle ? <span className="text-sm text-muted-foreground">{subtitle}</span> : null}
      {children}
      {actions ? <div className="ml-auto flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  )
}
