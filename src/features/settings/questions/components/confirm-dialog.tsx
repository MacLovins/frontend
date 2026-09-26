import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { copy } from "@/features/settings/questions/copy"

/** 420 px confirm: [Cancel] [dark or destructive action]. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone,
  pending,
  onConfirm,
  onOpenChange,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  tone: "black" | "destructive"
  pending?: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="data-[size=default]:max-w-[min(420px,calc(100%-2rem))]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="text-sm text-text-secondary">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{copy.confirm.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant={tone}
            disabled={pending}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
