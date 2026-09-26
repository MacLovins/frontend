import { useCallback, useRef, useState } from "react"

import type { SignalQuestionOut } from "@/api/generated/model"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ConfirmDialog } from "@/features/settings/questions/components/confirm-dialog"
import { QuestionEditor } from "@/features/settings/questions/components/question-editor"
import { copy } from "@/features/settings/questions/copy"

/** Right sheet for `?q=new` / `?q=<id>`. Closing with unsaved edits asks first. */
export function QuestionSheet({
  open,
  question,
  onClose,
}: {
  open: boolean
  question?: SignalQuestionOut
  onClose: () => void
}) {
  const dirty = useRef(false)
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  // Keep showing the last question while the sheet animates out after the URL param is gone.
  const [shown, setShown] = useState(question)
  if (open && shown !== question) setShown(question)
  // The URL can close the sheet under an open "Discard changes?" (sidebar link); do not reopen with it.
  if (!open && confirmDiscard) setConfirmDiscard(false)

  const setDirty = useCallback((value: boolean) => {
    dirty.current = value
  }, [])
  const requestClose = () => {
    if (dirty.current) setConfirmDiscard(true)
    else onClose()
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) requestClose()
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {shown ? copy.editQuestion : copy.newQuestion}
          </SheetTitle>
        </SheetHeader>
        <QuestionEditor
          key={shown?.id ?? "new"}
          question={shown}
          onDirtyChange={setDirty}
          onCancel={requestClose}
          onClose={onClose}
        />
        {/* Inside the sheet so it is a nested dialog: the sheet keeps its focus trap and stays open under it. */}
        <ConfirmDialog
          open={confirmDiscard}
          onOpenChange={setConfirmDiscard}
          title={copy.confirm.discardTitle}
          confirmLabel={copy.confirm.discardAction}
          tone="black"
          onConfirm={() => {
            setConfirmDiscard(false)
            dirty.current = false
            onClose()
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
