import type { ReactNode } from "react"
import { cn } from "cn"

import { errorMessage } from "@/api/mutator"
import { Button } from "@/components/ui/button"

type StateProps = { className?: string }

export function EmptyState({
  title,
  children,
  actions,
  className,
}: StateProps & { title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-16 text-center", className)}>
      <div className="text-base font-bold">{title}</div>
      {children ? <div className="max-w-[420px] text-sm leading-[1.45] text-muted-foreground">{children}</div> : null}
      {actions ? <div className="mt-1 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = "Something went wrong",
  error,
  onRetry,
  className,
}: StateProps & { title?: string; error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 px-6 py-16 text-center", className)}>
      <div className="text-base font-bold">{title}</div>
      <div className="max-w-[420px] text-sm leading-[1.45] text-muted-foreground">{errorMessage(error)}</div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
