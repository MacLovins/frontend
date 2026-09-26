import { cn } from "cn"
import type { ReactNode } from "react"

/** White 12 px term chip inside the grey keywords panel; "Not" terms are struck through. */
export function KeywordChip({
  negative,
  className,
  children,
}: {
  negative?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded bg-white px-2 py-0.5 text-xs",
        negative && "line-through",
        className
      )}
    >
      {children}
    </span>
  )
}
