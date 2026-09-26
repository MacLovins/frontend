import type { Blocker } from "react-router"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

/** Confirms leaving a dirty form; shown while `useDiscardGuard` holds a navigation. */
export function DiscardDialog({
  blocker,
  title,
  body,
  keepLabel,
  discardLabel,
}: {
  blocker: Blocker
  title: string
  body: string
  keepLabel: string
  discardLabel: string
}) {
  return (
    <AlertDialog
      open={blocker.state === "blocked"}
      onOpenChange={(open) => !open && blocker.reset?.()}
    >
      <AlertDialogContent className="data-[size=default]:max-w-[min(420px,calc(100%-2rem))]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-text-secondary">
            {body}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{keepLabel}</AlertDialogCancel>
          <Button variant="black" onClick={() => blocker.proceed?.()}>
            {discardLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
