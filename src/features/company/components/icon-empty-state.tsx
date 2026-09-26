import type { ComponentProps, ReactNode } from "react"
import { cn } from "cn"

import { EmptyState } from "@/components/common/states"

/** The shared EmptyState with the design's 32 px icon above the title. */
export function IconEmptyState({
  icon,
  className,
  ...props
}: ComponentProps<typeof EmptyState> & { icon: ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center pt-10", className)}>
      {icon}
      <EmptyState {...props} className="pt-2 pb-10" />
    </div>
  )
}
