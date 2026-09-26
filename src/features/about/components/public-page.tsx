import { cn } from "cn"
import type { ReactNode } from "react"

/** The white, shell-less frame of the public About pages: top bar, then the page content, at the mock's 1440 px. */
export function PublicPage({
  title,
  topBar,
  className,
  children,
}: {
  title: string
  topBar: ReactNode
  /** Vertical rhythm between sections (the mocks use 48 and 40 px). */
  className: string
  children: ReactNode
}) {
  return (
    <div className="min-h-svh bg-background font-sans text-black">
      <title>{title}</title>
      <div
        className={cn(
          "mx-auto flex max-w-[1440px] flex-col px-4 py-10 sm:px-8 lg:px-[72px] lg:py-16",
          className
        )}
      >
        {topBar}
        <main className={cn("flex flex-col", className)}>{children}</main>
      </div>
    </div>
  )
}
