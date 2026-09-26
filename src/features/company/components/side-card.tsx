import type { ReactNode } from "react"
import { cn } from "cn"

/** Sources side panel card: 15 px title, tighter padding than the Company cards. */
export function SideCard({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border border-border bg-card px-5 py-[18px]",
        className
      )}
    >
      <h2 className="m-0 text-[15px] font-bold">{title}</h2>
      {children}
    </section>
  )
}
