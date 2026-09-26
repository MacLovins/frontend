import { type RefObject } from "react"
import { useBlocker } from "react-router"

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

import { copy } from "@/features/settings/services/copy"

/**
 * Blocks in-app navigation (including a switch of `?service=`) while the form is dirty.
 * `bypass` lets a successful create move to the new service without asking.
 */
export function UnsavedChangesGuard({
  dirty,
  bypass,
}: {
  dirty: boolean
  bypass: RefObject<boolean>
}) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !bypass.current &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search)
  )
  const open = blocker.state === "blocked"

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => !next && blocker.reset?.()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.discard.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.discard.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{copy.discard.keep}</AlertDialogCancel>
          <Button variant="black" onClick={() => blocker.proceed?.()}>
            {copy.discard.discard}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
