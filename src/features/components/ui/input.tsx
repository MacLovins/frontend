import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"
import type { ComponentProps } from "react"

function Input({ className, ...props }: ComponentProps<typeof InputPrimitive>) {
  return (
    <InputPrimitive
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
