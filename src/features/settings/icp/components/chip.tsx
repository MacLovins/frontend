import type { ComponentProps } from "react"
import { cn } from "cn"

const variants = {
  selected: "border-transparent bg-black text-white hover:bg-[#262626]",
  outline:
    "border-input bg-white hover:bg-muted disabled:cursor-not-allowed disabled:border-subtle disabled:text-faint disabled:hover:bg-white",
  dashed: "border-dashed border-faint bg-white hover:bg-muted",
}

/** 13 px chip button: selected market "{name} ✓", region shortcut "+ DACH", add "+ country". */
export function Chip({
  variant,
  className,
  ...props
}: ComponentProps<"button"> & { variant: keyof typeof variants }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-1.5 text-[13px] leading-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

/** 12 px grey value chip (criterion values, chosen industries). */
export function ValueChip({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs",
        className
      )}
      {...props}
    />
  )
}
