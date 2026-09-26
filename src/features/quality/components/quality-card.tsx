import type { ReactNode } from "react"
import { cn } from "cn"

import { errorMessage } from "@/api/mutator"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

import { qualityCopy } from "../copy"

/** White bordered card with a 15 px title; `emphasis` is the 2 px black frame of the review card. */
export function QualityCard({
  title,
  titleHint,
  meta,
  emphasis = false,
  className,
  children,
}: {
  title: string
  /** Native tooltip on the title, e.g. "All services" on the org-wide usage card. */
  titleHint?: string
  meta?: ReactNode
  emphasis?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      aria-label={title}
      className={cn(
        "flex flex-col gap-2.5 rounded-lg bg-card px-5 py-[18px]",
        emphasis ? "gap-3 border-2 border-foreground" : "border border-border",
        className
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[15px] font-bold" title={titleHint}>
          {title}
        </h2>
        {meta ? (
          <span className="text-right text-xs text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/** Inline error for one card, so a failing endpoint never blanks the page. */
export function CardError({
  title,
  error,
  onRetry,
}: {
  title: string
  error: unknown
  onRetry: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md bg-negative-surface p-3.5"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-negative-strong">
          {title}
        </div>
        <div className="text-xs text-negative-strong">
          {errorMessage(error)}
        </div>
      </div>
      <Button variant="outline" size="xs" onClick={onRetry}>
        {qualityCopy.tryAgain}
      </Button>
    </div>
  )
}

export function SkeletonRows({
  count,
  className,
}: {
  count: number
  className: string
}) {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} className={className} />
      ))}
    </div>
  )
}

export function CardNote({ children }: { children: ReactNode }) {
  return <p className="m-0 text-[13px] text-muted-foreground">{children}</p>
}
