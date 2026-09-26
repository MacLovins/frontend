import { XIcon } from "@phosphor-icons/react"
import { cn } from "cn"
import { useState, type KeyboardEvent } from "react"

import { KeywordChip } from "@/features/settings/questions/components/keyword-chip"

/** Keyword chips with ✕ and an "+ {thing}" chip that turns into an input. Enter or comma adds; duplicates are ignored. */
export function ChipInput({
  values,
  onChange,
  addLabel,
  negative,
  readOnly,
}: {
  values: string[]
  onChange: (values: string[]) => void
  addLabel: string
  negative?: boolean
  readOnly?: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState("")

  const commit = () => {
    const items = draft
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
    const next = [...values]
    for (const item of items) {
      const known = next.some(
        (value) => value.toLowerCase() === item.toLowerCase()
      )
      if (!known) next.push(item)
    }
    if (next.length !== values.length) onChange(next)
    setDraft("")
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()
      commit()
    } else if (event.key === "Escape") {
      // Leave the chip input, not the whole sheet.
      event.stopPropagation()
      setDraft("")
      setAdding(false)
    } else if (event.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <>
      {values.map((value) => (
        <KeywordChip
          key={value}
          negative={negative}
          className={cn(!readOnly && "pr-1")}
        >
          {value}
          {readOnly ? null : (
            <button
              type="button"
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="ml-1 inline-flex size-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-subtle hover:text-black focus-visible:outline-2 focus-visible:outline-black"
            >
              <XIcon aria-hidden className="size-3" />
            </button>
          )}
        </KeywordChip>
      ))}
      {readOnly ? null : adding ? (
        <input
          autoFocus
          aria-label={`Add ${addLabel.toLowerCase()}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            commit()
            setAdding(false)
          }}
          className="h-[22px] w-36 rounded border border-input bg-white px-2 text-xs outline-none focus:border-black"
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-faint bg-white px-2 py-px text-xs hover:bg-muted focus-visible:outline-2 focus-visible:outline-black"
        >
          + {addLabel}
        </button>
      )}
    </>
  )
}
