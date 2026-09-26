import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"

function copyToClipboard(text: string) {
  // `navigator.clipboard` is missing outside secure contexts; the promise turns that into a rejection too.
  Promise.resolve()
    .then(() => navigator.clipboard.writeText(text))
    .then(
      () => toast.success("Draft copied"),
      () => toast.error("Couldn't copy. Select the text and copy it manually.")
    )
}

export function DraftFooter({
  busy,
  stale,
  confirmDiscard,
  onRegenerate,
  copyText,
}: {
  busy: boolean
  stale: boolean
  confirmDiscard: boolean
  onRegenerate: () => void
  /** null until a draft is ready. */
  copyText: string | null
}) {
  return (
    <div className="mt-auto flex gap-2 border-t border-border px-6 py-4">
      <RegenerateButton
        busy={busy}
        stale={stale}
        confirmDiscard={confirmDiscard}
        onRegenerate={onRegenerate}
      />
      <Button
        className="ml-auto px-[18px]"
        disabled={copyText === null}
        onClick={() => copyText !== null && copyToClipboard(copyText)}
      >
        Copy draft
      </Button>
    </div>
  )
}

function RegenerateButton({
  busy,
  stale,
  confirmDiscard,
  onRegenerate,
}: {
  busy: boolean
  stale: boolean
  confirmDiscard: boolean
  onRegenerate: () => void
}) {
  const [open, setOpen] = useState(false)
  const variant = stale ? "default" : "outline"

  if (busy) {
    return (
      <Button variant={variant} disabled>
        <Spinner />
        Regenerating…
      </Button>
    )
  }

  if (!confirmDiscard) {
    return (
      <Button variant={variant} onClick={onRegenerate}>
        Regenerate
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant={variant} />}>
        Regenerate
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-auto gap-3 p-3">
        <PopoverDescription className="text-sm text-black">
          Discard your edits and write a new draft?
        </PopoverDescription>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setOpen(false)
              onRegenerate()
            }}
          >
            Regenerate
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
