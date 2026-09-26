import type { ReactNode } from "react"
import { XIcon } from "@phosphor-icons/react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { DialogClose, DialogTitle } from "@/components/ui/dialog"
import { copy } from "@/features/accounts/copy"

/** 64 px dialog header: title and the 40 px outlined close button. */
export function DialogBar({
  title,
  closeDisabled,
}: {
  title: string
  closeDisabled?: boolean
}) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-4 border-b border-border px-6">
      <DialogTitle>{title}</DialogTitle>
      <DialogClose
        disabled={closeDisabled}
        render={
          <Button
            variant="outline"
            size="icon"
            className="ml-auto"
            aria-label={copy.close}
          />
        }
      >
        <XIcon />
      </DialogClose>
    </div>
  )
}

export function DialogBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-5",
        className
      )}
    >
      {children}
    </div>
  )
}

/** Red box for a request that failed as a whole (inline, above the footer). */
export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-md bg-negative-surface p-3 text-[13px] leading-[1.4] text-negative-strong"
    >
      {children}
    </div>
  )
}
