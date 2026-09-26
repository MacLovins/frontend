import { type ReactNode, useId } from "react"
import { cn } from "cn"

/** Bordered white card with a 15 px title; the gap between rows differs per card. */
export function SettingsCard({
  title,
  className,
  children,
}: {
  title: string
  className?: string
  children: ReactNode
}) {
  const titleId = useId()
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card px-5 py-[18px]",
        className
      )}
    >
      <h2 id={titleId} className="m-0 text-[15px] leading-normal font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Shown under a control whose effect the client-side estimate cannot preview. */
export function NotPreviewedNote({ children }: { children: ReactNode }) {
  return <p className="m-0 text-xs text-warning-strong">{children}</p>
}
