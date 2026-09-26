import { ArrowSquareOutIcon, type Icon } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { Link } from "react-router"
import { cn } from "cn"

import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const iconTones = {
  primary: "bg-primary text-black",
  positive: "bg-positive-surface text-positive-strong",
  negative: "bg-negative-surface text-negative-strong",
  neutral: "bg-subtle text-black",
} as const

export type EventTone = keyof typeof iconTones

export function EventIcon({
  icon: Glyph,
  tone,
}: {
  icon: Icon
  tone: EventTone
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md",
        iconTones[tone]
      )}
    >
      <Glyph size={16} weight="bold" aria-hidden />
    </span>
  )
}

/** One card of the Today feed: icon, "kind · service · when", the sentence, optional evidence and actions. */
export function FeedItem({
  icon,
  kind,
  service,
  when,
  createdAt,
  children,
  evidence,
  actions,
}: {
  icon: ReactNode
  kind: string
  service?: string
  when: string
  createdAt: string
  children: ReactNode
  evidence?: ReactNode
  actions: ReactNode
}) {
  return (
    <article className="flex items-start gap-3.5 rounded-lg border border-border bg-card px-[18px] py-4">
      {icon}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="font-semibold text-black">{kind}</span>
          {service ? <span>· {service}</span> : null}
          <span>
            · <time dateTime={createdAt}>{when}</time>
          </span>
        </div>
        <p className="m-0 text-[15px] leading-[1.4] break-words">{children}</p>
        {evidence}
      </div>
      <div className="flex shrink-0 gap-1.5">{actions}</div>
    </article>
  )
}

export function CompanyName({ name, to }: { name: string; to: string }) {
  return (
    <strong>
      <Link to={to} className="text-inherit no-underline hover:text-link-hover">
        {name}
      </Link>
    </strong>
  )
}

/**
 * Evidence under a feed item. `quote` is original text (italic, in quotes); `reason` is a summary written by the
 * scorer, so it is neither italic nor quoted.
 */
export function EvidenceQuote({
  text,
  source,
  url,
  variant = "quote",
}: {
  text: string
  source: string | null
  url: string | null
  variant?: "quote" | "reason"
}) {
  return (
    <div
      className={cn(
        "border-l-2 border-border pl-2.5 text-[13px] leading-[1.45] break-words text-text-secondary",
        variant === "quote" && "italic"
      )}
    >
      {variant === "quote" ? `“${text}”` : text}
      {source ? (
        <>
          {" "}
          <span className="text-muted-foreground not-italic">
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-inherit no-underline hover:text-link-hover"
              >
                {source}
                <ArrowSquareOutIcon size={12} aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              source
            )}
          </span>
        </>
      ) : null}
    </div>
  )
}

export function FeedItemSkeleton() {
  return (
    <div
      className="flex items-start gap-3.5 rounded-lg border border-border bg-card px-[18px] py-4"
      aria-hidden
    >
      <Skeleton className="size-8 shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col gap-2 pt-0.5">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-[34px] w-16 shrink-0" />
    </div>
  )
}

// Buttons that navigate are real links styled as buttons (Base UI's Button would give them role="button").
export function ActionLink({
  to,
  label,
  children,
  primary,
}: {
  to: string
  label?: string
  children: string
  primary?: boolean
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={buttonVariants({
        variant: primary ? "default" : "outline",
        size: "sm",
      })}
    >
      {children}
    </Link>
  )
}
