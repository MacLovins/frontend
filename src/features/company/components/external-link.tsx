import type { ComponentProps } from "react"

/** A link that opens in a new tab and says so to screen readers. */
export function ExternalLink({
  children,
  ...props
}: Omit<ComponentProps<"a">, "target" | "rel">) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}
