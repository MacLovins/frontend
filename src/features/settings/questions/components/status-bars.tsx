import { CheckIcon } from "@phosphor-icons/react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

/** Yellow "re-analysis needed" notice with one dark action. */
export function ChangeBanner({
  title,
  body,
  action,
  pending,
  onAction,
}: {
  title: string
  body: string
  action: string
  pending: boolean
  onAction: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-warning-border bg-warning-surface px-4 py-3 text-sm">
      <span className="font-bold">{title}</span>
      <span>{body}</span>
      <Button
        variant="black"
        size="sm"
        className="ml-auto"
        disabled={pending}
        onClick={onAction}
      >
        {pending ? <Spinner /> : null}
        {action}
      </Button>
    </div>
  )
}

/** Black confirmation bar that stays until the next change (not a toast: it belongs to the table). */
export function InlineStatus({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2.5 rounded-md bg-black px-4 py-2.5 text-sm text-white"
    >
      <CheckIcon weight="bold" aria-hidden className="size-4 text-success" />
      <span>{children}</span>
    </div>
  )
}
