import { useState } from "react"

import type { RunOut } from "@/api/generated/model"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import { copy } from "../copy"
import { useRunActions } from "../hooks/use-run-actions"

/** Header actions: "Cancel run" (with a confirmation) and the retry button labelled by what it retries. */
export function RunActions({
  run,
  reconnect,
}: {
  run: RunOut
  reconnect: () => void
}) {
  const actions = useRunActions(run, reconnect)
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogTrigger
          render={<Button variant="outline" disabled={!actions.canCancel} />}
        >
          {copy.cancel.action}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.cancel.title}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription className="px-6 py-5 text-sm text-text-secondary">
            {copy.cancel.body}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel.keep}</AlertDialogCancel>
            <AlertDialogAction
              variant="black"
              disabled={actions.isCancelling}
              onClick={() =>
                actions.cancel({ onSettled: () => setConfirming(false) })
              }
            >
              {copy.cancel.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        variant="black"
        disabled={!actions.canRetry || actions.isRetrying}
        onClick={actions.retry}
      >
        {actions.canRetry ? actions.retryLabel : copy.retry.paused}
      </Button>
    </>
  )
}
