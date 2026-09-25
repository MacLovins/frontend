import { cn } from "cn"
import type { ComponentProps } from "react"

function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  )
}

export { Label }
