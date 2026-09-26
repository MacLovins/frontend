import type { ReactNode } from "react"
import { cn } from "cn"

/** White 10 px card with an 18/700 title and a 13 px description (ICP editor cards). */
export function SettingsCard({
  title,
  description,
  className,
  children,
}: {
  title: string
  description: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card p-[22px]",
        className
      )}
    >
      <div>
        <h2 className="m-0 text-lg font-bold">{title}</h2>
        <p className="m-0 mt-1 text-[13px] text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </section>
  )
}
